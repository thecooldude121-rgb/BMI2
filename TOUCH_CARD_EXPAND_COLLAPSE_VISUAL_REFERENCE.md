# Touch Card Expand/Collapse - Visual Reference

## Card Anatomy

### Collapsed State
```
┌────────────────────────────────────────────────────────────────────┐
│  ┌──┐  TOUCH 2 - Follow-up                           [⋮]  [▶]     │
│  │2 │  Timing: Wait 3 days  |  Channel: 📧 Email                  │
│  └──┘  Subject: Following up on our conversation...               │
└────────────────────────────────────────────────────────────────────┘
 ↑     ↑                                                  ↑    ↑
Badge Title                                            Menu Arrow
```

### Expanded State
```
┌────────────────────────────────────────────────────────────────────┐
│  ┌──┐  TOUCH 2 - Follow-up                           [⋮]  [▼]     │
│  │2 │  Timing: Wait 3 days  |  Channel: 📧 Email                  │
│  └──┘                                                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Touch Name                                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Follow-up                                                  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Channel                    Delay After Previous                   │
│  ┌──────────────────┐       ┌──────┐  ┌────────────────┐         │
│  │ 📧 Email         │       │  3   │  │ days           │         │
│  └──────────────────┘       └──────┘  └────────────────┘         │
│                                                                     │
│  Subject Line                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Following up on our conversation...                        │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Email Body                                                        │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ Hi {{firstName}},                                          │   │
│  │                                                            │   │
│  │ I wanted to follow up on our conversation last week...    │   │
│  │                                                            │   │
│  │ Best regards,                                              │   │
│  │ {{senderName}}                                             │   │
│  └────────────────────────────────────────────────────────────┘   │
│  Available variables: {{firstName}}, {{lastName}}, {{company}}    │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## Arrow Icon States

### Right Arrow (Collapsed)
```
[▶]  ← Points right
     Rotation: 0°
     Indicates: "Click to expand"
```

### Down Arrow (Expanded)
```
[▼]  ← Points down
     Rotation: 90° clockwise
     Indicates: "Click to collapse"
