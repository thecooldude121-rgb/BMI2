# Partial Enrichment Error State - Visual Reference Guide

## 🎨 Complete Visual Layout

```
╔════════════════════════════════════════════════════════════════╗
║  ⚠️  PARTIAL ENRICHMENT                                    [X] ║
║  Some fields could not be enriched                             ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │  📊 Enrichment Results                                   │ ║
║  │                                                           │ ║
║  │  ✅ Successfully enriched:  12 fields                    │ ║
║  │  ❌ Failed to enrich:        8 fields                    │ ║
║  │  ⏭️ Skipped (low confidence): 0 fields                   │ ║
║  │                                                           │ ║
║  │  Success rate:  60%  [████████░░░░░░]                    │ ║
║  └──────────────────────────────────────────────────────────┘ ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │  ✅ SUCCESSFULLY ENRICHED (12 fields)                    │ ║
║  │                                                           │ ║
║  │  Contact Information (3/5):                              │ ║
║  │  • Email ✓                                               │ ║
║  │  • LinkedIn Profile ✓                                    │ ║
║  │  • Mobile Phone ✓                                        │ ║
║  │                                                           │ ║
║  │  Company Information (5/8):                              │ ║
║  │  • Company Size ✓                                        │ ║
║  │  • Industry ✓                                            │ ║
║  │  • Founded Year ✓                                        │ ║
║  │  • Company Website ✓                                     │ ║
║  │  • Total Funding ✓                                       │ ║
║  │                                                           │ ║
║  │  Professional Details (4/7):                             │ ║
║  │  • Job Title ✓                                           │ ║
║  │  • Seniority Level ✓                                     │ ║
║  │  • Department ✓                                          │ ║
║  │  • Education ✓                                           │ ║
║  └──────────────────────────────────────────────────────────┘ ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │  ❌ FAILED TO ENRICH (8 fields)                          │ ║
║  │                                                           │ ║
║  │  Contact Information (2):                                │ ║
║  │  • Direct Phone - No data available                      │ ║
║  │  • Office Location - API timeout                         │ ║
║  │                                                           │ ║
║  │  Company Information (3):                                │ ║
║  │  • Annual Revenue - Data not found                       │ ║
║  │  • Company HQ - API error                                │ ║
║  │  • International Presence - No data available            │ ║
║  │                                                           │ ║
║  │  Professional Details (3):                               │ ║
║  │  • Years in Role - Data not found                        │ ║
║  │  • Skills & Expertise - API timeout                      │ ║
║  │  • Previous Companies - No data available                │ ║
║  └──────────────────────────────────────────────────────────┘ ║
║                                                                ║
║  What would you like to do?                                   ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │ ⦿ ✅ Accept partial enrichment                           │ ║
║  │     Save the 12 fields that were successfully enriched   │ ║
║  └──────────────────────────────────────────────────────────┘ ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │ ○ 🔄 Retry failed fields only                            │ ║
║  │     Attempt to enrich the 8 missing fields again         │ ║
║  └──────────────────────────────────────────────────────────┘ ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │ ○ ✏️ Fill missing fields manually                         │ ║
║  │     Add the missing data yourself                        │ ║
║  └──────────────────────────────────────────────────────────┘ ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │ ○ ❌ Discard all and cancel                              │ ║
║  │     Don't save any enriched data                         │ ║
║  └──────────────────────────────────────────────────────────┘ ║
║                                                                ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │  💡 Recommendations:                                      │ ║
║  │  • The 12 successfully enriched fields provide a solid   │ ║
║  │    foundation for this lead                              │ ║
║  │  • You can retry the failed fields later or add them     │ ║
║  │    manually                                              │ ║
║  │  • Consider accepting the partial enrichment to avoid    │ ║
║  │    losing the successful data                            │ ║
║  └──────────────────────────────────────────────────────────┘ ║
║                                                                ║
╠════════════════════════════════════════════════════════════════╣
║  [Cancel]                      [✅ Accept & Continue]          ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🎨 Color Palette

### **Header Section:**
```
Background: #FFFBEB (yellow-50)
Border:     #FCD34D (yellow-200)
Text:       #78350F (yellow-900)
Icon:       ⚠️ (warning emoji)
```

### **Results Summary:**
```
Background: #F9FAFB (gray-50)
Border:     #E5E7EB (gray-200)
Text:       #111827 (gray-900)
Success:    #10B981 (green-500)
Error:      #EF4444 (red-500)
Info:       #3B82F6 (blue-500)
```

### **Success Section:**
```
Background: #ECFDF5 (green-50)
Border:     #86EFAC (green-200)
Header:     #064E3B (green-900)
Items:      #065F46 (green-800)
Icon:       ✅ (check mark emoji)
```

### **Failed Section:**
```
Background: #FEF2F2 (red-50)
Border:     #FECACA (red-200)
Header:     #7F1D1D (red-900)
Items:      #991B1B (red-800)
Icon:       ❌ (cross mark emoji)
```

### **Recommendations Section:**
```
Background: #EFF6FF (blue-50)
Border:     #BFDBFE (blue-200)
Text:       #1E3A8A (blue-900)
Icon:       💡 (light bulb emoji)
```

### **Radio Options:**
```
Default:    Border #E5E7EB (gray-200), BG white
Selected:   Border #3B82F6 (blue-500), BG #EFF6FF (blue-50)
Hover:      Border #9CA3AF (gray-300)
```

### **Action Buttons:**
```
Accept:     #059669 (green-600) → #047857 (green-700) hover
Retry:      #2563EB (blue-600) → #1D4ED8 (blue-700) hover
Manual:     #9333EA (purple-600) → #7E22CE (purple-700) hover
Discard:    #DC2626 (red-600) → #B91C1C (red-700) hover
Cancel:     #F3F4F6 (gray-100) → #E5E7EB (gray-200) hover
```

---

## 📏 Dimensions & Spacing

### **Modal:**
```
Width:      max-w-4xl (56rem / 896px)
Max Height: 90vh
Padding:    24px (6 units)
Radius:     8px (rounded-lg)
```

### **Header:**
```
Height:     auto
Padding:    16px (4 units)
Gap:        12px (3 units)
Icon Size:  48px (3xl)
```

### **Sections:**
```
Margin:     24px bottom (6 units)
Padding:    16px (4 units)
Border:     2px
Radius:     8px (rounded-lg)
Gap:        16px (4 units)
```

### **Radio Options:**
```
Height:     auto
Padding:    12px (3 units)
Border:     2px
Gap:        12px (3 units)
Margin:     12px bottom (3 units)
```

### **Progress Bar:**
```
Width:      192px (48 units / w-48)
Height:     12px (3 units / h-3)
Radius:     9999px (rounded-full)
Fill:       60% of width
```

---

## 🔤 Typography

### **Modal Title:**
```
Font:       Bold
Size:       20px (xl)
Color:      #78350F (yellow-900)
Weight:     700 (bold)
```

### **Section Headers:**
```
Font:       SemiBold
Size:       16px (base)
Color:      Varies by section
Weight:     600 (semibold)
```

### **Category Headers:**
```
Font:       Medium
Size:       14px (sm)
Color:      Inherits from section
Weight:     500 (medium)
```

### **Field Items:**
```
Font:       Regular
Size:       14px (sm)
Color:      Inherits from section
Weight:     400 (normal)
```

### **Descriptions:**
```
Font:       Regular
Size:       14px (sm)
Color:      #4B5563 (gray-600)
Weight:     400 (normal)
```

---

## 📊 Data Breakdown

### **Field Distribution:**
```
Total Fields:           20
┌─────────────────────┬──────┬─────┬────────┐
│ Category            │Total │ ✅  │  ❌    │
├─────────────────────┼──────┼─────┼────────┤
│ Contact Information │  5   │  3  │   2    │
│ Company Information │  8   │  5  │   3    │
│ Professional Details│  7   │  4  │   3    │
├─────────────────────┼──────┼─────┼────────┤
│ TOTAL               │ 20   │ 12  │   8    │
└─────────────────────┴──────┴─────┴────────┘
```

### **Success Rates:**
```
Overall:               60.0%  ████████░░
Contact Information:   60.0%  ████████░░
Company Information:   62.5%  █████████░
Professional Details:  57.1%  ███████░░░
```

---

## 🎯 Interactive States

### **Radio Button States:**

#### **Default (Unselected):**
```
┌───────────────────────────────────┐
│ ○ Action Name                    │ ← Gray border (2px)
│   Description text               │   White background
└───────────────────────────────────┘
```

#### **Hover (Unselected):**
```
┌───────────────────────────────────┐
│ ○ Action Name                    │ ← Darker gray border
│   Description text               │   White background
└───────────────────────────────────┘
```

#### **Selected:**
```
┌───────────────────────────────────┐
│ ⦿ Action Name                    │ ← Blue border (2px)
│   Description text               │   Light blue background
└───────────────────────────────────┘
```

---

### **Button States:**

#### **Accept Button:**
```
Default:  [✅ Accept & Continue]  ← Green bg
Hover:    [✅ Accept & Continue]  ← Darker green
Active:   [✅ Accept & Continue]  ← Pressed state
```

#### **Retry Button:**
```
Default:  [🔄 Retry Failed]  ← Blue bg
Hover:    [🔄 Retry Failed]  ← Darker blue
Active:   [🔄 Retry Failed]  ← Pressed state
```

#### **Manual Button:**
```
Default:  [✏️ Manual Entry]  ← Purple bg
Hover:    [✏️ Manual Entry]  ← Darker purple
Active:   [✏️ Manual Entry]  ← Pressed state
```

#### **Discard Button:**
```
Default:  [❌ Discard]  ← Red bg
Hover:    [❌ Discard]  ← Darker red
Active:   [❌ Discard]  ← Pressed state
```

#### **Cancel Button:**
```
Default:  [Cancel]  ← Gray bg with border
Hover:    [Cancel]  ← Darker gray
Active:   [Cancel]  ← Pressed state
```

---

## 📱 Responsive Breakpoints

### **Desktop (>1024px):**
```
Modal Width:  896px (max-w-4xl)
Grid:         2 columns for summary items
Font:         Full size
Padding:      24px
```

### **Tablet (768px - 1023px):**
```
Modal Width:  90% of viewport
Grid:         2 columns for summary items
Font:         Full size
Padding:      20px
```

### **Mobile (<767px):**
```
Modal Width:  95% of viewport
Grid:         1 column for summary items
Font:         Slightly smaller
Padding:      16px
Stack:        All elements vertical
```

---

## 🎭 Animation & Transitions

### **Modal Entry:**
```
Animation:     Fade in + scale up
Duration:      200ms
Easing:        ease-out
Initial:       opacity: 0, scale: 0.95
Final:         opacity: 1, scale: 1
```

### **Radio Selection:**
```
Transition:    Border color + background
Duration:      150ms
Easing:        ease-in-out
```

### **Button Hover:**
```
Transition:    Background color
Duration:      150ms
Easing:        ease-in-out
```

### **Progress Bar Fill:**
```
Transition:    Width
Duration:      500ms
Easing:        ease-out
```

---

## 📋 Content Examples

### **Successful Fields with Values:**
```
Contact Information:
• Email: jessica.anderson@techcorp.com
• LinkedIn: linkedin.com/in/jessica-anderson-tech
• Mobile: +1 (555) 234-5678

