import { HttpResponse } from 'mvc-common-toolkit';

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { User } from '@modules/user/entities/user.entity';

import {
  ApiOperationError,
  ApiOperationSuccess,
} from '@shared/decorators/api-response';
import { RequestUser } from '@shared/decorators/request-user';
import { AuthGuard } from '@shared/guards/auth.guard';

import {
  GetExerciseDetailPayloadDTO,
  PaginationExercisePayloadDTO,
} from './dtos/exercise-payload.dto';
import { PaginationExerciseResponseDTO } from './dtos/exercise-response.dto';
import { ExerciseRecommendationService } from './exercise-recommendation.service';
import { Exercise } from './exercise.entity';
import { ExerciseService } from './exercise.service';

@ApiBearerAuth()
@ApiTags('Exercise')
@Controller('exercises')
@UseGuards(AuthGuard)
@ApiOperationError()
export class ExerciseController {
  constructor(
    private readonly exerciseService: ExerciseService,
    private readonly exerciseRecommendationService: ExerciseRecommendationService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get Paginated Exercises',
    description: 'Retrieve paginated list of exercises',
  })
  @ApiOperationSuccess(PaginationExerciseResponseDTO, { isRaw: true })
  async paginate(
    @Query() dto: PaginationExercisePayloadDTO,
  ): Promise<HttpResponse> {
    return this.exerciseService.paginateExercises(dto);
  }

  @Get('recommend')
  @ApiOperation({
    summary: 'Get Exercise Recommendations',
    description:
      'Get exercise recommendations based on user health record and profile',
  })
  async recommend(@RequestUser() user: User): Promise<HttpResponse> {
    return this.exerciseRecommendationService.getRecommendations(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get Exercise Detail',
    description: 'Retrieve exercise details by ID',
  })
  @ApiOperationSuccess(Exercise)
  async getDetail(
    @Param() params: GetExerciseDetailPayloadDTO,
  ): Promise<HttpResponse> {
    return this.exerciseService.viewExerciseDetails(params.id);
  }
}
