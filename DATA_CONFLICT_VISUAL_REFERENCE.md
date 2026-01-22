# 🎨 Data Conflict Modal - Visual Reference

## Full Modal Layout

```
┌───────────────────────────────────────────────────────────────────┐
│ ⚠️ DATA CONFLICT DETECTED                                    [×] │ ← ORANGE HEADER
│ Different data received from Apollo and ZoomInfo                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📊 Conflicting Fields: 3                           [GRAY BOX]│ │
│ │                                                               │ │
│ │ Apollo and ZoomInfo returned different values for some       │ │
│ │ fields. Please review and select which data to use.          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ CONFLICT 1: Company Size                                    │ │
│ │                                                             │ │
│ │ ⦿ Apollo.io   [94%]                         [BLUE SELECTED] │ │ ← SELECTED
│ │   85 employees                                              │ │
│ │   Source: LinkedIn company page, updated 2 days ago         │ │
│ │                                                             │ │
│ │ ○ ZoomInfo    [87%]                              [WHITE BG] │ │ ← UNSELECTED
│ │   100-150 employees                                         │ │
│ │   Source: ZoomInfo database, updated 1 month ago            │ │
│ │                                                             │ │
│ │ 💡 Recommendation: Use Apollo (higher confidence)           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ CONFLICT 2: Annual Revenue                                  │ │
│ │                                                             │ │
│ │ ○ Apollo.io   [82%]                              [WHITE BG] │ │
│ │   $10M - $15M                                               │ │
│ │   Source: Estimated from funding + employee count           │ │
│ │                                                             │ │
│ │ ⦿ ZoomInfo    [91%]                       [PURPLE SELECTED] │ │ ← SELECTED
│ │   $12M - $15M                                               │ │
│ │   Source: Financial filings, updated 3 months ago           │ │
│ │                                                             │ │
│ │ 💡 Recommendation: Use ZoomInfo (higher confidence)         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ CONFLICT 3: Direct Phone                                    │ │
│ │                                                             │ │
│ │ ⦿ Apollo.io   [88%]                         [BLUE SELECTED] │ │
│ │   +1 (415) 234-5678                                         │ │
│ │   Source: Verified contact database                         │ │
│ │                                                             │ │
│ │ ○ ZoomInfo    [85%]                              [WHITE BG] │ │
│ │   +1 (415) 234-9999                                         │ │
│ │   Source: Public records                                    │ │
│ │                                                             │ │
│ │ 💡 Recommendation: Use Apollo (higher confidence)           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ Resolution Options:                                               │
│                                                                   │
│ ⦿ Use recommendations (auto-select highest confidence)           │ ← SELECTED
│ ○ Always prefer Apollo.io                                        │
│ ○ Always prefer ZoomInfo                                         │
│ ○ Review each conflict manually (selected above)                 │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Current Selection:                                          │ │
│ │ Apollo.io: 2 fields  |  ZoomInfo: 1 field                   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💡 Recommendations:                                    [BLUE]│ │
│ │ • Apollo.io data is more recent for company size...         │ │
│ │ • ZoomInfo has higher confidence for annual revenue...      │ │
│ │ • You can always update these values manually later...      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                                                       [GRAY FOOTER]│
│ [Cancel]  [🔄 Use All ZoomInfo] [🔄 Use All Apollo]              │
│                                         [✅ Accept Selections]    │
└───────────────────────────────────────────────────────────────────┘
```

---

## Color Palette

### Header
- **Background:** `bg-orange-50` (light orange)
- **Border:** `border-orange-200`
- **Title:** `text-orange-900` (dark orange)
- **Text:** `text-orange-700`

### Conflict Cards
- **Container:** `border-2 border-gray-200`
- **Apollo Selected:** `border-blue-500 bg-blue-50`
- **ZoomInfo Selected:** `border-blue-500 bg-blue-50` (same selection style)
- **Unselected:** `border-gray-200 bg-white`

