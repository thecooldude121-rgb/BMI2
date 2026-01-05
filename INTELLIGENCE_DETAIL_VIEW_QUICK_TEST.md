# Intelligence Detail View - Quick Test Guide (3 Minutes)

**Last Updated:** January 5, 2026
**Component:** Screen 4.2 - Intelligence Detail View
**URL:** `/lead-generation/intelligence/1`

---

## 🚀 QUICK ACCESS

**From Sales Intelligence Feed:**
1. Navigate to `/lead-generation/intelligence`
2. Click "View Details" on TechStart Inc card (first card)
3. Should navigate to `/lead-generation/intelligence/1`

**Direct URL:**
- Go to: `/lead-generation/intelligence/1`

---

## ⚡ 1-MINUTE VISUAL CHECK

### Hero Header (15 seconds)
Look at the top section:

✅ **Check These Elements:**
- [ ] Orange "💰 FUNDING SIGNAL" badge visible
- [ ] Title: "TechStart Inc raised $10M Series A"
- [ ] Company info: "FinTech | 45 employees | San Francisco, CA"
- [ ] Detection time: "Nov 15, 2024 at 10:30 AM (2 hours ago)"
- [ ] AI Score: "88/100" with 4 stars (⭐⭐⭐⭐)
- [ ] Status: "🟢 New Signal"
- [ ] Back button (top right)
- [ ] 4 action buttons below

### Layout Structure (15 seconds)
Verify the page layout:

✅ **Two Columns:**
- [ ] Left column (wider) - Main content
- [ ] Right column (narrower) - Sidebar
- [ ] Proper spacing between sections
- [ ] All cards have white background and borders

### Key Sections Visible (30 seconds)
Scroll through and confirm you see:

**Left Column:**
- [ ] Purple gradient "AI Intelligence" panel
- [ ] "Funding Details" panel
- [ ] "Press Coverage" panel
- [ ] "Additional Resources" panel
- [ ] "Signal History" timeline

**Right Column:**
- [ ] "TechStart Inc" company overview
- [ ] "Decision Makers (3)" with individual cards
- [ ] Blue "If Converted to Lead" score panel
- [ ] "Similar Signals" section
- [ ] "Quick Actions" buttons (8 actions)

---

## 🎯 2-MINUTE INTERACTION TEST

### Test 1: Navigation (30 seconds)

**Back Button:**
1. Click "← Back to Feed" (top right)
2. Should navigate to `/lead-generation/intelligence`
3. Use browser back to return

**Breadcrumb:**
1. Click "Sales Intelligence" in breadcrumb
2. Should navigate to feed
3. Use browser back to return

**Related Signals:**
1. Scroll to right sidebar "Similar Signals"
2. Click "View Signal" on any related signal
3. Should navigate to that signal's detail
4. Use browser back to return

✅ **PASS if**: All navigation works smoothly

---

### Test 2: AI Analysis Panel (30 seconds)

Scroll to purple gradient "AI Intelligence" section:

✅ **Verify:**
- [ ] Signal Score: "88/100" with purple bar (8-9 segments filled)
- [ ] Label: "Excellent"
- [ ] Buying Intent: "HIGH 🔥"
- [ ] Orange bar: "85%"
- [ ] "Why This Matters" has 4 items with green checkmarks:
  - Budget confirmed ($10M raised)
  - Growth stage (Series A)
  - Scaling teams (expansion mode)
  - Decision makers accessible
- [ ] "Recommended Actions" numbered 1-4
- [ ] "Similar Companies" shows 3 pill badges

✅ **PASS if**: Purple background visible, all content displays

---

### Test 3: Decision Makers (30 seconds)

Scroll to right sidebar "Decision Makers (3)":

✅ **Verify Each Card:**

**Card 1: Sarah Lee**
- [ ] Avatar icon (blue circle)
- [ ] Name: "Sarah Lee"
- [ ] Title: "CFO (Decision Maker)"
- [ ] Email: "sarah@techstart.com"
- [ ] Phone: "+1 555-0456"
- [ ] LinkedIn link
- [ ] Blue "Add as Lead" button

**Card 2: Robert Chen**
- [ ] Name: "Robert Chen"
- [ ] Title: "CEO & Co-Founder"
- [ ] Email: "robert@techstart.com"
- [ ] Phone: "+1 555-0457"
- [ ] LinkedIn link
- [ ] Blue "Add as Lead" button

**Card 3: Michael Zhang**
- [ ] Name: "Michael Zhang"
- [ ] Title: "CTO & Co-Founder"
- [ ] Email: "michael@techstart.com"
- [ ] LinkedIn link (no phone)
- [ ] Blue "Add as Lead" button

**Bottom Button:**
- [ ] Black "Add All as Leads" button

✅ **PASS if**: All 3 decision makers display with complete info

---

### Test 4: Modals (30 seconds)

