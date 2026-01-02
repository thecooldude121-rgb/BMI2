# Screen 11.1 - Settings Page Quick Guide

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CRM NAVIGATION BAR                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  ⚙️  Settings                                                            │
│  Manage your account, preferences, and CRM configuration                 │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────────────────────────────────────┐
│  SIDEBAR (20%)   │  CONTENT AREA (80%)                                  │
├──────────────────┼──────────────────────────────────────────────────────┤
│                  │                                                      │
│ 👤 ACCOUNT       │   [Dynamic content based on selection]              │
│  • Profile       │                                                      │
│  • Password      │   • Forms with inputs                               │
│                  │   • Buttons and actions                             │
│ 🎨 PREFERENCES   │   • Tables and lists                                │
│  • Preferences   │   • Interactive controls                            │
│  • General       │   • Status indicators                               │
│  • Display       │   • Data displays                                   │
│                  │                                                      │
│ 🔌 INTEGRATIONS  │                                                      │
│  • Overview      │                                                      │
│                  │                                                      │
│ 🔔 NOTIFICATIONS │                                                      │
│  • All Notif.    │                                                      │
│  • Email Alerts  │                                                      │
│  • In-App        │                                                      │
│  • Slack         │                                                      │
│                  │                                                      │
│ 🔒 SECURITY      │                                                      │
│  • All Security  │                                                      │
│  • 2FA           │                                                      │
│  • API Keys      │                                                      │
│  • Sessions      │                                                      │
│                  │                                                      │
│ 💳 BILLING       │                                                      │
│  • All Billing   │                                                      │
│  • Plan          │                                                      │
│  • Payment       │                                                      │
│  • Invoices      │                                                      │
│                  │                                                      │
│ 💾 DATA & PRIVACY│                                                      │
│  • All D&P       │                                                      │
│  • Export        │                                                      │
│  • Delete        │                                                      │
│                  │                                                      │
│ ✉️  EMAIL TEMPLATES                                                     │
│  • All Templates │                                                      │
│  • Outreach      │                                                      │
│  • Follow-up     │                                                      │
│                  │                                                      │
│ 🎯 PIPELINE      │                                                      │
│  • All Pipeline  │                                                      │
│  • Deal Stages   │                                                      │
│  • Probabilities │                                                      │
│  • Win Reasons   │                                                      │
│                  │                                                      │
│ 🔧 CUSTOM FIELDS │                                                      │
│  • All Fields    │                                                      │
│  • Leads         │                                                      │
│  • Contacts      │                                                      │
│  • Accounts      │                                                      │
│  • Deals         │                                                      │
│                  │                                                      │
│ 👥 TEAM MGMT     │                                                      │
│  • Team Overview │                                                      │
│                  │                                                      │
└──────────────────┴──────────────────────────────────────────────────────┘
```

---

## 5-Minute Demo Script

### Minute 1: Account & Profile
1. Navigate to **CRM → Settings**
2. Verify you're on **Profile** by default
3. Click **"Edit Profile"** button
4. Change first name to "Test"
5. Click **"Save Changes"** (shows alert)
6. Scroll down to **Change Password** section
7. Type in new password field
8. Watch password strength indicator update in real-time

### Minute 2: Notifications
1. Click **"All Notifications"** in sidebar
2. Check/uncheck various notification toggles
3. Change email frequency dropdown
4. Scroll to **In-App Notifications**
5. Toggle desktop notifications
6. Scroll to **Slack Notifications**
7. See connected status and channel list
8. Click **"Save Changes"** button

### Minute 3: Security
1. Click **"All Security"** in sidebar
2. See 2FA status (not enabled)
3. Click **"Enable 2FA"** (shows alert)
4. Scroll to **API Keys** section
5. Click copy button next to API key
6. See "copied" confirmation message
7. Scroll to **Active Sessions** section
8. See 3 sessions listed with device/location info

### Minute 4: Email Templates
1. Click **"All Email Templates"** in sidebar
2. See 3 existing templates with stats:
   - VP Sales Introduction (62% open rate)
   - Follow-up After Demo (85% open rate)
   - Proposal Sent (91% open rate)
3. Click **"Create New"** button
4. Fill in template form:
   - Name: "Test Template"
   - Subject: "Hello {{first_name}}"
   - Body: "This is a test"
5. See merge fields reference panel
6. Click **"Save Template"** (shows alert)
7. See new template in list

### Minute 5: Pipeline & Team
1. Click **"Deal Stages"** under Pipeline Settings
2. See 5 stages listed with:
   - Color dots
   - Stage names
   - Probability percentages
   - Edit/Delete buttons
   - Drag handles
3. Click **"Add Stage"** button
4. Click **"Team Overview"** under Team Management
5. See:
   - 3 team members displayed
   - Statistics cards (3 members, 3 roles, 100% activity)
   - 4 coming features listed
   - "Manage Team" button (disabled, coming soon)

---

## Interactive Elements to Test

### Forms & Inputs
```
Profile Settings:
  [Text Input: First Name     ] ← Type here
  [Text Input: Last Name      ] ← Type here
  [Email Input: Email         ] ← Type here
  [Select: Department ▼       ] ← Click to open
  [Button: Save Changes       ] ← Click to submit
  [Button: Cancel             ] ← Click to discard

