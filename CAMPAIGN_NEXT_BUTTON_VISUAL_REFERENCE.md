# Campaign Next Button - Visual Reference Guide

## Button Location

```
┌──────────────────────────────────────────────────────────────┐
│ Campaign Wizard - Step 1                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Campaign Details Form                                        │
│ (Campaign Name, Description, Type, Owner, etc.)              │
│                                                              │
│ ... scrollable content ...                                   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                       FOOTER SECTION                         │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Border-top: 1px gray line                                │ │
│ │                                                          │ │
│ │ ┌────────────────┐              ┌────────────────────┐  │ │
│ │ │ ⌘ + Enter      │              │ Next: Select       │  │ │
│ │ │ to continue    │              │ Template        →  │  │ │
│ │ └────────────────┘              └────────────────────┘  │ │
│ │  Keyboard Hint                   Next Button            │ │
│ │  (left)                          (right)                │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

Footer Layout:
- Display: Flex
- Justify-content: space-between
- Align-items: center
- Border-top: 1px solid #e5e7eb
- Padding-top: 24px
- Margin-top: 32px
```

## Button States - Full Visual Breakdown

### 1. Disabled State (Default)
```
┌────────────────────────────────────┐
│  Next: Select Template          →  │
└────────────────────────────────────┘

Dimensions:
- Min-width: 200px
- Height: 48px (3rem)
- Padding: 12px 24px
- Border-radius: 8px

Colors:
- Background: #d1d5db (gray-300)
- Text: #6b7280 (gray-500)
- Icon: #6b7280 (gray-500)

States:
- Cursor: not-allowed
- Shadow: none
- Opacity: 1.0 (fully opaque)
- Pointer-events: none

Typography:
- Font-size: 14px
- Font-weight: 500 (medium)
- Text: "Next: Select Template"
- Icon: ChevronRight (20px)
- Gap: 8px (between text and icon)

CSS:
background: #d1d5db;
color: #6b7280;
cursor: not-allowed;
padding: 12px 24px;
border-radius: 8px;
font-weight: 500;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
min-width: 200px;
```

**When Shown:**
- Initial page load
- Any required field is empty
- Campaign name < 5 characters
- No campaign type selected
- No owner selected

### 2. Enabled State
```
┌────────────────────────────────────┐
│  Next: Select Template          →  │
└────────────────────────────────────┘

Colors:
- Background: #2563eb (blue-600)
- Text: #ffffff (white)
- Icon: #ffffff (white)

Shadow:
- box-shadow: 0 1px 2px rgba(0,0,0,0.05)
- Subtle depth effect

States:
- Cursor: pointer
- Hover: yes
- Active: yes
- Transition: all 200ms ease

CSS:
background: #2563eb;
color: #ffffff;
cursor: pointer;
box-shadow: 0 1px 2px rgba(0,0,0,0.05);
transition: all 200ms ease;
```

**When Shown:**
- Campaign name valid (5+ chars)
- Campaign type selected
- Owner selected

### 3. Hover State (Enabled Only)
```
┌────────────────────────────────────┐
│  Next: Select Template          →  │  ← Slightly lifted
└────────────────────────────────────┘

Colors:
- Background: #1d4ed8 (blue-700) ← Darker
- Text: #ffffff (white)
- Icon: #ffffff (white)

Shadow:
- box-shadow: 0 4px 6px rgba(0,0,0,0.1)
- Larger, more prominent shadow

Transform:
- transform: translateY(-1px)
- Button appears to lift up slightly

CSS:
background: #1d4ed8;
box-shadow: 0 4px 6px rgba(0,0,0,0.1);
transform: translateY(-1px);
transition: all 200ms ease;
```

**Animation:**
- Duration: 200ms
- Easing: ease
- Smooth color and shadow transition

### 4. Active/Click State
```
┌────────────────────────────────────┐
│  Next: Select Template          →  │  ← Pressed down
└────────────────────────────────────┘

Transform:
- transform: scale(0.95)
- Button scales down to 95%
- Appears "pressed"

Duration:
- 100ms
- Quick feedback

CSS:
transform: scale(0.95);
transition: transform 100ms ease-out;
```

**When Shown:**
- While mouse button is held down
- Brief press effect
- Returns to normal on release

