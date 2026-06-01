export interface DisqualificationReason {
  id: string;
  label: string;
}

export interface Competitor {
  id: string;
  name: string;
}

export interface ReEngagementOption {
  id: string;
  label: string;
  date: string;
}

export interface ReEngagementAction {
  id: string;
  label: string;
  defaultChecked: boolean;
}

export interface NotificationOption {
  id: string;
  label: string;
  defaultChecked: boolean;
}

export interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  currentStatus: string;
  aiScore: number;
  bantScore: number;
}

export interface DisqualificationRecord {
  leadId: string;
  reason: string;
  reasonCategory: string;
  additionalDetails: string;
  competitor: string | null;
  reEngagement: string;
  reEngagementDate: string;
  reEngagementActions: {
    calendarReminder: boolean;
    addToCampaign: boolean;
    monitorTriggers: boolean;
  };
  notifications: {
    notifyOwner: boolean;
    ccManager: boolean;
    slackChannel: boolean;
  };
  disqualifiedBy: string;
  disqualifiedAt: string;
}

export const disqualificationConfig = {
  lead: {
    id: "lead_001",
    name: "Sarah Lee",
    title: "Chief Financial Officer",
    company: "TechStart Inc",
    email: "sarah.lee@techstart.com",
    currentStatus: "contacted",
    aiScore: 92,
    bantScore: 20
  },

  disqualificationReasons: {
    budgetIssues: [
      { id: "no_budget", label: "No budget available" },
      { id: "budget_too_small", label: "Budget too small for our solution" },
      { id: "budget_to_competitor", label: "Budget allocated to competitor" },
      { id: "budget_frozen", label: "Budget frozen/on hold" }
    ],
    authorityIssues: [
      { id: "not_decision_maker", label: "Not the decision maker" },
      { id: "cannot_reach_dm", label: "Cannot reach decision maker" },
      { id: "stakeholder_turnover", label: "Stakeholder turnover" }
    ],
    needFitIssues: [
      { id: "no_need", label: "No immediate business need" },
      { id: "poor_fit", label: "Poor fit for our product/service" },
      { id: "outside_target", label: "Outside our target market" },
      { id: "using_competitor", label: "Already using competitor (satisfied)" }
    ],
    timelineIssues: [
      { id: "timeline_long", label: "Timeline is too long (>6 months)" },
      { id: "no_timeline", label: "No defined timeline" },
      { id: "project_postponed", label: "Project postponed indefinitely" }
    ],
    competition: [
      { id: "lost_to_competitor", label: "Lost deal to competitor" },
      { id: "competitor_selected", label: "Competitor already selected" },
      { id: "cannot_compete_price", label: "Cannot compete on price" }
    ],
    leadUnresponsive: [
      { id: "no_response", label: "No response to outreach (3+ attempts)" },
      { id: "contact_left", label: "Contact left the company" },
      { id: "contact_bounced", label: "Contact bounced/invalid" }
    ],
    companyIssues: [
      { id: "out_of_business", label: "Company went out of business" },
      { id: "acquired", label: "Company acquired/merged" },
      { id: "hiring_freeze", label: "Hiring freeze" }
    ],
    other: [
      { id: "other", label: "Other (specify below)" }
    ]
  },

  competitors: [
    { id: "workday", name: "Workday" },
    { id: "oracle", name: "Oracle Financials" },
    { id: "sap", name: "SAP" },
    { id: "netsuite", name: "NetSuite" },
    { id: "salesforce", name: "Salesforce" },
    { id: "hubspot", name: "HubSpot" },
    { id: "zoho", name: "Zoho" },
    { id: "other", name: "Other (specify)" }
  ],

  reEngagementOptions: [
    { id: "3_months", label: "Re-engage in 3 months", date: "2025-04-06" },
    { id: "6_months", label: "Re-engage in 6 months", date: "2025-07-06" },
    { id: "12_months", label: "Re-engage in 12 months", date: "2026-01-06" },
    { id: "never", label: "Do not contact again", date: "" }
  ],

  reEngagementActions: [
    { id: "calendar_reminder", label: "Create calendar reminder", defaultChecked: true },
    { id: "add_to_campaign", label: "Add to re-engagement campaign", defaultChecked: true },
    { id: "monitor_triggers", label: "Monitor for trigger events (funding, hiring, etc.)", defaultChecked: true }
  ],

  notificationOptions: [
    { id: "notify_owner", label: "Send disqualification notification to John Smith", defaultChecked: true },
    { id: "cc_manager", label: "CC: Sales Manager", defaultChecked: false },
    { id: "slack_channel", label: "Add note to Slack #sales channel", defaultChecked: false }
  ],

  consequences: [
    "Move lead to 'Disqualified' status",
    "Remove from active pipeline",
    "Add to disqualified leads list",
    "Pause all automated sequences",
    "Update lead history with reason"
  ],

  canRequalify: true
};

