import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { RiskLevel } from '@modules/risk-assessment/risk-assessment.constants';

import { PaginationDTO } from '@shared/dtos/pagination.dto';
import { BodyMetrics, HeightUnit, WeightUnit } from '@shared/interfaces';

export class MeasurementValueDto {
  @ApiProperty({ description: 'Value of measurement' })
  @IsNumber()
  value: number;

  @ApiProperty({ description: 'Unit of measurement' })
  @IsString()
  unit: string;
}

export class BodyMetricsDto implements BodyMetrics {
  @ApiPropertyOptional({ type: MeasurementValueDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MeasurementValueDto)
  weight?: {
    value: number;
    unit: WeightUnit;
  };

  @ApiPropertyOptional({ type: MeasurementValueDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MeasurementValueDto)
  height?: {
    value: number;
    unit: HeightUnit;
  };

  @ApiPropertyOptional({ example: 22.5 })
  @IsNumber()
  @IsOptional()
  bmi?: number;
}

export class CreateHealthRecordDto {
  @ApiProperty({ description: 'Systolic Blood Pressure', example: 120 })
  @IsNumber()
  @Min(50)
  @Max(250)
  systolicBp: number;

  @ApiPropertyOptional({ description: 'Diastolic Blood Pressure', example: 80 })
  @IsNumber()
  @IsOptional()
  @Min(30)
  @Max(150)
  diastolicBp: number;

  @ApiProperty({ description: 'Total Cholesterol (mg/dL)', example: 200 })
  @IsNumber()
  @Min(50)
  @Max(500)
  totalCholesterol: number;

  @ApiProperty({ description: 'HDL Cholesterol (mg/dL)', example: 50 })
  @IsNumber()
  @Min(10)
  @Max(150)
  hdlCholesterol: number;

  @ApiProperty({ description: 'Is Smoker', example: false })
  @IsBoolean()
  isSmoker: boolean;

  @ApiProperty({ description: 'Is Diabetic', example: false })
  @IsBoolean()
  isDiabetic: boolean;

  @ApiProperty({ description: 'Is Treated for Hypertension', example: false })
  @IsBoolean()
  isTreatedHypertension: boolean;

  @ApiPropertyOptional({ type: BodyMetricsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BodyMetricsDto)
  measurements?: BodyMetricsDto;
}

export class HealthRecordResponseDto extends CreateHealthRecordDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  recordedAt: Date;

  @ApiProperty()
  ageAtRecord: number;

  @ApiProperty({ enum: RiskLevel })
  riskLevel: RiskLevel;
}

export class HealthRecordPaginationDto extends PaginationDTO {
  @ApiPropertyOptional({
    enum: RiskLevel,
  })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;
}
