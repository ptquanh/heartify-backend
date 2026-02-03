import { IsNotEmpty, IsString, Length } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { OnlyTextAndNumbers } from '@shared/decorators/sanitize-input';
import { PaginationDataDTO } from '@shared/dtos/pagination.dto';

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

export class ChatMessageResponseDTO {
  @ApiProperty()
  response: string;

  @ApiProperty()
  suggested_actions: string[];
}

class ChatMessagePaginationDataDTO extends PaginationDataDTO<ChatMessageResponseDTO> {
  @ApiProperty({ type: () => ChatMessageResponseDTO, isArray: true })
  rows: ChatMessageResponseDTO[];
}

export class PaginationChatMessageResponseDTO {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: () => ChatMessagePaginationDataDTO })
  data: ChatMessagePaginationDataDTO;
}
