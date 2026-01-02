# Recent Documents - Quick Reference Card
**One-Page Developer & Tester Guide**

---

## 🎯 Component Location
```
/src/components/Documents/RecentDocumentsSection.tsx
```

## 📊 Three States at a Glance

| State | Trigger | Height | Key Feature |
|-------|---------|--------|-------------|
| **Empty** | 0 docs | ~180px | CTA button |
| **Populated** | 1+ docs | ~200px | Document cards |
| **Collapsed** | User toggle | ~48px | Minimized |

---

## 🗂️ Mock Data Locations

```typescript
// Populated State (5 documents)
RECENT_DOCUMENTS_MOCK  // DocumentsLibrary.tsx line 103

// Empty State (0 documents)
EMPTY_STATE_MOCK       // DocumentsLibrary.tsx line 179
```

---

## ✨ Key Features by State

### **EMPTY STATE (0 Documents)**
```
✓ Circular icon background (80×80px)
✓ "No recent documents yet" heading
✓ Multi-line guidance text
✓ "Browse Documents" CTA button
✓ Shows "(0)" count
✓ Can collapse/expand
```

### **POPULATED STATE (1-5 Documents)**
```
✓ Horizontal card grid
✓ 5 document cards max
✓ File size display (e.g., "2.4 MB")
✓ View count (e.g., "12 views")
✓ Deal/Account context
✓ Preview & Download buttons
✓ "View All (X)" link if 6+ total
✓ Hover lift effect
✓ Can collapse/expand
```

### **COLLAPSED STATE**
```
✓ Single header line
✓ Document count badge
✓ Expand button (⌄)
✓ Minimal footprint
```

---

## 🧪 2-Minute Test

### **Test Empty State:**
```typescript
// In DocumentsLibrary.tsx
const recentDocs = EMPTY_STATE_MOCK.recentDocuments; // []

Expected:
1. Section header shows "(0)"
2. Large circular icon visible
3. "No recent documents yet" text
4. Blue "Browse Documents" button
5. Button clicks trigger onViewAll
```

### **Test Populated State:**
```typescript
// In DocumentsLibrary.tsx
const recentDocs = RECENT_DOCUMENTS_MOCK; // 5 documents

Expected:
1. Section header shows "(Last 5 you viewed)"
2. 5 cards displayed horizontally
3. Each card shows:
   - File icon + name
   - Category badge
   - Deal/Account (if present)
   - "X.X MB • Y views"
   - "Time ago"
   - Preview & Download buttons
4. Hover on card → lifts with shadow
5. Click card → navigates to details
```

### **Test Collapsed State:**
```typescript
// Click collapse button (⌃)

Expected:
1. Section collapses to single line
2. Shows count: "(5)" or "(0)"
3. Expand button (⌄) visible
4. Click expand → returns to previous state
```

---

## 📋 Data Structure Reference

### **Single Document Object:**
```typescript
{
  document_id: string;          // Unique ID
  document_name: string;        // Display name
  file_type: string;            // "pdf", "docx", etc.
  file_size: number;            // Bytes (e.g., 2457600)
  category: string;             // "Proposal", "Contract"
  view_count: number;           // Number of views
  deal_name?: string;           // Optional deal link
  account_name?: string;        // Optional account link
  last_viewed_date: string;     // ISO date or relative
  file_url: string;             // Download URL
}
```

---

## 🎨 Quick Style Reference

### **Colors:**
```css
Text Primary:    #111827 (gray-900)
Text Secondary:  #4b5563 (gray-600)
Text Tertiary:   #6b7280 (gray-500)
Icon Background: #f9fafb (gray-50)
Button Primary:  #2563eb (blue-600)
Button Hover:    #1d4ed8 (blue-700)
Border:          #e5e7eb (gray-200)
Border Hover:    #93c5fd (blue-300)
```

### **Spacing:**
```css
Card Width:    180px
Card Height:   165px
Card Gap:      16px
Section Pad:   24px (px-6 py-4)
Icon Circle:   80×80px
Icon Size:     40×40px
```

---

## 🔄 State Flow Logic

```typescript
if (isCollapsed) {
  return <CollapsedHeader />;     // State 3
}

if (recentDocuments.length === 0) {
  return <EmptyState />;          // State 1
}

return <PopulatedState />;        // State 2
```

