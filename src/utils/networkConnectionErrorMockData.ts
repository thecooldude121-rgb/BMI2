export const networkConnectionErrorData = {
  error: {
    type: "network_error",
    subtype: "connection_timeout",
    timestamp: "2025-01-06T14:45:00Z",
    attemptNumber: 1,
    maxAttempts: 3
  },

  connectionStatus: {
    apollo: {
      status: "failed",
      error: "Connection timeout",
      lastAttempt: "2025-01-06T14:45:00Z",
      timeout: 30 // seconds
    },
    zoominfo: {
      status: "failed",
      error: "Connection timeout",
      lastAttempt: "2025-01-06T14:45:00Z",
      timeout: 30
    },
    internet: {
      status: "connected",
      message: "Internet connection active"
    }
  },

  errorDetails: [
    "Request timed out after 30 seconds",
    "DNS resolution failed for api.apollo.io",
    "Possible firewall or proxy issues"
  ],

  possibleCauses: [
    "Temporary service outage",
    "Network connectivity issues",
    "Corporate firewall blocking external APIs",
    "VPN or proxy interference"
  ],

  options: [
    {
      id: "retry",
      label: "Retry connection",
      description: "Try connecting again",
      attemptNumber: 1,
      maxAttempts: 3
    },
    {
      id: "check_status",
      label: "Check service status",
      description: "View Apollo & ZoomInfo status pages",
      statusUrls: {
        apollo: "https://status.apollo.io",
        zoominfo: "https://status.zoominfo.com"
      }
    },
    {
      id: "save_draft",
      label: "Save draft and try later",
      description: "Retry enrichment when connection improves"
    },
    {
      id: "contact_support",
      label: "Contact support",
      description: "Report persistent connection issues",
      supportEmail: "support@company.com"
    }
  ],

  troubleshootingSteps: [
    "Check your internet connection",
    "Disable VPN temporarily and retry",
    "Check if firewall is blocking API access",
    "Try from a different network",
    "Contact your IT department if issue persists"
  ]
};

export type NetworkConnectionErrorData = typeof networkConnectionErrorData;
export type ConnectionOption = typeof networkConnectionErrorData.options[number];
export type ConnectionStatus = typeof networkConnectionErrorData.connectionStatus[keyof typeof networkConnectionErrorData.connectionStatus];
