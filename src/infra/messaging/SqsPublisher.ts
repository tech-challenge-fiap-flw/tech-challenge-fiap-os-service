import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuid } from 'uuid';
import { logger } from '../../utils/logger';

export interface DomainEvent {
  eventType: string;
  correlationId: string;
  payload: Record<string, unknown>;
}

export class SqsPublisher {
  private client: SQSClient;

  constructor(private queueUrl: string) {
    const config: any = { region: process.env.AWS_REGION || 'us-east-1' };
    if (process.env.SQS_ENDPOINT) {
      config.endpoint = process.env.SQS_ENDPOINT;
    }
    this.client = new SQSClient(config);
  }

  async publish(event: DomainEvent): Promise<void> {
    const eventId = uuid();
    const message = {
      eventId,
      ...event,
      timestamp: new Date().toISOString(),
      source: process.env.SERVICE_NAME || 'os-service',
    };

    logger.info({ service: 'SqsPublisher', event: 'publishing', eventType: event.eventType, eventId });

    await this.client.send(new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
      MessageGroupId: event.eventType,
      MessageDeduplicationId: eventId,
    }));

    logger.info({ service: 'SqsPublisher', event: 'published', eventType: event.eventType, eventId });
  }
}
