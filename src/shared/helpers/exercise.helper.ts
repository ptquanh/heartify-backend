import {
  ExerciseUserHealthRecordDto,
  ExerciseUserPreferencesDto,
  RecommendationRequestDto,
} from '@modules/exercise/dtos/recommendation.dto';
import { HealthRecord } from '@modules/health-record/health-record.entity';
import { UserProfile } from '@modules/user/entities/user-profile.entity';

export class ExerciseHelper {
  public static buildPayload(
    healthRecord: HealthRecord,
    userProfile: UserProfile,
  ): RecommendationRequestDto {
    // Helper to calculate energy level
    const calculateEnergyLevel = (routines: any[]): string => {
      if (!routines || routines.length === 0) return 'Low';
      // Simple logic: if any routine is high intensity or very active, return High
      // If medium, return Medium
      // Else Low
      const hasHigh = routines.some(
        (r) => r.intensity === 'high' || r.frequency === 'very_active',
      );
      if (hasHigh) return 'High';
      const hasMedium = routines.some(
        (r) => r.intensity === 'medium' || r.frequency === 'active',
      );
      if (hasMedium) return 'Medium';
      return 'Low';
    };

    const energyLevel = calculateEnergyLevel(userProfile.exerciseRoutines);

    const measurementsFn = (m: any) => {
      if (!m)
        return {
          bmi: 0,
          height: 0,
          weight: 0,
        };
      return {
        bmi: m.bmi || 0,
        height: m.height?.value || 0,
        weight: m.weight?.value || 0,
        waistCircumference: m.waistCircumference || 0,
      };
    };

    const healthRecordDto: ExerciseUserHealthRecordDto = {
      userId: healthRecord.userId,
      recordedAt: healthRecord.recordedAt.toISOString(),
      ageAtRecord: healthRecord.ageAtRecord,
      systolicBp: healthRecord.systolicBp,
      diastolicBp: healthRecord.diastolicBp,
      totalCholesterol: Number(healthRecord.totalCholesterol),
      hdlCholesterol: Number(healthRecord.hdlCholesterol),
      measurements: measurementsFn(healthRecord.measurements),
      riskLevel: healthRecord.riskLevel,
      riskScore: Number(healthRecord.riskScore),
      riskPercentage: Number(healthRecord.riskPercentage),
      riskAlgorithm: healthRecord.riskAlgorithm,
      identifiedRiskFactors:
        (healthRecord.identifiedRiskFactors as any[]) || [],
      isDiabetic: userProfile.isDiabetic,
      isTreatedHypertension: userProfile.isTreatedHypertension,
      isSmoker: userProfile.isSmoker,
    };

    const userPreferencesDto: ExerciseUserPreferencesDto = {
      gender: userProfile.gender,
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
      medicalConditions: userProfile.medications
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
    };

    return {
      energy_level: energyLevel,
      user_health_record: healthRecordDto,
      user_preferences: userPreferencesDto,
    };
  }
}
