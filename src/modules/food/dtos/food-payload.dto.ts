import { IsNotEmpty, IsString } from 'class-validator';

import { PaginatedByKeywordDTO } from '@shared/dtos/pagination.dto';

export class PaginationFoodPayloadDTO extends PaginatedByKeywordDTO {}

export class GetFoodDetailPayloadDTO {
  @IsNotEmpty()
  @IsString()
  id: string;
}
