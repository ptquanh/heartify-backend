import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthRecordModule } from '@modules/health-record/health-record.module';
import { UserModule } from '@modules/user/user.module';

import { ExerciseRecommendationService } from './exercise-recommendation.service';
import { ExerciseController } from './exercise.controller';
import { Exercise } from './exercise.entity';
import { ExerciseService } from './exercise.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exercise]),
    HealthRecordModule,
    UserModule,
  ],
  controllers: [ExerciseController],
  providers: [ExerciseService, ExerciseRecommendationService],
  exports: [ExerciseService],
})
export class ExerciseModule {}
