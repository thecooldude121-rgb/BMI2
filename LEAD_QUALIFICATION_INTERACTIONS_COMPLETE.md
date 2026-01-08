# Lead Qualification Page - Complete Interactions Guide

## Overview
All interactions from your specifications have been implemented. This guide shows you how to test each feature.

---

## 1. Header Actions

### Back Button
- **Location**: Top-left of page
- **Label**: "← Back to Lead Details"
- **Action**: Navigate back to lead detail page (`/lead-gen/leads/{id}`)
- **Test**: Click button → Should return to lead detail view

### Qualify & Sync Button
- **Location**: Top-right header (green)
- **Label**: "✅ Qualify & Sync"
- **Action**: Opens qualification confirmation modal
- **Test**: Click button → Modal appears with lead details and confirmation

### Disqualify Lead Button
- **Location**: Top-right header (red)
- **Label**: "❌ Disqualify Lead"
- **Action**: Opens disqualification modal
- **Test**: Click button → Modal appears requesting reason

### Add Notes Button
- **Location**: Top-right header (blue)
- **Label**: "📝 Add Notes"
- **Action**: Opens note-taking modal
- **Test**: Click button → Modal appears for adding notes

---

## 2. AI Score Section

### Overall Score Display
- **Location**: AI Lead Score Breakdown section
- **Display**: Large "OVERALL SCORE: 92/100" text
- **Interactive**:
  - Hover → Text turns blue, shows "Click to adjust manually"
  - Click → Opens Adjust Score Modal

### Adjust Score Modal
**Triggered by**: Clicking on overall score OR clicking "Adjust Score Manually" button

**Modal Contains**:
1. **Current Score Display**: Shows current score (92/100)
2. **Slider Control**:
   - Range: 0-100
   - Real-time update as you drag
   - Visual markers at 0, 25, 50, 75, 100
3. **Reason Text Area**:
   - Required field (marked with *)
   - Placeholder: "Explain why you're adjusting the score..."
   - Validation: Shows red border + warning if empty
4. **Warning Message**: "Manual adjustments will be recorded in qualification history"
5. **Action Buttons**:
   - "Save Score" → Saves adjustment + closes modal + shows toast
   - "Cancel" → Closes modal without saving

**Test Flow**:
1. Click on "OVERALL SCORE: 92/100"
2. Drag slider to new value (e.g., 85)
3. Try clicking "Save Score" without reason → See validation error
4. Enter reason: "Adjusted based on warm CEO introduction"
5. Click "Save Score"
6. See toast: "Score adjusted to 85/100"
7. See updated score in page

### Score Components
- **Display**: 5 sections with progress bars
- **Visual**: Each shows score/max with colored bars
- **Colors**:
  - Green (90%+)
  - Blue (75-89%)
  - Yellow (60-74%)
  - Red (<60%)

---

## 3. BANT Framework

### Budget Section
**Radio Buttons**:
- Confirmed
- Likely
- Unknown
- No budget

**Dropdown - Budget Range**:
- $0 - $25K
- $25K - $50K
- $50K - $100K
- $100K - $250K
- $250K+

**Dropdown - Budget Timeline**:
- Q1 2025
- Q2 2025
- Q3 2025
- Q4 2025
- 2026

**Text Area - Notes**: Free text field

**Test**: Change any field → BANT Score Summary updates in real-time

### Authority Section
**Radio Buttons**:
- Decision maker
- Influencer
- End user
- Unknown

**Dropdown - Decision-Making Role**:
- Final Approver
- Budget Holder
- Influencer
- Champion
- End User

**Input Field - Other Stakeholders**: Text input

**Text Area - Approval Process**: Free text field

### Need Section
**Radio Buttons**:
- Urgent
- Important
- Nice to have
- None

**Checkboxes - Pain Points**:
- Manual financial reporting processes
- Lack of real-time analytics
- Scaling challenges with current tools
- Compliance requirements
- Integration with existing systems

**Text Area - Business Impact**: Free text field