```

### Rotation Animation
```
Frame 1 (0ms):    ▶  (0°)
Frame 2 (75ms):   ◢  (22.5°)
Frame 3 (150ms):  ◣  (45°)
Frame 4 (225ms):  ◤  (67.5°)
Frame 5 (300ms):  ▼  (90°)
```

---

## Color Scheme

### Header Section
```
Background (normal):     white (#ffffff)
Background (hover):      gray-50 (#f9fafb)
Border:                  gray-200 (#e5e7eb)
```

### Badge
```
Background:              blue-100 (#dbeafe)
Text:                    blue-700 (#1d4ed8)
Size:                    40x40px
Border-radius:           50% (circle)
```

### Text Colors
```
Title:                   gray-900 (#111827)
Metadata:                gray-600 (#4b5563)
Subject preview:         gray-500 (#6b7280)
Labels:                  gray-700 (#374151)
Helper text:             gray-500 (#6b7280)
```

### Buttons
```
Background (normal):     transparent
Background (hover):      gray-200 (#e5e7eb)
Icon color:              gray-700 (#374151)
Menu icon:               gray-500 (#6b7280)
```

### Inputs
```
Border (normal):         gray-300 (#d1d5db)
Border (focus):          blue-500 (#3b82f6)
Focus ring:              blue-500 (#3b82f6)
Background:              white (#ffffff)
Text:                    gray-900 (#111827)
Placeholder:             gray-400 (#9ca3af)
```

---

## Spacing & Dimensions

### Card
```
Padding:                 24px (p-6)
Border width:            1px
Border radius:           8px (rounded-lg)
Margin between cards:    16px (space-y-4)
```

### Header
```
Padding:                 24px (p-6)
Gap between elements:    16px (gap-4)
```

### Badge
```
Width:                   40px (w-10)
Height:                  40px (h-10)
Font size:               14px (text-sm)
Font weight:             700 (font-bold)
```

### Title
```
Font size:               18px (text-lg)
Font weight:             600 (font-semibold)
Line height:             28px
```

### Metadata
```
Font size:               14px (text-sm)
Gap between items:       16px (gap-4)
```

### Body Section
```
Padding top:             0px (pt-0)
Padding horizontal:      24px (px-6)
Padding bottom:          24px (pb-6)
Gap between fields:      16px (space-y-4)
```

### Inputs
```
Padding:                 8px 12px (px-3 py-2)
Font size:               14px (text-sm)
Border radius:           8px (rounded-lg)
Border width:            1px
```

### Textarea
```
Rows:                    6
Padding:                 8px 12px (px-3 py-2)
Font size:               14px (text-sm)
Border radius:           8px (rounded-lg)
Resize:                  none
```

---

## State Transitions

### Collapse Sequence (300ms total)
```
Frame:     0ms    75ms   150ms  225ms  300ms
────────────────────────────────────────────
Height:    100%   75%    50%    25%    0%
Opacity:   100%   75%    50%    25%    0%
Arrow:     ▼      ◣      ◤      ◢      ▶
Visible:   Yes    Yes    Partial No    No
```

### Expand Sequence (300ms total)
```
Frame:     0ms    75ms   150ms  225ms  300ms
────────────────────────────────────────────
Height:    0%     25%    50%    75%    100%
Opacity:   0%     25%    50%    75%    100%
Arrow:     ▶      ◢      ◤      ◣      ▼
Visible:   No     No     Partial Yes   Yes
```

---

## Full Page Layout Examples

### All Collapsed (Clean Overview)
```
┌─────────────────────────────────────────────────────────────┐
│  Sequence Touches (5/10)               [+ Add Touch]        │
│                                                              │
│  ┌─────────────────────────────────────────────────┐        │
│  │  [1]  TOUCH 1 - Initial Outreach      [⋮] [▶]  │        │
│  │       Timing: Immediately | Channel: 📧 Email   │        │
│  │       Subject: Let's connect and explore...     │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  ┌─────────────────────────────────────────────────┐        │
│  │  [2]  TOUCH 2 - Follow-up             [⋮] [▶]  │        │
│  │       Timing: Wait 3 days | Channel: 📧 Email   │        │
│  │       Subject: Following up on our...           │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  ┌─────────────────────────────────────────────────┐        │
│  │  [3]  TOUCH 3 - Value Share           [⋮] [▶]  │        │
│  │       Timing: Wait 4 days | Channel: 📧 Email   │        │
│  │       Subject: Thought you might find...        │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  ┌─────────────────────────────────────────────────┐        │
│  │  [4]  TOUCH 4 - Check-in              [⋮] [▶]  │        │
│  │       Timing: Wait 5 days | Channel: 📧 Email   │        │
│  │       Subject: Just checking in...              │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  ┌─────────────────────────────────────────────────┐        │
│  │  [5]  TOUCH 5 - Break-up Email        [⋮] [▶]  │        │
│  │       Timing: Wait 4 days | Channel: 📧 Email   │        │
│  │       Subject: Should I close your file?        │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  ┌─────────────────────────────────────────────────┐        │
│  │         [+]  Add Another Touch                  │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Touch 1 Expanded (Default View)
```
┌─────────────────────────────────────────────────────────────┐
│  Sequence Touches (5/10)               [+ Add Touch]        │
│                                                              │
│  ┌─────────────────────────────────────────────────┐        │
│  │  [1]  TOUCH 1 - Initial Outreach      [⋮] [▼]  │        │
│  │       Timing: Immediately | Channel: 📧 Email   │        │
│  ├─────────────────────────────────────────────────┤        │
│  │                                                  │        │
│  │  Touch Name                                     │        │
│  │  ┌────────────────────────────────────────┐    │        │
│  │  │ Initial Outreach                       │    │        │
│  │  └────────────────────────────────────────┘    │        │
│  │                                                  │        │
│  │  Channel          Delay After Previous          │        │
│  │  ┌─────────┐      ┌───┐  ┌────────┐           │        │
│  │  │📧 Email │      │ 0 │  │ days   │           │        │
│  │  └─────────┘      └───┘  └────────┘           │        │
│  │                                                  │        │
│  │  Subject Line                                   │        │
│  │  ┌────────────────────────────────────────┐    │        │
│  │  │ Let's connect and explore synergies    │    │        │
│  │  └────────────────────────────────────────┘    │        │
│  │                                                  │        │
│  │  Email Body                                     │        │
│  │  ┌────────────────────────────────────────┐    │        │
│  │  │ Hi {{firstName}},                      │    │        │
│  │  │                                        │    │        │
│  │  │ I came across your profile and...     │    │        │
│  │  │                                        │    │        │
│  │  │ Best regards,                          │    │        │
│  │  │ {{senderName}}                         │    │        │
│  │  └────────────────────────────────────────┘    │        │
│  │  Available variables: {{firstName}}...         │        │
│  │                                                  │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  ┌─────────────────────────────────────────────────┐        │
│  │  [2]  TOUCH 2 - Follow-up             [⋮] [▶]  │        │
│  │       Timing: Wait 3 days | Channel: 📧 Email   │        │
│  │       Subject: Following up on our...           │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  ... (more collapsed touches)                               │
└─────────────────────────────────────────────────────────────┘
```

### Mixed State (Multiple Expanded)
```
┌─────────────────────────────────────────────────────────────┐
│  Sequence Touches (5/10)               [+ Add Touch]        │
│                                                              │
│  [1] TOUCH 1 - Expanded                            [⋮] [▼]  │
│  ├─ All fields visible ─────────────────────────────────┤   │
│  │  [Expanded content...]                              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  [2] TOUCH 2 - Collapsed                           [⋮] [▶]  │
│                                                              │
│  [3] TOUCH 3 - Expanded                            [⋮] [▼]  │
│  ├─ All fields visible ─────────────────────────────────┤   │
│  │  [Expanded content...]                              │   │
│  └────────────────────────────────────────────────────┘   │
│                                                              │
│  [4] TOUCH 4 - Collapsed                           [⋮] [▶]  │
│                                                              │
│  [5] TOUCH 5 - Expanded                            [⋮] [▼]  │
│  ├─ All fields visible ─────────────────────────────────┤   │
│  │  [Expanded content...]                              │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Hover State Visualizations

### Header Hover (Collapsed)
```
Before hover:
┌─────────────────────────────────────────────────┐
│  [2]  TOUCH 2 - Follow-up           [⋮] [▶]    │  ← White bg
│       Timing: Wait 3 days | Channel: Email      │
└─────────────────────────────────────────────────┘

During hover:
┌─────────────────────────────────────────────────┐
│  [2]  TOUCH 2 - Follow-up           [⋮] [▶]    │  ← Light gray bg
│       Timing: Wait 3 days | Channel: Email      │     (hover effect)
└─────────────────────────────────────────────────┘
     ↑ Cursor: pointer
```

### Button Hover
```
Normal:
[⋮]  ← Transparent bg

Hover:
┌───┐
│ ⋮ │  ← Gray bg, rounded
└───┘

Normal:
[▶]  ← Transparent bg

Hover:
┌───┐
│ ▶ │  ← Gray bg, rounded
└───┘
```

---

## Channel Icon Variations

### Email Channel
```
📧 Email
or
[📧] Email  (with icon)
```

### LinkedIn Channel
```
💼 LinkedIn
or
[💼] LinkedIn  (with icon)
```

---

## Touch Badge Variations

### Standard Badge
```
┌────┐
│ 2  │  ← Blue bg, blue text, bold
└────┘
```

### First Touch
```
┌────┐
│ 1  │  ← Same styling, number 1
└────┘
```

### Tenth Touch
```
┌────┐
│ 10 │  ← Slightly smaller font to fit
└────┘
```

---

## Subject Line Preview

### With Subject (Collapsed)
```
TOUCH 2 - Follow-up                           [⋮] [▶]
Timing: Wait 3 days | Channel: 📧 Email
Subject: Following up on our conversation last week...
         ↑ Gray text, truncated with ellipsis
```

### Without Subject (Collapsed)
```
TOUCH 6 - Touch 6                             [⋮] [▶]
Timing: Wait 3 days | Channel: 📧 Email
(No subject line shown)
         ↑ Clean, no empty "Subject:" label
```

### Long Subject (Truncated)
```
Subject: This is a very long subject line that will be...
         ↑ Truncates with ellipsis to fit width
```

---

## Field Layout in Expanded State

### Two-Column Layout
```
┌────────────────────────┬────────────────────────┐
│ Channel                │ Delay After Previous   │
│ ┌──────────────┐       │ ┌────┐  ┌────────┐   │
│ │ 📧 Email     │       │ │ 3  │  │ days   │   │
│ └──────────────┘       │ └────┘  └────────┘   │
└────────────────────────┴────────────────────────┘
```

### Full-Width Fields
```
┌──────────────────────────────────────────────┐
│ Touch Name                                   │
│ ┌────────────────────────────────────────┐  │
│ │ Follow-up                               │  │
│ └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Subject Line                                 │
│ ┌────────────────────────────────────────┐  │
│ │ Following up...                         │  │
│ └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Email Body                                   │
│ ┌────────────────────────────────────────┐  │
│ │ Hi {{firstName}},                      │  │
│ │                                        │  │
│ │ [Multi-line content...]                │  │
│ │                                        │  │
│ └────────────────────────────────────────┘  │
│ Available variables: {{firstName}}...       │
└──────────────────────────────────────────────┘
```

---

## Animation Frames (Expand)

### Frame 0 (0ms) - Collapsed
```
┌─────────────────────────────────────┐
│  [2]  TOUCH 2             [⋮] [▶]  │
│       Timing: ... | Channel: ...    │
│       Subject: ...                  │
└─────────────────────────────────────┘
```

### Frame 1 (75ms) - 25% Expanded
```
┌─────────────────────────────────────┐
│  [2]  TOUCH 2             [⋮] [◢]  │
│       Timing: ... | Channel: ...    │
├─────────────────────────────────────┤
│  Touch Name                         │  ← Fading in
│  ┌───────────────────────────┐     │     25% opacity
│  │ ...                       │     │
└─────────────────────────────────────┘
```

### Frame 2 (150ms) - 50% Expanded
```
┌─────────────────────────────────────┐
│  [2]  TOUCH 2             [⋮] [◤]  │
│       Timing: ... | Channel: ...    │
├─────────────────────────────────────┤
│  Touch Name                         │
│  ┌───────────────────────────┐     │  ← 50% opacity
│  │ Follow-up                 │     │
│  └───────────────────────────┘     │
│                                     │
│  Channel         Delay              │
│  ┌───────┐      ┌──┐  ┌─────┐     │
│  │ Email │      │3 │  │days │     │
└─────────────────────────────────────┘
```

### Frame 3 (225ms) - 75% Expanded
```
┌─────────────────────────────────────┐
│  [2]  TOUCH 2             [⋮] [◣]  │
│       Timing: ... | Channel: ...    │
├─────────────────────────────────────┤
│                                     │
│  Touch Name                         │
│  ┌───────────────────────────┐     │
│  │ Follow-up                 │     │  ← 75% opacity
│  └───────────────────────────┘     │
│                                     │
│  Channel         Delay              │
│  ┌───────┐      ┌──┐  ┌─────┐     │
│  │ Email │      │3 │  │days │     │
│  └───────┘      └──┘  └─────┘     │
│                                     │
│  Subject Line                       │
│  ┌───────────────────────────┐     │
│  │ Following up...           │     │
└─────────────────────────────────────┘
```

### Frame 4 (300ms) - 100% Expanded
```
┌─────────────────────────────────────┐
│  [2]  TOUCH 2             [⋮] [▼]  │
│       Timing: ... | Channel: ...    │
├─────────────────────────────────────┤
│                                     │
│  Touch Name                         │
│  ┌───────────────────────────┐     │
│  │ Follow-up                 │     │  ← 100% opacity
│  └───────────────────────────┘     │     Fully visible
│                                     │
│  Channel         Delay              │
│  ┌───────┐      ┌──┐  ┌─────┐     │
│  │ Email │      │3 │  │days │     │
│  └───────┘      └──┘  └─────┘     │
│                                     │
│  Subject Line                       │
│  ┌───────────────────────────┐     │
│  │ Following up...           │     │
│  └───────────────────────────┘     │
│                                     │
│  Email Body                         │
│  ┌───────────────────────────┐     │
│  │ Hi {{firstName}},         │     │
│  │ ...                       │     │
│  └───────────────────────────┘     │
│  Available variables: ...          │
└─────────────────────────────────────┘
```

---

## Focus States

### Subject Input Focused
```
Subject Line
┌─────────────────────────────────────┐
│ Following up on our conversation_   │ ← Blue ring
└─────────────────────────────────────┘  ← Blue border
  ↑ 2px blue ring (focus:ring-2)
  ↑ Blue border (focus:border-blue-500)
```

### Body Textarea Focused
```
Email Body
┌─────────────────────────────────────┐
│ Hi {{firstName}},_                  │ ← Blue ring
│                                     │ ← Blue border
│ I wanted to follow up...            │
│                                     │
└─────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop (≥1024px)
```
┌───────────────────────────────────────────────────┐
│  [2]  TOUCH 2 - Follow-up           [⋮]  [▶]     │
│       Timing: Wait 3 days | Channel: 📧 Email     │
│       Subject: Following up on our conversation   │
└───────────────────────────────────────────────────┘
     ↑ Full width, no wrapping
```

### Tablet (768px - 1023px)
```
┌─────────────────────────────────────────┐
│  [2]  TOUCH 2 - Follow-up    [⋮]  [▶]  │
│       Timing: Wait 3 days | ...         │
│       Subject: Following up...          │
└─────────────────────────────────────────┘
     ↑ Slight wrapping on metadata
```

### Mobile (<768px)
```
┌─────────────────────────────┐
│  [2]  TOUCH 2 - Follow-up   │
│       [⋮]  [▶]              │
│       Timing: Wait 3 days   │
│       Channel: 📧 Email     │
│       Subject: Following... │
└─────────────────────────────┘
     ↑ Metadata stacks vertically
```

---

## Border States

### Normal
```
border: 1px solid #e5e7eb (gray-200)
```

### Hover
```
border: 1px solid #e5e7eb (gray-200)
shadow: 0 4px 6px rgba(0,0,0,0.07) (hover:shadow-md)
```

### Separator (Expanded)
```
border-top: 1px solid #f3f4f6 (gray-100)
↑ Between header and body
```

---

## Empty State (No Subject)

### Collapsed - No Subject
```
┌─────────────────────────────────────┐
│  [6]  TOUCH 6             [⋮] [▶]  │
│       Timing: Wait 3 days | Email   │
│       (no subject line shown)       │
└─────────────────────────────────────┘
     ↑ Clean, no "Subject:" label
```

### Expanded - Empty Subject Input
```
Subject Line
┌─────────────────────────────────────┐
│ Enter subject line...               │ ← Placeholder
└─────────────────────────────────────┘
```

---

## Status: ✅ Complete

All visual states documented with ASCII art and specifications.
