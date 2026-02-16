import { ServiceOrderEntity } from '../domain/ServiceOrder';
import { IServiceOrderRepository } from '../domain/IServiceOrderRepository';
import { AuthPayload } from '../../../modules/auth/AuthMiddleware';
import { IDiagnosisService } from '../../../modules/diagnosis/application/DiagnosisService';
import { BadRequestServerException, ForbiddenServerException, NotFoundServerException } from '../../../shared/application/ServerException';
import { ServiceOrderStatus } from '../../../shared/ServiceOrderStatus';
import { IServiceOrderHistoryService } from '../../../modules/service-order-history/application/ServiceOrderHistoryService';
import { SqsPublisher } from '../../../infra/messaging/SqsPublisher';
import { EventTypes } from '../../../shared/events/EventTypes';
import { logger } from '../../../utils/logger';

export type CreateServiceOrderInput = {
  description: string;
  vehicleId: number;
  budgetId?: number;
  currentStatus?: ServiceOrderStatus;
};

export type CreateServiceOrderOutput = ReturnType<ServiceOrderEntity['toJSON']>;

export type AcceptServiceOrderInput = {
  accept: boolean;
};

export interface IServiceOrderService {
  create(user: AuthPayload, input: CreateServiceOrderInput): Promise<CreateServiceOrderOutput>;
  findById(id: number, user?: AuthPayload): Promise<CreateServiceOrderOutput>;
  delete(id: number): Promise<void>;
  accept(mechanic: AuthPayload, id: number, input: AcceptServiceOrderInput): Promise<CreateServiceOrderOutput>;
  startRepair(mechanic: AuthPayload, id: number): Promise<CreateServiceOrderOutput>;
  finishRepair(mechanic: AuthPayload, id: number): Promise<CreateServiceOrderOutput>;
  delivered(mechanic: AuthPayload, id: number): Promise<CreateServiceOrderOutput>;
  update(id: number, partial: Partial<CreateServiceOrderInput>): Promise<CreateServiceOrderOutput | null>;
  decideBudget(customer: AuthPayload, id: number, input: AcceptServiceOrderInput): Promise<CreateServiceOrderOutput>;
  getExecutionTimeById(id: number): Promise<{ executionTimeMs: number }>;
  getAverageExecutionTime(): Promise<{ averageExecutionTimeMs: number }>;
}

export class ServiceOrderService implements IServiceOrderService {
  private sqsPublisher: SqsPublisher | null;

  constructor(
    private readonly repo: IServiceOrderRepository,
    private readonly diagnosisService: IDiagnosisService,
    private readonly historyService: IServiceOrderHistoryService,
    sqsPublisher?: SqsPublisher,
  ) {
    this.sqsPublisher = sqsPublisher || null;
  }

