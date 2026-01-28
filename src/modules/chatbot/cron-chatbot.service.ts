import { LessThan, Repository } from 'typeorm';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CHATBOT_CLEANUP_THRESHOLD_MS } from './chatbot.constant';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class CronChatbotService {
  private readonly logger = new Logger(CronChatbotService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
  ) {}

  // @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup() {
    this.logger.log('Running Chatbot cleanup task...');

    const thresholdDate = new Date(Date.now() - CHATBOT_CLEANUP_THRESHOLD_MS);

    try {
      const result = await this.chatMessageRepo.delete({
        createdAt: LessThan(thresholdDate),
      });

      if (result.affected && result.affected > 0) {
        this.logger.log(`Cleaned up ${result.affected} old chat messages.`);
      } else {
        this.logger.log(`No old chat messages to clean up.`);
      }
    } catch (error) {
      this.logger.error('Error during chat cleanup', error);
    }
  }
}
