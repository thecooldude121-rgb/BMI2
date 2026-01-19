# Network Connection Error - Quick Test Guide ⚡

## 🎯 2-Minute Test

### **Access:**
```
URL: /demo/network-error
```

---

## ✅ Quick Verification Steps

### **Step 1: Trigger Error (10 seconds)**
```
1. Click "Trigger Network Error" button
2. ✅ Modal opens immediately
3. ✅ Header shows: "NETWORK CONNECTION ERROR"
4. ✅ Orange-to-red gradient header
5. ✅ Globe emoji (🌐) visible
```

---

### **Step 2: Verify Connection Status (15 seconds)**
```
Check Connection Status Panel:
✅ Apollo.io:  ❌ Connection timeout
✅ ZoomInfo:   ❌ Connection timeout
✅ Internet:   ✅ Connected

Check Error Details Box (red background):
✅ "Request timed out after 30 seconds"
✅ "DNS resolution failed for api.apollo.io"
✅ "Possible firewall or proxy issues"
```

---

### **Step 3: Test Retry Flow (20 seconds)**
```
1. ✅ "Retry connection (Attempt 1 of 3)" is selected by default
2. Click "Retry Now" button
3. ✅ Spinner shows "Retrying..."
4. ✅ Modal reopens with "Attempt 2 of 3"
5. ✅ Action log shows retry event
6. Click "Retry Now" again
7. ✅ Counter shows "Attempt 3 of 3"
```

---

### **Step 4: Test Service Status (15 seconds)**
```
1. Select "Check service status" radio button
2. ✅ Option highlights in blue
3. Click "Service Status" button
4. ✅ Console logs: "📊 Opening Service Status Pages"
5. ✅ Action log shows URLs opened
```

---

### **Step 5: Test Other Options (20 seconds)**
```
Save Draft:
1. Select "Save draft and try later"
2. Click "Save Draft" button
3. ✅ Console logs: "💾 Saving draft for later retry"
4. ✅ Modal closes

Contact Support:
1. Reopen modal
2. Select "Contact support"
3. Click "Contact Support" button
4. ✅ Console logs support info
5. ✅ Phone number displayed: +1 (555) 123-4567
```

---

### **Step 6: Verify Troubleshooting (10 seconds)**
```
Check Troubleshooting Steps Panel (blue background):
✅ 🔍 "TROUBLESHOOTING STEPS" header
✅ 5 numbered steps visible:
   1. Check your internet connection
   2. Disable VPN temporarily and retry
   3. Check if firewall is blocking API access
   4. Try from a different network
   5. Contact your IT department if issue persists
```

---

### **Step 7: Action Buttons (10 seconds)**
```
Verify all 5 buttons present:
✅ 🔄 Retry Now (blue)
✅ 📊 Service Status (purple)
✅ 💾 Save Draft (green)
✅ 📧 Contact Support (orange)
✅ ❌ Cancel (gray)
```

---

## 🎮 Interactive Elements

### **What to Click:**

1. **Radio Buttons:**
   - Click each option
   - Verify blue highlight
   - Check description text

2. **Retry Now Button:**
   - Click to retry
   - Watch spinner animation
   - Check attempt counter

3. **Service Status Button:**
   - Opens external tabs
   - Logs URLs to console

4. **Save Draft Button:**
   - Closes modal
   - Logs save action

5. **Contact Support Button:**
   - Shows support info
   - Logs contact details

6. **Cancel Button:**
   - Closes modal
   - Logs cancellation

---

## 📊 Expected Console Output

```javascript
// When retry is clicked:
🔄 Network Error Action: retry
{
  option: "retry",
  attemptNumber: 1,
  timestamp: "2025-01-19T..."
}
🔄 Immediate Retry Triggered
⚠️ Retry failed - Connection still unavailable

// When service status is checked:
📊 Opening Service Status Pages
✅ Apollo.io status: https://status.apollo.io
✅ ZoomInfo status: https://status.zoominfo.com

// When draft is saved:
💾 Saving draft for later retry

// When support is contacted:
📧 Opening support contact
📋 Ticket created with error details
📞 Support: +1 (555) 123-4567
```

---

## 🎨 Visual Checks

### **Colors:**
- ✅ Header: Orange-to-red gradient
- ✅ Failed connections: Red text + ❌
- ✅ Internet connected: Green text + ✅
- ✅ Error details: Red background (bg-red-50)
- ✅ Troubleshooting: Blue background (bg-blue-50)
- ✅ Selected option: Blue border and background

### **Icons:**
- ✅ 🌐 Network/Globe (header)
- ✅ 🔌 Connection plug (status panel)
- ✅ ❌ Failed indicators
- ✅ ✅ Success indicators
- ✅ 🔄 Retry
- ✅ 📊 Service status
- ✅ 💾 Save draft
- ✅ 📧 Contact support
- ✅ 🔍 Troubleshooting

---

## 📋 Demo Page Features

### **Left Panel - Mock Data:**
```
✅ JSON structure visible
✅ Error info (type, code, message)
✅ Retry status (current/max attempts)
✅ Connection status (all services)
✅ Available options list
```

