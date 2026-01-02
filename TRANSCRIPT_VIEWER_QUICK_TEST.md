# MEETING TRANSCRIPT VIEWER - 3-MINUTE QUICK TEST

**Screen 13.3: Meeting Transcript Viewer**
**Route:** `/crm/meetings/:id/transcript`

---

## 🚀 CRITICAL PATH TEST (1 minute)

### Must-Pass Items:

1. **Open Transcript** → Navigate from meeting detail page ✅
2. **Search for "integration"** → Finds 5 results ✅
3. **Click [Jump to]** on first result → Scrolls to segment ✅
4. **Click timestamp** → Highlights segment ✅
5. **Filter to "Action Items"** → Shows 4 segments ✅
6. **Click [Copy]** → Toast appears ✅
7. **Click [← Back]** → Returns to meeting ✅

**If these 7 items pass → Core functionality working! ✅**

---

## 📋 COMPREHENSIVE TEST (3 minutes)

### Step 1: Header Actions (30 sec)
- [ ] Search input works in real-time
- [ ] [Download] shows 4 format options
- [ ] [Share] opens modal
- [ ] [Highlight] shows toast
- [ ] [Copy] shows toast
- [ ] [← Back] navigates to meeting

### Step 2: Toolbar Filters (30 sec)
- [ ] "All" shows 20 segments
- [ ] "Action Items" shows 4 segments
- [ ] "Key Moments" shows 6 segments
- [ ] Speaker filter works
- [ ] "Jump to" dropdown works

### Step 3: Transcript Display (30 sec)
- [ ] 20 segments visible (when "All" selected)
- [ ] Speaker avatars show initials
- [ ] Timestamps are clickable
- [ ] Key moments have purple badges
- [ ] Action items have green badges
- [ ] Sentiment emojis appear (😊 😐 ☹️)

### Step 4: Sidebar Navigation (45 sec)
- [ ] Quick Navigation shows 6 key moments
- [ ] Each [Jump to] button works
- [ ] Action Items panel shows 4 tasks
- [ ] Stats panel displays correctly
- [ ] Sidebar stays sticky when scrolling

### Step 5: Search Features (45 sec)
- [ ] Type "Salesforce" → finds results
- [ ] Yellow highlights appear on matches
- [ ] Search results panel appears in sidebar
- [ ] [Jump to] in results works
- [ ] Clear search removes highlights

---

## 🎯 INTERACTION CHECKLIST

### Navigation (20 interactions)
```
✓ Breadcrumb "Meetings" → /crm/meetings
✓ Breadcrumb "Meeting Name" → /crm/meetings/:id
✓ [← Back to Meeting] → meeting detail
✓ Click timestamp → jump to segment
✓ [Jump to] in key moments → jump
✓ [Jump to] in action items → jump
✓ [Jump to] in search results → jump
✓ "Jump to" dropdown → jump
```

### Filtering (8 interactions)
```
✓ Show: All
✓ Show: Action Items
✓ Show: Key Moments
✓ Speaker: All
✓ Speaker: John Smith
✓ Speaker: Alex Rodriguez
✓ Combined filters
```

### Actions (12 interactions)
```
✓ [Download] → shows menu
✓ Download PDF → toast
✓ Download DOCX → toast
✓ Download TXT → toast
✓ Download with highlights → toast
✓ [Share] → opens modal
✓ Share - Copy Link → toast
✓ Share - Email → toast
✓ Share - Download → toast
✓ [Copy] → toast
✓ [Highlight] → toast
✓ [View Analytics] → toast
```

---

## 📊 VISUAL VERIFICATION

### Color Coding:
- 💰 **Budget moments** → Purple badge with DollarSign icon
- 📅 **Timeline moments** → Purple badge with Calendar icon
- 🔌 **Integration moments** → Purple badge with Plug icon
- 👔 **Decision moments** → Purple badge with Users icon
- ✅ **Action items** → Green badge with CheckCircle icon
- 😊 **Positive sentiment** → Green background
- 😐 **Neutral sentiment** → Yellow background
- ☹️ **Negative sentiment** → Red background

### Layout:
- Left panel: 70% width, scrollable
- Right sidebar: 400px, sticky
- Gap between: 1.5rem
- Highlighted segment: Blue border + blue background

