export interface EnrichmentField {
  id: string;
  label: string;
  selected: boolean;
  cost: number;
}

export interface FieldCategory {
  id: string;
  label: string;
  expanded: boolean;
  fields: EnrichmentField[];
}

export interface FrequencyOption {
  value: string;
  label: string;
  description: string;
}

export interface ConfidenceThresholdOption {
  value: number;
  label: string;
  description: string;
}

export interface DataSourcePriorityOption {
  value: string;
  label: string;
  description: string;
  pros: string[];
  cons: string[];
}

export interface EnrichmentSettings {
  autoEnrichFrequency: string;
  confidenceThreshold: number;
  dataSourcePriority: string;
  notifications: {
    enrichmentComplete: boolean;
    dailySummary: boolean;
    enrichmentFailures: boolean;
    lowConfidenceFields: boolean;
  };
}

export interface CostEstimation {
  selectedFieldsCount: number;
  totalFieldsCount: number;
  apolloCostPerField: number;
  zoominfoCostPerField: number;
  estimatedCostPerEnrichment: number;
  monthlyLeadVolume: number;
  estimatedMonthlyCost: number;
}

export interface EnrichmentFieldsConfig {
  mode: 'auto' | 'manual';
  fieldCategories: {
    contactInfo: FieldCategory;
    companyInfo: FieldCategory;
    professionalDetails: FieldCategory;
  };
  settings: EnrichmentSettings;
  frequencyOptions: FrequencyOption[];
  confidenceThresholdOptions: ConfidenceThresholdOption[];
  dataSourcePriorityOptions: DataSourcePriorityOption[];
  costEstimation: CostEstimation;
}

export const enrichmentFieldsConfig: EnrichmentFieldsConfig = {
  mode: "auto",

  fieldCategories: {
    contactInfo: {
      id: "contact_info",
      label: "Contact Information",
      expanded: true,
      fields: [
        { id: "email", label: "Email", selected: true, cost: 0.01 },
        { id: "direct_phone", label: "Direct Phone", selected: true, cost: 0.015 },
        { id: "linkedin", label: "LinkedIn Profile", selected: true, cost: 0.01 },
        { id: "mobile_phone", label: "Mobile Phone", selected: true, cost: 0.015 },
        { id: "office_location", label: "Office Location", selected: false, cost: 0.01 }
      ]
    },
    companyInfo: {
      id: "company_info",
      label: "Company Information",
      expanded: true,
      fields: [
        { id: "company_size", label: "Company Size", selected: true, cost: 0.01 },
        { id: "annual_revenue", label: "Annual Revenue", selected: true, cost: 0.015 },
        { id: "industry", label: "Industry", selected: true, cost: 0.01 },
        { id: "founded_year", label: "Founded Year", selected: true, cost: 0.01 },
        { id: "total_funding", label: "Total Funding", selected: true, cost: 0.015 },
        { id: "company_website", label: "Company Website", selected: true, cost: 0.005 },
        { id: "company_hq", label: "Company HQ Address", selected: false, cost: 0.01 },
        { id: "international_presence", label: "International Presence", selected: false, cost: 0.01 }
      ]
    },
    professionalDetails: {
      id: "professional_details",
      label: "Professional Details",
      expanded: false,
      fields: [
        { id: "job_title", label: "Job Title", selected: true, cost: 0.005 },
        { id: "seniority_level", label: "Seniority Level", selected: true, cost: 0.01 },
        { id: "department", label: "Department", selected: true, cost: 0.01 },
        { id: "years_in_role", label: "Years in Role", selected: true, cost: 0.01 },
        { id: "education", label: "Education", selected: false, cost: 0.015 },
        { id: "skills", label: "Skills & Expertise", selected: false, cost: 0.015 },
        { id: "previous_companies", label: "Previous Companies", selected: false, cost: 0.015 }
      ]
    }
  },

  settings: {
    autoEnrichFrequency: "24_hours",
    confidenceThreshold: 70,
    dataSourcePriority: "first_come",
    notifications: {
      enrichmentComplete: true,
      dailySummary: true,
      enrichmentFailures: false,
      lowConfidenceFields: false
    }
  },

  frequencyOptions: [
    {
      value: "real_time",
      label: "Real-time (on page load if data >24h old)",
      description: "Enriches automatically when lead page is opened"
    },
    {
      value: "24_hours",
      label: "Every 24 hours",
      description: "Daily automatic enrichment for all leads"
    },
    {
      value: "7_days",
      label: "Every 7 days",
      description: "Weekly automatic enrichment"
    },
    {
      value: "30_days",
      label: "Every 30 days",
      description: "Monthly automatic enrichment"
    },
    {
      value: "manual_only",
      label: "Manual only (disable auto-enrich)",
      description: "Only enrich when clicking 'Enrich Now' button"
    }
  ],

  confidenceThresholdOptions: [
    { value: 90, label: "90% or higher (Very strict)", description: "Only accept very high confidence data" },
    { value: 80, label: "80% or higher (Strict)", description: "Accept high confidence data only" },
    { value: 70, label: "70% or higher (Balanced - Recommended)", description: "Good balance of quality and coverage" },
    { value: 60, label: "60% or higher (Lenient)", description: "Accept more data, may need manual review" },
    { value: 0, label: "Any confidence (Accept all)", description: "Accept all enriched data regardless of confidence" }
  ],

  dataSourcePriorityOptions: [
    {
      value: "first_come",
      label: "First-come-first-serve (Recommended)",
      description: "Whichever API responds first fills the field",
      pros: ["Fastest enrichment", "Lowest cost (1 call per field)"],
      cons: ["May miss better data from slower source"]
    },
    {
      value: "prefer_apollo",
      label: "Prefer Apollo.io",
      description: "Use Apollo data when both sources respond",
      pros: ["Consistent data source", "Apollo usually faster"],
      cons: ["May miss ZoomInfo's unique data"]
    },
    {
      value: "prefer_zoominfo",
      label: "Prefer ZoomInfo",
      description: "Use ZoomInfo data when both sources respond",
      pros: ["ZoomInfo often more accurate", "Better company data"],
      cons: ["Slower response times"]
    },
    {
      value: "merge",
      label: "Merge data (combine both sources)",
      description: "Take best confidence score from either source",
      pros: ["Most complete data", "Best of both sources"],
      cons: ["2x API costs", "Slower enrichment"]
    }
  ],

  costEstimation: {
    selectedFieldsCount: 10,
    totalFieldsCount: 20,
    apolloCostPerField: 0.005,
    zoominfoCostPerField: 0.008,
    estimatedCostPerEnrichment: 0.13,
    monthlyLeadVolume: 100,
    estimatedMonthlyCost: 13.00
  }
};

