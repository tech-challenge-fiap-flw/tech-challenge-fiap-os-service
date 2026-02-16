import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { logger } from '../../utils/logger';

type EventHandler = (event: any) => Promise<void>;

export class SqsConsumer {
  private client: SQSClient;
  private handlers: Map<string, EventHandler> = new Map();
  private running = false;

  constructor(private queueUrl: string) {
    const config: any = { region: process.env.AWS_REGION || 'us-east-1' };
    if (process.env.SQS_ENDPOINT) {
      config.endpoint = process.env.SQS_ENDPOINT;
    }
    this.client = new SQSClient(config);
  }

  on(eventType: string, handler: EventHandler): void {
    this.handlers.set(eventType, handler);
  }

  stop(): void {
    this.running = false;
  }

  async start(): Promise<void> {
    this.running = true;
    logger.info({ service: 'SqsConsumer', event: 'starting', queueUrl: this.queueUrl });

    while (this.running) {
      try {
        const response = await this.client.send(new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 10,
          WaitTimeSeconds: 20,
          VisibilityTimeout: 60,
        }));

        for (const message of response.Messages ?? []) {
          try {
            const event = JSON.parse(message.Body!);
            const handler = this.handlers.get(event.eventType);

            if (handler) {
              logger.info({ service: 'SqsConsumer', event: 'processing', eventType: event.eventType, eventId: event.eventId });
              await handler(event);
            }

            await this.client.send(new DeleteMessageCommand({
              QueueUrl: this.queueUrl,
              ReceiptHandle: message.ReceiptHandle!,
            }));
          } catch (error) {
            logger.error({ service: 'SqsConsumer', event: 'processing_error', error });
          }
        }
      } catch (error) {
        logger.error({ service: 'SqsConsumer', event: 'polling_error', error });
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}
