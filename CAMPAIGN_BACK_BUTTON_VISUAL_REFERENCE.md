# Campaign Back Button - Visual Reference Guide

## Button Location

```
┌──────────────────────────────────────────────────────────┐
│ Campaign Wizard - Step 1                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ← Back to Campaigns    ← TOP LEFT, first element       │
│  (margin-bottom: 24px)                                   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  [Progress Tracker - Step 1 → Step 2 → ...]            │
│  ● → ○ → ○ → ○ → ○ → ○                                │
│                                                          │
│                         [Save Draft]  [Cancel]  ← TOP RIGHT
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Campaign Form Content                                   │
│  (Name, Type, Owner, Description, etc.)                 │
│                                                          │
└──────────────────────────────────────────────────────────┘

Hierarchy:
1. Back button (top left)
2. Progress tracker (below)
3. Action buttons (right side)
4. Form content (main area)
```

## Button Design - All States

### 1. Default State
```
← Back to Campaigns
↑  ↑
│  └─ Text: 14px, medium weight
└──── Icon: 16px ChevronLeft

Layout:
┌─────────────────────────┐
│ [←] Back to Campaigns   │
└─────────────────────────┘
  16px   14px text
  icon   8px gap

Colors:
- Icon: #4b5563 (gray-600)
- Text: #4b5563 (gray-600)
- Background: Transparent
- Border: None

Dimensions:
- Height: Auto (fits content)
- Padding: None (inline button)
- Icon size: 16px × 16px
- Text size: 14px
- Gap: 8px

CSS:
display: flex;
align-items: center;
gap: 8px;
color: #4b5563;
font-size: 14px;
font-weight: 500;
cursor: pointer;
background: transparent;
border: none;
transition: color 200ms ease;
```

### 2. Hover State
```
← Back to Campaigns
↑  ↑
│  └─ Darker text (#111827)
└──── Slides left 4px

Animation:
Before hover: [←] Back to Campaigns
During hover: [←]Back to Campaigns
              ←── Shifts left

Colors:
- Icon: #111827 (gray-900) ← Darker
- Text: #111827 (gray-900) ← Darker
- Cursor: pointer

Transform:
- Icon: translateX(-4px)
- Duration: 200ms
- Easing: ease

CSS:
.group:hover {
  color: #111827;
}

.group:hover .icon {
  transform: translateX(-4px);
  transition: transform 200ms ease;
}
```

**Visual Comparison:**
```
Default:    [←]  Back to Campaigns
            Gray, normal position

Hover:      [←] Back to Campaigns
            Darker, icon moved left

The arrow "points" more eagerly to the left
User gets clear feedback: "Yes, we'll go back"
```

### 3. Focus State (Keyboard)
```
← Back to Campaigns
└─ Blue outline (2px)

┌─────────────────────────┐
│ [←] Back to Campaigns   │  ← Blue outline
└─────────────────────────┘

Focus Ring:
- Color: #3b82f6 (blue-500)
- Width: 2px
- Offset: 2px (space from button)
- Border-radius: 4px
- Visible and accessible

CSS:
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}
```

### 4. Active/Click State
```
Same as hover state
No additional press effect
Click triggers immediately
```

## Icon Design (ChevronLeft)

### Icon Specifications
```
Component: ChevronLeft from Lucide Icons
Size: 16px × 16px
Stroke-width: 2
Color: Inherits from parent

SVG Structure:
<svg
  width="16"
  height="16"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <polyline points="15 18 9 12 15 6" />
</svg>

Visual:
    ┌──┐
    │ ← │  Simple left-pointing chevron
    └──┘

16×16 pixels
Simple, clean design
Points left (back direction)
```

### Icon States

#### Default
```
Color: #4b5563 (gray-600)
Position: X=0 (normal)
Opacity: 1.0
```

#### Hover
```
Color: #111827 (gray-900)
Position: X=-4px (translateX)
Opacity: 1.0
Animation: 200ms ease
```

#### Focus
```
Same as default
No separate icon focus state
Parent button has focus ring
```

## Complete Button Layout

### Spacing & Alignment
```
Component Structure:

<button> ← Container
  <ChevronLeft /> ← Icon (16px)
  <span>Back to Campaigns</span> ← Text (14px)
</button>

Flex Layout:
┌────────────────────────────┐
│ [Icon]   [Text]            │
│  16px    14px              │
│    └─ 8px gap ─┘           │
└────────────────────────────┘

CSS Layout:
display: flex;
align-items: center;
gap: 8px;
```

