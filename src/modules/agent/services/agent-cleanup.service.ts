import { LessThan, Repository } from 'typeorm';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AGENT_CHAT_MESSAGE_CLEANUP_THRESHOLD_MS } from '../agent.constant';
import { AgentChatMessage } from '../entities/agent-chat-message.entity';

@Injectable()
export class AgentCleanupService {
  private readonly logger = new Logger(AgentCleanupService.name);

  constructor(
    @InjectRepository(AgentChatMessage)
    private readonly chatMessageRepo: Repository<AgentChatMessage>,
  ) {}

  // @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup() {
    this.logger.log('Running Agent cleanup task...');

    const thresholdDate = new Date(
      Date.now() - AGENT_CHAT_MESSAGE_CLEANUP_THRESHOLD_MS,
    );

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
