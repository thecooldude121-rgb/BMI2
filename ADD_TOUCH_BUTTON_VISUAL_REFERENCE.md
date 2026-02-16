# Add Touch Button - Visual Reference

## Button Location & Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  Campaign Wizard - Step 3: Build Sequence                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Sequence Overview Panel                                     │ │
│  │  Template: Cold Outreach | Touches: 5 | Duration: 14 days   │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Sequence Touches (5/10)              ┌──────────────────────┐    │
│                                        │ [+]  Add Touch       │ ←  │
│                                        └──────────────────────┘    │
│  ┌────────────────────────────────────────────────┐               │
│  │ [1] Touch 1 - Initial Outreach                 │               │
│  │     Email • Send immediately                   │               │
│  └────────────────────────────────────────────────┘               │
│                                                                     │
│  ┌────────────────────────────────────────────────┐               │
│  │ [2] Touch 2 - Follow-up                        │               │
│  │     Email • Wait 3 days                        │               │
│  └────────────────────────────────────────────────┘               │
│                                                                     │
│  ... (more touches)                                                │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

**Button Position:**
- Aligned to the right
- Same row as "Sequence Touches" header
- Above all touch cards
- Fixed height: 40px (py-2)
- Responsive: Stays visible on scroll

---

## Button State Variations

### 1. Enabled State (< 10 touches)

```
┌──────────────────────┐
│  [+]  Add Touch      │  ← bg-blue-600, text-white
└──────────────────────┘

Hover:
┌──────────────────────┐
│  [+]  Add Touch      │  ← bg-blue-700, shadow-md
└──────────────────────┘
       ↑ Darker blue, larger shadow
```

**CSS Classes:**
```tsx
bg-blue-600
text-white
hover:bg-blue-700
shadow-sm
hover:shadow-md
transition-all duration-200
```

**Tooltip:** "Add new touch (Ctrl/Cmd + N)"

### 2. Disabled State (≥ 10 touches)

```
┌──────────────────────┐
│  [+]  Add Touch      │  ← bg-gray-300, text-gray-500
└──────────────────────┘
     ↑ No hover effect, cursor: not-allowed
```

**CSS Classes:**
```tsx
bg-gray-300
text-gray-500
cursor-not-allowed
```

**Tooltip:** "Maximum 10 touches per campaign"

### 3. Active/Pressed State

```
┌──────────────────────┐
│  [+]  Add Touch      │  ← bg-blue-800 (brief flash)
└──────────────────────┘
```

Brief visual feedback on click before action executes.

---

## Touch Counter Display

### Various States

**No touches:**
```
Sequence Touches                        [+ Add Touch]
(counter hidden when empty)
```

**1-9 touches:**
```
Sequence Touches (1/10)                 [+ Add Touch] ← Blue
Sequence Touches (5/10)                 [+ Add Touch] ← Blue
Sequence Touches (9/10)                 [+ Add Touch] ← Blue
```

**10 touches (maximum):**
```
Sequence Touches (10/10)                [+ Add Touch] ← Gray
                   ↑ At max                        ↑ Disabled
```

---

## Click Flow Visualization

### Step-by-Step Visual Flow

#### Before Click (5 touches)
```
Sequence Touches (5/10)                     [+ Add Touch]

┌─────────────────────────────────────┐
│ [5] Touch 5 - Break-up Email        │
│     Email • Wait 4 days             │
│     Subject: Should I close...      │
└─────────────────────────────────────┘

┌──────────────────────────────────────┐
│         [+] Add Another Touch        │ ← Dashed border button
└──────────────────────────────────────┘
```

#### During Click (processing)
```
User clicks → System processes...

1. Check count: 5 < 10 ✓
2. Create Touch 6
3. Add to sequences
4. Expand touch
5. Trigger scroll
```