export const sampleLeads: Lead[] = [
  {
    id: "lead_001",
    name: "Sarah Lee",
    title: "Chief Financial Officer",
    company: "TechStart Inc",
    email: "sarah.lee@techstart.com",
    currentStatus: "contacted",
    aiScore: 92,
    bantScore: 20
  },
  {
    id: "lead_002",
    name: "Michael Chen",
    title: "VP of Operations",
    company: "GlobalCorp",
    email: "m.chen@globalcorp.com",
    currentStatus: "qualified",
    aiScore: 88,
    bantScore: 18
  },
  {
    id: "lead_003",
    name: "Jennifer Martinez",
    title: "Director of IT",
    company: "InnovateLabs",
    email: "jmartinez@innovatelabs.com",
    currentStatus: "nurturing",
    aiScore: 75,
    bantScore: 15
  },
  {
    id: "lead_004",
    name: "David Thompson",
    title: "Procurement Manager",
    company: "Enterprise Solutions",
    email: "d.thompson@enterprise.com",
    currentStatus: "contacted",
    aiScore: 65,
    bantScore: 12
  },
  {
    id: "lead_005",
    name: "Emily Rodriguez",
    title: "CEO",
    company: "StartupVenture",
    email: "emily@startupventure.com",
    currentStatus: "new",
    aiScore: 55,
    bantScore: 8
  }
];

export const exampleDisqualifications: DisqualificationRecord[] = [
  {
    leadId: "lead_005",
    reason: "no_budget",
    reasonCategory: "budgetIssues",
    additionalDetails: "Bootstrap startup with no funding. No budget allocated for tools. Suggested revisiting after Series A.",
    competitor: null,
    reEngagement: "12_months",
    reEngagementDate: "2026-01-06",
    reEngagementActions: {
      calendarReminder: true,
      addToCampaign: true,
      monitorTriggers: true
    },
    notifications: {
      notifyOwner: true,
      ccManager: false,
      slackChannel: false
    },
    disqualifiedBy: "John Smith",
    disqualifiedAt: "2025-01-06T15:00:00Z"
  },
  {
    leadId: "lead_006",
    reason: "lost_to_competitor",
    reasonCategory: "competition",
    additionalDetails: "They offered 20% lower pricing and faster implementation timeline. Lost to Workday.",
    competitor: "workday",
    reEngagement: "6_months",
    reEngagementDate: "2025-07-06",
    reEngagementActions: {
      calendarReminder: true,
      addToCampaign: true,
      monitorTriggers: true
    },
    notifications: {
      notifyOwner: true,
      ccManager: true,
      slackChannel: true
    },
    disqualifiedBy: "Sarah Johnson",
    disqualifiedAt: "2025-01-05T10:30:00Z"
  },
  {
    leadId: "lead_007",
    reason: "no_response",
    reasonCategory: "leadUnresponsive",
    additionalDetails: "Multiple attempts via email, phone, and LinkedIn. No response after 5 weeks.",
    competitor: null,
    reEngagement: "3_months",
    reEngagementDate: "2025-04-06",
    reEngagementActions: {
      calendarReminder: true,
      addToCampaign: false,
      monitorTriggers: true
    },
    notifications: {
      notifyOwner: true,
      ccManager: false,
      slackChannel: false
    },
    disqualifiedBy: "Mike Torres",
    disqualifiedAt: "2025-01-04T14:15:00Z"
  },
  {
    leadId: "lead_008",
    reason: "out_of_business",
    reasonCategory: "companyIssues",
    additionalDetails: "Company filed for bankruptcy in December 2024. Website is down.",
    competitor: null,
    reEngagement: "never",
    reEngagementDate: "",
    reEngagementActions: {
      calendarReminder: false,
      addToCampaign: false,
      monitorTriggers: false
    },
    notifications: {
      notifyOwner: true,
      ccManager: false,
      slackChannel: false
    },
    disqualifiedBy: "John Smith",
    disqualifiedAt: "2025-01-03T09:00:00Z"
  },
  {
    leadId: "lead_009",
    reason: "timeline_long",
    reasonCategory: "timelineIssues",
    additionalDetails: "Looking to implement in Q4 2025, outside our sales cycle. Budget approved but timeline too long.",
    competitor: null,
    reEngagement: "6_months",
    reEngagementDate: "2025-07-06",
    reEngagementActions: {
      calendarReminder: true,
      addToCampaign: true,
      monitorTriggers: false
    },
    notifications: {
      notifyOwner: true,
      ccManager: false,
      slackChannel: false
    },
    disqualifiedBy: "Lisa Chen",
    disqualifiedAt: "2025-01-02T11:45:00Z"
  }
];