**Add to Leads Modal:**
1. Click any "Add as Lead" button on a decision maker
2. ✅ Modal should open
3. ✅ Shows "Add to Leads" title
4. ✅ Mentions decision maker name
5. Click "Create Lead"
6. ✅ Should navigate to `/lead-generation/leads/new?from=intelligence&signalId=1`
7. Use browser back to return

**Hero Actions:**
1. Click "➕ Add to Leads" in hero section
2. ✅ Modal opens (general, not decision-maker specific)
3. Click "Cancel"
4. ✅ Modal closes

**Quick Actions:**
1. Scroll to right sidebar "Quick Actions"
2. Click "➕ Create Lead"
3. ✅ Modal opens
4. Click "Cancel"

✅ **PASS if**: Modals open, close, and navigate correctly

---

## 📊 DETAILED CONTENT CHECK (Optional - 2 minutes)

### Funding Details Panel

**Grid Info (Top):**
- [ ] Round Type: "Series A"
- [ ] Amount: "$10 million"
- [ ] Announced: "Nov 12, 2024"
- [ ] Valuation: "Post-money: $40M"

**Investors:**
- [ ] Lead Investor: "Accel Partners (Lead)"
- [ ] Participating: "Sequoia Capital", "Y Combinator"

**Use of Funds:**
- [ ] Expand sales team (40%)
- [ ] Product development (30%)
- [ ] Marketing & growth (20%)
- [ ] Operations (10%)

**External Links:**
- [ ] "View on Crunchbase →"
- [ ] "Read Press Release →"

---

### Lead Score Potential Panel (Blue Gradient)

**Top Section:**
- [ ] "Estimated Score: 88/100"
- [ ] Blue progress bar (8-9 segments filled)

**Score Factors (with checkmarks):**
- [ ] Funding: +25 points
- [ ] Growth signals: +20 points
- [ ] Decision makers: +15 points
- [ ] Tech stack fit: +15 points
- [ ] Company size: +13 points

**Bottom Metrics:**
- [ ] Conversion Probability: 67%
- [ ] Green progress bar
- [ ] Expected Close Rate: 45% (High!)
- [ ] Orange text

---

### Company Overview Card

**Details:**
- [ ] Industry: "FinTech"
- [ ] Founded: "2019"
- [ ] Employees: "45"
- [ ] HQ: "San Francisco, CA"
- [ ] Website: "techstart.com"
- [ ] Revenue: "$8M (estimated)"

**Tech Stack (4 items):**
- [ ] AWS (Cloud)
- [ ] Salesforce (CRM)
- [ ] Slack (Collaboration)
- [ ] Stripe (Payments)

**Social:**
- [ ] LinkedIn icon
- [ ] Twitter icon
- [ ] Blog icon

**Button:**
- [ ] "View Full Profile"

---

### Press Coverage Panel

**Article:**
- [ ] Title: "TechStart Inc Raises $10M Series A to Revolutionize FinTech"
- [ ] Published: "Nov 12, 2024"
- [ ] Source: "TechCrunch"
- [ ] Summary (2 paragraphs)
- [ ] Quote from Robert Chen, CEO
- [ ] "Read Full Article →" link

---

### Similar Signals Section

**Other TechStart Inc Signals (2):**

1. **First Signal:**
   - [ ] Type: "📈 HIRING"
   - [ ] Title: "Hired VP of Sales"
   - [ ] Time: "1 month ago"
   - [ ] Score: "82/100"
   - [ ] "View Signal" link

2. **Second Signal:**
   - [ ] Type: "📈 HIRING"
   - [ ] Title: "Posted 3 Sales Engineer jobs"
   - [ ] Time: "2 weeks ago"
   - [ ] Score: "78/100"
   - [ ] "View Signal" link

**Similar Companies (2):**

1. **DataFlow Inc:**
   - [ ] Type: "💰" (funding icon)
   - [ ] Amount: "$12M Series A"
   - [ ] Industry: "Data Analytics"
   - [ ] Score: "85/100"
   - [ ] Status: "✅ Converted"
   - [ ] "View" link

2. **InnovateLabs:**
   - [ ] Type: "💰" (funding icon)
   - [ ] Amount: "$5M Seed"
   - [ ] Industry: "HealthTech"
   - [ ] Score: "72/100"
   - [ ] Status: "🟢 New"
   - [ ] "View" link

---

### Activity Timeline

**3 Timeline Items:**

1. **First Event:**
   - [ ] Blue dot
   - [ ] Date: "Nov 15, 2024 - 10:30 AM"
   - [ ] Event: "Signal detected"
   - [ ] Source: "Crunchbase API"

2. **Second Event:**
   - [ ] Date: "Nov 12, 2024 - 9:00 AM"
   - [ ] Event: "Press release published"
   - [ ] Source: "TechCrunch"

3. **Third Event:**
   - [ ] Date: "Nov 15, 2024 - 12:15 PM"
   - [ ] Event: "Viewed by Sarah C."
   - [ ] User: "Sarah C."