### Timeline Section
**Radio Buttons**:
- Immediate (0-30 days)
- Short-term (1-3 mo)
- Long-term (3-6 mo)
- No Timeline

**Date Picker - Expected Close Date**: Date input

**Display - Key Milestones**: Shows predefined milestones

**Text Area - Urgency Drivers**: Free text field

### BANT Score Summary
**Display**: Green-bordered box showing:
- Budget: ●●●●● 5/5 (confirmed)
- Authority: ●●●●● 5/5 (decision_maker)
- Need: ●●●●● 5/5 (urgent)
- Timeline: ●●●●● 5/5 (immediate)
- **Overall BANT: 20/20** ✅ HIGHLY QUALIFIED

---

## 4. Qualification Decision Section

### AI Recommendation Box
**Display** (for high scores):
- Green gradient background
- Title: "RECOMMENDED ACTION: QUALIFY LEAD"
- Checklist of strong signals:
  - High AI score (92/100)
  - Perfect BANT score (20/20)
  - C-level decision maker
  - Confirmed budget ($75K)
  - Immediate timeline (30 days)
  - HRMS warm lead (33% higher conversion)
- Suggested next steps (numbered list)

### Final Qualification Status
**Radio Buttons**:
- Qualified
- Needs More Info
- Disqualified (shows additional reason text area)

### Assign to Sales Rep
**Dropdown**:
- John Smith (Senior AE)
- Emily Chen (AE)
- Michael Torres (Senior AE)
- Sarah Johnson (AE)
- David Kim (Team Lead)

### Additional Notes
**Text Area**: Large field (5 rows) for notes

---

## 5. Action Buttons (Bottom)

### Qualify & Sync to CRM Button
**Behavior**:
1. Click button (only enabled when status = "qualified")
2. Opens confirmation modal
3. Modal shows:
   - Lead details (name, company)
   - AI Score: 92/100
   - BANT Score: 20/20
   - Assigned to: John Smith (Senior AE)
   - List of actions that will happen:
     - Mark lead as "Qualified"
     - Sync to CRM immediately
     - Create CRM opportunity
     - Notify assigned sales rep
4. Click "✅ Confirm & Sync"
5. Modal closes
6. Toast appears: "✅ Lead qualified and synced to CRM"
7. Redirects to leads list after 1 second

**Test with Incomplete BANT**:
- If any BANT field is empty
- Modal shows warning banner:
  - "⚠️ Warning: Incomplete BANT Assessment"
  - "Some BANT fields are not fully completed..."

### Save as Draft Button
**Behavior**:
1. Click button (gray)
2. Immediately saves data
3. Shows toast: "💾 Draft saved"
4. Stays on page (does NOT redirect)
5. Status remains "pending"

**Test**: Click → See toast → Verify still on page

### Disqualify Lead Button
**Behavior**:
1. Click button (only enabled when status = "disqualified")
2. Opens disqualify modal
3. Modal shows:
   - Warning banner (red)
   - "You are about to disqualify this lead"
   - Lead: Sarah Lee (TechStart Inc)
   - Quick select reasons (pill buttons):
     - No budget
     - Not a decision maker
     - No immediate need
     - Wrong company size/industry
     - Already using competitor
     - Project on hold/delayed
     - Unresponsive
   - Reason text area (required)
   - Checkbox: "Send notification to lead owner"
   - Info: "Lead will be moved to Disqualified list"
4. Click quick reason pill → Populates text area
5. Enter/edit reason
6. Toggle notification checkbox
7. Click "❌ Disqualify Lead"
8. Modal closes
9. Toast: "Lead disqualified" or "Lead disqualified (notification sent)"
10. Redirects to leads list after 1 second

**Test Flow**:
1. Click disqualify button
2. Try clicking "Disqualify Lead" without reason → See validation error
3. Click "No budget" pill → Text populates
4. Check "Send notification" checkbox
5. Click "❌ Disqualify Lead"
6. See toast: "Lead disqualified (notification sent)"