### Margin & Position
```
Top of page structure:

┌─────────────────────────────┐
│ [Back button]               │  ← No top margin
│                             │
│ 24px vertical space         │  ← margin-bottom: 24px
│                             │
├─────────────────────────────┤
│ [Progress tracker]          │
│                             │
└─────────────────────────────┘

Container:
- margin-bottom: 24px
- No padding
- No border
- No background
```

## Confirmation Modal Design

### Modal Appearance
```
┌────────────────────────────────────────────┐
│                                            │
│  Unsaved Changes                           │  ← Title (18px, bold)
│  ──────────────────────                    │  ← Separator
│                                            │
│  You have unsaved changes. What would you │  ← Body (14px)
│  like to do?                               │
│                                            │
│  Changes detected:                         │  ← Change list header
│  • Changes made to campaign name           │  ← List items
│  • Changes made to campaign type           │
│  • Changes made to description             │
│                                            │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   Save   │  │ Discard  │  │ Cancel  │ │  ← Action buttons
│  │   Draft  │  │          │  │         │ │
│  └──────────┘  └──────────┘  └─────────┘ │
│                                            │
└────────────────────────────────────────────┘

Modal Container:
- Width: 500px
- Max-width: 90vw (mobile)
- Padding: 32px
- Background: #ffffff (white)
- Border-radius: 12px
- Box-shadow: 0 20px 25px rgba(0,0,0,0.15)

Overlay:
- Position: Fixed, full screen
- Background: rgba(0,0,0,0.5)
- Z-index: 50
- Backdrop-blur: 4px
```

### Modal Title
```
Unsaved Changes
└─ Bold, 18px, gray-900

CSS:
font-size: 18px;
font-weight: 700;
color: #111827;
margin-bottom: 16px;
```

### Modal Body Text
```
You have unsaved changes. What would you like to do?
└─ Regular, 14px, gray-600

CSS:
font-size: 14px;
font-weight: 400;
color: #4b5563;
line-height: 1.5;
margin-bottom: 16px;
```

### Change List
```
Changes detected:
• Changes made to campaign name
• Changes made to campaign type
• Changes made to description

List Style:
- Bullet points (•)
- 14px text
- Gray-700 color
- 4px spacing between items
- Indented 16px

CSS:
font-size: 14px;
color: #374151;
line-height: 1.6;
list-style: disc;
padding-left: 20px;
margin-bottom: 24px;
```

### Modal Buttons Layout
```
┌──────────┐  ┌──────────┐  ┌─────────┐
│   Save   │  │ Discard  │  │ Cancel  │
│   Draft  │  │          │  │         │
└──────────┘  └──────────┘  └─────────┘
    Blue         Red          Gray

Horizontal Layout:
- Display: Flex
- Gap: 12px
- Justify-content: flex-end (right-aligned)
- Margin-top: 24px

Each Button:
- Padding: 10px 20px
- Border-radius: 6px
- Font-size: 14px
- Font-weight: 500
- Cursor: pointer
- Transition: all 200ms ease
```

## Modal Button States

### 1. Save Draft Button

#### Default State
```
┌──────────┐
│   Save   │
│   Draft  │
└──────────┘

Background: #2563eb (blue-600)
Text: #ffffff (white)
Border: None
Shadow: 0 1px 2px rgba(0,0,0,0.05)
```

#### Hover State
```
Background: #1d4ed8 (blue-700) ← Darker
Shadow: 0 4px 6px rgba(0,0,0,0.1) ← Larger
Transform: translateY(-1px) ← Lift up
```

#### Loading State
```
┌──────────┐
│ ⟳ Saving...│
└──────────┘

Background: #2563eb (blue-600)
Text: "Saving..." (white)
Spinner: 16px, white, rotating
Disabled: true
Cursor: wait
```

**Spinner Animation:**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

animation: spin 1s linear infinite;
```

### 2. Discard Button

#### Default State
```
┌──────────┐
│ Discard  │
└──────────┘

Background: #ef4444 (red-500)
Text: #ffffff (white)
Border: None
Shadow: 0 1px 2px rgba(0,0,0,0.05)
```

#### Hover State
```
Background: #dc2626 (red-600) ← Darker red
Shadow: 0 4px 6px rgba(0,0,0,0.1)
Transform: translateY(-1px)
```

#### Active State
```
Background: #b91c1c (red-700) ← Even darker
Transform: scale(0.98) ← Slight press
```

### 3. Cancel Button

#### Default State
```
┌─────────┐
│ Cancel  │
└─────────┘

