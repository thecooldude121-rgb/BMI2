# CAMPAIGN TYPE SELECTOR - QUICK TEST GUIDE

## 🚀 Access
**URL**: `/demo/campaign-wizard-step1`
**Location**: Below Description field, above tips section

---

## ✅ 5-MINUTE QUICK TEST

### Test 1: Visual States (1 minute)
```
1. Scroll to "Campaign Type" section

2. Observe three cards side-by-side:
   ✓ White background
   ✓ Gray border
   ✓ Icon in gray circle
   ✓ Clear labels: "Email Only", "LinkedIn Only", "Multi-Channel"

3. Hover over "Email Only" card:
   ✓ Background → Light blue (#eff6ff)
   ✓ Card lifts up slightly (4px)
   ✓ Shadow appears
   ✓ Icon circle → Blue
   ✓ Cursor: Pointer

4. Hover over "LinkedIn Only":
   ✓ Same hover behavior

5. Hover over "Multi-Channel":
   ✓ Same hover behavior
```

---

### Test 2: Email Only Selection (1 minute)
```
1. Click "Email Only" card

Immediately observe:
   ✓ Border: Gray → Blue (2px)
   ✓ Background: White → Light blue (#dbeafe)
   ✓ Checkmark: Scales in (top-right, blue circle)
   ✓ Blue ring glow appears around card
   ✓ Icon: Turns blue
   ✓ Text: Turns blue
   ✓ Feature checkmarks: Turn blue

After 300ms:
   ✓ "✓ Selected" badge fades in at bottom
   ✓ Warning message slides down below cards:
     [⚠️ Important Notice]
     Campaign type cannot be changed after creation

Final result:
   ✓ "Next: Select Template" button becomes ENABLED (blue)
   ✓ Other two cards remain unselected
```

---

### Test 3: LinkedIn Only Selection (1 minute)
```
1. Click "LinkedIn Only" card
   ✓ "Email Only" becomes unselected (returns to white)
   ✓ "LinkedIn Only" becomes selected (blue)
   ✓ Checkmark appears on LinkedIn card

2. Different warning message appears:
   [⚠️ Important Notice]
   Open rate tracking not available for LinkedIn campaigns

   ✓ Same amber/warning color scheme
   ✓ Alert triangle icon
   ✓ Slides down smoothly
```

---

### Test 4: Multi-Channel Selection (1 minute)
```
1. Click "Multi-Channel" card
   ✓ LinkedIn becomes unselected
   ✓ Multi-Channel becomes selected (blue)
   ✓ Checkmark appears

2. SUCCESS message appears (different!):
   [✨ Feature Enabled]
   Multi-channel campaigns allow mixing email and LinkedIn touches

   ✓ GREEN/emerald color scheme (not amber!)
   ✓ Sparkles icon (✨)
   ✓ Positive message tone
```

---

### Test 5: Type Lock Simulation (1 minute)
```
1. Make sure a type is selected (e.g., "Email Only")

2. Scroll to tips section below

3. Click "🔒 Simulate Type Lock" button

Observe changes:
   ✓ Top-right badge appears: "🔒 Type Locked"
   ✓ Selected card (Email):
     - Checkmark → Lock icon (🔒)
     - Still blue (selected state)
     - Cursor: not-allowed

   ✓ Other cards (LinkedIn, Multi-Channel):
     - Gray overlay appears
     - Lock icon centered
     - Text: "Cannot change type after creation"
     - Opacity reduced (60%)
     - Cursor: not-allowed

4. Try clicking "LinkedIn Only" card:
   ✓ Nothing happens
   ✓ Cannot change selection

5. Warning message changes to:
   [🔒 Campaign Type Locked]
   The campaign type cannot be changed after the campaign
   has been created or saved as a draft. To use a different
   type, create a new campaign.

   ✓ Gray info box (not amber)
   ✓ Lock icon
   ✓ Detailed explanation
```

---

