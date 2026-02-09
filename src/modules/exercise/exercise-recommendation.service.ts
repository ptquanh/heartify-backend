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

// Reusing similar key pattern or creating new one?
// Wait, I should create a new cache key function or use a generic one.
// Let's assume I can reuse the pattern but change the prefix.
// "foodRecommendationCacheKey" probably produces "food_recommendation:..."
// I should define a new key or just use a string here if I can't modify cache-key.ts easily or don't want to.
// Let's modify cache-key.ts if possible, or just use a string literal for now to avoid too many context switches.
// Actually, `foodRecommendationCacheKey` is imported. Let's see if I can make an `exerciseRecommendationCacheKey`.
// I'll stick to a string literal construction for now: `exercise_recommendation:${userId}:${filterHash}`.

import {
  ENV_KEY,
  ERR_CODE,
  HEADER_KEY,
  INJECTION_TOKEN,
} from '@shared/constants';
import { TTL_1_HOUR } from '@shared/helpers/cache-ttl.helper';
import { CryptoHelper } from '@shared/helpers/crypto.helper';
import { ExerciseHelper } from '@shared/helpers/exercise.helper';
import {
  generateInternalServerResult,
  generateNotFoundResult,
} from '@shared/helpers/operation-result.helper';
import { OutboundPartnerService } from '@shared/services/outbound-partner.service';

@Injectable()
export class ExerciseRecommendationService extends OutboundPartnerService {
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
      ENV_KEY.PARTNER_EXERCISE_RECOMMENDATION_URL,
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

    const payload = ExerciseHelper.buildPayload(healthRecord, user.profile);

    const filterHash = CryptoHelper.generateFilterHash(payload);
    const cacheKey = `exercise_recommendation:${userId}:${filterHash}`;

    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData) {
      return {
        success: true,
        data: tryParseStringIntoCorrectData(cachedData),
      };
    }

    const response = await this.sendToPartner('post', '/plan', payload);
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