#### After Click (6 touches, new touch visible)
```
Sequence Touches (6/10)                     [+ Add Touch]
                ↑ Updated

┌─────────────────────────────────────┐
│ [5] Touch 5 - Break-up Email        │
│     Email • Wait 4 days             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐ ← NEW TOUCH (scrolled to)
│ [6] Touch 6                         │
│     Email • Wait 3 days             │
│                                      │
│  Subject Line:                      │
│  ┌─────────────────────────────┐   │
│  │ [cursor here]_              │   │ ← Auto-focused
│  └─────────────────────────────┘   │
│                                      │
│  Email Body:                        │
│  ┌─────────────────────────────┐   │
│  │ Hi {{firstName}},           │   │
│  │                             │   │
│  │ [Your message here]         │   │
│  │                             │   │
│  │ Best regards,               │   │
│  │ {{senderName}}              │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

┌──────────────────────────────────────┐
│         [+] Add Another Touch        │
└──────────────────────────────────────┘

┌────────────────────┐
│ ✓ Touch 6 added    │ ← Success toast
└────────────────────┘
```

---

## Maximum Touches Warning Modal

### Modal Trigger & Display

#### Trying to Add 11th Touch
```
User at 10 touches:

Sequence Touches (10/10)                [+ Add Touch] ← Gray

User clicks gray button
         ↓
    Modal appears
```

#### Modal Layout
```
┌═══════════════════════════════════════════════════════════┐
║  ╔═══════════════════════════════════════════════════╗    ║
║  ║                                                 [X]║    ║
║  ║  ⚠️   Maximum Touches Reached                      ║    ║
║  ║                                                    ║    ║
║  ║  You've reached the maximum limit of 10 touches  ║    ║
║  ║  per campaign. To add more touches, please        ║    ║
║  ║  remove an existing touch first.                  ║    ║
║  ║                                                    ║    ║
║  ║  ┌────────────────────────────────────────────┐  ║    ║
║  ║  │ 💡 Why this limit?                         │  ║    ║
║  ║  │                                            │  ║    ║
║  ║  │ Campaigns with more than 10 touches       │  ║    ║
║  ║  │ typically have diminishing returns and    │  ║    ║
║  ║  │ may appear overly aggressive to           │  ║    ║
║  ║  │ prospects.                                │  ║    ║
║  ║  └────────────────────────────────────────────┘  ║    ║
║  ║                                                    ║    ║
║  ║                  ┌──────────────┐                 ║    ║
║  ║                  │ OK, Got It   │                 ║    ║
║  ║                  └──────────────┘                 ║    ║
║  ╚═══════════════════════════════════════════════════╝    ║
└═══════════════════════════════════════════════════════════┘
         ↑ Semi-transparent backdrop
```

#### Modal Components
1. **Warning Icon:** Large amber triangle with exclamation
2. **Title:** "Maximum Touches Reached" (bold)
3. **Message:** Explanation of limit
4. **Callout Box:** Educational content with light amber background
5. **Button:** Blue "OK, Got It" button
6. **Close X:** Top right corner
7. **Backdrop:** Dark overlay, clickable to close

---

## Empty State Flow

### Starting from Scratch (0 touches)

```
Sequence Touches                        [+ Add Touch] ← Blue, enabled

┌────────────────────────────────────────────────────────┐
│                        ╭─────╮                          │
│                        │ [+] │                          │
│                        ╰─────╯                          │
│                  (Gray circle icon)                     │
│                                                         │
│                   No touches yet                        │
│                                                         │
│     Add your first touch to start building your        │
│                      sequence                           │
│                                                         │
│              ┌─────────────────────┐                   │
│              │ [+] Add First Touch │ ← Blue button     │
│              └─────────────────────┘                   │
│                                                         │
└────────────────────────────────────────────────────────┘
```

#### After Adding First Touch
```
Sequence Touches (1/10)                 [+ Add Touch]

┌─────────────────────────────────────┐
│ [1] Touch 1                         │ ← Expanded by default
│     Email • Wait 3 days             │
│                                      │
│  Subject: [cursor]_                 │ ← Focused
│                                      │
│  Body:                              │
│  Hi {{firstName}},                  │
│  [Your message here]                │
│  Best regards,                      │
│  {{senderName}}                     │
└─────────────────────────────────────┘

┌──────────────────────────────────────┐
│         [+] Add Another Touch        │
└──────────────────────────────────────┘
```

---

## Progressive Addition States

### 1 Touch
```
(1/10) [+ Add Touch] ← Blue

[1] Touch 1
```

### 5 Touches (from template)
```
(5/10) [+ Add Touch] ← Blue

[1] Touch 1
[2] Touch 2
[3] Touch 3
[4] Touch 4
[5] Touch 5

[+] Add Another Touch
```