### Test 6: Validation Error (30 seconds)
```
1. Refresh page or scroll to top

2. Fill in Campaign Name: "Test Campaign Name"

3. Select Objective: "Lead Generation"

4. Type some Description: "Testing validation"

5. Scroll down, SKIP Campaign Type (don't select)

6. Click "Next: Select Template" button

Expected:
   ✓ Red error box appears above cards:
     [❌ Campaign type is required]
     Please select a campaign type to continue.

   ✓ Page scrolls to Campaign Type section
   ✓ Section centers in viewport
   ✓ "Next" button stays disabled
   ✓ Cannot proceed

7. Click any campaign type (e.g., "Email Only"):
   ✓ Error box disappears immediately
   ✓ Selection proceeds normally
   ✓ Warning message appears
   ✓ "Next" button becomes enabled
```

---

## 🎯 ALL VISUAL STATES TO VERIFY

### 1. Unselected (Default)
```
┌──────────────┐
│   📧        │
│              │  ← White background
│  Email Only  │  ← Gray border
│              │
│ Traditional  │  ← Gray text
│ email...     │
│              │
│ ✓ 5 features │  ← Gray checkmarks
└──────────────┘
```

---

### 2. Hover
```
┌──────────────┐  ↑ Lifted 4px
│   📧        │
│              │  ← Light blue bg (#eff6ff)
│  Email Only  │  ← Gray border (unchanged)
│              │
│ Traditional  │  ← Gray text
│ email...     │
└──────────────┘  ← Shadow appears
```

---

### 3. Selected
```
┌──────────────┐
│   📧    [✓] │  ← Blue checkmark (top-right)
│              │  ← Light blue bg (#dbeafe)
│  Email Only  │  ← Blue border (2px) + ring glow
│              │  ← Blue text
│ Traditional  │
│ email...     │
│              │
│ ✓ 5 features │  ← Blue checkmarks
│              │
│ [✓ Selected] │  ← Badge appears
└──────────────┘
```

---

### 4. Locked (Selected Card)
```
┌──────────────┐
│   📧    [🔒]│  ← Lock icon (top-right)
│              │  ← Still light blue bg
│  Email Only  │  ← Still blue border
│              │  ← Still blue text
│ Traditional  │  ← Cursor: not-allowed
│ email...     │
└──────────────┘
```

---

### 5. Locked (Unselected Cards)
```
┌──────────────┐
│     🔒       │  ← Lock icon centered
│              │  ← Gray overlay (60% opacity)
│  LinkedIn    │  ← Gray background
│   Only       │
│              │
│ Cannot change│  ← Message overlay
│ type after   │
│ creation     │
└──────────────┘  ← Cursor: not-allowed
```

---

## 📋 FEATURE LISTS

### Email Only Features
```
✓ Email sequences
✓ Open rate tracking
✓ Click tracking
✓ A/B testing support
✓ Automated follow-ups
```

### LinkedIn Only Features
```
✓ Connection requests
✓ InMail messages
✓ Profile views tracking
✓ Limited to LinkedIn network
✓ No email tracking
```

### Multi-Channel Features
```
✓ Mix email and LinkedIn
✓ Cross-channel sequences
✓ Maximum reach
✓ Unified analytics
✓ Smart channel selection
```

---

## ⚠️ WARNING MESSAGES

### Email Only (Amber Warning)
```
[⚠️ Important Notice]
Campaign type cannot be changed after creation
```
- Background: Amber 50
- Border-left: Amber 500 (4px)
- Icon: Alert triangle
- Text: Amber 900

---

### LinkedIn Only (Amber Warning)
```
[⚠️ Important Notice]
Open rate tracking not available for LinkedIn campaigns
```
- Same styling as Email
- Different message content

---

### Multi-Channel (Green Success)
```
[✨ Feature Enabled]
Multi-channel campaigns allow mixing email and LinkedIn touches
```
- Background: Emerald 50
- Border-left: Emerald 500 (4px)
- Icon: Sparkles
- Text: Emerald 900

