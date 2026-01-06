# Lead Scoring & Qualification - Quick Test Card

## 🚀 Quick Access
```
Route: /lead-gen/qualify/sarah-lee
```

## ✅ 5-Minute Test Script

### 1. Hero Section (30 seconds)
- [ ] See "Sarah Lee - CFO @ TechStart Inc"
- [ ] Score shows: 92/100 with 10 dots
- [ ] Status: "Contacted → Qualification Pending"
- [ ] 3 action buttons visible: Qualify, Disqualify, Add Notes

### 2. AI Score Breakdown (1 minute)
- [ ] Overall score: 92/100 (Excellent)
- [ ] Base score: 69, HRMS bonus: +33% = +23 points
- [ ] 5 score components display:
  - Job Title: 25/25 (100%) - Green bar
  - Company: 18/25 (72%) - Blue bar
  - Engagement: 12/20 (60%) - Yellow bar
  - Intent: 10/15 (67%) - Blue bar
  - Data: 14/15 (93%) - Green bar
- [ ] 4 AI insights with lightbulb icon
- [ ] "Adjust Score Manually" button present

### 3. BANT Framework (2 minutes)
**Budget:**
- [ ] Status: Confirmed (selected)
- [ ] Range: $50K - $100K
- [ ] Timeline: Q1 2025
- [ ] Notes pre-filled
- [ ] Score: 5/5 dots

**Authority:**
- [ ] Status: Decision Maker (selected)
- [ ] Role: Final Approver
- [ ] Stakeholders listed
- [ ] Score: 5/5 dots

**Need:**
- [ ] Status: Urgent (selected)
- [ ] 3 pain points checked
- [ ] Business impact text
- [ ] Score: 5/5 dots

**Timeline:**
- [ ] Status: Immediate (selected)
- [ ] Close date: Feb 15, 2025
- [ ] 4 milestones shown
- [ ] Score: 5/5 dots

**BANT Summary:**
- [ ] Overall: 20/20 ✅ HIGHLY QUALIFIED
- [ ] All 4 components show 5/5

### 4. Qualification Decision (1 minute)
- [ ] Green panel: "RECOMMENDED ACTION: QUALIFY LEAD"
- [ ] 6 strengths listed with checkmarks
- [ ] 4 suggested next steps
- [ ] Status: Qualified (selected)
- [ ] Assigned to: John Smith (Senior AE)
- [ ] Additional notes visible
- [ ] "Qualify & Sync to CRM" button enabled (green)

### 5. Qualification History (30 seconds)
- [ ] 3 events displayed:
  - 📝 Jan 5: Notes Added
  - 🔄 Jan 4: Status Changed
  - ➕ Oct 15: Lead Created
- [ ] "View Details" buttons work

## 🎯 Key Interactions to Test

### Change BANT Values
```
1. Change budget status to "Likely"
   → Budget score changes to 4/5
   → Overall BANT changes to 19/20

2. Change need status to "Important"
   → Need score changes to 4/5
   → Overall BANT changes to 18/20
```

### Test Action Buttons
```
1. Click "Save as Draft"
   → Toast: "Qualification saved as draft"

2. Change status to "Disqualified"
   → "Qualify & Sync" button disabled
   → "Disqualify Lead" button enabled
   → Disqualification reason field appears

3. Change status back to "Qualified"
   → "Qualify & Sync" button enabled
   → Click it
   → Toast: "Lead qualified and synced to CRM successfully!"
   → Redirects to /lead-gen/leads
```

### Test History
```
1. Click "View Details" on first event
   → Event expands showing full notes
   → Button text changes to "Hide Details"

2. Click again
   → Event collapses
   → Button text returns to "View Details"
```

## 🎨 Visual Checks

### Colors
- [ ] Green: Qualified status, high scores, qualify button
- [ ] Blue: Score components, section headers
- [ ] Yellow: Warning states, moderate scores
- [ ] Red: Disqualified status, low scores, disqualify button
- [ ] Gray: Draft button, neutral elements

### Layout
- [ ] All sections have proper spacing
- [ ] Cards have consistent shadows
- [ ] Progress bars fill correctly
- [ ] Icons align with text
- [ ] Buttons are properly sized

### Typography
- [ ] Headers are bold and large
- [ ] Body text is readable
- [ ] Status indicators stand out
- [ ] Scores are prominent

## 📊 Data Validation

### Score Calculations
```
AI Score: 92 = Base (69) + HRMS Bonus (23)
Base Score: 69 = 25 + 18 + 12 + 10 + 14
HRMS Bonus: 23 = 69 × 0.33
BANT Score: 20 = 5 + 5 + 5 + 5
```

### Status Logic
```
Qualified: AI ≥ 85 AND BANT ≥ 18 ✅
Sarah Lee: AI = 92, BANT = 20 → Highly Qualified
```

## 🐛 Quick Troubleshooting

### Component Not Loading
```bash
# Check route
http://localhost:5173/lead-gen/qualify/sarah-lee

# Check console for errors
Browser DevTools → Console
```

### Buttons Not Working
```
1. Check that status matches button requirement
2. Verify onClick handlers in browser console
3. Look for JavaScript errors
```

### Scores Not Updating
```
1. Check that radio buttons are changing
2. Verify onChange handlers fire
3. Check BANT score calculation function
```

## ✨ Success Indicators

All of these should be ✅:
- [ ] Page loads without errors
- [ ] All sections render completely
- [ ] BANT scores calculate correctly
- [ ] Action buttons enable/disable properly
- [ ] Toast notifications appear on actions
- [ ] Navigation works smoothly
- [ ] History events are readable
- [ ] No console errors

## 📱 Responsive Test (Optional)

### Desktop (1920px)
- [ ] All sections visible side-by-side where appropriate
- [ ] No horizontal scrolling

### Tablet (768px)
- [ ] Sections stack vertically
- [ ] BANT framework remains usable

### Mobile (375px)
- [ ] All content readable
- [ ] Buttons accessible
- [ ] Forms functional

## ⏱️ Performance Check
```
Page Load: < 2 seconds
Score Update: Instant
Action Response: < 500ms
Navigation: < 300ms
```

## 🎓 User Flow
```
1. Lead Generation Dashboard
   ↓
2. Leads List
   ↓
3. Lead Detail Page
   ↓
4. [Qualify Button]
   ↓
5. Lead Qualification Page ← YOU ARE HERE
   ↓
6. [Qualify & Sync to CRM]
   ↓
7. Back to Leads List (with qualified lead)
```

---

**Test Duration:** 5 minutes
**Status:** ✅ Ready to Test
**Last Updated:** January 6, 2026