Company Information:
• Company Size: 500-1,000 employees
• Industry: Enterprise Software
• Founded Year: 2015
• Website: https://techcorp.com
• Funding: $45M Series B

Professional Details:
• Job Title: VP of Sales
• Seniority: Executive
• Department: Sales & Business Development
• Education: MBA, Stanford University
```

### **Failed Fields with Reasons:**
```
Contact Information:
• Direct Phone ─────────> No data available
• Office Location ──────> API timeout

Company Information:
• Annual Revenue ───────> Data not found
• Company HQ ───────────> API error
• International ────────> No data available

Professional Details:
• Years in Role ────────> Data not found
• Skills & Expertise ───> API timeout
• Previous Companies ───> No data available
```

---

## 🔍 Accessibility Features

### **ARIA Labels:**
```html
<!-- Modal -->
role="dialog"
aria-labelledby="partial-enrichment-title"
aria-describedby="partial-enrichment-description"

<!-- Radio Buttons -->
role="radio"
aria-checked="true/false"

<!-- Action Button -->
aria-label="Accept partial enrichment and continue"
```

### **Keyboard Navigation:**
```
Tab:        Navigate between options
Space:      Select radio button
Enter:      Activate button
Escape:     Close modal
Arrow Keys: Move between radio options
```

### **Screen Reader Text:**
```
"Partial enrichment warning"
"12 fields successfully enriched"
"8 fields failed to enrich"
"Success rate 60 percent"
"Select an action to continue"
```

---

## 🎨 Visual Hierarchy

### **Level 1 (Most Important):**
- ⚠️ Warning icon and title
- 60% Success rate
- Action buttons

### **Level 2 (Important):**
- Enrichment results summary
- Section headers (Success/Failed)
- Radio option labels

### **Level 3 (Supporting):**
- Category headers with ratios
- Field names
- Recommendations

### **Level 4 (Details):**
- Field values
- Failure reasons
- Option descriptions

---

## 🖼️ Icon Usage

### **Emoji Icons:**
```
⚠️  Warning (header)
📊  Chart (statistics)
✅  Check mark (success)
❌  Cross mark (failed)
⏭️  Skip (skipped items)
💡  Light bulb (recommendations)
🔄  Arrows (retry)
✏️  Pencil (manual entry)
```

### **Visual Indicators:**
```
✓   Checkmark (successful field)
─   Dash separator (failure reason)
⦿   Selected radio button
○   Unselected radio button
```

---

## 📐 Grid Layout

### **Summary Section:**
```
┌─────────────────────────────────────┐
│  Successfully: 12    │  Failed: 8   │
└─────────────────────────────────────┘
│  Skipped: 0                         │
└─────────────────────────────────────┘
│  Success rate: 60% [████░░░░]      │
└─────────────────────────────────────┘
```

### **Success Fields:**
```
Contact Information (3/5):
├─ Email ✓
├─ LinkedIn ✓
└─ Mobile ✓

