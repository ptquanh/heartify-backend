import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

import { RiskLevel } from '@modules/risk-assessment/risk-assessment.constants';

import { HEIGHT_UNIT, WEIGHT_UNIT } from '@shared/constants';
import { PaginationDTO } from '@shared/dtos/pagination.dto';
import { BodyMetrics } from '@shared/interfaces';

import { HealthRecordType } from './health-record.entity';

export class MeasurementValueDTO {
  @ApiProperty({ description: 'Value of measurement' })
  @IsNumber()
  value: number;

  @ApiProperty({ description: 'Unit of measurement' })
  @IsString()
  unit: string;
}

export class BodyMetricsDTO implements BodyMetrics {
  @ApiPropertyOptional({ type: MeasurementValueDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => MeasurementValueDTO)
  weight?: {
    value: number;
    unit: WEIGHT_UNIT;
  };

  @ApiPropertyOptional({ type: MeasurementValueDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => MeasurementValueDTO)
  height?: {
    value: number;
    unit: HEIGHT_UNIT;
  };

  @ApiPropertyOptional({ example: 22.5 })
  @IsNumber()
  @IsOptional()
  bmi?: number;
}

export class CreateHealthRecordDTO {
  @ApiPropertyOptional({
    description: 'Health Record Name',
  })
  @IsString()
  @IsOptional()
  healthRecordName?: string;

  @ApiPropertyOptional({
    description: 'Medical Facility Name',
  })
  @IsString()
  @IsOptional()
  medicalFacilityName?: string;

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

  @ApiPropertyOptional({ type: BodyMetricsDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => BodyMetricsDTO)
  measurements?: BodyMetricsDTO;

  @ApiProperty({
    description: 'Health Record Type',
  })
  @IsEnum(HealthRecordType)
  @IsNotEmpty()
  healthRecordType: HealthRecordType;

  @ApiPropertyOptional({
    description: 'Reason',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Doctor Name',
  })
  @IsString()
  @IsOptional()
  doctorName?: string;
}

export class UpdateHealthRecordDTO extends PartialType(CreateHealthRecordDTO) {}

export class HealthRecordResponseDTO extends CreateHealthRecordDTO {
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

export class HealthRecordPaginationDTO extends PaginationDTO {
  @ApiPropertyOptional({
    enum: RiskLevel,
  })
  @IsOptional()
  @IsEnum(RiskLevel)
  riskLevel?: RiskLevel;
}