export const getAllReasons = () => {
  const reasons = disqualificationConfig.disqualificationReasons;
  return [
    ...reasons.budgetIssues,
    ...reasons.authorityIssues,
    ...reasons.needFitIssues,
    ...reasons.timelineIssues,
    ...reasons.competition,
    ...reasons.leadUnresponsive,
    ...reasons.companyIssues,
    ...reasons.other
  ];
};

export const getReasonById = (id: string): DisqualificationReason | undefined => {
  return getAllReasons().find(reason => reason.id === id);
};

export const getReasonsByCategory = (category: string): DisqualificationReason[] => {
  const reasons = disqualificationConfig.disqualificationReasons;

  switch (category) {
    case 'budgetIssues':
      return reasons.budgetIssues;
    case 'authorityIssues':
      return reasons.authorityIssues;
    case 'needFitIssues':
      return reasons.needFitIssues;
    case 'timelineIssues':
      return reasons.timelineIssues;
    case 'competition':
      return reasons.competition;
    case 'leadUnresponsive':
      return reasons.leadUnresponsive;
    case 'companyIssues':
      return reasons.companyIssues;
    case 'other':
      return reasons.other;
    default:
      return [];
  }
};

export const getCompetitorById = (id: string): Competitor | undefined => {
  return disqualificationConfig.competitors.find(comp => comp.id === id);
};

export const needsCompetitorInfo = (reasonId: string): boolean => {
  const competitionReasons = disqualificationConfig.disqualificationReasons.competition;
  return competitionReasons.some(reason => reason.id === reasonId);
};

export const isHighQualityLead = (aiScore: number, bantScore: number): boolean => {
  return aiScore >= 80 || bantScore >= 16;
};

export const calculateReEngagementDate = (periodId: string): string => {
  const now = new Date();
  const monthsMap: { [key: string]: number } = {
    '3_months': 3,
    '6_months': 6,
    '12_months': 12
  };

  if (periodId === 'never') return '';

  const months = monthsMap[periodId];
  if (!months) return '';

  const futureDate = new Date(now);
  futureDate.setMonth(futureDate.getMonth() + months);

  return futureDate.toISOString().split('T')[0];
};

export const getDisqualificationStats = () => {
  return {
    totalDisqualified: exampleDisqualifications.length,
    byCategory: {
      budgetIssues: exampleDisqualifications.filter(d => d.reasonCategory === 'budgetIssues').length,
      authorityIssues: exampleDisqualifications.filter(d => d.reasonCategory === 'authorityIssues').length,
      needFitIssues: exampleDisqualifications.filter(d => d.reasonCategory === 'needFitIssues').length,
      timelineIssues: exampleDisqualifications.filter(d => d.reasonCategory === 'timelineIssues').length,
      competition: exampleDisqualifications.filter(d => d.reasonCategory === 'competition').length,
      leadUnresponsive: exampleDisqualifications.filter(d => d.reasonCategory === 'leadUnresponsive').length,
      companyIssues: exampleDisqualifications.filter(d => d.reasonCategory === 'companyIssues').length,
      other: exampleDisqualifications.filter(d => d.reasonCategory === 'other').length
    },
    byReEngagement: {
      '3_months': exampleDisqualifications.filter(d => d.reEngagement === '3_months').length,
      '6_months': exampleDisqualifications.filter(d => d.reEngagement === '6_months').length,
      '12_months': exampleDisqualifications.filter(d => d.reEngagement === '12_months').length,
      'never': exampleDisqualifications.filter(d => d.reEngagement === 'never').length
    },
    topCompetitors: getTopCompetitors(),
    averageReEngagementMonths: calculateAverageReEngagement()
  };
};

const getTopCompetitors = (): { name: string; count: number }[] => {
  const competitorCounts: { [key: string]: number } = {};

  exampleDisqualifications.forEach(d => {
    if (d.competitor) {
      competitorCounts[d.competitor] = (competitorCounts[d.competitor] || 0) + 1;
    }
  });

  return Object.entries(competitorCounts)
    .map(([id, count]) => ({
      name: getCompetitorById(id)?.name || id,
      count
    }))
    .sort((a, b) => b.count - a.count);
};

const calculateAverageReEngagement = (): number => {
  const monthsMap: { [key: string]: number } = {
    '3_months': 3,
    '6_months': 6,
    '12_months': 12,
    'never': 0
  };

  const total = exampleDisqualifications.reduce((sum, d) => {
    return sum + (monthsMap[d.reEngagement] || 0);
  }, 0);

  return total / exampleDisqualifications.length;
};

export default disqualificationConfig;
