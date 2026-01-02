# Settings Page - Visual Test Guide

## Quick Visual Reference: Where to Find Data

---

## 2FA (Two-Factor Authentication)

### Where to Click:
**SECURITY → 2FA** (in left sidebar)

### What You Should See:
```
┌─────────────────────────────────────────────┐
│ Two-Factor Authentication                   │
│ Add an extra layer of security...          │
├─────────────────────────────────────────────┤
│ [Blue Info Box]                             │
│ 🛡️ Why Enable 2FA?                          │
│ Two-factor authentication adds...           │
│                                             │
│ [Enable Two-Factor Authentication] button  │
└─────────────────────────────────────────────┘
```

**Click the button** → Status changes to "✅ 2FA Enabled"

---

## API Keys

### Where to Click:
**SECURITY → API Keys** (in left sidebar)

### What You Should See:
```
┌─────────────────────────────────────────────┐
│ API Keys                    [+ Create New]  │
│ Manage your API keys for integrations       │
├─────────────────────────────────────────────┤
│ 1. Production API                           │
│    Created: 2024-01-15                      │
│    ┌────────────────────────────┐           │
│    │ ••••••••••••••••           │ [👁️] [📋] │
│    └────────────────────────────┘           │
│    Last used: 2 hours ago                   │
│                                             │
│ 2. Development API                          │
│    Created: 2024-02-01                      │
│    ┌────────────────────────────┐           │
│    │ ••••••••••••••••           │ [👁️] [📋] │
│    └────────────────────────────┘           │
│    Last used: 1 day ago                     │
└─────────────────────────────────────────────┘
```

**2 API keys showing** with show/hide and copy buttons

---

## Sessions

### Where to Click:
**SECURITY → Sessions** (in left sidebar)

### What You Should See:
```
┌─────────────────────────────────────────────┐
│ Active Sessions                             │
│ Manage devices where you're logged in      │
├─────────────────────────────────────────────┤
│ 🖥️  Chrome on MacBook Pro                   │
│     San Francisco, CA                       │
│     Active now                              │
│     [Current Session badge]                 │
│                                             │
│ 📱  Safari on iPhone 14          [Sign Out] │
│     San Francisco, CA                       │
│     2 hours ago                             │
│                                             │
│ 🖥️  Chrome on Windows PC         [Sign Out] │
│     New York, NY                            │
│     1 day ago                               │
│                                             │
│ [Sign Out All Other Sessions] button       │
└─────────────────────────────────────────────┘
```

**3 sessions showing** with device icons and sign out buttons

---

## Deal Stages

### Where to Click:
**PIPELINE SETTINGS → Deal Stages** (in left sidebar)

### What You Should See:
```
┌─────────────────────────────────────────────┐
│ Deal Stages                   [+ Add Stage] │
│ Configure your sales pipeline stages        │
├─────────────────────────────────────────────┤
│ 1. 🔵 Qualification                         │
│    Win Probability: 10%                     │
│    [Edit] [Delete] [↑↓]                     │
│                                             │
│ 2. 🟣 Needs Analysis                        │
│    Win Probability: 25%                     │
│    [Edit] [Delete] [↑↓]                     │
│                                             │
│ 3. 🟠 Proposal                              │
│    Win Probability: 50%                     │
│    [Edit] [Delete] [↑↓]                     │
│                                             │
│ 4. 🟠 Negotiation                           │
│    Win Probability: 75%                     │
│    [Edit] [Delete] [↑↓]                     │
│                                             │
│ 5. 🟢 Closed Won                            │
│    Win Probability: 100%                    │
│    (Cannot be deleted or moved)             │
│                                             │
│ [Save Changes] button                       │
└─────────────────────────────────────────────┘
```

**5 stages showing** with color dots, probabilities, and action buttons

---

## Win Reasons

### Where to Click:
**PIPELINE SETTINGS → Win Reasons** (in left sidebar)