---

### When Locked (Gray Info)
```
[🔒 Campaign Type Locked]
The campaign type cannot be changed after the campaign has been
created or saved as a draft. To use a different type, create a
new campaign.
```
- Background: Gray 50
- Border: Gray 300 (all sides)
- Icon: Lock
- Text: Gray 900

---

## 🎨 ANIMATIONS TO VERIFY

### 1. Checkmark Scale-In
```
Duration: 300ms
Effect:
  - Starts at scale(0)
  - Bounces to scale(1.1) at 50%
  - Settles at scale(1)
  - Fades in simultaneously

Verify:
  ✓ Smooth bounce effect
  ✓ No jarring appearance
  ✓ Professional feel
```

---

### 2. Warning Message Slide-Down
```
Duration: 300ms
Effect:
  - Starts 8px above final position
  - Slides down while fading in
  - Settles smoothly

Verify:
  ✓ Smooth slide motion
  ✓ Synchronized with opacity
  ✓ No sudden jumps
```

---

### 3. Hover Lift
```
Duration: 200ms
Effect:
  - Card lifts 4px upward
  - Shadow appears
  - Background color changes
  - Icon color changes
  - All synchronized

Verify:
  ✓ Smooth lift motion
  ✓ Shadow grows naturally
  ✓ Colors transition smoothly
```

---

### 4. Selection State Change
```
Duration: 200ms
Effect:
  - Border color: Gray → Blue
  - Background: White → Light blue
  - Text: Gray → Blue
  - Icon: Gray → Blue
  - All colors change together

Verify:
  ✓ No color flashing
  ✓ Smooth transitions
  ✓ Synchronized changes
```

---

## 🎬 INTERACTION SEQUENCE

### Complete User Flow

**Step 1: Initial State**
```
User sees three unselected white cards
All equal width, side-by-side
"Next" button is disabled (gray)
```

**Step 2: Hover**
```
User hovers "Email Only"
Card turns light blue
Card lifts up
Shadow appears
Cursor becomes pointer
```

**Step 3: Click**
```
User clicks "Email Only"
Immediate visual feedback:
  - Border → Blue
  - Background → Blue
  - Checkmark scales in
  - Ring glow appears
```

**Step 4: After Selection (300ms)**
```
"Selected" badge fades in
Warning message slides down
Auto-save triggers (console log)
"Next" button enables (blue)
```

**Step 5: Switch Selection**
```
User clicks "LinkedIn Only"
"Email Only" deselects (smooth)
"LinkedIn Only" selects (smooth)
Different warning message
"Next" button stays enabled
```

**Step 6: Lock Simulation**
```
User clicks "Simulate Type Lock"
Lock icon appears on selected card
Other cards show overlay
Cannot change selection
Lock info box appears
```

**Step 7: Validation**
```
User clears selection (refresh page)
User tries to click "Next"
Error box appears
Page scrolls to section
User cannot proceed
```

**Step 8: Fix Validation**
```
User clicks any type
Error disappears
Selection completes
User can proceed
```

---

## 🐛 EDGE CASES TO TEST

### Edge Case 1: Rapid Selection Changes
```
Test: Click Email → LinkedIn → Multi-Channel rapidly

Expected:
✓ Only last clicked is selected
✓ Animations complete smoothly
✓ No stuck states
✓ Warning message updates correctly
```

---

### Edge Case 2: Hover During Animation
```
Test: Click card, immediately hover another

Expected:
✓ First animation completes
✓ Hover effect on second card works
✓ No animation conflicts
```

---

### Edge Case 3: Lock Then Try to Select
```
Test: Select type, lock it, try clicking others

Expected:
✓ Clicks do nothing
✓ No visual feedback
✓ Cursor: not-allowed
✓ Lock stays intact
```

---

### Edge Case 4: Keyboard Navigation
```
Test: Use Tab key to navigate cards

Expected:
✓ Focus moves between cards
✓ Blue ring shows focused card
✓ Enter/Space selects card
✓ Same behavior as mouse click
```

