import { IServiceOrderHistoryRepository } from '../domain/IServiceOrderHistoryRepository';
import { ServiceOrderHistoryEntity } from '../domain/ServiceOrderHistory';
import { IEmailService } from '../../../shared/mail/EmailService';
import { IServiceOrderRepository } from '../../service-order/domain/IServiceOrderRepository';
import { IUserRepository } from '../../user/domain/IUserRepository';
import { logger } from '../../../utils/logger';

export interface LogStatusChangeInput {
  idServiceOrder: number;
  userId: number;
  oldStatus?: string | null;
  newStatus: string;
}

export type ServiceOrderHistoryOutput = ReturnType<ServiceOrderHistoryEntity['toJSON']>;

export interface IServiceOrderHistoryService {
  logStatusChange(input: LogStatusChangeInput): Promise<ServiceOrderHistoryOutput>;
  listByServiceOrder(idServiceOrder: number): Promise<ServiceOrderHistoryOutput[]>;
}

export class ServiceOrderHistoryService implements IServiceOrderHistoryService {
  constructor(
    private readonly repo: IServiceOrderHistoryRepository,
    private readonly emailService?: IEmailService,
    private readonly serviceOrderRepo?: IServiceOrderRepository,
    private readonly userRepo?: IUserRepository
  ) {}

  async logStatusChange(input: LogStatusChangeInput): Promise<ServiceOrderHistoryOutput> {
    const entity = ServiceOrderHistoryEntity.create(input);
    const saved = await this.repo.log(entity);
    await this.sendStatusChangeEmail(saved, input);

    return saved.toJSON();
  }

  async listByServiceOrder(idServiceOrder: number): Promise<ServiceOrderHistoryOutput[]> {
    const items = await this.repo.listByServiceOrder(idServiceOrder);
    return items.map(i => i.toJSON());
  }

  private async sendStatusChangeEmail(
    history: ServiceOrderHistoryEntity,
    input: LogStatusChangeInput
  ) {
    logger.info({ service: 'ServiceOrderHistory', event: 'sendStatusChangeEmail', input });
    if (this.emailService && this.serviceOrderRepo && this.userRepo) {
      try {
        const serviceOrder = await this.serviceOrderRepo.findById(input.idServiceOrder);
        if (serviceOrder) {
          const customerId = serviceOrder.toJSON().customerId;
          const user = await this.userRepo.findById(customerId);
          logger.info({ service: 'ServiceOrderHistory', event: 'Customer user for email', customerId, user: user ? user.toJSON() : null });
          if (user) {
            const userJson: any = user.toJSON();
            const to = userJson.email;
            const subject = `Atualização da OS #${serviceOrder.toJSON().id}`;
            const html = `<p>Olá ${userJson.name},</p>
              <p>O status da sua Ordem de Serviço <strong>#${serviceOrder.toJSON().id}</strong> foi alterado.</p>
              <ul>
                <li>Status anterior: <strong>${input.oldStatus ?? 'N/A'}</strong></li>
                <li>Novo status: <strong>${input.newStatus}</strong></li>
              </ul>
              <p>Data da alteração: ${history.toJSON().changedAt.toLocaleString()}</p>
              <p>Esta é uma mensagem automática. Por favor, não responda.</p>`;
            await this.emailService.send({ to, subject, html, text: `Status alterado de ${input.oldStatus ?? 'N/A'} para ${input.newStatus}` });
          }
        }
      } catch (err) {
        logger.error({ service: 'ServiceOrderHistory', event: 'Failed to send status update email', error: err });
      }
    }
  }
}
