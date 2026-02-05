import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AgentChatDto } from './agent.dto';
import { AgentService } from './agent.service';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Chat with the AI Agent' })
  @ApiResponse({
    status: 200,
    description: 'Successful response from the agent',
  })
  async chat(@Body() dto: AgentChatDto) {
    const threadId = dto.threadId || `thread-${Date.now()}`;
    const response = await this.agentService.callAgent(dto.message, threadId);
    return {
      success: true,
      data: response,
      threadId,
    };
  }
}
