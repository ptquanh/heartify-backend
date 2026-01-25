import { HttpResponse } from 'mvc-common-toolkit';

import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiOperationError,
  ApiOperationSuccess,
} from '@shared/decorators/api-response';
import { RequestUser } from '@shared/decorators/request-user';
import { AuthGuard } from '@shared/guards/auth.guard';
import { UserAuthProfile } from '@shared/interfaces';

import {
  CreateHealthRecordDto,
  HealthRecordPaginationDto,
  HealthRecordResponseDto,
} from './health-record.dto';
import { HealthRecordService } from './health-record.service';

@ApiBearerAuth()
@ApiTags('Health Record')
@Controller('health-records')
@UseGuards(AuthGuard)
@ApiOperationError()
export class HealthRecordController {
  constructor(private readonly healthRecordService: HealthRecordService) {}

  @Post()
  @ApiOperation({
    summary: 'Create Health Record',
    description: 'Create a new health record and perform risk assessment',
  })
  @ApiOperationSuccess(HealthRecordResponseDto)
  async createHealthRecord(
    @RequestUser() user: UserAuthProfile,
    @Body() dto: CreateHealthRecordDto,
  ): Promise<HttpResponse> {
    return this.healthRecordService.createHealthRecord(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get My Health Records',
    description: 'Retrieve all health records for the current user',
  })
  @ApiOperationSuccess(HealthRecordResponseDto)
  async paginateHealthRecords(
    @RequestUser() user: UserAuthProfile,
    @Query() dto: HealthRecordPaginationDto,
  ): Promise<any> {
    return this.healthRecordService.paginateHealthRecords(user.id, dto);
  }
}
