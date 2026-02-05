import { ApiProperty } from '@nestjs/swagger';

import { PaginationDataDTO } from '@shared/dtos/pagination.dto';

export class AgentChatMessageResponseDTO {
  @ApiProperty()
  response: string;

  @ApiProperty()
  suggested_actions: string[];
}

class AgentChatMessagePaginationDataDTO extends PaginationDataDTO<AgentChatMessageResponseDTO> {
  @ApiProperty({ type: () => AgentChatMessageResponseDTO, isArray: true })
  rows: AgentChatMessageResponseDTO[];
}

export class PaginationAgentChatMessageResponseDTO {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: () => AgentChatMessagePaginationDataDTO })
  data: AgentChatMessagePaginationDataDTO;
}
