# Intelligence Detail View - 5-Minute Quick Test

**Test Page**: Screen 4.2 - TechStart Inc Funding Signal
**URL**: `/lead-generation/intelligence/1`

---

## 🎯 QUICK TEST (5 MINUTES)

### ⏱️ MINUTE 1: NAVIGATION (4 tests)

1. **Breadcrumb**: Click "Dashboard" → Should navigate to `/lead-generation/dashboard` ✅
2. **Breadcrumb**: Click "Sales Intelligence" → Should navigate to `/lead-generation/intelligence` ✅
3. **Hero Button**: Click "← Back to Feed" → Should navigate to `/lead-generation/intelligence` ✅
4. **Similar Signal**: Scroll down to "Similar Signals", click "Hired VP of Sales" → Should navigate ✅

---

### ⏱️ MINUTE 2: HERO ACTIONS (5 tests)

1. **Add to Leads**: Click orange "Add to Leads" button → Modal opens ✅
   - Close modal with Cancel

2. **Dismiss**: Click "Dismiss Signal" → Modal opens with dropdown ✅
   - Close modal with Cancel

3. **Watch List**: Click "⭐ Add to Watch List" → Green toast appears "Added to watch list" ✅

4. **More Actions**: Click "..." three-dot menu → Dropdown appears with 4 options ✅

5. **Set Reminder**: In dropdown, click "Set Reminder" → Reminder modal opens ✅
   - Close modal with Cancel

---

### ⏱️ MINUTE 3: DECISION MAKERS (6 tests)

Scroll to right sidebar "Decision Makers" section:

1. **Click Name**: Click "Sarah Lee" → Contact modal opens ✅

2. **Copy Email**: In contact modal, click copy icon next to email → Green toast "Email copied" ✅

3. **Copy Phone**: Click copy icon next to phone → Green toast "Phone copied" ✅
   - Close modal

4. **LinkedIn**: Click "LinkedIn Profile" link for Robert Chen → Opens in new tab ✅

5. **Add as Lead**: Click blue "Add as Lead" button for Michael Zhang → Modal opens ✅
   - Close modal

6. **Add All**: Click "Add All as Leads" in section header → Toast + navigates after 1.5s ✅

---

### ⏱️ MINUTE 4: MODALS & SCORE (4 tests)

1. **Score Breakdown**: In left purple "AI Intelligence" panel, click "88/100" score → Score breakdown modal opens showing 5 factors ✅
   - Close with X

2. **Buying Intent**: Click "HIGH 🔥 (85%)" → Intent factors modal opens showing 4 factors ✅
   - Close with X

3. **Create Multiple**: In right sidebar "Quick Actions", click "Create Multiple Leads" → Modal opens with checkboxes ✅
   - Check/uncheck some boxes
   - Close modal

4. **Add to Sequence**: Click "Add to Sequence" → Modal opens with dropdown and checkboxes ✅
   - Close modal

---

### ⏱️ MINUTE 5: EXTERNAL LINKS & SHARE (5 tests)

1. **Crunchbase**: In "Funding Details", click "View on Crunchbase →" → Opens new tab ✅

2. **Press Release**: Click "Read Press Release →" → Opens new tab ✅

3. **Full Article**: In "Full Article" section, click "Read Full Article →" → Opens new tab ✅

4. **Company Website**: In "Related Content", click first link (Company Website) → Opens new tab ✅

5. **Share**: In sidebar "Quick Actions", click "Share with Team" → Modal opens with team member checkboxes ✅
   - Close modal

---

## ✅ CHECKLIST SUMMARY

**Total Tests**: 24
**Expected Time**: 5 minutes
**Pass Criteria**: All actions work as described

---

## 🎯 WHAT TO LOOK FOR

### ✅ Visual Feedback
- Hover effects on all buttons and links
- Toast notifications appear (green background)
- Modals open centered with backdrop
- Copied icons turn into green checkmarks briefly

### ✅ Navigation
- Breadcrumb links navigate correctly
- "Back to Feed" returns to intelligence page
- Similar signals navigate to detail views
- External links open in new tabs

### ✅ Modals
- All modals open on respective button clicks
- Cancel buttons close modals
- X button in top right closes modals
- Backdrop click should NOT close modals (intentional)

### ✅ Toasts
- Green success toasts for positive actions
- Red error toasts for validation failures
- Toasts auto-dismiss after ~3 seconds
- Multiple toasts stack properly

---

## 🚨 COMMON ISSUES TO CHECK

1. **Icons Missing?** → Check lucide-react installation
2. **Toasts Not Showing?** → Check ToastContext provider in App.tsx
3. **Navigation Not Working?** → Check react-router-dom setup
4. **Modals Not Centered?** → Check z-index and flex centering

---

## 🎨 VISUAL EXPECTATIONS

### Hero Section
- Orange background (funding signal)
- 4 buttons: Add to Leads (orange), Dismiss, Watch List, More (...)
- Back button in top right

### Left Column
- Purple gradient AI Intelligence panel
- White panels for Funding Details, Article, Timeline
- All external links have arrow icons

### Right Sidebar
- White panels stacked vertically
- 3 decision maker cards with gray backgrounds
- 8 action buttons in Quick Actions panel

### Modals
- Centered on screen
- Dark backdrop (50% opacity black)
- White background
- Rounded corners
- Shadow effect

---

## 📊 INTERACTION TYPES COVERED

- ✅ Navigation (4 types)
- ✅ Button clicks (20+ buttons)
- ✅ Modal interactions (9 modals)
- ✅ Copy-to-clipboard (6 actions)
- ✅ External links (11 links)
- ✅ Dropdown menus (1 menu)
- ✅ Checkboxes (multiple modals)
- ✅ Form inputs (date, time, textarea, dropdown)

---

## 🎯 POWER USER TEST (Advanced)

If you want to test more thoroughly:

1. **Test all 3 Decision Makers** - Click each name, copy each email/phone
2. **Test all Similar Signals** - Click all 4 signal cards
3. **Test all External Links** - Click all 11 external links
4. **Test all Modals** - Open and close all 9 modals
5. **Test Validation** - Try submitting modals without required fields

---

## ✅ SUCCESS CRITERIA

After 5 minutes, you should have:
- ✅ Opened at least 5 different modals
- ✅ Seen at least 3 toast notifications
- ✅ Navigated to at least 2 different pages
- ✅ Opened at least 2 external links in new tabs
- ✅ Copied at least 1 email to clipboard

**If all above work**: Implementation is functioning correctly! 🎉

---

**Happy Testing!** 🚀