### What You Should See:
```
┌─────────────────────────────────────────────┐
│ Win/Loss Reasons                            │
│ Track why deals are won or lost            │
├─────────────────────────────────────────────┤
│ Win Reasons                      [+ Add]   │
│                                             │
│ • Better pricing              [Edit] [Del]  │
│ • Feature superiority         [Edit] [Del]  │
│ • Customer service            [Edit] [Del]  │
│ • Brand reputation            [Edit] [Del]  │
│                                             │
│ Loss Reasons                     [+ Add]   │
│                                             │
│ • Price too high              [Edit] [Del]  │
│ • Missing features            [Edit] [Del]  │
│ • Lost to competitor          [Edit] [Del]  │
│ • No budget                   [Edit] [Del]  │
│                                             │
│ [Save Changes] button                       │
└─────────────────────────────────────────────┘
```

**4 win reasons and 4 loss reasons showing** with action buttons

---

## Stage Probabilities

### Where to Click:
**PIPELINE SETTINGS → Probabilities** (in left sidebar)

### What You Should See:
```
┌─────────────────────────────────────────────┐
│ Stage Probabilities                         │
│ Set win probability for each stage         │
├─────────────────────────────────────────────┤
│ Qualification                          10%  │
│ ▓▓░░░░░░░░░░░░░░░░░░                        │
│                                             │
│ Needs Analysis                         25%  │
│ ▓▓▓▓▓░░░░░░░░░░░░░░░                        │
│                                             │
│ Proposal                               50%  │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░                        │
│                                             │
│ Negotiation                            75%  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░                        │
│                                             │
│ Closed Won                            100%  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                        │
│                                             │
│ [Save Probabilities] button                 │
└─────────────────────────────────────────────┘
```

**5 stages with interactive sliders showing**

---

## Complete Navigation Path for Each Feature

### 1. To See 2FA:
```
CRM → Settings → SECURITY (sidebar) → 2FA
```

### 2. To See API Keys:
```
CRM → Settings → SECURITY (sidebar) → API Keys
```

### 3. To See Sessions:
```
CRM → Settings → SECURITY (sidebar) → Sessions
```

### 4. To See Deal Stages:
```
CRM → Settings → PIPELINE SETTINGS (sidebar) → Deal Stages
```

### 5. To See Win Reasons:
```
CRM → Settings → PIPELINE SETTINGS (sidebar) → Win Reasons
```

### 6. To See Stage Probabilities:
```
CRM → Settings → PIPELINE SETTINGS (sidebar) → Probabilities
```

---

## Alternative: Use "All" Views

If you want to see everything in one place:

### Security "All" View:
**SECURITY → All Security**
Shows: 2FA status, API keys, sessions, and login history all on one page

### Pipeline "All" View:
**PIPELINE SETTINGS → All Pipeline**
Shows: Deal stages, lost reasons, won reasons, and automation settings all on one page

---

## Sidebar Visual Reference

The left sidebar should look like this:

```
┌──────────────────────┐
│ 👤 ACCOUNT           │
│  • Profile           │ ← Click here for profile
│  • Password          │
│                      │
│ 🎨 PREFERENCES       │
│  • Preferences       │
│  • General           │
│  • Display           │
│                      │
│ 🔌 INTEGRATIONS      │
│  • Overview          │
│                      │
│ 🔔 NOTIFICATIONS     │
│  • All Notifications │
│  • Email Alerts      │
│  • In-App            │
│  • Slack             │
│                      │
│ 🔒 SECURITY          │
│  • All Security      │ ← Or click here
│  • 2FA               │ ← Click here for 2FA
│  • API Keys          │ ← Click here for API Keys
│  • Sessions          │ ← Click here for Sessions
│                      │
│ 💳 BILLING           │
│  • All Billing       │
│  • Plan              │
│  • Payment           │
│  • Invoices          │
│                      │
│ 💾 DATA & PRIVACY    │
│  • All D&P           │
│  • Export            │
│  • Delete            │
│                      │
│ ✉️  EMAIL TEMPLATES  │
│  • All Templates     │
│  • Outreach          │
│  • Follow-up         │
│                      │
│ 🎯 PIPELINE          │
│  • All Pipeline      │ ← Or click here
│  • Deal Stages       │ ← Click here for stages
│  • Probabilities     │ ← Click here for sliders
│  • Win Reasons       │ ← Click here for reasons
│                      │
│ 🔧 CUSTOM FIELDS     │
│  • All Fields        │
│  • Leads             │
│  • Contacts          │
│  • Accounts          │
│  • Deals             │
│                      │
│ 👥 TEAM MGMT         │
│  • Team Overview     │
└──────────────────────┘
```

