# Field-Level Actions - Quick Test Guide

## ⚡ 2-Minute Complete Test

### URL
```
http://localhost:5173/demo/field-level-actions
```

---

## 🎬 Test Sequence

### **Step 1: Wait (20 seconds)**
- Page loads
- Fields start enriching automatically
- Watch progress bars animate
- See fields turn green when complete

### **Step 2: Verify Field (10 seconds)**
```
1. Find "Email" field (✅ Enriched)
2. Hover over the field
3. Action buttons appear: [✅ Verify] [📜 History] [❌ Reject]
4. Click "✅ Verify"
5. Button changes to green "Verified" badge
6. Activity log shows: "✅ Verified field 'email'"
```

### **Step 3: View History (20 seconds)**
```
1. Hover over "Direct Phone" field
2. Click "📜 History" button
3. Modal opens showing timeline:

   ✏️ Manual Edit (2 hours ago) ✅ Verified
   +1 (415) 234-9999 → +1 (415) 234-5678
   Reason: Verified directly with contact
   Note: "Called Sarah, she confirmed correct number"

   🔄 API Enrichment (4 hours ago)
   +1 (415) 123-4567 → +1 (415) 234-9999
   Confidence: 85%

   🔄 API Enrichment (2 days ago)
   (Empty) → +1 (415) 123-4567
   Confidence: 82%

   ✨ Lead Created (Oct 15, 2024)

4. Review all entries
5. Click "Close"
```

### **Step 4: Reject Enrichment (10 seconds)**
```
1. Find "LinkedIn" field (✅ Enriched)
2. Hover over field
3. Click "❌ Reject" button
4. Field value reverts to previous state
5. Activity log shows: "🚫 Rejected enrichment for field 'linkedin'"
```

### **Step 5: Retry Failed Field (10 seconds)**
```
1. Find "GitHub Profile" field (❌ Failed)
2. Click "🔄 Retry Enrichment" button
3. Field shows "🔄 Enriching..." status
4. Activity log shows: "🔄 Retrying enrichment for field 'github_profile'"
```

---

## ✅ Quick Checklist

During testing, verify:

- [ ] Fields auto-enrich on page load
- [ ] Hover shows action buttons on completed fields
- [ ] Verify button marks field as verified
- [ ] History button opens timeline modal
- [ ] Reject button reverts field value
- [ ] Retry button works on failed fields
- [ ] Activity log records all actions
- [ ] Modal animations smooth
- [ ] Backdrop click closes modals
- [ ] Verified badge persists

---

## 🎯 What to Look For

### Visual Elements

#### **Action Buttons (on hover)**
```
[✅ Verify]  - Green button, checkmark icon
[📜 History] - Purple button, history icon
[❌ Reject]  - Orange button, X icon
```

#### **Field States**
```
⏳ Queued      - Gray background
🔄 Enriching   - Blue background, animated
✅ Enriched    - Green background
❌ Failed      - Red background
```

#### **Status Badges**
```
✅ Verified    - Green badge (persistent)
🔄 Enriching   - Blue text with animation
❌ Failed      - Red text
```

### History Modal Elements

```
┌─────────────────────────────────────────┐
│ 📜 Field History                        │
│ 📱 Direct Phone                         │
├─────────────────────────────────────────┤
│                                         │
│ Timeline Entry (bordered card):         │
│                                         │
│ Icon + Type Label         User/Source  │
│ Timestamp                               │
│ ─────────────────────────────────────   │
│ Previous Value → New Value              │
│ Confidence bar (if API enrichment)      │
│ Reason (if manual edit)                 │
│ Note (if provided)                      │
│                                         │
├─────────────────────────────────────────┤
│ 4 changes recorded         [Close]      │
└─────────────────────────────────────────┘
```

---

## 🎨 Color Reference

