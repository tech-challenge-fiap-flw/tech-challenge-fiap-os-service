import { SqsConsumer } from './SqsConsumer';
import { IdempotencyStore } from './IdempotencyStore';
import { EventTypes } from '../../shared/events/EventTypes';
import { ServiceOrderStatus } from '../../shared/ServiceOrderStatus';
import { logger } from '../../utils/logger';
import * as mysql from '../db/mysql';

const idempotencyStore = new IdempotencyStore();

async function updateServiceOrderStatus(serviceOrderId: number, newStatus: ServiceOrderStatus): Promise<void> {
  await mysql.update('UPDATE service_orders SET currentStatus = ? WHERE id = ?', [newStatus, serviceOrderId]);
}

async function assignBudgetToOrder(serviceOrderId: number, budgetId: number): Promise<void> {
  await mysql.update(
    'UPDATE service_orders SET budgetId = ?, currentStatus = ? WHERE id = ?',
    [budgetId, ServiceOrderStatus.AGUARDANDO_APROVACAO, serviceOrderId]
  );
}

export async function startConsumers(): Promise<void> {
  const billingQueueUrl = process.env.SQS_BILLING_EVENTS_QUEUE_URL;
  const executionQueueUrl = process.env.SQS_EXECUTION_EVENTS_QUEUE_URL;

  if (!billingQueueUrl && !executionQueueUrl) {
    logger.warn({ service: 'OsEventConsumer', event: 'No SQS queue URLs configured. Skipping consumer startup.' });
    return;
  }

  if (billingQueueUrl) {
    const billingConsumer = new SqsConsumer(billingQueueUrl);

    billingConsumer.on(EventTypes.BILLING_BUDGET_CREATED, async (event) => {
      if (await idempotencyStore.isProcessed(event.eventId)) return;
      const { serviceOrderId, budgetId } = event.payload;
      await assignBudgetToOrder(serviceOrderId, budgetId);
      await idempotencyStore.markProcessed(event.eventId);
      logger.info({ service: 'OsEventConsumer', event: 'budget_assigned', serviceOrderId, budgetId });
    });

    billingConsumer.on(EventTypes.BILLING_PAYMENT_CONFIRMED, async (event) => {
      if (await idempotencyStore.isProcessed(event.eventId)) return;
      const { serviceOrderId } = event.payload;
      await updateServiceOrderStatus(serviceOrderId, ServiceOrderStatus.AGUARDANDO_INICIO);
      await idempotencyStore.markProcessed(event.eventId);
      logger.info({ service: 'OsEventConsumer', event: 'payment_confirmed', serviceOrderId });
    });

    billingConsumer.on(EventTypes.BILLING_PAYMENT_FAILED, async (event) => {
      if (await idempotencyStore.isProcessed(event.eventId)) return;
      const { serviceOrderId } = event.payload;
      logger.warn({ service: 'OsEventConsumer', event: 'payment_failed', serviceOrderId });
      await idempotencyStore.markProcessed(event.eventId);
    });

    billingConsumer.start();
  }

  if (executionQueueUrl) {
    const executionConsumer = new SqsConsumer(executionQueueUrl);

    executionConsumer.on(EventTypes.EXECUTION_REPAIR_STARTED, async (event) => {
      if (await idempotencyStore.isProcessed(event.eventId)) return;
      const { serviceOrderId } = event.payload;
      await updateServiceOrderStatus(serviceOrderId, ServiceOrderStatus.EM_EXECUCAO);
      await idempotencyStore.markProcessed(event.eventId);
      logger.info({ service: 'OsEventConsumer', event: 'repair_started', serviceOrderId });
    });

    executionConsumer.on(EventTypes.EXECUTION_REPAIR_FINISHED, async (event) => {
      if (await idempotencyStore.isProcessed(event.eventId)) return;
      const { serviceOrderId } = event.payload;
      await updateServiceOrderStatus(serviceOrderId, ServiceOrderStatus.FINALIZADA);
      await idempotencyStore.markProcessed(event.eventId);
      logger.info({ service: 'OsEventConsumer', event: 'repair_finished', serviceOrderId });
    });

    executionConsumer.on(EventTypes.EXECUTION_DELIVERED, async (event) => {
      if (await idempotencyStore.isProcessed(event.eventId)) return;
      const { serviceOrderId } = event.payload;
      await updateServiceOrderStatus(serviceOrderId, ServiceOrderStatus.ENTREGUE);
      await idempotencyStore.markProcessed(event.eventId);
      logger.info({ service: 'OsEventConsumer', event: 'delivered', serviceOrderId });
    });

    executionConsumer.start();
  }

  logger.info({ service: 'OsEventConsumer', event: 'consumers_started' });
}
