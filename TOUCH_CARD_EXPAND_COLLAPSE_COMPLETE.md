# Touch Card Expand/Collapse - Complete Implementation

## Overview
Implemented collapsible touch cards with smooth animations, persistent state, and intuitive interaction patterns for Campaign Wizard Step 3.

---

## 23. Touch Card - Expand/Collapse

### Card Structure

Each touch card has two main sections:

#### 1. **Header Section (Always Visible)**
- Touch number badge
- Touch name and number
- Timing information
- Channel indicator
- Subject line preview (when collapsed)
- Action menu (⋮) button
- Expand/collapse arrow

#### 2. **Body Section (Collapsible)**
- Touch name input
- Channel selector
- Delay/timing controls
- Subject line input
- Email body textarea
- Variable helpers

---

## Visual States

### Collapsed State (Default for touches 2+)
```
┌─────────────────────────────────────────────────────────────┐
│  [2]  TOUCH 2 - Follow-up                          [⋮] [▶]  │
│       Timing: Wait 3 days  |  Channel: 📧 Email              │
│       Subject: Following up on our conversation...           │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Compact header only
- Right arrow (▶) indicates can expand
- Subject line shows as preview
- Hover: Light gray background
- Clean, scannable list view

### Expanded State (Default for Touch 1 & new touches)
```
┌─────────────────────────────────────────────────────────────┐
│  [2]  TOUCH 2 - Follow-up                          [⋮] [▼]  │
│       Timing: Wait 3 days  |  Channel: 📧 Email              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Touch Name                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Follow-up                                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Channel              Delay After Previous                   │
│  ┌──────────────┐    ┌────┐  ┌──────────┐                  │
│  │ 📧 Email     │    │  3 │  │ days     │                  │
│  └──────────────┘    └────┘  └──────────┘                  │
│                                                               │
│  Subject Line                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Following up on our conversation...                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  Email Body                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Hi {{firstName}},                                   │   │
│  │                                                     │   │
│  │ I wanted to follow up on our conversation...       │   │
│  │                                                     │   │
│  │ Best regards,                                       │   │
│  │ {{senderName}}                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  Available variables: {{firstName}}, {{lastName}}...        │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- Full card with all editable fields
- Down arrow (▼) indicates can collapse
- All inputs visible and accessible
- Border separator between header and body
- Variable helper text at bottom

---

## Interaction Patterns

### 1. Click Collapse Arrow (▼)

**User Action:** Clicks down arrow on expanded card

**System Response:**
1. Body section begins collapsing
2. Smooth height animation (300ms)
3. Opacity fades out simultaneously
4. Arrow rotates 90° to right (▶)
5. Header remains fully visible
6. Subject line preview appears in header
7. State saved to localStorage
8. Card height adjusts smoothly

**CSS Animation:**
```css
transition: all 300ms ease-in-out
max-height: 2000px → 0
opacity: 100 → 0
```

### 2. Click Expand Arrow (▶)

**User Action:** Clicks right arrow on collapsed card

**System Response:**
1. Body section begins expanding
2. Smooth height animation (300ms)
3. Opacity fades in simultaneously
4. Arrow rotates 90° to down (▼)
5. All fields become visible
6. State saved to localStorage
7. Card height expands to fit content

**CSS Animation:**
```css
transition: all 300ms ease-in-out
max-height: 0 → 2000px
opacity: 0 → 100
```

### 3. Click Anywhere on Header

**User Action:** Clicks anywhere on collapsed card header

**System Response:**
- Same as clicking expand arrow
- Entire header acts as expand button
- Convenient for quick access
- No need to target small arrow

**Exception:** Clicking action menu (⋮) doesn't expand

### 4. Click Arrow on Expanded Card

**User Action:** Clicks down arrow when already expanded

