# CAMPAIGN WIZARD STEP 5 - CAMPAIGN SETTINGS

## Overview
Comprehensive implementation of Step 5 with sending schedule, automation rules, email sender settings, tracking & analytics, and compliance configurations.

---

## KEY FEATURES

### 1. Sending Schedule Section
Complete scheduling and timing controls:
- **Campaign Start**: Immediate or scheduled start
- **Send Time Optimization**: AI-based or fixed send times
- **Business Hours Only**: 9 AM - 5 PM in recipient's timezone
- **Send Days**: 7-day selector (Mon-Sun)
- **Daily Send Limit**: Dropdown selector (25, 50, 100, 200, 500)
- **Timezone Handling**: Send in recipient's timezone

### 2. Automation Rules Section
Comprehensive automation options:
- **Stop Conditions** (6 options):
  - Lead replies to any email
  - Lead unsubscribes
  - Lead is converted to opportunity
  - Lead is manually disqualified
  - Lead opens 3+ emails without replying
  - Email bounces 2+ times
- **Follow-up Actions** (4 options when lead replies):
  - Notify campaign owner
  - Create task for follow-up
  - Auto-assign to sales rep
  - Send internal Slack notification
- **Click Actions** (3 options when lead clicks link):
  - Track click in analytics
  - Notify campaign owner
  - Trigger next touch immediately

### 3. Email Sender Settings
Professional email configuration:
- **From Name**: Text input (default: "Adithya from Moving Walls")
- **From Email**: Dropdown selector with verified indicator
- **Reply-To Email**: Optional field
- **Email Signature**: Textarea with multi-line support

### 4. Tracking & Analytics
Comprehensive tracking options:
- Track email opens
- Track link clicks
- Track replies
- Record bounce/unsubscribe events
- **UTM Parameters**: Auto-add UTM tags with campaign, source, medium

### 5. Compliance
Legal compliance settings:
- Include unsubscribe link (required)
- Add physical mailing address (CAN-SPAM)
- Honor unsubscribe requests immediately
- Physical address display when enabled

---

## DETAILED SECTION BREAKDOWN

### SENDING SCHEDULE SECTION

**Section Header**:
- Text: "SENDING SCHEDULE" (uppercase, tracked, semibold, gray-700)
- Border bottom: Gray-200
- Padding bottom: 8px
- Margin bottom: 16px

#### Campaign Start

**Sub-header**: "Campaign Start" (small, medium, gray-900)

**Grid Layout**: 2 columns with 16px gap

**Card 1: Start Immediately**
- Border: 2px solid
- Selected: Blue-500 border, Blue-50 background
- Unselected: Gray-200 border, white background
- Padding: 16px
- Rounded: lg
- Cursor: pointer

**Content**:
- Radio button + "Start Immediately" (semibold)
- Description: "Begin sending as soon as campaign is launched"
- Status badge: "[Selected]" (blue-600) or "[Select]" (gray-600)

**Card 2: Schedule for Later**
- Same styling as Card 1
- When selected, shows:
  - Date picker with calendar icon: 📅 input[type="date"]
  - Time picker with clock icon: 🕐 input[type="time"]
  - Default date: 2025-02-01
  - Default time: 09:00 AM

#### Send Time Optimization

**Sub-header**: "Send Time Optimization"

**2 Checkbox Options**:
1. ☑ "Enable send time optimization (AI determines best time based on past engagement)" [Checked]
2. ☐ "Use fixed send times (specify below)"

**Note**: These are mutually exclusive - checking one unchecks the other

#### Business Hours Only

**Sub-header**: "Business Hours Only"

**Single Checkbox**:
- ☑ "Send only during business hours (9 AM - 5 PM recipient's local time)" [Checked]

#### Send Days

**Sub-header**: "Send Days"

**7 Day Buttons** (horizontal row):
- Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Selected state: Blue-500 border, Blue-50 background, Blue-700 text with ✓ check icon
- Unselected state: Gray-300 border, white background, gray-700 text
- Default: Mon-Fri checked, Sat-Sun unchecked
- Each button: 16px padding vertical, rounded-lg, 2px border

