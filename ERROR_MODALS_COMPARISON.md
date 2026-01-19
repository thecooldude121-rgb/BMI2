# Error Modals Comparison - Rate Limit vs Invalid API Key

## Overview
Comparison of two enrichment error states showing their similarities, differences, and when to use each one.

---

## 🔴 Error State 1: Rate Limit Exceeded

### **When to Show:**
- API request quota exhausted
- Daily/hourly limit reached
- Rate limit counter at 100%
- 429 Too Many Requests response

### **Primary Message:**
```
⚠️ Enrichment Rate Limit Exceeded
Apollo.io daily limit reached (100/100 requests used)
```

### **Key Features:**
- Progress bars showing usage (Apollo: 100%, ZoomInfo: 45%)
- Countdown timer to reset
- Continue with alternative service option
- Schedule for later option
- Upgrade plan option

### **Resolution Options:**
1. Use ZoomInfo only (55 requests available)
2. Wait for reset (6 hours 23 minutes)
3. Upgrade Apollo plan (Basic → Pro, $49/mo)
4. Skip enrichment

### **Visual Design:**
- Amber/Orange header (warning, not error)
- Progress bars with percentage indicators
- Countdown timer (animated)
- Alternative service badge (green)
- Plan comparison card

---

## 🔴 Error State 2: Invalid API Key

### **When to Show:**
- 401 Unauthorized response
- API key validation fails
- Authentication error
- Insufficient permissions error

### **Primary Message:**
```
❌ API Authentication Failed
Apollo.io authentication failed
```

### **Key Features:**
- Error details panel (code, message, causes)
- Masked current API key
- New API key input with validation
- Connection testing flow
- Step-by-step instructions

### **Resolution Options:**
1. Update API key (with test connection)
2. Skip Apollo, use ZoomInfo only
3. Cancel enrichment

### **Visual Design:**
- Red header (error, critical)
- Error details panel with lock icon
- Input field with real-time validation
- Test connection button with states
- Instructions panel with steps

---

## 📊 Side-by-Side Comparison

| Feature | Rate Limit Exceeded | Invalid API Key |
|---------|---------------------|-----------------|
| **Error Type** | Quota/Limit | Authentication |
| **Severity** | Warning (can wait) | Critical (blocks access) |
| **Color** | Amber/Orange | Red |
| **Icon** | ⚠️ Warning Triangle | ❌ Alert Circle |
| **Can Continue?** | Yes (wait or alt service) | Only with valid key |
| **Shows Progress?** | Yes (usage bars) | No |
| **Shows Timer?** | Yes (reset countdown) | No |
| **Requires Input?** | No | Yes (new API key) |
| **Test Connection?** | No | Yes |
| **Upgrade Option?** | Yes | No |
| **Schedule Option?** | Yes | No |
| **Skip Option?** | Yes | Yes (both have this) |
| **Instructions?** | Brief | Detailed (4 steps) |
| **Mock Data File** | `rateLimitErrorMockData.ts` | `invalidAPIKeyMockData.ts` |
| **Demo URL** | `/demo/rate-limit` | `/demo/invalid-api-key` |

---

## 🎨 Visual Differences

### **Header Styles**

**Rate Limit:**
```
┌──────────────────────────────────────┐
│  ⚠️ Enrichment Rate Limit Exceeded   │ (Amber bg-amber-50)
│     Apollo.io daily limit reached    │
└──────────────────────────────────────┘
```

**Invalid API Key:**
```
┌──────────────────────────────────────┐
│  ❌ API Authentication Failed        │ (Red bg-red-50)
│     Apollo.io authentication failed  │
└──────────────────────────────────────┘
```

---

### **Main Content**

**Rate Limit:**
```
Progress Bars:
┌────────────────────────────────────┐
│ Apollo.io                          │
│ [████████████████████] 100%        │
│ All requests used for today        │
│ Resets in: 6 hours 23 minutes      │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ ZoomInfo                           │
│ [████████░░░░░░░░░░░] 45%         │
│ Still available (55 remaining)     │
└────────────────────────────────────┘
```

**Invalid API Key:**
```
Error Details:
┌────────────────────────────────────┐
│ 🔐 Error Details                   │
│                                    │
│ Service: apollo                    │
│ Error Code: 401 Unauthorized       │
│ Message: "Invalid API key"         │
│                                    │
│ Possible causes:                   │
│ • API key is incorrect or expired  │
│ • API key was regenerated          │
│ • Account subscription expired     │
│ • API key lacks permissions        │
└────────────────────────────────────┘

Current API Key (masked):
┌────────────────────────────────────┐
│ ••••••••••••••••••••••1a2b3c       │
└────────────────────────────────────┘
```

