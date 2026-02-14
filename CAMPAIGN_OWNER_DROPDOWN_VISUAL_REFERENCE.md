# Campaign Owner Dropdown - Visual Reference Guide

## Component Location

```
┌─────────────────────────────────────────────────────────────┐
│ Campaign Wizard - Step 1: Basic Information                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Previous sections: Name, Description, Type, Metrics, Tags] │
│                                                             │
│ Campaign Owner ← NEW SECTION                                │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ [THIS COMPONENT]                                    │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Closed State (Default View)

```
┌───────────────────────────────────────────────────────────────┐
│ Campaign Owner                                                │
├───────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  ┌────┐                                                 │   │
│ │  │ AD │  Adithya (You)                             [▼]│   │
│ │  └────┘  adithya@company.com                           │   │
│ └─────────────────────────────────────────────────────────┘   │
│ The campaign owner will receive notifications...             │
└───────────────────────────────────────────────────────────────┘

Avatar: Blue gradient circle with white "AD" text
Border: Gray (2px)
```

## Hover State

```
┌───────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  ┌────┐                                                 │   │
│ │  │ AD │  Adithya (You)                             [▼]│   │
│ │  └────┘  adithya@company.com                           │   │
│ └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘

Border: Darker gray (hover effect)
Cursor: Pointer
```

## Open State (Dropdown Expanded)

```
┌───────────────────────────────────────────────────────────────┐
│ Campaign Owner                                                │
├───────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  ┌────┐                                                 │   │
│ │  │ AD │  Adithya (You)                             [▲]│   │ ← Blue border + ring
│ │  └────┘  adithya@company.com                           │   │   Chevron rotated
│ └─────────────────────────────────────────────────────────┘   │
│ ▼                                                             │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ [DROPDOWN MENU - SEE BELOW]                             │   │
│ └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## Dropdown Menu - Full View

```
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔍 Search by name or email...                          │ │ ← Search Input
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────┐     │
│ │  ┌────┐                                             │     │
│ │  │ AD │  Adithya (You)                          [✓]│     │ ← Selected (checkmark)
│ │  └────┘  adithya@company.com                       │     │
│ │          [Admin] Sales Director                    │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
│   ┌────┐                                                    │
│   │ SC │  Sarah Chen                                        │ ← Not selected
│   └────┘  sarah.chen@company.com                            │
│            [Manager] Sales Manager                          │
│                                                             │
│   ┌────┐                                                    │
│   │ MR │  Michael Rodriguez                                 │
│   └────┘  michael.r@company.com                             │
│            [Rep] Senior Account Executive                   │
│                                                             │
│   ┌────┐                                                    │
│   │ EJ │  Emily Johnson                                     │
│   └────┘  emily.j@company.com                               │
│            [Rep] Account Executive                          │
│                                                             │
│   ┌────┐                                                    │
│   │ JM │  Jessica Martinez                                  │
│   └────┘  jessica.m@company.com                             │
│            [Rep] Account Executive                          │
│                                                             │
│   ┌────┐                                                    │
│   │ JA │  James Anderson                                    │
│   └────┘  james.a@company.com                               │
│            [Rep] Account Executive                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ℹ️  Campaign owners can edit settings, view analytics,      │ ← Footer
│    and manage campaign execution.                           │
└─────────────────────────────────────────────────────────────┘
```

## Avatar Variations

### Admin Avatar (Adithya)
```
┌────────┐
│   AD   │  ← Purple-ish gradient background
│        │     White bold text
└────────┘     36px x 36px circle
```

### Manager Avatar (Sarah Chen)
```
┌────────┐
│   SC   │  ← Blue gradient background
│        │     White bold text
└────────┘     36px x 36px circle
```

### Rep Avatar (Others)
```
┌────────┐
│   MR   │  ← Blue gradient background
│        │     White bold text
└────────┘     36px x 36px circle
```

## Role Badge Colors

### Admin Badge
```
┌──────────┐
│  Admin   │  ← Purple background (#f3e8ff)
└──────────┘     Purple text (#6b21a8)
                 Small, rounded, medium weight
```

### Manager Badge
```
┌──────────┐
│ Manager  │  ← Blue background (#dbeafe)
└──────────┘     Blue text (#1e40af)
```

### Rep Badge
```
┌──────────┐
│   Rep    │  ← Green background (#d1fae5)
└──────────┘     Green text (#065f46)
```

## Hover States in Dropdown

### Default Item (Not Hovered)
```
┌─────────────────────────────────────────────────────────┐
│  ┌────┐                                                 │
│  │ SC │  Sarah Chen                                     │ ← White background
│  └────┘  sarah.chen@company.com                         │
│          [Manager] Sales Manager                        │
└─────────────────────────────────────────────────────────┘
```

### Hovered Item
```
┌─────────────────────────────────────────────────────────┐
│  ┌────┐                                                 │
│  │ SC │  Sarah Chen                                     │ ← Light blue background
│  └────┘  sarah.chen@company.com                         │   (#eff6ff)
│          [Manager] Sales Manager                        │
└─────────────────────────────────────────────────────────┘
```

