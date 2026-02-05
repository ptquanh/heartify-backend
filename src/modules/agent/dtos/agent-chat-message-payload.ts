import { IsNotEmpty, IsString, Length } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

import { OnlyTextAndNumbers } from '@shared/decorators/sanitize-input';

export class AgentChatMessagePayloadDTO {
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
