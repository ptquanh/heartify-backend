import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Gender } from '@modules/risk-assessment/risk-assessment.constants';

export class MeasurementsDto {
  @IsNumber()
  height: number;

  @IsNumber()
  weight: number;

  @IsNumber()
  bmi: number;

  @IsOptional()
  @IsNumber()
  waistCircumference?: number;
}

export class UserHealthRecordDto {
  @IsString()
  userId: string;

  @IsString()
  recordedAt: string;

  @IsNumber()
  ageAtRecord: number;

  @IsNumber()
  systolicBp: number;

  @IsOptional()
  @IsNumber()
  diastolicBp?: number;

  @IsNumber()
  totalCholesterol: number;

  @IsNumber()
  hdlCholesterol: number;

  @IsBoolean()
  isSmoker: boolean;

  @IsBoolean()
  isDiabetic: boolean;

  @IsBoolean()
  isTreatedHypertension: boolean;

  @ValidateNested()
  @Type(() => MeasurementsDto)
  measurements: MeasurementsDto;

  @IsString()
  riskLevel: string;

  @IsNumber()
  riskScore: number;

  @IsNumber()
  riskPercentage: number;

  @IsString()
  riskAlgorithm: string;

  @IsArray()
  @IsString({ each: true })
  identifiedRiskFactors: string[];
}

export class MeasurementValueDto {
  @IsNumber()
  value: number;

  @IsString()
  unit: string;
}

export class LatestMeasurementsDto {
  @ValidateNested()
  @Type(() => MeasurementValueDto)
  weight: MeasurementValueDto;

  @ValidateNested()
  @Type(() => MeasurementValueDto)
  height: MeasurementValueDto;

  @IsNumber()
  bmi: number;
}

export class HealthConditionEntryDto {
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @IsOptional()
  @IsString()
  details?: string;
}

export class UserPreferencesDto {
  @IsString()
  id: string;

  @IsString()
  userId: string;

  @IsString()
  dateOfBirth: string;

  @IsString()
  gender: Gender;

  @IsString()
  country: string;

  @ValidateNested()
  @Type(() => LatestMeasurementsDto)
  latestMeasurements: LatestMeasurementsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HealthConditionEntryDto)
  allergies?: HealthConditionEntryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HealthConditionEntryDto)
  medicalConditions?: HealthConditionEntryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HealthConditionEntryDto)
  medications?: HealthConditionEntryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HealthConditionEntryDto)
  physicalLimitations?: HealthConditionEntryDto;

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;
}

export class RecommendationRequestDto {
  @ValidateNested()
  @Type(() => UserHealthRecordDto)
  user_health_record: UserHealthRecordDto;

  @ValidateNested()
  @Type(() => UserPreferencesDto)
  user_preferences: UserPreferencesDto;
}
