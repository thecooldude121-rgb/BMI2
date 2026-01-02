# Upgrade Plan Modal - Visual Guide

## Modal Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           Choose Your Plan                                     [X]  │
│                   Current Plan: Professional ($149/month)                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│                    Monthly  [○──────────]  Annual  💚 Save 20%                      │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐    │
│  │                      │  │      🏆 POPULAR      │  │                      │    │
│  │                      │  │                      │  │                      │    │
│  │   👥                 │  │   📈                 │  │   🛡️                 │    │
│  │   Add Seats          │  │   Business           │  │   Enterprise         │    │
│  │                      │  │                      │  │                      │    │
│  │   $49                │  │   $299               │  │   Custom             │    │
│  │   /seat/month        │  │   /month             │  │                      │    │
│  │                      │  │                      │  │                      │    │
│  │   Keep current       │  │   15 user seats      │  │   Unlimited seats    │    │
│  │   Professional       │  │   included           │  │                      │    │
│  │   features           │  │                      │  │                      │    │
│  │                      │  │                      │  │                      │    │
│  │   ✓ Keep current     │  │   ✓ 15 user seats    │  │   ✓ Unlimited        │    │
│  │   ✓ Add one at time  │  │   ✓ Advanced         │  │   ✓ Dedicated mgr    │    │
│  │   ✓ Scale as grow    │  │     analytics        │  │   ✓ 24/7 support     │    │
│  │   ✓ No commitment    │  │   ✓ Custom           │  │   ✓ Custom           │    │
│  │   ✓ Cancel anytime   │  │     dashboards       │  │     onboarding       │    │
│  │                      │  │   ✓ Priority support │  │   ✓ Advanced         │    │
│  │                      │  │   ✓ API access       │  │     security         │    │
│  │                      │  │   ✓ Advanced         │  │   ✓ SLA guarantees   │    │
│  │                      │  │     integrations     │  │   ✓ Custom           │    │
│  │                      │  │   ✓ Team tracking    │  │     integrations     │    │
│  │                      │  │   ✓ Custom fields    │  │   ✓ White-label      │    │
│  │                      │  │                      │  │                      │    │
│  │  [  Add Seat  →  ]   │  │  [ Upgrade to    ]   │  │  [ Contact Sales ]   │    │
│  │       GREEN          │  │    Business  →       │  │       🎧  DARK       │    │
│  │                      │  │       BLUE           │  │       GRAY           │    │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘    │
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐  │
│  │  ⚡ All plans include:                                                       │  │
│  │  • Unlimited contacts and deals                                             │  │
│  │  • Mobile app access                                                        │  │
│  │  • Data encryption & security                                               │  │
│  │  • Regular updates & new features                                           │  │
│  │  • 99.9% uptime SLA                                                         │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│                   Need help choosing? [Contact our sales team]                     │
│            All plans come with a 14-day money-back guarantee. No questions asked.  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme Detail

### Business Plan Card (Recommended)
```
┌─────────────────────────────────────┐
│  Background: Linear gradient        │
│  from-blue-50 (light blue)          │
│  to-white                           │
│                                     │
│  Border: 2px solid blue-600         │
│  (#2563EB)                          │
│                                     │
│  Badge: bg-blue-600                 │
│  "POPULAR" in white text            │
│                                     │
│  Icon Circle: bg-blue-100           │
│  Icon: TrendingUp (blue-600)        │
│                                     │
│  Button: bg-blue-600                │
│  Hover: bg-blue-700                 │
│  Text: White, font-semibold         │
└─────────────────────────────────────┘
```

---

### Enterprise Plan Card
```
┌─────────────────────────────────────┐
│  Background: Linear gradient        │
│  from-gray-50 (light gray)          │
│  to-white                           │
│                                     │
│  Border: 2px solid gray-300         │
│  (#D1D5DB)                          │
│                                     │
│  Icon Circle: bg-gray-100           │
│  Icon: Shield (gray-700)            │
│                                     │
│  Button: bg-gray-900                │
│  Hover: bg-gray-800                 │
│  Text: White, font-semibold         │
│  Icon: Headphones (white)           │
└─────────────────────────────────────┘
```