### 6 Touches (1 custom added)
```
(6/10) [+ Add Touch] ← Blue

[1] Touch 1
[2] Touch 2
[3] Touch 3
[4] Touch 4
[5] Touch 5
[6] Touch 6 ← NEW (expanded)

[+] Add Another Touch
```

### 9 Touches
```
(9/10) [+ Add Touch] ← Blue (one more left)

[1] through [9] visible

[+] Add Another Touch
```

### 10 Touches (maximum)
```
(10/10) [+ Add Touch] ← Gray (disabled)

[1] through [10] visible

(No "Add Another Touch" button)
```

---

## Scroll Animation Sequence

### Frame-by-Frame Visualization

#### Frame 1: Initial State (before click)
```
╔═══════════ VIEWPORT ═══════════╗
║ [3] Touch 3                     ║
║ [4] Touch 4                     ║
║ [5] Touch 5                     ║
║ [+] Add Another Touch           ║
║                                 ║ ← User clicks here
╚═════════════════════════════════╝
```

#### Frame 2: Touch Added (not visible yet)
```
╔═══════════ VIEWPORT ═══════════╗
║ [3] Touch 3                     ║
║ [4] Touch 4                     ║
║ [5] Touch 5                     ║
║ [+] Add Another Touch           ║
║                                 ║
╚═════════════════════════════════╝

Below viewport:
[6] Touch 6 ← Just created
```

#### Frame 3: Scrolling (animation in progress)
```
╔═══════════ VIEWPORT ═══════════╗
║ [4] Touch 4                     ║ ← Moving up
║ [5] Touch 5                     ║
║ [6] Touch 6                     ║ ← Coming into view
║ [+] Add Another Touch           ║
║                                 ║
╚═════════════════════════════════╝
```

#### Frame 4: Centered (scroll complete)
```
╔═══════════ VIEWPORT ═══════════╗
║                                 ║
║ [6] Touch 6                     ║ ← Centered
║     Email • Wait 3 days         ║
║     Subject: [cursor]_          ║ ← Focus applied
║     Body: (expanded)            ║
║                                 ║
║ [+] Add Another Touch           ║
╚═════════════════════════════════╝

✓ Touch 6 added ← Toast appears
```

**Timing:**
- 100ms: Wait for DOM update
- 300ms: Smooth scroll animation
- 500ms: Apply focus after scroll settles

---

## Keyboard Shortcut Visualization

### Windows/Linux
```
┌─────┐     ┌───┐
│ Ctrl│  +  │ N │  →  Add Touch
└─────┘     └───┘
```

### Mac
```
┌─────┐     ┌───┐
│ Cmd │  +  │ N │  →  Add Touch
└─────┘     └───┘
```

### Behavior at Various States

**At 5 touches:**
```
Press Ctrl/Cmd + N
       ↓
Touch 6 added
Page scrolls to Touch 6
Subject input focused
```

**At 10 touches:**
```
Press Ctrl/Cmd + N
       ↓
⚠️ Maximum Touches Reached modal appears
No touch added
```

**During modal display:**
```
Press Ctrl/Cmd + N
       ↓
(Ignored - modal already open)
```

---

## Channel Inheritance Visual

### Email → Email Inheritance
```
Current: [5] Email touch exists

User clicks Add Touch
         ↓
New:     [6] Email touch created
         (Inherits Email channel)
```

### LinkedIn → LinkedIn Inheritance
```
Current: [3] LinkedIn touch exists

User clicks Add Touch
         ↓
New:     [4] LinkedIn touch created
         (Inherits LinkedIn channel)
         Shows LinkedIn message field
```

### First Touch (no previous)
```
Current: (empty sequence)

User clicks Add Touch
         ↓
New:     [1] Email touch created
         (Defaults to Email)
```

---

## Overview Panel Updates

### Before Adding Touch
```
┌──────────────────────────────────────────────────────────────────┐
│ [📧] Cold Outreach | Total: 5 | Duration: 14 days | Email        │
└──────────────────────────────────────────────────────────────────┘
```

### Immediately After Adding Touch 6
```
┌──────────────────────────────────────────────────────────────────┐
│ [📧] Cold Outreach | Total: 6 | Duration: 17 days | Email        │
└──────────────────────────────────────────────────────────────────┘
                              ↑ +1         ↑ +3 days
```

