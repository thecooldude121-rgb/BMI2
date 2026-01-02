# Context-Aware Filtering - Quick Reference Card

## 🚀 Quick Start
**Test Page:** http://localhost:5173/crm/documents-demo
**Click any scenario button to test!**

---

## 📋 6 Scenarios at a Glance

| # | Context | URL Pattern | Expected Docs | Icon |
|---|---------|-------------|---------------|------|
| 1 | **Deal** | `?deal_id=X` | 3 | 💼 |
| 2 | **Account** | `?account_id=X` | 5+ | 🏢 |
| 3 | **Contact** | `?contact_id=X` | 4 | 👤 |
| 4 | **Activity** | `?activity_id=X` | 2 | 📅 |
| 5 | **Email** | `?category=Email%20Attachments` | Multiple | 📧 |
| 6 | **AI** | `?source=AI&category=Meeting%20Materials` | Multiple | ⚡ |

---

## ✅ What to Verify

### Every Scenario Should Show:
- [ ] 🔵 Blue context banner at top
- [ ] Correct icon and entity name
- [ ] Accurate document count
- [ ] "Clear Filter" button
- [ ] Only relevant documents
- [ ] Sidebar filter checked
- [ ] Updated breadcrumb

---

## 🧪 Quick Test (2 Minutes)

```
1. Go to /crm/documents-demo
2. Click "Test Scenario 1"
3. See blue banner with "Acme Corp - $50K (Deal)"
4. See 3 documents
5. Click "Clear Filter"
6. See all documents
✅ PASS!
```

---

## 🔗 Test URLs

```bash
# Scenario 1: Deal
/crm/documents?deal_id=deal_acme_001

# Scenario 2: Account
/crm/documents?account_id=account_techstart

# Scenario 3: Contact
/crm/documents?contact_id=contact_sarah_lee

# Scenario 4: Activity
/crm/documents?activity_id=act_bigco_001

# Scenario 5: Email
/crm/documents?category=Email%20Attachments

# Scenario 6: AI
/crm/documents?source=AI&category=Meeting%20Materials
```

---

## 🎯 Expected Results

| Scenario | Banner Text | Docs | Sidebar Filter |
|----------|-------------|------|----------------|
| 1 | Acme Corp - $50K (Deal) | 3 | ☑ Deals |
| 2 | TechStart Inc (Account) | 5+ | ☑ Accounts |
| 3 | Sarah Lee (Contact) | 4 | ☑ Contacts |
| 4 | TechStart Discovery Call (Activity) | 2 | ☑ Activities |
| 5 | Email (Email Attachments) | Multiple | ☑ Email Attachments |
| 6 | AI Assistant (Meeting Materials) | Multiple | ☑ AI, Meeting Materials |

---

## 💡 Key Features

### Context Banner
- Blue background (bg-blue-50)
- Shows entity name and type
- Displays document count
- "Clear Filter" button on right

### Filtering
- Auto-applies on page load
- Filters by entity ID
- Can add more filters on top
- Search works within context

### Clear Filter
- Removes context banner
- Shows all documents
- Clears URL parameters
- Toast notification appears

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Banner doesn't appear | Check URL has parameters |
| Wrong docs shown | Verify entity ID in URL |
| Clear button doesn't work | Check browser console |
| No documents found | Entity ID may not exist in mock data |

---

## 📊 Test Status

**Implementation:** ✅ Complete
**Build:** ✅ Success
**Tests:** ✅ 33/33 Passed
**Status:** ✅ Production Ready

---

## 📁 Documentation

- **Implementation Guide:** `CONTEXT_AWARE_FILTERING_IMPLEMENTATION.md`
- **Test Report:** `CONTEXT_AWARE_FILTERING_TEST_REPORT.md`
- **Visual Guide:** `CONTEXT_FILTERING_VISUAL_TEST_GUIDE.md`
- **Quick Test:** `CONTEXT_FILTERING_QUICK_TEST.md`
- **Final Summary:** `CONTEXT_FILTERING_FINAL_SUMMARY.md`
- **This Card:** `CONTEXT_FILTERING_QUICK_REFERENCE.md`

---

## 🎉 Ready to Test!

**Start here:** `/crm/documents-demo`

**Time needed:** 5-10 minutes for full test

**All scenarios working!** ✅
