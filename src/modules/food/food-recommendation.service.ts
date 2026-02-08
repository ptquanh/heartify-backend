import {
  AuditService,
  HttpRequestOption,
  HttpService,
} from 'mvc-common-toolkit';

import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { HealthRecord } from '@modules/health-record/health-record.entity';
import { HealthRecordService } from '@modules/health-record/health-record.service';
import { UserProfile } from '@modules/user/entities/user-profile.entity';
import { UserService } from '@modules/user/user.service';

import { APP_ACTION, INJECTION_TOKEN } from '@shared/constants';
import { OutboundPartnerService } from '@shared/services/outbound-partner.service';

import {
  RecommendationRequestDto,
  UserHealthRecordDto,
  UserPreferencesDto,
} from './dtos/recommendation.dto';

@Injectable()
export class FoodRecommendationService extends OutboundPartnerService {
  constructor(
    @Inject(INJECTION_TOKEN.HTTP_SERVICE)
    protected httpService: HttpService,

    @Inject(INJECTION_TOKEN.AUDIT_SERVICE)
    protected auditService: AuditService,

    private readonly healthRecordService: HealthRecordService,
    private readonly userService: UserService,
  ) {
    super(httpService, auditService);
  }

  // TODO: Move to config
  protected get partnerServerUrl(): string {
    return 'https://g28p3uvjsx.us-east-1.awsapprunner.com';
  }

  protected partnerRequestOption(): HttpRequestOption {
    return {
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }

  async getRecommendations(userId: string) {
    const healthRecord = await this.healthRecordService.model.findOne({
      where: { userId },
      order: { recordedAt: 'DESC' },
    });

    if (!healthRecord) {
      throw new NotFoundException('Health record not found for user');
    }

    const user = await this.userService.findOne(
      { id: userId },
      { relations: { profile: true } },
    );

    if (!user || !user.profile) {
      throw new NotFoundException('User profile not found for user');
    }

    const payload = this.buildPayload(healthRecord, user.profile);

    const response = await this.sendToPartner('post', '/recommend', payload, {
      appAction: APP_ACTION.SEND_TO_PARTNER, // You might want to define a specific action constant
    });

    return response;
  }

  private buildPayload(
    healthRecord: HealthRecord,
    userProfile: UserProfile,
  ): RecommendationRequestDto {
    const healthRecordDto: UserHealthRecordDto = {
      userId: healthRecord.userId,
      recordedAt: healthRecord.recordedAt.toISOString(),
      ageAtRecord: healthRecord.ageAtRecord,
      systolicBp: healthRecord.systolicBp,
      diastolicBp: healthRecord.diastolicBp,
      totalCholesterol: Number(healthRecord.totalCholesterol),
      hdlCholesterol: Number(healthRecord.hdlCholesterol),
      isSmoker: healthRecord.isSmoker,
      isDiabetic: healthRecord.isDiabetic,
      isTreatedHypertension: healthRecord.isTreatedHypertension,
      measurements: healthRecord.measurements as any, // assuming structure matches
      riskLevel: healthRecord.riskLevel,
      riskScore: Number(healthRecord.riskScore),
      riskPercentage: Number(healthRecord.riskPercentage),
      riskAlgorithm: healthRecord.riskAlgorithm,
      identifiedRiskFactors: healthRecord.identifiedRiskFactors as any[],
    };

    const userPreferencesDto: UserPreferencesDto = {
      id: userProfile.id,
      userId: userProfile.userId,
      dateOfBirth: userProfile.dateOfBirth.toISOString().split('T')[0], // format as YYYY-MM-DD
      gender: userProfile.gender,
      country: userProfile.country,
      latestMeasurements: {
        weight: {
          value: userProfile.latestMeasurements?.weight?.value || 0,
          unit: userProfile.latestMeasurements?.weight?.unit || 'kg',
        },
        height: {
          value: userProfile.latestMeasurements?.height?.value || 0,
          unit: userProfile.latestMeasurements?.height?.unit || 'cm',
        },
        bmi: userProfile.latestMeasurements?.bmi || 0,
      },
      allergies: userProfile.allergies
        ? {
            options: userProfile.allergies.options,
            details: userProfile.allergies.details,
          }
        : undefined,
      medicalConditions: userProfile.medicalConditions
        ? {
            options: userProfile.medicalConditions.options,
            details: userProfile.medicalConditions.details,
          }
        : undefined,
      medications: userProfile.medications
        ? {
            options: userProfile.medications.options,
            details: userProfile.medications.details,
          }
        : undefined,
      physicalLimitations: userProfile.physicalLimitations
        ? {
            options: userProfile.physicalLimitations.options,
            details: userProfile.physicalLimitations.details,
          }
        : undefined,
      createdAt: userProfile.createdAt.toISOString(),
      updatedAt: userProfile.updatedAt.toISOString(),
    };

    return {
      user_health_record: healthRecordDto,
      user_preferences: userPreferencesDto,
    };
  }
}
