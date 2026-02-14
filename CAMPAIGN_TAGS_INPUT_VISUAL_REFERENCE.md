# Campaign Tags Input - Visual Reference Guide

## Component Location

```
┌─────────────────────────────────────────────────────────────┐
│ Campaign Wizard - Step 1: Basic Information                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Previous sections: Name, Objective, Description, Type]     │
│                                                             │
│ Target Metrics (Optional)                                   │
│ [Target metrics component]                                  │
│                                                             │
│ Campaign Tags (Optional) ← NEW SECTION                      │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ [THIS COMPONENT]                                    │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Empty State (No Tags)

```
┌───────────────────────────────────────────────────────────────┐
│ Campaign Tags (Optional)                          0/10 tags   │
├───────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Type and press Enter to add tags                    ▒▒▒│   │
│ └─────────────────────────────────────────────────────────┘   │
│ Press Enter or comma to add • Max 20 characters               │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ℹ Tags help organize campaigns. Use them to filter...  │   │
│ └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## Focus State with Suggestions

```
┌───────────────────────────────────────────────────────────────┐
│ Campaign Tags (Optional)                          0/10 tags   │
├───────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ent▊                                                    │   │ ← Blue border + ring
│ └─────────────────────────────────────────────────────────┘   │
│ ▼                                                             │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ⌄ Suggested tags                                        │   │
│ │ ┌───────────────────────────────────────────────────┐   │   │
│ │ │ 🏷️  Enterprise                           [BLUE BG] │   │   │ ← Highlighted
│ │ └───────────────────────────────────────────────────┘   │   │
│ └─────────────────────────────────────────────────────────┘   │
│ Press Enter or comma to add • Max 20 characters               │
└───────────────────────────────────────────────────────────────┘
```

## With 3 Tags

```
┌───────────────────────────────────────────────────────────────┐
│ Campaign Tags (Optional)                          3/10 tags   │
├───────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐ │   │
│ │ │🏷️ Enterprise  [×]│ │🏷️ SaaS    [×]│ │🏷️ Webinar [×]│ │   │
│ │ └──────────────────┘ └──────────────┘ └──────────────┘ │   │
│ │ Add tag...                                              │   │
│ └─────────────────────────────────────────────────────────┘   │
│ Press Enter or comma to add • Max 20 characters               │
└───────────────────────────────────────────────────────────────┘
```

## Tag Pill States

### Default Pill
```
┌──────────────────┐
│🏷️  Enterprise [×]│  ← Blue background (#dbeafe)
└──────────────────┘     Blue text (#1e40af)
```

### Hover on × Button
```
┌──────────────────┐
│🏷️  Enterprise [×]│  ← × changes to darker blue (#1e3a8a)
└──────────────────┘     × gets blue background (#bfdbfe)
```

### Animation (Adding)
```
Frame 1: [invisible]
Frame 2: [fade in 25%, slide from left]
Frame 3: [fade in 50%, slide more]
Frame 4: [fade in 75%, slide more]
Frame 5: [fully visible, 100% opacity]
Duration: 200ms
```

### Animation (Removing)
```
Frame 1: [fully visible]
Frame 2: [fade out 75%, slide to left]
Frame 3: [fade out 50%, slide more]
Frame 4: [fade out 25%, slide more]
Frame 5: [invisible, removed from DOM]
Duration: 200ms
```

## Suggestions Dropdown - Full View

