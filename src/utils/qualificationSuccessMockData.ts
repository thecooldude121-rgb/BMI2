export interface QualificationSuccessData {
  lead: {
    id: string;
    name: string;
    title: string;
    company: string;
    email: string;
    phone: string;
    previousStatus: string;
    newStatus: string;
  };

  scores: {
    aiScore: number;
    bantScore: number;
    overallGrade: string;
  };

  crmOpportunity: {
    id: string;
    name: string;
    amount: number;
    closeDate: string;
    stage: string;
    probability: number;
    owner: string;
    crmUrl: string;
  };

  syncSummary: {
    actions: Array<{
      action: string;
      status: string;
      timestamp: string;
      fieldsCount?: number;
    }>;
    totalDuration: string;
    completedAt: string;
  };

  nextSteps: Array<{
    step: number;
    title: string;
    date: string;
    time?: string;
    description: string;
    actions: Array<{
      label: string;
      action: string;
    }>;
  }>;

  notification: {
    to: string;
    subject: string;
    sentAt: string;
    preview: string;
    fullEmailUrl: string;
  };

  proTip?: {
    type: string;
    message: string;
  };

  redirectSettings: {
    enabled: boolean;
    destination: string;
    delay: number;
    allowCancel: boolean;
  };
}

export const qualificationSuccessData: QualificationSuccessData = {
  lead: {
    id: "lead_001",
    name: "Sarah Lee",
    title: "Chief Financial Officer",
    company: "TechStart Inc",
    email: "sarah.lee@techstart.com",
    phone: "+1 (415) 234-5678",
    previousStatus: "contacted",
    newStatus: "qualified"
  },

  scores: {
    aiScore: 92,
    bantScore: 20,
    overallGrade: "A+"
  },

  crmOpportunity: {
    id: "OPP-2025-00142",
    name: "TechStart Inc - CFO",
    amount: 75000,
    closeDate: "2025-02-15",
    stage: "Discovery",
    probability: 40,
    owner: "John Smith (Senior AE)",
    crmUrl: "https://crm.company.com/opportunities/OPP-2025-00142"
  },

  syncSummary: {
    actions: [
      { action: "Lead status updated to \"Qualified\"", status: "completed", timestamp: "2025-01-06T14:30:01Z" },
      { action: "CRM opportunity created (OPP-2025-00142)", status: "completed", timestamp: "2025-01-06T14:30:03Z" },
      { action: "Contact & company data synced (13 fields)", status: "completed", fieldsCount: 13, timestamp: "2025-01-06T14:30:05Z" },
      { action: "BANT assessment synced to CRM", status: "completed", timestamp: "2025-01-06T14:30:06Z" },
      { action: "Enrichment data synced (20 fields)", status: "completed", fieldsCount: 20, timestamp: "2025-01-06T14:30:08Z" },
      { action: "Qualification notes added to CRM", status: "completed", timestamp: "2025-01-06T14:30:09Z" },
      { action: "Email sent to John Smith", status: "completed", timestamp: "2025-01-06T14:30:10Z" },
      { action: "Calendar reminder created (Jan 15 demo)", status: "completed", timestamp: "2025-01-06T14:30:11Z" }
    ],
    totalDuration: "10 seconds",
    completedAt: "2025-01-06T14:30:11Z"
  },

  nextSteps: [
    {
      step: 1,
      title: "Demo Scheduled",
      date: "2025-01-15",
      time: "2:00 PM",
      description: "Product demo with Sarah Lee & technical team",
      actions: [
        { label: "Add to Calendar", action: "add_to_calendar" },
        { label: "Send Invite", action: "send_invite" }
      ]
    },
    {
      step: 2,
      title: "Proposal Deadline",
      date: "2025-01-30",
      description: "Custom proposal with $75K pricing",
      actions: [
        { label: "Start Proposal", action: "start_proposal" },
        { label: "View Template", action: "view_template" }
      ]
    },
    {
      step: 3,
      title: "Decision Meeting",
      date: "2025-02-10",
      description: "Final presentation to CFO + CEO",
      actions: [
        { label: "Schedule Meeting", action: "schedule_meeting" }
      ]
    },
    {
      step: 4,
      title: "Target Close",
      date: "2025-02-15",
      description: "Contract signing & onboarding kickoff",
      actions: []
    }
  ],

  notification: {
    to: "john.smith@company.com",
    subject: "New Qualified Lead - Sarah Lee (TechStart Inc)",
    sentAt: "2025-01-06T14:30:10Z",
    preview: "Hi John, A new high-value lead has been qualified and assigned to you. Sarah Lee (CFO at TechStart Inc) has a BANT score of 20/20 with confirmed budget of $75K. Demo scheduled for Jan 15...",
    fullEmailUrl: "/emails/notification_001"
  },

  proTip: {
    type: "hrms_warm_lead",
    message: "This was a warm HRMS lead with 33% higher conversion rate. Make sure to mention your company's existing relationship through the recruitment placement when reaching out."
  },

  redirectSettings: {
    enabled: true,
    destination: "/lead-generation/leads",
    delay: 10,
    allowCancel: true
  }
};

export function getQualificationSuccessData(leadId: string): QualificationSuccessData {
  return qualificationSuccessData;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDateWithTime(dateString: string, time?: string): string {
  const date = new Date(dateString);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return time ? `${formattedDate} at ${time}` : formattedDate;
}