export const getSelectedFieldsCount = (config: EnrichmentFieldsConfig): number => {
  let count = 0;
  Object.values(config.fieldCategories).forEach(category => {
    count += category.fields.filter(f => f.selected).length;
  });
  return count;
};

export const getTotalFieldsCount = (config: EnrichmentFieldsConfig): number => {
  let count = 0;
  Object.values(config.fieldCategories).forEach(category => {
    count += category.fields.length;
  });
  return count;
};

export const calculateEnrichmentCost = (
  config: EnrichmentFieldsConfig,
  dataSourcePriority?: string
): { apollo: number; zoomInfo: number; total: number; monthly: number } => {
  let totalCost = 0;

  Object.values(config.fieldCategories).forEach(category => {
    category.fields.forEach(field => {
      if (field.selected || config.mode === 'auto') {
        totalCost += field.cost;
      }
    });
  });

  const priority = dataSourcePriority || config.settings.dataSourcePriority;

  let apolloCost = totalCost * 0.4;
  let zoomInfoCost = totalCost * 0.6;

  if (priority === "merge") {
    apolloCost = totalCost * 0.5;
    zoomInfoCost = totalCost * 0.5;
    totalCost = totalCost * 2;
  } else if (priority === "prefer_apollo") {
    apolloCost = totalCost * 0.7;
    zoomInfoCost = totalCost * 0.3;
  } else if (priority === "prefer_zoominfo") {
    apolloCost = totalCost * 0.3;
    zoomInfoCost = totalCost * 0.7;
  }

  const monthlyVolume = config.costEstimation.monthlyLeadVolume;

  return {
    apollo: apolloCost,
    zoomInfo: zoomInfoCost,
    total: totalCost,
    monthly: totalCost * monthlyVolume
  };
};

export const getFrequencyLabel = (value: string, config: EnrichmentFieldsConfig): string => {
  const option = config.frequencyOptions.find(opt => opt.value === value);
  return option?.label || value;
};

export const getConfidenceThresholdLabel = (value: number, config: EnrichmentFieldsConfig): string => {
  const option = config.confidenceThresholdOptions.find(opt => opt.value === value);
  return option?.label || `${value}%`;
};

export const getDataSourcePriorityLabel = (value: string, config: EnrichmentFieldsConfig): string => {
  const option = config.dataSourcePriorityOptions.find(opt => opt.value === value);
  return option?.label || value;
};
