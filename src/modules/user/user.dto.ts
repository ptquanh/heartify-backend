import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { BodyMetricsDTO } from '@modules/health-record/health-record.dto';
import { Gender } from '@modules/risk-assessment/risk-assessment.constants';

import {
  OnlyTextAndNumbers,
  TrimAndLowercase,
} from '@shared/decorators/sanitize-input';
import { BodyMetrics } from '@shared/interfaces';

export class VerifyUniquenessUserDTO {
  @IsOptional()
  @IsEmail()
  @TrimAndLowercase()
  email: string;

  @IsOptional()
  @OnlyTextAndNumbers({
    includeWhitespaces: false,
    onlyASCII: true,
    throwOnError: true,
    allowedSymbols: false,
  })
  @TrimAndLowercase()
  username: string;
}

export class HealthConditionEntryDTO {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  details?: string;
}

export class UpdateUserProfileDTO {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ example: 'VNM' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ type: BodyMetricsDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => BodyMetricsDTO)
  latestMeasurements?: BodyMetrics;

  @ApiPropertyOptional({ type: HealthConditionEntryDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthConditionEntryDTO)
  allergies?: HealthConditionEntryDTO;

  @ApiPropertyOptional({ type: HealthConditionEntryDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthConditionEntryDTO)
  medicalConditions?: HealthConditionEntryDTO;

  @ApiPropertyOptional({ type: HealthConditionEntryDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthConditionEntryDTO)
  medications?: HealthConditionEntryDTO;

  @ApiPropertyOptional({ type: HealthConditionEntryDTO })
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthConditionEntryDTO)
  physicalLimitations?: HealthConditionEntryDTO;
}
