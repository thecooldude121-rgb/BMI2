# Disqualification Modal - Quick Test Guide

## 🚀 Fast Testing Reference

Quick reference card for testing the comprehensive Disqualification Modal.

---

## 📍 Component Import

```typescript
import DisqualifyLeadModal, {
  DisqualificationData
} from '@/components/LeadQualification/DisqualifyLeadModal';
```

---

## 🎯 Basic Usage

```typescript
const [showModal, setShowModal] = useState(false);

const handleDisqualify = (data: DisqualificationData) => {
  console.log('Disqualification:', data);
  setShowModal(false);
};

<DisqualifyLeadModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleDisqualify}
  lead={{
    name: "Sarah Lee",
    title: "Chief Financial Officer",
    company: "TechStart Inc",
    email: "sarah.lee@techstart.com",
    aiScore: 92,
    bantScore: 20
  }}
  owner="John Smith"
/>
```

---

## ✅ Quick Test Checklist

### **Visual Elements** (30 seconds)

| Element | Expected |
|---------|----------|
| Modal opens | ✅ Centered on screen |
| Header | ✅ "DISQUALIFY LEAD" with red X icon |
| Lead avatar | ✅ Initials "SL" on blue gradient |
| Lead info | ✅ Name, title, company, email |
| High-quality warning | ✅ Amber box (if score ≥ 80) |
| Scrollable content | ✅ Smooth scrolling |
| Footer buttons | ✅ Red confirm, white cancel |

---

### **Reason Dropdown** (1 minute)

| Action | Expected Result |
|--------|----------------|
| Click dropdown | ✅ Shows 8 categories |
| Select "BUDGET ISSUES" | ✅ 4 reasons appear |
| Select "No budget available" | ✅ Value updates |
| Clear selection | ✅ Returns to "Select reason ▼" |
| Click confirm (no reason) | ✅ Red border + error message |

**Categories Count**:
- BUDGET ISSUES: 4 reasons
- AUTHORITY ISSUES: 3 reasons
- NEED/FIT ISSUES: 4 reasons
- TIMELINE ISSUES: 3 reasons
- COMPETITION: 3 reasons
- LEAD UNRESPONSIVE: 3 reasons
- COMPANY ISSUES: 3 reasons
- OTHER: 1 reason

---

### **Conditional Competitor Field** (30 seconds)

| Action | Expected Result |
|--------|----------------|
| Select "Lost deal to competitor" | ✅ Competitor dropdown appears |
| Dropdown shows 5 options | ✅ Workday, Oracle, SAP, NetSuite, Other |
| Select different reason | ✅ Competitor dropdown may hide |
| Select "Already using competitor" | ✅ Competitor dropdown appears |

---

### **Re-engagement Options** (1 minute)

| Action | Expected Result |
|--------|----------------|
| Default selection | ✅ "3 months" selected |
| Shows dynamic date | ✅ "(Apr 2025)" or current +3 months |
| Select "6 months" | ✅ Date updates to +6 months |
| Select "12 months" | ✅ Date updates to +12 months |
| Select "Do not contact again" | ✅ Blue options box hides |
| Select "3 months" again | ✅ Blue options box appears |

---

### **Re-engagement Follow-up Options** (30 seconds)

| Element | Default State | Expected |
|---------|---------------|----------|
| Create calendar reminder | ✅ Checked | ✅ Can toggle |
| Add to re-engagement campaign | ✅ Checked | ✅ Can toggle |
| Monitor for trigger events | ✅ Checked | ✅ Can toggle |
| Visible when | Re-engagement ≠ "never" | ✅ Hides if "never" |

---

### **Notify Team Options** (30 seconds)

| Element | Default State | Expected |
|---------|---------------|----------|
| Notify owner | ✅ Checked | ✅ Shows owner name |
| CC Sales Manager | ❌ Unchecked | ✅ Can toggle |
| Notify Slack | ❌ Unchecked | ✅ Can toggle |

---

### **Additional Details** (30 seconds)

| Action | Expected Result |
|--------|----------------|
| Click textarea | ✅ Focus + cursor |
| Type text | ✅ Text appears |
| Multi-line text | ✅ Wraps correctly |
| Leave empty | ✅ No validation error |

---

### **Important Warning Box** (15 seconds)

| Element | Expected |
|---------|----------|
| Red background | ✅ Visible |
| Alert icon | ✅ Red circle with "i" |
| "IMPORTANT" header | ✅ Bold |
| 5 bullet points | ✅ Listed |
| Reassurance text | ✅ "You can re-qualify..." |

---

### **Validation** (1 minute)

| Scenario | Expected Result |
|----------|----------------|
| Click confirm (empty form) | ✅ Error: "Please select a disqualification reason" |
| Select reason, click confirm | ✅ Success, data returned |
| Red border on error | ✅ Visible on dropdown |
| Select reason | ✅ Error disappears |
| Click cancel | ✅ Modal closes, no data |

---

## 🔍 Detailed Test Scenarios

