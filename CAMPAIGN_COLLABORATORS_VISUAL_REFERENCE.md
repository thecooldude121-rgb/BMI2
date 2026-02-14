# Campaign Collaborators Multi-select - Visual Reference Guide

## Component Location

```
┌─────────────────────────────────────────────────────────────┐
│ Campaign Wizard - Step 1: Basic Information                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Previous sections: Name, Description, Type, Metrics, Tags] │
│                                                             │
│ Campaign Owner                                              │
│ [Owner Dropdown Component]                                  │
│                                                             │
│ Collaborators (Optional) ← NEW SECTION                      │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ [THIS COMPONENT]                                    │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Initial State (No Selections)

```
┌───────────────────────────────────────────────────────────────┐
│ Collaborators (Optional)                                      │
├───────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  🔍 Search team members...                              │   │
│ └─────────────────────────────────────────────────────────┘   │
│ Add team members who can help manage this campaign.          │
│ The owner cannot be added as a collaborator.                 │
└───────────────────────────────────────────────────────────────┘

Border: Gray (2px)
Background: White
Placeholder: Gray text
```

## Focused State (Dropdown Open)

```
┌───────────────────────────────────────────────────────────────┐
│ Collaborators (Optional)                                      │
├───────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  🔍 Search team members...▊                             │   │ ← Blue border + ring
│ └─────────────────────────────────────────────────────────┘   │
│ ▼                                                             │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │                                                         │   │
│ │ ☐ ┌────┐ Sarah Chen                                    │   │
│ │   │ SC │ sarah.chen@company.com                        │   │
│ │   └────┘                                                │   │
│ │                                                         │   │
│ │ ☐ ┌────┐ Michael Rodriguez                             │   │
│ │   │ MR │ michael.r@company.com                         │   │
│ │   └────┘                                                │   │
│ │                                                         │   │
│ │ ☐ ┌────┐ Emily Johnson                                 │   │
│ │   │ EJ │ emily.j@company.com                           │   │
│ │   └────┘                                                │   │
│ │                                                         │   │
│ │ ☐ ┌────┐ Jessica Martinez                              │   │
│ │   │ JM │ jessica.m@company.com                         │   │
│ │   └────┘                                                │   │
│ │                                                         │   │
│ │ ☐ ┌────┐ James Anderson                                │   │
│ │   │ JA │ james.a@company.com                           │   │
│ │   └────┘                                                │   │
│ │                                                         │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ ℹ️ Collaborators can view, edit, and receive            │   │
│ │   notifications for this campaign.                      │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘

Dropdown: White bg, shadow-xl
5 users shown (owner excluded)
Each: Checkbox + Avatar + Name + Email
```

## With Selections (Closed)

```
┌───────────────────────────────────────────────────────────────┐
│ Collaborators (Optional)                                      │
├───────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  🔍 Search team members...        [👥 2 selected]      │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌──────────────────────────┐  ┌──────────────────────────┐   │
│ │ ┌────┐                   │  │ ┌────┐                   │   │
│ │ │ SC │ Sarah Chen    [×] │  │ │ MR │ Mike Rodriguez [×]│   │
│ │ └────┘                   │  │ └────┘                   │   │
│ └──────────────────────────┘  └──────────────────────────┘   │
│                                                               │
│ Add team members who can help manage this campaign.          │
└───────────────────────────────────────────────────────────────┘

