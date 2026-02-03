import { ApiProperty } from '@nestjs/swagger';

import { PaginationDataDTO } from '@shared/dtos/pagination.dto';

import { Food } from '../food.entity';

class FoodPaginationDataDTO extends PaginationDataDTO<Food> {
  @ApiProperty({ type: () => Food, isArray: true })
  rows: Food[];
}

export class PaginationFoodResponseDTO {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: () => FoodPaginationDataDTO })
  data: FoodPaginationDataDTO;
}