---

## Common Issues and Solutions

### Issue: "I don't see any data"

**Solution**: Make sure you're clicking on the correct subsection in the sidebar.
- Don't just hover - CLICK the subsection name
- The selected item should have a blue background
- The content area (80% right side) should update

### Issue: "The sidebar doesn't show my sections"

**Solution**: You might be on the wrong page.
1. Check URL: should be `/crm/settings`
2. Look for the big "Settings" title at the top
3. Sidebar should be 20% width on the left

### Issue: "Nothing happens when I click"

**Solution**:
1. Check browser console (F12) for errors
2. Try hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Clear browser cache
4. Try a different browser

### Issue: "I see the section title but no content"

**Solution**: This shouldn't happen, but if it does:
1. Check that you clicked on a subsection (like "2FA"), not just the section header (like "SECURITY")
2. Scroll down - some content might be below the fold
3. Try clicking a different subsection, then click back

---

## Quick Test Checklist

Use this to verify each feature works:

- [ ] **Navigate to Settings**: `/crm/settings`
- [ ] **See sidebar**: 20% left side with 11 sections
- [ ] **See content area**: 80% right side

### Security Tests:
- [ ] Click **SECURITY → 2FA**: See "Enable Two-Factor Authentication" button
- [ ] Click **SECURITY → API Keys**: See 2 API keys (Production and Development)
- [ ] Click **SECURITY → Sessions**: See 3 sessions (Mac, iPhone, Windows)
- [ ] Click **SECURITY → All Security**: See all of the above on one page

### Pipeline Tests:
- [ ] Click **PIPELINE → Deal Stages**: See 5 stages with colors and percentages
- [ ] Click **PIPELINE → Win Reasons**: See 4 win reasons and 4 loss reasons
- [ ] Click **PIPELINE → Probabilities**: See 5 sliders with percentages
- [ ] Click **PIPELINE → All Pipeline**: See stages, reasons, and automation

### Other Sections:
- [ ] Click **ACCOUNT → Profile**: See Alex Rodriguez profile
- [ ] Click **NOTIFICATIONS → All Notifications**: See 27+ checkboxes
- [ ] Click **BILLING → All Billing**: See Professional plan $298/month
- [ ] Click **EMAIL TEMPLATES → All Templates**: See 3 templates
- [ ] Click **INTEGRATIONS → Overview**: See 5 connected integrations

---

## Expected Data Summary

Here's what data should be present in each section:

| Feature | Expected Data Count |
|---------|---------------------|
| 2FA | 1 status (enabled/disabled) |
| API Keys | 2 keys |
| Sessions | 3 active sessions |
| Deal Stages | 5 stages |
| Win Reasons | 4 reasons |
| Loss Reasons | 4 reasons |
| Stage Probabilities | 5 sliders |
| Email Templates | 3 templates |
| Integrations | 5 connected services |
| Team Members | 3 members |
| Notifications | 27+ preferences |
| Billing Invoices | 3 invoices |

---

## Still Having Issues?

If you've followed this guide and still don't see data:

1. **Check your browser console** (F12 → Console tab)
   - Look for any red error messages
   - Take a screenshot

2. **Verify your location**:
   - URL should be: `/crm/settings`
   - Page title should say "Settings"
   - Left sidebar should show 11 sections

3. **Try this sequence**:
   - Go to `/crm/settings`
   - Click "All Security" in sidebar
   - You should immediately see 2FA, API Keys, and Sessions all on one page
   - If you don't see this, something is wrong with your build

4. **Clear everything and rebuild**:
   ```bash
   # Clear cache
   rm -rf node_modules dist
   # Reinstall
   npm install
   # Rebuild
   npm run build
   ```

---

**Last Updated**: December 13, 2025
**Build Status**: ✅ Successful
**All Data Verified**: ✅ Present and Working