### Badges
- **Apollo Confidence:** `bg-blue-100 text-blue-800`
- **ZoomInfo Confidence:** `bg-purple-100 text-purple-800`

### Summary Box
- **Background:** `bg-gray-50`
- **Border:** `border-gray-200`

### Recommendations
- **Background:** `bg-blue-50`
- **Border:** `border-blue-200`
- **Text:** `text-blue-900` / `text-blue-800`

### Buttons
- **Cancel:** `bg-white border-gray-300 text-gray-700`
- **Use All ZoomInfo:** `bg-purple-50 border-purple-300 text-purple-700`
- **Use All Apollo:** `bg-blue-50 border-blue-300 text-blue-700`
- **Accept:** `bg-green-600 text-white`

---

## Typography

### Headers
- **Main Title:** `text-xl font-bold`
- **Conflict Title:** `text-lg font-semibold`
- **Section Title:** `font-semibold text-gray-900`

### Body Text
- **Primary:** `text-sm text-gray-700`
- **Secondary:** `text-sm text-gray-600`
- **Values:** `text-lg font-medium text-gray-900`

### Badges
- **Size:** `text-xs font-medium`
- **Padding:** `px-2 py-0.5`

---

## Component States

### Apollo Option - Selected
```
┌─────────────────────────────────────────┐
│ ⦿ Apollo.io  [94%]          [BLUE BG]  │ ← border-blue-500 bg-blue-50
│   85 employees                          │
│   Source: LinkedIn company page...      │
└─────────────────────────────────────────┘
```

### Apollo Option - Unselected
```
┌─────────────────────────────────────────┐
│ ○ Apollo.io  [94%]         [WHITE BG]  │ ← border-gray-200 bg-white
│   85 employees                          │
│   Source: LinkedIn company page...      │
└─────────────────────────────────────────┘
```

### Apollo Option - Hover (Unselected)
```
┌─────────────────────────────────────────┐
│ ○ Apollo.io  [94%]       [GRAY BORDER] │ ← border-gray-300
│   85 employees                          │
│   Source: LinkedIn company page...      │
└─────────────────────────────────────────┘
```

---

## Interactive Elements

### Radio Buttons
```
⦿ Selected (filled)
○ Unselected (empty)
```

### Confidence Badges
```
Apollo:    [94%]  ← Blue badge (bg-blue-100 text-blue-800)
ZoomInfo:  [87%]  ← Purple badge (bg-purple-100 text-purple-800)
```

### Recommendation Badge
```
💡 Recommendation: Use Apollo (higher confidence)
└─ bg-blue-50 border-blue-200 with lightbulb emoji
```

---

## Resolution Strategy Options

### Selected State
```
⦿ Use recommendations (auto-select highest confidence)
  └─ border-blue-500 bg-blue-50
```

### Unselected State
```
○ Always prefer Apollo.io
  └─ border-gray-200 bg-white
```

---

## Selection Summary Panel

```
┌─────────────────────────────────────────┐
│ Current Selection:                      │
│ ┌────────────┬──────────────────────┐   │
│ │ Apollo.io: │ 2 fields             │   │ ← Blue text
│ └────────────┴──────────────────────┘   │
│ ┌────────────┬──────────────────────┐   │
│ │ ZoomInfo:  │ 1 field              │   │ ← Purple text
│ └────────────┴──────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Footer Buttons Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Cancel]                                                   │
│            [🔄 Use All ZoomInfo]  [🔄 Use All Apollo]       │
│                                      [✅ Accept Selections] │
└─────────────────────────────────────────────────────────────┘
```

### Button Styles
1. **Cancel (left):** White background, gray border
2. **Use All ZoomInfo:** Purple background, purple border
3. **Use All Apollo:** Blue background, blue border
4. **Accept Selections (right):** Green background, no border

---

## Spacing and Layout

### Container
- **Width:** `max-w-5xl`
- **Max Height:** `max-h-[90vh]`
- **Padding:** `px-6 py-6`

### Conflict Cards
- **Margin Bottom:** `mb-4` between cards
- **Padding:** `p-5` inside each card
- **Option Padding:** `p-4` inside each radio option