#### Daily Send Limit

**Sub-header**: "Daily Send Limit"

**Layout**: Horizontal with label and dropdown

**Content**:
- Label: "Maximum sends per day:"
- Dropdown: [50 ▼] with options: 25, 50, 100, 200, 500
- Tip below (blue-700 with lightbulb icon):
  - 💡 "Lower limits reduce spam risk but slow campaign progress"

#### Timezone Handling

**Sub-header**: "Timezone Handling"

**Single Checkbox**:
- ☑ "Send in recipient's timezone (recommended for multi-timezone campaigns)" [Checked]

---

### AUTOMATION RULES SECTION

**Section Header**: Same style as Sending Schedule section

#### Stop Conditions

**Sub-header**: "Stop Conditions" (small, medium, gray-900)
**Description**: "Automatically stop sending to a lead when:"

**6 Checkbox Options**:
1. ☑ "Lead replies to any email" [Checked]
2. ☑ "Lead unsubscribes" [Checked]
3. ☑ "Lead is converted to opportunity" [Checked]
4. ☑ "Lead is manually disqualified" [Checked]
5. ☐ "Lead opens 3+ emails without replying (possible disinterest)"
6. ☐ "Email bounces 2+ times"

**Checkbox Style**:
- Rounded corners
- Border: Gray-300
- Checked: Blue-500 fill
- Gap: 12px between label and text
- Text: Small (14px), gray-700

#### Follow-up Actions

**Sub-header**: "Follow-up Actions"

**When a lead replies:** (gray-600 label)

**4 Checkbox Options**:
1. ☑ "Notify campaign owner (Adithya)" [Checked]
2. ☑ "Create task for follow-up" [Checked]
3. ☐ "Auto-assign to sales rep"
4. ☐ "Send internal Slack notification"

**When a lead clicks a link:** (gray-600 label, top margin)

**3 Checkbox Options**:
1. ☑ "Track click in analytics" [Checked]
2. ☐ "Notify campaign owner"
3. ☐ "Trigger next touch immediately"

---

### EMAIL SENDER SETTINGS SECTION

**Section Header**: Same style as previous sections

#### From Name

**Label**: "From Name" (small, medium, gray-900)

**Input**:
- Type: text
- Default value: "Adithya from Moving Walls"
- Full width
- Border: Gray-300
- Rounded: lg
- Focus: Blue-500 ring

#### From Email

**Label**: "From Email"

**Dropdown**:
- Full width
- Border: Gray-300
- Rounded: lg
- Options:
  - adithya@movingwalls.com (default)
  - sales@movingwalls.com
  - contact@movingwalls.com

**Verification Badge** (below dropdown):
- Green checkmark icon + "Verified sender"
- Text: Small, green-600

#### Reply-To Email

**Label**: "Reply-To Email (Optional)"

**Input**:
- Type: text
- Placeholder: "Same as From Email"
- Full width
- Border: Gray-300
- Rounded: lg

#### Email Signature

**Label**: "Email Signature"

**Textarea**:
- Rows: 5
- Font: Monospace
- Font size: Small (14px)
- Default content:
  ```
  Best regards,
  Adithya
  Product Manager, Moving Walls
  📧 adithya@movingwalls.com | 📱 +1 (555) 123-4567
  🌐 www.movingwalls.com
  ```

---

### TRACKING & ANALYTICS SECTION

**Section Header**: Same style as previous sections

#### Tracking Checkboxes

**4 Main Tracking Options**:
1. ☑ "Track email opens" [Checked]
2. ☑ "Track link clicks" [Checked]
3. ☑ "Track replies" [Checked]
4. ☑ "Record bounce/unsubscribe events" [Checked]

**Spacing**: 12px vertical gap between options

#### UTM Parameters

**Sub-header**: "UTM Parameters (for link tracking)"

**Checkbox**:
- ☑ "Auto-add UTM parameters to all links" [Checked]

**When Checked, Show Details** (indented):
- Campaign: q1_2025_enterprise_outreach
- Source: bmi_leadgen
- Medium: email
- Style: Small text (14px), gray-600, left margin: 24px

---

