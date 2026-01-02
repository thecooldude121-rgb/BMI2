# MEETINGS MODULE - INTERACTION VERIFICATION CHECKLIST

**Focus: All clickable elements and their expected behaviors**

---

## 📋 SCREEN 13.1 - MEETINGS LIST PAGE

### ✅ TOP HEADER ACTIONS

```
Action                          Expected Result                                   Verified
────────────────────────────────────────────────────────────────────────────────────────
[+ Schedule Meeting]            Opens ScheduleMeetingModal                        [ ]
[⋮ More Options]                Shows dropdown with 4 options                     [ ]
  → Import from Calendar        Toast: "Importing from calendar..."               [ ]
  → Export to CSV               Toast: "Exporting meetings..."                    [ ]
  → Meeting Templates           Toast: "Opening templates..."                     [ ]
  → Settings                    Toast: "Opening settings..."                      [ ]
```

### ✅ STATISTICS CARDS

```
Card                            Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
All Meetings (48)               Shows all meetings                                [ ]
This Week (12)                  Filters to this week's meetings                   [ ]
Recorded (38)                   Shows only recorded meetings                      [ ]
Live Now (2)                    Shows live meetings only                          [ ]
AI Processed (35)               Shows AI-processed meetings                       [ ]
This Week Summary               Filters to current week                           [ ]
```

### ✅ AI INSIGHTS SECTION

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
High-value insight card         Navigate to /crm/activities                       [ ]
Follow-up insight card          Navigate to /crm/reports                          [ ]
[Create Tasks for All]          Opens BulkTaskCreatorModal                        [ ]
```

### ✅ FILTERS & SEARCH

```
Element                         Action                                            Verified
────────────────────────────────────────────────────────────────────────────────────────
Search input                    Type → filters meetings in real-time              [ ]
Time Range dropdown             Change → filters by time range                    [ ]
Status dropdown                 Change → filters by status                        [ ]
Type dropdown                   Change → filters by meeting type                  [ ]
AI Status dropdown              Change → filters by AI processing status          [ ]
[Clear All] button              Click → resets all filters                        [ ]
Filter count badge              Displays number of active filters                 [ ]
```

### ✅ MEETING CARD - PRIMARY ACTIONS

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
Meeting card (anywhere)         Navigate to meeting detail page                   [ ]
[▶ Join] button                 Toast: "Joining meeting..." + opens link          [ ]
[⋮ More] menu                   Shows context menu dropdown                       [ ]
  → Edit                        Navigate to /crm/meetings/[id]/edit               [ ]
  → Share                       Toast: "Opening share options..."                 [ ]
  → Download Recording          Toast: "Downloading recording..."                 [ ]
  → View Transcript             Navigate to /crm/meetings/[id]/transcript         [ ]
  → Delete                      Toast: "Meeting deleted"                          [ ]
```

### ✅ MEETING CARD - METADATA

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
Attendee avatar                 Navigate to /crm/contacts/[id]                    [ ]
Attendee name                   Navigate to /crm/contacts/[id]                    [ ]
Deal chip                       Navigate to /crm/deals/[id]                       [ ]
Account chip                    Navigate to /crm/accounts/[id]                    [ ]
```

### ✅ MEETING CARD - SPECIAL ACTIONS

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
[Get Directions]                Opens Google Maps in new tab                      [ ]
[Add to Calendar]               Downloads .ics calendar file                      [ ]
Right-click on card             Shows custom context menu                         [ ]
```

