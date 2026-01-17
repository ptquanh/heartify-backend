import { EmailSender, SendMailOptions } from 'mvc-common-toolkit';
import * as nodemailer from 'nodemailer';

import { Logger } from '@nestjs/common';

export class NodemailerTransporter implements EmailSender {
  private readonly logger = new Logger(NodemailerTransporter.name);

  constructor(private readonly transporter: nodemailer.Transporter) {}

  async send(mailOptions: SendMailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(
        `Email sent successfully. To: [${this.formatRecipients(mailOptions.to)}] | Subject: "${mailOptions.subject}" | MessageID: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email. To: [${this.formatRecipients(mailOptions.to)}]. Error: ${error.message}`,
        error.stack,
      );

      throw error;
    }
  }

  private formatRecipients(recipients?: string | string[]): string {
    if (!recipients) return 'Unknown';
    return Array.isArray(recipients) ? recipients.join(', ') : recipients;
  }
}