### COMPLIANCE SECTION

**Section Header**: Same style as previous sections

#### Compliance Checkboxes

**3 Required Options**:
1. ☑ "Include unsubscribe link in all emails (required)" [Checked]
2. ☑ "Add physical mailing address to footer (CAN-SPAM compliance)" [Checked]
3. ☑ "Honor unsubscribe requests immediately" [Checked]

#### Physical Address Display

**Conditional**: Only shows when "Add physical mailing address" is checked

**Label**: "Physical Address:" (small, medium, gray-900)

**Address Box**:
- Background: Gray-50
- Border: Gray-200
- Padding: 12px
- Rounded: lg
- Text: Small (14px), gray-600
- Content: "Moving Walls, 123 Market Street, San Francisco, CA 94102"

---

## STATE MANAGEMENT

### Start Type State
```typescript
const [startType, setStartType] = useState<'immediate' | 'scheduled'>('immediate');
```
- Controls campaign start method
- Default: 'immediate'

### Start Date/Time State
```typescript
const [startDate, setStartDate] = useState('2025-02-01');
const [startTime, setStartTime] = useState('09:00');
```
- Only used when startType === 'scheduled'
- Date format: YYYY-MM-DD
- Time format: HH:mm (24-hour)

### Send Days State
```typescript
const [sendDays, setSendDays] = useState({
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: true,
  sat: false,
  sun: false
});
```
- Boolean for each day
- Default: Weekdays only (Mon-Fri)

### Stop Conditions State
```typescript
const [stopConditions, setStopConditions] = useState({
  onReply: true,
  onUnsubscribe: true,
  onConversion: true,
  onDisqualified: true,
  onMultipleOpens: false,
  onBounces: false
});
```
- 6 boolean flags
- Default: First 4 enabled

### Follow-up Actions State
```typescript
const [followUpActions, setFollowUpActions] = useState({
  notifyOwner: true,
  createTask: true,
  autoAssign: false,
  slackNotify: false
});
```
- 4 boolean flags for reply actions
- Default: First 2 enabled

### Click Actions State
```typescript
const [clickActions, setClickActions] = useState({
  trackClick: true,
  notifyOwner: false,
  triggerNext: false
});
```
- 3 boolean flags for click actions
- Default: Only tracking enabled

### Tracking State
```typescript
const [tracking, setTracking] = useState({
  trackOpens: true,
  trackClicks: true,
  trackReplies: true,
  trackBounces: true,
  autoUTM: true
});
```
- 5 boolean flags for tracking options
- Default: All enabled

### Compliance State
```typescript
const [compliance, setCompliance] = useState({
  includeUnsubscribe: true,
  includeAddress: true,
  honorImmediately: true
});
```
- 3 boolean flags for compliance
- Default: All enabled (required)

### Form Data State (Existing)
```typescript
formData.settings = {
  sendTimeOptimization: true,
  timezoneAware: true,
  businessHoursOnly: true,
  dailySendLimit: 50,
  // ... other settings
}
```

---

## INTERACTIONS & BEHAVIORS

### Campaign Start Selection

**Flow 1: Switch to Scheduled**
1. User clicks "Schedule for Later" card
2. Radio button selects
3. Card highlights with blue border/background
4. Date picker appears with calendar icon
5. Time picker appears with clock icon
6. Default date: 2025-02-01
7. Default time: 09:00
8. Status shows "[Selected]"

**Flow 2: Switch to Immediate**
1. User clicks "Start Immediately" card
2. Radio button selects
3. Card highlights
4. Date/time pickers hide
5. Status shows "[Selected]"

### Send Time Optimization Toggle

**Behavior**: Mutually exclusive checkboxes
- Checking "Enable send time optimization" unchecks "Use fixed send times"
- Checking "Use fixed send times" unchecks "Enable send time optimization"
- One must always be selected

### Send Days Selection

**Flow: Toggle Day**
1. User clicks "Mon" button (currently selected)
2. Button changes from blue to gray
3. Checkmark disappears
4. Day is removed from schedule
5. Click again to re-enable

**Note**: At least one day should remain selected (validation)

### Daily Send Limit Selection

