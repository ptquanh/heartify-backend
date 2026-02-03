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

import {
  ChatMessagePayloadDTO,
  ChatMessageResponseDTO,
  PaginationChatMessageResponseDTO,
} from './chat-message.dto';
import { ChatbotService } from './services/chatbot.service';

@ApiTags('Chatbot')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('chatbot')
@ApiOperationError()
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @ApplyRateLimiting(10)
  @UseCallQueue()
  @Post('message')
  @ApiOperation({
    summary: 'Send Message',
    description: 'Send a message to the chatbot',
  })
  @ApiOperationSuccess(ChatMessageResponseDTO)
  async sendMessage(
    @RequestUser() user: User,
    @Body() dto: ChatMessagePayloadDTO,
  ): Promise<HttpResponse> {
    return this.chatbotService.sendMessage(user.id, dto.message);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get History',
    description: 'Get history of messages',
  })
  @ApiOperationSuccess(PaginationChatMessageResponseDTO, { isRaw: true })
  async getHistory(
    @RequestUser() user: User,
    @Query() dto: PaginationDTO,
  ): Promise<HttpResponse> {
    return this.chatbotService.getHistory(user.id, dto);
  }
}
