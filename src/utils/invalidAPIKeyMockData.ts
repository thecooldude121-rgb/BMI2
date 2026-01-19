export const invalidAPIKeyData = {
  error: {
    type: "authentication_failed",
    service: "apollo",
    statusCode: 401,
    message: "Invalid API key",
    timestamp: "2025-01-06T14:45:00Z"
  },

  currentAPIKey: {
    masked: "••••••••••••••••••••••1a2b3c",
    lastVerified: "2024-12-15T10:00:00Z",
    status: "invalid",
    format: "apollo_",
    expectedLength: 36
  },

  possibleCauses: [
    "API key is incorrect or expired",
    "API key was regenerated in Apollo dashboard",
    "Account subscription expired",
    "API key lacks required permissions"
  ],

  options: [
    {
      id: "update_key",
      label: "Update API key",
      description: "Enter a new API key from your Apollo dashboard",
      requiresInput: true
    },
    {
      id: "skip_apollo",
      label: "Skip Apollo, use ZoomInfo only",
      description: "Continue enrichment with ZoomInfo (if available)",
      available: true
    },
    {
      id: "cancel",
      label: "Cancel enrichment",
      description: "Return to lead detail page"
    }
  ],

  howToGetAPIKey: {
    steps: [
      "Go to Apollo.io → Settings → API",
      "Click 'Generate New API Key'",
      "Copy the key and paste it above",
      "Make sure to enable 'Lead Enrichment' permission"
    ],
    settingsUrl: "https://app.apollo.io/#/settings/integrations/api"
  },

  // Alternative services available
  alternativeServices: [
    {
      service: "zoominfo",
      status: "available",
      apiKeyValid: true,
      estimatedFields: 8
    }
  ],

  // Validation rules
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
