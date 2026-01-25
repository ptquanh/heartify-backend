import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { BodyMetricsDto } from '@modules/health-record/health-record.dto';
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

export class UpdateUserProfileDto {
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

  @ApiPropertyOptional({ type: BodyMetricsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BodyMetricsDto)
  latestMeasurements?: BodyMetrics;
}
