export const networkConnectionErrorData = {
  error: {
    type: "network_connection_failed",
    statusCode: 504,
    message: "Cannot connect to enrichment services",
    timestamp: "2025-01-19T16:30:00Z"
  },

  connectionStatus: {
    apollo: {
      service: "Apollo.io",
      status: "failed",
      icon: "❌",
      message: "Connection timeout",
      lastAttempt: "2025-01-19T16:30:15Z"
    },
    zoominfo: {
      service: "ZoomInfo",
      status: "failed",
      icon: "❌",
      message: "Connection timeout",
      lastAttempt: "2025-01-19T16:30:18Z"
    },
    internet: {
      service: "Internet",
      status: "connected",
      icon: "✅",
      message: "Connected",
      lastCheck: "2025-01-19T16:30:20Z"
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

  retryInfo: {
    currentAttempt: 1,
    maxAttempts: 3,
    suggestedDelay: 5000
  },

  options: [
    {
      id: "retry",
      label: "Retry connection",
      sublabel: "Attempt 1 of 3",
      description: "Try connecting again",
      icon: "🔄",
      default: true
    },
    {
      id: "check_status",
      label: "Check service status",
      description: "View Apollo & ZoomInfo status pages",
      icon: "📊"
    },
    {
      id: "save_draft",
      label: "Save draft and try later",
      description: "Retry enrichment when connection improves",
      icon: "💾"
    },
    {
      id: "contact_support",
      label: "Contact support",
      description: "Report persistent connection issues",
      icon: "📧"
    }
  ],

  troubleshootingSteps: [
    "Check your internet connection",
    "Disable VPN temporarily and retry",
    "Check if firewall is blocking API access",
    "Try from a different network",
    "Contact your IT department if issue persists"
  ],

  serviceStatusUrls: {
    apollo: "https://status.apollo.io",
    zoominfo: "https://status.zoominfo.com",
    systemHealth: "/settings/integrations/status"
  },

  supportInfo: {
    email: "support@crm.com",
    phone: "+1 (555) 123-4567",
    chatUrl: "/support/chat",
    ticketUrl: "/support/new-ticket"
  }
};

export type NetworkConnectionErrorData = typeof networkConnectionErrorData;
export type ConnectionOption = typeof networkConnectionErrorData.options[number];
export type ConnectionStatus = typeof networkConnectionErrorData.connectionStatus[keyof typeof networkConnectionErrorData.connectionStatus];