### ✅ MEETING CARD - AI FEATURES

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
AI Score badge                  Hover → shows score breakdown                     [ ]
[📊 View Insights]              Navigate to meeting detail page                   [ ]
[📝 Action Items (N)]           Opens ActionItemsPanel modal                      [ ]
[🎙️ View Recording]            Opens RecordingPlayerModal                        [ ]
[📄 Transcript]                 Navigate to /crm/meetings/[id]/transcript         [ ]
[🔗 HRMS Integration]           Opens HRMSConnectionModal                         [ ]
[📝 Prep Notes]                 Opens PrepNotesModal (upcoming meetings)          [ ]
```

---

## 📋 SCREEN 13.2 - MEETING DETAIL PAGE

### ✅ HERO SECTION

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
[← Back]                        Navigate to /crm/meetings                         [ ]
[▶ Play Recording]              Scrolls to player + starts playback               [ ]
[📄 View Transcript]            Navigate to transcript viewer page                [ ]
[🔗 Share]                      Opens share modal                                 [ ]
[⬇ Download] dropdown           Shows menu with 4 options                         [ ]
  → Recording (MP4)             Toast: "Downloading recording (125 MB)..."        [ ]
  → Transcript (PDF)            Toast: "Downloading transcript (245 KB)..."       [ ]
  → AI Summary (PDF)            Toast: "Downloading AI summary (85 KB)..."        [ ]
  → All (ZIP)                   Toast: "Downloading all files (126 MB)..."        [ ]
[✏️ Edit]                       Opens edit meeting modal                          [ ]
[⋮ More] dropdown               Shows menu with 6 options                         [ ]
  → Duplicate Meeting           Toast: "Duplicating meeting..."                   [ ]
  → Save as Template            Toast: "Saving as template..."                    [ ]
  → Add to Calendar             Toast: "Adding to calendar..."                    [ ]
  → Email Summary               Toast: "Opening email composer..."                [ ]
  → Archive Meeting             Toast: "Meeting archived"                         [ ]
  → Delete Meeting              Toast: "Meeting deleted"                          [ ]
[🗑️ Delete]                    Shows delete confirmation modal                   [ ]
```

### ✅ ATTENDEES SECTION

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
Attendee card                   Navigate to /crm/contacts/[id]                    [ ]
[📧 Email]                      Opens email composer modal                        [ ]
[📞 Schedule Call]              Opens schedule call modal                         [ ]
[📊 Speaking Analysis]          Opens speaking analysis modal                     [ ]
[😊 Sentiment Timeline]         Opens sentiment timeline modal                    [ ]
```

### ✅ LINKED RECORDS

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
Deal card (anywhere)            Navigate to /crm/deals/deal_acme_001              [ ]
[View Deal Details →]           Navigate to /crm/deals/deal_acme_001              [ ]
Account card (anywhere)         Navigate to /crm/accounts/account_acme            [ ]
[View Account Details →]        Navigate to /crm/accounts/account_acme            [ ]
Contact card (anywhere)         Navigate to /crm/contacts/[id]                    [ ]
[View Contact Details →]        Navigate to /crm/contacts/[id]                    [ ]
```

### ✅ RELATED DOCUMENTS

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
Transcript [View]               Navigate to transcript viewer                     [ ]
Transcript [Download]           Toast: "Downloading transcript (245 KB)..."       [ ]
Recording [Play]                Scrolls to player + starts playback               [ ]
Recording [Download]            Toast: "Downloading recording (125 MB)..."        [ ]
Proposal [View]                 Navigate to /crm/documents/doc_acme_proposal_v2   [ ]
Proposal [Download]             Toast: "Downloading recording (125 MB)..."        [ ]
[View All Documents →]          Navigate to /crm/documents?meeting=[id]           [ ]
```

### ✅ AI SUMMARY SECTION

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
Key point timestamp link        Scrolls to player + jumps to timestamp            [ ]
[Review Changes]                Opens review changes modal                        [ ]
[Undo All Updates]              Toast: "All updates undone successfully"          [ ]
[Add to Agenda] (per point)     Toast: "Added to next meeting agenda"             [ ]
```

### ✅ ACTION ITEMS SECTION

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
Checkbox (on item)              Toggles completion state                          [ ]
[+ Create Task]                 Opens create task modal                           [ ]
[View All Tasks →]              Toast: "Opening task management..."               [ ]
```

### ✅ RECORDING PLAYER

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
[▶/⏸ Play/Pause]                Toggles playback state                            [ ]
Progress bar                    Click → jumps to that timestamp                   [ ]
Key moment chip                 Click → jumps to that timestamp                   [ ]
[⚙️ Settings]                   Opens recording settings modal                    [ ]
[⬇ Download]                    Toast: "Downloading recording..."                 [ ]
[🔗 Copy Link]                  Toast: "Recording link copied"                    [ ]
```

