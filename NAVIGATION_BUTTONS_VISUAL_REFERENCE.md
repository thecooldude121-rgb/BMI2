# Campaign Wizard Step 2 - Navigation Buttons Visual Reference

## Button Layout

```
┌──────────────────────────────────────────────────────────────────┐
│                     Step 2: Select Template                       │
│                                                                   │
│  [Template Cards...]                                              │
│                                                                   │
│  ──────────────────────────────────────────────────────────────  │
│                                                                   │
│  ┌─────────────────────────┐      ┌──────────────────────────┐  │
│  │ ← Previous: Basic Info  │      │ Next: Build Sequence → │    │
│  │   (Gray, Bordered)      │      │     (Blue/Gray)         │    │
│  └─────────────────────────┘      └──────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Previous Button States

### Normal State
```
┌─────────────────────────┐
│  ←  Previous: Basic Info │
│     (Gray with border)   │
└─────────────────────────┘

Color: text-gray-700
Background: white
Border: 2px solid gray-300
Hover: bg-gray-50
```

### Disabled State (During Navigation)
```
┌─────────────────────────┐
│  ←  Previous: Basic Info │
│     (Dimmed, 50%)        │
└─────────────────────────┘

Opacity: 50%
Cursor: not-allowed
```

### Keyboard Shortcut
```
Alt + ← (Windows/Linux)
Option + ← (Mac)

Works from anywhere on Step 2
```

---

## Next Button States

### State 1: Disabled (No Template Selected)
```
┌──────────────────────────┐
│  Next: Build Sequence →  │
│      (Gray, Disabled)    │
└──────────────────────────┘

Background: bg-gray-300
Text: text-gray-500
Cursor: not-allowed
Cannot be clicked
```

### State 2: Enabled (Template Selected)
```
┌──────────────────────────┐
│  Next: Build Sequence →  │
│      (Blue, Active)      │
└──────────────────────────┘

Background: bg-blue-600
Text: text-white
Hover: bg-blue-700 + shadow
Ready to proceed
```

### State 3: Loading
```
┌──────────────────────────┐
│  ⏳  Loading...          │
│      (Blue, Spinner)     │
└──────────────────────────┘

Background: bg-blue-600
Spinner: Rotating icon
Duration: Minimum 500ms
Prevents double-clicks
```

---

## Interaction Flow Diagrams

### Scenario 1: No Template Selected
```
User on Step 2
    ↓
Looks at Next button
    ↓
[Gray, Disabled]
    ↓
Clicks button (or tries to)
    ↓
No action (cursor: not-allowed)
```

### Scenario 2: Template Selected, Clicks Next
```
User selects "Cold Outreach"
    ↓
Next button turns Blue
    ↓
User clicks Next
    ↓
Button shows "Loading..." (min 500ms)
    ↓
Auto-save current selection
    ↓
Load template sequences
    ↓
Scroll to top
    ↓
Navigate to Step 3
    ↓
Progress tracker updates
```

### Scenario 3: User Clicks Previous
```
User on Step 2 with template selected
    ↓
Clicks "Previous: Basic Info"
    ↓
Auto-save template selection
    ↓
Scroll to top
    ↓
Return to Step 1
    ↓
Fields pre-populated
```

### Scenario 4: Keyboard Shortcut
```
User on Step 2
    ↓
Presses Alt + Left Arrow
    ↓
Same as clicking Previous
    ↓
Auto-save → Scroll → Navigate
```

---

## Error States

### No Template Error
```
┌─────────────────────────────────────────┐
│  ⚠️ Please select a template or start   │
│     from scratch                         │
└─────────────────────────────────────────┘

Triggered when: User tries to proceed without selection
Toast position: Top-right
Duration: 3 seconds
Type: Error (red)
```

### Navigation Error
```
┌─────────────────────────────────────────┐
│  ❌ Failed to proceed to next step      │
└─────────────────────────────────────────┘

