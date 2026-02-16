# Sequence Overview Panel - Visual Reference

## Panel Anatomy

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SEQUENCE OVERVIEW PANEL                                │
│  (Blue gradient: from-blue-50 to-indigo-50, border-blue-200)             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────┐  TEMPLATE        │   TOTAL TOUCHES    │   EST. DURATION   │  ┌─────┐  CHANNEL     │
│  │ 📧  │  Cold Outreach  │         5          │     14 days      │  │ ✉️  │  Email       │
│  └─────┘                  │                    │                  │  └─────┘              │
│  (White box, shadow)      │  (2xl, blue-600)   │  (2xl, gray-900) │  (White box)         │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## All Template Examples

### 1. Cold Outreach (Email Only)
```
┌──────────────────────────────────────────────────────────────────────────┐
│  [📧]  Template          │  Total Touches  │  Est. Duration  │  [✉️]  Channel      │
│        Cold Outreach    │       5         │    14 days     │        Email       │
└──────────────────────────────────────────────────────────────────────────┘

Template ID: cold_outreach
Type: email
Touches: 5 (all email)
Delays: 0 + 3 + 5 + 2 + 4 = 14 days
```

### 2. Warm Introduction (Email Only)
```
┌──────────────────────────────────────────────────────────────────────────┐
│  [🤝]  Template               │  Total Touches  │  Est. Duration  │  [✉️]  Channel      │
│        Warm Introduction     │       3         │     9 days     │        Email       │
└──────────────────────────────────────────────────────────────────────────┘

Template ID: warm_introduction
Type: email
Touches: 3 (all email)
Delays: 0 + 2 + 7 = 9 days
```

### 3. Re-engagement (Multi-channel)
```
┌──────────────────────────────────────────────────────────────────────────┐
│  [🔄]  Template            │  Total Touches  │  Est. Duration  │  [✉️📱]  Channel         │
│        Re-engagement      │       4         │    24 days     │      Multi-channel     │
└──────────────────────────────────────────────────────────────────────────┘

Template ID: re_engagement
Type: multi_channel
Touches: 4 (2 email + 2 LinkedIn)
Delays: 0 + 3 + 7 + 14 = 24 days
```

### 4. Event Follow-up (LinkedIn Only)
```
┌──────────────────────────────────────────────────────────────────────────┐
│  [🎤]  Template              │  Total Touches  │  Est. Duration  │  [📱]  Channel       │
│        Event Follow-up      │       3         │    10 days     │      LinkedIn      │
└──────────────────────────────────────────────────────────────────────────┘

Template ID: event_followup
Type: linkedin
Touches: 3 (all LinkedIn)
Delays: 0 + 3 + 7 = 10 days
```

### 5. Trial Follow-up (Email Only)
```
┌──────────────────────────────────────────────────────────────────────────┐
│  [🎯]  Template             │  Total Touches  │  Est. Duration  │  [✉️]  Channel      │
│        Trial Follow-up     │       5         │    14 days     │        Email       │
└──────────────────────────────────────────────────────────────────────────┘

Template ID: trial_followup
Type: email
Touches: 5 (all email, mix of hours and days)
Delays: 0 hours + 1 day + 3 days + 7 days + 10 days = 14 days
Note: First touch is 0 hours (immediate)
```

### 6. Start from Scratch (Empty)
```
┌──────────────────────────────────────────────────────────────────────────┐
│  [✨]  Template       │  Total Touches  │  Est. Duration  │  [✉️]  Channel      │
│        Custom        │       0         │     0 days     │        Email       │
└──────────────────────────────────────────────────────────────────────────┘

Template ID: custom_blank
Type: email (default)
Touches: 0 (none yet)
Delays: 0 (no touches)
Channel: Email (default, will update when touches added)
```

---

## State Variations

### After Adding First Touch to Empty Sequence
```
Before:
┌──────────────────────────────────────────────────────────────────────────┐
│  [✨]  Custom    │  Total Touches: 0  │  Est. Duration: 0 days  │  [✉️]  Email      │
└──────────────────────────────────────────────────────────────────────────┘

After adding email touch with 0 delay:
┌──────────────────────────────────────────────────────────────────────────┐
│  [✨]  Custom    │  Total Touches: 1  │  Est. Duration: 0 days  │  [✉️]  Email      │
└──────────────────────────────────────────────────────────────────────────┘

After adding 2nd touch with 3-day delay:
┌──────────────────────────────────────────────────────────────────────────┐
│  [✨]  Custom    │  Total Touches: 2  │  Est. Duration: 3 days  │  [✉️]  Email      │
└──────────────────────────────────────────────────────────────────────────┘
```

