import { HttpResponse } from 'mvc-common-toolkit';

import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { User } from '@modules/user/entities/user.entity';

import {
  ApiOperationError,
  ApiOperationSuccess,
} from '@shared/decorators/api-response';
import { RequestUser } from '@shared/decorators/request-user';
import { PaginationDTO } from '@shared/dtos/pagination.dto';
import { AuthGuard } from '@shared/guards/auth.guard';
import { UseCallQueue } from '@shared/interceptors/call-queue.interceptor';
import { ApplyRateLimiting } from '@shared/interceptors/rate-limiting.interceptor';

import { AgentChatMessagePayloadDTO } from './dtos/agent-chat-message-payload';
import { PaginationAgentChatMessageResponseDTO } from './dtos/agent-chat-message-response';
import { AgentService } from './services/agent.service';

@ApiTags('Agent')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('agent')
@ApiOperationError()
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('history')
  @ApiOperation({
    summary: 'Get History',
    description: 'Get history of messages',
  })
  @ApiOperationSuccess(PaginationAgentChatMessageResponseDTO, { isRaw: true })
  async getHistory(
    @RequestUser() user: User,
    @Query() dto: PaginationDTO,
  ): Promise<HttpResponse> {
    return this.agentService.getHistory(user.id, dto);
  }

  @ApplyRateLimiting(10)
  @UseCallQueue()
  @Post('chat')
  @ApiOperation({ summary: 'Chat with the AI Agent' })
  @ApiOperationSuccess(AgentChatMessagePayloadDTO)
  async chat(
    @Body() dto: AgentChatMessagePayloadDTO,
    @RequestUser() user: User,
  ): Promise<HttpResponse> {
    const threadId = `thread-${Date.now()}`;
    const response = await this.agentService.callAgent(
      user.id,
      dto.message,
      threadId,
    );

    return {
      success: true,
      data: response,
    };
  }
}
