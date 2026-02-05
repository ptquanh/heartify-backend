import Groq from 'groq-sdk';
import { OperationResult } from 'mvc-common-toolkit';
import { generateId } from 'opik';
import { Repository } from 'typeorm';

import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { OpikService } from '@modules/opik/opik.service';

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

import { ChatMessage } from '../chat-message.entity';
import {
  CHATBOT_MODEL,
  CHATBOT_PROMPT,
  HISTORY_LIMIT,
  MAX_TOKENS,
  RESPONSE_FORMAT,
  TEMPERATURE,
} from '../chatbot.constant';

@Injectable()
export class ChatbotService extends BaseCRUDService<ChatMessage> {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,

    @Inject(INJECTION_TOKEN.GROQ_SERVICE)
    private readonly groqService: Groq,

    private readonly opikService: OpikService,
  ) {
    super(chatMessageRepo);
  }

  async sendMessage(
    userId: string,
    userMessage: string,
  ): Promise<OperationResult> {
    const rootTraceId = generateId();
    const rootStartTime = new Date();
    let messagesPayload: any[] = [];
    let responseContent: string | null = null;

    try {
      const historyStartTime = new Date();
      const historyMessages = await this.getFormattedHistory(userId);
      this.opikService.trace({
        name: 'get_chat_history',
        startTime: historyStartTime,
        endTime: new Date(),
        input: { userId, limit: HISTORY_LIMIT },
        output: { messageCount: historyMessages.length },
        tags: ['db', 'chatbot', 'history'],
        metadata: { parent_trace_id: rootTraceId },
      });

      messagesPayload = [
        { role: CHATBOT_MESSAGE_ROLE.SYSTEM, content: CHATBOT_PROMPT },
        ...historyMessages,
        { role: CHATBOT_MESSAGE_ROLE.USER, content: userMessage },
      ];

      const llmStartTime = new Date();
      const completion = await this.groqService.chat.completions.create({
        messages: messagesPayload as any,
        model: CHATBOT_MODEL,
        response_format: { type: RESPONSE_FORMAT.JSON },
        temperature: TEMPERATURE,
        max_tokens: MAX_TOKENS,
      });
      responseContent = completion.choices[0]?.message?.content;

      this.opikService.trace({
        name: 'groq_llm_generation',
        startTime: llmStartTime,
        endTime: new Date(),
        input: {
          messages: messagesPayload,
          model: CHATBOT_MODEL,
          temperature: TEMPERATURE,
          max_tokens: MAX_TOKENS,
        },
        output: {
          content: responseContent,
          role: completion.choices[0]?.message?.role,
        },
        tags: ['llm', 'groq', 'external_api'],
        metadata: {
          parent_trace_id: rootTraceId,
          usage: completion.usage,
          model: CHATBOT_MODEL,
        },
      });

      if (!responseContent) {
        this.logger.warn(`Empty response for user ${userId}`);

        this.opikService.trace({
          id: rootTraceId,
          name: 'chatbot_interaction',
          startTime: rootStartTime,
          endTime: new Date(),
          input: { userId, userMessage },
          output: { error: 'Empty response from LLM' },
          tags: ['chatbot', 'e2e', 'warning'],
        });

        return generateBadRequestResult(
          'System is busy, please try again later',
          ERR_CODE.SYSTEM_BUSY,
        );
      }

      const saveStartTime = new Date();
      await Promise.all([
        this.saveMessage(userId, CHATBOT_MESSAGE_ROLE.USER, userMessage),
        this.saveMessage(
          userId,
          CHATBOT_MESSAGE_ROLE.ASSISTANT,
          responseContent,
        ),
      ]);
      this.opikService.trace({
        name: 'persist_chat_messages',
        startTime: saveStartTime,
        endTime: new Date(),
        input: { userId, messageCount: 2 },
        tags: ['db', 'chatbot', 'persistence'],
        metadata: { parent_trace_id: rootTraceId },
      });

      this.opikService.trace({
        id: rootTraceId,
        name: 'chatbot_interaction',
        startTime: rootStartTime,
        endTime: new Date(),
        input: { userId, userMessage },
        output: {
          success: true,
          response: responseContent,
        },
        tags: ['chatbot', 'e2e', 'production'],
        metadata: {
          userId,
          thread_id: userId,
          total_tokens: completion.usage?.total_tokens,
          prompt_tokens: completion.usage?.prompt_tokens,
          completion_tokens: completion.usage?.completion_tokens,
        },
        threadId: userId,
      });

      return {
        success: true,
        data: JSON.parse(responseContent),
      };
    } catch (error) {
      this.logger.error('Groq Chat Error', error);

      this.opikService.trace({
        id: rootTraceId,
        name: 'chatbot_interaction',
        startTime: rootStartTime,
        endTime: new Date(),
        input: {
          userId,
          userMessage,
          last_payload: messagesPayload.length ? messagesPayload : undefined,
        },
        output: { error: error.message },
        tags: ['chatbot', 'e2e', 'error'],
        metadata: {
          userId,
          error_stack: error.stack,
          thread_id: userId,
        },
        threadId: userId,
      });

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
