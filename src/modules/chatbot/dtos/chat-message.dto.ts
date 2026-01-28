import { IsNotEmpty, IsString, Length } from 'class-validator';
import { PaginationResult } from 'mvc-common-toolkit';

import { ApiProperty } from '@nestjs/swagger';

import { OnlyTextAndNumbers } from '@shared/decorators/sanitize-input';

export class ChatMessagePayloadDTO {
  @ApiProperty({
    example: 'Hello, how are you?',
    description: 'Message to be sent to the chatbot',
  })
  @IsString()
  @IsNotEmpty()
  @OnlyTextAndNumbers({
    includeWhitespaces: true,
    onlyASCII: false,
    throwOnError: true,
    allowedSymbols: true,
    allowedPunctuation: true,
  })
  @Length(10, 5000)
  message: string;
}

export interface ChatMessageResponseDTO {
  response: string;
  suggested_actions: string[];
}

export interface PaginationChatMessageResponseDTO
  extends PaginationResult<ChatMessageResponseDTO> {}