Triggered when: Network/system error
Toast position: Top-right
Duration: 4 seconds
Type: Error (red)
Button resets to enabled state
```

---

## Loading Sequence Details

### Template-Specific Loading

#### "Start from Scratch"
```javascript
selectedTemplateId: 'custom_blank'
Console: "Loading empty sequence builder for 'Start from Scratch'"
Next Step: Empty sequence editor
```

#### "Cold Outreach"
```javascript
selectedTemplateId: 'cold_outreach_basic'
Console: "Loading 5 pre-filled touches for 'Cold Outreach' template"
Next Step: 5 pre-configured email touches
```

#### Other Templates
```javascript
selectedTemplateId: 'linkedin_outreach' (example)
Console: "Loading sequences for LinkedIn Outreach"
Next Step: Template-specific sequence
```

---

## Minimum Load Time Logic

```typescript
const startTime = Date.now();

// Perform operations...

const elapsedTime = Date.now() - startTime;
const remainingTime = Math.max(0, 500 - elapsedTime);

if (remainingTime > 0) {
  await new Promise(resolve => setTimeout(resolve, remainingTime));
}
```

**Why 500ms?**
- Provides smooth UX
- Prevents jarring instant transitions
- Gives time for user to see loading state
- Prevents accidental double-clicks
- Industry standard for perceived performance

---

## Auto-Save Behavior

### When Auto-Save Occurs

1. **Template Selection Changed**
   - Immediately after selecting template
   - Console: "Auto-saving selected template: [id]"
   - Duration: ~500ms

2. **Before Navigation (Previous)**
   - When clicking Previous button
   - Console: "Auto-saving before going back to Step 1"
   - Ensures no data loss

3. **Before Navigation (Next)**
   - When clicking Next button
   - Part of loading sequence
   - Persists template choice

### What Gets Saved

```typescript
{
  selectedTemplateId: string | null,
  selectedTemplate: CampaignTemplate | null,
  step: 2,
  timestamp: number
}
```

---

## Button Labels & Icons

### Previous Button
- **Icon:** ChevronLeft (←)
- **Label:** "Previous: Basic Info"
- **Position:** Left side of button
- **Icon Animation:** Moves left on hover

### Next Button (Normal)
- **Icon:** ChevronRight (→)
- **Label:** "Next: Build Sequence"
- **Position:** Right side of button

### Next Button (Loading)
- **Icon:** Loader2 (spinning)
- **Label:** "Loading..."
- **Position:** Left side
- **Animation:** Continuous rotation

---

## Responsive Behavior

### Desktop (≥1024px)
```
[← Previous]                    [Next →]
Full labels visible
Standard padding
```

### Tablet (768px - 1023px)
```
[← Previous]              [Next →]
Full labels visible
Slightly reduced padding
```

### Mobile (<768px)
```
[← Back]                  [Next →]
Shortened labels if needed
Optimized touch targets (44px min)
```

---

## Accessibility Features

### Previous Button
```html
<button
  onClick={handlePrevious}
  disabled={isNavigating}
  className="..."
  aria-label="Go back to Basic Info step"
>
  <ChevronLeft className="w-4 h-4" />
  <span>Previous: Basic Info</span>
</button>
```

### Next Button
```html
<button
  onClick={handleNext}
  disabled={!selectedTemplateId || isNavigating}
  aria-label="Proceed to Build Sequence step"
  aria-disabled={!selectedTemplateId}
>
  {isNavigating ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      <span>Loading...</span>
      <span className="sr-only">Loading sequences</span>
    </>
  ) : (
    <>
      <span>Next: Build Sequence</span>
      <ChevronRight className="w-4 h-4" />
    </>
  )}
</button>
```

### Keyboard Navigation
- Tab order: Previous → Next
- Enter/Space to activate
- Alt+Left for Previous shortcut
- Focus visible indicators

---

## Testing Checklist

- [ ] Previous button click works
- [ ] Previous keyboard shortcut works (Alt+Left)
- [ ] Next button disabled when no template
- [ ] Next button enabled when template selected
- [ ] Next button shows loading state
- [ ] Loading lasts minimum 500ms
- [ ] Scroll to top on both navigations
- [ ] Auto-save before navigation
- [ ] Error shown when no template
- [ ] Double-click prevention works
- [ ] Both buttons disabled during loading
- [ ] Console logs correct messages
- [ ] Keyboard focus visible
- [ ] Touch targets adequate on mobile

---

## Status: ✅ COMPLETE

All navigation button features implemented and ready for testing.