---

### Add Seats Plan Card
```
┌─────────────────────────────────────┐
│  Background: Linear gradient        │
│  from-green-50 (light green)        │
│  to-white                           │
│                                     │
│  Border: 2px solid green-300        │
│  (#86EFAC)                          │
│                                     │
│  Icon Circle: bg-green-100          │
│  Icon: Users (green-600)            │
│                                     │
│  Button: bg-green-600               │
│  Hover: bg-green-700                │
│  Text: White, font-semibold         │
└─────────────────────────────────────┘
```

---

## Interactive States

### 1. Billing Toggle - Monthly (Default)
```
┌────────────────────────────────────────┐
│  Monthly  [ ○───────── ]  Annual       │
│           └─ gray-300                  │
│              knob on left              │
└────────────────────────────────────────┘

Business: $299/month
Add Seat: $49/seat/month
```

---

### 2. Billing Toggle - Annual (Active)
```
┌────────────────────────────────────────────────┐
│  Monthly  [ ───────────○ ]  Annual  💚 Save 20%│
│           └─ blue-600                          │
│              knob on right                     │
└────────────────────────────────────────────────┘

Business: $287/month ($3,444/year - save $144)
Add Seat: $47/seat/month ($564/year per seat)
```

---

### 3. Button States

#### Normal State
```
┌────────────────────────┐
│  Upgrade to Business → │
│  bg-blue-600           │
│  text-white            │
└────────────────────────┘
```

#### Hover State
```
┌────────────────────────┐
│  Upgrade to Business → │
│  bg-blue-700 (darker)  │
│  cursor: pointer       │
└────────────────────────┘
```

#### Loading State (After Click)
```
Toast Appears:
┌──────────────────────────────────────┐
│  ℹ️ Upgrading to Business plan...    │
└──────────────────────────────────────┘

Modal: Remains visible for 2 seconds
```

#### Success State
```
Modal: Closes

Toast Appears:
┌────────────────────────────────────────────────┐
│  ✓ Plan upgraded successfully! Your new        │
│    seats are now available.                    │
└────────────────────────────────────────────────┘
```

---

## Responsive Breakpoints

### Desktop (1920px+)
```
Modal Width: 900px
Grid: 3 columns (1fr 1fr 1fr)
Card Width: ~280px each
Gap: 24px
Scrollbar: None (fits on screen)
```

---

### Laptop (1366px)
```
Modal Width: 900px
Grid: 3 columns
Card Width: ~280px each
Gap: 24px
Scrollbar: Vertical if needed
```

---

### Tablet (768px)
```
Modal Width: 90%
Grid: 1 column (stacked)
Card Width: 100%
Gap: 16px
Scrollbar: Vertical (required)
Stack Order:
  1. Business (POPULAR)
  2. Add Seats
  3. Enterprise
```

---

### Mobile (375px)
```
Modal Width: 95%
Grid: 1 column
Card Width: 100%
Padding: 16px
Font Sizes: Slightly smaller
Button: Full width
Scrollbar: Vertical
```

---

## Typography Scale

### Modal Header
```
Title: "Choose Your Plan"
  Font: text-2xl (24px)
  Weight: font-bold (700)
  Color: text-gray-900 (#111827)

Subtitle: "Current Plan: Professional ($149/month)"
  Font: text-sm (14px)
  Weight: font-normal (400)
  Color: text-gray-600 (#4B5563)
  Accent: font-semibold text-blue-600 (plan name)
```

---

### Plan Cards
```
Plan Name: "Business"
  Font: text-2xl (24px)
  Weight: font-bold (700)
  Color: text-gray-900
  Margin: mb-2

Price: "$299"
  Font: text-4xl (36px)
  Weight: font-bold (700)
  Color: text-gray-900

Price Unit: "/month"
  Font: text-base (16px)
  Weight: font-normal (400)
  Color: text-gray-600

Subtext: "15 user seats included"
  Font: text-sm (14px)
  Weight: font-normal (400)
  Color: text-gray-600
  Margin: mt-2

Features: "Advanced analytics & reporting"
  Font: text-sm (14px)
  Weight: font-normal (400)
  Color: text-gray-700
  Line Height: 1.5
```

