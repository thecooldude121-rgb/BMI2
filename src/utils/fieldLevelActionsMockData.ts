export const fieldLevelActionsData = {
  field: {
    id: "direct_phone",
    label: "Direct Phone",
    icon: "📱",
    currentValue: "+1 (415) 234-5678",
    source: "zoominfo",
    confidence: 88,
    enrichedAt: "2025-01-06T10:30:00Z",
    status: "verified",
    verifiedBy: "John Smith",
    verifiedAt: "2025-01-06T14:45:00Z"
  },

  editModal: {
    title: "Edit Field Manually",
    field: "Direct Phone",
    currentValue: "+1 (415) 234-5678",
    format: "+1 (XXX) XXX-XXXX",

    reasonOptions: [
      "Incorrect data from API",
      "Verified directly with contact",
      "Updated information received",
      "Data quality issue",
      "Other (specify below)"
    ],

    verificationOption: {
      enabled: true,
      label: "Mark as verified",
      description: "Future enrichments won't override this value"
    },

    changeImpact: [
      "Update lead record",
      "Add entry to field history",
      "Mark field as manually verified",
      "Prevent automatic overrides"
    ]
  },

  fieldHistory: [
    {
      id: "change_003",
      timestamp: "2025-01-06T14:45:00Z",
      type: "manual_edit",
      user: "John Smith",
      oldValue: "+1 (415) 234-9999",
      newValue: "+1 (415) 234-5678",
      reason: "Verified directly with contact",
      note: "Called Sarah, she confirmed correct number",
      verified: true
    },
    {
      id: "change_002",
      timestamp: "2025-01-06T10:30:00Z",
      type: "api_enrichment",
      source: "zoominfo",
      oldValue: "+1 (415) 123-4567",
      newValue: "+1 (415) 234-9999",
      confidence: 85,
      sourceDetail: "Public records"
    },
    {
      id: "change_001",
      timestamp: "2025-01-04T09:00:00Z",
      type: "api_enrichment",
      source: "apollo",
      oldValue: null,
      newValue: "+1 (415) 123-4567",
      confidence: 82,
      sourceDetail: "Verified contact database"
    },
    {
      id: "initial",
      timestamp: "2024-10-15T09:00:00Z",
      type: "lead_created",
      user: "HRMS System",
      oldValue: null,
      newValue: null,
      source: "hrms_import"
    }
  ],

  actions: [
    {
      id: "edit",
      icon: "✏️",
      label: "Edit",
      description: "Manually edit field value",
      action: "open_edit_modal"
    },
    {
      id: "verify",
      icon: "✅",
      label: "Verify",
      description: "Mark as verified (prevents auto-override)",
      action: "mark_verified"
    },
    {
      id: "history",
      icon: "📜",
      label: "History",
      description: "View all changes to this field",
      action: "open_history_modal"
    },
    {
      id: "reject",
      icon: "❌",
      label: "Reject",
      description: "Reject enriched value and revert",
      action: "reject_enrichment"
    }
  ]
};

export const emailFieldData = {
  field: {
    id: "email",
    label: "Email",
    icon: "📧",
    currentValue: "sarah.lee@techstart.com",
    source: "apollo",
    confidence: 95,
    enrichedAt: "2025-01-05T09:15:00Z",
    status: "enriched",
    verifiedBy: null,
    verifiedAt: null
  },

  fieldHistory: [
    {
      id: "change_002",
      timestamp: "2025-01-05T09:15:00Z",
      type: "api_enrichment",
      source: "apollo",
      oldValue: "s.lee@techstart.io",
      newValue: "sarah.lee@techstart.com",
      confidence: 95,
      sourceDetail: "LinkedIn profile verification"
    },
    {
      id: "change_001",
      timestamp: "2025-01-03T14:20:00Z",
      type: "api_enrichment",
      source: "hunter",
      oldValue: null,
      newValue: "s.lee@techstart.io",
      confidence: 78,
      sourceDetail: "Email pattern match"
    },
    {
      id: "initial",
      timestamp: "2024-10-15T09:00:00Z",
      type: "lead_created",
      user: "HRMS System",
      oldValue: null,
      newValue: null,
      source: "hrms_import"
    }
  ]
};

export const linkedinFieldData = {
  field: {
    id: "linkedin",
    label: "LinkedIn Profile",
    icon: "💼",
    currentValue: "https://linkedin.com/in/sarahlee-techstart",
    source: "clearbit",
    confidence: 92,
    enrichedAt: "2025-01-05T11:45:00Z",
    status: "enriched",
    verifiedBy: null,
    verifiedAt: null
  },

  fieldHistory: [
    {
      id: "change_001",
      timestamp: "2025-01-05T11:45:00Z",
      type: "api_enrichment",
      source: "clearbit",
      oldValue: null,
      newValue: "https://linkedin.com/in/sarahlee-techstart",
      confidence: 92,
      sourceDetail: "Profile discovery via email"
    },
    {
      id: "initial",
      timestamp: "2024-10-15T09:00:00Z",
      type: "lead_created",
      user: "HRMS System",
      oldValue: null,
      newValue: null,
      source: "hrms_import"
    }
  ]
};

export const githubFieldData = {
  field: {
    id: "github",
    label: "GitHub Profile",
    icon: "💻",
    currentValue: null,
    source: null,
    confidence: null,
    enrichedAt: null,
    status: "failed",
    verifiedBy: null,
    verifiedAt: null
  },

  fieldHistory: [
    {
      id: "change_001",
      timestamp: "2025-01-05T11:50:00Z",
      type: "api_enrichment_failed",
      source: "clearbit",
      oldValue: null,
      newValue: null,
      error: "Profile not found",
      sourceDetail: "No public GitHub profile associated with email"
    },
    {
      id: "initial",
      timestamp: "2024-10-15T09:00:00Z",
      type: "lead_created",
      user: "HRMS System",
      oldValue: null,
      newValue: null,
      source: "hrms_import"
    }
  ]
};

export const formatFieldTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

export const getFieldHistoryIcon = (type: string): string => {
  switch (type) {
    case 'manual_edit':
      return '✏️';
    case 'api_enrichment':
      return '🔄';
    case 'api_enrichment_failed':
      return '❌';
    case 'lead_created':
      return '✨';
    case 'verified':
      return '✅';
    case 'rejected':
      return '🚫';
    default:
      return '📝';
  }
};

export const getFieldHistoryColor = (type: string): string => {
  switch (type) {
    case 'manual_edit':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'api_enrichment':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'api_enrichment_failed':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'lead_created':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'verified':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'rejected':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};