### **Right Panel - Action Log:**
```
✅ Timestamped events
✅ Event counter
✅ Scrollable log area
✅ Testing tips panel
```

### **Bottom Section:**
```
✅ Features & Interactions grid
✅ Connection Status features
✅ Retry Logic features
✅ Resolution Options features
✅ Troubleshooting steps list
✅ Quick Test Guide (2 scenarios)
```

---

## 🔍 Data Verification

### **Mock Data Object:**
```javascript
networkConnectionErrorData = {
  error: {
    type: "network_connection_failed",
    statusCode: 504,
    message: "Cannot connect to enrichment services"
  },

  connectionStatus: {
    apollo: { status: "failed", message: "Connection timeout" },
    zoominfo: { status: "failed", message: "Connection timeout" },
    internet: { status: "connected", message: "Connected" }
  },

  retryInfo: {
    currentAttempt: 1,
    maxAttempts: 3,
    suggestedDelay: 5000
  },

  options: [
    { id: "retry", label: "Retry connection", ... },
    { id: "check_status", label: "Check service status", ... },
    { id: "save_draft", label: "Save draft and try later", ... },
    { id: "contact_support", label: "Contact support", ... }
  ]
}
```

---

## 🎯 Test Scenarios

### **Scenario A: Retry Until Max Attempts**
```
1. Trigger error
2. Click "Retry Now"
3. Watch counter: 1 → 2
4. Click "Retry Now" again
5. Watch counter: 2 → 3
6. Click "Retry Now" once more
7. ✅ Modal closes after 3rd attempt
8. ✅ Log shows: "Maximum retry attempts reached (3/3)"
```

**Expected Result:** System prevents 4th retry attempt.

---

### **Scenario B: Alternative Resolution**
```
1. Trigger error
2. Select "Save draft and try later"
3. Click "Save Draft"
4. ✅ Draft saved (logged)
5. ✅ Modal closes
6. Reset demo
7. Trigger error again
8. Select "Contact support"
9. Click "Contact Support"
10. ✅ Support info logged
11. ✅ Modal closes
```

**Expected Result:** Both alternative paths work correctly.

---

## ⚡ Speed Test (30 seconds)

### **Rapid Fire Test:**
```
1. Trigger error (2s)
2. Verify status panel (5s)
3. Click Retry Now (3s)
4. Check attempt counter (2s)
5. Select Service Status (3s)
6. Click Service Status (3s)
7. Reopen modal (2s)
8. Select Save Draft (3s)
9. Click Save Draft (2s)
10. Check action log (5s)
```

**Total:** 30 seconds

**Pass Criteria:**
- ✅ All interactions respond instantly
- ✅ No console errors
- ✅ All logs present
- ✅ Visual states update correctly

---

## 🚨 Common Issues & Solutions

### **Issue 1: Modal doesn't open**
```
Solution: Check route is /demo/network-error
Verify: Button click handler fires
```

### **Issue 2: Retry counter doesn't increment**
```
Solution: Check attemptNumber prop passed correctly
Verify: State updates in demo page
```

### **Issue 3: Service status doesn't open tabs**
```
Solution: Check popup blocker settings
Verify: Console logs show URLs
```

### **Issue 4: Console logs missing**
```
Solution: Open DevTools Console tab
Verify: Console.log statements in component
```

---

## ✅ Success Criteria

### **All Must Pass:**
- ✅ Modal opens and displays correctly
- ✅ Connection status shows 3 services
- ✅ Error details visible in red panel
- ✅ 4 resolution options present
- ✅ Retry counter increments (1→2→3)
- ✅ Troubleshooting steps visible
- ✅ All 5 action buttons work
- ✅ Console logs all actions
- ✅ Action log updates in real-time
- ✅ Modal closes on Cancel
- ✅ Reset button clears state
- ✅ No TypeScript errors
- ✅ No console warnings

---

## 🎉 Quick Pass/Fail

### **PASS if:**
- ✅ All visual elements present
- ✅ All interactions work
- ✅ Console logs appear
- ✅ Retry counter increments
- ✅ Modal opens/closes properly

### **FAIL if:**
- ❌ Modal doesn't open
- ❌ Status indicators missing
- ❌ Retry doesn't increment
- ❌ Buttons don't respond
- ❌ Console has errors

---

## 🏁 Final Check

```
Open: /demo/network-error
Click: Trigger Network Error
Verify: Modal visible ✅
Click: Retry Now
Verify: Counter increments ✅
Click: Service Status
Verify: Console logs URLs ✅
Click: Save Draft
Verify: Modal closes ✅
Click: Reset Demo
Verify: State cleared ✅
```

**If all ✅ above: TEST PASSED! 🎉**

---

## 📖 Documentation

**Full Docs:** `NETWORK_CONNECTION_ERROR_COMPLETE.md`

**Quick Links:**
- Mock Data: `/src/utils/networkConnectionErrorMockData.ts`
- Component: `/src/components/LeadGeneration/NetworkConnectionErrorModal.tsx`
- Demo: `/src/pages/LeadGeneration/NetworkConnectionErrorDemo.tsx`
- Route: `/demo/network-error`

---

**Total Test Time:** 2 minutes
**Status:** ✅ READY FOR TESTING
