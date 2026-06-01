export const rateLimitErrorData = {
  error: {
    type: "rate_limit_exceeded",
    service: "apollo",
    timestamp: "2025-01-06T14:45:00Z"
  },

  rateLimitStatus: {
    apollo: {
      used: 100,
      limit: 100,
      percentage: 100,
      resetsIn: "6 hours 23 minutes",
      resetTimestamp: "2025-01-06T21:08:00Z",
      status: "exceeded" as const
    },
    zoominfo: {
      used: 45,
      limit: 100,
      percentage: 45,
      available: 55,
      status: "available" as const
    }
  },

  options: [
    {
      id: "use_zoominfo",
      label: "Use ZoomInfo only for now",
      description: "Continue enrichment with ZoomInfo API",
      available: true,
      estimatedFields: 8
    },
    {
      id: "wait_for_reset",
      label: "Wait for Apollo reset",
      description: "Schedule enrichment for later",
      waitTime: "6 hours 23 minutes",
      scheduledTime: "2025-01-06T21:08:00Z"
    },
    {
      id: "upgrade_plan",
      label: "Upgrade Apollo plan",
      description: "Increase rate limit to 500/day",
      currentPlan: "Basic (100 requests/day)",
      upgradePlan: "Professional (500 requests/day)",
      cost: "$49/month"
    },
    {
      id: "skip",
      label: "Skip enrichment",
      description: "Save draft and enrich manually later"
    }
  ]
};

export type RateLimitErrorData = typeof rateLimitErrorData;
export type RateLimitOption = typeof rateLimitErrorData.options[number];
export type RateLimitStatus = typeof rateLimitErrorData.rateLimitStatus;