---

### **Options Section**

**Rate Limit (4 options):**
```
⦿ Use ZoomInfo only for now
  Continue enrichment with ZoomInfo API
  Available: 55 requests
  Estimated fields: 8

○ Wait for Apollo reset
  Schedule enrichment for later
  Available in: 6 hours 23 minutes

○ Upgrade Apollo plan
  Increase rate limit to 500/day
  Cost: $49/month

○ Skip enrichment
  Save draft and enrich manually later
```

**Invalid API Key (3 options):**
```
⦿ Update API key
  Enter a new API key from your Apollo dashboard
  [Shows input field when selected]

○ Skip Apollo, use ZoomInfo only
  Continue enrichment with ZoomInfo (if available)

○ Cancel enrichment
  Return to lead detail page
```

---

### **Interactive Elements**

**Rate Limit:**
- Radio buttons (select option)
- "Continue" button (primary action)
- "Go to Settings" link
- "View Usage Details" expandable
- Timer countdown (live update)

**Invalid API Key:**
- Radio buttons (select option)
- Text input (API key)
- "Test Connection" button (validation)
- "Save & Test" button (primary action)
- "Go to Settings" button
- "Open Apollo Settings" link (external)

---

## 🔄 User Flow Comparison

### **Rate Limit Flow:**
```
Error Detected (429)
    ↓
Show Rate Limit Modal
    ↓
User Sees:
├─ Current usage: 100/100
├─ Reset time: 6h 23m
└─ Alternative: ZoomInfo (55 available)
    ↓
User Selects Option:
├─ Option 1: Use ZoomInfo → Continue enrichment
├─ Option 2: Wait for reset → Schedule enrichment
├─ Option 3: Upgrade → Redirect to billing
└─ Option 4: Skip → Return to page
    ↓
Action Executed
    ↓
Modal Closes
```

### **Invalid API Key Flow:**
```
Error Detected (401)
    ↓
Show Auth Failed Modal
    ↓
User Sees:
├─ Error: 401 Unauthorized
├─ Current key: •••••1a2b3c
└─ Possible causes (4 listed)
    ↓
User Selects Option:
├─ Option 1: Update Key
│   ↓
│   Enter New Key
│   ↓
│   Validate Format
│   ↓
│   Test Connection
│   ↓
│   Save & Continue
│
├─ Option 2: Skip Apollo → Use ZoomInfo
└─ Option 3: Cancel → Return to page
    ↓
Action Executed
    ↓
Modal Closes
```

---

## 🎯 When to Use Which Modal

### **Use Rate Limit Modal When:**
- ✅ HTTP 429 response received
- ✅ Rate limit counter reaches 100%
- ✅ X-RateLimit-Remaining header = 0
- ✅ Error message contains "rate limit" or "quota"
- ✅ User needs to wait or upgrade
- ✅ Alternative service is available
- ✅ Request can be scheduled for later

**Example Response:**
```json
{
  "error": {
    "code": 429,
    "message": "Rate limit exceeded",
    "retry_after": 22980,
    "limit": 100,
    "remaining": 0
  }
}
```

---

### **Use Invalid API Key Modal When:**
- ✅ HTTP 401 response received
- ✅ Authentication validation fails
- ✅ Error message contains "unauthorized" or "invalid key"
- ✅ API key test returns false
- ✅ User needs to update credentials
- ✅ Permissions are insufficient
- ✅ Key has been revoked or expired

**Example Response:**
```json
{
  "error": {
    "code": 401,
    "message": "Invalid API key",
    "type": "authentication_failed",
    "details": "API key is invalid or expired"
  }
}
```

---

## 🧪 Testing Both Modals

### **Quick Test Both (4 Minutes)**

**Rate Limit (2 min):**
1. Open `/demo/rate-limit`
2. See amber header + progress bars
3. Select "Use ZoomInfo only"
4. Click Continue
5. ✅ Works!

**Invalid API Key (2 min):**
1. Open `/demo/invalid-api-key`
2. See red header + error details
3. Enter: `apollo_abc123def456ghi789jkl012mno3`
4. Click "Test Connection"
5. Click "Save & Test"
6. ✅ Works!

---

