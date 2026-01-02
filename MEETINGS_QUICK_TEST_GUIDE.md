# Meetings Module - Quick Test Guide

## 5-Minute Verification Checklist

### 1. Visual Design (1 min)
- [ ] Open `/crm/meetings`
- [ ] Check meeting type icons: Video (blue), Call (green), In-Person (orange)
- [ ] Verify card spacing and padding looks consistent
- [ ] Check typography: titles bold 18px, body 14px, details 13px

### 2. HRMS Integration (30 sec)
- [ ] Find meeting: "TechStart Inc - Contract Negotiation"
- [ ] Orange dot visible in top-right corner (pulsing)
- [ ] HRMS badge button shows "🏢 HRMS Connected - Recruited Nov 2024"
- [ ] Click badge → Modal opens with recruitment info

### 3. AI Features (1 min)
- [ ] Live meeting shows "Processing... 45%" with purple badge
- [ ] Completed meeting "Acme Corp" shows green "AI Processed ✓" badge
- [ ] AI Summary section visible with purple Sparkles icon
- [ ] Sentiment badge shows 😊 with green background
- [ ] Click "4 action items" → Modal opens

### 4. Real-Time Status (45 sec)
- [ ] Live meeting "InnovateLabs" has red 4px left border
- [ ] "LIVE" badge with pulsing red dot
- [ ] "LIVE NOW (1)" section header in red at top
- [ ] Upcoming meeting shows "Starting in X hours" blue badge

### 5. Navigation (45 sec)
- [ ] Click attendee name "David Kumar" → Navigates to contact
- [ ] Click deal "Acme Corp - $50K" → Navigates to deal detail
- [ ] Click account "Acme Corp" → Navigates to account
- [ ] Click meeting card → Opens meeting detail

### 6. Interactive Elements (30 sec)
- [ ] Hover over card → Border turns blue, lifts 2px, shadow appears
- [ ] Hover over links → Darker blue + underline
- [ ] All animations smooth (60fps)
- [ ] Pulsing dots continuously animate

### 7. Filters (30 sec)
- [ ] Filter by Status: "Live" → Shows 1 meeting
- [ ] Filter by Type: "Video" → Shows video meetings only
- [ ] Search: "Acme" → Shows Acme Corp meeting
- [ ] Clear filters → Shows all meetings

### 8. Sticky Headers (15 sec)
- [ ] Scroll down page
- [ ] Section headers ("LIVE NOW", "TODAY") stick to top
- [ ] Background prevents content overlap

### 9. Data Display (30 sec)
- [ ] Stats cards at top show correct numbers
- [ ] Meeting times formatted: "Dec 21, 2025 • 2:30 PM - 3:15 PM (45 mins)"
- [ ] Attendees list all names with clickable links
- [ ] Deal shows title, value, and stage

### 10. Modals (30 sec)
- [ ] Click "Schedule Meeting" → Modal opens
- [ ] Click action items button → Modal shows tasks
- [ ] Click HRMS badge → Modal shows recruitment data
- [ ] Click outside or X → Modals close

---

## Quick Feature Checklist

### HRMS Indicators
✅ Orange pulsing dot (top-right)
✅ Orange badge button with recruitment date
✅ Clickable → Shows history modal
✅ Appears on 2 meetings (TechStart, DataFlow)

### AI Status Badges
✅ Green "AI Processed ✓" (processed meetings)
✅ Purple "Processing... X%" (live/processing)
✅ Progress bar with percentage
✅ AI Summary with Sparkles icon

### Sentiment Badges
✅ 😊 Green background (positive)
✅ 😐 Yellow background (neutral)
✅ ☹️ Red background (negative)
✅ Shows percentage score

### Live Indicators
✅ Red 4px left border
✅ Pulsing red dot + "LIVE" badge
✅ Red section header
✅ Always appears at top

### Meeting Type Icons
✅ Video: Blue icon (#3b82f6)
✅ Call: Green icon (#10b981)
✅ In-Person: Orange icon (#f59e0b)

### Navigation Links
✅ Attendee names → Contact detail (3.2)
✅ Deal links → Deal detail (5.2)
✅ Account names → Account detail
✅ All blue with hover underline

### Interactive States
✅ Card hover: Blue border + shadow + lift
✅ Link hover: Darker + underline
✅ Button hover: Shadow elevation
✅ All animations 60fps smooth

---

## Sample Test Data

### Meetings to Test With

**Live Meeting**:
- Title: "InnovateLabs - Technical Deep Dive"
- Status: Live with red border
- AI: Processing 45%

**HRMS Meeting**:
- Title: "TechStart Inc - Contract Negotiation"
- HRMS: Connected (Nov 2024)
- Orange pulsing dot visible

**AI Processed**:
- Title: "Acme Corp - Proposal Review"
- AI: Complete with summary
- Sentiment: Positive 85%
- Action Items: 4 tasks

**Upcoming**:
- Title: "BigCo Enterprise - Discovery Call"
- Status: Upcoming
- Prep Notes: 3 tips visible

---

## Known Good States

All 7 meetings should display correctly:
1. InnovateLabs (Live, Processing)
2. Acme Corp (Completed, AI Processed)
3. TechStart (Completed, HRMS, Processing)
4. BigCo (Upcoming, Prep Notes)
5. DataFlow (Upcoming, HRMS)
6. StartCo (Completed, AI Processed)
7. HealthPlus (Completed, AI Processed, Neutral)

---

## Quick Issue Diagnostic

**If cards look wrong**:
- Check: Card has `p-5`, `space-y-4`, `hover:border-blue-400`
- Check: Typography styles inline (fontSize, color)

**If HRMS dot missing**:
- Check: `meeting.hrmsConnected === true`
- Check: Absolute positioning (top-4, right-4)

**If animations not smooth**:
- Check: `transition-all duration-200`
- Check: Hardware acceleration enabled
- Check: `animate-pulse` classes applied

**If colors wrong**:
- Check: Inline styles with exact hex codes
- Check: No Tailwind overrides

**If navigation broken**:
- Check: `onClick` includes `navigate()`
- Check: Event propagation stopped (`e.stopPropagation()`)

---

## Performance Benchmarks

Target: All should pass
- [ ] Initial load: <1 second
- [ ] Filter update: <50ms
- [ ] Search typing: Real-time (<50ms)
- [ ] Animations: 60fps
- [ ] No console errors
- [ ] No memory leaks

---

## Browser Quick Check

Test in:
- [ ] Chrome (primary)
- [ ] Firefox (sticky headers)
- [ ] Safari (animations)
- [ ] Mobile Safari (responsive)

---

**Total Test Time**: ~5 minutes
**Expected Result**: All checkboxes ✅
**Status**: Production Ready