  private async publishEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
    if (this.sqsPublisher) {
      await this.sqsPublisher.publish({
        eventType,
        correlationId: String(payload.serviceOrderId || ''),
        payload,
      });
    }
  }

  async findById(id: number, user?: AuthPayload): Promise<CreateServiceOrderOutput> {
    const userId = user ? this.checkUserPermission(user) : undefined;
    const serviceOrder = await this.repo.findById(id, userId);
    if (!serviceOrder) {
      throw new NotFoundServerException('Service Order not found');
    }
    return serviceOrder.toJSON();
  }

  async update(id: number, partial: Partial<CreateServiceOrderInput>): Promise<CreateServiceOrderOutput | null> {
    const serviceOrder = await this.repo.update(id, partial);
    if (!serviceOrder) {
      throw new NotFoundServerException('Service Order not found for update');
    }
    return serviceOrder.toJSON();
  }

  async create(user: AuthPayload, input: CreateServiceOrderInput): Promise<CreateServiceOrderOutput> {
    return this.repo.transaction(async () => {
      const serviceOrderEntity = ServiceOrderEntity.create({
        description: input.description,
        budgetId: input.budgetId ?? null,
        customerId: user.sub,
        vehicleId: input.vehicleId,
      });

      const created = (await this.repo.create(serviceOrderEntity)).toJSON();

      await this.historyService.logStatusChange({
        idServiceOrder: created.id,
        userId: user.sub,
        oldStatus: null,
        newStatus: ServiceOrderStatus.RECEBIDA,
      });

      await this.publishEvent(EventTypes.OS_CREATED, {
        serviceOrderId: created.id,
        customerId: user.sub,
        vehicleId: input.vehicleId,
        description: input.description,
      });

      return created;
    });
  }

  async delete(id: number): Promise<void> {
    logger.info({ service: 'ServiceOrder', event: 'delete', id });
    await this.findById(id);
    await this.repo.softDelete(id);
  }

  async accept(mechanic: AuthPayload, id: number, input: AcceptServiceOrderInput): Promise<CreateServiceOrderOutput> {
    return this.repo.transaction(async () => {
      const order = await this.findById(id);

      if (order.mechanicId) {
        throw new BadRequestServerException('Essa OS já foi aceita ou recusada por outro mecânico.');
      }

      const oldStatus = order.currentStatus;

      if (input.accept) {
        const newStatus = order.budgetId
          ? ServiceOrderStatus.AGUARDANDO_INICIO
          : ServiceOrderStatus.EM_DIAGNOSTICO;

        await this.repo.update(id, {
          mechanicId: mechanic.sub,
          currentStatus: newStatus,
        } as any);

        await this.publishEvent(EventTypes.OS_ACCEPTED, {
          serviceOrderId: order.id,
          mechanicId: mechanic.sub,
          vehicleId: order.vehicleId,
          customerId: order.customerId,
        });
      } else {
        await this.repo.update(id, {
          mechanicId: mechanic.sub,
          currentStatus: ServiceOrderStatus.RECUSADA,
        } as any);
      }

      await this.historyService.logStatusChange({
        idServiceOrder: order.id,
        userId: mechanic.sub,
        oldStatus: oldStatus,
        newStatus: input.accept
          ? (order.budgetId ? ServiceOrderStatus.AGUARDANDO_INICIO : ServiceOrderStatus.EM_DIAGNOSTICO)
          : ServiceOrderStatus.RECUSADA,
      });

      return (await this.findById(id));
    });
  }

  async decideBudget(customer: AuthPayload, id: number, input: AcceptServiceOrderInput): Promise<CreateServiceOrderOutput> {
    return this.repo.transaction(async () => {
      const order = await this.findById(id);

      if (order.customerId !== customer.sub) {
        throw new ForbiddenServerException('Você não está autorizado a modificar essa OS.');
      }

      const oldStatus = order.currentStatus;
      const newStatus = input.accept ? ServiceOrderStatus.AGUARDANDO_INICIO : ServiceOrderStatus.RECUSADA;

      const updatedOrder = await this.update(order.id, { currentStatus: newStatus });
      if (!updatedOrder) {
        throw new NotFoundServerException('Erro ao atualizar status da OS');
      }

      if (input.accept) {
        await this.publishEvent(EventTypes.OS_BUDGET_APPROVED, {
          serviceOrderId: order.id,
          budgetId: order.budgetId,
          customerId: customer.sub,
        });
      } else {
        await this.publishEvent(EventTypes.OS_BUDGET_REJECTED, {
          serviceOrderId: order.id,
          budgetId: order.budgetId,
          customerId: customer.sub,
        });
      }

      await this.historyService.logStatusChange({
        idServiceOrder: updatedOrder.id,
        userId: customer.sub,
        oldStatus: oldStatus,
        newStatus: newStatus,
      });

      return updatedOrder;
    });
  }

  async startRepair(mechanic: AuthPayload, id: number): Promise<CreateServiceOrderOutput> {
    return this.repo.transaction(async () => {
      const order = await this.findById(id);

      if (!order.mechanicId || order.mechanicId !== mechanic.sub) {
        throw new ForbiddenServerException('Você não está autorizado a iniciar o reparo desta OS.');
      }

      if (order.currentStatus !== ServiceOrderStatus.AGUARDANDO_INICIO) {
        throw new BadRequestServerException('A OS precisa estar com status "Aguardando início" para começar o reparo.');
      }

      const oldStatus = order.currentStatus;

      const updatedOrder = await this.repo.update(id, {
        currentStatus: ServiceOrderStatus.EM_EXECUCAO,
      });

      if (!updatedOrder) {
        throw new NotFoundServerException('Algo deu errado ao iniciar o reparo.');
      }

      const updatedOrderJson = updatedOrder.toJSON();

      await this.historyService.logStatusChange({
        idServiceOrder: updatedOrderJson.id,
        userId: mechanic.sub,
        oldStatus: oldStatus,
        newStatus: updatedOrderJson.currentStatus,
      });

      return updatedOrderJson;
    });
  }

  async finishRepair(mechanic: AuthPayload, id: number): Promise<CreateServiceOrderOutput> {
    return this.repo.transaction(async () => {
      const order = await this.findById(id);

      if (!order.mechanicId || order.mechanicId !== mechanic.sub) {
        throw new ForbiddenServerException('Você não está autorizado a finalizar o reparo desta OS.');
      }

      if (order.currentStatus !== ServiceOrderStatus.EM_EXECUCAO) {
        throw new BadRequestServerException('A OS precisa estar com status "Em execução" para ser finalizada.');
      }

      const oldStatus = order.currentStatus;

      const updatedOrder = await this.repo.update(id, {
        currentStatus: ServiceOrderStatus.FINALIZADA,
      });

      if (!updatedOrder) {
        throw new NotFoundServerException('Algo deu errado ao finalizar o reparo.');
      }

      const updatedOrderJson = updatedOrder.toJSON();

      await this.historyService.logStatusChange({
        idServiceOrder: updatedOrderJson.id,
        userId: mechanic.sub,
        oldStatus: oldStatus,
        newStatus: updatedOrderJson.currentStatus,
      });

      return updatedOrderJson;
    });
  }

  async delivered(mechanic: AuthPayload, id: number): Promise<CreateServiceOrderOutput> {
    return this.repo.transaction(async () => {
      const order = await this.findById(id);

      if (!order.mechanicId || order.mechanicId !== mechanic.sub) {
        throw new ForbiddenServerException('Você não está autorizado a confirmar a entrega desta OS.');
      }

      if (!order.vehicleId) {
        throw new NotFoundServerException('Veículo não encontrado para esta OS.');
      }

      const oldStatus = order.currentStatus;

      const updatedOrder = await this.repo.update(id, {
        currentStatus: ServiceOrderStatus.ENTREGUE,
      });

      if (!updatedOrder) {
        throw new NotFoundServerException('Algo deu errado ao confirmar a entrega.');
      }

      const updatedOrderJson = updatedOrder.toJSON();

      await this.historyService.logStatusChange({
        idServiceOrder: updatedOrderJson.id,
        userId: mechanic.sub,
        oldStatus: oldStatus,
        newStatus: updatedOrderJson.currentStatus,
      });

      return updatedOrderJson;
    });
  }

  async getExecutionTimeById(id: number): Promise<{ executionTimeMs: number }> {
    const history = await this.historyService.listByServiceOrder(id);

    if (!history || history.length === 0) {
      throw new BadRequestServerException('Histórico da OS não encontrado.');
    }

    const received = history.find(h => h.newStatus === ServiceOrderStatus.RECEBIDA);
    const finished = history.find(h => h.newStatus === ServiceOrderStatus.FINALIZADA);

    if (!received || !finished) {
      throw new BadRequestServerException('Status RECEBIDA ou FINALIZADA não encontrados para esta OS.');
    }

    const receivedTime = new Date(received.changedAt).getTime();
    const finishedTime = new Date(finished.changedAt).getTime();

    if (finishedTime < receivedTime) {
      throw new BadRequestServerException('Status FINALIZADA ocorreu antes de RECEBIDA (dados inconsistentes).');
    }

    return { executionTimeMs: finishedTime - receivedTime };
  }

  async getAverageExecutionTime(): Promise<{ averageExecutionTimeMs: number }> {
    const serviceOrders = await this.repo.listFinishedOrDelivered();

    if (!serviceOrders || !serviceOrders.length) {
      throw new BadRequestServerException('Nenhuma OS ativa encontrada.');
    }

    const times: number[] = [];

    for (const order of serviceOrders) {
      const orderJson = order.toJSON();
      const timeResult = await this.getExecutionTimeById(orderJson.id);
      times.push(timeResult.executionTimeMs);
    }

    if (times.length === 0) {
      throw new BadRequestServerException('Nenhuma OS possui status RECEBIDA e FINALIZADA para cálculo.');
    }

    const sum = times.reduce((acc, cur) => acc + cur, 0);

    return { averageExecutionTimeMs: sum / times.length };
  }

  private checkUserPermission(user: AuthPayload): number | undefined {
    return user.type !== 'admin' ? user.sub : undefined;
  }
}