| Element | Background | Border | Text |
|---------|------------|--------|------|
| Verify button | Light green | None | Green-700 |
| History button | Light purple | None | Purple-700 |
| Reject button | Light orange | None | Orange-700 |
| Verified badge | Light emerald | None | Emerald-700 |
| Manual Edit entry | Light blue | Blue-200 | Blue-600 |
| API Enrichment | Light green | Green-200 | Green-600 |
| Failed entry | Light red | Red-200 | Red-600 |
| Lead Created | Light purple | Purple-200 | Purple-600 |

---

## 📊 Activity Log Examples

Watch for these messages as you interact:

```
✅ Enrichment completed successfully
✅ Verified field "email"
📜 Viewed history for field "direct_phone"
🚫 Rejected enrichment for field "linkedin"
🔄 Retrying enrichment for field "github_profile"
```

---

## 🐛 Troubleshooting

### Issue: Action buttons not showing
**Solution:** Hover directly over completed/failed fields

### Issue: History modal empty
**Solution:** Normal for fields without changes

### Issue: Can't verify already verified field
**Solution:** Correct - shows "Verified" badge instead

### Issue: Reject button doesn't show
**Solution:** Only available for fields with enriched values

---

## ⏱️ Time Breakdown

| Action | Time | Total |
|--------|------|-------|
| Wait for enrichment | 20s | 20s |
| Verify field | 10s | 30s |
| View history | 20s | 50s |
| Reject enrichment | 10s | 60s |
| Retry failed field | 10s | 70s |

**Total:** ~70 seconds (1 minute 10 seconds)

---

## 🎯 Success Indicators

You'll know it's working when:

1. ✅ Action buttons appear on hover
2. ✅ Verify button changes to badge
3. ✅ History modal shows timeline
4. ✅ Reject reverts field value
5. ✅ Retry attempts enrichment
6. ✅ Activity log updates in real-time
7. ✅ Modals animate smoothly
8. ✅ All buttons respond to clicks

---

## 🔄 Repeated Testing

To test multiple times:

1. Refresh page (F5)
2. Fields reset and re-enrich
3. All actions available again
4. Test different combinations

---

## 📱 Mobile Testing

On mobile devices:

- Action buttons show on tap (no hover)
- Modals full-width
- Scrollable timeline
- Touch-friendly buttons

---

## 🎉 Complete Feature List

In this demo, you can:

1. ✅ **Verify** fields to prevent auto-overrides
2. 📜 **View complete history** with timeline
3. ❌ **Reject** unwanted enrichments
4. 🔄 **Retry** failed enrichments
5. 📊 **See confidence scores** in history
6. 👤 **View user attribution** for changes
7. 📝 **Read edit reasons** and notes
8. ⏰ **Check timestamps** (relative & absolute)
9. 🎨 **Color-coded entries** by type
10. 📈 **Real-time activity log** updates

---

## 🚀 Quick Start Commands

```bash
# Navigate to demo
http://localhost:5173/demo/field-level-actions

# Or from any page, add to URL bar:
/demo/field-level-actions
```

---

## 💡 Pro Tips

1. **Wait for completion** - Action buttons only appear after enrichment
2. **Hover reveals actions** - Move mouse over fields
3. **History is powerful** - Shows complete audit trail
4. **Verify protects data** - Use for confirmed information
5. **Reject is reversible** - Can retry enrichment later
6. **Activity log tracks everything** - Review at bottom of page

---

## 📚 Related Docs

- `FIELD_LEVEL_ACTIONS_COMPLETE.md` - Full documentation
- `GAP_4_ACCESS_GUIDE.md` - Detailed access guide
- `GAP_4_QUICK_REFERENCE.md` - One-page reference

---

## ✅ Final Checklist

Before considering test complete:

- [ ] Verified at least one field
- [ ] Viewed history modal
- [ ] Rejected at least one enrichment
- [ ] Retried a failed field
- [ ] Checked activity log entries
- [ ] Confirmed badges persist
- [ ] Tested modal close functionality
- [ ] Reviewed timeline entries
- [ ] Checked confidence scores
- [ ] Noted user attributions

---

**Status:** ✅ Ready to Test

**Build:** ✅ Successful

**Features:** 20/20 Complete

**Time:** ~2 minutes for full test

Happy testing! 🎉