### 5. Loading State
```
┌────────────────────────────────────┐
│  ⟳  Loading...                     │  ← Spinner rotates
└────────────────────────────────────┘

Colors:
- Background: #2563eb (blue-600)
- Text: #ffffff (white)
- Spinner: #ffffff (white)

Spinner:
- Size: 16px (w-4 h-4)
- Style: Circular arc (partial circle)
- Animation: Infinite rotation
- Speed: 1 second per rotation

States:
- Cursor: wait
- Disabled: true
- Pointer-events: none

Layout:
- Spinner on left
- Text on right
- Gap: 8px
- Both centered

CSS:
background: #2563eb;
color: #ffffff;
cursor: wait;
pointer-events: none;

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
}
```

**When Shown:**
- After clicking Next
- During auto-save (~1 second)
- During transition (~300ms)
- Total: ~1.3 seconds

## Keyboard Hint Design

### Mac Version
```
┌──────────────────────────────────┐
│  ⌘   +   Enter    to continue    │
│ ┌─┐     ┌─────┐                  │
│ │⌘│  +  │Enter│  to continue     │
│ └─┘     └─────┘                  │
└──────────────────────────────────┘

Platform Detection:
if (navigator.platform.includes('Mac')) {
  show '⌘'
}

Command Key Box:
- Width: auto (fits ⌘ symbol)
- Height: 28px
- Padding: 4px 8px
- Background: #f3f4f6 (gray-100)
- Border: 1px solid #d1d5db (gray-300)
- Border-radius: 4px
- Font: 12px monospace

Enter Key Box:
- Width: auto (fits "Enter" text)
- Height: 28px
- Padding: 4px 8px
- Same styling as Command key

Plus Sign:
- Plain text
- Color: #6b7280 (gray-500)
- Margin: 0 4px

"to continue" Text:
- Color: #6b7280 (gray-500)
- Font-size: 14px
- Margin-left: 8px
```

### Windows/Linux Version
```
┌──────────────────────────────────┐
│  Ctrl  +  Enter   to continue    │
│ ┌────┐   ┌─────┐                 │
│ │Ctrl│ + │Enter│  to continue    │
│ └────┘   └─────┘                 │
└──────────────────────────────────┘

Platform Detection:
if (!navigator.platform.includes('Mac')) {
  show 'Ctrl'
}

Same styling as Mac version
Only difference: "Ctrl" text instead of ⌘ symbol
```

### Complete Keyboard Hint Layout
```tsx
<div className="text-sm text-gray-500 flex items-center gap-2">
  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
  </kbd>
  <span>+</span>
  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
    Enter
  </kbd>
  <span className="ml-1">to continue</span>
</div>
```

## Requirements Checklist Visual

### Box Design
```
┌────────────────────────────────────────────────┐
│ Required to Continue:                          │
│                                                │
│ ○ Campaign Name (min 5 characters)            │
│ ○ Campaign Type                                │
│ ○ Campaign Owner                               │
│                                                │
│ All other fields are optional and can be      │
│ filled in later                                │
└────────────────────────────────────────────────┘

Container:
- Background: #f9fafb (gray-50)
- Border: 1px solid #e5e7eb (gray-200)
- Border-radius: 8px
- Padding: 16px
- Margin: 16px 0

Header:
- Text: "Required to Continue:"
- Font-size: 14px
- Font-weight: 600 (semibold)
- Color: #111827 (gray-900)
- Margin-bottom: 8px

Footer:
- Text: "All other fields are optional..."
- Font-size: 12px
- Font-style: italic
- Color: #6b7280 (gray-500)
- Margin-top: 12px
```

### Requirement Item - Incomplete
```
○ Campaign Name (min 5 characters)
↑ Gray circle (empty)

Circle:
- Content: "○"
- Color: #9ca3af (gray-400)
- Size: 14px

Text:
- Color: #374151 (gray-700)
- Font-size: 14px
- Font-weight: 400 (normal)
- Text-decoration: none

Layout:
- Display: Flex
- Gap: 8px
- Align-items: Center
```

### Requirement Item - Complete
```
✓ Campaign Name (min 5 characters)
↑ Green checkmark   ↑ Strikethrough text

Checkmark:
- Content: "✓"
- Color: #10b981 (green-600)
- Size: 14px
- Font-weight: 600

Text:
- Color: #6b7280 (gray-600) ← Lighter
- Font-size: 14px
- Text-decoration: line-through
- Opacity: 0.8

Animation (when completing):
@keyframes checkAppear {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

animation: checkAppear 200ms ease-out;
```

### All States Example