## 📊 Mock Data Comparison

### **Rate Limit Data Structure:**
```typescript
{
  error: {
    type: "rate_limit_exceeded",
    service: "apollo",
    timestamp: "..."
  },
  rateLimitStatus: {
    apollo: {
      used: 100,
      limit: 100,
      percentage: 100,
      resetsIn: "6 hours 23 minutes",
      status: "exceeded"
    },
    zoominfo: {
      used: 45,
      limit: 100,
      available: 55,
      status: "available"
    }
  },
  options: [...]
}
```

### **Invalid API Key Data Structure:**
```typescript
{
  error: {
    type: "authentication_failed",
    service: "apollo",
    errorCode: "401",
    message: "Invalid API key",
    timestamp: "..."
  },
  possibleCauses: [
    "API key is incorrect or expired",
    "API key was regenerated",
    "Account subscription expired",
    "API key lacks permissions"
  ],
  currentAPIKey: {
    masked: "••••••••••••••••••••••1a2b3c",
    format: "apollo_",
    expectedLength: 36
  },
  alternativeServices: [...],
  options: [...]
}
```

---

## 🎨 Design Principles

### **Rate Limit Modal:**
**Goal:** Help user understand quota and find alternatives
- **Color:** Warning (amber) - not critical
- **Tone:** Informative, helpful
- **Action:** Provide workarounds
- **Urgency:** Medium (can wait)

### **Invalid API Key Modal:**
**Goal:** Fix authentication to restore access
- **Color:** Error (red) - critical issue
- **Tone:** Problem-focused, solution-oriented
- **Action:** Fix the key or skip
- **Urgency:** High (blocks all access)

---

## 📝 Error Messages Comparison

### **Rate Limit:**
```
Primary: "Enrichment Rate Limit Exceeded"
Secondary: "Apollo.io daily limit reached (100/100 requests used)"
Tone: Factual, with solution offered
```

### **Invalid API Key:**
```
Primary: "API Authentication Failed"
Secondary: "Apollo.io authentication failed"
Details: Error code, message, possible causes
Tone: Diagnostic, with fix instructions
```

---

## 🔗 Shared Features

Both modals share:
- ✅ Modal overlay with backdrop
- ✅ Close button (X) in header
- ✅ Radio button options
- ✅ "Skip" or "Cancel" option
- ✅ "Go to Settings" action
- ✅ Alternative service option (ZoomInfo)
- ✅ Console logging on actions
- ✅ Responsive design
- ✅ Demo page with testing guide
- ✅ Mock data visualization
- ✅ Type-safe implementation

---

## 🎯 Summary

| Aspect | Rate Limit | Invalid API Key |
|--------|------------|-----------------|
| **Error Nature** | Temporary (quota) | Persistent (auth) |
| **Can Wait?** | Yes | No |
| **Fix Required?** | No (optional) | Yes (or skip) |
| **Shows Usage?** | Yes | No |
| **Shows Timer?** | Yes | No |
| **Needs Input?** | No | Yes |
| **Upgrade Path?** | Yes | No |
| **Color Theme** | Amber | Red |
| **Urgency** | Medium | High |
| **Complexity** | Simple (select) | Complex (input+test) |

---

## ✅ Implementation Status

**Rate Limit Modal:**
- ✅ Component created
- ✅ Mock data defined
- ✅ Demo page built
- ✅ Documentation complete
- ✅ Routes configured
- ✅ Build successful

**Invalid API Key Modal:**
- ✅ Component created
- ✅ Mock data defined
- ✅ Demo page built
- ✅ Documentation complete
- ✅ Routes configured
- ✅ Build successful

**Both modals are production-ready!** 🎉

---

## 🚀 Access Both Demos

```bash
# Rate Limit Demo
URL: /demo/rate-limit

# Invalid API Key Demo
URL: /demo/invalid-api-key
```

---

## 📚 Related Documentation

- `RATE_LIMIT_ERROR_STATE_COMPLETE.md` - Rate limit modal docs
- `RATE_LIMIT_QUICK_TEST_GUIDE.md` - Rate limit quick test
- `RATE_LIMIT_MOCK_DATA_INTEGRATION.md` - Rate limit mock data

- `INVALID_API_KEY_ERROR_STATE_COMPLETE.md` - API key modal docs
- `INVALID_API_KEY_QUICK_TEST.md` - API key quick test
- `ERROR_MODALS_COMPARISON.md` - This file