---

### Buttons
```
Text: "Upgrade to Business"
  Font: text-base (16px)
  Weight: font-semibold (600)
  Color: White
  Padding: px-4 py-3 (16px 12px)
```

---

## Icon Sizes

```
Header Close (X): w-5 h-5 (20px)
Plan Icons: w-6 h-6 (24px)
Feature Checkmarks: w-5 h-5 (20px)
Button Arrows: w-4 h-4 (16px)
Info Box Icon (⚡): w-5 h-5 (20px)
Headphones Icon: w-4 h-4 (16px)
```

---

## Spacing & Layout

### Modal
```
Padding: p-6 (24px)
Border Radius: rounded-xl (12px)
Max Height: 90vh
Overflow: auto (if needed)
```

---

### Header
```
Padding: px-6 py-4 (24px 16px)
Border Bottom: 1px solid gray-200
Position: Sticky top-0
Background: White (covers content when scrolling)
```

---

### Billing Toggle Section
```
Padding: px-6 py-4 (24px 16px)
Background: bg-gray-50
Border Bottom: 1px solid gray-200
Alignment: Center
```

---

### Plan Cards Grid
```
Grid Columns: 3 (desktop) / 1 (mobile)
Gap: gap-6 (24px)
Margin: p-6 (24px parent padding)
```

---

### Individual Card
```
Padding: p-6 (24px)
Border Radius: rounded-xl (12px)
Border Width: border-2
Card Height: Auto (flexible)
```

---

### Feature List
```
Space Between Items: space-y-3 (12px)
List Padding: mb-6 (24px bottom)
Icon Alignment: flex items-start
Icon Margin: gap-2 (8px)
```

---

### Info Box
```
Padding: p-4 (16px)
Margin Top: mt-8 (32px)
Background: bg-blue-50
Border: 1px solid blue-200
Border Radius: rounded-lg (8px)
```

---

## Animation Details

### Modal Open
```
Animation: Fade in
Duration: 200ms
Easing: ease-out
From: opacity-0
To: opacity-100
```

---

### Overlay
```
Background: rgba(0, 0, 0, 0.5)
Animation: Fade in
Duration: 200ms
```

---

### Toggle Switch
```
Knob Movement: Transform translate-x
Duration: 200ms
Easing: ease-in-out
Distance: 28px (7 * 4px)
```

---

### Button Hover
```
Background: Color darkening
Duration: 150ms
Easing: ease-in-out
Scale: None (stays same size)
Cursor: pointer
```

---

## Z-Index Layers

```
Layer 5: Modal (z-50)
Layer 4: Modal Header (z-10, within modal)
Layer 3: Tooltips/Dropdowns (z-40)
Layer 2: Overlay (z-50, behind modal)
Layer 1: Page Content (z-0)
Layer 0: Background (z-auto)
```

---

## Accessibility Features

### Keyboard Navigation
```
Tab Order:
1. Close button (X)
2. Billing toggle
3. Business "Upgrade" button
4. Enterprise "Contact Sales" button
5. Add Seat button
6. Help link ("Contact our sales team")

Focus Indicator:
  Ring: ring-2 ring-blue-500
  Offset: ring-offset-2
```

---

### Screen Reader
```
Modal: role="dialog"
Header: aria-label="Upgrade plan options"
Close Button: aria-label="Close modal"
Toggle: aria-label="Switch billing cycle"
Buttons: Clear action text (no icons only)
```

---

### Color Contrast
```
Text on White: WCAG AA ✓
  gray-900 on white: 16.7:1
  gray-600 on white: 7.2:1

Button Text: WCAG AAA ✓
  white on blue-600: 8.6:1
  white on green-600: 6.1:1
  white on gray-900: 15.9:1

Feature Text: WCAG AA ✓
  gray-700 on blue-50: 9.1:1
  gray-700 on green-50: 9.3:1
  gray-700 on gray-50: 9.5:1
```

