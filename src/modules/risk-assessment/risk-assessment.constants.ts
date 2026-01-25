export enum RiskLevel {
  LOW = 'low',
  BORDERLINE = 'borderline',
  MODERATE = 'moderate',
  HIGH = 'high',
  HIGH_LIFETIME = 'high_lifetime',
  LOW_LIFETIME = 'low_lifetime',
}

export enum RiskAssessmentAlgorithm {
  YOUTH_LIFETIME = 'youth_lifetime',
  ASCVD = 'ascvd',
  FRAMINGHAM = 'framingham',
}

export const MolecularWeightOfCholesterol = 38.67;

export const ACC_AHA_TREATMENT_THRESHOLD = 7.5;

export enum HealthRiskFactor {
  SMOKER = 'smoker',
  DIABETIC = 'diabetic',
  TREATED_HYPERTENSION = 'treated_hypertension',
  HIGH_SYSTOLIC_BP = 'high_systolic_bp',
  HIGH_CHOLESTEROL = 'high_cholesterol',
  OBESITY = 'obesity',
  LOW_HDL = 'low_hdl',
  AGE_RISK = 'age_risk',
}

export enum Unit {
  MMOL_L = 'mmol/L',
  MG_DL = 'mg/dL',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum HypertensionState {
  UNTREATED = 'untreated',
  TREATED = 'treated',
}

export const ASCVD_COEFFICIENTS = {
  [Gender.MALE]: {
    lnAge: 17.114,
    lnTotalChol: 0.94,
    lnHdl: -18.92,
    lnTreatedSbp: 29.291,
    lnUntreatedSbp: 27.82,
    smoker: 0.691,
    diabetes: 0.874,
    interaction: {
      lnAge_lnTotalChol: -3.862,
      lnAge_lnHdl: 4.475,
      lnAge_smoker: 0,
      lnAge_treatedSbp: -6.087,
      lnAge_untreatedSbp: -6.087,
    },
    baselineSurvival: 0.9533,
    meanSum: 61.18,
  },
  [Gender.FEMALE]: {
    lnAge: -29.799,
    lnTotalChol: 13.54,
    lnHdl: -13.578,
    lnTreatedSbp: 2.019,
    lnUntreatedSbp: 1.957,
    smoker: 7.574,
    diabetes: 0.661,
    interaction: {
      lnAge_lnTotalChol: -3.114,
      lnAge_lnHdl: 3.149,
      lnAge_smoker: -1.665,
      lnAge_treatedSbp: 0,
      lnAge_untreatedSbp: 0,
    },
    baselineSurvival: 0.9665,
    meanSum: -29.18,
  },
};

export const FRAMINGHAM_POINTS = {
  MEN: {
    AGE: {
      '20-34': -9,
      '35-39': -4,
      '40-44': 0,
      '45-49': 3,
      '50-54': 6,
      '55-59': 8,
      '60-64': 10,
      '65-69': 11,
      '70-74': 12,
      '75-79': 13,
    },
    TOTAL_CHOLESTEROL: {
      '20-39': {
        '<160': 0,
        '160-199': 4,
        '200-239': 7,
        '240-279': 9,
        '>=280': 11,
      },
      '40-49': {
        '<160': 0,
        '160-199': 3,
        '200-239': 5,
        '240-279': 6,
        '>=280': 8,
      },
      '50-59': {
        '<160': 0,
        '160-199': 2,
        '200-239': 3,
        '240-279': 4,
        '>=280': 5,
      },
      '60-69': {
        '<160': 0,
        '160-199': 1,
        '200-239': 1,
        '240-279': 2,
        '>=280': 3,
      },
      '70-79': {
        '<160': 0,
        '160-199': 0,
        '200-239': 0,
        '240-279': 1,
        '>=280': 1,
      },
    },
    SMOKER: {
      '20-39': 8,
      '40-49': 5,
      '50-59': 3,
      '60-69': 1,
      '70-79': 1,
    },
    HDL: {
      '>=60': -1,
      '50-59': 0,
      '40-49': 1,
      '<40': 2,
    },
    SYSTOLIC_BP: {
      [HypertensionState.UNTREATED]: {
        '<120': 0,
        '120-129': 0,
        '130-139': 1,
        '140-159': 1,
        '>=160': 2,
      },
      [HypertensionState.TREATED]: {
        '<120': 0,
        '120-129': 1,
        '130-139': 2,
        '140-159': 2,
        '>=160': 3,
      },
    },
    DIAGNOSIS_PERCENT: {
      '<0': '<1',
      '0': '<1',
      '1': '<1',
      '2': '<1',
      '3': '<1',
      '4': '<1',
      '5': '<1',
      '6': '<1',
      '7': '<1',
      '8': '<1',
      '9': '1',
      '10': '1',
      '11': '1',
      '12': '1',
      '13': '2',
      '14': '2',
      '15': '3',
      '16': '4',
      '17': '5',
      '18': '6',
      '19': '8',
      '20': '11',
      '21': '14',
      '22': '17',
      '23': '22',
      '24': '27',
      '25': '>=30',
      '>25': '>=30',
    },
  },
  WOMEN: {
    AGE: {
      '20-34': -7,
      '35-39': -3,
      '40-44': 0,
      '45-49': 3,
      '50-54': 6,
      '55-59': 8,
      '60-64': 10,
      '65-69': 12,
      '70-74': 14,
      '75-79': 16,
    },
    TOTAL_CHOLESTEROL: {
      '20-39': {
        '<160': 0,
        '160-199': 4,
        '200-239': 8,
        '240-279': 11,
        '>=280': 13,
      },
      '40-49': {
        '<160': 0,
        '160-199': 3,
        '200-239': 6,
        '240-279': 8,
        '>=280': 10,
      },
      '50-59': {
        '<160': 0,
        '160-199': 2,
        '200-239': 4,
        '240-279': 5,
        '>=280': 7,
      },
      '60-69': {
        '<160': 0,
        '160-199': 1,
        '200-239': 2,
        '240-279': 3,
        '>=280': 4,
      },
      '70-79': {
        '<160': 0,
        '160-199': 1,
        '200-239': 1,
        '240-279': 2,
        '>=280': 2,
      },
    },
    SMOKER: {
      '20-39': 9,
      '40-49': 7,
      '50-59': 4,
      '60-69': 2,
      '70-79': 1,
    },
    HDL: {
      '>=60': -1,
      '50-59': 0,
      '40-49': 1,
      '<40': 2,
    },
    // FIX HERE: Tương tự cho Nữ
    SYSTOLIC_BP: {
      [HypertensionState.UNTREATED]: {
        '<120': 0,
        '120-129': 1,
        '130-139': 2,
        '140-159': 3,
        '>=160': 4,
      },
      [HypertensionState.TREATED]: {
        '<120': 0,
        '120-129': 3,
        '130-139': 4,
        '140-159': 5,
        '>=160': 6,
      },
    },
    DIAGNOSIS_PERCENT: {
      '<9': '<1',
      '9': '1',
      '10': '1',
      '11': '1',
      '12': '1',
      '13': '2',
      '14': '2',
      '15': '3',
      '16': '4',
      '17': '5',
      '18': '6',
      '19': '8',
      '20': '11',
      '21': '14',
      '22': '17',
      '23': '22',
      '24': '27',
      '25': '>=30',
      '>25': '>=30',
    },
  },
};