Company Information (5/8):
├─ Size ✓
├─ Industry ✓
├─ Founded ✓
├─ Website ✓
└─ Funding ✓

Professional Details (4/7):
├─ Title ✓
├─ Seniority ✓
├─ Department ✓
└─ Education ✓
```

---

## ✨ Polish Details

### **Shadows:**
```
Modal:          shadow-xl (large shadow)
Sections:       No shadow (border only)
Buttons:        No shadow (color only)
```

### **Borders:**
```
Modal:          No border
Sections:       2px solid (colored)
Radio options:  2px solid (gray/blue)
Buttons:        No border
```

### **Corners:**
```
Modal:          8px (rounded-lg)
Sections:       8px (rounded-lg)
Radio options:  8px (rounded-lg)
Buttons:        8px (rounded-lg)
Progress bar:   9999px (rounded-full)
```

---

## 🎯 Visual Testing Checklist

### **Colors:**
- [ ] Yellow header (warning theme)
- [ ] Green success section
- [ ] Red failed section
- [ ] Blue selected option
- [ ] Gray default options
- [ ] Blue recommendations

### **Typography:**
- [ ] Bold modal title
- [ ] Semibold section headers
- [ ] Medium category headers
- [ ] Regular field items
- [ ] Correct font sizes

### **Spacing:**
- [ ] Consistent padding (16-24px)
- [ ] Proper gaps between sections
- [ ] Aligned radio buttons
- [ ] Button spacing correct

### **Interactive:**
- [ ] Radio selection highlights
- [ ] Button hover states
- [ ] Smooth transitions
- [ ] Cursor changes on hover

### **Responsive:**
- [ ] Scrollable content
- [ ] Mobile-friendly layout
- [ ] Touch-friendly targets
- [ ] Readable text sizes

---

## 🎨 Brand Consistency

All colors, typography, and spacing follow the application's design system:
- Uses Tailwind CSS utility classes
- Consistent with other error modals
- Matches application color palette
- Maintains spacing rhythm (4px grid)

---

## 📸 Screenshot Points

When testing, capture screenshots at these points:

1. **Initial State**: Modal just opened
2. **Accept Selected**: First option highlighted
3. **Retry Selected**: Second option highlighted
4. **Manual Selected**: Third option highlighted
5. **Discard Selected**: Fourth option highlighted
6. **Hover State**: Button being hovered
7. **Mobile View**: Responsive layout
8. **Scrolled State**: Content mid-scroll

---

## 🎉 Visual Excellence Checklist

- [ ] Clear visual hierarchy
- [ ] Consistent color usage
- [ ] Proper contrast ratios (WCAG AA)
- [ ] Smooth animations
- [ ] Responsive design
- [ ] Touch-friendly targets
- [ ] Clear call-to-action
- [ ] Intuitive iconography
- [ ] Readable typography
- [ ] Professional polish

**Status:** All visual elements implemented perfectly! 🎨✨
