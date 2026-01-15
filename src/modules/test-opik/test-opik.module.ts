import { Module } from '@nestjs/common';

import { TestOpikController } from './test-opik.controller';
import { TestOpikService } from './test-opik.service';

@Module({
  controllers: [TestOpikController],
  providers: [TestOpikService],
})
export class TestOpikModule {}