Pills: Blue background (#eff6ff)
Pills: Blue border (#dbeafe)
Count badge: Gray bg, in input
```

## With Selections (Dropdown Open)

```
┌───────────────────────────────────────────────────────────────┐
│ Collaborators (Optional)                                      │
├───────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  🔍 Search team members...▊       [👥 2 selected]      │   │ ← Blue border
│ └─────────────────────────────────────────────────────────┘   │
│ ▼                                                             │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │                                                         │   │
│ │ ☑ ┌────┐ Sarah Chen                                    │   │ ← Checked
│ │   │ SC │ sarah.chen@company.com                        │   │
│ │   └────┘                                                │   │
│ │                                                         │   │
│ │ ☑ ┌────┐ Michael Rodriguez                             │   │ ← Checked
│ │   │ MR │ michael.r@company.com                         │   │
│ │   └────┘                                                │   │
│ │                                                         │   │
│ │ ☐ ┌────┐ Emily Johnson                                 │   │
│ │   │ EJ │ emily.j@company.com                           │   │
│ │   └────┘                                                │   │
│ │                                                         │   │
│ │ ☐ ┌────┐ Jessica Martinez                              │   │
│ │   │ JM │ jessica.m@company.com                         │   │
│ │   └────┘                                                │   │
│ │                                                         │   │
│ │ ☐ ┌────┐ James Anderson                                │   │
│ │   │ JA │ james.a@company.com                           │   │
│ │   └────┘                                                │   │
│ ├─────────────────────────────────────────────────────────┤   │
│ │ ℹ️ Collaborators can view, edit, and receive            │   │
│ │   notifications for this campaign.                      │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌──────────────────────────┐  ┌──────────────────────────┐   │
│ │ ┌────┐                   │  │ ┌────┐                   │   │
│ │ │ SC │ Sarah Chen    [×] │  │ │ MR │ Mike Rodriguez [×]│   │
│ │ └────┘                   │  │ └────┘                   │   │
│ └──────────────────────────┘  └──────────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘

Checkboxes: Blue bg when checked
Checkmark: White ✓
Pills: Remain visible below
```

## Search Filtering

### Before Search
```
┌─────────────────────────────────────────────────────────┐
│  🔍 ▊                                                   │
└─────────────────────────────────────────────────────────┘

5 users visible in dropdown
```

### Typing "sarah"
```
┌─────────────────────────────────────────────────────────┐
│  🔍 sarah▊                                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                                                         │
│ ☐ ┌────┐ Sarah Chen                                    │ ← Only match
│   │ SC │ sarah.chen@company.com                        │
│   └────┘                                                │
│                                                         │
└─────────────────────────────────────────────────────────┘

Other 4 users hidden (filtered out)
```

### No Results
```
┌─────────────────────────────────────────────────────────┐
│  🔍 xyz123▊                                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    ┌────────┐                           │
│                    │   👥   │                           │ ← Large icon
│                    └────────┘                           │
│                                                         │
│            No team members found                        │
│          Try a different search term                    │
│                                                         │
└─────────────────────────────────────────────────────────┘

Icon: Users (gray-300)
Text: Gray-500, center-aligned
```

## Checkbox States

### Unchecked
```
┌────┐
│    │  ← White background
└────┘     Gray border (2px)
           20px x 20px
```

### Checked
```
┌────┐
│ ✓  │  ← Blue background (#3b82f6)
└────┘     Blue border
           White checkmark
```

### Checked + Hover
```
┌────┐
│ ✓  │  ← Darker blue (#2563eb)
└────┘     Smooth transition
```

### Disabled (At Max)
```
┌────┐
│    │  ← Opacity 50%
└────┘     Cursor: not-allowed
           Cannot interact
```

## Avatar Circles

### In Dropdown (36px)
```
┌──────────┐
│          │
│    SC    │  ← Blue gradient bg
│          │     White text, semibold
└──────────┘     36px x 36px
```

### In Pills (24px)
```
┌──────┐
│  SC  │  ← Blue gradient bg
└──────┘     White text
             24px x 24px
             Smaller for pills
```

## User Pills

### Single Pill
```
┌────────────────────────────┐
│ ┌────┐                     │
│ │ SC │ Sarah Chen      [×] │  ← Blue bg (#eff6ff)
│ └────┘                     │     Blue border (#dbeafe)
└────────────────────────────┘     Rounded corners
                                   Padding: 8px 12px
```

### Multiple Pills (Wrapped)
```
┌──────────────────────────┐  ┌──────────────────────────┐
│ ┌────┐                   │  │ ┌────┐                   │
│ │ SC │ Sarah Chen    [×] │  │ │ MR │ Mike Rodriguez [×]│
│ └────┘                   │  │ └────┘                   │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐
│ ┌────┐                   │
│ │ EJ │ Emily Johnson [×] │
│ └────┘                   │
└──────────────────────────┘

Flex-wrap: wrap
Gap: 8px
Multiple rows as needed
```

### Pill with Hover on Remove Button
```
┌────────────────────────────┐
│ ┌────┐                     │
│ │ SC │ Sarah Chen      [×] │  ← × button bg: #bfdbfe (hover)
│ └────┘                     │     Darker blue on hover
└────────────────────────────┘     Transition: 150ms
```

## Count Badge (In Input)

### Badge Appearance
```
┌─────────────────────────────────────────────────────────┐
│  🔍 Search team members...        ┌───────────────┐    │
│                                   │ 👥 3 selected │    │ ← Badge
│                                   └───────────────┘    │
└─────────────────────────────────────────────────────────┘

Background: #f3f4f6 (gray-100)
Text: #4b5563 (gray-600), 12px
Icon: Users, 14px
Padding: 4px 8px
Border-radius: 4px
```

### Badge Variations
```
1 selected  → "👥 1 selected"
5 selected  → "👥 5 selected"
10 selected → "👥 10 selected"

Badge only shows when count > 0
```

## Max Limit Warning

### Warning Message
```
┌───────────────────────────────────────────────────────────────┐
│ ⚠️  Maximum collaborators reached                             │
│    You can add up to 10 collaborators per campaign.          │
│    Remove one to add another.                                │
└───────────────────────────────────────────────────────────────┘

Border: 2px solid #fef3c7 (yellow-200)
Background: #fffbeb (yellow-50)
Icon: AlertCircle (#d97706)
Title: #78350f (yellow-900), 14px, font-medium
Text: #92400e (yellow-700), 12px
Padding: 12px
Border-radius: 8px
```

### Input State at Max
```
┌─────────────────────────────────────────────────────────┐
│  🔍 Search team members...        [👥 10 selected]     │ ← Disabled
└─────────────────────────────────────────────────────────┘

Background: #f9fafb (gray-50)
Cursor: not-allowed
Cannot focus or type
```

### Dropdown State at Max
```
┌─────────────────────────────────────────────────────────┐
│ ☑ ┌────┐ Sarah Chen                                    │ ← Can uncheck
│   │ SC │ sarah.chen@company.com                        │
│   └────┘                                                │
│                                                         │
│ ☐ ┌────┐ Emily Johnson                                 │ ← Disabled
│   │ EJ │ emily.j@company.com                           │   (opacity 50%)
│   └────┘                                                │
└─────────────────────────────────────────────────────────┘

Already selected: Can still uncheck
Not selected: Disabled (opacity 50%, cursor not-allowed)
```

## Auto-save Indicator

### While Saving
```
● Auto-saving collaborators...
└─ Pulsing yellow dot (#eab308)
   Gray text (#6b7280), 12px

Shows for 3 seconds after any change
```

### After Save Complete
```
[Indicator disappears]

Console output:
Collaborators auto-saved: Sarah Chen, Michael Rodriguez
```

## Owner Exclusion States

### Owner: Adithya
```
Available in dropdown:
- Sarah Chen
- Michael Rodriguez
- Emily Johnson
- Jessica Martinez
- James Anderson

Total: 5 users
Adithya: Not shown (he's the owner)
```

### Owner Changes to Sarah
```
Available in dropdown:
- Adithya         ← Now available
- Michael Rodriguez
- Emily Johnson
- Jessica Martinez
- James Anderson

Total: 5 users
Sarah Chen: Not shown (she's now the owner)

If Sarah was a collaborator:
- Her pill disappears automatically
- Count badge updates
- No manual intervention needed
```

## Dropdown List Item States

### Default Item
```
┌─────────────────────────────────────────────────────────┐
│ ☐ ┌────┐ Sarah Chen                                    │
│   │ SC │ sarah.chen@company.com                        │ ← White bg
│   └────┘                                                │
└─────────────────────────────────────────────────────────┘
```

### Hover State
```
┌─────────────────────────────────────────────────────────┐
│ ☐ ┌────┐ Sarah Chen                                    │
│   │ SC │ sarah.chen@company.com                        │ ← Gray bg (#f9fafb)
│   └────┘                                                │
└─────────────────────────────────────────────────────────┘
```

### Checked State
```
┌─────────────────────────────────────────────────────────┐
│ ☑ ┌────┐ Sarah Chen                                    │
│   │ SC │ sarah.chen@company.com                        │ ← Blue checkbox
│   └────┘                                                │
└─────────────────────────────────────────────────────────┘
```

### Disabled State (At Max)
```
┌─────────────────────────────────────────────────────────┐
│ ☐ ┌────┐ Emily Johnson                                 │
│   │ EJ │ emily.j@company.com                           │ ← Opacity 50%
│   └────┘                                                │   Cursor: not-allowed
└─────────────────────────────────────────────────────────┘
```

## Footer Info

```
┌─────────────────────────────────────────────────────────┐
│ ℹ️ Collaborators can view, edit, and receive            │
│   notifications for this campaign.                      │
└─────────────────────────────────────────────────────────┘

Background: #f9fafb (gray-50)
Border-top: 1px solid #e5e7eb (gray-200)
Text: #4b5563 (gray-600), 12px
Icon: Info circle, 14px
Padding: 12px
```

## Helper Text

```
Add team members who can help manage this campaign.
The owner cannot be added as a collaborator.

Color: #6b7280 (gray-500)
Size: 12px
Below component
```

## Animations Timeline

### Opening Dropdown
```
0ms:    User clicks input
---
50ms:   Blue border appears
100ms:  Blue ring appears
150ms:  Dropdown starts fading in + sliding down
200ms:  Dropdown fully visible
250ms:  Animation complete
```

### Adding Pill
```
0ms:    User checks checkbox
---
50ms:   Checkbox fills blue
100ms:  Checkmark appears
150ms:  Pill starts fading in + sliding from left
200ms:  Pill fully visible
250ms:  Animation complete
```

### Removing Pill
```
0ms:    User clicks × button
---
50ms:   Pill starts fading out
100ms:  Pill disappears
150ms:  Other pills shift position
200ms:  Layout settled
```

### Warning Appears
```
0ms:    10th collaborator selected
---
50ms:   Warning starts sliding down
150ms:  Warning fully visible
200ms:  Animation complete
```

## Color Palette Reference

### Input & Dropdown
- Input border (default): #d1d5db (gray-300)
- Input border (focused): #3b82f6 (blue-500)
- Ring (focused): rgba(59, 130, 246, 0.1)
- Dropdown bg: #ffffff (white)
- Dropdown border: #e5e7eb (gray-200)
- Dropdown shadow: 0 10px 25px rgba(0, 0, 0, 0.1)

### Pills
- Background: #eff6ff (blue-50)
- Border: #dbeafe (blue-200)
- Text: #111827 (gray-900)

### Checkboxes
- Unchecked border: #d1d5db (gray-300)
- Checked bg: #3b82f6 (blue-600)
- Checked border: #3b82f6 (blue-600)
- Checkmark: #ffffff (white)

### Count Badge
- Background: #f3f4f6 (gray-100)
- Text: #4b5563 (gray-600)

### Warning Message
- Border: #fef3c7 (yellow-200)
- Background: #fffbeb (yellow-50)
- Icon: #d97706 (yellow-600)
- Title: #78350f (yellow-900)
- Text: #92400e (yellow-700)

### Auto-save Indicator
- Dot: #eab308 (yellow-500)
- Text: #6b7280 (gray-500)

### Avatars
- Gradient: linear-gradient(to-br, #3b82f6, #2563eb)
- Text: #ffffff (white)

### Helper Text & Footer
- Text: #6b7280 (gray-500)
- Footer bg: #f9fafb (gray-50)

## Responsive Behavior

### Desktop
```
Input: Full width of container
Dropdown: Full width, max height 320px
Pills: Wrap to multiple rows
Search: Clear, readable
```

### Tablet
```
Input: Full width
Dropdown: Full width
Pills: 2-3 per row
Touch targets: 44px minimum
```

### Mobile
```
Input: Full width
Dropdown: Full width, scrollable
Pills: 1-2 per row (stack more)
Touch targets: 48px minimum
Larger padding for easier tapping
```

## Edge Cases Visualization

### All 10 Selected
```
┌───────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  🔍 Search...              [👥 10 selected]            │   │ ← Disabled
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐   │
│ │ [SC] Sarah   [×] │ │ [MR] Mike    [×] │ │ [EJ] Emily[×]│   │
│ └──────────────────┘ └──────────────────┘ └──────────────┘   │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐   │
│ │ [JM] Jessica [×] │ │ [JA] James   [×] │ │ [RT] Rob  [×]│   │
│ └──────────────────┘ └──────────────────┘ └──────────────┘   │
│ ... 4 more pills ...                                          │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ⚠️ Maximum collaborators reached                         │   │
│ │    You can add up to 10 collaborators per campaign.    │   │
│ └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### Owner Change Removes Collaborator
```
Before (Owner: Adithya, Collaborators: Sarah + Michael):
┌──────────────────────┐  ┌──────────────────────────┐
│ [SC] Sarah Chen  [×] │  │ [MR] Mike Rodriguez  [×] │
└──────────────────────┘  └──────────────────────────┘

After (Owner: Sarah):
┌──────────────────────────┐
│ [MR] Mike Rodriguez  [×] │  ← Sarah's pill auto-removed
└──────────────────────────┘

Count badge: "👥 2 selected" → "👥 1 selected"
```

### Search with Selected Users
```
Input: "emily"▊
Count badge: "👥 3 selected" (Sarah, Michael, Emily)

Dropdown shows only:
☑ Emily Johnson  ← Checked (already selected)

Pills below still show all 3:
[Sarah] [Michael] [Emily]
```

## All Visual States Summary

1. ✅ Initial empty state
2. ✅ Focused with dropdown open
3. ✅ With selections (pills visible)
4. ✅ Count badge in input
5. ✅ Checkbox states (unchecked/checked/disabled)
6. ✅ Avatar circles (2 sizes)
7. ✅ User pills (blue theme)
8. ✅ Remove button hover
9. ✅ Search filtering
10. ✅ Empty state (no results)
11. ✅ Max limit warning
12. ✅ Input disabled at max
13. ✅ Disabled checkboxes at max
14. ✅ Auto-save indicator
15. ✅ Footer info
16. ✅ Helper text
17. ✅ Slide/fade animations
18. ✅ Owner exclusion

**Status**: All visual states documented ✅
