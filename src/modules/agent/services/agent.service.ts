import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { ChatGroq } from '@langchain/groq';
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph';
// @ts-expect-error
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
import { AgentResponseHelper } from '@shared/helpers/agent-response.helper';
import {
  generateInternalServerResult,
  generatePaginationResult,
} from '@shared/helpers/operation-result.helper';
import { PaginationResult } from '@shared/interfaces';
import { BaseCRUDService } from '@shared/services/base-crud.service';

import {
  AGENT_CHAT_MESSAGE_HISTORY_LIMIT,
  AGENT_CHAT_MESSAGE_INTENT,
  AGENT_CHAT_MESSAGE_TOOLS,
  AGENT_CHAT_MESSAGE_TOOLS_NAME,
  AGENT_GRAPH_EDGE,
  AGENT_GRAPH_NODE,
  AGENT_LLM_MODEL,
  AGENT_TEMPERATURE,
  GREETING_PROMPT,
  MEDICAL_SYSTEM_PROMPT,
  REFUSAL_PROMPT,
  ROUTER_SYSTEM_PROMPT,
} from '../agent.constant';
import { AgentChatMessageResponseDTO } from '../dtos/agent-chat-message-response';
import { AgentChatMessage } from '../entities/agent-chat-message.entity';
import {
  createDatabaseQueryTool,
  createDatabaseSchemaTool,
} from '../tools/database.tool';
import { createFoodQueryTool } from '../tools/food-query.tool';
import { systemTimeTool } from '../tools/system-time.tool';

interface RouterOutput {
  intent: AGENT_CHAT_MESSAGE_INTENT;
}

