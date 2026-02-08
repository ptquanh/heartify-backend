import {
  RecommendationRequestDto,
  UserHealthRecordDto,
  UserPreferencesDto,
} from '@modules/food/dtos/recommendation.dto';
import { HealthRecord } from '@modules/health-record/health-record.entity';
import { UserProfile } from '@modules/user/entities/user-profile.entity';

export class FoodHelper {
  public static buildPayload(
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
      measurements: healthRecord.measurements as any, // assuming structure matches
      riskLevel: healthRecord.riskLevel,
      riskScore: Number(healthRecord.riskScore),
      riskPercentage: Number(healthRecord.riskPercentage),
      riskAlgorithm: healthRecord.riskAlgorithm,
      identifiedRiskFactors: healthRecord.identifiedRiskFactors as any[],
      isDiabetic: userProfile.isDiabetic,
      isTreatedHypertension: userProfile.isTreatedHypertension,
    };

    const userPreferencesDto: UserPreferencesDto = {
      id: userProfile.id,
      userId: userProfile.userId,
      isSmoker: userProfile.isSmoker,
      dateOfBirth: new Date(userProfile.dateOfBirth)
        .toISOString()
        .split('T')[0], // format as YYYY-MM-DD
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
      user_health_record: JSON.stringify(healthRecordDto),
      user_preferences: JSON.stringify(userPreferencesDto),
    };
  }
}