**Dropdown Options**: 25, 50, 100, 200, 500
- Default: 50
- Change updates immediately
- Tip below explains trade-offs

### Stop Conditions Configuration

**Independent Checkboxes**: All can be checked/unchecked independently
- Default: First 4 checked (core conditions)
- Last 2 unchecked (optional conditions)

### Follow-up Actions Configuration

**Two Groups**:
1. When lead replies (4 options)
2. When lead clicks link (3 options)

Each option independent, can have 0-all checked

### UTM Parameters Display

**Conditional Display**:
- Only shows campaign/source/medium when "Auto-add UTM" is checked
- Unchecking hides the details
- Values are informational (not editable in this view)

### Physical Address Display

**Conditional Display**:
- Only shows when "Add physical mailing address" is checked
- Unchecking hides the address box
- Address is informational (not editable in this view)

---

## VALIDATION RULES

### Campaign Start
- If scheduled: Date must be in future
- If scheduled: Time must be valid (00:00 - 23:59)
- Cannot start in the past

### Send Days
- At least 1 day must be selected
- Warning if only 1-2 days selected (slow campaign)

### Daily Send Limit
- Must be positive number
- Minimum: 1
- Maximum: 1000
- Recommended: 25-200 for optimal deliverability

### Email Sender Settings
- From Name: Required, 3-50 characters
- From Email: Must be verified email
- Signature: Recommended but optional

### Compliance
- Unsubscribe link: Must always be checked (required by law)
- Physical address: Required if doing commercial email
- Cannot uncheck compliance options

---

## LAYOUT & SPACING

### Overall Structure
- Container: White background, gray-200 border, rounded-lg, 32px padding
- Max width: Full width (no constraint)
- Vertical spacing: 32px between major sections

### Section Headers
- Font: Small (14px), semibold, uppercase, gray-700, tracked
- Border bottom: 1px gray-200
- Padding bottom: 8px
- Margin bottom: 16px
- Margin top (between sections): 32px

### Sub-sections
- Margin bottom: 24px
- Space between items: 16px

### Form Elements
- Input height: 40px (py-2)
- Input border: Gray-300
- Input focus: Blue-500 ring (2px)
- Label margin bottom: 8px
- Full width inputs for text/textarea/select

### Checkboxes
- Size: 16px (h-4 w-4)
- Border: Gray-300
- Checked: Blue-500
- Rounded: 4px
- Gap from label: 12px
- Label font: Small (14px), gray-700

### Day Buttons
- Padding: 8px vertical, 16px horizontal
- Border: 2px solid
- Selected: Blue-500 border, blue-50 bg, blue-700 text
- Unselected: Gray-300 border, white bg, gray-700 text
- Gap: 8px horizontal
- Rounded: lg
- Font: Small (14px), medium

### Cards (Campaign Start)
- Padding: 16px
- Border: 2px solid
- Rounded: lg
- Cursor: pointer
- Transition: all
- Selected: Blue-500 border, blue-50 bg
- Unselected: Gray-200 border, white bg
- Hover (unselected): Gray-300 border

---

## RESPONSIVE BEHAVIOR

### Desktop (1024px+)
- Full width layout
- Campaign start: 2 columns
- Send days: All 7 buttons in one row
- All sections visible without scroll

### Tablet (768px - 1023px)
- Campaign start: 2 columns (narrower)
- Send days: May wrap to 2 rows (4 + 3)
- Form inputs: Full width
- Checkboxes: Single column

### Mobile (< 768px)
- Campaign start: 1 column (stacked)
- Send days: 2 per row or single column
- All form elements: Full width
- Increased touch targets (min 44px)

---

## ACCESSIBILITY

### Keyboard Navigation
- Tab through all form elements
- Space to toggle checkboxes
- Enter to select radio buttons
- Arrow keys in dropdowns
- Focus visible on all interactive elements

### Screen Readers
- Labels properly associated with inputs
- Checkbox states announced
- Radio button groups announced
- Section headers as landmarks
- Status messages announced

### Visual Indicators
- Clear focus states (blue ring)
- High contrast text (WCAG AA)
- Icon + text for important info
- Color not sole indicator (icons + text)

