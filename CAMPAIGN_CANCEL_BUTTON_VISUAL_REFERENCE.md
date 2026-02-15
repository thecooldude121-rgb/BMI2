# Campaign Cancel Button - Visual Reference Guide

## Button Location & Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ Campaign Wizard - Step 1                                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──────────────────────────┐    ┌─────────────────┐  ┌────┐    │
│ │ 1 → 2 → 3 → 4 → 5 → 6   │    │ 💾 Save Draft   │  │ ✕  │    │
│ └──────────────────────────┘    │ Last saved: 2m  │  └────┘    │
│  Step Progress (left)           │ ● Unsaved       │             │
│                                 └─────────────────┘             │
│                                  Save Draft (left)  Cancel      │
│                                                     (right)      │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Campaign Details...                                        │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Cancel Button Design

### Default State
```
┌────┐
│ ✕  │  ← X icon centered
└────┘

Size: 40px × 40px (square)
Border-radius: 8px (rounded corners)
Border: 2px solid #d1d5db (gray-300)
Background: #ffffff (white)
Icon: X from Lucide (20px)
Icon color: #6b7280 (gray-600)
Cursor: pointer
```

**CSS:**
```css
width: 40px
height: 40px
padding: 0
display: flex
align-items: center
justify-content: center
background: #ffffff
border: 2px solid #d1d5db
border-radius: 8px
color: #6b7280
cursor: pointer
transition: all 200ms ease-in-out
```

### Hover State
```
┌────┐
│ ✕  │  ← Icon slightly larger
└────┘

Background: #f9fafb (light gray)
Border: 2px solid #9ca3af (gray-400)
Icon color: #1f2937 (gray-800)
Icon scale: 1.1 (110% size)
```

**CSS:**
```css
background: #f9fafb
border: 2px solid #9ca3af
color: #1f2937

/* Icon animation */
transform: scale(1.1)
transition: transform 200ms ease-in-out
```

### Active/Click State
```
┌────┐
│ ✕  │  ← Brief press effect
└────┘

Transform: scale(0.95)
Duration: 100ms
Then returns to normal
```

## Side-by-Side Layout

### With Save Draft Button
```
┌─────────────────────────┐  ┌────┐
│  💾  Save Draft         │  │ ✕  │
└─────────────────────────┘  └────┘
Last saved: 2 minutes ago
● Unsaved changes

Horizontal layout (flex):
- Gap: 12px (gap-3)
- Alignment: flex-start (top)
- Save Draft: flex-grow (takes space needed)
- Cancel: fixed 40px width

Vertical spacing:
- Save Draft has indicators below
- Cancel has no indicators
- Both aligned at top edge
```

### Spacing Diagram
```
┌─────────────────────┐←12px→┌────┐
│ Save Draft Button   │      │ ✕  │
│ • Variable width    │      │40px│
│ • Has indicators    │      └────┘
└─────────────────────┘       40px
      ↓ (indicators)
```

## Discard Changes Modal

