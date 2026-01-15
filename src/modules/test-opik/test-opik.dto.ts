import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestOpikInputDto {
  @ApiProperty({ example: 'Hello Opik' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: 0.9 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  feedbackScore?: number;
}