---

## PERFORMANCE CONSIDERATIONS

### State Updates
- Each setting updates independently
- No unnecessary re-renders
- Local state for UI-only values
- Form data for submission values

### Conditional Rendering
- Only show date/time when scheduled
- Only show UTM details when enabled
- Only show address when enabled
- Minimal DOM elements

---

## SAMPLE DATA & DEFAULTS

### Campaign Start
- Default: Immediate
- Scheduled date: 2025-02-01
- Scheduled time: 09:00

### Send Days
- Mon-Fri: Checked ✓
- Sat-Sun: Unchecked

### Daily Send Limit
- Default: 50 emails/day

### Email Sender
- From Name: "Adithya from Moving Walls"
- From Email: "adithya@movingwalls.com"
- Reply-To: "Same as From Email"
- Signature: Multi-line template with contact info

### UTM Parameters
- Campaign: q1_2025_enterprise_outreach
- Source: bmi_leadgen
- Medium: email

### Physical Address
- "Moving Walls, 123 Market Street, San Francisco, CA 94102"

---

## INTEGRATION POINTS

### With Step 4 (Leads)
- Daily send limit affects pace of lead outreach
- Timezone setting uses lead location data
- Business hours respects lead timezone

### With Step 3 (Sequence)
- Send schedule affects when each touch goes out
- Stop conditions halt sequence early
- Click actions can trigger next touch

### With Step 6 (Review)
- All settings summarized for review
- Can return to edit any setting
- Settings saved to campaign on launch

### With Analytics
- Tracking settings determine available metrics
- UTM parameters enable attribution
- All events logged for reporting

---

## VALIDATION MESSAGES

### Missing Required Fields
- "From Name is required"
- "From Email must be verified"
- "At least one send day must be selected"

### Invalid Values
- "Start date cannot be in the past"
- "Daily send limit must be between 1 and 1000"
- "Invalid email format"

### Compliance Warnings
- "Unsubscribe link is required by law"
- "Physical address required for commercial email (CAN-SPAM)"
- "You must honor unsubscribe requests"

---

## TIPS & GUIDANCE

### Send Time Optimization
💡 "AI learns from past engagement to send at optimal times for each lead"

### Daily Send Limit
💡 "Lower limits reduce spam risk but slow campaign progress"

### Business Hours
💡 "Respects recipient's timezone for professional communication"

### Stop on Multiple Opens
💡 "If lead opens repeatedly without replying, may indicate lack of interest"

### Auto-assign to Sales Rep
💡 "Automatically assigns hot leads based on territory or round-robin"

### Trigger Next Touch
💡 "Advances sequence immediately when lead shows high engagement"

---

## ERROR STATES

### Invalid Scheduled Date
- Red border on date input
- Error message: "Start date must be in future"

### No Send Days Selected
- Red border on day button row
- Error message: "Select at least one send day"

### Unverified Email
- Red X instead of green check
- Error message: "This email address is not verified"
- Link: "Verify Email"

### Missing Required Compliance
- Cannot uncheck compliance checkboxes
- Disabled state with tooltip explaining requirement

---

## QUICK TEST (3 MINUTES)

1. **Navigate** to `/lead-generation/campaigns/create`

2. **Complete Steps 1-4** to reach Step 5

3. **Test Campaign Start**:
   - Verify "Start Immediately" selected by default
   - Click "Schedule for Later"
   - Date and time pickers appear
   - Change date to tomorrow
   - Change time to 10:00 AM
   - Click "Start Immediately" again
   - Date/time pickers hide

4. **Test Send Time Optimization**:
   - "Enable send time optimization" checked by default
   - Click "Use fixed send times"
   - First option unchecks, second checks
   - Click first option again
   - Mutually exclusive behavior works

5. **Test Send Days**:
   - Mon-Fri checked by default
   - Sat-Sun unchecked
   - Click "Wed" to uncheck
   - Button changes from blue to gray
   - Check removed
   - Click "Sat" to check
   - Button changes to blue
   - Check appears