Background: #6b7280 (gray-500)
Text: #ffffff (white)
Border: None
Shadow: 0 1px 2px rgba(0,0,0,0.05)
```

#### Hover State
```
Background: #4b5563 (gray-600) ← Darker
Shadow: 0 4px 6px rgba(0,0,0,0.1)
Transform: translateY(-1px)
```

#### Active State
```
Background: #374151 (gray-700)
Transform: scale(0.98)
```

## Toast Notifications

### Toast Structure
```
┌────────────────────────┐
│ [Icon] Message text    │  ← Single line
└────────────────────────┘

Position:
- Fixed positioning
- Top: 16px (from top edge)
- Right: 16px (from right edge)
- Z-index: 100 (above modal)

Dimensions:
- Min-width: 300px
- Max-width: 400px
- Height: Auto (fits content)
- Padding: 12px 16px
- Border-radius: 8px

Layout:
- Display: Flex
- Align-items: Center
- Gap: 12px (icon to text)
```

### Toast Types

#### Success Toast (Draft Saved)
```
┌─────────────────────┐
│ ✅ Draft saved      │
└─────────────────────┘

Background: #10b981 (green-600)
Text: #ffffff (white)
Icon: ✅ (white checkmark)
Font-size: 14px
Font-weight: 500
Duration: 3 seconds

Animation:
- Entry: Slide from right + fade in
- Exit: Slide to right + fade out
- Duration: 300ms
```

#### Info Toast (Changes Discarded)
```
┌───────────────────────────┐
│ ℹ️ Changes discarded      │
└───────────────────────────┘

Background: #3b82f6 (blue-500)
Text: #ffffff (white)
Icon: ℹ️ (info circle)
Font-size: 14px
Font-weight: 500
Duration: 3 seconds

Same animation as success toast
```

#### Error Toast (Save Failed)
```
┌──────────────────────────────────┐
│ ❌ Failed to save draft. Retrying...│
└──────────────────────────────────┘

Background: #ef4444 (red-500)
Text: #ffffff (white)
Icon: ❌ (error X)
Font-size: 14px
Font-weight: 500
Duration: 5 seconds (longer for errors)

Same animation, but longer display time
```

### Toast Animations

#### Slide In (Entry)
```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

animation: slideInRight 300ms ease-out;
```

#### Slide Out (Exit)
```css
@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

animation: slideOutRight 200ms ease-in;
```

## Responsive Design

### Desktop Layout (>1024px)
```
┌────────────────────────────────────────────┐
│  ← Back to Campaigns                       │
│  (full size, normal)                       │
│                                            │
│  [Progress Tracker]                        │
│  ● → ○ → ○ → ○ → ○ → ○                   │
│                                            │
│                  [Save Draft]  [Cancel]    │
└────────────────────────────────────────────┘

Back button:
- Font-size: 14px
- Icon: 16px
- Full text visible
- Left-aligned
```

### Tablet Layout (768px - 1024px)
```
┌───────────────────────────────────────┐
│  ← Back to Campaigns                  │
│  (same as desktop)                    │
│                                       │
│  [Progress Tracker]                   │
│  (may wrap on smaller tablets)        │
│                                       │
│         [Save Draft]  [Cancel]        │
└───────────────────────────────────────┘

No changes to back button
Fully visible and functional
```

### Mobile Layout (<768px)
```
┌───────────────────────┐
│  ← Back to Campaigns  │
│  (same size)          │
│                       │
│  [Progress Tracker]   │
│  (stacked or hidden)  │
│                       │
│  [Save Draft]         │
│  [Cancel]             │
│  (may stack)          │
└───────────────────────┘

Back button unchanged:
- Font-size: 14px (same)
- Icon: 16px (same)
- Full functionality
- Touch-friendly size
```

### Mobile Modal
```
┌─────────────────────────┐
│                         │
│  Unsaved Changes        │
│                         │
│  You have unsaved       │
│  changes...             │
│                         │
│  Changes detected:      │
│  • Campaign name        │
│  • Campaign type        │
│                         │
│  ┌─────────────────┐   │
│  │   Save Draft    │   │
│  └─────────────────┘   │
│  ┌─────────────────┐   │
│  │    Discard      │   │
│  └─────────────────┘   │
│  ┌─────────────────┐   │
│  │    Cancel       │   │
│  └─────────────────┘   │
│                         │
└─────────────────────────┘

