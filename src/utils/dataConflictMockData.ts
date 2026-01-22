export interface DataConflict {
  field: string;
  fieldLabel: string;
  apollo: {
    value: string;
    confidence: number;
    source: string;
    lastUpdated: string;
  };
  zoominfo: {
    value: string;
    confidence: number;
    source: string;
    lastUpdated: string;
  };
  recommendation: 'apollo' | 'zoominfo';
  selected: 'apollo' | 'zoominfo';
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
        source: "LinkedIn company page, updated 2 days ago",
        lastUpdated: "2 days ago"
      },
      zoominfo: {
        value: "100-150 employees",
        confidence: 87,
        source: "ZoomInfo database, updated 1 month ago",
        lastUpdated: "1 month ago"
      },
      recommendation: "apollo",
      selected: "apollo"
    },
    {
      field: "annual_revenue",
      fieldLabel: "Annual Revenue",
      apollo: {
        value: "$10M - $15M",
        confidence: 82,
        source: "Estimated from funding + employee count",
        lastUpdated: "1 week ago"
      },
      zoominfo: {
        value: "$12M - $15M",
        confidence: 91,
        source: "Financial filings, updated 3 months ago",
        lastUpdated: "3 months ago"
      },
      recommendation: "zoominfo",
      selected: "zoominfo"
    },
    {
      field: "direct_phone",
      fieldLabel: "Direct Phone",
      apollo: {
        value: "+1 (415) 234-5678",
        confidence: 88,
        source: "Verified contact database",
        lastUpdated: "1 week ago"
      },
      zoominfo: {
        value: "+1 (415) 234-9999",
        confidence: 85,
        source: "Public records",
        lastUpdated: "2 weeks ago"
      },
      recommendation: "apollo",
      selected: "apollo"
    }
  ] as DataConflict[],

  resolutionStrategies: [
    {
      id: "recommendations",
      label: "Use recommendations (auto-select highest confidence)",
      description: "Automatically select the data source with higher confidence for each field"
    },
    {
      id: "prefer_apollo",
      label: "Always prefer Apollo.io",
      description: "Use Apollo.io data for all conflicting fields"
    },
    {
      id: "prefer_zoominfo",
      label: "Always prefer ZoomInfo",
      description: "Use ZoomInfo data for all conflicting fields"
    },
    {
      id: "manual",
      label: "Review each conflict manually (selected above)",
      description: "Choose which data to use for each individual field"
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
    let selected: 'apollo' | 'zoominfo';

    switch (strategy) {
      case 'recommendations':
        selected = conflict.recommendation;
        break;
      case 'prefer_apollo':
        selected = 'apollo';
        break;
      case 'prefer_zoominfo':
        selected = 'zoominfo';
        break;
      case 'manual':
        selected = conflict.selected;
        break;
      default:
        selected = conflict.recommendation;
    }

    return { ...conflict, selected };
  });
}

export function getConflictSummary(conflicts: DataConflict[]) {
  const apolloSelected = conflicts.filter(c => c.selected === 'apollo').length;
  const zoominfoSelected = conflicts.filter(c => c.selected === 'zoominfo').length;

  return {
    apolloSelected,
    zoominfoSelected,
    total: conflicts.length,
    allApollo: apolloSelected === conflicts.length,
    allZoominfo: zoominfoSelected === conflicts.length,
    mixed: apolloSelected > 0 && zoominfoSelected > 0
  };
}