### Changing from Email to Multi-channel
```
Starting with 3 email touches:
┌──────────────────────────────────────────────────────────────────────────┐
│  [📧]  Cold Outreach    │  Total Touches: 3  │  Duration: 8 days  │  [✉️]  Email  │
└──────────────────────────────────────────────────────────────────────────┘

After adding LinkedIn touch:
┌──────────────────────────────────────────────────────────────────────────┐
│  [📧]  Cold Outreach    │  Total Touches: 4  │  Duration: 11 days  │  [✉️📱]  Multi-channel  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Color Coding

### Text Colors
- **Template name:** `text-gray-900` (dark, bold)
- **Template label:** `text-gray-600` (medium gray, uppercase, small)
- **Total Touches number:** `text-blue-600` (blue, large, bold)
- **Total Touches label:** `text-gray-600` (medium gray)
- **Duration number:** `text-gray-900` (dark, large, bold)
- **Duration label:** `text-gray-600` (medium gray)
- **Channel name:** `text-gray-900` (dark, bold)
- **Channel label:** `text-gray-600` (medium gray)

### Background Colors
- **Panel:** Gradient `from-blue-50 to-indigo-50`
- **Panel border:** `border-blue-200`
- **Icon boxes:** `bg-white` with `shadow-sm`
- **Dividers:** `bg-gray-300`

---

## Icon Specifications

### Template Icons
Each template has a unique emoji icon:
- Cold Outreach: 📧
- Warm Introduction: 🤝
- Re-engagement: 🔄
- Event Follow-up: 🎤
- Trial Follow-up: 🎯
- Custom: ✨

Displayed in a white rounded box (40x40px) with shadow.

### Channel Icons
Icons from lucide-react:
- Email: `<Mail className="w-4 h-4" />`
- LinkedIn: `<Linkedin className="w-4 h-4" />`
- Multi-channel: Both icons side by side (3.5x3.5px each)

---

## Spacing & Layout

### Panel Padding
- Outer padding: `p-6` (24px all sides)
- Border radius: `rounded-lg`

### Section Spacing
- Gap between sections: `gap-4` (16px)
- Flex layout: `flex items-center justify-between flex-wrap`

### Icon Boxes
- Size: `w-10 h-10` (40x40px)
- Border radius: `rounded-lg`
- Background: White with shadow

### Dividers
- Height: `h-10` (40px)
- Width: `w-px` (1px)
- Color: Gray-300

### Text Sizing
- Labels: `text-xs` (12px)
- Values: `text-sm` to `text-2xl` depending on element
- Template/Channel names: `text-sm font-semibold`
- Numbers: `text-2xl font-bold`

---

## Responsive Behavior

### Desktop (≥1024px)
```
[Icon] Template  |  Total  |  Duration  |  [Icon] Channel
All in one row, no wrapping
```

### Tablet (768px - 1023px)
```
[Icon] Template  |  Total  |  Duration  |  [Icon] Channel
May wrap to 2 rows if space constrained
```

### Mobile (<768px)
```
[Icon] Template
─────────────────
Total
─────────────────
Duration
─────────────────
[Icon] Channel

Stacks vertically
```

The `flex-wrap` utility ensures graceful wrapping when needed.

---

## Duration Calculation Examples

### Example 1: All Days
```
Touch 1: 0 days
Touch 2: 3 days
Touch 3: 5 days
Total: 8 days
```

### Example 2: Hours and Days Mixed
```
Touch 1: 0 hours (immediate)
Touch 2: 24 hours = 1 day
Touch 3: 3 days
Total: 4 days
```

### Example 3: Fractional Days Round Up
```
Touch 1: 0 days
Touch 2: 12 hours = 0.5 days
Touch 3: 2 days
Total: 2.5 → rounds to 3 days
```

### Example 4: Complex Sequence
```
Touch 1: 0 hours
Touch 2: 1 day
Touch 3: 72 hours = 3 days
Touch 4: 2 days
Touch 5: 48 hours = 2 days
Total: 0 + 1 + 3 + 2 + 2 = 8 days
```

---

## Channel Detection Examples

### All Email
```
Touches: [email, email, email]
Result: "Email" with email icon
```

### All LinkedIn
```
Touches: [linkedin, linkedin]
Result: "LinkedIn" with LinkedIn icon
```

### Mixed
```
Touches: [email, email, linkedin, email]
Result: "Multi-channel" with both icons
```

### Empty (Default)
```
Touches: []
Result: "Email" (default until touches added)
```

---

## Accessibility

### ARIA Labels
While the panel is read-only, proper semantic HTML ensures screen reader compatibility:

```html
<div role="region" aria-label="Sequence Overview">
  <!-- Template section -->
  <div>
    <p id="template-label">Template</p>
    <p aria-labelledby="template-label">Cold Outreach</p>
  </div>

  <!-- Touches section -->
  <div>
    <p id="touches-label">Total Touches</p>
    <p aria-labelledby="touches-label">5</p>
  </div>

  <!-- Duration section -->
  <div>
    <p id="duration-label">Est. Duration</p>
    <p aria-labelledby="duration-label">14 days</p>
  </div>

  <!-- Channel section -->
  <div>
    <p id="channel-label">Channel</p>
    <p aria-labelledby="channel-label">Email</p>
  </div>
</div>
```

### Visual Hierarchy
- Labels in small, uppercase text for secondary importance
- Values in large, bold text for primary focus
- Icons provide visual context
- Dividers create clear section boundaries

---

## Testing Checklist

- [ ] Panel renders at correct location
- [ ] Blue gradient background displays
- [ ] All four sections visible
- [ ] Vertical dividers between sections
- [ ] Template icon and name correct
- [ ] Total touches accurate
- [ ] Duration calculated correctly
- [ ] Channel detected properly
- [ ] Icons render correctly
- [ ] No click interactions (read-only)
- [ ] Responsive on different screen sizes
- [ ] Text properly aligned
- [ ] Proper spacing throughout
- [ ] Panel updates when sequences change

---

## Status: ✅ COMPLETE

The Sequence Overview Panel is fully implemented and displays accurate, real-time campaign metrics.