@Injectable()
export class AgentService
  extends BaseCRUDService<AgentChatMessage>
  implements OnModuleInit
{
  private readonly logger = new Logger(AgentService.name);
  private app: any;
  private chatModel: any;
  private tools: any[] = [systemTimeTool];
  private routerModel: any;

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

    const toolFactories = {
      [AGENT_CHAT_MESSAGE_TOOLS_NAME.GET_SYSTEM_TIME]: systemTimeTool,
      [AGENT_CHAT_MESSAGE_TOOLS_NAME.QUERY_DATABASE]: createDatabaseQueryTool(
        this.dataSource,
      ),
      [AGENT_CHAT_MESSAGE_TOOLS_NAME.GET_DATABASE_SCHEMA]:
        createDatabaseSchemaTool(this.dataSource),
      [AGENT_CHAT_MESSAGE_TOOLS_NAME.SEARCH_FOODS]: createFoodQueryTool(
        this.dataSource,
      ),
    };

    this.tools = AGENT_CHAT_MESSAGE_TOOLS.map(
      (toolName) => toolFactories[toolName],
    );

    const toolNode = new ToolNode(this.tools);

    // Initialize Router Agent
    this.routerModel = new ChatGroq({
      apiKey: groqApiKey,
      model: AGENT_LLM_MODEL.ROUTER,
      temperature: AGENT_TEMPERATURE.ROUTER,
    });

    // Initialize Medical Agent
    this.chatModel = new ChatGroq({
      apiKey: groqApiKey,
      model: AGENT_LLM_MODEL.MEDICAL,
      temperature: AGENT_TEMPERATURE.MEDICAL,
    }).bindTools(this.tools);

    // Build Graph
    const workflow = new StateGraph(MessagesAnnotation)
      .addNode(AGENT_GRAPH_NODE.CLASSIFIER, this.classificationNode.bind(this))
      .addNode(AGENT_GRAPH_NODE.MEDICAL_AGENT, this.medicalNode.bind(this))
      .addNode(AGENT_GRAPH_NODE.GREETING_HANDLER, this.greetingNode.bind(this))
      .addNode(AGENT_GRAPH_NODE.REFUSAL_HANDLER, this.refusalNode.bind(this))
      .addNode(AGENT_GRAPH_NODE.TOOLS, toolNode)
      // Edges
      // Start -> Classifier
      .addEdge(START, AGENT_GRAPH_NODE.CLASSIFIER)
      .addConditionalEdges(
        AGENT_GRAPH_NODE.CLASSIFIER,
        this.routeBasedOnIntent.bind(this),
        {
          [AGENT_GRAPH_EDGE.MEDICAL]: AGENT_GRAPH_NODE.MEDICAL_AGENT,
          [AGENT_GRAPH_EDGE.GREETING]: AGENT_GRAPH_NODE.GREETING_HANDLER,
          [AGENT_GRAPH_EDGE.REFUSAL]: AGENT_GRAPH_NODE.REFUSAL_HANDLER,
        },
      )

      .addEdge(AGENT_GRAPH_NODE.TOOLS, AGENT_GRAPH_NODE.MEDICAL_AGENT)
      .addConditionalEdges(
        AGENT_GRAPH_NODE.MEDICAL_AGENT,
        this.shouldContinue,
        {
          tools: AGENT_GRAPH_NODE.TOOLS,
          [END]: END,
        },
      )

      .addEdge(AGENT_GRAPH_NODE.GREETING_HANDLER, END)
      .addEdge(AGENT_GRAPH_NODE.REFUSAL_HANDLER, END);

    this.app = workflow.compile();
    this.logger.log('LangGraph Router-Architecture Initialized');
  }

  private async classificationNode(
    state: typeof MessagesAnnotation.State,
    config: RunnableConfig,
  ) {
    const { messages } = state;
    const lastUserMsg = messages[messages.length - 1];

    const classificationMsg = [
      new SystemMessage(ROUTER_SYSTEM_PROMPT),
      lastUserMsg,
    ];

    const response = await this.routerModel.invoke(classificationMsg, {
      ...config,
      response_format: { type: 'json_object' },
    });

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
      return AGENT_GRAPH_NODE.TOOLS;
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
  ): Promise<AgentChatMessageResponseDTO> {
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

      let parsedResponse: AgentChatMessageResponseDTO;
      try {
        parsedResponse = AgentResponseHelper.parseResponse(responseContent);
      } catch (parseError) {
        this.logger.error(
          `Failed to parse agent response: ${responseContent}`,
          parseError,
        );
        parsedResponse = {
          response: responseContent,
          suggested_actions: [],
        };
      }

      this.opikService.trace({
        name: 'langgraph_agent_execution',
        startTime: llmStartTime,
        endTime: new Date(),
        input: {
          messages: inputs.messages,
          threadId,
        },
        output: {
          content: parsedResponse,
          messages: result.messages,
        },
        tags: ['llm', 'langgraph', 'agent'],
        metadata: {
          parent_trace_id: rootTraceId,
          model: AGENT_LLM_MODEL.MEDICAL,
        },
      });

      const saveStartTime = new Date();
      await Promise.all([
        this.saveMessage(userId, AGENT_CHAT_MESSAGE_ROLE.USER, userMessage),
        this.saveMessage(
          userId,
          AGENT_CHAT_MESSAGE_ROLE.ASSISTANT,
          parsedResponse.response,
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
          response: parsedResponse,
        },
        tags: ['agent', 'e2e', 'production'],
        metadata: {
          userId,
          thread_id: threadId,
        },
        threadId: userId,
      });

      return parsedResponse;
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

  private routeBasedOnIntent(state: typeof MessagesAnnotation.State) {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1] as AIMessage;
    const contentStr = lastMessage.content as string;

    try {
      let cleanContent = contentStr
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const firstBrace = cleanContent.indexOf('{');
      const lastBrace = cleanContent.lastIndexOf('}');
      if (firstBrace >= 0 && lastBrace >= 0) {
        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
      }
      const content = JSON.parse(cleanContent) as RouterOutput;
      this.logger.log(`Router Decision: ${content.intent}`);

      switch (content.intent) {
        case AGENT_CHAT_MESSAGE_INTENT.GREETING:
          return AGENT_GRAPH_EDGE.GREETING;
        case AGENT_CHAT_MESSAGE_INTENT.OFF_TOPIC:
          return AGENT_GRAPH_EDGE.REFUSAL;
        case AGENT_CHAT_MESSAGE_INTENT.MEDICAL:
        default:
          return AGENT_GRAPH_EDGE.MEDICAL;
      }
    } catch (e) {
      this.logger.error(
        `Router Parse Error for input: "${contentStr.substring(0, 50)}..."`,
        e,
      );
      return AGENT_GRAPH_EDGE.MEDICAL;
    }
  }

  private async medicalNode(
    state: typeof MessagesAnnotation.State,
    config: RunnableConfig,
  ) {
    const { messages } = state;

    const conversationMessages = messages.filter((msg) => {
      if (
        msg instanceof HumanMessage ||
        msg instanceof SystemMessage ||
        msg instanceof ToolMessage
      ) {
        return true;
      }

      if (msg instanceof AIMessage && typeof msg.content === 'string') {
        try {
          const parsed = JSON.parse(msg.content);
          if (
            parsed &&
            parsed.intent &&
            [
              AGENT_CHAT_MESSAGE_INTENT.MEDICAL,
              AGENT_CHAT_MESSAGE_INTENT.GREETING,
              AGENT_CHAT_MESSAGE_INTENT.OFF_TOPIC,
            ].includes(parsed.intent)
          ) {
            return false;
          }
        } catch {
          return true;
        }
      }
      return true;
    });
    const systemMessage = new SystemMessage(MEDICAL_SYSTEM_PROMPT);

    const response = await this.chatModel.invoke(
      [systemMessage, ...conversationMessages],
      config,
    );

    return { messages: [response] };
  }

  private async greetingNode(
    state: typeof MessagesAnnotation.State,
    config: RunnableConfig,
  ) {
    const response = await this.routerModel.invoke(
      [
        new SystemMessage(GREETING_PROMPT),
        state.messages[state.messages.length - 2],
      ],
      { ...config, response_format: { type: 'json_object' } },
    );
    return { messages: [response] };
  }

  private async refusalNode(
    state: typeof MessagesAnnotation.State,
    config: RunnableConfig,
  ) {
    const response = await this.routerModel.invoke(
      [
        new SystemMessage(REFUSAL_PROMPT),
        state.messages[state.messages.length - 2],
      ],
      { ...config, response_format: { type: 'json_object' } },
    );
    return { messages: [response] };
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