Password Settings:
  [Password: Current Password ] 👁️ ← Click eye to show/hide
  [Password: New Password     ] 👁️ ← Click eye to show/hide
  [████████░░░░░░░░ Strength  ] ← Updates live
  ✓ At least 8 characters
  ✓ Contains uppercase letter
  ✓ Contains lowercase letter
  [Button: Update Password    ] ← Click to submit
```

### Checkboxes & Toggles
```
Notifications:
  ☑ New lead assigned to me
  ☑ Lead score above 80 (hot leads)
  ☐ All new leads
  ☑ Lead converted to contact

  [Save Changes] ← Click to submit
```

### Buttons & Actions
```
Security:
  API Key: sk_live_abc123... [📋 Copy] [🔄 Regenerate]

Sessions:
  Chrome on Mac (Current Session)
  Safari on iPhone            [Sign Out]
  Chrome on Windows          [Sign Out]

  [Sign Out All Other Sessions] ← Red button
```

### Tables & Lists
```
Email Templates:
  ┌────────────────────┬──────┬─────────┬───────────┬─────────┐
  │ Template Name      │ Used │ Opens   │ Replies   │ Actions │
  ├────────────────────┼──────┼─────────┼───────────┼─────────┤
  │ VP Sales Intro     │ 45   │ 62%     │ 18%       │ ✏️ 🗑️   │
  │ Follow-up Demo     │ 78   │ 85%     │ 45%       │ ✏️ 🗑️   │
  │ Proposal Sent      │ 34   │ 91%     │ 67%       │ ✏️ 🗑️   │
  └────────────────────┴──────┴─────────┴───────────┴─────────┘

  [+ Create New]