```
┌─────────────────────────────────────────────────────────────┐
│ Input: "ent"                                                │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⌄ Suggested tags                                        │ │
│ │                                                         │ │
│ │ ┌───────────────────────────────────────────────────┐   │ │
│ │ │ 🏷️  Enterprise                                    │   │ │ ← Highlighted (blue)
│ │ └───────────────────────────────────────────────────┘   │ │
│ │                                                         │ │
│ │   🏷️  Event                                             │ │ ← Not highlighted
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Dropdown Scrolling (10+ items)
```
┌─────────────────────────────────────────┐
│ ⌄ Suggested tags                        │
│                                         │
│ 🏷️  Enterprise                          │
│ 🏷️  Event                               │
│ 🏷️  High Priority                       │  } Visible
│ 🏷️  Nurture                             │
│ 🏷️  Product Launch                      │
│ ⋮                                       │  } Scroll area
│ 🏷️  Q1 2025                             │    (max 200px)
│ 🏷️  Re-engagement                       │
│                                    [▓]  │  ← Scrollbar
└─────────────────────────────────────────┘
```

## Error States

### Duplicate Tag Error
```
┌───────────────────────────────────────────────────────────────┐
│ Campaign Tags (Optional)                          3/10 tags   │
├───────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [🏷️ Enterprise ×] [🏷️ SaaS ×] [🏷️ Webinar ×]          │   │
│ │ enterprise                                              │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │ ← Red border + ring
│ ⚠ Tag already exists                                          │
└───────────────────────────────────────────────────────────────┘
```

### Special Character Error
```
┌───────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ Test@Tag                                                │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │ ← Red border + ring
│ ⚠ Only letters, numbers, spaces, dashes, and underscores...  │
└───────────────────────────────────────────────────────────────┘
```

### Character Limit Warning
```
┌───────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ThisIsAVeryLongTagNa                                    │   │
│ └─────────────────────────────────────────────────────────┘   │
│ Press Enter or comma to add               20/20 [RED TEXT]   │
└───────────────────────────────────────────────────────────────┘
```

## Maximum Tags (10/10)

```
┌───────────────────────────────────────────────────────────────┐
│ Campaign Tags (Optional)                         10/10 tags   │
├───────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [🏷️ Enterprise ×] [🏷️ SaaS ×] [🏷️ Webinar ×]          │   │
│ │ [🏷️ SMB ×] [🏷️ Q1 2025 ×] [🏷️ Event ×]                │   │ ← Gray background
│ │ [🏷️ Nurture ×] [🏷️ Cold Outreach ×] [🏷️ Demo ×]       │   │   No input field
│ │ [🏷️ High Priority ×]                                    │   │
│ └─────────────────────────────────────────────────────────┘   │
│ Maximum 10 tags reached. Remove a tag to add more.           │
└───────────────────────────────────────────────────────────────┘
```

## Auto-Save Indicator

```
┌───────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [🏷️ Enterprise ×] [🏷️ SaaS ×]                          │   │
│ └─────────────────────────────────────────────────────────┘   │
│ Press Enter or comma to add • Max 20 characters               │
│                                                               │
│ ● Auto-saving tags...                                         │
│ └─ Pulsing yellow dot                                         │
└───────────────────────────────────────────────────────────────┘
```

## Keyboard Navigation Visual Guide

### Arrow Keys in Dropdown
```
Current State:
┌─────────────────────────────┐
│ 🏷️  Enterprise     [BLUE]  │ ← Current highlight
│ 🏷️  Event          [WHITE] │
│ 🏷️  High Priority  [WHITE] │
└─────────────────────────────┘

After pressing Arrow Down:
┌─────────────────────────────┐
│ 🏷️  Enterprise     [WHITE] │
│ 🏷️  Event          [BLUE]  │ ← New highlight
│ 🏷️  High Priority  [WHITE] │
└─────────────────────────────┘
```

### Backspace to Remove Last Tag
```
Before Backspace:
┌─────────────────────────────────────────┐
│ [🏷️ Enterprise ×] [🏷️ SaaS ×] [🏷️ Test ×] │
│ ▊                                       │ ← Empty input
└─────────────────────────────────────────┘

