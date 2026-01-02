# Integration Hub - 5-Minute Quick Test ✅

## Navigate to Integration Hub
```
URL: http://localhost:5173/integrations
```

---

## ✅ 1. Visual Check (30 seconds)

**Check these elements are visible:**
- [ ] Hero: "🔌 Integration Hub" title
- [ ] Hero: "+ Add Custom" button (blue)
- [ ] Stats: "5 Active Connectors | 5 Available | 2,450 syncs today"
- [ ] Search bar with 🔍
- [ ] Category dropdown showing "All Connectors (10)"
- [ ] Two blue toggle buttons: "✓ Connected" and "✓ Available"
- [ ] 5 connected connector cards in grid
- [ ] 5 available connector cards in grid
- [ ] "Custom Integrations" section (empty state)
- [ ] "BMI CRM API" section with API key and webhook URL

---

## ✅ 2. Search Test (30 seconds)

**Type "apollo":**
- [ ] Only Lead Generation connector shows
- [ ] × button appears in search box

**Click × button:**
- [ ] Search clears
- [ ] All 10 connectors reappear

---

## ✅ 3. Filter Test (30 seconds)

**Category dropdown:**
- [ ] Select "Email" → Only Email connector shows
- [ ] Select "HRMS" → Only HRMS connector shows
- [ ] Select "All Connectors" → All 10 reappear

**Toggle buttons:**
- [ ] Click "Connected" toggle → Gray, no ✓, Connected section hides
- [ ] Click again → Blue, ✓, Connected section shows
- [ ] Same for "Available" toggle

---

## ✅ 4. Connected Connector Actions (1 minute)

**On Lead Generation connector:**
- [ ] Click "⚙️ Configure" → Modal opens
- [ ] Click Cancel → Modal closes
- [ ] Click "🔄 Switch Tool" → Shows provider list
- [ ] Click Cancel → Modal closes
- [ ] Click "🔌 Disconnect" → Confirmation modal with stats
- [ ] Click Cancel → Modal closes
- [ ] Click "📥 Import Leads" → Toast shows, navigates

---

## ✅ 5. Available Connector Actions (1 minute)

**On Payment connector:**
- [ ] Click "🔗 Connect Payment" → Modal opens with provider dropdown
- [ ] Select a provider → API key field appears
- [ ] Click Cancel → Modal closes

**On HRMS connector:**
- [ ] Verify button says "Coming Soon" and is gray
- [ ] Verify blue "Coming Soon" badge visible
- [ ] Click "📖 Learn More" → Detailed info modal opens
- [ ] Verify premium badge visible
- [ ] Click Close → Modal closes

---

## ✅ 6. Add Custom Integration (1 minute)

- [ ] Click "+ Add Custom" in hero
- [ ] Modal: "Add Custom Integration" opens
- [ ] Enter name: "Test Tool"
- [ ] Select: REST API
- [ ] Enter description: "Testing"
- [ ] Verify "Next: Configure" enabled
- [ ] Click "Next: Configure"
- [ ] Modal changes to Step 2
- [ ] Enter endpoint: "https://test.com"
- [ ] Enter API key: "test123"
- [ ] Click "Add Integration"
- [ ] Toast: "Custom integration added successfully"

---

## ✅ 7. BMI CRM API Actions (1 minute)

**API Key:**
- [ ] Click "📋 Copy" → Toast: "API Key copied to clipboard"
- [ ] Button changes to "✓ Copied" for 2 seconds
- [ ] Click "🔄" Regenerate → Warning modal opens
- [ ] Verify red warning box
- [ ] Click Cancel → Modal closes

**Webhook:**
- [ ] Click "📋 Copy" → Toast: "Webhook URL copied to clipboard"
- [ ] Click "🧪 Test Webhook" → Modal opens
- [ ] Change event type dropdown → Payload updates
- [ ] Click "Send Test Event" → Shows loading "⏳ Testing..."
- [ ] Wait → Success or error message appears
- [ ] Click Cancel → Modal closes

**Documentation:**
- [ ] Click "📖 View API Documentation" → Toast shows

---

## ✅ 8. Hover Effects (15 seconds)

**Hover over any connector card:**
- [ ] Shadow appears
- [ ] Border turns blue (#667eea)
- [ ] Card lifts slightly
- [ ] Smooth transition

---

## ✅ 9. Responsive Check (30 seconds)

**Resize browser window:**
- [ ] Desktop (>1024px): 3 columns
- [ ] Tablet (768-1023px): 2 columns
- [ ] Mobile (<768px): 1 column
- [ ] Filters stack properly on mobile

---

## ✅ 10. Data Verification (30 seconds)

**Connected Connectors:**
- [ ] Lead Gen: "1,850 leads imported", Last sync: "2 minutes ago"
- [ ] Email: "320 emails today", Last sync: "30 seconds ago"
- [ ] Calendar: "156 meetings synced", Last sync: "5 minutes ago"
- [ ] Communication: "89 notifications sent", Last sync: "1 minute ago"
- [ ] Video Meeting: "35 meetings today", Last sync: "10 minutes ago"

**Stats Bar:**
- [ ] Total syncs: 2,450 (1850+320+156+89+35)

---

## 🎉 Test Complete!

**If all checkboxes are checked, the Integration Hub is working perfectly!**

### Quick Issue Checklist:
- Modals don't open? → Check modal state management
- Toasts don't show? → Check ToastContext integration
- Filters don't work? → Check filter logic
- Navigation fails? → Check react-router-dom setup
- Cards don't hover? → Check CSS classes

### Performance Check:
- [ ] Page loads quickly (< 1 second)
- [ ] Modals open instantly
- [ ] Search/filter is responsive
- [ ] No console errors

---

## Test Result: _____________

✅ **PASS** - All features working
⚠️ **PARTIAL** - Some issues found (list below)
❌ **FAIL** - Major issues (list below)

**Issues Found:**
1. _________________________________
2. _________________________________
3. _________________________________

**Tested By:** _____________
**Date:** _____________
**Browser:** _____________
