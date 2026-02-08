import {
  AuditService,
  CacheService,
  HttpRequestOption,
  HttpService,
  OperationResult,
  SET_CACHE_POLICY,
} from 'mvc-common-toolkit';
import { tryParseStringIntoCorrectData } from 'mvc-common-toolkit/dist/src/pkg/object-helper';

import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HealthRecordService } from '@modules/health-record/health-record.service';
import { UserService } from '@modules/user/user.service';

import { foodRecommendationCacheKey } from '@shared/cache-key';
import {
  ENV_KEY,
  ERR_CODE,
  HEADER_KEY,
  INJECTION_TOKEN,
} from '@shared/constants';
import { TTL_1_HOUR } from '@shared/helpers/cache-ttl.helper';
import { CryptoHelper } from '@shared/helpers/crypto.helper';
import { FoodHelper } from '@shared/helpers/food.helper';
import {
  generateInternalServerResult,
  generateNotFoundResult,
} from '@shared/helpers/operation-result.helper';
import { OutboundPartnerService } from '@shared/services/outbound-partner.service';

@Injectable()
export class FoodRecommendationService extends OutboundPartnerService {
  constructor(
    @Inject(INJECTION_TOKEN.HTTP_SERVICE)
    protected httpService: HttpService,

    @Inject(INJECTION_TOKEN.AUDIT_SERVICE)
    protected auditService: AuditService,

    @Inject(INJECTION_TOKEN.REDIS_SERVICE)
    protected cacheService: CacheService,

    private readonly healthRecordService: HealthRecordService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    super(httpService, auditService);
  }

  protected get partnerServerUrl(): string {
    return this.configService.getOrThrow<string>(
      ENV_KEY.PARTNER_FOOD_RECOMMENDATION_URL,
    );
  }

  protected partnerRequestOption(): HttpRequestOption {
    return {
      headers: {
        [HEADER_KEY.CONTENT_TYPE]: 'application/json',
      },
    };
  }

  async getRecommendations(userId: string): Promise<OperationResult> {
    const healthRecord = await this.healthRecordService.findOne(
      { userId },
      { order: { recordedAt: 'DESC' } },
    );

    if (!healthRecord) {
      return generateNotFoundResult(
        'Health record not found for user',
        ERR_CODE.HEALTH_RECORD_NOT_FOUND,
      );
    }

    const user = await this.userService.findOne(
      { id: userId },
      { relations: { profile: true } },
    );

    if (!user || !user.profile) {
      return generateNotFoundResult(
        'User profile not found for user',
        ERR_CODE.USER_PROFILE_NOT_FOUND,
      );
    }

    const payload = FoodHelper.buildPayload(healthRecord, user.profile);

    const filterHash = CryptoHelper.generateFilterHash(payload);
    const cacheKey = foodRecommendationCacheKey(userId, filterHash);

    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData) {
      return {
        success: true,
        data: tryParseStringIntoCorrectData(cachedData),
      };
    }

    const response = await this.sendToPartner('post', '/recommend', payload);
    if (!response.success) {
      return generateInternalServerResult();
    }

    const result = response.data;

    await this.cacheService.set(cacheKey, JSON.stringify(result), {
      policy: SET_CACHE_POLICY.WITH_TTL,
      value: TTL_1_HOUR,
    });

    return {
      success: true,
      data: result,
    };
  }
}
