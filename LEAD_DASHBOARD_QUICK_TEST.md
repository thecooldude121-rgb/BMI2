# Lead Discovery Dashboard - Quick Test Guide

## 5-Minute Interaction Test

Navigate to: `/lead-generation/dashboard`

---

## Test Sequence (5 minutes)

### 1. Header Actions (30 seconds)
- [ ] Click **Search icon** → Search bar appears
- [ ] Type "test" → Search input works
- [ ] Click **X** → Search closes
- [ ] Click **Notifications** → Dropdown shows 3 notifications
- [ ] Click outside → Dropdown closes
- [ ] Click **Profile** → Menu shows 3 options
- [ ] Click outside → Menu closes

### 2. Stats Cards (30 seconds)
- [ ] Click **Total Leads** → Navigates to prospects page
- [ ] Go back
- [ ] Click **HRMS Leads** → URL shows `?source=hrms`
- [ ] Go back
- [ ] Click **Avg Score** → Navigates to analytics

### 3. AI Insights (30 seconds)
- [ ] Click **"View Sales Intelligence Feed →"** → Navigates
- [ ] Go back
- [ ] Click first recommended action → Navigates with filter
- [ ] Go back

### 4. Intelligence Highlights (1 minute)
- [ ] Click signal title → Navigates to signal detail
- [ ] Go back
- [ ] Click company name → **Company Preview Modal** opens
  - Shows company details
  - Has "View Full Profile" and "Close" buttons
- [ ] Click **Close**
- [ ] Click **"Add to Leads"** on first signal
  - **Toast appears**: "Lead created successfully!"
  - Button becomes green "Auto-added" ✅

### 5. Recent Leads Table (2 minutes)
- [ ] Click lead name → Navigates to lead detail
- [ ] Go back
- [ ] Click **source badge** → Filters by source
- [ ] Go back
- [ ] Click **score badge** → Opens scoring page
- [ ] Go back
- [ ] Click **[Enrich]** button (on "New" lead)
  - **Toast**: "Lead enrichment started..."
  - **Toast**: "Lead enriched successfully!" ✅
- [ ] Click **[Sync]** button (on "Qualified" lead)
  - **Toast**: "Synced to CRM successfully!" ✅
- [ ] Click **[...]** dropdown on any lead
  - Shows 4 options
  - [ ] Click **"Edit lead"** → Navigates
  - [ ] Go back
  - [ ] Open dropdown again
  - [ ] Click **"Assign to user"**
    - **Toast**: "Lead assigned" ✅
  - [ ] Open dropdown again
  - [ ] Click **"Delete lead"** (red option)
    - **Toast**: "Lead deleted" ✅

### 6. Quick Actions (30 seconds)
- [ ] Click **Apollo.io** under Import → Navigates
- [ ] Go back
- [ ] Click **Quick Form** → Opens add lead form
- [ ] Go back
- [ ] Click **CRM Sync** under Configure → Opens integrations

---

## Expected Results

### All Toast Notifications Work:
- ✅ "Lead created successfully!" (green)
- ✅ "Lead enrichment started..." (blue)
- ✅ "Lead enriched successfully!" (green)
- ✅ "Synced to CRM successfully!" (green)
- ✅ "Lead assigned" (green)
- ✅ "Lead deleted" (green)

### All Dropdowns Work:
- ✅ Notifications dropdown
- ✅ Profile menu
- ✅ Lead actions dropdown (...)
- ✅ Search bar toggle

### All Modals Work:
- ✅ Company Preview Modal

### All Navigation Works:
- ✅ Stats cards navigate with filters
- ✅ Lead names navigate to detail
- ✅ Quick actions navigate correctly
- ✅ AI insights links work

---

## Visual Checks

### Hover States:
- All buttons have hover effects
- Cards have border color changes on hover
- Dropdowns highlight on hover

### Active States:
- Clicked buttons show proper feedback
- Disabled "Auto-added" button is gray
- Red notification dot appears

### Responsive Behavior:
- Search bar expands smoothly
- Dropdowns position correctly
- Modal centers properly

---

## Common Issues & Solutions

### Issue: Toast doesn't appear
**Solution**: Check that ToastContext is properly imported

### Issue: Navigation doesn't work
**Solution**: Verify React Router is set up correctly

### Issue: Dropdown stays open
**Solution**: Click outside or press ESC to close

### Issue: Modal doesn't show
**Solution**: Check z-index and overlay positioning

---

## Browser Testing

Test in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari

All interactions should work consistently across browsers.

---

## Performance Notes

- No lag on button clicks
- Smooth transitions on all elements
- Toast notifications appear instantly
- Modals open/close smoothly
- Navigation is immediate

---

## Success Criteria

✅ **All 50+ interactive elements work**
✅ **6 different toast notifications display**
✅ **4 dropdowns open/close properly**
✅ **1 modal functions correctly**
✅ **20+ navigation targets work**
✅ **All hover states visible**
✅ **No console errors**

---

**Test Duration**: 5 minutes
**Interactive Elements**: 50+
**Navigation Targets**: 20+
**Toast Notifications**: 6 types
