import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiagnosisPayloadDto {
  @ApiPropertyOptional({})
  @IsString()
  @IsOptional()
  patientName?: string; // Optional, PII

  @ApiProperty({
    description: 'Age of the patient',
    example: 21,
  })
  @IsInt()
  @Min(20)
  @Max(79)
  age: number;

  @ApiProperty({
    description: 'Gender of the patient',
    example: 'Male',
  })
  @IsString()
  @IsIn(['Male', 'Female'])
  gender: 'Male' | 'Female';

  @ApiProperty({
    description: 'Is the patient a smoker?',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isSmoker: boolean;

  @ApiProperty({
    description: 'Is the patient diabetic?',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isDiabetic: boolean;

  @ApiProperty({
    description: 'Is the patient treated for hypertension?',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isTreatedHypertension: boolean;

  @ApiProperty({
    description: 'Systolic blood pressure of the patient',
    example: 120,
  })
  @IsInt()
  @Min(90)
  @Max(200)
  systolicBp: number;

  @ApiProperty({
    description: 'Total cholesterol of the patient',
    example: 200,
  })
  @IsInt()
  @Min(130)
  @Max(320)
  totalCholesterol: number;

  @ApiProperty({
    description: 'HDL cholesterol of the patient',
    example: 40,
  })
  @IsInt()
  @Min(20)
  @Max(100)
  hdlCholesterol: number;
}

export class DiagnosisResultDto {
  @ApiProperty({
    description: 'Diagnosis percentage of the patient',
    example: 20,
  })
  diagnosisPercent: number;

  @ApiProperty({
    description: 'Diagnosis points of the patient',
    example: 20,
  })
  points: number;

  @ApiProperty({
    description: 'Diagnosis category of the patient',
    example: 'Low',
  })
  diagnosisCategory: 'Low' | 'Moderate' | 'High';
}
