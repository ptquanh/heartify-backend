import { IsString } from 'class-validator';

import { PaginationDTO } from '@shared/dtos/pagination.dto';

export class PaginationExercisePayloadDTO extends PaginationDTO {}

export class GetExerciseDetailPayloadDTO {
  @IsString()
  id: string;
}