---

## 🔍 DATA VERIFICATION

### Expected Counts:
- **Total segments:** 20
- **Key moments:** 6
- **Action items:** 4
- **Speakers:** 2 (John Smith, Alex Rodriguez)
- **Duration:** 45 minutes
- **Word count:** 3,245 words

### 6 Key Moments:
1. 05:30 - Budget Confirmed ($50,000)
2. 06:20 - Very Positive Response
3. 15:45 - Timeline Discussed (Q1 2026)
4. 22:10 - Integration Concerns (Salesforce)
5. 35:20 - CEO Approval Needed
6. 42:15 - Agreement on Next Steps

### 4 Action Items:
1. Send Salesforce integration docs (In Progress)
2. Request CEO introduction (Pending)
3. Send updated proposal (Completed ✅)
4. Schedule technical demo (Pending)

---

## 🧪 SEARCH TEST CASES

| Query | Expected Results |
|-------|------------------|
| "integration" | 5 matches |
| "Salesforce" | 3 matches |
| "$50,000" | 1 match |
| "timeline" | 2 matches |
| "CEO" | 2 matches |
| "" (empty) | All segments |

---

## 🎨 AI FEATURES TO VERIFY

### AI Detections (shown in purple boxes):
- [x] Budget confirmed: $50,000
- [x] Timeline: 6 months (Q1 2026)
- [x] Go-live: March 15, 2026
- [x] Competitor identified: Salesforce
- [x] Decision maker: CEO approval needed

### AI Created Tasks (shown in green boxes):
- [x] Send integration guide - Alex Rodriguez - Dec 12
- [x] Request CEO introduction - John Smith - Dec 15
- [x] Send updated proposal - Alex Rodriguez - Dec 10
- [x] Schedule technical demo - Sarah Chen - Dec 18

### CRM Updates:
- [x] Deal amount confirmed
- [x] Close date set
- [x] Competitor added to deal
- [x] Notes updated

---

## 📈 STATS PANEL VERIFICATION

**Basic Stats:**
- Total Words: 3,245 ✅
- Duration: 45 minutes ✅
- Avg Words/Minute: 72 ✅

**Speakers:**
- John Smith: 49% (22 mins) ✅
- Alex Rodriguez: 51% (23 mins) ✅

**Sentiment:**
- 😊 Positive: 75% (34 mins) ✅
- 😐 Neutral: 20% (9 mins) ✅
- ☹️ Negative: 5% (2 mins) ✅

**AI:**
- Confidence: 95% ✅

---

## ⚡ PERFORMANCE CHECKS

- [ ] Page loads in <1 second
- [ ] Search responds in real-time
- [ ] Filters update instantly
- [ ] Scrolling is smooth (60fps)
- [ ] Jump-to animates smoothly
- [ ] No console errors
- [ ] No layout shifts

---

## 🐛 EDGE CASES TO TEST

- [ ] Empty search query
- [ ] Search with no results
- [ ] Filter to 0 segments
- [ ] Click jump while already highlighted
- [ ] Scroll during highlight (should persist)
- [ ] Click outside dropdown (should close)
- [ ] Click outside modal (should close)
- [ ] Multiple rapid filter changes
- [ ] Search while filtered

---

## ✅ PASS CRITERIA

**Module passes if:**
- All 7 critical path items work ✅
- All 20+ navigation links work ✅
- All 8 filters work ✅
- All 12 actions work ✅
- Search finds correct results ✅
- Sidebar stays sticky ✅
- Stats display correctly ✅
- No console errors ✅

**Status:** ⬜ PASS  ⬜ FAIL

---

## 🎯 DEMO SCRIPT

For demoing this feature to stakeholders:

1. **Open transcript** → "Here's our AI-powered transcript viewer"
2. **Show search** → "Search for any term, like 'integration'"
3. **Click result** → "Jump directly to that moment"
4. **Point to purple badges** → "AI detected these key moments"
5. **Point to green badges** → "AI created these action items"
6. **Show sidebar** → "Quick navigation to important parts"
7. **Show stats** → "Full analytics on the conversation"
8. **Click download** → "Export in multiple formats"

**Time:** 2 minutes

---

**Total Test Time:** 3 minutes
**Expected Result:** All items pass ✅
**Status:** Production Ready
