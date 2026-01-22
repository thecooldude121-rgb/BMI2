export const partialEnrichmentData = {
  results: {
    successful: 12,
    failed: 8,
    skipped: 0,
    total: 20,
    successRate: 60
  },

  successfulFields: {
    contactInfo: [
      { field: "email", value: "sarah.lee@techstart.com", source: "apollo" },
      { field: "linkedin", value: "linkedin.com/in/sarahlee-cfo", source: "apollo" },
      { field: "mobile_phone", value: "+1 (415) 789-0123", source: "apollo" }
    ],
    companyInfo: [
      { field: "company_size", value: "85 employees", source: "apollo" },
      { field: "industry", value: "Enterprise SaaS - FinTech", source: "apollo" },
      { field: "founded_year", value: "2019", source: "zoominfo" },
      { field: "company_website", value: "https://www.techstart.com", source: "apollo" },
      { field: "total_funding", value: "$23M (Series A)", source: "apollo" }
    ],
    professionalDetails: [
      { field: "job_title", value: "Chief Financial Officer", source: "apollo" },
      { field: "seniority_level", value: "C-Level Executive", source: "zoominfo" },
      { field: "department", value: "Finance & Operations", source: "apollo" },
      { field: "education", value: "MBA - Stanford GSB", source: "apollo" }
    ]
  },

  failedFields: {
    contactInfo: [
      { field: "direct_phone", reason: "No data available", source: "apollo" },
      { field: "office_location", reason: "API timeout", source: "zoominfo" }
    ],
    companyInfo: [
      { field: "annual_revenue", reason: "Data not found", source: "zoominfo" },
      { field: "company_hq", reason: "API error", source: "zoominfo" },
      { field: "international_presence", reason: "No data available", source: "apollo" }
    ],
    professionalDetails: [
      { field: "years_in_role", reason: "Data not found", source: "zoominfo" },
      { field: "skills", reason: "API timeout", source: "zoominfo" },
      { field: "previous_companies", reason: "No data available", source: "apollo" }
    ]
  },

  options: [
    {
      id: "accept",
      label: "Accept partial enrichment",
      description: "Save the 12 fields that were successfully enriched"
    },
    {
      id: "retry",
      label: "Retry failed fields only",
      description: "Attempt to enrich the 8 missing fields again",
      fieldsToRetry: 8
    },
    {
      id: "manual",
      label: "Fill missing fields manually",
      description: "Add the missing data yourself"
    },
    {
      id: "discard",
      label: "Discard all and cancel",
      description: "Don't save any enriched data"
    }
  ],

  recommendations: [
    "The 12 successfully enriched fields provide a solid foundation for this lead",
    "You can retry the failed fields later or add them manually",
    "Consider accepting the partial enrichment to avoid losing the successful data"
  ]
};

// Helper function to format field names for display
export function formatFieldName(field: string): string {
  return field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to get totals for each category
export function getCategoryTotals() {
  const { successfulFields, failedFields } = partialEnrichmentData;

  return {
    contactInfo: {
      total: successfulFields.contactInfo.length + failedFields.contactInfo.length,
      enriched: successfulFields.contactInfo.length,
      failed: failedFields.contactInfo.length
    },
    companyInfo: {
      total: successfulFields.companyInfo.length + failedFields.companyInfo.length,
      enriched: successfulFields.companyInfo.length,
      failed: failedFields.companyInfo.length
    },
    professionalDetails: {
      total: successfulFields.professionalDetails.length + failedFields.professionalDetails.length,
      enriched: successfulFields.professionalDetails.length,
      failed: failedFields.professionalDetails.length
    }
  };
}
