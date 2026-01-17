import { EmailSender, MailService } from 'mvc-common-toolkit';
import * as nodemailer from 'nodemailer';

import { Global, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ENV_KEY, INJECTION_TOKEN } from '@shared/constants';

import { NodemailerTransporter } from './mail.service';

export const emailSenderProvider: Provider = {
  provide: INJECTION_TOKEN.EMAIL_SENDER,
  useFactory: (configService: ConfigService) => {
    const port = Number(configService.getOrThrow(ENV_KEY.SMTP_PORT));

    const secureRaw = configService.get(ENV_KEY.SMTP_SECURE);
    const isSecure = secureRaw === true || secureRaw === 'true';

    const transporter = nodemailer.createTransport({
      host: configService.getOrThrow(ENV_KEY.SMTP_HOST),
      port: port,
      secure: isSecure,
      auth: {
        user: configService.getOrThrow(ENV_KEY.SMTP_USERNAME),
        pass: configService.getOrThrow(ENV_KEY.SMTP_PASSWORD),
      },
    });

    return new NodemailerTransporter(transporter);
  },
  inject: [ConfigService],
};

export const mailServiceProvider: Provider = {
  provide: MailService,
  useFactory: (emailSender: EmailSender, configService: ConfigService) => {
    const adminEmailsRaw = String(configService.get(ENV_KEY.ADMIN_EMAILS));
    const adminEmails = adminEmailsRaw
      ? adminEmailsRaw.split(',').map((e) => e.trim())
      : [];

    return new MailService(emailSender, {
      adminEmails: adminEmails,
    });
  },
  inject: [INJECTION_TOKEN.EMAIL_SENDER, ConfigService],
};

@Global()
@Module({
  providers: [emailSenderProvider, mailServiceProvider],
  exports: [MailService],
})
export class MailModule {}
