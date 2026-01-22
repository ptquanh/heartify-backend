import { EncryptionUtil } from 'src/shared/utils/encryption.util';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosisAssessment } from './entities/diagnosis-assessment.entity';
import { HealthRecord } from './entities/health-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HealthRecord, DiagnosisAssessment])],
  controllers: [DiagnosisController],
  providers: [DiagnosisService, EncryptionUtil],
  exports: [DiagnosisService],
})
export class DiagnosisModule {}