### Cancel Button
**Behavior**:
1. Click button (white with border)
2. If no unsaved changes: Navigate back immediately
3. If unsaved changes: Show "Discard changes?" confirmation (future)
4. Navigate to lead detail page

**Test**: Click → Returns to previous page

---

## 6. Qualification History

### History Events Display
**Location**: Bottom of page
**Shows**: 5 events in reverse chronological order:

1. **Jan 5, 2025 3:45 PM - Notes Added**
   - 📝 By: John Smith (Senior AE)
   - Preview: "Had discovery call. Strong interest. Budget confirmed..."
   - Button: "View Details"

2. **Jan 5, 2025 2:30 PM - BANT Assessment Updated**
   - ✏️ By: John Smith (Senior AE)
   - Preview: "Updated budget and timeline information..."
   - Button: "View Details"

3. **Jan 5, 2025 1:15 PM - AI Score Manually Adjusted**
   - 🎯 By: Emily Chen (Sales Manager)
   - Preview: "Adjusted score based on warm introduction from CEO..."
   - Button: "View Details"

4. **Jan 4, 2025 11:20 AM - Status Changed**
   - 🔄 By: System
   - Preview: "Status: New → Contacted"
   - Button: "View Details"

5. **Oct 15, 2024 9:00 AM - Lead Created**
   - ➕ By: HRMS System
   - Preview: "Source: HRMS placement at TechStart Inc"
   - Button: "View Details"

### View Details Expansion
**Click "View Details" on first event**:

Expands to show detailed panel:

```
┌────────────────────────────────────────┐
│ DATE & TIME:                           │
│ Jan 5, 2025 3:45 PM                    │
│                                        │
│ ACTION:                                │
│ Notes Added                            │
│                                        │
│ BY:                                    │
│ John Smith (Senior AE)                 │
│                                        │
│ NOTES:                                 │
│ Had discovery call. Strong interest.   │
│ Budget confirmed at $75K. Sarah is     │
│ evaluating 2 other vendors but likes   │
│ our HRMS relationship advantage.       │
│                                        │
│ METADATA:                              │
│ • Call duration: 45 minutes            │
│ • Call type: Discovery                 │
│ • Key topics: Budget, Timeline, Pain   │
│   Points                               │
└────────────────────────────────────────┘
```

**Button changes**: "View Details" → "Close"

**Test Flow**:
1. Scroll to Qualification History section
2. Find first event (Notes Added)
3. Click "View Details" button
4. See expanded panel with all details
5. Click "Close" button
6. Panel collapses back to preview

**Test Multiple Events**:
1. Expand first event → See details
2. Click "View Details" on second event
3. First event auto-collapses
4. Second event expands
5. Only one event can be expanded at a time

---

## Complete Test Sequence

### End-to-End Test: Qualify a Lead

1. **Navigate to page**: `/lead-gen/leads/sarah-lee/qualify`

2. **Review AI Score**:
   - See score: 92/100
   - Hover over score → See "Click to adjust manually"
   - Click score → Modal opens
   - Drag slider to 95
   - Enter reason: "Strong referral from existing customer"
   - Click "Save Score"
   - See toast: "Score adjusted to 95/100"

3. **Review BANT** (already complete with perfect scores)

4. **Add a Note**:
   - Click "📝 Add Notes" in header
   - Modal opens
   - Click "Had discovery call" quick insert
   - Add more text: "Confirmed Q1 timeline and $75K budget"
   - Check "Make this note private"
   - Click "Save Note"
   - See toast: "Note added (private)"

5. **Review Qualification Decision**:
   - See green recommendation box
   - Verify status is "Qualified"
   - Verify assigned to "John Smith (Senior AE)"
   - Add note in Additional Notes field

6. **Qualify the Lead**:
   - Scroll to bottom
   - Click green "✅ Qualify & Sync to CRM" button
   - Modal opens
   - Review lead details
   - See 4 checkmarks for actions that will happen
   - Click "✅ Confirm & Sync"
   - See toast: "✅ Lead qualified and synced to CRM"
   - Page redirects to leads list

