export interface SyncField {
  name: string;
  value: string;
  selected: boolean;
}

export interface FieldSection {
  expanded: boolean;
  fields: SyncField[];
}

export interface SyncAction {
  action: string;
  description: string;
  fields: string[];
  status: 'pending' | 'in_progress' | 'completed';
}

export interface CRMSyncConfig {
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    title: string;
    company: string;
  };
  qualificationData: {
    aiScore: number;
    bantScore: number;
    statusChange: {
      from: string;
      to: string;
    };
    qualifiedBy: string;
    qualifiedAt: string;
  };
  crmOpportunity: {
    name: string;
    amount: number;
    closeDate: string;
    stage: string;
    probability: number;
    type: string;
    owner: string;
    source: string;
    description: string;
  };
  syncActions: SyncAction[];
  syncSettings: {
    estimatedDuration: string;
    canUndo: boolean;
    postSyncBehavior: string;
    futureUpdates: string;
  };
  fieldsToSync: {
    contactInfo: FieldSection;
    companyInfo: FieldSection;
    bantAssessment: FieldSection;
    professionalDetails: FieldSection;
    qualificationNotes: FieldSection;
  };
}

export const crmSyncConfig: CRMSyncConfig = {
  lead: {
    id: "lead_001",
    firstName: "Sarah",
    lastName: "Lee",
    email: "sarah.lee@techstart.com",
    phone: "+1 (415) 234-5678",
    title: "Chief Financial Officer",
    company: "TechStart Inc"
  },

  qualificationData: {
    aiScore: 92,
    bantScore: 20,
    statusChange: {
      from: "contacted",
      to: "qualified"
    },
    qualifiedBy: "John Smith",
    qualifiedAt: "2025-01-06T14:30:00Z"
  },

  crmOpportunity: {
    name: "TechStart Inc - CFO",
    amount: 75000,
    closeDate: "2025-02-15",
    stage: "Discovery",
    probability: 40,
    type: "New Business",
    owner: "John Smith (Senior AE)",
    source: "Lead Gen Tool",
    description: "Warm HRMS lead. Strong fit: C-level at growing SaaS company."
  },

  syncActions: [
    {
      action: "update_lead_status",
      description: "Update lead status to 'Qualified'",
      fields: ["status"],
      status: "pending"
    },
    {
      action: "sync_contact_info",
      description: "Sync contact information (5 fields)",
      fields: ["email", "phone", "linkedin", "mobile_phone", "office_location"],
      status: "pending"
    },
    {
      action: "sync_company_info",
      description: "Sync company information (8 fields)",
      fields: ["company_size", "annual_revenue", "industry", "founded_year", "total_funding", "company_website", "company_hq", "international_presence"],
      status: "pending"
    },
    {
      action: "sync_bant_assessment",
      description: "Sync BANT assessment (4 components)",
      fields: ["budget", "authority", "need", "timeline"],
      status: "pending"
    },
    {
      action: "create_crm_opportunity",
      description: "Create CRM opportunity (ID: auto-generated)",
      fields: ["opportunity"],
      status: "pending"
    },
    {
      action: "sync_enrichment_data",
      description: "Sync enrichment data (20 fields)",
      fields: ["all_enriched_fields"],
      status: "pending"
    },
    {
      action: "add_qualification_notes",
      description: "Add qualification notes to CRM activity",
      fields: ["notes", "history"],
      status: "pending"
    },
    {
      action: "send_notification",
      description: "Send email notification to John Smith",
      fields: ["email_notification"],
      status: "pending"
    },
    {
      action: "create_calendar_reminder",
      description: "Create calendar reminder for Jan 15 demo",
      fields: ["calendar_event"],
      status: "pending"
    }
  ],

  syncSettings: {
    estimatedDuration: "5-10 seconds",
    canUndo: false,
    postSyncBehavior: "remove_from_lead_gen_active_list",
    futureUpdates: "Must be made in CRM"
  },

  fieldsToSync: {
    contactInfo: {
      expanded: true,
      fields: [
        { name: "Email", value: "sarah.lee@techstart.com", selected: true },
        { name: "Direct Phone", value: "+1 (415) 234-5678", selected: true },
        { name: "LinkedIn", value: "linkedin.com/in/sarahlee-cfo", selected: true },
        { name: "Mobile Phone", value: "+1 (415) 789-0123", selected: true },
        { name: "Office Location", value: "123 Market St, SF, CA 94103", selected: true }
      ]
    },
    companyInfo: {
      expanded: false,
      fields: [
        { name: "Company Size", value: "85 employees", selected: true },
        { name: "Annual Revenue", value: "$12M - $15M", selected: true },
        { name: "Industry", value: "Enterprise SaaS - FinTech", selected: true },
        { name: "Founded Year", value: "2019", selected: true },
        { name: "Total Funding", value: "$23M (Series A)", selected: true },
        { name: "Company Website", value: "https://www.techstart.com", selected: true },
        { name: "Company HQ", value: "500 Howard St, SF, CA 94105", selected: true },
        { name: "International Presence", value: "USA, UK, Germany", selected: true }
      ]
    },
    bantAssessment: {
      expanded: false,
      fields: [
        { name: "Budget", value: "Confirmed ($75K)", selected: true },
        { name: "Authority", value: "Decision Maker (CFO)", selected: true },
        { name: "Need", value: "Urgent (3 pain points)", selected: true },
        { name: "Timeline", value: "Immediate (Feb 15, 2025)", selected: true }
      ]
    },
    professionalDetails: {
      expanded: false,
      fields: [
        { name: "Job Title", value: "Chief Financial Officer", selected: true },
        { name: "Seniority Level", value: "C-Level Executive", selected: true },
        { name: "Department", value: "Finance & Operations", selected: true },
        { name: "Years in Role", value: "2.5 years", selected: true },
        { name: "Education", value: "MBA - Stanford, BS - UC Berkeley", selected: true },
        { name: "Skills", value: "Financial Planning, M&A, Strategic Finance", selected: true },
        { name: "Previous Companies", value: "Oracle, Salesforce", selected: true }
      ]
    },
    qualificationNotes: {
      expanded: false,
      fields: [
        { name: "Qualification Date", value: "Jan 6, 2025 2:30 PM", selected: true },
        { name: "Qualified By", value: "John Smith", selected: true },
        { name: "AI Score", value: "92/100", selected: true },
        { name: "BANT Score", value: "20/20", selected: true },
        { name: "Notes", value: "Strong fit. HRMS warm lead. Mentioned they're evaluating 2 other vendors but our HRMS relationship gives us strong advantage.", selected: true },
        { name: "Next Steps", value: "Demo Jan 15, Proposal Jan 30, Decision Feb 10", selected: true }
      ]
    }
  }
};

export const getSyncFieldsForLead = (leadId: string): CRMSyncConfig => {
  return crmSyncConfig;
};