6. **Test Daily Send Limit**:
   - Dropdown shows 50 by default
   - Click dropdown
   - Options: 25, 50, 100, 200, 500 visible
   - Select 100
   - Value updates
   - Tip visible below

7. **Test Stop Conditions**:
   - First 4 checked by default
   - Last 2 unchecked
   - Click "Lead opens 3+ emails"
   - Checkbox checks
   - Click again
   - Checkbox unchecks

8. **Test Follow-up Actions**:
   - "Notify owner" and "Create task" checked
   - Others unchecked
   - Toggle each option
   - All work independently

9. **Test Click Actions**:
   - "Track click" checked
   - Others unchecked
   - Toggle each
   - All independent

10. **Test Email Sender**:
    - From Name shows "Adithya from Moving Walls"
    - From Email dropdown shows verified email
    - Green checkmark visible
    - Signature shows multi-line content

11. **Test Tracking & Analytics**:
    - All 4 main tracking options checked
    - "Auto-add UTM" checked
    - UTM details visible (campaign, source, medium)
    - Uncheck "Auto-add UTM"
    - Details hide
    - Check again
    - Details reappear

12. **Test Compliance**:
    - All 3 options checked
    - Physical address box visible
    - Shows Moving Walls address
    - Try to uncheck "Include unsubscribe"
    - Should prevent or warn (required)

13. **Test Navigation**:
    - Click "Next: Review →"
    - Advances to Step 6
    - Click "← Previous: Select Leads"
    - Returns to Step 4

**Expected**: All interactions smooth, checkboxes toggle correctly, conditional displays work, navigation preserves state.

---

## KNOWN ISSUES

None currently identified.

---

## FUTURE ENHANCEMENTS

1. **Advanced Scheduling**: Time windows (e.g., 9-11 AM, 2-4 PM)
2. **Blackout Dates**: Exclude specific dates (holidays, company events)
3. **Send Throttling**: Gradual ramp-up for IP warming
4. **Custom Stop Conditions**: User-defined rules with operators
5. **Workflow Actions**: Integrate with other tools (CRM, Zapier)
6. **A/B Testing**: Test different send times, sender names
7. **Smart Send**: ML-based optimal send time per lead
8. **Reply Templates**: Pre-written responses for common replies
9. **Bounce Handling**: Auto-retry with alternate email
10. **Unsubscribe Preferences**: Granular unsubscribe options
11. **GDPR Compliance**: Additional EU-specific options
12. **Email Warm-up**: Gradual increase in send volume
13. **Sender Rotation**: Rotate between multiple verified senders
14. **Link Shortening**: Auto-shorten and track all URLs
15. **Preview Email**: See what final email looks like

---

## FILE LOCATION
`/src/pages/LeadGeneration/CreateCampaignPage.tsx`

Lines: ~1870-2460 (renderStep5Settings function and helper functions)

---

## BUILD STATUS
✅ Build successful
✅ No TypeScript errors
✅ All state management working
✅ Campaign start selector functional
✅ Send days toggle working
✅ All checkboxes independent
✅ Conditional displays working
✅ Navigation preserves data

---

## SUMMARY

Step 5 Campaign Settings is complete with:
✅ Campaign start selector (immediate vs scheduled with date/time pickers)
✅ Send time optimization (AI vs fixed times, mutually exclusive)
✅ Business hours only checkbox
✅ 7-day send days selector with toggle buttons
✅ Daily send limit dropdown (25, 50, 100, 200, 500)
✅ Timezone handling checkbox
✅ Stop conditions (6 options, first 4 default checked)
✅ Follow-up actions (4 options for replies, first 2 default checked)
✅ Click actions (3 options, first default checked)
✅ Email sender settings (name, email dropdown with verified indicator, reply-to, signature)
✅ Tracking & analytics (4 tracking options, all default checked)
✅ UTM parameters (auto-add checkbox with conditional details display)
✅ Compliance (3 required options, all default checked)
✅ Physical address display (conditional on compliance setting)
✅ Professional layout with clear section headers
✅ Proper spacing and visual hierarchy
✅ All interactions functional
✅ Navigation to Step 6 with data persistence

**Status**: Production-ready and fully functional