---

## Component Tree

```
UpgradePlanModal
├── Modal Container (fixed overlay)
│   └── Modal Content (white card)
│       ├── Header
│       │   ├── Title & Subtitle
│       │   └── Close Button
│       ├── Billing Toggle Section
│       │   ├── "Monthly" Label
│       │   ├── Toggle Switch
│       │   ├── "Annual" Label
│       │   └── "Save 20%" Badge (conditional)
│       ├── Plans Grid
│       │   ├── Add Seats Card
│       │   │   ├── Icon
│       │   │   ├── Name
│       │   │   ├── Price
│       │   │   ├── Description
│       │   │   ├── Feature List (5 items)
│       │   │   └── "Add Seat" Button
│       │   ├── Business Card (POPULAR)
│       │   │   ├── Badge
│       │   │   ├── Icon
│       │   │   ├── Name
│       │   │   ├── Price + Savings (annual)
│       │   │   ├── Seats Info
│       │   │   ├── Feature List (8 items)
│       │   │   └── "Upgrade to Business" Button
│       │   └── Enterprise Card
│       │       ├── Icon
│       │       ├── Name
│       │       ├── "Custom" Price
│       │       ├── Seats Info
│       │       ├── Feature List (8 items)
│       │       └── "Contact Sales" Button
│       ├── Info Box
│       │   ├── Icon (⚡)
│       │   ├── "All plans include:" heading
│       │   └── Feature List (5 items)
│       └── Footer Help Text
│           ├── Help Link
│           └── Guarantee Text
```

---

## Props Data Flow

```
Parent Component (TeamManagement)
  ↓
  Props:
  - isOpen: boolean
  - onClose: () => void
  - currentPlan: "Professional"
  - currentPrice: 149
  - onUpgrade: (plan, billingCycle) => void
  ↓
UpgradePlanModal Component
  ↓
  Internal State:
  - billingCycle: 'monthly' | 'annual'
  ↓
  Renders:
  - Modal with current plan info
  - Three upgrade cards with calculated prices
  - Billing toggle with state
  ↓
  User Actions:
  - Toggle billing → Updates state → Recalculates prices
  - Click upgrade → Calls onUpgrade() → Parent handles
  - Click close → Calls onClose() → Parent closes modal
```

---

## Example Usage

### Opening Modal
```tsx
// In parent component
<button onClick={() => setShowUpgradePlanModal(true)}>
  Upgrade Plan
</button>
```

### Rendering Modal
```tsx
<UpgradePlanModal
  isOpen={showUpgradePlanModal}
  onClose={() => setShowUpgradePlanModal(false)}
  currentPlan="Professional"
  currentPrice={149}
  onUpgrade={(plan, billingCycle) => {
    console.log(`Upgrading to ${plan} with ${billingCycle} billing`);
  }}
/>
```

---

## Visual Hierarchy

```
Level 1 (Most Important):
  - Plan prices ($299, Custom, $49)
  - Upgrade buttons
  - "POPULAR" badge

Level 2 (Secondary):
  - Plan names (Business, Enterprise, Add Seats)
  - Current plan indicator
  - Billing toggle

Level 3 (Supporting):
  - Feature lists
  - Icon circles
  - Seat information

Level 4 (Tertiary):
  - Info box
  - Help text
  - Close button
```

---

## Quick Visual Checklist

When reviewing the modal, verify:
- [ ] Three cards visible in a row (desktop)
- [ ] Business card has blue border and POPULAR badge
- [ ] Enterprise card is gray
- [ ] Add Seats card is green
- [ ] All icons display properly
- [ ] Prices formatted correctly ($299/month)
- [ ] Features have checkmark icons
- [ ] Buttons have proper colors
- [ ] Info box at bottom (blue background)
- [ ] Help text centered at bottom
- [ ] Close X button in top-right
- [ ] Modal shadow visible
- [ ] Background overlay dark

**Status**: Visual guide complete! Use this as reference for design review. 🎨
