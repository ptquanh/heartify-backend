import { v2 as cloudinary } from 'cloudinary';
import { OperationResult } from 'mvc-common-toolkit';

import { Inject, Injectable } from '@nestjs/common';

import { INJECTION_TOKEN } from '@shared/constants';
import { TTL_5_MINUTES } from '@shared/helpers/cache-ttl.helper';
import { generateSuccessResult } from '@shared/helpers/operation-result.helper';

import { GetSignatureDto } from './cloudinary.dto';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(INJECTION_TOKEN.CLOUDINARY_SERVICE)
    private readonly cloudinaryService: typeof cloudinary,
  ) {}

  getUploadSignature(dto: GetSignatureDto): OperationResult {
    const timestamp = Math.round(new Date().getTime() / 1000);

    const apiSecret = this.cloudinaryService.config().api_secret;

    const paramsToSign = {
      timestamp,
      folder: dto.folder,
      expire_at: timestamp + TTL_5_MINUTES,
    };

    const signature = this.cloudinaryService.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    return generateSuccessResult({
      folder: dto.folder,
      signature,
      timestamp,
      cloudName: this.cloudinaryService.config().cloud_name,
      apiKey: this.cloudinaryService.config().api_key,
      expireAt: timestamp + TTL_5_MINUTES,
    });
  }
}