Width: 90vw (responsive)
Max-width: 400px
Buttons: Stacked vertically
Gap: 8px between buttons
Each button: Full width
```

## Color Palette Complete

### Button Colors
```css
/* Default State */
--back-text: #4b5563           /* gray-600 */
--back-icon: #4b5563           /* gray-600 */
--back-bg: transparent

/* Hover State */
--back-text-hover: #111827     /* gray-900 */
--back-icon-hover: #111827     /* gray-900 */

/* Focus State */
--back-focus-outline: #3b82f6  /* blue-500 */
--back-focus-offset: 2px
```

### Modal Colors
```css
/* Container */
--modal-bg: #ffffff             /* white */
--modal-overlay: rgba(0,0,0,0.5)
--modal-shadow: 0 20px 25px rgba(0,0,0,0.15)

/* Text */
--modal-title: #111827          /* gray-900 */
--modal-body: #4b5563           /* gray-600 */
--modal-list: #374151           /* gray-700 */

/* Save Draft Button */
--btn-save-bg: #2563eb          /* blue-600 */
--btn-save-hover: #1d4ed8       /* blue-700 */
--btn-save-text: #ffffff        /* white */

/* Discard Button */
--btn-discard-bg: #ef4444       /* red-500 */
--btn-discard-hover: #dc2626    /* red-600 */
--btn-discard-active: #b91c1c   /* red-700 */
--btn-discard-text: #ffffff     /* white */

/* Cancel Button */
--btn-cancel-bg: #6b7280        /* gray-500 */
--btn-cancel-hover: #4b5563     /* gray-600 */
--btn-cancel-active: #374151    /* gray-700 */
--btn-cancel-text: #ffffff      /* white */
```

### Toast Colors
```css
/* Success */
--toast-success-bg: #10b981     /* green-600 */
--toast-success-text: #ffffff   /* white */
--toast-success-icon: #ffffff   /* white checkmark */

/* Info */
--toast-info-bg: #3b82f6        /* blue-500 */
--toast-info-text: #ffffff      /* white */
--toast-info-icon: #ffffff      /* white info circle */

/* Error */
--toast-error-bg: #ef4444       /* red-500 */
--toast-error-text: #ffffff     /* white */
--toast-error-icon: #ffffff     /* white X */
```

## Spacing System

### Button Spacing
```css
/* Internal spacing */
gap: 8px;                    /* Icon to text */
padding: 0;                  /* No padding (inline) */
margin: 0 0 24px 0;         /* Bottom margin only */

/* Container spacing */
.back-container {
  margin-bottom: 24px;
}
```

### Modal Spacing
```css
/* Modal container */
padding: 32px;
gap: 16px;                   /* Between sections */

/* Title */
margin-bottom: 16px;

/* Body text */
margin-bottom: 16px;

/* Change list */
margin-bottom: 24px;
padding-left: 20px;         /* Indent bullets */

/* Button group */
margin-top: 24px;
gap: 12px;                  /* Between buttons */
```

### Toast Spacing
```css
/* Position */
top: 16px;
right: 16px;

/* Internal */
padding: 12px 16px;
gap: 12px;                  /* Icon to text */

/* Stacking */
margin-bottom: 12px;        /* Between multiple toasts */
```

## Typography Scale

### Button Text
```css
font-size: 14px;
font-weight: 500;           /* Medium */
line-height: 1.5;
letter-spacing: 0;
```

### Modal Title
```css
font-size: 18px;
font-weight: 700;           /* Bold */
line-height: 1.4;
```

### Modal Body
```css
font-size: 14px;
font-weight: 400;           /* Regular */
line-height: 1.5;
```

### Modal List
```css
font-size: 14px;
font-weight: 400;
line-height: 1.6;           /* More spacing for readability */
```

### Modal Buttons
```css
font-size: 14px;
font-weight: 500;           /* Medium */
line-height: 1.5;
```

### Toast Text
```css
font-size: 14px;
font-weight: 500;           /* Medium */
line-height: 1.5;
```

## Z-Index Layering

### Element Stacking
```
Z-index hierarchy (low to high):

1. Page content: z-index: 0 (default)
   - Back button
   - Progress tracker
   - Form fields

2. Modal overlay: z-index: 40
   - Dark background
   - Click blocker

3. Modal content: z-index: 50
   - White modal box
   - Title, text, buttons
   - User interaction

4. Toast notifications: z-index: 100
   - Above modal
   - Above everything
   - Always visible