### ✅ MEETING NOTES

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
[+ Add Note]                    Opens add note modal                              [ ]
[✏️ Edit] (on note)             Enables inline editing mode                       [ ]
[Save] (editing mode)           Saves note + toast: "Note updated successfully"   [ ]
[Cancel] (editing mode)         Cancels edit + reverts changes                    [ ]
[🗑️ Delete] (on note)          Shows delete confirmation modal                   [ ]
Confirm delete                  Deletes note + toast: "Note deleted successfully" [ ]
```

### ✅ QUICK ACTIONS

```
Element                         Click Action                                      Verified
────────────────────────────────────────────────────────────────────────────────────────
[📧 Email Attendees]            Opens email composer modal                        [ ]
[🗓️ Schedule Follow-up]        Opens schedule meeting modal                      [ ]
[📤 Share Recording]            Opens share modal                                 [ ]
[📊 Add to Report]              Opens report builder modal                        [ ]
[🗓️ Reschedule]                Opens edit modal (focused on date/time)           [ ]
[📋 Export Summary]             Opens export options modal                        [ ]
```

---

## 📦 MODAL VERIFICATION

### ✅ SCREEN 13.1 MODALS

```
Modal                           Open Works    Close Works    Submit Works    Verified
──────────────────────────────────────────────────────────────────────────────────────
ScheduleMeetingModal            [ ]           [ ]            [ ]             [ ]
RecordingPlayerModal            [ ]           [ ]            N/A             [ ]
ActionItemsPanel                [ ]           [ ]            [ ]             [ ]
HRMSConnectionModal             [ ]           [ ]            [ ]             [ ]
BulkTaskCreatorModal            [ ]           [ ]            [ ]             [ ]
PrepNotesModal                  [ ]           [ ]            [ ]             [ ]
```

### ✅ SCREEN 13.2 MODALS

```
Modal                           Open Works    Close Works    Submit Works    Verified
──────────────────────────────────────────────────────────────────────────────────────
Edit Meeting Modal              [ ]           [ ]            [ ]             [ ]
Share Modal                     [ ]           [ ]            [ ]             [ ]
Delete Confirmation             [ ]           [ ]            [ ]             [ ]
Email Attendee Modal            [ ]           [ ]            [ ]             [ ]
Schedule Call Modal             [ ]           [ ]            [ ]             [ ]
Create Task Modal               [ ]           [ ]            [ ]             [ ]
Review Changes Modal            [ ]           [ ]            [ ]             [ ]
Speaking Analysis Modal         [ ]           [ ]            N/A             [ ]
Sentiment Timeline Modal        [ ]           [ ]            N/A             [ ]
Recording Settings Modal        [ ]           [ ]            [ ]             [ ]
Add Note Modal                  [ ]           [ ]            [ ]             [ ]
Delete Note Modal               [ ]           [ ]            [ ]             [ ]
Email Attendees Modal           [ ]           [ ]            [ ]             [ ]
Schedule Follow-up Modal        [ ]           [ ]            [ ]             [ ]
Add to Report Modal             [ ]           [ ]            [ ]             [ ]
Export Summary Modal            [ ]           [ ]            [ ]             [ ]
```

**Modal Close Methods:**
- [ ] Click X button → Closes
- [ ] Click outside modal → Closes
- [ ] Press Escape key → Closes
- [ ] Click Cancel button → Closes

---

## 🧪 TOAST NOTIFICATIONS

### ✅ SUCCESS TOASTS

```
Action                          Expected Toast                                    Verified
────────────────────────────────────────────────────────────────────────────────────────
Meeting created                 "Meeting scheduled successfully"                  [ ]
Meeting updated                 "Meeting updated successfully"                    [ ]
Meeting deleted                 "Meeting deleted"                                 [ ]
Note added                      "Note added successfully"                         [ ]
Note updated                    "Note updated successfully"                       [ ]
Note deleted                    "Note deleted successfully"                       [ ]
Link copied                     "Link copied to clipboard" / "Recording link..."  [ ]
Email sent                      "Email sent to all attendees"                     [ ]
```

### ✅ INFO TOASTS

```
Action                          Expected Toast                                    Verified
────────────────────────────────────────────────────────────────────────────────────────
Download recording              "Downloading recording (125 MB)..."               [ ]
Download transcript             "Downloading transcript (245 KB)..."              [ ]
Download summary                "Downloading AI summary (85 KB)..."               [ ]
Download all                    "Downloading all files (126 MB)..."               [ ]
Export summary                  "Exporting summary as PDF..." / "...as DOCX..."   [ ]
Opening modal                   "Opening [feature name]..."                       [ ]
Loading recording               "Loading recording..."                            [ ]
```

---

## 🚀 NAVIGATION TESTING

### ✅ INTERNAL NAVIGATION

```
From                            To                                                Verified
────────────────────────────────────────────────────────────────────────────────────────
Meetings List                   Meeting Detail                                    [ ]
Meeting Detail                  Meetings List (back button)                       [ ]
Meeting Card → Attendee         Contact Detail Page                               [ ]
Meeting Card → Deal             Deal Detail Page                                  [ ]
Meeting Card → Account          Account Detail Page                               [ ]
Meeting Detail → Contact        Contact Detail Page                               [ ]
Meeting Detail → Deal           Deal Detail Page                                  [ ]
Meeting Detail → Account        Account Detail Page                               [ ]
Meeting Detail → Transcript     Transcript Viewer Page                            [ ]
Meeting Detail → Document       Document Detail Page                              [ ]
Meeting Detail → Docs Library   Documents Library (filtered)                      [ ]
AI Insight Card                 Activities Page                                   [ ]
AI Insight Card                 Reports Page                                      [ ]
```

### ✅ EXTERNAL NAVIGATION

```
Action                          Opens                                             Verified
────────────────────────────────────────────────────────────────────────────────────────
Get Directions                  Google Maps (new tab)                             [ ]
Add to Calendar                 Downloads .ics file                               [ ]
Join Meeting (video)            Opens Zoom/Teams link                             [ ]
```

---

## 🎯 EDGE CASES

### ✅ DATA SCENARIOS

```
Scenario                        Expected Behavior                                 Verified
────────────────────────────────────────────────────────────────────────────────────────
Empty meetings list             Shows empty state with CTA                        [ ]
No search results               Shows "No meetings found"                         [ ]
Meeting without recording       Recording buttons disabled/hidden                 [ ]
Meeting without transcript      Transcript button disabled/hidden                 [ ]
Meeting without AI processing   Shows "Processing..." status                      [ ]
Meeting without deal            Deal section not shown                            [ ]
Meeting without attendees       Attendee section shows empty state                [ ]
Live meeting                    Shows "Live Now" badge + red border               [ ]
Past meeting                    Shows completed status                            [ ]
Upcoming meeting                Shows prep notes option                           [ ]
No notes                        Shows empty notes section                         [ ]
```

### ✅ INTERACTION EDGE CASES

```
Scenario                        Expected Behavior                                 Verified
────────────────────────────────────────────────────────────────────────────────────────
Click outside modal             Modal closes gracefully                           [ ]
Press Escape                    Modal closes                                      [ ]
Double-click button             Prevents duplicate actions                        [ ]
Rapid filter changes            Debounced properly                                [ ]
Search with no input            Shows all meetings                                [ ]
Multiple filters active         Shows filter count badge                          [ ]
Clear all filters               Resets to default view                            [ ]
Navigate after delete           Returns to list page                              [ ]
Edit during playback            Player continues playing                          [ ]
Add note while editing          Saves current edit first                          [ ]
```

---

## ✅ QUICK PASS/FAIL

**PASS CRITERIA:** All checkboxes above are checked ✅

**FAIL CRITERIA:** Any checkbox is unchecked ⚠️

**CRITICAL PATH (Must Pass):**
- [ ] Meeting card click → Navigate to detail
- [ ] Play recording button → Starts playback
- [ ] Add note → Note appears
- [ ] All modals open and close
- [ ] All navigation links work

---

**Test Completed By:** _________________
**Date:** _________________
**Overall Status:** ⬜ PASS  ⬜ FAIL
**Notes:** _________________________________
