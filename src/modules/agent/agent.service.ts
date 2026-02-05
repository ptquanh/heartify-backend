import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatGroq } from '@langchain/groq';
import {
  END,
  MessagesAnnotation,
  START,
  StateGraph,
} from '@langchain/langgraph';
// @ts-ignore
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { DataSource } from 'typeorm';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';

// Assuming this exists as seen in ChatbotModule
import {
  CHATBOT_MODEL,
  CHATBOT_PROMPT,
} from '@modules/chatbot/chatbot.constant';

import { ENV_KEY } from '@shared/constants';

import {
  createDatabaseQueryTool,
  createDatabaseSchemaTool,
} from './tools/database.tool';
import { systemTimeTool } from './tools/system-time.tool';

@Injectable()
export class AgentService implements OnModuleInit {
  private readonly logger = new Logger(AgentService.name);
  private app: any;
  private model: any;
  private tools: any[] = [systemTimeTool];

  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  onModuleInit() {
    this.initializeAgent();
  }

  private initializeAgent() {
    const groqApiKey = this.configService.getOrThrow(ENV_KEY.GROQ_API_KEY);

    const databaseQueryTool = createDatabaseQueryTool(this.dataSource);
    const databaseSchemaTool = createDatabaseSchemaTool(this.dataSource);

    this.tools = [systemTimeTool, databaseQueryTool, databaseSchemaTool];

    this.model = new ChatGroq({
      apiKey: groqApiKey,
      model: CHATBOT_MODEL,
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
      CHATBOT_PROMPT +
        '\n\nIMPORTANT: You have access to the following tools: get_system_time, query_database, and get_database_schema. Use "get_database_schema" to understand the database structure before querying. Do NOT use "brave_search".',
    );
    const response = await this.model.invoke([systemMessage, ...messages]);
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

  async callAgent(userMessage: string, threadId: string) {
    try {
      const inputs = {
        messages: [new HumanMessage(userMessage)],
      };

      const config = {
        configurable: { thread_id: threadId },
        // callbacks: [tracer],
      };

      const result = await this.app.invoke(inputs, config);

      const lastMessage = result.messages[result.messages.length - 1];
      return lastMessage.content;
    } catch (error) {
      this.logger.error(`Error calling agent: ${error.message}`, error.stack);
      throw error;
    }
  }
}
