import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthRecord } from '@modules/health-record/health-record.entity';
import { UserModule } from '@modules/user/user.module';

import { RiskAssessmentController } from './risk-assessment.controller';
import { RiskAssessmentService } from './risk-assessment.service';

@Module({
  imports: [TypeOrmModule.forFeature([HealthRecord]), UserModule],
  controllers: [RiskAssessmentController],
  providers: [RiskAssessmentService],
  exports: [RiskAssessmentService],
})
export class RiskAssessmentModule {}
