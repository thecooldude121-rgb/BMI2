# Document Detail View - 5 Minute Quick Test Guide

**URL**: `/crm/documents/doc_acme_proposal_v2`

---

## 🎯 QUICK TEST CHECKLIST (5 Minutes)

### 1. PAGE LOAD (10 seconds)
- [ ] Page loads without errors
- [ ] Title shows: "Acme_Corp_Proposal_v2.pdf"
- [ ] Breadcrumb: Dashboard > Documents > Acme_Corp_Proposal_v2.pdf
- [ ] Left and right columns visible

---

### 2. BREADCRUMBS (20 seconds)
- [ ] Click "Dashboard" → Toast: "Navigating to Dashboard" → Wait → Navigates
- [ ] Go back to document page
- [ ] Click "Documents" → Toast: "Returning to Documents Library" → Wait → Navigates
- [ ] Go back to document page

---

### 3. HERO BUTTONS (30 seconds)
- [ ] Click "View" → Toast: "Opening PDF viewer..." → New tab opens
- [ ] Click "Download" → Toast: "Downloading..." → Download starts
- [ ] Click "Share" → Modal opens
- [ ] Click "Cancel" on modal
- [ ] Click "Edit" → Toast (error): "Edit mode not available for PDF files"
- [ ] DON'T TEST DELETE (destructive)

---

### 4. RELATED RECORDS (20 seconds)
- [ ] Hover over Deal card → Border turns blue, card lifts
- [ ] Click Deal card → Toast: "Navigating to Deal: Acme Corp - Enterprise Plan"
- [ ] Go back
- [ ] Hover over Account card → Same effect
- [ ] Hover over Contact card → Same effect

---

### 5. DESCRIPTION (20 seconds)
- [ ] Click "Edit" in Description section
- [ ] Textarea appears with Save/Cancel buttons
- [ ] Type something new
- [ ] Click "Save" → Toast: "Description updated successfully"
- [ ] Text updates and returns to view mode

---

### 6. TAGS (30 seconds)
- [ ] Click in tag input (leave empty) → Click "Add"
- [ ] Toast (error): "Please enter a tag name"
- [ ] Type "proposal" (existing tag) → Click "Add"
- [ ] Toast (error): "Tag already exists"
- [ ] Type "urgent" → Click "Add"
- [ ] Toast: "Tag 'urgent' added" → Tag appears
- [ ] Click X on "urgent" tag
- [ ] Toast: "Tag 'urgent' removed" → Tag disappears

---

### 7. COMMENTS (40 seconds)
- [ ] Scroll to Comments section
- [ ] Click "Post Comment" (empty) → Toast (error): "Please enter a comment"
- [ ] Type: "This looks great!"
- [ ] Click "Post Comment" → Toast: "Comment posted successfully"
- [ ] Comment appears at top with "Alex Rodriguez" and current time
- [ ] Check Activity Log → New entry: "Alex Rodriguez commented on document"

---

### 8. VERSION HISTORY (20 seconds)
- [ ] Scroll to Version History
- [ ] Click "Upload New Version" → Toast: "File upload feature coming soon"
- [ ] Find Version 1 (not current)
- [ ] Click "Restore" → Confirmation dialog appears
- [ ] Click "Cancel" → Dialog closes
- [ ] (Optional) Click "Restore" again → Confirm → Toast: "Restored to version 1 as version 3"

---

### 9. SHARED WITH (30 seconds)
- [ ] Scroll to Shared With section
- [ ] Click "+ Add" → Share modal opens
- [ ] Select "David Wilson" from dropdown
- [ ] Select "Team (Sales team)"
- [ ] Click "Share Document" → Toast: "Document shared successfully"
- [ ] David Wilson appears in Shared With list
- [ ] Click "Remove" next to David → Confirmation appears
- [ ] Click "Cancel"
- [ ] (Optional) Remove for real

---

### 10. QUICK ACTIONS (30 seconds)
- [ ] Scroll to Quick Actions
- [ ] Click "Send via Email" → Toast: "Email composer feature coming soon"
- [ ] Click "Attach to Activity" → Toast: "Activity selector feature coming soon"
- [ ] Click "Create New Version" → Toast: "File upload feature coming soon"
- [ ] DON'T TEST "Move to Archive" (destructive)

---

### 11. USER PROFILE (10 seconds)
- [ ] Scroll to Details section
- [ ] Find "Uploaded By: Alex Rodriguez"
- [ ] Click on "Alex Rodriguez"
- [ ] Toast: "Navigating to User Profile: Alex Rodriguez"

---

### 12. SPECIAL BADGES (20 seconds)
**Test with**: `/crm/documents/doc_techstart_contract_v1`
- [ ] Navigate to TechStart Contract document
- [ ] Find green "HRMS Connected" badge
- [ ] Hover over badge → Tooltip appears
- [ ] Cursor changes to help cursor

**Test with**: `/crm/documents/doc_bigco_transcript`
- [ ] Navigate to BigCo Transcript document
- [ ] Find purple "AI Generated" badge
- [ ] Hover over badge → Tooltip appears

---

## ✅ QUICK PASS/FAIL

**Total Time**: ~5 minutes
**Tests**: 50+ interactions

| Section | Status | Notes |
|---------|--------|-------|
| Page Load | ⬜ | |
| Breadcrumbs | ⬜ | |
| Hero Buttons | ⬜ | |
| Related Records | ⬜ | |
| Description | ⬜ | |
| Tags | ⬜ | |
| Comments | ⬜ | |
| Version History | ⬜ | |
| Shared With | ⬜ | |
| Quick Actions | ⬜ | |
| User Profile | ⬜ | |
| Special Badges | ⬜ | |

---

## 🐛 ISSUES FOUND

1. **Issue**: ___________________________
   - **Section**: ___________________________
   - **Expected**: ___________________________
   - **Actual**: ___________________________

2. **Issue**: ___________________________
   - **Section**: ___________________________
   - **Expected**: ___________________________
   - **Actual**: ___________________________

---

## ✅ SIGN-OFF

- [ ] All critical features work
- [ ] No console errors
- [ ] Toast messages appear correctly
- [ ] Navigation works smoothly
- [ ] Interactions feel responsive

**Tester**: _________________
**Date**: _________________
**Status**: PASS ⬜ / FAIL ⬜

---

## 🚀 NEXT STEPS IF PASS

1. Test on different browsers
2. Test on mobile/tablet
3. Test with real database data
4. Performance testing
5. Accessibility testing
