# Campaign Save Draft - Visual Reference Guide

## Component Location

```
┌────────────────────────────────────────────────────────────────┐
│ Campaign Wizard - Step 1                                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│ ┌────────────────────────────────┐  ┌──────────────────────┐  │
│ │ 1. Basic Info → 2 → 3 → 4 → ... │  │ [💾] Save Draft     │  │ ← HERE
│ └────────────────────────────────┘  └──────────────────────┘  │
│     Step Progress (left)             Save Button (top right)  │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ Basic Information                                        │  │
│ │ Campaign Name: [...........................]             │  │
│ │ Description: [.....................................]     │  │
│ │ ...                                                      │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Button States - Visual Examples

### 1. Default (Idle) State
```
┌────────────────────────┐
│  💾  Save Draft        │  ← White background
└────────────────────────┘     Gray border (#d1d5db)
                               Dark gray text (#374151)
                               Clickable (cursor: pointer)
```

**CSS:**
```css
background: #ffffff
border: 2px solid #d1d5db
color: #374151
padding: 8px 16px
border-radius: 8px
font-weight: 500
```

### 2. Hover State
```
┌────────────────────────┐
│  💾  Save Draft        │  ← Light gray background
└────────────────────────┘     Smooth transition
                               Darker border
```

**CSS:**
```css
background: #f9fafb  (on hover)
border: 2px solid #d1d5db
transition: all 200ms
```

### 3. Saving State
```
┌────────────────────────┐
│  ⏳  Saving...         │  ← Blue background
└────────────────────────┘     White text
                               Spinner animates
                               Disabled (cursor: wait)
```

**CSS:**
```css
background: #2563eb
border: 2px solid #2563eb
color: #ffffff
cursor: wait
```

**Icon:**
```tsx
<Loader2 className="w-4 h-4 animate-spin" />
```

### 4. Saved State (Success)
```
┌────────────────────────┐
│  ✓  Saved              │  ← Green background
└────────────────────────┘     White text
                               Checkmark icon
                               Shows for 2 seconds
```

**CSS:**
```css
background: #16a34a
border: 2px solid #16a34a
color: #ffffff
```

**Icon:**
```tsx
<Check className="w-4 h-4" />
```

### 5. Error State
```
┌────────────────────────┐
│  ❌  Error             │  ← Red background
└────────────────────────┘     White text
                               X icon
                               Shows for 3 seconds
```

**CSS:**
```css
background: #dc2626
border: 2px solid #dc2626
color: #ffffff
```

**Icon:**
```tsx
<X className="w-4 h-4" />
```

## Button with Indicators

### With Last Saved Timestamp
```
┌────────────────────────┐
│  💾  Save Draft        │  ← Button
└────────────────────────┘
Last saved: 30 seconds ago  ← Timestamp (below)

Font-size: 12px
Color: #6b7280 (gray-500)
Updates every 1 second
```

### With Unsaved Changes Indicator
```
┌────────────────────────┐
│  💾  Save Draft        │  ← Button
└────────────────────────┘
Last saved: 30 seconds ago  ← Timestamp
● Unsaved changes           ← Warning indicator

Yellow pulsing dot (●)
Color: #eab308 (yellow-500)
Animation: pulse
```

### Combined Display (Full State)
```
┌────────────────────────┐
│  💾  Save Draft        │  ← Button (idle state)
└────────────────────────┘
Last saved: 2 minutes ago   ← Timestamp
● Unsaved changes           ← Warning

This is the typical state when:
- User has made changes
- Last save was 2 minutes ago
- Auto-save will trigger in ~3 seconds
```

## Button State Transitions

### Timeline View
```
Action: User clicks "Save Draft"

0.0s  [💾 Save Draft]     ← Idle (white)
      ↓ Click
0.0s  [⏳ Saving...]      ← Saving (blue) + spinner
      ↓ Wait for API
1.0s  [✓ Saved]          ← Success (green) + checkmark
      ↓ Wait 2 seconds
3.0s  [💾 Save Draft]     ← Back to idle (white)
      Last saved: Just now
```

### Error Flow Timeline
```
Action: Save fails

0.0s  [💾 Save Draft]     ← Idle
      ↓ Click
0.0s  [⏳ Saving...]      ← Saving (blue)
      ↓ API error
1.0s  [❌ Error]          ← Error (red)
      ↓ Wait 3 seconds
4.0s  [⏳ Saving...]      ← Auto-retry (blue)
      ↓ Success
5.0s  [✓ Saved]          ← Success (green)
      ↓ Wait 2 seconds
7.0s  [💾 Save Draft]     ← Back to idle
```

## Auto-Save Visual Flow

### 5-Second Countdown
```
0s - User types "Campaign Name"
     [💾 Save Draft]
     ● Unsaved changes
     ↓ Timer starts

3s - User stops typing
     [💾 Save Draft]
     ● Unsaved changes
     ↓ Countdown continues

5s - Timer expires
     [⏳ Saving...]  ← Auto-save triggers
     ↓

6s - Save complete
     [✓ Saved]
     Last saved: Just now
     ↓

8s - Revert to idle
     [💾 Save Draft]
     Last saved: Just now
```

## Unsaved Changes Modal

### Full Modal Layout
```
┌─────────────────────────────────────────────────────┐
│                    Dark Overlay                     │
│            (bg-black bg-opacity-50)                 │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │  ┌─────┐                                    │   │
│   │  │ ⚠️  │  Unsaved Changes            [×]   │   │
│   │  └─────┘  You have unsaved changes...      │   │
│   ├─────────────────────────────────────────────┤   │
│   │                                             │   │
│   │ Would you like to save your draft before   │   │
│   │ leaving?                                    │   │
│   │                                             │   │
│   │ • Save Draft: Your progress will be saved  │   │
│   │   and you can continue later               │   │
│   │                                             │   │
│   │ • Exit Without Saving: All changes will be │   │
│   │   permanently lost                         │   │
│   │                                             │   │
│   ├─────────────────────────────────────────────┤   │
│   │                                             │   │
│   │ ┌─────────────────────┐  ┌──────┐  ┌─────┐│   │
│   │ │ Exit Without Saving │  │Cancel│  │Save ││   │
│   │ │      🚪              │  │      │  │& Exit│   │
│   │ └─────────────────────┘  └──────┘  └─────┘│   │
│   │                                             │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Modal Dimensions
```
Width: 448px (max-width)
Height: auto
Padding: 24px
Border-radius: 12px
Shadow: 2xl (0 25px 50px -12px rgba(0, 0, 0, 0.25))
Background: white
Z-index: 50
```

### Modal Header
```
┌───────────────────────────────────────────┐
│ ┌────────┐                                │
│ │   ⚠️   │ Unsaved Changes           [×]  │
│ │        │ You have unsaved changes...    │
│ └────────┘                                │
└───────────────────────────────────────────┘

Warning Icon:
- Size: 48px circle
- Background: #fef3c7 (yellow-100)
- Icon: AlertTriangle (#d97706, 24px)

Heading:
- Font: 18px, semibold
- Color: #111827 (gray-900)

Description:
- Font: 14px
- Color: #6b7280 (gray-600)

Close Button (×):
- Size: 20px
- Color: #9ca3af (gray-400)
- Hover: #4b5563 (gray-600)
```

### Modal Content
```
┌───────────────────────────────────────────┐
│ Would you like to save your draft before │
│ leaving?                                  │
│                                           │
│ ● Save Draft: Your progress will be      │
│   saved and you can continue later       │
│                                           │
│ ● Exit Without Saving: All changes will  │
│   be permanently lost                    │
└───────────────────────────────────────────┘

Main Text:
- Font: 14px
- Color: #374151 (gray-700)

Bullet Points:
- Dot: 6px circle
- Blue dot for "Save Draft"
- Red dot for "Exit Without Saving"
- Font: 12px
- Color: #6b7280 (gray-600)
```

### Modal Footer (Buttons)
```
┌───────────────────────────────────────────┐
│ ┌────────────────┐ ┌────────┐ ┌─────────┐│
│ │Exit Without    │ │ Cancel │ │  Save & ││
│ │   Saving       │ │        │ │  Exit   ││
│ │     🚪         │ │        │ │   💾    ││
│ └────────────────┘ └────────┘ └─────────┘│
│                                           │
│ Background: #f9fafb (gray-50)             │
└───────────────────────────────────────────┘
```

### Button Styles

#### Exit Without Saving (Left)
```css
width: flex-1
padding: 10px 16px
background: white
border: 2px solid #d1d5db
color: #374151
border-radius: 8px
hover: bg-gray-100
```

#### Cancel (Middle)
```css
padding: 10px 16px
background: white
border: 2px solid #d1d5db
color: #374151
border-radius: 8px
hover: bg-gray-100
```

#### Save & Exit (Right, Primary)
```css
width: flex-1
padding: 10px 16px
background: #2563eb
border: 2px solid #2563eb
color: white
border-radius: 8px
hover: bg-blue-700
```

## Toast Notifications

### Success Toast
```
┌────────────────────────────────────┐
│ ✅ Draft saved successfully        │
└────────────────────────────────────┘

Position: Top right
Background: #10b981 (green-500)
Color: white
Padding: 12px 16px
Border-radius: 8px
Shadow: lg
Duration: 3 seconds
Animation: Slide in from right
```

### Error Toast
```
┌────────────────────────────────────────┐
│ ❌ Failed to save draft. Retrying...   │
└────────────────────────────────────────┘

Position: Top right
Background: #ef4444 (red-500)
Color: white
Padding: 12px 16px
Border-radius: 8px
Shadow: lg
Duration: 5 seconds
Animation: Slide in from right
```

## Browser Warning Dialog

### Chrome/Edge
```
┌─────────────────────────────────────┐
│ Leave site?                         │
│                                     │
│ Changes you made may not be saved. │
│                                     │
│           [Leave]  [Stay]           │
└─────────────────────────────────────┘

Native browser dialog
Cannot be styled
Triggered by beforeunload event
```

### Firefox
```
┌─────────────────────────────────────┐
│ This page is asking you to confirm │
│ that you want to leave - data you  │
│ have entered may not be saved      │
│                                     │
│         [Leave Page]  [Stay on Page]│
└─────────────────────────────────────┘

Native browser dialog
Cannot be styled
Triggered by beforeunload event
```

## Responsive Layouts

### Desktop (>768px)
```
┌──────────────────────────────────────────────────┐
│ Step Progress (left)      [Save Draft] (right)  │
└──────────────────────────────────────────────────┘

Button: Full size (auto width)
Indicators: Right-aligned below button
Modal: 448px width, centered
```

### Tablet (768px)
```
┌────────────────────────────────────┐
│ Steps (left)    [Save] (right)    │
└────────────────────────────────────┘

Button: Slightly smaller padding
Indicators: Below button
Modal: 90% width, max 448px
```

### Mobile (<640px)
```
┌──────────────────┐
│ Steps (stacked)  │
│ [Save Draft]     │
└──────────────────┘

Button: Full width or centered
Compact text
Modal: 95% width, smaller padding
Buttons: Stack vertically in modal
```

## Color Palette

### Button Colors
```css
/* Idle */
--bg-idle: #ffffff
--border-idle: #d1d5db
--text-idle: #374151
--bg-idle-hover: #f9fafb

/* Saving */
--bg-saving: #2563eb
--border-saving: #2563eb
--text-saving: #ffffff

/* Saved */
--bg-saved: #16a34a
--border-saved: #16a34a
--text-saved: #ffffff

/* Error */
--bg-error: #dc2626
--border-error: #dc2626
--text-error: #ffffff
```

### Indicator Colors
```css
/* Last Saved */
--text-timestamp: #6b7280

/* Unsaved Changes */
--dot-unsaved: #eab308
--text-unsaved: #6b7280
```

### Modal Colors
```css
/* Overlay */
--overlay-bg: rgba(0, 0, 0, 0.5)

/* Modal */
--modal-bg: #ffffff
--modal-border: #e5e7eb

/* Warning Icon */
--warning-bg: #fef3c7
--warning-icon: #d97706

/* Text */
--heading: #111827
--body: #374151
--muted: #6b7280

/* Footer */
--footer-bg: #f9fafb

/* Buttons */
--btn-primary-bg: #2563eb
--btn-secondary-bg: #ffffff
--btn-secondary-border: #d1d5db
```

### Toast Colors
```css
/* Success */
--toast-success-bg: #10b981
--toast-success-text: #ffffff

/* Error */
--toast-error-bg: #ef4444
--toast-error-text: #ffffff
```

## Animation Specifications

### Button Transitions
```css
transition: all 200ms ease-in-out

Properties animated:
- background-color
- border-color
- color
- transform (subtle scale on click)
```

### Spinner Animation
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

animation: spin 1s linear infinite
```

### Pulse Animation (Unsaved Dot)
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite
```

### Modal Animations
```css
/* Overlay fade in */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal slide + zoom in */
@keyframes zoom-in-slide {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(16px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

Overlay: fade-in 200ms
Modal: zoom-in-slide 300ms
```

### Toast Animations
```css
/* Slide in from right */
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Slide out to right */
@keyframes slide-out-right {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

Entry: slide-in-right 300ms
Exit: slide-out-right 200ms
```

## Icon Specifications

### Button Icons
```tsx
// Save (idle)
<Save className="w-4 h-4" />
Size: 16px x 16px
Stroke-width: 2
Color: Inherits from button text

// Loading (saving)
<Loader2 className="w-4 h-4 animate-spin" />
Size: 16px x 16px
Rotation: 360° continuous
Speed: 1s per rotation

// Checkmark (saved)
<Check className="w-4 h-4" />
Size: 16px x 16px
Stroke-width: 3
Bold appearance

// X (error)
<X className="w-4 h-4" />
Size: 16px x 16px
Stroke-width: 2
```

### Modal Icons
```tsx
// Warning (modal header)
<AlertTriangle className="w-6 h-6" />
Size: 24px x 24px
Color: #d97706 (yellow-600)

// Close (top right)
<X className="w-5 h-5" />
Size: 20px x 20px
Color: #9ca3af (gray-400)

// Exit button icon
<LogOut className="w-4 h-4" />
Size: 16px x 16px

// Save button icon
<Save className="w-4 h-4" />
Size: 16px x 16px
```

## Z-Index Hierarchy
```css
Save button: z-10 (stays above content)
Modal overlay: z-50 (above everything)
Modal content: z-50 (same layer as overlay)
Toast notifications: z-50 (same layer, different position)
```

## Accessibility

### Focus States
```css
/* Button focus */
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Modal trap focus */
When modal open:
- Focus moves to modal
- Tab cycles through modal buttons
- Cannot tab out to page content
```

### ARIA Labels
```tsx
// Save button
<button aria-label="Save campaign draft">
  Save Draft
</button>

// Modal
<div role="dialog" aria-modal="true">
  <button aria-label="Close dialog">×</button>
</div>

// Close button
<button aria-label="Close unsaved changes warning">
  ×
</button>
```

### Keyboard Support
```
Tab: Move between buttons
Shift+Tab: Move backwards
Enter: Activate focused button
Escape: Close modal (in modal)
Space: Activate focused button
```

## Complete Visual State Machine

```
┌─────────────┐
│   INITIAL   │ (No saves yet)
│  [💾 Save]  │
└──────┬──────┘
       │ User makes change
       ↓
┌─────────────┐
│  HAS        │ (● Unsaved changes)
│ CHANGES     │ [💾 Save Draft]
│             │ Last saved: 30s ago
└──────┬──────┘
       │ 5s timer OR manual click
       ↓
┌─────────────┐
│   SAVING    │ [⏳ Saving...]
│             │ (Blue, spinner)
└──────┬──────┘
       │
       ├──→ Success
       │    ↓
       │ ┌─────────────┐
       │ │   SAVED     │ [✓ Saved]
       │ │             │ (Green, 2s)
       │ └──────┬──────┘
       │        │
       │        ↓
       │ ┌─────────────┐
       │ │   IDLE      │ [💾 Save Draft]
       │ │             │ Last saved: Just now
       │ └─────────────┘
       │
       └──→ Error
            ↓
         ┌─────────────┐
         │   ERROR     │ [❌ Error]
         │             │ (Red, 3s)
         └──────┬──────┘
                │ Auto-retry
                ↓
         ┌─────────────┐
         │   SAVING    │ [⏳ Saving...]
         │  (RETRY)    │
         └─────────────┘
```

## All Visual Elements Complete ✅

- ✅ Button: 5 states (idle, hover, saving, saved, error)
- ✅ Icons: Save, Loader, Check, X
- ✅ Indicators: Last saved, Unsaved changes
- ✅ Modal: Layout, header, content, footer
- ✅ Modal buttons: 3 actions with icons
- ✅ Toast: Success and error styles
- ✅ Browser warning: Native dialogs
- ✅ Animations: Transitions, spin, pulse, slide
- ✅ Colors: Complete palette defined
- ✅ Responsive: Desktop, tablet, mobile layouts
- ✅ Accessibility: Focus, ARIA, keyboard support

**Status**: All visual states documented and specified ✅
