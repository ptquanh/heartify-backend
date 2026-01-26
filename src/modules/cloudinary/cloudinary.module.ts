import { v2 as cloudinary } from 'cloudinary';

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserModule } from '@modules/user/user.module';

import { ENV_KEY, INJECTION_TOKEN } from '@shared/constants';

import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryService } from './cloudinary.service';

export const CloudinaryProvider = {
  provide: INJECTION_TOKEN.CLOUDINARY_SERVICE,
  useFactory: (config: ConfigService) => {
    cloudinary.config({
      cloud_name: config.getOrThrow(ENV_KEY.CLOUDINARY_CLOUD_NAME),
      api_key: config.getOrThrow(ENV_KEY.CLOUDINARY_API_KEY),
      api_secret: config.getOrThrow(ENV_KEY.CLOUDINARY_API_SECRET),
    });
    return cloudinary;
  },
  inject: [ConfigService],
};

@Module({
  imports: [UserModule],
  controllers: [CloudinaryController],
  providers: [CloudinaryService, CloudinaryProvider],
  exports: [CloudinaryService, CloudinaryProvider],
})
export class CloudinaryModule {}
