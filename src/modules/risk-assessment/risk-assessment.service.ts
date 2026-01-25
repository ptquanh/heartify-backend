import { OperationResult } from 'mvc-common-toolkit';

import { Injectable } from '@nestjs/common';

import {
  getASCVDCategory,
  getFraminghamCategory,
  getRangeKey,
} from '@shared/helpers/risk-assessment.helper';

import {
  ACC_AHA_TREATMENT_THRESHOLD,
  ASCVD_COEFFICIENTS,
  FRAMINGHAM_POINTS,
  Gender,
  HealthRiskFactor,
  HypertensionState,
  MolecularWeightOfCholesterol,
  RiskAssessmentAlgorithm,
  RiskLevel,
  Unit,
} from './risk-assessment.constants';
import {
  RiskAssessmentPayloadDto,
  RiskAssessmentResultDto,
} from './risk-assessment.dto';

@Injectable()
export class RiskAssessmentService {
  constructor() {}
  public calculateRisk(
    data: RiskAssessmentPayloadDto,
  ): OperationResult<RiskAssessmentResultDto> {
    const normalizedData = this.normalizeUnits(data);

    // 1. Youth (<20) -> Lifetime
    if (normalizedData.age < 20)
      return this.calculateYouthLifetimeRisk(normalizedData);

    // 2. ASCVD (40-79) - Best for this range
    if (normalizedData.age >= 40 && normalizedData.age <= 79)
      return this.calculateASCVD(normalizedData);

    // 3. Framingham (20-39) - Or fallback
    return this.calculateFramingham(normalizedData);
  }

  private normalizeUnits(
    data: RiskAssessmentPayloadDto,
  ): RiskAssessmentPayloadDto {
    const clone = { ...data };

    // Convert Total Cholesterol: 1 mmol/L = 38.67 mg/dL
    if (data.totalCholesterolUnit === Unit.MMOL_L) {
      clone.totalCholesterol =
        data.totalCholesterol * MolecularWeightOfCholesterol;
      clone.totalCholesterolUnit = Unit.MG_DL;
    }

    // Convert HDL: 1 mmol/L = 38.67 mg/dL
    if (data.hdlCholesterolUnit === Unit.MMOL_L) {
      clone.hdlCholesterol = data.hdlCholesterol * MolecularWeightOfCholesterol;
      clone.hdlCholesterolUnit = Unit.MG_DL;
    }

    return clone;
  }

  // --- ASCVD (POOLED COHORT EQUATIONS) ---
  private calculateASCVD(
    data: RiskAssessmentPayloadDto,
  ): OperationResult<RiskAssessmentResultDto> {
    const coeffs = ASCVD_COEFFICIENTS[data.gender];

    const lnAge = Math.log(data.age);
    const lnTotalChol = Math.log(data.totalCholesterol);
    const lnHdl = Math.log(data.hdlCholesterol);
    const lnSbp = Math.log(data.systolicBp);

    // 1. Base Sum
    let sum =
      lnAge * coeffs.lnAge +
      lnTotalChol * coeffs.lnTotalChol +
      lnHdl * coeffs.lnHdl;

    // 2. Blood Pressure
    if (data.isTreatedHypertension) {
      sum += lnSbp * coeffs.lnTreatedSbp;
      if (coeffs.interaction.lnAge_treatedSbp) {
        sum += lnAge * coeffs.interaction.lnAge_treatedSbp;
      }
    } else {
      sum += lnSbp * coeffs.lnUntreatedSbp;
      if (coeffs.interaction.lnAge_untreatedSbp) {
        sum += lnAge * coeffs.interaction.lnAge_untreatedSbp;
      }
    }

    // 3. Binary Factors
    if (data.isSmoker) {
      sum += coeffs.smoker;
      if (coeffs.interaction.lnAge_smoker) {
        sum += lnAge * coeffs.interaction.lnAge_smoker;
      }
    }
    if (data.isDiabetic) sum += coeffs.diabetes;

    // 4. Interactions (Standard)
    sum += lnAge * lnTotalChol * coeffs.interaction.lnAge_lnTotalChol;
    sum += lnAge * lnHdl * coeffs.interaction.lnAge_lnHdl;

    // 5. Risk Percentage
    // Risk = 1 - (BaselineSurvival ^ exp(Sum - MeanSum))
    const risk =
      1 - Math.pow(coeffs.baselineSurvival, Math.exp(sum - coeffs.meanSum));
    const percent = parseFloat((risk * 100).toFixed(2));

    const isHighRisk = percent >= ACC_AHA_TREATMENT_THRESHOLD;

    return {
      success: true,
      data: {
        riskScore: sum, // Raw score (log-odds related)
        riskPercentage: percent,
        isHighRisk,
        riskLevel: getASCVDCategory(percent),
        algorithmUsed: RiskAssessmentAlgorithm.ASCVD,
        riskFactors: this.getRiskFactors(data),
      },
    };
  }