---

## 🎨 VISUAL QUALITY CHECK

### Color Coding
- [ ] Hero header: Orange background (`orange-50`)
- [ ] AI Analysis panel: Purple gradient
- [ ] Lead Score panel: Blue gradient
- [ ] Action buttons: Blue primary, gray secondary

### Layout
- [ ] No overlapping content
- [ ] Proper spacing between sections
- [ ] Cards aligned correctly
- [ ] Text readable (no truncation)
- [ ] Icons consistent size

### Responsive
- [ ] Desktop view: Two columns side-by-side
- [ ] Scroll smooth
- [ ] No horizontal scroll
- [ ] All content accessible

---

## ✅ PASS CRITERIA

**Test PASSES if:**
- ✅ All hero header elements visible
- ✅ Two-column layout renders properly
- ✅ AI Intelligence panel has purple background
- ✅ All 3 decision makers display
- ✅ Lead Score panel has blue background
- ✅ All navigation works (back, breadcrumb, links)
- ✅ Modals open and close
- ✅ No console errors
- ✅ All content displays correctly
- ✅ External links functional

**Test FAILS if:**
- ❌ Hero header missing or broken
- ❌ Layout collapsed or overlapping
- ❌ Decision makers not showing
- ❌ Navigation broken
- ❌ Modals don't open
- ❌ Console errors present
- ❌ Missing sections
- ❌ Wrong colors (e.g., purple instead of orange)

---

## 🐛 WHAT TO LOOK FOR

### ✅ GOOD (Expected)
- Orange hero header for funding signals
- Purple AI analysis background
- Blue lead score background
- All 3 decision makers with complete info
- Score bars filled correctly (8-9 segments for 88%)
- Smooth navigation
- Clean, professional design

### ❌ BAD (Report if Found)
- Wrong hero color (not orange)
- Missing AI analysis panel
- Decision makers not displaying
- Broken navigation links
- Modals not opening
- Console errors
- Overlapping content
- Missing sections

---

## 📝 TEST REPORT TEMPLATE

If issues found:

```
Issue: [Brief description]
Location: [Which section - Hero/Left column/Right column]
Expected: [What should happen]
Actual: [What actually happened]
Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]
Screenshot: [If applicable]
```

---

## 🎯 QUICK CHECKLIST

Use this for rapid testing:

### 30-Second Check
- [ ] Page loads without errors
- [ ] Hero header orange with correct info
- [ ] Two columns visible
- [ ] Decision makers (3) display
- [ ] All sections present

### 1-Minute Check
- [ ] Back button works
- [ ] AI panel purple background
- [ ] Lead score panel blue background
- [ ] Score bars display correctly
- [ ] Navigation links work

### 3-Minute Check
- [ ] All hero buttons clickable
- [ ] Add to Leads modal opens
- [ ] Individual "Add as Lead" works
- [ ] Related signals clickable
- [ ] External links functional
- [ ] All content accurate

---

## 🚦 STATUS INDICATORS

| Element | Expected | Check |
|---------|----------|-------|
| Hero Color | Orange | ⬜ |
| AI Panel Color | Purple gradient | ⬜ |
| Score Panel Color | Blue gradient | ⬜ |
| Decision Makers Count | 3 cards | ⬜ |
| Related Signals | 2 items | ⬜ |
| Similar Companies | 2 items | ⬜ |
| Timeline Events | 3 items | ⬜ |
| Quick Actions | 8 buttons | ⬜ |
| Back Button | Works | ⬜ |
| Modals | Open/Close | ⬜ |

**Status Key:**
- ⬜ Not Tested
- ✅ Passed
- ❌ Failed

---

## 📊 TEST MATRIX

| Test | Time | Status | Notes |
|------|------|--------|-------|
| Visual Layout | 30s | ⬜ | Two columns |
| Hero Header | 15s | ⬜ | Orange, all info |
| AI Analysis | 30s | ⬜ | Purple panel |
| Decision Makers | 30s | ⬜ | 3 complete cards |
| Lead Score | 15s | ⬜ | Blue panel |
| Navigation | 30s | ⬜ | Back, breadcrumb |
| Modals | 30s | ⬜ | Open/close |
| Content Accuracy | 60s | ⬜ | All data correct |

**Total Time:** ~3 minutes

---

## 🎓 TESTING TIPS

1. **Start Fresh:** Clear cache before testing
2. **Use DevTools:** Check for console errors
3. **Test Navigation:** Use browser back/forward
4. **Verify Colors:** Orange hero, purple AI, blue score
5. **Check Modals:** Open and close properly
6. **Scroll Through:** Ensure all sections visible
7. **Click Links:** Verify they work
8. **Take Screenshots:** Document any issues

---

**Ready to Test!** 🚀

This quick guide covers all essential functionality in just 3 minutes. For comprehensive testing, see INTELLIGENCE_DETAIL_VIEW_IMPLEMENTATION.md.
