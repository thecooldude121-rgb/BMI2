# CAMPAIGN CREATION WIZARD - COMPLETE GUIDE

## Overview
Complete 6-step campaign creation wizard with template selection, sequence builder, lead targeting, and advanced settings.

## Access Points
1. **From Campaigns Page**: Click "Create Campaign" button (top-right)
2. **Direct URL**: `/lead-generation/campaigns/create`

---

## STEP-BY-STEP WALKTHROUGH

### STEP 1: BASIC INFORMATION
**What You'll Configure:**
- Campaign Name (required)
- Description (optional)
- Campaign Type: Email, Multi-channel, or LinkedIn
- Campaign Goal (e.g., "Book 50 demo calls")

**Visual Elements:**
- Three type selection cards with icons
- Pro tip callout box with best practices
- Clear input validation

**Actions:**
- Fill in campaign details
- Select campaign type
- Click "Next: Template" to proceed

---

### STEP 2: TEMPLATE SELECTION
**Available Templates:**

1. **📧 Cold Outreach**
   - 5-touch email sequence
   - Perfect for: New prospects, Cold outreach, Enterprise
   - Avg Performance: 28% open rate, 8% reply rate

2. **✨ Warm Intro**
   - 3-touch email sequence
   - Perfect for: HRMS leads, Referrals, Warm intros
   - Avg Performance: 55% open rate, 20% reply rate

3. **🔄 Re-engagement**
   - 4-touch multi-channel sequence
   - Perfect for: Dormant leads, 90+ days inactive, Win-back
   - Avg Performance: 18% open rate, 5% reply rate

4. **📅 Event Follow-up**
   - 3-touch LinkedIn-focused sequence
   - Perfect for: Conference leads, Webinar attendees, Event networking
   - Avg Performance: N/A (LinkedIn), 12% reply rate

5. **🎯 Trial Follow-up**
   - 5-touch email sequence
   - Perfect for: Demo attendees, Free trial users, Product trials
   - Avg Performance: 42% open rate, 15% reply rate

6. **⚡ Start from Scratch**
   - Build your own custom sequence
   - Perfect for: Unique campaigns, Custom workflows, A/B testing
   - No pre-set performance data

**Visual Elements:**
- 6 template cards in 3-column grid
- Each card shows:
  - Icon and name
  - Touch count and channel type
  - "Perfect for" scenarios
  - Average performance metrics
  - Select button
- Blue info banner with customization tip

**Actions:**
- Review template options
- Click "Select Template" on desired template
- Automatically advances to Step 3

---

### STEP 3: SEQUENCE BUILDER
**What You'll Configure:**
- Individual touch configuration
- Channel selection per touch
- Timing and delays
- Subject lines and content
- Touch ordering

**Current Status:**
- Placeholder UI shown
- Will be populated based on selected template
- Full builder coming in next iteration

**Actions:**
- Configure sequence touches
- Set delays between touches
- Customize messaging
- Click "Next: Leads" to proceed

---

### STEP 4: LEAD SELECTION
**What You'll Configure:**
- Target audience selection
- Lead list filtering
- Import/upload leads
- Exclude lists
- Lead count validation

**Current Status:**
- Placeholder UI shown
- Will integrate with existing lead lists
- Advanced filtering coming soon

**Actions:**
- Select target leads
- Apply filters
- Review lead count
- Click "Next: Settings" to proceed

---

### STEP 5: CAMPAIGN SETTINGS
**Configuration Options:**

