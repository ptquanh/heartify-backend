import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { LatestMeasurementsDto } from '@modules/food/dtos/recommendation.dto';
import { Gender } from '@modules/risk-assessment/risk-assessment.constants';

export {
  HealthConditionEntryDto,
  LatestMeasurementsDto,
  MeasurementValueDto,
  MeasurementsDto,
  UserHealthRecordDto,
  UserPreferencesDto,
} from '@modules/food/dtos/recommendation.dto';

export class ExerciseUserHealthRecordDto {
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

  @IsOptional()
  measurements: {
    bmi: number;
    height: number;
    weight: number;
    waistCircumference?: number;
  };

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

  @IsBoolean()
  isDiabetic: boolean;

  @IsBoolean()
  isTreatedHypertension: boolean;

  @IsBoolean()
  isSmoker: boolean;
}

export class ExerciseUserPreferencesDto {
  @IsString()
  gender: Gender;

  @ValidateNested()
  @Type(() => LatestMeasurementsDto)
  latestMeasurements: LatestMeasurementsDto;

  @IsOptional()
  medicalConditions?: {
    options: string[];
    details?: string;
  };

  @IsOptional()
  physicalLimitations?: {
    options: string[];
    details?: string;
  };
}

export class RecommendationRequestDto {
  @IsString()
  energy_level: string;

  @ValidateNested()
  @Type(() => ExerciseUserHealthRecordDto)
  user_health_record: ExerciseUserHealthRecordDto;

  @ValidateNested()
  @Type(() => ExerciseUserPreferencesDto)
  user_preferences: ExerciseUserPreferencesDto;
}
