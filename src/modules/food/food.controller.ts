import { HttpResponse } from 'mvc-common-toolkit';

import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiOperationError,
  ApiOperationSuccess,
} from '@shared/decorators/api-response';
import { RequestUser } from '@shared/decorators/request-user';
import { AuthGuard } from '@shared/guards/auth.guard';

import {
  GetFoodDetailPayloadDTO,
  PaginationFoodPayloadDTO,
} from './dtos/food-payload.dto';
import { PaginationFoodResponseDTO } from './dtos/food-response.dto';
import { FoodRecommendationService } from './food-recommendation.service';
import { Food } from './food.entity';
import { FoodService } from './food.service';

@ApiBearerAuth()
@ApiTags('Food')
@Controller('foods')
@UseGuards(AuthGuard)
@ApiOperationError()
export class FoodController {
  constructor(
    private readonly foodService: FoodService,
    private readonly foodRecommendationService: FoodRecommendationService,
  ) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Get Food Detail',
    description: 'Retrieve food details by ID',
  })
  @ApiOperationSuccess(Food)
  async getDetail(
    @Param() params: GetFoodDetailPayloadDTO,
  ): Promise<HttpResponse> {
    return this.foodService.viewFoodDetails(params.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get Paginated Foods',
    description: 'Retrieve paginated list of foods',
  })
  @ApiOperationSuccess(PaginationFoodResponseDTO, { isRaw: true })
  async paginate(
    @Query() dto: PaginationFoodPayloadDTO,
  ): Promise<HttpResponse> {
    return this.foodService.paginateFoods(dto);
  }

  @Post('recommend')
  @ApiOperation({
    summary: 'Get Food Recommendations',
    description:
      'Get food recommendations based on user health record and profile',
  })
  async recommend(@RequestUser() user: { id: string }) {
    return this.foodRecommendationService.getRecommendations(user.id);
  }
}