### Selected Item (with Checkmark)
```
┌─────────────────────────────────────────────────────────┐
│  ┌────┐                                            ┌──┐ │
│  │ AD │  Adithya (You)                             │✓│ │ ← Gray background
│  └────┘  adithya@company.com                       └──┘ │   Blue checkmark
│          [Admin] Sales Director                         │
└─────────────────────────────────────────────────────────┘
```

### Keyboard Highlighted Item
```
┌─────────────────────────────────────────────────────────┐
│  ┌────┐                                                 │
│  │ EJ │  Emily Johnson                                  │ ← Blue background
│  └────┘  emily.j@company.com                            │   (#eff6ff)
│          [Rep] Account Executive                        │   Highlight from arrow keys
└─────────────────────────────────────────────────────────┘
```

## Search States

### Empty Search (All Users Shown)
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Search by name or email...                          │ ← Placeholder visible
└─────────────────────────────────────────────────────────┘

Shows all 6 users below
```

### Typing Search Query
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 sarah▊                                               │ ← Query entered
└─────────────────────────────────────────────────────────┘

Filters to show only:
  ┌────┐
  │ SC │  Sarah Chen
  └────┘  sarah.chen@company.com
          [Manager] Sales Manager
```

### No Results Found
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 xyz123▊                                              │
└─────────────────────────────────────────────────────────┘

        ┌────────────┐
        │     👤     │  ← Large user icon (gray)
        └────────────┘

        No results found
        Try a different search term
```

## Warning Message States

### No Warning (Current User Selected)
```
┌───────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  ┌────┐                                                 │   │
│ │  │ AD │  Adithya (You)                             [▼]│   │
│ │  └────┘  adithya@company.com                           │   │
│ └─────────────────────────────────────────────────────────┘   │
│ The campaign owner will receive notifications...             │
└───────────────────────────────────────────────────────────────┘

No warning shown ✓
```

### Warning Shown (Different User Selected)
```
┌───────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  ┌────┐                                                 │   │
│ │  │ SC │  Sarah Chen                                [▼]│   │
│ │  └────┘  sarah.chen@company.com                        │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ⚠️  Owner changed                                        │   │ ← Yellow warning box
│ │    Sarah Chen will receive all notifications for this  │   │
│ │    campaign and have full control over campaign        │   │
│ │    settings.                                            │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ The campaign owner will receive notifications...             │
└───────────────────────────────────────────────────────────────┘

Yellow border (#fef3c7)
Yellow background (#fffbeb)
Alert icon on left
Auto-dismisses after 5 seconds
```

## Auto-Save Indicator

### While Saving
```
┌───────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  ┌────┐                                                 │   │
│ │  │ SC │  Sarah Chen                                [▼]│   │
│ │  └────┘  sarah.chen@company.com                        │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ ● Auto-saving owner selection...                             │
│ └─ Pulsing yellow dot                                         │
│                                                               │
│ The campaign owner will receive notifications...             │
└───────────────────────────────────────────────────────────────┘

Shows for 5 seconds after selection change
```

### After Save Complete
```
[Indicator disappears]

Console output:
Campaign owner auto-saved: Sarah Chen
```

## Keyboard Navigation Visual Flow

### Step 1: Open Dropdown
```
User presses Tab → Dropdown button focused
User presses Enter → Dropdown opens
Search input auto-focused ✓
```

### Step 2: Type to Filter
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 emily▊                                               │
└─────────────────────────────────────────────────────────┘

  ┌────┐
  │ EJ │  Emily Johnson
  └────┘  emily.j@company.com
          [Rep] Account Executive
```

### Step 3: Arrow Down
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 emily▊                                               │
└─────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────┐
  │  ┌────┐                                             │
  │  │ EJ │  Emily Johnson                              │ ← Highlighted blue
  │  └────┘  emily.j@company.com                         │
  │          [Rep] Account Executive                     │
  └─────────────────────────────────────────────────────┘
```

### Step 4: Press Enter
```
Dropdown closes
Selected owner updates to Emily Johnson ✓
Warning message appears ✓
Auto-save starts ✓
```

## Chevron Animation

### Closed State
```
[▼]  ← Pointing down
     Rotation: 0deg
```

### Opening (Transition)
```
[⯆]  ← Rotating (mid-animation)
     Rotation: 90deg (halfway)
     Duration: 200ms
```

### Open State
```
[▲]  ← Pointing up
     Rotation: 180deg
```

## Scrolling Behavior

### Short List (Fits in View)
```
┌─────────────────────────────────────┐
│ User 1                              │
│ User 2                              │
│ User 3                              │
│ User 4                              │
│ User 5                              │
│ User 6                              │
└─────────────────────────────────────┘

No scrollbar needed
```

### Long List (Exceeds 300px)
```
┌─────────────────────────────────────┐
│ User 1                              │
│ User 2                              │
│ User 3                              │  } Visible
│ User 4                              │
│ User 5                              │
│ ...                                 │  } Hidden
│ User 10                        [▓]  │  ← Scrollbar
└─────────────────────────────────────┘

