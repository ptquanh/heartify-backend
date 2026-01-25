import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  Gender,
  HealthRiskFactor,
  RiskAssessmentAlgorithm,
  RiskLevel,
  Unit,
} from './risk-assessment.constants';

export class RiskAssessmentPayloadDto {
  @ApiProperty({ description: 'Age of the patient', example: 45 })
  @IsInt()
  @Min(20)
  @Max(79)
  age: number;

  @ApiProperty({ description: 'Gender', enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: 'Is Smoker', example: false })
  @IsBoolean()
  isSmoker: boolean;

  @ApiProperty({ description: 'Is Diabetic', example: false })
  @IsBoolean()
  isDiabetic: boolean;

  @ApiProperty({ description: 'Is Treated for Hypertension', example: false })
  @IsBoolean()
  isTreatedHypertension: boolean;

  @ApiProperty({ description: 'Systolic Blood Pressure', example: 120 })
  @IsNumber()
  @Min(90)
  @Max(200)
  systolicBp: number;

  @ApiProperty({ description: 'Total Cholesterol', example: 200 })
  @IsNumber()
  @Min(100)
  @Max(400)
  totalCholesterol: number;

  @ApiProperty({
    description: 'Unit for Total Cholesterol',
    enum: Unit,
    default: Unit.MG_DL,
    required: false,
  })
  @IsEnum(Unit)
  @IsOptional()
  totalCholesterolUnit?: Unit = Unit.MG_DL;

  @ApiProperty({ description: 'HDL Cholesterol', example: 50 })
  @IsNumber()
  @Min(20)
  @Max(120)
  hdlCholesterol: number;

  @ApiProperty({
    description: 'Unit for HDL Cholesterol',
    enum: Unit,
    default: Unit.MG_DL,
    required: false,
  })
  @IsEnum(Unit)
  @IsOptional()
  hdlCholesterolUnit?: Unit = Unit.MG_DL;

  @ApiPropertyOptional({
    description: 'Weight in kg (for Youth check)',
    example: 70,
  })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({
    description: 'Height in cm (for Youth check)',
    example: 175,
  })
  @IsNumber()
  @IsOptional()
  height?: number;
}

export class RiskAssessmentResultDto {
  @ApiProperty({ description: 'Risk Score (Points)' })
  riskScore: number;

  @ApiProperty({ description: 'Risk Percentage (0-100)' })
  riskPercentage: number;

  @ApiProperty({ description: 'Is High Risk?' })
  isHighRisk: boolean;

  @ApiProperty({ description: 'Risk Level Category', enum: RiskLevel })
  riskLevel: RiskLevel;

  @ApiProperty({ description: 'Algorithm Used' })
  algorithmUsed: RiskAssessmentAlgorithm;

  @ApiPropertyOptional({
    description: 'Risk Factors Identified',
    enum: HealthRiskFactor,
    isArray: true,
  })
  riskFactors?: HealthRiskFactor[];
}
