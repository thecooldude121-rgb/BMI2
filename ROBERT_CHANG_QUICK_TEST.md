# Robert Chang - 5-Minute Quick Test

## Access
Navigate to: `/lead-generation/leads/lead_005/enrichment`

---

## 1. VISUAL VERIFICATION (1 min)

### Check Color Coding:
- [ ] Red failure banner at top
- [ ] Red data source cards (both Apollo & ZoomInfo)
- [ ] Green cards for 3 available fields (Email, Company Name, Job Title)
- [ ] Gray cards for 17 missing fields

### Check Counts:
- [ ] Hero: 65/100 score with yellow dots
- [ ] Status: ❌ No enrichment data found
- [ ] Contact: (2/5 fields)
- [ ] Company: (2/8 fields)
- [ ] Professional: (1/7 fields)
- [ ] Data Sources: Both show "0 fields enriched"
- [ ] History: 1 failed entry

---

## 2. HERO ACTIONS (30 sec)

### Try Again:
- [ ] Click "🔄 Try Again"
- [ ] Toast: "🔄 Retrying enrichment..."
- [ ] After 2s: "❌ Still no matching records found"

### Add Manually:
- [ ] Click "✏️ Add Manually"
- [ ] Toast: "✏️ Opening manual entry form..."

### Configure Search:
- [ ] Click "⚙️ Configure Search"
- [ ] Toast: "⚙️ Opening search configuration..."

---

## 3. EDIT AVAILABLE FIELDS (1 min)

### Edit Email:
1. [ ] Find "📧 Email" card (green)
2. [ ] Click [✏️ Edit]
3. [ ] Card turns blue with "✏️ Editing" badge
4. [ ] Input shows "robert@startco.io"
5. [ ] Change to "robert.chang@startco.io"
6. [ ] Click [Save]
7. [ ] Toast: "✓ Field saved"
8. [ ] Card turns green

### Edit Company Name:
1. [ ] Find "🏢 Company Name" card
2. [ ] Click [✏️ Edit]
3. [ ] Change value
4. [ ] Click [Cancel]
5. [ ] Card returns to original state

---

## 4. ADD MISSING FIELDS (1 min)

### Add Direct Phone:
1. [ ] Find "📱 Direct Phone" card (gray)
2. [ ] Shows "❌ Missing" badge
3. [ ] Click [✏️ Add Manually]
4. [ ] Card turns blue
5. [ ] Type "+1 (650) 555-0100"
6. [ ] Click [Save]
7. [ ] Card turns green

### Search LinkedIn:
1. [ ] Find "💼 LinkedIn Profile" card
2. [ ] Click [🔍 Search LinkedIn]
3. [ ] New tab opens to LinkedIn search
4. [ ] URL contains "Robert Chang CEO StartCo"

---

## 5. DATA SOURCE RETRY (30 sec)

### Apollo.io:
- [ ] Find Apollo card (red)
- [ ] Shows "❌ No match found"
- [ ] Click [🔍 Retry Search]
- [ ] Toast: "🔄 Retrying enrichment..."

### ZoomInfo:
- [ ] Find ZoomInfo card (red)
- [ ] Shows "❌ No match found"
- [ ] Shows "0 fields enriched"
- [ ] Click [🔍 Retry Search]

---

## 6. ALTERNATIVE OPTIONS (1 min)

### Option 1 - LinkedIn Search:
- [ ] Shows "⭐ Recommended" badge
- [ ] Click [Search LinkedIn]
- [ ] Opens LinkedIn in new tab

### Option 2 - Website Scraping:
- [ ] Shows "⭐ Recommended" badge
- [ ] Has 2 buttons: [Visit Website] [Scrape Data]
- [ ] Click [Visit Website]

### Option 3 - Manual Entry:
- [ ] Click [Start Manual Entry]
- [ ] Toast: "✏️ Opening manual entry form..."

### Option 4 - Email Verification:
- [ ] Click [Verify Email]
- [ ] Toast: "📧 Verifying email address..."
- [ ] After 2s: "✓ Email verified: robert@startco.io is valid"

---

## 7. ENRICHMENT HISTORY (30 sec)

### Check Failed Entry:
- [ ] Shows "❌" icon
- [ ] Badge: "Failed"
- [ ] Red background
- [ ] Message: "Enrichment failed - No matching records"
- [ ] Sources: Apollo.io (0 matches), ZoomInfo (0 matches)
- [ ] Duration: 2.8s
- [ ] Reason displayed

### Actions:
- [ ] Click [View Search Details →]
- [ ] Click [🔄 Retry]
- [ ] Toast appears

---

## EXPECTED STATES

### Available Fields (GREEN):
1. Email: robert@startco.io
2. Company Name: StartCo
3. Job Title: CEO

### Missing Fields (GRAY):
1. Direct Phone
2. LinkedIn Profile (with LinkedIn search)
3. Mobile Phone
4. Office Location
5. Company Website (with web search)
6. Company Size
7. Annual Revenue
8. Industry
9. Founded Year
10. Total Funding
11. International Presence
12. Seniority Level
13. Department
14. Years in Role
15. Education
16. Skills & Expertise
17. Previous Companies

### Data Sources (RED):
- Apollo.io: 0 fields, No match
- ZoomInfo: 0 fields, No match

---

## PASS CRITERIA

✅ All visual elements display correctly
✅ Color coding is consistent (red=failed, green=available, gray=missing, blue=editing)
✅ All buttons trigger appropriate toasts
✅ Edit mode works for available fields
✅ Add mode works for missing fields
✅ LinkedIn search opens new tab
✅ Email verification shows success
✅ Data source retry buttons work
✅ History displays failed status
✅ Alternative options all clickable

---

## COMPARISON TEST

**Quick comparison with other leads:**

1. **Navigate to John Smith** (lead_002)
   - [ ] All fields green
   - [ ] High confidence badges

2. **Navigate to Emily Chen** (lead_004)
   - [ ] Orange warning banner
   - [ ] 5 low confidence fields

3. **Return to Robert Chang** (lead_005)
   - [ ] Red failure banner
   - [ ] Only 3 available fields
   - [ ] Clear "no data" messaging

---

Time: ~5 minutes
Status: ✅ Complete
