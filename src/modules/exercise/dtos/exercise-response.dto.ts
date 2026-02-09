import { ApiProperty } from '@nestjs/swagger';

import { PaginationDataDTO } from '@shared/dtos/pagination.dto';

import { Exercise } from '../exercise.entity';

class ExercisePaginationDataDTO extends PaginationDataDTO<Exercise> {
  @ApiProperty({ type: () => Exercise, isArray: true })
  rows: Exercise[];
}

export class PaginationExerciseResponseDTO {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: () => ExercisePaginationDataDTO })
  data: ExercisePaginationDataDTO;
}