### Complete Modal Layout
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     Dark Overlay                            │
│               (50% transparent black)                       │
│                                                             │
│        ┌───────────────────────────────────────────┐        │
│        │                                           │        │
│        │  ┌────┐                                   │        │
│        │  │ ⚠️ │  Discard Changes?           [×]  │        │
│        │  └────┘  You have unsaved changes...      │        │
│        │                                           │        │
│        ├───────────────────────────────────────────┤        │
│        │                                           │        │
│        │  What would you like to do with your     │        │
│        │  changes?                                 │        │
│        │                                           │        │
│        │  ┌─────────────────────────────────────┐ │        │
│        │  │ ┌──┐                                │ │        │
│        │  │ │💾│ Save Draft                     │ │        │
│        │  │ └──┘ Your progress will be saved   │ │        │
│        │  │      and you can continue later    │ │        │
│        │  └─────────────────────────────────────┘ │        │
│        │                                           │        │
│        │  ┌─────────────────────────────────────┐ │        │
│        │  │ ┌──┐                                │ │        │
│        │  │ │🗑️│ Discard Changes                │ │        │
│        │  │ └──┘ All changes will be           │ │        │
│        │  │      permanently deleted           │ │        │
│        │  └─────────────────────────────────────┘ │        │
│        │                                           │        │
│        ├───────────────────────────────────────────┤        │
│        │                                           │        │
│        │  ┌──────────┐      ┌─────────────────┐  │        │
│        │  │   💾     │      │      🗑️        │  │        │
│        │  │   Save   │      │    Discard      │  │        │
│        │  │   Draft  │      │    Changes      │  │        │
│        │  └──────────┘      └─────────────────┘  │        │
│        │                                           │        │
│        │  ┌─────────────────────────────────────┐ │        │
│        │  │            Cancel                   │ │        │
│        │  └─────────────────────────────────────┘ │        │
│        │                                           │        │
│        │  Background: Light Gray (#f9fafb)        │        │
│        └───────────────────────────────────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Modal Dimensions
```
Max Width: 448px (28rem)
Width: 100% on mobile (with 16px margins)
Border-radius: 12px
Shadow: 2xl (0 25px 50px -12px rgba(0,0,0,0.25))
Background: White
Z-index: 50
Position: Fixed, centered
```

### Modal Header
```
┌─────────────────────────────────────────────────┐
│ ┌────────┐                                      │
│ │        │                                      │
│ │   ⚠️   │  Discard Changes?             [×]   │
│ │        │  You have unsaved changes to        │
│ │        │  your campaign.                     │
│ └────────┘                                      │
│                                                 │
│ Border-bottom: 1px solid #e5e7eb               │
└─────────────────────────────────────────────────┘

Padding: 24px
Display: Flex with gap-4

Warning Icon Circle:
- Size: 48px (w-12 h-12)
- Background: #fef3c7 (yellow-100)
- Border-radius: 50% (full circle)
- Display: Flex, centered

Warning Icon:
- Component: AlertTriangle (Lucide)
- Size: 24px (w-6 h-6)
- Color: #d97706 (yellow-600)

Heading:
- Font-size: 18px
- Font-weight: 600 (semibold)
- Color: #111827 (gray-900)
- Line-height: 1.25

Subheading:
- Font-size: 14px
- Color: #6b7280 (gray-600)
- Margin-top: 4px

Close Button:
- Position: Absolute or flex-aligned right
- Size: 20px icon
- Color: #9ca3af (gray-400)
- Hover: #4b5563 (gray-600)
- No background
- Padding: 0
```

### Modal Content Section
```
┌─────────────────────────────────────────────────┐
│ What would you like to do with your changes?   │
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ ┌────┐                                      ││
│ │ │ 💾 │  Save Draft                          ││ ← Blue card
│ │ └────┘  Your progress will be saved and     ││
│ │         you can continue later              ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ ┌────┐                                      ││
│ │ │ 🗑️ │  Discard Changes                     ││ ← Red card
│ │ └────┘  All changes will be permanently     ││
│ │         deleted                             ││
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘

Padding: 24px
Gap between cards: 12px (space-y-3)
```

### Save Draft Card (Blue)
```
┌───────────────────────────────────────────┐
│ ┌────┐                                    │
│ │    │                                    │
│ │ 💾 │  Save Draft                        │
│ │    │                                    │
│ └────┘  Your progress will be saved and  │
│         you can continue later            │
└───────────────────────────────────────────┘

Background: #eff6ff (blue-50)
Border: 1px solid #bfdbfe (blue-200)
Border-radius: 8px
Padding: 12px
Display: Flex
Gap: 12px (between icon and text)
Align-items: Start

Icon Circle:
- Size: 32px (w-8 h-8)
- Background: #dbeafe (blue-100)
- Border-radius: 50%
- Flex: none (doesn't shrink)
- Display: Flex, centered

Icon:
- Component: Save (Lucide)
- Size: 16px (w-4 h-4)
- Color: #2563eb (blue-600)

Title:
- Font-size: 14px
- Font-weight: 500 (medium)
- Color: #111827 (gray-900)
- Line-height: 1.5

Description:
- Font-size: 12px
- Color: #6b7280 (gray-600)
- Margin-top: 2px
- Line-height: 1.5
```

### Discard Changes Card (Red)
```
┌───────────────────────────────────────────┐
│ ┌────┐                                    │
│ │    │                                    │
│ │ 🗑️ │  Discard Changes                  │
│ │    │                                    │
│ └────┘  All changes will be permanently  │
│         deleted                           │
└───────────────────────────────────────────┘

Background: #fef2f2 (red-50)
Border: 1px solid #fecaca (red-200)
Border-radius: 8px
Padding: 12px
Display: Flex
Gap: 12px
Align-items: Start

Icon Circle:
- Size: 32px (w-8 h-8)
- Background: #fee2e2 (red-100)
- Border-radius: 50%
- Flex: none
- Display: Flex, centered

Icon:
- Component: Trash2 (Lucide)
- Size: 16px (w-4 h-4)
- Color: #dc2626 (red-600)

Title:
- Font-size: 14px
- Font-weight: 500 (medium)
- Color: #111827 (gray-900)

Description:
- Font-size: 12px
- Color: #6b7280 (gray-600)
- Margin-top: 2px
```

### Modal Footer (Action Buttons)
```
┌───────────────────────────────────────────────┐
│                                               │
│  ┌──────────────────┐  ┌──────────────────┐  │
│  │                  │  │                  │  │
│  │   💾 Save        │  │  🗑️  Discard     │  │
│  │      Draft       │  │      Changes     │  │
│  │                  │  │                  │  │
│  └──────────────────┘  └──────────────────┘  │
│                                               │
│  ┌──────────────────────────────────────────┐│
│  │                                          ││
│  │             Cancel                       ││
│  │                                          ││
│  └──────────────────────────────────────────┘│
│                                               │
│  Background: #f9fafb (gray-50)                │
│  Border-radius: 0 0 12px 12px (bottom only)   │
└───────────────────────────────────────────────┘

Padding: 24px
Display: Flex column
Gap: 12px (between rows)
Background: #f9fafb (gray-50)

Top row:
- Display: Flex
- Gap: 12px
- Both buttons: flex-1 (equal width)

Bottom row:
- Full width button
```

### Save Draft Button (Primary Action)
```
┌──────────────────┐
│                  │
│   💾  Save       │
│       Draft      │
│                  │
└──────────────────┘

Flex: 1 (50% of row)
Padding: 12px 16px
Background: #2563eb (blue-600)
Border: 2px solid #2563eb
Color: #ffffff (white)
Border-radius: 8px
Font-size: 14px
Font-weight: 500 (medium)
Display: Flex
Align-items: Center
Justify-content: Center
Gap: 8px (icon to text)
Cursor: Pointer
Transition: All 200ms

Hover:
- Background: #1d4ed8 (blue-700)

Icon:
- Save (Lucide)
- Size: 16px

During Save:
- Text: "Saving..."
- Disabled: true
- Opacity: 0.5
- Cursor: wait
```

### Discard Changes Button (Destructive Action)
```
┌──────────────────┐
│                  │
│  🗑️  Discard     │
│      Changes     │
│                  │
└──────────────────┘

Flex: 1 (50% of row)
Padding: 12px 16px
Background: #dc2626 (red-600)
Border: 2px solid #dc2626
Color: #ffffff (white)
Border-radius: 8px
Font-size: 14px
Font-weight: 500 (medium)
Display: Flex
Align-items: Center
Justify-content: Center
Gap: 8px
Cursor: Pointer

Hover:
- Background: #b91c1c (red-700)

Icon:
- Trash2 (Lucide)
- Size: 16px

Disabled (during save):
- Opacity: 0.5
- Cursor: not-allowed
```

### Cancel Button (Secondary Action)
```
┌──────────────────────────────────┐
│                                  │
│           Cancel                 │
│                                  │
└──────────────────────────────────┘

Width: 100% (full width)
Padding: 10px 16px
Background: #ffffff (white)
Border: 2px solid #d1d5db (gray-300)
Color: #374151 (gray-700)
Border-radius: 8px
Font-size: 14px
Font-weight: 500 (medium)
Text-align: Center
Cursor: Pointer

Hover:
- Background: #f3f4f6 (gray-100)

Disabled (during save):
- Opacity: 0.5
- Cursor: not-allowed
```

## Toast Notifications

### Draft Saved Toast
```
┌────────────────────────────────────┐
│  ✅  Draft saved                   │
└────────────────────────────────────┘

Position: Fixed, top-right
Top: 16px
Right: 16px
Padding: 12px 16px
Background: #10b981 (green-500)
Color: #ffffff (white)
Border-radius: 8px
Box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1)
Font-size: 14px
Font-weight: 500
Display: Flex
Align-items: Center
Gap: 8px
Z-index: 100

Animation:
- Entry: Slide in from right + fade in (300ms)
- Stay: 3 seconds
- Exit: Slide out to right + fade out (200ms)
```

### Changes Discarded Toast
```
┌────────────────────────────────────┐
│  ℹ️  Changes discarded             │
└────────────────────────────────────┘

Same styling as above, but:
Background: #3b82f6 (blue-500) - Info color
Icon: Info circle (ℹ️)

Indicates informational message
Not an error or warning
User chose to discard
```

## Animation Specifications

### Cancel Button Hover Animation
```css
/* Default */
transform: scale(1);

/* Hover */
.icon {
  transform: scale(1.1);
  transition: transform 200ms ease-in-out;
}

/* Click */
button:active {
  transform: scale(0.95);
  transition: transform 100ms ease-out;
}
```

### Modal Entry Animation
```css
/* Overlay */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

animation: fadeIn 200ms ease-in-out;

/* Modal */
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(16px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

animation: modalIn 300ms ease-out;
```

### Modal Exit Animation
```css
/* Overlay */
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

animation: fadeOut 200ms ease-in-out;

/* Modal */
@keyframes modalOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

animation: modalOut 200ms ease-in;
```

### Toast Slide Animation
```css
/* Entry */
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

/* Exit */
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

## Icon Specifications

### Cancel Button Icon (X)
```tsx
<X className="w-5 h-5" />

Component: X from Lucide Icons
Size: 20px × 20px
Stroke-width: 2
Color: Inherits from button
Display: Centered in 40px square
```

### Modal Icons

#### Warning Icon (AlertTriangle)
```tsx
<AlertTriangle className="w-6 h-6 text-yellow-600" />

Size: 24px × 24px
Color: #d97706 (yellow-600)
Background circle: 48px, #fef3c7 (yellow-100)
Stroke-width: 2
```

#### Save Icon
```tsx
<Save className="w-4 h-4 text-blue-600" />

Card: 16px, #2563eb (blue-600)
Button: 16px, white
Background circle (card): 32px, #dbeafe (blue-100)
```

#### Trash Icon
```tsx
<Trash2 className="w-4 h-4 text-red-600" />

Card: 16px, #dc2626 (red-600)
Button: 16px, white
Background circle (card): 32px, #fee2e2 (red-100)
```

#### Close Icon (X in modal header)
```tsx
<X className="w-5 h-5" />

Size: 20px × 20px
Color: #9ca3af (gray-400)
Hover: #4b5563 (gray-600)
```

## Complete Color Palette

### Cancel Button
```css
/* Default */
--btn-bg: #ffffff
--btn-border: #d1d5db
--btn-icon: #6b7280

/* Hover */
--btn-bg-hover: #f9fafb
--btn-border-hover: #9ca3af
--btn-icon-hover: #1f2937
```

### Modal Structure
```css
/* Overlay */
--overlay-bg: rgba(0, 0, 0, 0.5)

/* Modal */
--modal-bg: #ffffff
--modal-border-radius: 12px
--modal-shadow: 0 25px 50px -12px rgba(0,0,0,0.25)
```

### Modal Header
```css
--warning-circle-bg: #fef3c7
--warning-icon: #d97706
--heading-color: #111827
--subheading-color: #6b7280
--border-color: #e5e7eb
--close-icon: #9ca3af
--close-icon-hover: #4b5563
```

### Save Draft Card (Blue)
```css
--card-bg: #eff6ff
--card-border: #bfdbfe
--icon-circle-bg: #dbeafe
--icon-color: #2563eb
--title-color: #111827
--desc-color: #6b7280
```

### Discard Changes Card (Red)
```css
--card-bg: #fef2f2
--card-border: #fecaca
--icon-circle-bg: #fee2e2
--icon-color: #dc2626
--title-color: #111827
--desc-color: #6b7280
```

### Footer
```css
--footer-bg: #f9fafb
```

### Action Buttons
```css
/* Save Draft */
--save-bg: #2563eb
--save-bg-hover: #1d4ed8
--save-text: #ffffff
--save-border: #2563eb

/* Discard Changes */
--discard-bg: #dc2626
--discard-bg-hover: #b91c1c
--discard-text: #ffffff
--discard-border: #dc2626

/* Cancel */
--cancel-bg: #ffffff
--cancel-bg-hover: #f3f4f6
--cancel-text: #374151
--cancel-border: #d1d5db
```

### Toasts
```css
/* Success (Draft Saved) */
--toast-success-bg: #10b981
--toast-success-text: #ffffff

/* Info (Changes Discarded) */
--toast-info-bg: #3b82f6
--toast-info-text: #ffffff
```

## Responsive Breakpoints

### Desktop (>1024px)
```
Modal: 448px centered
Buttons: Side by side in footer
Gap: 12px between all elements
Padding: 24px all sections
```

### Tablet (768px - 1024px)
```
Modal: 90% width, max 448px
Buttons: Side by side (might be slightly narrower)
Gap: 12px maintained
Padding: 24px maintained
```

### Mobile (<768px)
```
Modal: 95% width
Margins: 16px on sides
Padding: 20px (slightly reduced)
Buttons: Still side by side if space allows
Footer buttons may stack if very narrow
```

### Very Small Mobile (<400px)
```
Modal: Full width minus 16px margins
Footer buttons: Stack vertically
  [Save Draft] (full width)
  [Discard Changes] (full width)
  [Cancel] (full width)
Gap: 8px between stacked buttons
```

## Z-Index Hierarchy
```
Page content: z-1
Save Draft button: z-10
Cancel button: z-10
Modal overlay: z-50
Modal content: z-50
Toast notifications: z-100 (above modal)
```

## Accessibility Attributes

### Cancel Button
```tsx
<button
  onClick={handleCancelClick}
  type="button"
  title="Cancel and close"
  aria-label="Cancel and close campaign wizard"
>
  <X className="w-5 h-5" />
</button>
```

### Modal
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="discard-dialog-title"
  aria-describedby="discard-dialog-description"
>
  <h3 id="discard-dialog-title">
    Discard Changes?
  </h3>
  <p id="discard-dialog-description">
    You have unsaved changes to your campaign.
  </p>
</div>
```

### Action Buttons
```tsx
<button aria-label="Save draft and close">
  Save Draft
</button>

<button aria-label="Discard all changes and close">
  Discard Changes
</button>

<button aria-label="Cancel and return to editing">
  Cancel
</button>
```

## Focus States

### Cancel Button Focus
```css
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### Modal Button Focus
```css
/* Save Draft (Blue) */
button:focus-visible {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

/* Discard Changes (Red) */
button:focus-visible {
  outline: 2px solid #fca5a5;
  outline-offset: 2px;
}

/* Cancel (Gray) */
button:focus-visible {
  outline: 2px solid #9ca3af;
  outline-offset: 2px;
}
```

## Complete Visual State Flow

```
┌─────────────────────┐
│   Initial State     │
│                     │
│ User on wizard      │
│ [Save] [✕] visible  │
└──────┬──────────────┘
       │
       ├─→ No changes
       │   └─→ Click ✕ → Navigate immediately
       │
       └─→ Has changes
           └─→ Click ✕
               ↓
        ┌──────────────────┐
        │  Modal Opens     │
        │  • Fade in       │
        │  • Zoom + slide  │
        │  • 300ms         │
        └──────┬───────────┘
               │
               ├─→ Click "Save Draft"
               │   ├─→ Button: "Saving..."
               │   ├─→ Wait 1s
               │   ├─→ Modal closes
               │   ├─→ Toast: "Draft saved"
               │   └─→ Navigate away
               │
               ├─→ Click "Discard Changes"
               │   ├─→ Modal closes immediately
               │   ├─→ Toast: "Changes discarded"
               │   └─→ Navigate away
               │
               └─→ Click "Cancel" / × / Outside / Esc
                   ├─→ Modal closes
                   ├─→ Stay on page
                   └─→ No toast
```

## All Visual Elements Complete ✅

- ✅ Cancel button: Square, white, gray border
- ✅ X icon: 20px, centered
- ✅ Hover effect: Gray bg, scale icon
- ✅ Positioned next to Save Draft
- ✅ 12px gap between buttons
- ✅ Modal: 448px max, centered
- ✅ Warning icon: Yellow circle
- ✅ Two option cards: Blue + Red
- ✅ Three action buttons
- ✅ Gray footer background
- ✅ Close × button
- ✅ Smooth animations (200-300ms)
- ✅ Toast notifications
- ✅ Responsive layout
- ✅ Accessibility features
- ✅ Complete color palette

**Status**: All visual specifications documented ✅
