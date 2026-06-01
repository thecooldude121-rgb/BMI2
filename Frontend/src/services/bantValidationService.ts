export interface BantFieldData {
  status: string | null;
  [key: string]: any;
}

export interface BantData {
  budget: BantFieldData;
  authority: BantFieldData;
  need: BantFieldData;
  timeline: BantFieldData;
}

export interface ValidationMessage {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  blockQualification: boolean;
  actions: string[];
}

export interface ValidationResult {
  valid: boolean;
  validationType: 'noBantFilled' | 'partialBant' | 'lowBantScore' | 'complete';
  message: ValidationMessage | null;
  missingFields?: string[];
  bantScore?: number;
  filledFieldsCount?: number;
}

export interface BantFieldDetail {
  name: string;
  label: string;
  completed: boolean;
  score: number;
  maxScore: number;
  displayValue?: string;
}

export const validationRules = {
  minBantScore: 0,
  minBantFieldsFilled: 1,
  warningThreshold: 15,
  recommendedMinimum: 15,
  maxScore: 20,

  messages: {
    noBantFilled: {
      title: "⚠️ INCOMPLETE QUALIFICATION",
      message: "You haven't completed the BANT assessment.",
      severity: "error" as const,
      blockQualification: true,
      actions: ["complete_bant", "save_draft"]
    },
    partialBant: {
      title: "⚠️ PARTIAL BANT ASSESSMENT",
      message: "Your BANT assessment is incomplete.",
      severity: "warning" as const,
      blockQualification: false,
      actions: ["qualify_anyway", "complete_assessment", "save_draft"]
    },
    lowBantScore: {
      title: "⚠️ LOW BANT SCORE",
      message: "This lead has a low BANT score (below 50%).",
      severity: "warning" as const,
      blockQualification: false,
      actions: ["qualify_anyway", "review_assessment", "disqualify"]
    }
  }
};

const scoreMap: { [key: string]: { [status: string]: number } } = {
  budget: { confirmed: 5, likely: 4, unknown: 2 },
  authority: { decision_maker: 5, influencer: 4, end_user: 2 },
  need: { urgent: 5, important: 4, nice_to_have: 2 },
  timeline: { immediate: 5, short_term: 4, long_term: 2 }
};

const displayValueMap: { [key: string]: { [status: string]: string } } = {
  budget: {
    confirmed: 'Confirmed',
    likely: 'Likely',
    unknown: 'Unknown'
  },
  authority: {
    decision_maker: 'Decision Maker',
    influencer: 'Influencer',
    end_user: 'End User'
  },
  need: {
    urgent: 'Urgent',
    important: 'Important',
    nice_to_have: 'Nice to have'
  },
  timeline: {
    immediate: 'Immediate (0-30 days)',
    short_term: 'Short-term (1-3 mo)',
    long_term: 'Long-term (3-6 mo)'
  }
};

export const calculateBantScore = (bantData: BantData): number => {
  let score = 0;

  const fields = ['budget', 'authority', 'need', 'timeline'] as const;

  fields.forEach(field => {
    const status = bantData[field]?.status;
    if (status && scoreMap[field]?.[status]) {
      score += scoreMap[field][status];
    }
  });

  return score;
};

export const getFilledFieldsCount = (bantData: BantData): number => {
  const fields = ['budget', 'authority', 'need', 'timeline'] as const;
  return fields.filter(field => {
    const status = bantData[field]?.status;
    return status && status !== '';
  }).length;
};

export const getMissingFields = (bantData: BantData): string[] => {
  const fields = [
    { key: 'budget', label: 'Budget' },
    { key: 'authority', label: 'Authority' },
    { key: 'need', label: 'Need' },
    { key: 'timeline', label: 'Timeline' }
  ];

  return fields
    .filter(field => {
      const status = bantData[field.key as keyof BantData]?.status;
      return !status || status === '';
    })
    .map(field => field.label);
};

export const getFieldScore = (field: string, status: string): number => {
  if (!status) return 0;
  return scoreMap[field]?.[status] || 0;
};

export const getFieldDisplayValue = (
  field: string,
  status: string,
  data: BantFieldData
): string => {
  if (!status) return '';

  if (field === 'budget' && data.range) {
    return `${displayValueMap[field][status]} (${data.range})`;
  }

  return displayValueMap[field]?.[status] || status;
};

export const getDetailedBantFields = (bantData: BantData): {
  completed: BantFieldDetail[];
  missing: BantFieldDetail[];
} => {
  const fields = [
    { name: 'budget', label: 'Budget', data: bantData.budget },
    { name: 'authority', label: 'Authority', data: bantData.authority },
    { name: 'need', label: 'Need', data: bantData.need },
    { name: 'timeline', label: 'Timeline', data: bantData.timeline }
  ];

  const completed = fields
    .filter(f => f.data.status && f.data.status !== '')
    .map(f => ({
      name: f.name,
      label: f.label,
      completed: true,
      score: getFieldScore(f.name, f.data.status!),
      maxScore: 5,
      displayValue: getFieldDisplayValue(f.name, f.data.status!, f.data)
    }));

  const missing = fields
    .filter(f => !f.data.status || f.data.status === '')
    .map(f => ({
      name: f.name,
      label: f.label,
      completed: false,
      score: 0,
      maxScore: 5
    }));

  return { completed, missing };
};

export const validateQualification = (bantData: BantData): ValidationResult => {
  const filledFieldsCount = getFilledFieldsCount(bantData);
  const bantScore = calculateBantScore(bantData);
  const percentage = Math.round((bantScore / validationRules.maxScore) * 100);

  if (filledFieldsCount === 0) {
    return {
      valid: false,
      validationType: 'noBantFilled',
      message: validationRules.messages.noBantFilled,
      missingFields: getMissingFields(bantData),
      bantScore: 0,
      filledFieldsCount: 0
    };
  }

  if (filledFieldsCount < 4) {
    return {
      valid: true,
      validationType: 'partialBant',
      message: validationRules.messages.partialBant,
      missingFields: getMissingFields(bantData),
      bantScore,
      filledFieldsCount
    };
  }

  if (bantScore < validationRules.warningThreshold) {
    return {
      valid: true,
      validationType: 'lowBantScore',
      message: validationRules.messages.lowBantScore,
      bantScore,
      filledFieldsCount
    };
  }

  return {
    valid: true,
    validationType: 'complete',
    message: null,
    bantScore,
    filledFieldsCount
  };
};

export const getBantScorePercentage = (bantData: BantData): number => {
  const score = calculateBantScore(bantData);
  return Math.round((score / validationRules.maxScore) * 100);
};

export const shouldShowLowScoreWarning = (bantScore: number): boolean => {
  return bantScore < validationRules.warningThreshold;
};

export const getConversionRateWarning = (bantScore: number): string | null => {
  if (bantScore === 0) {
    return "Leads with no BANT assessment have 40% lower conversion rates.";
  }
  if (bantScore < validationRules.warningThreshold) {
    return "Leads with BANT scores below 15 have 30% lower conversion rates.";
  }
  return null;
};

export const getPrimaryMissingField = (bantData: BantData): string => {
  const missing = getMissingFields(bantData);
  return missing[0] || 'missing fields';
};
