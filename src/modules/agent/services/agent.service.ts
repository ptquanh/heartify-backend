import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';
import { ChatGroq } from '@langchain/groq';
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph';
// @ts-ignore
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { OperationResult } from 'mvc-common-toolkit';
import { generateId } from 'opik';
import { OpikCallbackHandler } from 'opik-langchain';
import { DataSource, Repository } from 'typeorm';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';

import { OpikService } from '@modules/opik/opik.service';

import { AGENT_CHAT_MESSAGE_ROLE, ENV_KEY } from '@shared/constants';
import { PaginationDTO } from '@shared/dtos/pagination.dto';
import {
  generateInternalServerResult,
  generatePaginationResult,
} from '@shared/helpers/operation-result.helper';
import { PaginationResult } from '@shared/interfaces';
import { BaseCRUDService } from '@shared/services/base-crud.service';

import {
  AGENT_CHAT_MESSAGE_HISTORY_LIMIT,
  AGENT_CHAT_MESSAGE_SYSTEM_PROMPT,
  AGENT_CHAT_MESSAGE_TOOL_PROMPT,
  AGENT_LLM_MODEL,
} from '../agent.constant';
import { AgentChatMessage } from '../entities/agent-chat-message.entity';
import {
  createDatabaseQueryTool,
  createDatabaseSchemaTool,
} from '../tools/database.tool';
import { systemTimeTool } from '../tools/system-time.tool';

@Injectable()
export class AgentService
  extends BaseCRUDService<AgentChatMessage>
  implements OnModuleInit
{
  private readonly logger = new Logger(AgentService.name);
  private app: any;
  private chatModel: any;
  private tools: any[] = [systemTimeTool];

  constructor(
    @InjectRepository(AgentChatMessage)
    private readonly chatMessageRepo: Repository<AgentChatMessage>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly opikService: OpikService,
    private readonly configService: ConfigService,
  ) {
    super(chatMessageRepo);
  }

  onModuleInit() {
    this.initializeAgent();
  }

  private initializeAgent() {
    const groqApiKey = this.configService.getOrThrow(ENV_KEY.GROQ_API_KEY);

    const databaseQueryTool = createDatabaseQueryTool(this.dataSource);
    const databaseSchemaTool = createDatabaseSchemaTool(this.dataSource);

    this.tools = [systemTimeTool, databaseQueryTool, databaseSchemaTool];

    this.chatModel = new ChatGroq({
      apiKey: groqApiKey,
      model: AGENT_LLM_MODEL,
      temperature: 0,
    }).bindTools(this.tools);

    const toolNode = new ToolNode(this.tools);

    const workflow = new StateGraph(MessagesAnnotation)
      .addNode('agent', this.callModel.bind(this))
      .addNode('tools', toolNode)
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', this.shouldContinue)
      .addEdge('tools', 'agent');

    this.app = workflow.compile();
    this.logger.log('LangGraph Agent initialized');
  }

  private async callModel(state: typeof MessagesAnnotation.State) {
    const messages = state.messages;
    const systemMessage = new SystemMessage(
      AGENT_CHAT_MESSAGE_SYSTEM_PROMPT + AGENT_CHAT_MESSAGE_TOOL_PROMPT,
    );
    const response = await this.chatModel.invoke([systemMessage, ...messages]);
    return { messages: [response] };
  }

  private shouldContinue(state: typeof MessagesAnnotation.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage &&
      'tool_calls' in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls.length > 0
    ) {
      return 'tools';
    }
    return END;
  }

  async getHistory(
    userId: string,
    dto: PaginationDTO,
  ): Promise<OperationResult<PaginationResult<AgentChatMessage>>> {
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
      this.logger.error('Agent History Error', error);
      return generateInternalServerResult(error.message);
    }
  }

  async callAgent(
    userId: string,
    userMessage: string,
    threadId: string,
  ): Promise<string> {
    const rootTraceId = generateId();
    const rootStartTime = new Date();

    try {
      this.opikService.trace({
        name: 'get_chat_history',
        startTime: new Date(),
        endTime: new Date(),
        input: { userId },
        tags: ['db', 'agent', 'history'],
        metadata: { parent_trace_id: rootTraceId },
      });

      const historyMessages = await this.getFormattedHistory(userId);

      const inputs = {
        messages: [...historyMessages, new HumanMessage(userMessage)],
      };

      const tracer = new OpikCallbackHandler();
      const config = {
        configurable: { thread_id: threadId },
        callbacks: [tracer],
      };

      const llmStartTime = new Date();
      const result = await this.app.invoke(inputs, config);
      const lastMessage = result.messages[result.messages.length - 1];
      const responseContent = lastMessage.content;

      this.opikService.trace({
        name: 'langgraph_agent_execution',
        startTime: llmStartTime,
        endTime: new Date(),
        input: {
          messages: inputs.messages,
          threadId,
        },
        output: {
          content: responseContent,
          messages: result.messages,
        },
        tags: ['llm', 'langgraph', 'agent'],
        metadata: {
          parent_trace_id: rootTraceId,
          model: AGENT_LLM_MODEL,
        },
      });

      const saveStartTime = new Date();
      await Promise.all([
        this.saveMessage(userId, AGENT_CHAT_MESSAGE_ROLE.USER, userMessage),
        this.saveMessage(
          userId,
          AGENT_CHAT_MESSAGE_ROLE.ASSISTANT,
          responseContent,
        ),
      ]);

      this.opikService.trace({
        name: 'persist_chat_messages',
        startTime: saveStartTime,
        endTime: new Date(),
        input: { userId, messageCount: 2 },
        tags: ['db', 'agent', 'persistence'],
        metadata: { parent_trace_id: rootTraceId },
      });

      this.opikService.trace({
        id: rootTraceId,
        name: 'agent_interaction',
        startTime: rootStartTime,
        endTime: new Date(),
        input: { userId, userMessage, threadId },
        output: {
          success: true,
          response: responseContent,
        },
        tags: ['agent', 'e2e', 'production'],
        metadata: {
          userId,
          thread_id: threadId,
        },
        threadId: userId,
      });

      return responseContent;
    } catch (error) {
      this.logger.error(`Error calling agent: ${error.message}`, error.stack);

      this.opikService.trace({
        id: rootTraceId,
        name: 'agent_interaction',
        startTime: rootStartTime,
        endTime: new Date(),
        input: {
          userId,
          userMessage,
          threadId,
        },
        output: { error: error.message },
        tags: ['agent', 'e2e', 'error'],
        metadata: {
          userId,
          error_stack: error.stack,
          thread_id: threadId,
        },
        threadId: userId,
      });

      throw error;
    }
  }

  private async saveMessage(
    userId: string,
    role: AGENT_CHAT_MESSAGE_ROLE,
    message: string,
  ) {
    const newMsg = this.chatMessageRepo.create({
      userId,
      role,
      message,
    });
    return this.chatMessageRepo.save(newMsg);
  }

  private async getFormattedHistory(userId: string) {
    const rawMessages = await this.chatMessageRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: AGENT_CHAT_MESSAGE_HISTORY_LIMIT,
    });

    const sortedMessages = rawMessages.reverse();

    return sortedMessages.map((msg) => {
      if (msg.role === AGENT_CHAT_MESSAGE_ROLE.ASSISTANT) {
        return new AIMessage(msg.message);
      }
      return new HumanMessage(msg.message);
    });
  }
}
