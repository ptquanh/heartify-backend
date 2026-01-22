import { EncryptionUtil } from 'src/shared/utils/encryption.util';

import { Module } from '@nestjs/common';

import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisService } from './diagnosis.service';

@Module({
  imports: [],
  controllers: [DiagnosisController],
  providers: [DiagnosisService, EncryptionUtil],
  exports: [DiagnosisService],
})
export class DiagnosisModule {}
