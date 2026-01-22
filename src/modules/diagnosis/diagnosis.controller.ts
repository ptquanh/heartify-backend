import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiOperationError,
  ApiOperationSuccess,
} from '@shared/decorators/api-response';

import { DiagnosisPayloadDto, DiagnosisResultDto } from './diagnosis.dto';
import { DiagnosisService } from './diagnosis.service';

@ApiTags('Diagnosis Assessment')
@Controller('diagnosis')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate Diagnosis, Encrypt PII, and Save Record',
  })
  @ApiOperationSuccess(DiagnosisResultDto)
  @ApiOperationError()
  async calculate(
    @Body() dto: DiagnosisPayloadDto,
  ): Promise<DiagnosisResultDto> {
    return this.diagnosisService.calculateAndSaveDiagnosis(dto);
  }

  @Post('simulate')
  @ApiOperation({
    summary: 'Simulate Diagnosis without saving (for What-If scenarios)',
  })
  @ApiOperationSuccess(DiagnosisResultDto)
  @ApiOperationError()
  async simulate(
    @Body() dto: DiagnosisPayloadDto,
  ): Promise<DiagnosisResultDto> {
    return this.diagnosisService.simulateDiagnosis(dto);
  }
}