---

## 🛠️ Common Customizations

### **Change Empty State Message:**
```typescript
// Line 145
<p className="text-base font-semibold text-gray-900 mb-2">
  Your custom message here
</p>
```

### **Change CTA Button Text:**
```typescript
// Line 153
Browse Documents → Your Button Text
```

### **Change Card Height:**
```typescript
// Line 189
h-[165px] → h-[YOUR_HEIGHT]
```

### **Change Max Cards Shown:**
```typescript
// In parent component
recentDocuments={RECENT_DOCUMENTS_MOCK.slice(0, 3)} // Show 3
```

---

## 📊 File Size Formatter

```typescript
formatFileSize(2457600)   → "2.4 MB"
formatFileSize(876544)    → "856.0 KB"
formatFileSize(12902400)  → "12.3 MB"
formatFileSize(245)       → "245.0 B"
```

---

## 🕐 Time Formatter

```typescript
getRelativeTime(now - 1000*60*30)     → "30 mins ago"
getRelativeTime(now - 1000*60*60*2)   → "2 hours ago"
getRelativeTime(now - 1000*60*60*24)  → "Yesterday"
getRelativeTime(now - 1000*60*60*72)  → "3 days ago"
```

---

## 🎯 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Cards not showing | Empty array | Pass RECENT_DOCUMENTS_MOCK |
| Empty state not showing | Array has items | Pass [] or EMPTY_STATE_MOCK.recentDocuments |
| No hover effect | CSS conflict | Check Tailwind classes |
| Button doesn't work | Missing callback | Provide onViewAll prop |
| File size shows "0 B" | Missing file_size | Add file_size to mock data |
| Deal name not showing | Missing deal_name | Add deal_name to mock data |

---

## ✅ Pre-Deployment Checklist

### **Visual:**
- [ ] Empty state: Icon, message, button visible
- [ ] Populated state: Cards render correctly
- [ ] Collapsed state: Single line header
- [ ] Hover effects work smoothly
- [ ] Responsive on mobile/tablet/desktop

### **Functional:**
- [ ] Click card → navigates correctly
- [ ] Click "Browse Documents" → triggers onViewAll
- [ ] Click Preview → triggers onPreview
- [ ] Click Download → triggers onDownload
- [ ] Collapse/expand works
- [ ] Horizontal scroll works (if needed)

### **Data:**
- [ ] File sizes format correctly
- [ ] View counts display
- [ ] Deal/account names show when present
- [ ] Time relative displays correctly
- [ ] All icons render

### **Build:**
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Bundle size acceptable

---

## 📖 Documentation Files

1. **RECENT_DOCUMENTS_ENHANCEMENTS_v2.md** - Full technical docs
2. **RECENT_DOCUMENTS_EMPTY_STATE.md** - Empty state deep dive
3. **RECENT_DOCUMENTS_ALL_STATES.md** - State comparison
4. **RECENT_DOCUMENTS_VISUAL_GUIDE.md** - Design specs
5. **RECENT_DOCUMENTS_QUICK_REFERENCE.md** - This file

---

## 🚀 Quick Deploy Commands

```bash
# Build
npm run build

# Check TypeScript
tsc --noEmit

# Start dev server (if needed for testing)
npm run dev
```

---

## 💡 Pro Tips

1. **Toggle States Easily**: Use a state variable to switch between EMPTY_STATE_MOCK and RECENT_DOCUMENTS_MOCK
2. **Test Hover**: Move mouse slowly to see lift effect
3. **Test Collapse**: Click ⌃ button in header
4. **Check Responsive**: Resize browser to see card scrolling
5. **Verify Count**: "(0)" for empty, "(Last 5...)" for populated

---

## 📞 Quick Help

**Component not rendering?**
→ Check recentDocuments prop is being passed

**Empty state always showing?**
→ Verify recentDocuments array has items

**Cards look wrong?**
→ Check mock data has all required fields

**Hover not working?**
→ Verify Tailwind CSS is loaded

**Button clicks do nothing?**
→ Check onViewAll/onPreview/onDownload callbacks provided

---

**Version:** 1.0.0
**Last Updated:** December 12, 2024
**Status:** ✅ Ready for Use