  // --- FRAMINGHAM (10-Year Risk) ---
  private calculateFramingham(
    data: RiskAssessmentPayloadDto,
  ): OperationResult<RiskAssessmentResultDto> {
    let points = 0;
    const table =
      data.gender === Gender.MALE
        ? FRAMINGHAM_POINTS.MEN
        : FRAMINGHAM_POINTS.WOMEN;

    // 1. Age
    const ageKey = getRangeKey(data.age, Object.keys(table.AGE));
    points += table.AGE[ageKey] || 0;

    // 2. Cholesterol
    const cholAgeKey = getRangeKey(
      data.age,
      Object.keys(table.TOTAL_CHOLESTEROL),
    );
    const cholTable = table.TOTAL_CHOLESTEROL[cholAgeKey];
    if (cholTable) {
      const cholKey = getRangeKey(
        data.totalCholesterol,
        Object.keys(cholTable),
      );
      points += cholTable[cholKey] || 0;
    }

    // 3. Smoker
    if (data.isSmoker) {
      const smokerAgeKey = getRangeKey(data.age, Object.keys(table.SMOKER));
      points += table.SMOKER[smokerAgeKey] || 0;
    }

    // 4. HDL
    const hdlKey = getRangeKey(data.hdlCholesterol, Object.keys(table.HDL));
    points += table.HDL[hdlKey] || 0;

    // 5. Systolic BP
    const bpState = data.isTreatedHypertension
      ? HypertensionState.TREATED
      : HypertensionState.UNTREATED;
    const bpTable = table.SYSTOLIC_BP[bpState];
    const bpKey = getRangeKey(data.systolicBp, Object.keys(bpTable));
    points += bpTable[bpKey] || 0;

    // 6. Diabetes
    if (data.isDiabetic) {
      points += data.gender === Gender.MALE ? 2 : 4;
    }

    // Calculate Percent
    let percentString = table.DIAGNOSIS_PERCENT[points.toString()];
    if (!percentString) {
      if (points < 9 && data.gender === Gender.FEMALE) percentString = '<1';
      else if (points < 0 && data.gender === Gender.MALE) percentString = '<1';
      else if (points > 25) percentString = '>=30';
      else percentString = '0';
    }

    let percent = 0;
    if (percentString.includes('<')) percent = 0.5;
    else if (percentString.includes('>=')) percent = 30;
    else percent = parseFloat(percentString);

    const isHighRisk = percent >= 20;

    return {
      success: true,
      data: {
        riskScore: points,
        riskPercentage: percent,
        isHighRisk,
        riskLevel: getFraminghamCategory(percent),
        algorithmUsed: RiskAssessmentAlgorithm.FRAMINGHAM,
        riskFactors: this.getRiskFactors(data),
      },
    };
  }

  private calculateYouthLifetimeRisk(
    data: RiskAssessmentPayloadDto,
  ): OperationResult<RiskAssessmentResultDto> {
    let riskFactorsCount = 0;
    const riskFactors: HealthRiskFactor[] = [];

    // 1. Cholesterol
    if (data.totalCholesterol > 200) {
      riskFactorsCount++;
      riskFactors.push(HealthRiskFactor.HIGH_CHOLESTEROL);
    }
    // 2. BP
    if (data.systolicBp > 130) {
      riskFactorsCount++;
      riskFactors.push(HealthRiskFactor.HIGH_SYSTOLIC_BP);
    }
    // 3. Smoker
    if (data.isSmoker) {
      riskFactorsCount += 2;
      riskFactors.push(HealthRiskFactor.SMOKER);
    }
    // 4. Weight/BMI (if provided)
    if (data.weight && data.height) {
      const bmi = data.weight / Math.pow(data.height / 100, 2);
      if (bmi > 25) {
        riskFactorsCount++;
        riskFactors.push(HealthRiskFactor.OBESITY);
      }
    }

    let percent = 5; // Base
    if (riskFactorsCount === 1) percent = 20;
    else if (riskFactorsCount === 2) percent = 39;
    else if (riskFactorsCount >= 3) percent = 50;

    if (data.isSmoker && riskFactorsCount >= 3) percent = 65;

    return {
      success: true,
      data: {
        riskScore: riskFactorsCount,
        riskPercentage: percent,
        isHighRisk: percent > 30, // Arbitrary for lifetime
        riskLevel:
          riskFactorsCount >= 2
            ? RiskLevel.HIGH_LIFETIME
            : RiskLevel.LOW_LIFETIME,
        algorithmUsed: RiskAssessmentAlgorithm.YOUTH_LIFETIME,
        riskFactors,
      },
    };
  }

  private getRiskFactors(data: RiskAssessmentPayloadDto): HealthRiskFactor[] {
    const factors: HealthRiskFactor[] = [];
    if (data.isSmoker) factors.push(HealthRiskFactor.SMOKER);
    if (data.isDiabetic) factors.push(HealthRiskFactor.DIABETIC);
    if (data.isTreatedHypertension)
      factors.push(HealthRiskFactor.TREATED_HYPERTENSION);
    if (data.systolicBp >= 140) factors.push(HealthRiskFactor.HIGH_SYSTOLIC_BP);
    if (data.totalCholesterol >= 240)
      factors.push(HealthRiskFactor.HIGH_CHOLESTEROL);
    return factors;
  }
}
