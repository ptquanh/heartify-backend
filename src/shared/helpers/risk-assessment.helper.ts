import {
  RiskAssessmentAlgorithm,
  RiskLevel,
} from '@modules/risk-assessment/risk-assessment.constants';

export const getRiskAssessmentAlgorithm = (
  age: number,
): RiskAssessmentAlgorithm => {
  if (age < 20) return RiskAssessmentAlgorithm.YOUTH_LIFETIME;
  if (age >= 40 && age <= 79) return RiskAssessmentAlgorithm.ASCVD;
  return RiskAssessmentAlgorithm.FRAMINGHAM;
};

export const getRiskLevelByAlgorithm = (
  percent: number,
  algorithm: RiskAssessmentAlgorithm,
): RiskLevel => {
  switch (algorithm) {
    case RiskAssessmentAlgorithm.ASCVD:
      return getASCVDCategory(percent);
    case RiskAssessmentAlgorithm.FRAMINGHAM:
      return getFraminghamCategory(percent);
    default:
      return RiskLevel.LOW;
  }
};

export const getASCVDCategory = (percent: number): RiskLevel => {
  if (percent < 5) return RiskLevel.LOW; // <5%
  if (percent < 7.5) return RiskLevel.BORDERLINE; // 5 - 7.5%
  if (percent < 20) return RiskLevel.MODERATE; // 7.5 - 20%
  return RiskLevel.HIGH; // >=20%
};

export const getFraminghamCategory = (percent: number): RiskLevel => {
  if (percent < 10) return RiskLevel.LOW;
  if (percent < 20) return RiskLevel.MODERATE;
  return RiskLevel.HIGH;
};

export const getRangeKey = (value: number, keys: string[]): string => {
  for (const key of keys) {
    if (key.includes('-')) {
      const [min, max] = key.split('-').map(Number);
      if (value >= min && value <= max) return key;
    } else if (key.startsWith('<')) {
      const max = Number(key.substring(1));
      if (value < max) return key;
    } else if (key.startsWith('>=')) {
      const min = Number(key.substring(2));
      if (value >= min) return key;
    } else if (key.startsWith('>')) {
      const min = Number(key.substring(1));
      if (value > min) return key;
    } else {
      if (Number(key) === value) return key;
    }
  }
  return keys[keys.length - 1];
};
