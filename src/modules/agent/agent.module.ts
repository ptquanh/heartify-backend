import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '@modules/user/user.module';

import { AgentController } from './agent.controller';
import { AgentChatMessage } from './entities/agent-chat-message.entity';
import { AgentCleanupService } from './services/agent-cleanup.service';
import { AgentService } from './services/agent.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentChatMessage]),
    ConfigModule,
    ScheduleModule,
    UserModule,
  ],
  controllers: [AgentController],
  providers: [AgentService, AgentCleanupService],
  exports: [AgentService],
})
export class AgentModule {}
