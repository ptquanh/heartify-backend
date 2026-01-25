import { HttpResponse } from 'mvc-common-toolkit';

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiOperationError,
  ApiOperationSuccess,
} from '@shared/decorators/api-response';
import { AuthGuard } from '@shared/guards/auth.guard';

import {
  RiskAssessmentPayloadDto,
  RiskAssessmentResultDto,
} from './risk-assessment.dto';
import { RiskAssessmentService } from './risk-assessment.service';

@ApiBearerAuth()
@ApiTags('Risk Assessment')
@Controller('risk-assessments')
@UseGuards(AuthGuard)
@ApiOperationError()
export class RiskAssessmentController {
  constructor(private readonly riskAssessmentService: RiskAssessmentService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate Cardiovascular Risk',
    description: 'Calculates risk based on age, gender, cholesterol, BP, etc.',
  })
  @ApiOperationSuccess(RiskAssessmentResultDto)
  async calculateRisk(
    @Body() dto: RiskAssessmentPayloadDto,
  ): Promise<HttpResponse> {
    return this.riskAssessmentService.calculateRisk(dto);
  }
}