**Send Optimization:**
- ✅ Send Time Optimization (AI determines best send time)
- ✅ Timezone Aware (Send based on recipient's timezone)
- ✅ Business Hours Only (9 AM - 5 PM restriction)

**Sending Limits:**
- Daily Send Limit (default: 50 emails/day)
- Adjustable via number input

**Automation Rules:**
- ✅ Stop on Reply (Pause when lead responds)
- ✅ Stop on Unsubscribe (Remove from sequence)

**Visual Elements:**
- Toggle switches for each setting
- Clear descriptions for each option
- Number input for daily limit
- Recommended defaults pre-selected

**Actions:**
- Toggle settings as needed
- Adjust daily send limit
- Click "Next: Review" to proceed

---

### STEP 6: REVIEW & LAUNCH
**What You'll See:**
- Complete campaign summary
- All configured settings
- Final validation checks
- Launch options

**Campaign Summary Display:**
- Name
- Type (Email/Multi-channel/LinkedIn)
- Selected template
- Daily send limit
- Other key settings

**Final Actions:**
- 🚀 **Launch Campaign** - Immediately activate campaign
- 💾 **Save as Draft** - Save for later editing/launch

---

## PROGRESS TRACKER

**Visual Design:**
- Horizontal step indicator
- 6 connected circles with labels
- Color-coded status:
  - ✅ Green = Complete
  - 🔵 Blue = Current
  - ⚪ Gray = Not started
- Progress bar connecting steps

**Status Labels:**
- "✓ Complete" - Step finished
- "← Current" - Active step
- "Not started" - Future step

**Functionality:**
- Always visible at top
- Shows overall progress
- Updates in real-time
- Non-clickable (linear flow)

---

## NAVIGATION CONTROLS

**Top Bar:**
- "← Back to Campaigns" - Cancel and return
- "💾 Save Draft" - Save progress
- "✕" Close button

**Bottom Bar:**
- "← Previous: [Step Name]" - Go back one step
- "Next: [Step Name] →" - Advance one step
- Disabled buttons are grayed out
- Step 1: Previous disabled
- Step 6: Next disabled

---

## DATA PERSISTENCE

**Save Draft:**
- Saves all entered data
- Returns to campaigns list
- Draft status applied
- Can resume editing later

**Auto-save:**
- Not implemented (manual save only)
- Data lost if navigating away without saving

---

## VALIDATION RULES

**Step 1 - Basic Info:**
- Campaign name required to proceed
- Type must be selected
- Description optional
- Goal optional

**Step 2 - Template:**
- Must select a template before advancing
- Auto-advances on selection

**Step 3 - Sequence:**
- Coming soon - will validate touch configuration

**Step 4 - Leads:**
- Coming soon - minimum lead count validation

**Step 5 - Settings:**
- Daily limit must be > 0
- All settings have defaults

**Step 6 - Review:**
- Final validation before launch
- Can save as draft or launch

---

## TEMPLATE CUSTOMIZATION

**After Selection:**
- Template is copied to campaign
- Changes don't affect original template
- Full customization available
- Can switch templates before finalizing

**Customizable Elements:**
- Touch count
- Channel mix
- Timing/delays
- Subject lines
- Email content
- Sender settings

---

## KEY FEATURES

✅ **6-Step Wizard Flow**
✅ **Visual Progress Tracker**
✅ **6 Pre-built Templates**
✅ **Template Performance Metrics**
✅ **Campaign Type Selection**
✅ **Advanced Settings Panel**
✅ **Save Draft Functionality**
✅ **Linear Navigation (Prev/Next)**
✅ **Campaign Summary Review**
✅ **Launch & Save Options**

---

## TESTING CHECKLIST

### Basic Flow
- [ ] Access from campaigns page
- [ ] All 6 steps load correctly
- [ ] Progress tracker updates properly
- [ ] Navigation buttons work

### Step 1 - Basic Info
- [ ] Name input works
- [ ] Description input works
- [ ] Type selection toggles properly
- [ ] Goal input works
- [ ] Next button advances to Step 2

### Step 2 - Template Selection
- [ ] All 6 templates display
- [ ] Template cards show correct data
- [ ] Select buttons work
- [ ] Auto-advances on selection
- [ ] Performance metrics visible

### Step 3 - Sequence Builder
- [ ] Placeholder visible
- [ ] Shows selected template
- [ ] Navigation works

### Step 4 - Lead Selection
- [ ] Placeholder visible
- [ ] Navigation works

### Step 5 - Settings
- [ ] All toggles work
- [ ] Daily limit input functional
- [ ] Default values correct
- [ ] Navigation works

### Step 6 - Review
- [ ] Summary displays correctly
- [ ] All data shown
- [ ] Launch button works
- [ ] Save Draft button works

### Navigation
- [ ] Previous button disabled on Step 1
- [ ] Next button disabled on Step 6
- [ ] Can navigate back and forth
- [ ] Data persists between steps

### Save & Exit
- [ ] Save Draft saves data
- [ ] Returns to campaigns page
- [ ] Back button works
- [ ] Close (X) button works

---

## NEXT STEPS (FUTURE ENHANCEMENTS)

1. **Sequence Builder (Step 3)**
   - Visual touch editor
   - Drag-and-drop ordering
   - Content preview
   - A/B test variants

2. **Lead Selection (Step 4)**
   - Advanced filtering
   - List import
   - Duplicate detection
   - Lead preview

3. **Additional Features**
   - Auto-save functionality
   - Resume draft editing
   - Template management
   - Campaign cloning
   - Scheduled launch
   - A/B testing setup

---

## QUICK TEST (5 MINUTES)

1. Navigate to `/lead-generation/campaigns`
2. Click "Create Campaign" button
3. Fill in campaign name: "Test Q1 Campaign"
4. Select "Email" type
5. Click "Next: Template"
6. Select "Cold Outreach" template
7. Verify auto-advance to Step 3
8. Click "Next: Leads"
9. Click "Next: Settings"
10. Toggle "Send Time Optimization" off/on
11. Change daily limit to 100
12. Click "Next: Review"
13. Verify summary shows correct data
14. Click "Save as Draft"
15. Verify return to campaigns page

**Expected Result:** Smooth flow through all 6 steps with no errors.

---

## TROUBLESHOOTING

**Issue: Can't advance to next step**
- Check required fields are filled
- Campaign name required in Step 1
- Template must be selected in Step 2

**Issue: Progress tracker not updating**
- Verify step state is changing
- Check React component re-rendering

**Issue: Template cards not showing**
- Verify campaignTemplates array is loaded
- Check console for errors

**Issue: Navigation buttons don't work**
- Check handleNext/handlePrevious functions
- Verify step bounds (1-6)

---

## CAMPAIGN 10 CONTEXT

The "⚠️ Urgent: Low Engagement Fix Needed" campaign (camp_010) demonstrates what happens when campaigns fail. The wizard helps users avoid these issues by:

1. **Template Selection** - Proven templates vs. poorly designed sequences
2. **Settings Optimization** - Enable send time optimization (camp_010 had it OFF)
3. **Best Practices** - Business hours, timezone awareness
4. **Clear Goals** - Set expectations upfront

**Camp 10 Issues Prevented:**
- ❌ No send time optimization → ✅ AI-optimized sending
- ❌ Generic subjects → ✅ Proven templates
- ❌ No clear strategy → ✅ Template-based approach
- ❌ Poor settings → ✅ Recommended defaults

---

## FILE LOCATIONS

**Main Component:**
`/src/pages/LeadGeneration/CreateCampaignPage.tsx`

**Route Configuration:**
`/src/pages/LeadGeneration/LeadGenerationModule.tsx`

**Navigation:**
`/lead-generation/campaigns/create`

---

## DESIGN NOTES

**Colors:**
- Blue (#3B82F6) - Primary actions, current step
- Green (#10B981) - Completed steps, launch button
- Gray - Inactive/disabled elements
- White background with subtle borders

**Typography:**
- Bold for headings and step titles
- Medium weight for labels
- Regular for body text
- Small (xs) for helper text

**Spacing:**
- Consistent 6-unit spacing (1.5rem)
- Generous padding in cards
- Clear visual hierarchy

**Interactions:**
- Hover effects on buttons
- Smooth transitions
- Clear disabled states
- Visual feedback on selection