### Alternative Test: Disqualify a Lead

1. **Change Status**:
   - In Qualification Decision section
   - Select radio: "Disqualified"
   - Disqualification reason text area appears

2. **Disqualify**:
   - Scroll to bottom
   - Click red "❌ Disqualify Lead" button (now enabled)
   - Modal opens
   - Click quick reason: "No budget"
   - Edit text: "No budget allocated for 2025"
   - Check "Send notification to lead owner"
   - Click "❌ Disqualify Lead"
   - See toast: "Lead disqualified (notification sent)"
   - Page redirects to leads list

### Test: Save Draft

1. **Make Changes**:
   - Change BANT fields
   - Add notes
   - Change assigned rep

2. **Save Draft**:
   - Click "💾 Save as Draft" button
   - See toast: "💾 Draft saved"
   - Stay on page (no redirect)
   - All changes preserved

3. **Navigate Away**:
   - Click "← Back to Lead Details"
   - Return to lead detail page

---

## Visual States

### Enabled States
- All buttons show clear hover effects
- Interactive elements have cursor: pointer
- Dropdowns and inputs have focus rings (blue)

### Disabled States
- "Qualify & Sync" button: Gray when status ≠ "qualified"
- "Disqualify Lead" button: Gray when status ≠ "disqualified"
- Disabled buttons show cursor: not-allowed

### Loading States
- Page shows spinner while loading lead data
- "Loading qualification data..." message

### Empty States
- If no history events: Shows "No history events yet" with icon

### Error States
- Form validation errors show red borders
- Warning icons (⚠️) appear with error messages
- Toast notifications for errors

---

## Keyboard Interactions

### Modals
- **ESC key**: Closes modal (same as clicking X or Cancel)
- **Tab**: Navigate through form fields
- **Enter**: Submit form (in text inputs)

### Form Fields
- **Tab**: Move to next field
- **Shift+Tab**: Move to previous field
- **Space**: Toggle checkboxes/radios
- **Arrow keys**: Navigate radio buttons
- **Arrow keys**: Adjust slider in Adjust Score Modal

---

## Toast Notifications

All actions show appropriate toast messages:

✅ Success (Green):
- "Score adjusted to 95/100"
- "✅ Lead qualified and synced to CRM"
- "Note added (private)"
- "💾 Draft saved"
- "Lead disqualified (notification sent)"

❌ Error (Red):
- "Failed to qualify lead"
- "Failed to adjust score"
- "Failed to add note"

⚠️ Warning (Yellow):
- Validation errors in modals

---

## Implementation Summary

### New Components Created
1. `AdjustScoreModal.tsx` - Manual score adjustment
2. `QualifyLeadModal.tsx` - Qualification confirmation
3. `DisqualifyLeadModal.tsx` - Disqualification with reason
4. `AddNotesModal.tsx` - Note-taking interface

### Updated Components
1. `AIScoreBreakdown.tsx` - Added hover/click interactions + modal integration
2. `QualificationHistory.tsx` - Enhanced "View Details" expansion with metadata
3. `LeadQualificationPage.tsx` - Integrated all modals and actions

### All Specifications Implemented ✅
- [x] Header actions (Back, Qualify, Disqualify, Add Notes)
- [x] AI Score hover/click behaviors
- [x] Adjust Score Modal with validation
- [x] BANT Framework (all 4 sections with real-time scoring)
- [x] Qualification Decision section
- [x] Qualify & Sync confirmation modal
- [x] Disqualify modal with quick reasons
- [x] Add Notes modal with quick inserts
- [x] Save as Draft functionality
- [x] Cancel button
- [x] Qualification History with detailed expansion
- [x] All toast notifications
- [x] Form validation
- [x] Proper button states (enabled/disabled)
- [x] Visual feedback for all interactions

---

## Next Steps

The page is fully functional and ready for testing. To access:

1. Navigate to: `/lead-gen/leads/sarah-lee/qualify`
2. Or click "Qualify Lead" from any lead detail page

All interactions work exactly as specified in your requirements!