#### Initial (All Incomplete)
```
┌────────────────────────────────────────────────┐
│ Required to Continue:                          │
│                                                │
│ ○ Campaign Name (min 5 characters)            │
│ ○ Campaign Type                                │
│ ○ Campaign Owner                               │
│                                                │
│ All other fields are optional...              │
└────────────────────────────────────────────────┘

Next Button: GRAY (disabled)
```

#### Partially Complete
```
┌────────────────────────────────────────────────┐
│ Required to Continue:                          │
│                                                │
│ ✓ Campaign Name (min 5 characters)            │ ← Green, strikethrough
│ ✓ Campaign Type                                │ ← Green, strikethrough
│ ○ Campaign Owner                               │ ← Gray, normal
│                                                │
│ All other fields are optional...              │
└────────────────────────────────────────────────┘

Next Button: GRAY (still disabled)
```

#### All Complete
```
┌────────────────────────────────────────────────┐
│ Required to Continue:                          │
│                                                │
│ ✓ Campaign Name (min 5 characters)            │ ← All green
│ ✓ Campaign Type                                │ ← All strikethrough
│ ✓ Campaign Owner                               │ ← All complete
│                                                │
│ All other fields are optional...              │
└────────────────────────────────────────────────┘

Next Button: BLUE (enabled!)
```

## Complete Footer Layout

### Desktop Layout (>1024px)
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│ Border-top: 1px solid #e5e7eb                           │
│ ──────────────────────────────────────────────────────  │
│                                                          │
│ ┌─────────────────┐                  ┌────────────────┐ │
│ │ ⌘ + Enter       │                  │ Next: Select   │ │
│ │ to continue     │                  │ Template    →  │ │
│ └─────────────────┘                  └────────────────┘ │
│  120px wide                           200px min-width   │
│                                                          │
│  Keyboard Hint                        Next Button       │
│  - Flex: 0 0 auto                     - Flex: 0 0 auto │
│  - Align-self: center                 - Align-self: center
│                                                          │
│ ← Large gap (space-between) →                          │
└──────────────────────────────────────────────────────────┘

Padding: 24px 0 0 0
Margin: 32px 0 0 0
```

### Tablet Layout (768px - 1024px)
```
┌────────────────────────────────────────────┐
│ ⌘ + Enter              Next: Select    → │
│                         Template          │
└────────────────────────────────────────────┘

Same layout as desktop
Slightly less horizontal space
Both elements still visible side-by-side
```

### Mobile Layout (<768px)
```
┌──────────────────────────────────┐
│                                  │
│  ⌘ + Enter to continue           │  ← Centered
│                                  │
│  ┌────────────────────────────┐ │
│  │ Next: Select Template   → │ │  ← Full width
│  └────────────────────────────┘ │
│                                  │
└──────────────────────────────────┘

