import nodemailer, { Transporter } from 'nodemailer';
import { IEmailService, SendEmailOptions } from './EmailService';
import { logger } from '../../utils/logger';

export class NodemailerEmailService implements IEmailService {
  private transporter: Transporter;

  constructor() {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const safePass = pass ? `${pass.substring(0, 2)}***` : undefined;
    logger.info({ service: 'EmailService', event: 'Initializing transporter', host, port, user, pass: safePass });
    if (!host || !user || !pass) {
      logger.warn({ service: 'EmailService', event: 'Missing SMTP environment variables. Emails will be skipped.' });
    }
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    if (!this.transporter || !process.env.EMAIL_HOST) {
      return;
    }
    logger.info({ service: 'EmailService', event: 'Sending email', to: options.to, subject: options.subject });
    const response = await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    logger.info({ service: 'EmailService', event: 'Email sent', to: options.to, subject: options.subject, response });
  }
}