After Backspace:
┌─────────────────────────────────────────┐
│ [🏷️ Enterprise ×] [🏷️ SaaS ×]          │
│ ▊                                       │ ← Test removed
└─────────────────────────────────────────┘
```

## Responsive Layout - Pills Wrapping

### Wide Container (3 tags per row)
```
┌──────────────────────────────────────────────────┐
│ [Enterprise ×] [SaaS ×] [Product Launch ×]       │
│ [Webinar ×] [SMB ×] [Q1 2025 ×]                  │
└──────────────────────────────────────────────────┘
```

### Narrow Container (2 tags per row)
```
┌────────────────────────────────┐
│ [Enterprise ×] [SaaS ×]        │
│ [Product Launch ×] [Webinar ×] │
│ [SMB ×] [Q1 2025 ×]            │
└────────────────────────────────┘
```

### Mobile (1-2 tags per row based on length)
```
┌──────────────────────┐
│ [Enterprise ×]       │
│ [SaaS ×]             │
│ [Product Launch ×]   │
│ [Webinar ×] [SMB ×]  │
└──────────────────────┘
```

## Color Palette Reference

### Tag Pills
- Background: #dbeafe (blue-100)
- Text: #1e40af (blue-800)
- Icon: #1e40af (blue-800)
- × hover text: #1e3a8a (blue-900)
- × hover bg: #bfdbfe (blue-200)

### Input Container
- Default border: #d1d5db (gray-300)
- Focus border: #3b82f6 (blue-500)
- Focus ring: rgba(59, 130, 246, 0.1)
- Error border: #ef4444 (red-500)
- Error ring: rgba(239, 68, 68, 0.1)
- Disabled bg: #f9fafb (gray-50)

### Dropdown
- Background: #ffffff (white)
- Border: #e5e7eb (gray-200)
- Shadow: 0 10px 25px rgba(0, 0, 0, 0.1)
- Header text: #6b7280 (gray-500)
- Item text: #374151 (gray-700)
- Item hover: #f9fafb (gray-50)
- Item highlighted: #eff6ff (blue-50)
- Highlighted text: #1e3a8a (blue-900)

### Text & Icons
- Label: #111827 (gray-900)
- Helper text: #6b7280 (gray-500)
- Counter: #6b7280 (gray-500)
- Counter red: #dc2626 (red-600)
- Error text: #dc2626 (red-600)
- Auto-save text: #6b7280 (gray-500)
- Auto-save dot: #eab308 (yellow-500)

## Interaction Timeline

### Adding a Tag
```
0ms:    User types "Enterprise"
---
100ms:  User presses Enter
150ms:  Validation passes
200ms:  New pill starts fade-in
250ms:  Pill slides from left
300ms:  Pill fully visible
350ms:  Input clears
400ms:  Auto-save indicator appears
---
5400ms: Auto-save triggers
5450ms: Auto-save indicator disappears
```

### Removing a Tag
```
0ms:    User hovers over pill
50ms:   × button changes color
---
100ms:  User clicks × button
150ms:  Pill starts fade-out
200ms:  Pill slides to left
250ms:  Pill fully hidden
300ms:  Tag removed from array
350ms:  Auto-save indicator appears
---
5350ms: Auto-save triggers
5400ms: Auto-save indicator disappears
```

### Dropdown Navigation
```
0ms:    User clicks input
50ms:   Focus border appears
100ms:  Focus ring appears
150ms:  Dropdown starts fade-in
200ms:  Dropdown fully visible
---
User presses Arrow Down
---
0ms:    Previous highlight clears
50ms:   New highlight appears
100ms:  Transition complete
```

## Edge Cases Visualization

### Long Tag Name Wrapping
```
┌─────────────────────────────────────────┐
│ [🏷️ ThisIsAVeryLongTag ×]              │
│ [🏷️ Short ×] [🏷️ AnotherLongTagName ×]│
└─────────────────────────────────────────┘
```

### Mixed Length Tags
```
┌─────────────────────────────────────────┐
│ [🏷️ A ×] [🏷️ BB ×] [🏷️ CCC ×] [🏷️ DDDD ×]│
└─────────────────────────────────────────┘
```

### Empty Space Management
```
With 1 tag:
┌─────────────────────────────────────────┐
│ [🏷️ Enterprise ×] Add tag...           │
└─────────────────────────────────────────┘

With 9 tags (one row left):
┌─────────────────────────────────────────┐
│ [Tag1 ×] [Tag2 ×] [Tag3 ×] ... [Tag9 ×] │
│ Add tag...                              │
└─────────────────────────────────────────┘
```

## All Visual States Summary

1. ✅ Empty state (placeholder only)
2. ✅ Focus state (blue border + ring)
3. ✅ With tags (pills displayed)
4. ✅ Suggestions dropdown (white with shadow)
5. ✅ Highlighted suggestion (blue background)
6. ✅ Error state (red border + message)
7. ✅ Character limit warning (red counter)
8. ✅ Maximum tags (gray background, no input)
9. ✅ Auto-save indicator (pulsing dot)
10. ✅ Tag pill hover (darker × button)
11. ✅ Add animation (fade + slide in)
12. ✅ Remove animation (fade + slide out)
13. ✅ Responsive wrapping (multiple rows)

**Status**: All visual states documented ✅
