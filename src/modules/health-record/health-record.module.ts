import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RiskAssessmentModule } from '@modules/risk-assessment/risk-assessment.module';
import { UserModule } from '@modules/user/user.module';

import { HealthRecordController } from './health-record.controller';
import { HealthRecord } from './health-record.entity';
import { HealthRecordService } from './health-record.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([HealthRecord]),
    UserModule,
    RiskAssessmentModule,
  ],
  controllers: [HealthRecordController],
  providers: [HealthRecordService],
  exports: [HealthRecordService],
})
export class HealthRecordModule {}
