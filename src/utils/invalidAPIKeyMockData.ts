export const invalidAPIKeyData = {
  error: {
    type: "authentication_failed",
    service: "apollo",
    errorCode: "401",
    message: "Invalid API key",
    timestamp: "2025-01-06T15:30:00Z"
  },

  possibleCauses: [
    "API key is incorrect or expired",
    "API key was regenerated in Apollo dashboard",
    "Account subscription expired",
    "API key lacks required permissions"
  ],

  currentAPIKey: {
    masked: "••••••••••••••••••••••1a2b3c",
    format: "apollo_",
    expectedLength: 36
  },

  alternativeServices: [
    {
      service: "zoominfo",
      status: "available",
      apiKeyValid: true,
      estimatedFields: 8
    }
  ],

  options: [
    {
      id: "update_api_key",
      label: "Update API key",
      description: "Enter a new API key from your Apollo dashboard",
      requiresInput: true,
      default: true
    },
    {
      id: "skip_apollo",
      label: "Skip Apollo, use ZoomInfo only",
      description: "Continue enrichment with ZoomInfo (if available)",
      requiresInput: false
    },
    {
      id: "cancel",
      label: "Cancel enrichment",
      description: "Return to lead detail page",
      requiresInput: false
    }
  ],

  instructions: {
    title: "HOW TO GET YOUR API KEY",
    steps: [
      "Go to Apollo.io → Settings → API",
      "Click \"Generate New API Key\"",
      "Copy the key and paste it above",
      "Make sure to enable \"Lead Enrichment\" permission"
    ],
    settingsUrl: "https://app.apollo.io/#/settings/integrations/api"
  },

  validation: {
    format: "starts with \"apollo_\" (36 chars)",
    minLength: 36,
    maxLength: 36,
    prefix: "apollo_",
    testEndpoint: "/api/v1/auth/verify"
  }
};

export type InvalidAPIKeyData = typeof invalidAPIKeyData;
export type APIKeyOption = typeof invalidAPIKeyData.options[number];
export type AlternativeService = typeof invalidAPIKeyData.alternativeServices[number];