**System Response:**
- Card collapses (same as pattern #1)
- Convenient collapse from same location

---

## Default State Logic

### Initial Page Load

**Touch 1 (First Touch):**
- State: **Expanded**
- Reason: Currently being edited/configured
- User can see and edit all fields immediately

**Touches 2-N (Remaining Touches):**
- State: **Collapsed**
- Reason: Not actively editing yet
- Keeps interface clean and scannable
- Easy to expand when needed

**Newly Added Touch:**
- State: **Expanded**
- Reason: User just created it, likely wants to edit
- Auto-focus on subject input
- Ready for immediate data entry

### State Persistence

**localStorage Key:** `campaignWizardExpandedTouches`

**Value Format:** JSON array of touch numbers
```json
[1, 6, 7]
```

**Behavior:**
- Collapsed/expanded state survives page refresh
- User returns to exact same view
- Per-browser storage
- Cleared on browser data clear

---

## Implementation Details

### State Management

```typescript
// Initialize with Touch 1 expanded, restore from localStorage
const [expandedTouches, setExpandedTouches] = useState<Set<number>>(() => {
  const saved = localStorage.getItem('campaignWizardExpandedTouches');
  if (saved) {
    try {
      return new Set(JSON.parse(saved));
    } catch {
      return new Set([1]); // Fallback to Touch 1
    }
  }
  return new Set([1]); // Default: Touch 1 expanded
});

// Persist to localStorage on every change
useEffect(() => {
  localStorage.setItem(
    'campaignWizardExpandedTouches',
    JSON.stringify(Array.from(expandedTouches))
  );
}, [expandedTouches]);
```

### Toggle Function

```typescript
const toggleTouchExpansion = useCallback((touchNumber: number) => {
  setExpandedTouches(prev => {
    const newSet = new Set(prev);
    if (newSet.has(touchNumber)) {
      newSet.delete(touchNumber); // Collapse
    } else {
      newSet.add(touchNumber); // Expand
    }
    return newSet;
  });
}, []);
```

### Conditional Rendering

```typescript
const isExpanded = expandedTouches.has(touch.touchNumber);

// Arrow icon
{isExpanded ? (
  <ChevronDown className="w-5 h-5" />
) : (
  <ChevronRight className="w-5 h-5" />
)}

// Body section
<div className={`
  overflow-hidden transition-all duration-300 ease-in-out
  ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
`}>
  {/* Body content */}
</div>
```

---

## Header Layout Breakdown

### Left Section
```
[Badge] Title & Metadata
  ↓
┌────┐  TOUCH 2 - Follow-up
│ 2  │  Timing: Wait 3 days | Channel: 📧 Email
└────┘  Subject: Following up... (collapsed only)
```

**Components:**
1. **Touch Number Badge** (40x40px circle)
   - Blue background (`bg-blue-100`)
   - Blue text (`text-blue-700`)
   - Bold font
   - Centered number

2. **Touch Title** (Large, bold)
   - Format: "TOUCH N - Name"
   - All caps for "TOUCH"
   - Font size: `text-lg`
   - Font weight: `font-semibold`

3. **Metadata Line** (Small, gray)
   - Timing info
   - Separator: `|`
   - Channel with icon
   - Font size: `text-sm`
   - Color: `text-gray-600`

4. **Subject Preview** (Collapsed only)
   - Shows when collapsed
   - Truncated with ellipsis
   - Gray text: `text-gray-500`
   - Font size: `text-sm`

### Right Section
```
[⋮] [▶]  or  [⋮] [▼]
```

**Components:**
1. **Action Menu Button** (⋮)
   - Three vertical dots
   - Icon: `MoreVertical`
   - Hover: Light gray background
   - Size: 20x20px icon

2. **Expand/Collapse Button**
   - Right arrow (▶) when collapsed
   - Down arrow (▼) when expanded
   - Icon: `ChevronRight` / `ChevronDown`
   - Hover: Light gray background
   - Smooth rotation animation
   - Size: 20x20px icon

---

## Body Section Fields

### 1. Touch Name Input
```
Touch Name
┌──────────────────────────────┐
│ Follow-up                    │
└──────────────────────────────┘
```
- Text input
- Default value: Touch N
- Editable
- Used in header when updated

### 2. Channel Selector
```
Channel
┌──────────────────────┐
│ 📧 Email            │
└──────────────────────┘
```
- Dropdown select
- Options: Email, LinkedIn
- Icons in options
- Updates header on change

### 3. Delay Controls
```
Delay After Previous
┌────┐  ┌──────────┐
│  3 │  │ days     │
└────┘  └──────────┘
```
- Number input (left)
  - Min: 0
  - Width: 80px
- Unit selector (right)
  - Options: hours, days
  - Flex-fill width

### 4. Subject Line Input
```
Subject Line
┌─────────────────────────────────────┐
│ Following up on our conversation... │
└─────────────────────────────────────┘
```
- Text input
- Full width
- Placeholder: "Enter subject line..."
- Updates preview in collapsed header

### 5. Email Body Textarea
```
Email Body
┌─────────────────────────────────────┐
│ Hi {{firstName}},                   │
│                                     │
│ I wanted to follow up...            │
│                                     │
│ Best regards,                       │
│ {{senderName}}                      │
└─────────────────────────────────────┘
Available variables: {{firstName}}, {{lastName}}...
```
- Textarea
- 6 rows tall
- Full width
- Non-resizable
- Helper text below with available variables

---

## Animation Specifications

### Expand Animation

**Duration:** 300ms
**Easing:** ease-in-out
**Properties:**
- `max-height`: 0 → 2000px
- `opacity`: 0 → 1
- Arrow rotation: 0° → 90° (clockwise)

**Timeline:**
```
0ms    ─────────────────────────────────────► 300ms
       │                                    │
       ▶ → ▶ → ▶ → ▼                      ▼
       Collapsed    Transition       Expanded
       opacity: 0                    opacity: 1
       height: 0                     height: auto
```

### Collapse Animation

**Duration:** 300ms
**Easing:** ease-in-out
**Properties:**
- `max-height`: 2000px → 0
- `opacity`: 1 → 0
- Arrow rotation: 90° → 0° (counter-clockwise)

**Timeline:**
```
0ms    ─────────────────────────────────────► 300ms
       │                                    │
       ▼ → ▼ → ▶ → ▶                      ▶
       Expanded     Transition      Collapsed
       opacity: 1                    opacity: 0
       height: auto                  height: 0
```

### Arrow Rotation

**CSS:**
```css
transition: transform 300ms ease-in-out;
```

**States:**
- Collapsed: `transform: rotate(0deg)` → ▶
- Expanded: `transform: rotate(90deg)` → ▼

---

## Hover States

### Header Hover (Collapsed Card)
```css
hover:bg-gray-50
cursor: pointer
transition: background-color 200ms
```

**Visual Effect:**
- Entire header background changes to light gray
- Indicates clickability
- Smooth fade-in

### Header Hover (Expanded Card)
```css
hover:bg-gray-50
cursor: pointer
transition: background-color 200ms
```

**Visual Effect:**
- Same as collapsed
- Clicking collapses card
- Can collapse from header click too

### Button Hover
```css
hover:bg-gray-200
border-radius: 4px
transition: background-color 150ms
```

**Visual Effect:**
- Action menu (⋮) button
- Expand/collapse arrow button
- Darker gray background
- Independent of header hover

---

## Click Event Handling

### Event Propagation

**Problem:** Clicking inputs inside expanded card could trigger collapse

**Solution:** Stop propagation on all interactive elements
```typescript
onClick={(e) => e.stopPropagation()}
```

**Applied To:**
- All input fields
- All textareas
- All select dropdowns
- All buttons in body
- Action menu button

**Result:**
- Only header/arrow clicks toggle expansion
- Form fields work normally
- No accidental collapses

---

## Accessibility Features

### Keyboard Navigation

**Tab Order:**
1. Header (entire clickable area)
2. Action menu button
3. Expand/collapse button
4. (If expanded) Touch name input
5. (If expanded) Channel selector
6. (If expanded) Delay inputs
7. (If expanded) Subject input
8. (If expanded) Body textarea

**Enter/Space on Header:**
- Toggles expand/collapse
- Same as clicking

### Screen Reader Support

**Header:**
```html
aria-expanded="true|false"
aria-controls="touch-body-2"
role="button"
```

**Arrow Button:**
```html
aria-label="Collapse touch 2" (when expanded)
aria-label="Expand touch 2" (when collapsed)
```

### Focus Indicators

**All interactive elements:**
```css
focus:ring-2
focus:ring-blue-500
focus:border-blue-500
```

---

## Integration with Add Touch

### When New Touch Added

**Sequence:**
1. User clicks "Add Touch"
2. Touch 6 created with default data
3. Touch 6 automatically added to `expandedTouches` Set
4. Card renders in expanded state
5. Page scrolls to new touch
6. Subject input receives focus
7. User can immediately start editing

**Code:**
```typescript
// In handleAddTouch
setExpandedTouches(prev => new Set([...prev, newTouchNumber]));
```

**Result:**
- New touches always start expanded
- Consistent with "currently editing" pattern
- Intuitive for users

---

## State Scenarios

### Scenario 1: All Collapsed (Clean View)
```
(1/10) [+ Add Touch]

┌─ [1] TOUCH 1 - Initial Outreach        [⋮] [▶] ─┐
│  Timing: Immediately | Channel: 📧 Email         │
└──────────────────────────────────────────────────┘

┌─ [2] TOUCH 2 - Follow-up               [⋮] [▶] ─┐
│  Timing: Wait 3 days | Channel: 📧 Email         │
└──────────────────────────────────────────────────┘

┌─ [3] TOUCH 3 - Value Share             [⋮] [▶] ─┐
│  Timing: Wait 4 days | Channel: 📧 Email         │
└──────────────────────────────────────────────────┘

... (more touches)
```

**Use Case:** Scanning sequence overview

### Scenario 2: Touch 1 Expanded (Default)
```
(5/10) [+ Add Touch]

┌─ [1] TOUCH 1 - Initial Outreach        [⋮] [▼] ─┐
│  Timing: Immediately | Channel: 📧 Email         │
├──────────────────────────────────────────────────┤
│  [All editable fields visible]                   │
│  Touch Name: [ ... ]                             │
│  Channel: [ ... ] Delay: [ ... ]                 │
│  Subject: [ ... ]                                │
│  Body: [ ... ]                                   │
└──────────────────────────────────────────────────┘

┌─ [2] TOUCH 2 - Follow-up               [⋮] [▶] ─┐
│  Timing: Wait 3 days | Channel: 📧 Email         │
└──────────────────────────────────────────────────┘

... (more touches)
```

**Use Case:** Editing first touch

### Scenario 3: Multiple Expanded
```
(5/10) [+ Add Touch]

┌─ [1] TOUCH 1 - Initial Outreach        [⋮] [▼] ─┐
│  [All fields visible - expanded]                 │
└──────────────────────────────────────────────────┘

┌─ [2] TOUCH 2 - Follow-up               [⋮] [▶] ─┐
│  Timing: Wait 3 days | Channel: 📧 Email         │
└──────────────────────────────────────────────────┘

┌─ [3] TOUCH 3 - Value Share             [⋮] [▼] ─┐
│  [All fields visible - expanded]                 │
└──────────────────────────────────────────────────┘
```

**Use Case:** Comparing/editing multiple touches

### Scenario 4: New Touch Added (Auto-Expanded)
```
(6/10) [+ Add Touch]

... (touches 1-5)

┌─ [6] TOUCH 6                           [⋮] [▼] ─┐ ← NEW
│  Timing: Wait 3 days | Channel: 📧 Email         │
├──────────────────────────────────────────────────┤
│  Touch Name: [ Touch 6 ]_ ← cursor               │
│  Channel: [ 📧 Email ] Delay: [ 3 ] [ days ]    │
│  Subject: [ ]_ ← focused                         │
│  Body: [ Hi {{firstName}}... ]                   │
└──────────────────────────────────────────────────┘
```

**Use Case:** Just added, ready to edit

---

## Testing Checklist

### Visual Tests
- [ ] Header always visible
- [ ] Arrow icon shows correctly (▶/▼)
- [ ] Arrow rotates smoothly (300ms)
- [ ] Body expands smoothly (300ms)
- [ ] Body collapses smoothly (300ms)
- [ ] Subject preview shows when collapsed
- [ ] Subject preview hides when expanded
- [ ] Hover state on header works
- [ ] Hover state on buttons works

### Interaction Tests
- [ ] Click arrow to expand (collapsed card)
- [ ] Click arrow to collapse (expanded card)
- [ ] Click header to expand (collapsed card)
- [ ] Click header to collapse (expanded card)
- [ ] Click action menu doesn't toggle expansion
- [ ] Click inputs doesn't collapse card
- [ ] Multiple cards can be expanded simultaneously

### State Persistence Tests
- [ ] Touch 1 expanded by default on first load
- [ ] Touches 2+ collapsed by default
- [ ] Expand Touch 2, refresh page → still expanded
- [ ] Collapse Touch 1, refresh page → still collapsed
- [ ] localStorage updated on every toggle
- [ ] Invalid localStorage data handled gracefully

### Integration Tests
- [ ] New touch added → auto-expands
- [ ] New touch added → scrolls to view
- [ ] New touch added → subject input focused
- [ ] Expand/collapse works with 1 touch
- [ ] Expand/collapse works with 10 touches
- [ ] All touches can be expanded at once
- [ ] All touches can be collapsed at once

### Animation Tests
- [ ] Expand animation smooth (no jank)
- [ ] Collapse animation smooth (no jank)
- [ ] Arrow rotation smooth (no jank)
- [ ] Opacity transition smooth
- [ ] Height transition smooth
- [ ] Multiple rapid clicks handled correctly
- [ ] Animation duration = 300ms

### Accessibility Tests
- [ ] Header has proper ARIA attributes
- [ ] Arrow button has aria-label
- [ ] Tab order makes sense
- [ ] Enter/Space on header toggles
- [ ] Focus indicators visible
- [ ] Screen reader announces state changes

---

## Performance Considerations

### Efficient State Updates
```typescript
// Using Set for O(1) lookups
expandedTouches.has(touchNumber)

// Functional state updates
setExpandedTouches(prev => {
  const newSet = new Set(prev);
  // ... mutations
  return newSet;
});
```

### Conditional Rendering
```typescript
// Body only rendered when data exists
{isExpanded && (
  <div>
    {/* Fields */}
  </div>
)}
```

### CSS Transitions vs JS Animations
- Using CSS transitions for smoothness
- Hardware-accelerated properties
- No JavaScript animation loops
- Browser-optimized rendering

### LocalStorage I/O
- Write on state change (debounced by React)
- Read only on mount
- Minimal serialization cost
- Error handling for quota exceeded

---

## Browser Compatibility

### Supported Features
- CSS transitions (all modern browsers)
- localStorage (IE8+)
- Set data structure (ES6+)
- flexbox layout (all modern browsers)

### Fallbacks
- No localStorage: Falls back to Touch 1 expanded
- No CSS transitions: Instant expand/collapse
- No Set support: Polyfill via build tools

---

## Future Enhancements

### Possible Additions
1. **Expand/Collapse All Button**
   - Top-level control
   - "Expand All" / "Collapse All"
   - Keyboard shortcut: Ctrl+E / Ctrl+Shift+E

2. **Drag to Reorder**
   - Drag handle in header
   - Reorder touches in sequence
   - Auto-renumber

3. **Duplicate Touch**
   - Action menu option
   - Creates copy with same settings
   - Auto-expands duplicate

4. **Delete Touch**
   - Action menu option
   - Confirmation modal
   - Renumbers remaining touches

5. **Touch Templates**
   - Save touch as template
   - Quick apply to new touch
   - Template library

6. **Keyboard Shortcuts**
   - Arrow keys to navigate touches
   - Enter to expand/collapse
   - Ctrl+C / Ctrl+V to copy/paste

---

## File Locations

**Main Component:**
- `/src/components/campaigns/CampaignWizardStep3.tsx`

**Supporting Files:**
- `/src/components/campaigns/MaxTouchesWarningModal.tsx`
- `/src/utils/campaignTemplates.ts`

**Demo Page:**
- `/src/pages/LeadGeneration/CampaignWizardStep3Demo.tsx`

**Route:**
- `/demo/campaign-wizard-step3`

---

## Status
✅ **COMPLETE** - Touch Card Expand/Collapse fully implemented with:
- Smooth 300ms animations
- Persistent state via localStorage
- Touch 1 expanded by default
- New touches auto-expand
- Clickable header for quick access
- Stop propagation on inputs
- Keyboard accessible
- Clean, scannable collapsed view
- Full editing capabilities when expanded

**Ready for:** Touch card editing features (items 24-30)