### Section Spacing
- **Between sections:** `mb-6`
- **Between items:** `space-y-3` or `space-y-4`

---

## Icons Used

- ⚠️ - Warning (header)
- 📊 - Statistics
- ⦿ - Selected radio (filled)
- ○ - Unselected radio (empty)
- 💡 - Recommendation/tip
- 🔄 - Retry/refresh
- ✅ - Accept/confirm
- ❌ - Cancel/close

---

## Responsive Behavior

### Desktop (> 1024px)
- Full width modal (max-w-5xl)
- Two-column layout for data display
- All buttons visible on one line

### Tablet (768px - 1024px)
- Slightly narrower modal
- Single column for conflicts
- Buttons may wrap to two rows

### Mobile (< 768px)
- Nearly full-screen modal
- Single column layout
- Stacked buttons
- Increased padding for touch targets

---

## Scrolling Behavior

```
┌─────────────────────────┐
│  HEADER (Fixed)         │
├─────────────────────────┤
│                         │
│  SCROLLABLE CONTENT     │ ← Scrolls when content overflows
│                         │
├─────────────────────────┤
│  FOOTER (Fixed)         │
└─────────────────────────┘
```

---

## Hover Effects

### Conflict Options
- **Unselected:** Border changes from gray-200 to gray-300
- **Selected:** No hover effect (already selected)

### Buttons
- **Cancel:** Background changes to gray-50
- **Use All ZoomInfo:** Background changes to purple-100
- **Use All Apollo:** Background changes to blue-100
- **Accept:** Background changes from green-600 to green-700

---

## Accessibility

### Labels
- All radio buttons have proper labels
- Entire card acts as clickable label

### Keyboard Navigation
- Tab through radio options
- Space/Enter to select
- Escape to close modal

### Screen Readers
- Semantic HTML structure
- Proper heading hierarchy (h2, h3, h4)
- Descriptive button text
- ARIA labels where needed

---

## Animation States

### Modal Open
- Fade in background overlay
- Slide in modal from center
- Duration: 200ms ease-out

### Selection Change
- Smooth border color transition
- Background color fade
- Duration: 150ms

### Button Hover
- Color transition
- Duration: 150ms

---

## Data Visualization

### Confidence Bars (in demo page)
```
Apollo:    ████████████████████ 94%
ZoomInfo:  █████████████████    87%
```

### Progress Indicator
```
Selected: █████████░░░ 67% (2 of 3 resolved)
```

---

## Error States

### No Conflicts (should not happen, but...)
```
┌─────────────────────────────────────────┐
│ No conflicts detected. All data matches.│
└─────────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────────┐
│ Loading conflict data...                │
│ [Spinner animation]                     │
└─────────────────────────────────────────┘
```

---

## Z-Index Hierarchy

1. **Modal Backdrop:** `z-50`
2. **Modal Content:** `z-50` (same layer)
3. **Close Button:** Inherits from modal
4. **Dropdowns (if any):** `z-[60]`

---

## Print Styles (future consideration)

When printing conflict resolution:
- Hide modal backdrop
- Show full content without scrolling
- Highlight selected options
- Include timestamp and user info

---

## Comparison with Other Error States

| Feature | Data Conflict | Rate Limit | Network Error |
|---------|--------------|------------|---------------|
| **Color** | Orange | Red | Red |
| **Icon** | ⚠️ | ⚠️ | ⚠️ |
| **Actions** | Multiple | 2-3 | 2 |
| **Complexity** | High | Low | Low |
| **Scrolling** | Yes | Maybe | No |

---

## Visual Hierarchy

1. **Most Important:** Conflict values and selections
2. **Important:** Confidence scores and recommendations
3. **Supporting:** Source information and last updated
4. **Context:** Resolution strategy options
5. **Summary:** Current selection count
6. **Actions:** Footer buttons

---

This visual reference ensures consistent implementation and helps maintain the design system across the application.