```

---

## Color Coding

### Active State (Selected)
```
┌──────────────────┐
│ • Profile        │ ← Blue background (bg-blue-50)
└──────────────────┘    Blue text (text-blue-700)
```

### Inactive State (Hover)
```
┌──────────────────┐
│ • Password       │ ← Gray background on hover (hover:bg-gray-50)
└──────────────────┘    Gray text (text-gray-700)
```

### Button States
```
[Save Changes]     ← Primary (blue, bg-blue-600)
[Cancel]           ← Secondary (gray border)
[Delete Account]   ← Danger (red, border-red-300)
[✏️ Edit]          ← Icon button (hover effect)
```

---

## Keyboard Navigation

### Tab Through Elements
1. Press **Tab** to move between interactive elements
2. Press **Enter** to click buttons/links
3. Press **Space** to toggle checkboxes
4. Press **Arrow Keys** in dropdowns

### Example Flow
```
Tab → First Name Input (focused)
Tab → Last Name Input (focused)
Tab → Email Input (focused)
Tab → Department Dropdown (focused)
Enter → Opens dropdown
↓ → Selects next option
Enter → Confirms selection
Tab → Save Changes Button (focused)
Enter → Submits form
```

---

## Mobile/Responsive View

### Desktop (> 1024px)
- Sidebar: 20% width, visible
- Content: 80% width
- Full navigation

### Tablet (768px - 1024px)
- Sidebar: May become narrower
- Content: Takes remaining space
- Icons may adjust

### Mobile (< 768px)
- Sidebar: May collapse to hamburger menu
- Content: Full width
- Touch-optimized buttons

---

## Common User Flows

### Flow 1: Update Profile
1. Click **"Profile"** in sidebar
2. Click **"Edit Profile"** button
3. Change fields as needed
4. Click **"Save Changes"**
5. See success message

### Flow 2: Enable 2FA
1. Click **"All Security"** or **"2FA"**
2. Click **"Enable 2FA"** button
3. Follow setup wizard (mock)
4. Status changes to "Enabled"

### Flow 3: Create Email Template
1. Click **"All Email Templates"**
2. Click **"Create New"** button
3. Enter template name
4. Enter subject with merge fields
5. Enter body text
6. Click **"Save Template"**
7. See template in list

### Flow 4: Manage Notifications
1. Click **"All Notifications"**
2. Check/uncheck desired options
3. Change email frequency
4. Toggle in-app settings
5. Click **"Save Changes"**
6. See confirmation

### Flow 5: View Team
1. Click **"Team Overview"**
2. See current team members (3)
3. View coming features
4. Note "Manage Team" button is disabled

---

## Troubleshooting

### Issue: Sidebar not sticky
- **Check**: Scroll the page
- **Expected**: Sidebar stays in view while content scrolls

### Issue: Buttons not working
- **Check**: Browser console for errors
- **Expected**: Console.log messages or alerts appear

### Issue: Active state not showing
- **Check**: Click a different subsection
- **Expected**: Blue background appears on clicked item

### Issue: Forms not updating
- **Check**: Type in input fields
- **Expected**: State updates, values change

---

## Quick Stats

- **11** Main Sections
- **34** Subsections
- **150+** Interactive Elements
- **35** Component Files
- **100+** Buttons
- **50+** Checkboxes
- **40+** Text Inputs
- **25+** Dropdowns
- **10+** Tables/Lists

---

## Access URLs

```
Main Settings:           /crm/settings
Profile (default):       /crm/settings (loads profile)
Notifications:           /crm/settings?section=notifications-all
Security:                /crm/settings?section=security-all
Email Templates:         /crm/settings?section=email-templates-all
Pipeline Settings:       /crm/settings?section=pipeline-all
Custom Fields:           /crm/settings?section=custom-fields-all
Team Management:         /crm/settings?section=team
```

---

## Performance Notes

- **Build Time**: ~20 seconds
- **Page Load**: Fast (lazy loading ready)
- **Interaction**: Immediate response
- **Transitions**: Smooth (300ms)

---

## Browser Compatibility

✅ Chrome/Chromium (Latest)
✅ Firefox (Latest)
✅ Safari (Latest)
✅ Edge (Latest)
✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## Accessibility

✅ **Keyboard**: Full keyboard navigation support
✅ **Screen Readers**: Semantic HTML, proper labels
✅ **Focus**: Visible focus indicators (ring-2)
✅ **Contrast**: WCAG AA compliant colors
✅ **Alt Text**: Icons have meaningful context

---

## Next Steps

1. **Test**: Click through all 34 subsections
2. **Interact**: Try all forms and buttons
3. **Validate**: Check password strength, required fields
4. **Explore**: See all 11 sections
5. **Review**: Read component code for details

---

**Status**: ✅ Ready to demo
**Last Updated**: December 13, 2025