### **Scenario 1: High-Quality Lead Warning**

**Setup**:
```typescript
lead={{
  name: "Sarah Lee",
  company: "TechStart Inc",
  email: "sarah.lee@techstart.com",
  aiScore: 92,
  bantScore: 20
}}
```

**Steps**:
1. Open modal
2. Look for amber warning box

**Expected**:
- ✅ Amber box visible
- ✅ "Current Scores" header
- ✅ "AI Score: 92/100 (Excellent)"
- ✅ "BANT Score: 20/20 (Perfect)"
- ✅ Warning: "This is a high-quality lead. Are you sure?"

---

### **Scenario 2: Low-Quality Lead (No Warning)**

**Setup**:
```typescript
lead={{
  name: "John Doe",
  company: "Small Co",
  email: "john@small.com",
  aiScore: 65,
  bantScore: 12
}}
```

**Steps**:
1. Open modal
2. Check for warning box

**Expected**:
- ✅ NO amber warning box
- ✅ Proceeds directly to form
- ✅ No score display

---

### **Scenario 3: Complete Disqualification Flow**

**Steps**:
1. Open modal
2. Select "No budget available"
3. Type: "Budget frozen until Q2 2026"
4. Select "Re-engage in 12 months"
5. Check "CC: Sales Manager"
6. Check "Add note to Slack"
7. Click "Confirm Disqualification"

**Expected Data**:
```typescript
{
  reason: "No budget available",
  additionalDetails: "Budget frozen until Q2 2026",
  competitor: undefined,
  reEngagementPeriod: "12_months",
  createCalendarReminder: true,
  addToReEngagementCampaign: true,
  monitorTriggerEvents: true,
  notifyOwner: true,
  ccSalesManager: true,
  notifySlack: true
}
```

---

### **Scenario 4: Competition with Competitor**

**Steps**:
1. Select "Lost deal to competitor"
2. Verify competitor dropdown appears
3. Select "Workday"
4. Type: "They offered 20% lower pricing"
5. Select "Re-engage in 6 months"
6. Click confirm

**Expected Data**:
```typescript
{
  reason: "Lost deal to competitor",
  additionalDetails: "They offered 20% lower pricing",
  competitor: "Workday",
  reEngagementPeriod: "6_months",
  createCalendarReminder: true,
  addToReEngagementCampaign: true,
  monitorTriggerEvents: true,
  notifyOwner: true,
  ccSalesManager: false,
  notifySlack: false
}
```

---

### **Scenario 5: Never Re-engage**

**Steps**:
1. Select "Company went out of business"
2. Select "Do not contact again"
3. Verify blue options box hides
4. Uncheck "Send notification to owner"
5. Click confirm

**Expected Data**:
```typescript
{
  reason: "Company went out of business",
  additionalDetails: "",
  competitor: undefined,
  reEngagementPeriod: "never",
  createCalendarReminder: false,
  addToReEngagementCampaign: false,
  monitorTriggerEvents: false,
  notifyOwner: false,
  ccSalesManager: false,
  notifySlack: false
}
```

**Note**: All re-engagement options forced to `false` when "never" selected

---

### **Scenario 6: Cancel and Reset**

**Steps**:
1. Select "No immediate business need"
2. Type additional details
3. Select "Re-engage in 3 months"
4. Check multiple options
5. Click "Cancel"
6. Re-open modal

**Expected**:
- ✅ All fields reset to defaults
- ✅ Reason: empty
- ✅ Additional details: empty
- ✅ Re-engagement: "3 months"
- ✅ Re-engagement options: all checked
- ✅ Notify owner: checked
- ✅ Other notify options: unchecked

---

## 🎨 Visual Checks

### **Colors**

| Element | Color | Hex/Tailwind |
|---------|-------|--------------|
| High-quality warning bg | Amber | `bg-amber-50` |
| High-quality warning border | Amber | `border-amber-200` |
| Re-engagement options bg | Blue | `bg-blue-50` |
| Important warning bg | Red | `bg-red-50` |
| Confirm button | Red | `bg-red-500` |
| Error border | Red | `border-red-300` |

### **Icons**

| Icon | Component | Color |
|------|-----------|-------|
| Header | XCircle | Red |
| High-quality warning | AlertTriangle | Amber |
| Important warning | AlertCircle | Red |
| Error message | AlertCircle | Red |

### **Spacing**

| Area | Spacing |
|------|---------|
| Modal padding | 6 (24px) |
| Section gaps | 6 (24px) |
| Label margin | 2 (8px) |
| Button gap | 3 (12px) |

---

## 📱 Responsive Check

### **Desktop (>1024px)**
- ✅ Modal: 768px wide
- ✅ Centered on screen
- ✅ Max height: 90vh
- ✅ Scrollable content
- ✅ All content visible

### **Tablet (768px - 1024px)**
- ✅ Modal: 90% width
- ✅ Maintains padding
- ✅ Buttons stack properly
- ✅ Dropdowns full width