Reasoning:
- Toasts must be visible during modal operations
- Modal must cover entire page
- Page content is base layer
```

## Animation Timing

### Button Hover
```css
Duration: 200ms
Easing: ease
Properties:
- color (text and icon)
- transform (icon position)

transition: all 200ms ease;
```

### Modal Entry
```css
Duration: 200ms
Easing: ease-out
Properties:
- opacity (0 → 1)
- transform (scale 0.95 → 1)

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### Modal Exit
```css
Duration: 150ms
Easing: ease-in
Properties:
- opacity (1 → 0)
- transform (scale 1 → 0.95)

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

### Toast Entry
```css
Duration: 300ms
Easing: ease-out
Properties:
- transform (translateX 100% → 0)
- opacity (0 → 1)

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

### Toast Exit
```css
Duration: 200ms
Easing: ease-in
Properties:
- transform (translateX 0 → 100%)
- opacity (1 → 0)

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
```

## Accessibility Attributes

### Back Button ARIA
```tsx
<button
  onClick={handleBackClick}
  className="back-button group"
  aria-label="Back to campaigns list"
  role="button"
  type="button"
>
  <ChevronLeft
    className="w-4 h-4"
    aria-hidden="true"
  />
  <span>Back to Campaigns</span>
</button>
```

### Modal ARIA
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Unsaved Changes</h2>
  <p id="modal-description">
    You have unsaved changes. What would you like to do?
  </p>

  <div role="group" aria-label="Modal actions">
    <button aria-label="Save draft and return to campaigns">
      Save Draft
    </button>
    <button aria-label="Discard changes and return to campaigns">
      Discard
    </button>
    <button aria-label="Cancel and stay on page">
      Cancel
    </button>
  </div>
</div>
```

### Toast ARIA
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="toast"
>
  <span aria-label="Success">✅</span>
  <span>Draft saved</span>
</div>
```

## Complete State Flowchart

```
User Loads Page
    ↓
┌─────────────────────┐
│ Back Button Visible │
│ Top Left            │
│ Gray Color          │
│ Default State       │
└─────────────────────┘
    ↓
User Hovers
    ↓
┌─────────────────────┐
│ Text: Darker        │
│ Icon: Slides Left   │
│ Cursor: Pointer     │
└─────────────────────┘
    ↓
User Clicks
    ↓
Check hasChanges?
    ├─ NO ─────────────────────┐
    │                          ↓
    │                   ┌──────────────┐
    │                   │ Navigate     │
    │                   │ Immediately  │
    │                   └──────────────┘
    │
    ├─ YES ────────────────────┐
                               ↓
                        ┌──────────────┐
                        │ Show Modal   │
                        │ "Unsaved     │
                        │  Changes"    │
                        └──────────────┘
                               ↓
                        User Chooses:
                        ┌─────┬─────┬─────┐
                        │     │     │     │
                     Save  Discard Cancel
                        │     │     │
                        ↓     ↓     ↓
                    ┌────┐ ┌────┐ ┌────┐
                    │Save│ │Skip│ │Stay│
                    │Then│ │Save│ │On  │
                    │Nav │ │Nav │ │Page│
                    └────┘ └────┘ └────┘
                        │     │     │
                        ↓     ↓     └──┐
                    ┌──────────────┐   │
                    │ Toast Shows  │   │
                    └──────────────┘   │
                        │               │
                        ↓               │
                    ┌──────────────┐   │
                    │ Navigate to  │   │
                    │ Campaigns    │   │
                    └──────────────┘   │
                                       │
                    ┌──────────────────┘
                    │
                    ↓
            ┌──────────────┐
            │ Modal Closed │
            │ Stay on Page │
            └──────────────┘
```

## All Visual Elements Complete ✅

- ✅ Button design (default, hover, focus states)
- ✅ Icon specifications (ChevronLeft 16px)
- ✅ Complete layout with spacing
- ✅ Modal design (500px, white, shadow)
- ✅ Three modal buttons (Save, Discard, Cancel)
- ✅ Button loading state (spinner)
- ✅ Toast notifications (success, info, error)
- ✅ Color palette (all states)
- ✅ Typography scale
- ✅ Spacing system (8px, 12px, 16px, 24px, 32px)
- ✅ Animation specifications
- ✅ Responsive layouts (desktop, tablet, mobile)
- ✅ Z-index layering
- ✅ Accessibility attributes (ARIA)
- ✅ Complete state flowchart

**Status**: All visual specifications documented ✅
**Ready for**: Development & Testing
