import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgentChatDto {
  @ApiProperty({
    example: 'What time is it?',
    description: 'User message to the agent',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    example: 'thread-123',
    description: 'Thread ID for the conversation',
  })
  @IsOptional()
  @IsString()
  threadId?: string;
}