### **Mobile (<768px)**
- ✅ Modal: Full width
- ✅ Reduced padding
- ✅ Buttons full width
- ✅ Text readable
- ✅ Touch-friendly targets

---

## ⌨️ Keyboard Navigation

| Action | Key | Expected |
|--------|-----|----------|
| Open modal | - | Focus on close button |
| Tab | Tab | Cycles through elements |
| Select reason | Enter/Space | Opens dropdown |
| Navigate options | Arrow keys | Moves through options |
| Select option | Enter | Selects option |
| Toggle checkbox | Space | Toggles state |
| Confirm | Enter | Submits form (if valid) |
| Cancel | Escape | Closes modal |

---

## 🐛 Edge Cases

### **Edge Case 1: Missing Lead Data**

**Setup**:
```typescript
lead={{
  name: "John Doe",
  company: "Company",
  email: "john@company.com"
  // No aiScore, bantScore, title
}}
```

**Expected**:
- ✅ Uses defaults: aiScore=92, bantScore=20
- ✅ Title shows: "Chief Financial Officer"
- ✅ No errors

---

### **Edge Case 2: Long Text**

**Steps**:
1. Type 500 characters in additional details
2. Check display

**Expected**:
- ✅ Textarea expands
- ✅ Scrollable if needed
- ✅ All text saved

---

### **Edge Case 3: Rapid Clicking**

**Steps**:
1. Select reason
2. Click confirm 10 times rapidly

**Expected**:
- ✅ Only submits once
- ✅ Modal closes
- ✅ No duplicate submissions

---

## 📊 Performance Checks

| Metric | Target | How to Test |
|--------|--------|-------------|
| Open time | <100ms | Click open, measure |
| Scroll smoothness | 60fps | Scroll content |
| Dropdown open | <50ms | Click dropdown |
| Form submission | <100ms | Click confirm |
| Close time | <100ms | Click cancel |

---

## ✅ Acceptance Criteria

### **Must Have**
- ✅ All 8 reason categories visible
- ✅ All 24 reasons selectable
- ✅ High-quality warning for scores ≥80
- ✅ Competitor field appears for competition reasons
- ✅ Re-engagement options hide when "never" selected
- ✅ Dynamic dates calculated correctly
- ✅ Form validation works
- ✅ Error messages clear
- ✅ Data structure correct
- ✅ Modal closes on confirm/cancel

### **Should Have**
- ✅ Smooth animations
- ✅ Keyboard accessible
- ✅ Mobile responsive
- ✅ Touch-friendly
- ✅ Clear visual hierarchy

### **Nice to Have**
- ✅ Auto-focus on first field
- ✅ Confirmation on high-quality leads
- ✅ Helpful placeholder text
- ✅ Clean reset on close

---

## 🎯 2-Minute Full Test

**Complete workflow test:**

1. **Open** (5s)
   - Click "Disqualify Lead"
   - ✅ Modal appears

2. **High-Quality Warning** (10s)
   - ✅ Amber box visible
   - ✅ Scores displayed

3. **Select Reason** (15s)
   - Click dropdown
   - Select "Lost deal to competitor"
   - ✅ Competitor field appears

4. **Fill Details** (20s)
   - Select "Workday"
   - Type: "Better pricing"

5. **Re-engagement** (15s)
   - Select "6 months"
   - ✅ Date updates
   - ✅ Blue box visible

6. **Notifications** (10s)
   - Check "CC Sales Manager"
   - Check "Notify Slack"

7. **Confirm** (10s)
   - Click "Confirm Disqualification"
   - ✅ Modal closes
   - ✅ Correct data returned

8. **Re-open & Cancel** (15s)
   - Open modal again
   - ✅ Form reset
   - Click "Cancel"
   - ✅ Modal closes

**Total: 2 minutes**

---

## 📝 Test Results Template

```
Test Date: _____________
Tester: _____________

VISUAL ELEMENTS
☐ Modal opens correctly
☐ Lead info displays
☐ High-quality warning (if applicable)
☐ Scrolling works
☐ Buttons visible

FUNCTIONALITY
☐ Reason dropdown works
☐ Competitor field (conditional)
☐ Re-engagement options
☐ Follow-up checkboxes
☐ Notification checkboxes
☐ Additional details

VALIDATION
☐ Empty form error
☐ Error message displays
☐ Error clears on fix
☐ Successful submission

EDGE CASES
☐ Missing data handled
☐ Long text works
☐ Reset on cancel
☐ No duplicate submissions

PERFORMANCE
☐ Fast open (<100ms)
☐ Smooth scrolling
☐ Quick submission

Notes:
_________________________________
_________________________________
_________________________________

Overall: PASS / FAIL
```

---

**Status**: ✅ READY FOR TESTING
**All Features**: ✅ IMPLEMENTED
**Documentation**: ✅ COMPLETE
**Build**: ✅ PASSING

---

*Quick Test Guide v1.0*
*Last Updated: January 9, 2026*