---

## 📱 RESPONSIVE TESTING

### Desktop (1200px+)
```
View:
  [  Email  ]  [LinkedIn]  [Multi-Ch]
       ↓            ↓           ↓
   33% width    33% width   33% width

Expected:
✓ Three cards side-by-side
✓ Equal widths
✓ Comfortable spacing
✓ All content visible
```

---

### Tablet (768px - 1023px)
```
View:
  [Email]  [LinkedIn]  [Multi-Ch]
     ↓          ↓           ↓
   Slightly narrower cards

Expected:
✓ Still three columns
✓ Narrower cards
✓ Text may wrap more
✓ All features visible
```

---

### Mobile (< 768px)
```
View:
  [ Email Only Card ]  ← Full width
           ↓
  [ LinkedIn Card ]    ← Full width
           ↓
  [ Multi-Channel ]    ← Full width

Expected:
✓ Vertical stack
✓ Full width cards
✓ Same height as desktop
✓ All interactions work
✓ Touch-friendly targets
```

---

## ✅ SUCCESS CRITERIA

Campaign Type Selector is working correctly if:

✅ Three cards display side-by-side (desktop)
✅ Hover shows light blue background + lift
✅ Click selects card (blue border, checkmark)
✅ Only one card selected at a time
✅ Warning message appears for each type
✅ Different messages for each option
✅ Multi-channel shows green success message
✅ "Next" button enables after selection
✅ Validation error if no selection
✅ Lock simulation works correctly
✅ Locked cards cannot be changed
✅ Auto-save triggers after selection
✅ Smooth animations throughout
✅ Responsive on mobile/tablet
✅ Keyboard navigation works

---

## 🎯 QUICK VERIFICATION CHECKLIST

Use this checklist for rapid testing:

- [ ] Three cards visible
- [ ] Hover effects work on all three
- [ ] Click "Email Only" (selects, warning appears)
- [ ] Click "LinkedIn Only" (switches, different warning)
- [ ] Click "Multi-Channel" (switches, green message)
- [ ] Checkmark animation smooth
- [ ] Warning slides down smoothly
- [ ] "Next" button enables/disables correctly
- [ ] Click "Simulate Lock" button
- [ ] Lock icon appears on selected card
- [ ] Other cards show overlay
- [ ] Cannot click locked cards
- [ ] Lock info box appears
- [ ] Refresh, try "Next" without selection
- [ ] Error box appears
- [ ] Page scrolls to section
- [ ] Select type (error disappears)
- [ ] Test on mobile (cards stack)
- [ ] Test keyboard navigation
- [ ] All animations smooth

---

## 📞 QUICK ACCESS

**Demo URL**: `/demo/campaign-wizard-step1`
**Scroll to**: Campaign Type section (below Description)

**Quick Flow**:
1. Fill Campaign Name: "Test Campaign"
2. Select Objective: "Lead Generation"
3. Add Description: "Testing campaign type"
4. **Test Campaign Type selector** ← Focus here!
5. Try all three options
6. Test lock simulation
7. Test validation error

---

## 🔢 CURRENT STEP 1 PROGRESS

### Completed Fields (3/4)

1. ✅ **Campaign Name Input**
   - Real-time validation
   - Duplicate checking
   - Character counter
   - Auto-save

2. ✅ **Description Textarea**
   - Auto-expand (4-8 rows)
   - Markdown formatting
   - Character counter
   - Auto-save

3. ✅ **Campaign Type Selector** ← JUST COMPLETED
   - Three radio cards
   - Visual states
   - Type-specific warnings
   - Lock functionality
   - Validation error

4. ⏳ **Campaign Objective** (dropdown)
   - Basic implementation exists
   - No enhanced interactions yet

---

Ready to test! Navigate to `/demo/campaign-wizard-step1` and scroll to the Campaign Type section.
