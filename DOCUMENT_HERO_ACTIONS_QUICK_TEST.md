# Document Hero Actions - Quick Test Guide

## Quick Navigation
Go to: `/crm/documents/doc_acme_proposal_v2` or `/crm/documents/doc_techstart_contract_v1`

---

## 5-Minute Test Sequence

### Test 1: VIEW (10 seconds)
1. Click **"View"** button (Eye icon)
2. **Expected**:
   - Toast: "Opening PDF viewer..."
   - New tab opens with document
   - Activity log shows "Alex Rodriguez viewed document"
   - View count increments

---

### Test 2: DOWNLOAD (10 seconds)
1. Click **"Download"** button
2. **Expected**:
   - Toast: "Downloading ACME Proposal - Q1 2025.pdf..."
   - Browser downloads file
   - Activity log shows "Alex Rodriguez downloaded document"
   - Download count increments in Details card

---

### Test 3: SHARE (20 seconds)
1. Click **"Share"** button
2. Select "Emily Davis (emily.davis@bmi.com)"
3. Choose visibility: "Team"
4. Add message: "Please review this"
5. Click "Share Doc"
6. **Expected**:
   - Modal closes
   - Toast: "Document shared successfully"
   - Emily Davis appears in "Shared With" section
   - Activity log shows "Alex Rodriguez shared with Emily Davis"

---

### Test 4: EDIT (10 seconds)
1. Click **"Edit"** button
2. **Expected**:
   - Toast: "Edit mode not available for PDF files" (error/red)
   - No editor opens

**Note**: All mock documents are PDFs, so this always shows error message.

---

### Test 5: DELETE (15 seconds)
1. Click **"Delete"** button (red styling)
2. Confirmation dialog appears
3. Click "OK"
4. **Expected**:
   - Toast: "Document deleted successfully"
   - After 1.5 seconds: Redirects to `/crm/documents`

**Warning**: This will navigate away from the page!

---

## Activity Log Verification

After running tests 1-3, check Activity Timeline tab:

**Should Show** (newest first):
1. "Alex Rodriguez shared with Emily Davis" - Purple icon
2. "Alex Rodriguez downloaded document" - Green icon
3. "Alex Rodriguez viewed document" - Blue icon

---

## Counter Verification

Check Details Card (right sidebar):

**Before Tests**:
- Views: 8
- Downloads: 3

**After View + Download**:
- Views: 9
- Downloads: 4

---

## All Buttons Location

**Hero Section** (top of page, below breadcrumb):
```
[View] [Download] [Share] [Edit] [Delete]
```

**Alternative Locations**:
- "Open PDF Viewer" button (below hero) = Same as View
- Version history View/Download buttons = Same handlers
- Preview pane buttons = Same handlers

---

## User Data

**Current User**: Alex Rodriguez (appears in all activity logs)

**Team Members** (for sharing):
- Emily Davis (emily.davis@bmi.com)
- David Wilson (david.wilson@bmi.com)
- Lisa Brown (lisa.brown@bmi.com)

---

## Quick Reset

To reset and test again:
1. Navigate back to document detail page
2. All counters will reset to default values
3. Activity log will reset to initial state
4. Shared users will reset (except for demo data)

---

## Expected Toast Messages

| Action | Toast Message | Type |
|--------|--------------|------|
| View | "Opening PDF viewer..." | Success (Green) |
| Download | "Downloading [filename]..." | Success (Green) |
| Share | "Document shared successfully" | Success (Green) |
| Edit (PDF) | "Edit mode not available for PDF files" | Error (Red) |
| Delete | "Document deleted successfully" | Success (Green) |

---

## Common Issues

**View button doesn't work**:
- Check console for errors
- Verify file_url exists in document object

**Download doesn't start**:
- Check browser popup blocker
- Verify file_url is accessible

**Share modal doesn't open**:
- Check showShareModal state
- Verify handleShare is connected

**Delete doesn't redirect**:
- Wait full 1.5 seconds
- Check navigate function is working
- Verify route `/crm/documents` exists
