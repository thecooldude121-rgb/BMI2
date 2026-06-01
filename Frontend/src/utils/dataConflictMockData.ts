export interface DataConflict {
  field: string;
  fieldLabel: string;
  apollo: {
    value: string;
    confidence: number;
    source: string;
    lastUpdated: string;
    selected: boolean;
  };
  zoominfo: {
    value: string;
    confidence: number;
    source: string;
    lastUpdated: string;
    selected: boolean;
  };
  recommendation: 'apollo' | 'zoominfo';
  reason: string;
}

export const dataConflictData = {
  conflictCount: 3,
  totalFields: 20,
  leadName: "Sarah Lee",
  company: "TechStart Inc.",

  conflicts: [
    {
      field: "company_size",
      fieldLabel: "Company Size",
      apollo: {
        value: "85 employees",
        confidence: 94,
        source: "LinkedIn company page",
        lastUpdated: "2 days ago",
        selected: true
      },
      zoominfo: {
        value: "100-150 employees",
        confidence: 87,
        source: "ZoomInfo database",
        lastUpdated: "1 month ago",
        selected: false
      },
      recommendation: "apollo",
      reason: "Higher confidence score"
    },
    {
      field: "annual_revenue",
      fieldLabel: "Annual Revenue",
      apollo: {
        value: "$10M - $15M",
        confidence: 82,
        source: "Estimated from funding + employee count",
        lastUpdated: "Real-time",
        selected: false
      },
      zoominfo: {
        value: "$12M - $15M",
        confidence: 91,
        source: "Financial filings",
        lastUpdated: "3 months ago",
        selected: true
      },
      recommendation: "zoominfo",
      reason: "Higher confidence score"
    },
    {
      field: "direct_phone",
      fieldLabel: "Direct Phone",
      apollo: {
        value: "+1 (415) 234-5678",
        confidence: 88,
        source: "Verified contact database",
        lastUpdated: "1 week ago",
        selected: true
      },
      zoominfo: {
        value: "+1 (415) 234-9999",
        confidence: 85,
        source: "Public records",
        lastUpdated: "2 months ago",
        selected: false
      },
      recommendation: "apollo",
      reason: "Higher confidence score"
    }
  ] as DataConflict[],

  resolutionOptions: [
    {
      id: "use_recommendations",
      label: "Use recommendations (auto-select highest confidence)",
      description: "Automatically select the data source with highest confidence for each field",
      default: true
    },
    {
      id: "prefer_apollo",
      label: "Always prefer Apollo.io",
      description: "Use Apollo data for all conflicting fields",
      default: false
    },
    {
      id: "prefer_zoominfo",
      label: "Always prefer ZoomInfo",
      description: "Use ZoomInfo data for all conflicting fields",
      default: false
    },
    {
      id: "manual_review",
      label: "Review each conflict manually",
      description: "Select data source for each conflicting field individually",
      default: false
    }
  ],

  recommendations: [
    "Apollo.io data is more recent for company size and direct phone",
    "ZoomInfo has higher confidence for annual revenue from financial filings",
    "You can always update these values manually later in the lead profile"
  ]
};

export function applyResolutionStrategy(
  conflicts: DataConflict[],
  strategy: string
): DataConflict[] {
  return conflicts.map(conflict => {
    let apolloSelected = false;
    let zoominfoSelected = false;

    switch (strategy) {
      case 'use_recommendations':
        apolloSelected = conflict.recommendation === 'apollo';
        zoominfoSelected = conflict.recommendation === 'zoominfo';
        break;
      case 'prefer_apollo':
        apolloSelected = true;
        zoominfoSelected = false;
        break;
      case 'prefer_zoominfo':
        apolloSelected = false;
        zoominfoSelected = true;
        break;
      case 'manual_review':
        apolloSelected = conflict.apollo.selected;
        zoominfoSelected = conflict.zoominfo.selected;
        break;
      default:
        apolloSelected = conflict.recommendation === 'apollo';
        zoominfoSelected = conflict.recommendation === 'zoominfo';
    }

    return {
      ...conflict,
      apollo: { ...conflict.apollo, selected: apolloSelected },
      zoominfo: { ...conflict.zoominfo, selected: zoominfoSelected }
    };
  });
}

export function getConflictSummary(conflicts: DataConflict[]) {
  const apolloSelected = conflicts.filter(c => c.apollo.selected).length;
  const zoominfoSelected = conflicts.filter(c => c.zoominfo.selected).length;

  return {
    apolloSelected,
    zoominfoSelected,
    total: conflicts.length,
    allApollo: apolloSelected === conflicts.length,
    allZoominfo: zoominfoSelected === conflicts.length,
    mixed: apolloSelected > 0 && zoominfoSelected > 0
  };
}