### After Adding Touch 10
```
┌──────────────────────────────────────────────────────────────────┐
│ [📧] Cold Outreach | Total: 10 | Duration: 29 days | Email       │
└──────────────────────────────────────────────────────────────────┘
                              ↑ Max         ↑ Cumulative
```

**Calculation:**
- Touch 1-5: 14 days (from template)
- Touch 6-10: 5 × 3 days = 15 days
- **Total: 29 days**

---

## Button Dashed Alternative

### Bottom "Add Another Touch" Button

```
┌────────────────────────────────────────────────────────┐
│         ╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╮                │
│         ┆  [+]  Add Another Touch   ┆  ← Dashed border │
│         ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯                │
└────────────────────────────────────────────────────────┘

Hover:
┌────────────────────────────────────────────────────────┐
│         ╭╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╮                │
│         ┆  [+]  Add Another Touch   ┆  ← Blue dashes   │
│         ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯                │
└────────────────────────────────────────────────────────┘
```

**States:**
- **Default:** Gray dashed border, gray text
- **Hover:** Blue dashed border, blue text
- **Hidden:** When at 10 touches

This provides a second entry point for adding touches, positioned naturally at the end of the sequence.

---

## Responsive Behavior

### Desktop (≥1024px)
```
Sequence Touches (5/10)                           [+ Add Touch]
←────────────────── Wide gap ──────────────────────────────→
```

### Tablet (768px - 1023px)
```
Sequence Touches (5/10)              [+ Add Touch]
←──────────── Medium gap ─────────────────────→
```

### Mobile (<768px)
```
Sequence Touches (5/10)
                          [+ Add Touch]
                          ↑ May wrap to new line
```

Button remains accessible at all screen sizes.

---

## Touch Card Expanded vs Collapsed

### Collapsed (default for template touches)
```
┌─────────────────────────────────────┐
│ [2] Follow-up                       │
│     Email • Wait 3 days             │
│     Subject: Following up...        │
└─────────────────────────────────────┘
     ↑ Summary view only
```

### Expanded (default for new touches)
```
┌─────────────────────────────────────┐
│ [6] Touch 6                         │
│     Email • Wait 3 days             │
│                                      │
│  ┌───────────────────────────────┐ │
│  │ Enter subject line...         │ │ ← Input field
│  └───────────────────────────────┘ │
│                                      │
│  ┌───────────────────────────────┐ │
│  │ Hi {{firstName}},             │ │
│  │                               │ │
│  │ [Your message here]           │ │ ← Textarea
│  │                               │ │
│  │ Best regards,                 │ │
│  │ {{senderName}}                │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
     ↑ Editable view
```

New touches expand automatically to encourage editing.

---

## Success Toast Animation

### Toast Appearance
```
Page top right:

┌──────────────────────┐
│ ✓ Touch 6 added      │ ← Slides in from right
└──────────────────────┘
    ↓ 3 seconds
    ↓ Fades out
   Gone
```

**Timing:**
- Appears: 200ms slide-in
- Stays: 3000ms
- Disappears: 300ms fade-out

---

## Testing Visual Checkpoints

### ✓ Button renders correctly
- [ ] Blue background
- [ ] White text
- [ ] Plus icon visible
- [ ] "Add Touch" label present
- [ ] Proper padding and sizing

### ✓ Button states work
- [ ] Enabled when < 10 touches
- [ ] Disabled when = 10 touches
- [ ] Hover effect on enabled
- [ ] No hover on disabled

### ✓ Touch creation works
- [ ] New touch appears
- [ ] Numbering increments
- [ ] Default values applied
- [ ] Expanded by default

### ✓ Scroll & focus work
- [ ] Smooth scroll animation
- [ ] Touch centers in viewport
- [ ] Subject input focused
- [ ] Cursor blinking

### ✓ Modal works
- [ ] Appears at max touches
- [ ] All content visible
- [ ] Can close via button
- [ ] Can close via backdrop
- [ ] Can close via ESC

### ✓ Overview updates
- [ ] Total touches increments
- [ ] Duration recalculates
- [ ] Channel stays accurate

---

## Status: ✅ COMPLETE

All visual states and interactions fully implemented and documented.