Max height: 300px
Overflow-y: auto
```

## Interaction Timeline

### Opening Dropdown
```
0ms:    User clicks dropdown button
---
50ms:   Blue border appears
100ms:  Blue ring appears
150ms:  Menu starts fading in
200ms:  Menu fully visible
250ms:  Search input auto-focused
```

### Selecting User
```
0ms:    User clicks on "Sarah Chen"
---
0ms:    Dropdown closes immediately
50ms:   Button text updates
100ms:  Warning message starts sliding in
150ms:  Warning fully visible
200ms:  Auto-save indicator appears
---
5000ms: Auto-save triggers
5050ms: Auto-save indicator fades out
5100ms: Console logs save message
```

### Keyboard Navigation
```
0ms:    User presses Arrow Down
---
50ms:   Previous highlight clears
100ms:  New highlight appears
150ms:  Transition complete
```

## Mobile View

### Collapsed State (Mobile)
```
┌─────────────────────────────────────┐
│ Campaign Owner                      │
│ ┌───────────────────────────────┐   │
│ │ [AD] Adithya (You)        [▼]│   │
│ │      adithya@company.com      │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘

Full width
Larger touch targets (min 44px)
```

### Expanded State (Mobile)
```
┌─────────────────────────────────────┐
│ ┌───────────────────────────────┐   │
│ │ [AD] Adithya (You)        [▲]│   │
│ └───────────────────────────────┘   │
│ ▼                                   │
│ ┌───────────────────────────────┐   │
│ │ [DROPDOWN MENU]               │   │
│ │ Full width of screen          │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Color Palette Reference

### Avatars
- Gradient: linear-gradient(to-br, #3b82f6, #2563eb)
- Text: #ffffff (white)

### Dropdown Button
- Border (default): #d1d5db (gray-300)
- Border (open): #3b82f6 (blue-500)
- Ring (open): rgba(59, 130, 246, 0.1)
- Background: #ffffff (white)

### Dropdown Menu
- Background: #ffffff (white)
- Border: #e5e7eb (gray-200)
- Shadow: 0 10px 25px rgba(0, 0, 0, 0.1)

### List Item States
- Default: #ffffff (white)
- Hover: #f9fafb (gray-50)
- Highlighted: #eff6ff (blue-50)
- Selected bg: #f9fafb (gray-50)

### Role Badges
- Admin bg: #f3e8ff (purple-100)
- Admin text: #6b21a8 (purple-800)
- Manager bg: #dbeafe (blue-100)
- Manager text: #1e40af (blue-800)
- Rep bg: #d1fae5 (green-100)
- Rep text: #065f46 (green-800)

### Warning Message
- Border: #fef3c7 (yellow-200)
- Background: #fffbeb (yellow-50)
- Text: #78350f (yellow-900)
- Details: #92400e (yellow-700)
- Icon: #d97706 (yellow-600)

### Auto-Save Indicator
- Dot: #eab308 (yellow-500)
- Text: #6b7280 (gray-500)

## Edge Cases Visualization

### Very Long Name
```
┌─────────────────────────────────────┐
│  ┌────┐                             │
│  │ VL │  Very Long Name That Ex...  │ ← Truncated with ellipsis
│  └────┘  verylongemail@compan...    │
│          [Rep] Some Long Title...   │
└─────────────────────────────────────┘
```

### Current User Indicator
```
┌─────────────────────────────────────┐
│  ┌────┐                          ┌─┐│
│  │ AD │  Adithya (You)           │✓││ ← "(You)" in blue
│  └────┘  adithya@company.com     └─┘│   Checkmark on right
│          [Admin] Sales Director     │
└─────────────────────────────────────┘
```

### Single Result from Search
```
Search: "adithya"

  ┌────┐
  │ AD │  Adithya (You)                          [✓]
  └────┘  adithya@company.com
          [Admin] Sales Director

Only one result shown ✓
```

## All Visual States Summary

1. ✅ Closed state (gray border)
2. ✅ Hover state (darker border)
3. ✅ Open state (blue border + ring)
4. ✅ Chevron rotation (0° to 180°)
5. ✅ Avatar circles (gradient + initials)
6. ✅ Role badges (color-coded)
7. ✅ Checkmark on selected
8. ✅ Blue highlight on hover
9. ✅ Blue highlight on keyboard nav
10. ✅ "(You)" indicator
11. ✅ Search input with icon
12. ✅ Empty state (no results)
13. ✅ Warning message (yellow)
14. ✅ Auto-save indicator (pulsing)
15. ✅ Footer info box
16. ✅ Helper text below
17. ✅ Scrollbar (if needed)
18. ✅ Slide/fade animations

**Status**: All visual states documented ✅
