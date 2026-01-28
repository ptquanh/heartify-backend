import Groq from 'groq-sdk';
import { OperationResult } from 'mvc-common-toolkit';
import { Repository } from 'typeorm';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  CHATBOT_MESSAGE_ROLE,
  ERR_CODE,
  INJECTION_TOKEN,
} from '@shared/constants';
import { PaginationDTO } from '@shared/dtos/pagination.dto';
import {
  generateBadRequestResult,
  generateInternalServerResult,
  generatePaginationResult,
} from '@shared/helpers/operation-result.helper';
import { PaginationResult } from '@shared/interfaces';
import { BaseCRUDService } from '@shared/services/base-crud.service';

import {
  CHATBOT_MODEL,
  CHATBOT_PROMPT,
  HISTORY_LIMIT,
  MAX_TOKENS,
  RESPONSE_FORMAT,
  TEMPERATURE,
} from './chatbot.constant';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatbotService extends BaseCRUDService<ChatMessage> {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,

    @Inject(INJECTION_TOKEN.GROQ_SERVICE)
    private readonly groqService: Groq,
  ) {
    super(chatMessageRepo);
  }

  async sendMessage(
    userId: string,
    userMessage: string,
  ): Promise<OperationResult> {
    try {
      const historyMessages = await this.getFormattedHistory(userId);

      const messagesPayload = [
        { role: CHATBOT_MESSAGE_ROLE.SYSTEM, content: CHATBOT_PROMPT },
        ...historyMessages,
        { role: CHATBOT_MESSAGE_ROLE.USER, content: userMessage },
      ];

      const completion = await this.groqService.chat.completions.create({
        messages: messagesPayload as any,
        model: CHATBOT_MODEL,
        response_format: { type: RESPONSE_FORMAT.JSON },
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
      });

      const responseContent = completion.choices[0]?.message?.content;

      if (!responseContent) {
        return generateBadRequestResult(
          'System is busy, please try again later',
          ERR_CODE.SYSTEM_BUSY,
        );
      }

      await Promise.all([
        this.saveMessage(userId, CHATBOT_MESSAGE_ROLE.USER, userMessage),
        this.saveMessage(
          userId,
          CHATBOT_MESSAGE_ROLE.ASSISTANT,
          responseContent,
        ),
      ]);

      return {
        success: true,
        data: JSON.parse(responseContent),
      };
    } catch (error) {
      this.logger.error('Groq Chat Error', error);

      return generateInternalServerResult(error.message);
    }
  }

  async getHistory(
    userId: string,
    dto: PaginationDTO,
  ): Promise<OperationResult<PaginationResult<ChatMessage>>> {
    dto.addFilter({ userId });

    try {
      const historyMessages = await this.paginate(dto, dto.filter);

      return generatePaginationResult(
        historyMessages.rows,
        historyMessages.total,
        dto.offset,
        dto.limit,
      );
    } catch (error) {
      this.logger.error('Groq Chat Error', error);

      return generateInternalServerResult(error.message);
    }
  }

  private async getFormattedHistory(userId: string) {
    const rawMessages = await this.chatMessageRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: HISTORY_LIMIT,
    });

    const sortedMessages = rawMessages.reverse();

    return sortedMessages.map((msg) => ({
      role:
        msg.role === CHATBOT_MESSAGE_ROLE.ASSISTANT
          ? CHATBOT_MESSAGE_ROLE.ASSISTANT
          : CHATBOT_MESSAGE_ROLE.USER,
      content: msg.message,
    }));
  }

  private async saveMessage(
    userId: string,
    role: CHATBOT_MESSAGE_ROLE,
    message: string,
  ) {
    const newMsg = this.chatMessageRepo.create({
      userId,
      role,
      message,
    });
    return this.chatMessageRepo.save(newMsg);
  }
}
