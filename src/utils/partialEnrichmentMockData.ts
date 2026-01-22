export const partialEnrichmentData = {
  error: {
    type: "partial_enrichment",
    timestamp: "2025-01-06T15:20:00Z",
    leadName: "Jessica Anderson",
    leadEmail: "jessica.anderson@techcorp.com"
  },

  enrichmentResults: {
    total: 20,
    successful: 12,
    failed: 8,
    skipped: 0,
    successRate: 60 // percentage
  },

  successfulFields: {
    contactInformation: {
      total: 5,
      enriched: 3,
      fields: [
        {
          name: "Email",
          value: "jessica.anderson@techcorp.com",
          source: "Apollo.io"
        },
        {
          name: "LinkedIn Profile",
          value: "https://linkedin.com/in/jessica-anderson-tech",
          source: "ZoomInfo"
        },
        {
          name: "Mobile Phone",
          value: "+1 (555) 234-5678",
          source: "Apollo.io"
        }
      ]
    },
    companyInformation: {
      total: 8,
      enriched: 5,
      fields: [
        {
          name: "Company Size",
          value: "500-1,000 employees",
          source: "ZoomInfo"
        },
        {
          name: "Industry",
          value: "Enterprise Software",
          source: "Apollo.io"
        },
        {
          name: "Founded Year",
          value: "2015",
          source: "ZoomInfo"
        },
        {
          name: "Company Website",
          value: "https://techcorp.com",
          source: "Apollo.io"
        },
        {
          name: "Total Funding",
          value: "$45M Series B",
          source: "ZoomInfo"
        }
      ]
    },
    professionalDetails: {
      total: 7,
      enriched: 4,
      fields: [
        {
          name: "Job Title",
          value: "VP of Sales",
          source: "Apollo.io"
        },
        {
          name: "Seniority Level",
          value: "Executive",
          source: "ZoomInfo"
        },
        {
          name: "Department",
          value: "Sales & Business Development",
          source: "Apollo.io"
        },
        {
          name: "Education",
          value: "MBA, Stanford University",
          source: "ZoomInfo"
        }
      ]
    }
  },

  failedFields: {
    contactInformation: [
      {
        name: "Direct Phone",
        reason: "No data available",
        lastAttempt: "2025-01-06T15:20:15Z"
      },
      {
        name: "Office Location",
        reason: "API timeout",
        lastAttempt: "2025-01-06T15:20:18Z"
      }
    ],
    companyInformation: [
      {
        name: "Annual Revenue",
        reason: "Data not found",
        lastAttempt: "2025-01-06T15:20:20Z"
      },
      {
        name: "Company HQ",
        reason: "API error",
        lastAttempt: "2025-01-06T15:20:22Z"
      },
      {
        name: "International Presence",
        reason: "No data available",
        lastAttempt: "2025-01-06T15:20:25Z"
      }
    ],
    professionalDetails: [
      {
        name: "Years in Role",
        reason: "Data not found",
        lastAttempt: "2025-01-06T15:20:27Z"
      },
      {
        name: "Skills & Expertise",
        reason: "API timeout",
        lastAttempt: "2025-01-06T15:20:30Z"
      },
      {
        name: "Previous Companies",
        reason: "No data available",
        lastAttempt: "2025-01-06T15:20:32Z"
      }
    ]
  },

  options: [
    {
      id: "accept_partial",
      label: "Accept partial enrichment",
      description: "Save the 12 fields that were successfully enriched",
      default: true
    },
    {
      id: "retry_failed",
      label: "Retry failed fields only",
      description: "Attempt to enrich the 8 missing fields again"
    },
    {
      id: "manual_entry",
      label: "Fill missing fields manually",
      description: "Add the missing data yourself"
    },
    {
      id: "discard_all",
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
