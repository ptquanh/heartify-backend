import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiOperationError,
  ApiOperationSuccess,
} from '@shared/decorators/api-response';
import { AuthGuard } from '@shared/guards/auth.guard';

import {
  GetFoodDetailPayloadDTO,
  PaginationFoodPayloadDTO,
} from './dtos/food-payload.dto';
import { PaginationFoodResponseDTO } from './dtos/food-response.dto';
import { Food } from './food.entity';
import { FoodService } from './food.service';

@ApiBearerAuth()
@ApiTags('Food')
@Controller('foods')
@UseGuards(AuthGuard)
@ApiOperationError()
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get Food Detail',
    description: 'Retrieve food details by ID',
  })
  @ApiOperationSuccess(Food)
  async getDetail(@Param() params: GetFoodDetailPayloadDTO) {
    return this.foodService.findByID(params.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get Paginated Foods',
    description: 'Retrieve paginated list of foods',
  })
  @ApiOperationSuccess(PaginationFoodResponseDTO, { isRaw: true })
  async paginate(@Query() dto: PaginationFoodPayloadDTO) {
    return this.foodService.paginate(dto);
  }
}
