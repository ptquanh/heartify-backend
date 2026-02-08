import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HealthRecordModule } from '@modules/health-record/health-record.module';
import { UserModule } from '@modules/user/user.module';

import { FoodRecommendationService } from './food-recommendation.service';
import { FoodController } from './food.controller';
import { Food } from './food.entity';
import { FoodService } from './food.service';

@Module({
  imports: [TypeOrmModule.forFeature([Food]), UserModule, HealthRecordModule],
  controllers: [FoodController],
  providers: [FoodService, FoodRecommendationService],
  exports: [FoodService],
})
export class FoodModule {}
