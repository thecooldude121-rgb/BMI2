# Invalid API Key Error - Quick Test Guide (2 Minutes) ⚡

## 🎯 Access
```
URL: /demo/invalid-api-key
```

---

## ✅ Quick Test Checklist

### **Step 1: Modal Opens (5 seconds)**
- [ ] Red error header displays
- [ ] Title: "API Authentication Failed"
- [ ] Error details panel shows 4 possible causes
- [ ] Current key masked: `••••••••••••••••••••••1a2b3c`
- [ ] Three options visible
- [ ] "Update API key" is pre-selected
- [ ] Input field visible
- [ ] Instructions panel at bottom

---

### **Step 2: Test Valid Key (30 seconds)**

**Action:** Enter valid API key
```
apollo_abc123def456ghi789jkl012mno3
```

**Verify:**
- [ ] No red border on input
- [ ] Format hint shows: `⚠️ starts with "apollo_" (36 chars)`
- [ ] "Test Connection" button enabled

**Action:** Click "Test Connection"

**Verify:**
- [ ] Button shows: "⟳ Testing Connection..."
- [ ] Spinner animates for ~1.5 seconds
- [ ] Button changes to: "✓ Connection Successful"
- [ ] Green success panel appears
- [ ] Success message: "API key is valid!"

**Action:** Click "Save & Test"

**Verify:**
- [ ] Alert appears with masked key
- [ ] Console logs:
  ```javascript
  ✅ API Key Updated
  New API Key: apollo_abc123def456ghi789jkl012mno3
  Key format valid: true
  ```
- [ ] Modal closes

---

### **Step 3: Test Invalid Key (20 seconds)**

**Action:** Reopen modal, enter invalid key
```
wrong_format_123
```

**Verify:**
- [ ] Red border appears on input
- [ ] Red error message: `✗ starts with "apollo_" (36 chars)`
- [ ] "Test Connection" still enabled

**Action:** Click "Test Connection"

**Verify:**
- [ ] Spinner shows for ~1.5 seconds
- [ ] Button changes to: "✗ Connection Failed"
- [ ] Red error panel appears
- [ ] Error message: "Invalid API key"
- [ ] "Save & Test" remains disabled

---

### **Step 4: Test Skip Apollo (15 seconds)**

**Action:** Reopen modal, select "Skip Apollo, use ZoomInfo only"

**Verify:**
- [ ] Input field disappears immediately
- [ ] "Save & Test" button is enabled

**Action:** Click "Save & Test"

**Verify:**
- [ ] Alert: "Continuing with ZoomInfo only..."
- [ ] Console logs:
  ```javascript
  ⏭️ Skipping Apollo, using alternative service
  Alternative service: {service: "zoominfo", status: "available", ...}
  Service status: "available"
  Estimated fields: 8
  ```
- [ ] Modal closes

---

### **Step 5: Test Cancel (10 seconds)**

**Action:** Reopen modal, select "Cancel enrichment"

**Verify:**
- [ ] Input field disappears
- [ ] "Save & Test" button is enabled

**Action:** Click "Cancel" or "Save & Test"

**Verify:**
- [ ] Console logs: `❌ Enrichment cancelled`
- [ ] Modal closes

---

### **Step 6: Test Instructions (10 seconds)**

**Action:** Reopen modal, scroll to instructions panel

**Verify:**
- [ ] Amber panel with lightbulb icon
- [ ] Title: "HOW TO GET YOUR API KEY"
- [ ] 4 numbered steps
- [ ] "Open Apollo Settings" button

**Action:** Click "Open Apollo Settings"

**Verify:**
- [ ] New tab opens
- [ ] URL: `https://app.apollo.io/#/settings/integrations/api`

---

## 🎨 Visual Verification

### **Color Coding:**
- Red header → Error
- Gray panel → Error details
- Blue input → Active field
- Green panel → Success
- Red panel → Validation error
- Amber panel → Instructions

### **Icons:**
- ⚠️ Alert icon in header
- 🔐 Lock icon in error details
- ⟳ Spinner during test
- ✓ Check mark on success
- ✗ X mark on error
- 💡 Lightbulb in instructions
- ↗ External link arrow

---

## 📊 Console Output Examples

### **Valid Key:**
```javascript
✅ API Key Updated
New API Key: apollo_abc123def456ghi789jkl012mno3
Key format valid: true
```

### **Skip Apollo:**
```javascript
⏭️ Skipping Apollo, using alternative service
Alternative service: {
  service: "zoominfo",
  status: "available",
  apiKeyValid: true,
  estimatedFields: 8
}
Service status: "available"
Estimated fields: 8
```

### **Cancel:**
```javascript
❌ Enrichment cancelled
```

---

## ⚡ 30-Second Speed Test

1. Open `/demo/invalid-api-key`
2. Enter: `apollo_abc123def456ghi789jkl012mno3`
3. Click "Test Connection"
4. Wait for green success
5. Click "Save & Test"
6. ✅ DONE!

---

## 🐛 Edge Cases to Test

### **Empty Input:**
- [ ] "Save & Test" is disabled
- [ ] No validation error shown

### **Short Key:**
```
apollo_short
```
- [ ] Red border
- [ ] Error message shows

### **Wrong Prefix:**
```
zoominfo_123456789012345678901234567
```
- [ ] Red border
- [ ] Error message shows

### **Correct Length, Wrong Format:**
```
123456789012345678901234567890123456
```
- [ ] Red border (no apollo_ prefix)
- [ ] Error message shows

---

## 📱 Mobile Test (Optional)

1. Open on mobile device
2. Verify:
   - [ ] Modal fits screen
   - [ ] Scrollable content
   - [ ] Input field accessible
   - [ ] Buttons full-width on small screens
   - [ ] Text readable

---

## ✅ Success Criteria

**All checks passed if:**
- Modal opens and closes correctly
- Validation works in real-time
- Test connection simulates API call
- Success/error states display correctly
- Console logging matches expected output
- All three options work as intended
- Instructions panel links work
- Edge cases handled gracefully

---

## 🎯 Total Time: **~2 minutes**

**Breakdown:**
- Modal display: 5s
- Valid key test: 30s
- Invalid key test: 20s
- Skip Apollo test: 15s
- Cancel test: 10s
- Instructions test: 10s
- **Buffer: 30s**

---

## 🚀 One-Line Test Command

```bash
# Open demo → Enter "apollo_abc123def456ghi789jkl012mno3" → Test → Save
# Expected: Alert + console log → Modal closes ✅
```