Layout Changes:
- Flex-direction: column
- Align-items: center
- Gap: 16px (between hint and button)
- Keyboard hint: Centered
- Button: Width 100% (full width)
- Button: Max-width: 400px (doesn't get too wide)
```

## Error Message Visuals

### Campaign Name Error (Inline)
```
┌─────────────────────────────────────┐
│ Campaign Name *                     │
├─────────────────────────────────────┤
│ Test                                │  ← Red border
└─────────────────────────────────────┘
  ⚠️ Campaign name must be at least 5 characters
  ↑ Red text, 14px

Input Field:
- Border: 2px solid #ef4444 (red-500)
- Border-radius: 6px
- Focus: Red ring

Error Message:
- Color: #dc2626 (red-600)
- Font-size: 14px
- Margin-top: 4px
- Display: Flex
- Gap: 4px (icon to text)
```

### Campaign Type Error (Block)
```
┌─────────────────────────────────────────────┐
│                                             │
│ ⚠️ Please select a campaign type to       │
│    continue                                 │
│                                             │
└─────────────────────────────────────────────┘

Container:
- Background: #fef2f2 (red-50)
- Border: 1px solid #fecaca (red-200)
- Border-radius: 8px
- Padding: 12px
- Margin-top: 8px

Content:
- Display: Flex
- Align-items: Center
- Gap: 8px

Icon:
- Content: ⚠️
- Size: 16px

Text:
- Color: #991b1b (red-800)
- Font-size: 14px
```

### Campaign Owner Error (Inline + Toast)
```
Inline Error (Below Dropdown):
┌─────────────────────────────────────┐
│ Campaign Owner *                    │
├─────────────────────────────────────┤
│ Select owner...                  ▼  │
└─────────────────────────────────────┘
⚠️ Campaign owner is required
(Red text, 14px, margin-top: 8px)

+

Toast Notification (Top Right):
┌────────────────────────────────────┐
│ ❌ Please select a campaign owner  │
└────────────────────────────────────┘

Toast:
- Position: Fixed, top: 16px, right: 16px
- Background: #ef4444 (red-500)
- Color: #ffffff (white)
- Padding: 12px 16px
- Border-radius: 8px
- Box-shadow: 0 10px 15px rgba(0,0,0,0.1)
- Font-size: 14px
- Z-index: 100

Animation:
- Entry: Slide in from right + fade in
- Exit: Slide out to right + fade out
- Duration: 3 seconds
```

## Button Icon (ChevronRight)

### Icon Specifications
```
Icon: ChevronRight from Lucide Icons
Size: 20px × 20px (w-5 h-5)
Stroke-width: 2
Color: Inherits from button text
Position: Right side of text
Margin-left: 8px (gap)

SVG:
<svg width="20" height="20" viewBox="0 0 24 24">
  <path d="M9 18l6-6-6-6" stroke="currentColor" />
</svg>

States:
- Disabled: #6b7280 (gray)
- Enabled: #ffffff (white)
- Loading: Hidden (replaced by spinner)
```

## Loading Spinner Design

### Spinner SVG
```
Size: 16px × 16px (w-4 h-4)
Color: #ffffff (white)
Style: Partial circular arc

SVG:
<svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
  <!-- Background circle (faded) -->
  <circle
    className="opacity-25"
    cx="12"
    cy="12"
    r="10"
    stroke="currentColor"
    strokeWidth="4"
  />

  <!-- Spinning arc -->
  <path
    className="opacity-75"
    fill="currentColor"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
  />
</svg>

Animation:
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

animation: spin 1s linear infinite;
```

### Loading Button Layout
```
┌────────────────────────────────────┐
│  [⟳]  Loading...                   │
│   ↑    ↑                           │
│   |    Text (white)                │
│   Spinner (16px, rotating)         │
└────────────────────────────────────┘

Layout:
- Display: Flex
- Align-items: Center
- Justify-content: Center
- Gap: 8px

Elements:
1. Spinner (left)
2. Text (right)
```

## Color Palette Summary

### Button Colors
```css
/* Disabled State */
--btn-disabled-bg: #d1d5db      /* gray-300 */
--btn-disabled-text: #6b7280    /* gray-500 */

/* Enabled State */
--btn-enabled-bg: #2563eb       /* blue-600 */
--btn-enabled-text: #ffffff     /* white */
--btn-enabled-shadow: 0 1px 2px rgba(0,0,0,0.05)

/* Hover State */
--btn-hover-bg: #1d4ed8         /* blue-700 */
--btn-hover-shadow: 0 4px 6px rgba(0,0,0,0.1)

/* Loading State */
--btn-loading-bg: #2563eb       /* blue-600 */
--btn-loading-text: #ffffff     /* white */
--btn-loading-spinner: #ffffff  /* white */
```

### Keyboard Hint Colors
```css
--hint-text: #6b7280            /* gray-500 */
--hint-kbd-bg: #f3f4f6          /* gray-100 */
--hint-kbd-border: #d1d5db      /* gray-300 */
--hint-kbd-text: #374151        /* gray-700 */
```

### Requirements Checklist Colors
```css
--checklist-bg: #f9fafb         /* gray-50 */
--checklist-border: #e5e7eb     /* gray-200 */
--checklist-header: #111827     /* gray-900 */
--checklist-complete: #10b981   /* green-600 */
--checklist-incomplete: #9ca3af /* gray-400 */
--checklist-text: #374151       /* gray-700 */
--checklist-text-done: #6b7280  /* gray-600 */
--checklist-footer: #6b7280     /* gray-500 */
```

### Error Colors
```css
--error-text: #dc2626           /* red-600 */
--error-bg: #fef2f2             /* red-50 */
--error-border: #fecaca         /* red-200 */
--error-strong: #991b1b         /* red-800 */
--error-toast-bg: #ef4444       /* red-500 */
--error-toast-text: #ffffff     /* white */
```

### Footer Colors
```css
--footer-border: #e5e7eb        /* gray-200 */
--footer-bg: transparent        /* inherits page bg */
```

## Spacing & Dimensions

### Button Dimensions
```css
/* Size */
min-width: 200px
height: 48px (3rem)
padding: 12px 24px

/* Spacing */
border-radius: 8px
gap: 8px (between text and icon)

/* Font */
font-size: 14px
font-weight: 500
line-height: 1.5
```

### Footer Dimensions
```css
/* Spacing */
padding-top: 24px
margin-top: 32px
border-top: 1px solid

/* Layout */
display: flex
justify-content: space-between
align-items: center
```

### Keyboard Hint Dimensions
```css
/* Keys */
padding: 4px 8px
border-radius: 4px
border: 1px solid
font-size: 12px

/* Container */
gap: 8px (between elements)
font-size: 14px
```

### Requirements Checklist Dimensions
```css
/* Container */
padding: 16px
border-radius: 8px
border: 1px solid
margin: 16px 0

/* Items */
gap: 8px (icon to text)
margin: 4px 0 (between items)

/* Text */
font-size: 14px
line-height: 1.5
```

## Accessibility Attributes

### Button ARIA
```tsx
<button
  onClick={handleNext}
  disabled={!canProceed || isNavigating}
  aria-label="Proceed to template selection"
  aria-disabled={!canProceed || isNavigating}
  role="button"
  type="button"
>
  {isNavigating ? 'Loading...' : 'Next: Select Template'}
</button>
```

### Keyboard Hint ARIA
```tsx
<div
  className="keyboard-hint"
  role="note"
  aria-label="Keyboard shortcut: Command Enter to continue"
>
  <kbd aria-label="Command key">⌘</kbd>
  <span>+</span>
  <kbd aria-label="Enter key">Enter</kbd>
  <span>to continue</span>
</div>
```

### Requirements Checklist ARIA
```tsx
<div
  className="requirements-checklist"
  role="status"
  aria-live="polite"
  aria-label="Required fields checklist"
>
  <h3 id="requirements-heading">Required to Continue:</h3>
  <ul aria-labelledby="requirements-heading">
    <li aria-label="Campaign name: {completed ? 'complete' : 'incomplete'}">
      {completed ? '✓' : '○'} Campaign Name
    </li>
  </ul>
</div>
```

## Focus States

### Button Focus
```css
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Disabled button focus */
button:disabled:focus {
  outline: none;
  box-shadow: none;
}
```

### Keyboard Hint Keys Focus
```css
kbd:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Not typically focusable, but accessible if needed */
```

## Complete Visual State Flow

```
Initial Load
    ↓
┌─────────────────────────┐
│ Button: GRAY (disabled) │
│ Checklist: All ○        │
│ Keyboard: Shown         │
└─────────────────────────┘
    ↓
User Fills Name (5+ chars)
    ↓
┌─────────────────────────┐
│ Button: Still GRAY      │
│ Checklist: ✓ ○ ○        │
│ First requirement ✓     │
└─────────────────────────┘
    ↓
User Selects Type
    ↓
┌─────────────────────────┐
│ Button: Still GRAY      │
│ Checklist: ✓ ✓ ○        │
│ Two requirements ✓      │
└─────────────────────────┘
    ↓
User Selects Owner
    ↓
┌─────────────────────────┐
│ Button: BLUE (enabled!) │
│ Checklist: ✓ ✓ ✓        │
│ All requirements ✓      │
└─────────────────────────┘
    ↓
User Hovers Button
    ↓
┌─────────────────────────┐
│ Button: DARK BLUE       │
│ Shadow: Larger          │
│ Transform: Lift up      │
└─────────────────────────┘
    ↓
User Clicks Button
    ↓
┌─────────────────────────┐
│ Button: Loading...      │
│ Spinner: Rotating       │
│ Disabled: Yes           │
└─────────────────────────┘
    ↓
Auto-Save (~1 second)
    ↓
┌─────────────────────────┐
│ Toast: "Draft saved"    │
│ Still loading...        │
└─────────────────────────┘
    ↓
Scroll to Top (300ms)
    ↓
Navigate to Step 2
    ↓
┌─────────────────────────┐
│ Template Selection Page │
│ Step 2 now current      │
└─────────────────────────┘
```

## All Visual Elements Complete ✅

- ✅ Five button states (disabled, enabled, hover, active, loading)
- ✅ Keyboard hint (Mac ⌘ and Windows Ctrl variants)
- ✅ Requirements checklist with real-time updates
- ✅ Footer layout (space-between, centered)
- ✅ Error messages (inline and toast)
- ✅ Loading spinner with animation
- ✅ ChevronRight icon
- ✅ Complete color palette
- ✅ All dimensions and spacing
- ✅ Responsive layouts (desktop, tablet, mobile)
- ✅ Accessibility attributes
- ✅ Focus states
- ✅ Animation specifications

**Status**: All visual specifications documented ✅
