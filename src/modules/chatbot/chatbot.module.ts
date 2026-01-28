import { Groq } from 'groq-sdk';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '@modules/user/user.module';

import { ENV_KEY, INJECTION_TOKEN } from '@shared/constants';

import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { CronChatbotService } from './cron-chatbot.service';
import { ChatMessage } from './entities/chat-message.entity';

export const GroqProvider = {
  provide: INJECTION_TOKEN.GROQ_SERVICE,
  useFactory: (config: ConfigService) => {
    return new Groq({
      apiKey: config.getOrThrow(ENV_KEY.GROQ_API_KEY),
    });
  },
  inject: [ConfigService],
};

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    ConfigModule,
    ScheduleModule,
    UserModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, CronChatbotService, GroqProvider],
  exports: [ChatbotService],
})
export class ChatbotModule {}
