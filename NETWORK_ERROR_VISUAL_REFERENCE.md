# Network Connection Error - Visual Reference Guide 🎨

## Modal Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ 🌐 NETWORK CONNECTION ERROR                                     │
│ Cannot connect to enrichment services                           │
│ [Orange-to-Red Gradient Header]                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🔌 Connection Status                                    │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ ❌  Apollo.io:     Connection timeout              │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ ❌  ZoomInfo:      Connection timeout              │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ ✅  Internet:      Connected                       │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │ Error Details:                                      │ │  │
│  │  │ • Request timed out after 30 seconds               │ │  │
│  │  │ • DNS resolution failed for api.apollo.io          │ │  │
│  │  │ • Possible firewall or proxy issues                │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │  [Red Background for Error Details]                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  This could be caused by:                                      │
│  • Temporary service outage                                    │
│  • Network connectivity issues                                 │
│  • Corporate firewall blocking external APIs                   │
│  • VPN or proxy interference                                   │
│                                                                 │
│  What would you like to do?                                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⦿ 🔄 Retry connection (Attempt 1 of 3)                  │  │
│  │    Try connecting again                                  │  │
│  │ [Selected - Blue Border & Background]                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ○ 📊 Check service status                                │  │
│  │    View Apollo & ZoomInfo status pages                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ○ 💾 Save draft and try later                            │  │
│  │    Retry enrichment when connection improves             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ○ 📧 Contact support                                     │  │
│  │    Report persistent connection issues                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🔍 TROUBLESHOOTING STEPS                                │  │
│  │                                                           │  │
│  │  1. Check your internet connection                       │  │
│  │  2. Disable VPN temporarily and retry                    │  │
│  │  3. Check if firewall is blocking API access             │  │
│  │  4. Try from a different network                         │  │
│  │  5. Contact your IT department if issue persists         │  │
│  │  [Blue Background]                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [Gray Background Footer]                                        │
│                                                                 │
│  [🔄 Retry Now]  [📊 Service Status]  [💾 Save Draft]          │
│  [📧 Contact Support]  [❌ Cancel]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Color Palette

### **Header Section:**
```css
Background: linear-gradient(to right, #f97316, #ef4444)
          /* Orange-500 to Red-500 */
Text Color: white (#ffffff)
```

### **Connection Status Panel:**
```css
Background: bg-gray-50 (#f9fafb)
Border: border-gray-200 (#e5e7eb)
```

### **Individual Service Cards:**
```css
Background: white (#ffffff)
Padding: p-3
Border Radius: rounded
```

### **Error Details Box:**
```css
Background: bg-red-50 (#fef2f2)
Border: border-red-200 (#fecaca)
Text: text-red-800 (#991b1b)
Header: text-red-900 (#7f1d1d)
```

### **Option Cards:**

**Unselected:**
```css
Border: border-gray-200 (#e5e7eb)
Background: white (#ffffff)
Hover: border-gray-300 (#d1d5db)
```

**Selected:**
```css
Border: border-blue-500 (#3b82f6)
Background: bg-blue-50 (#eff6ff)
```

### **Troubleshooting Panel:**
```css
Background: bg-blue-50 (#eff6ff)
Border: border-blue-200 (#bfdbfe)
Text: text-blue-900 (#1e3a8a)
```

### **Action Buttons:**
```css
Retry:           bg-blue-600 (#2563eb)   → hover:bg-blue-700
Service Status:  bg-purple-600 (#9333ea) → hover:bg-purple-700
Save Draft:      bg-green-600 (#16a34a)  → hover:bg-green-700
Contact Support: bg-orange-600 (#ea580c) → hover:bg-orange-700
Cancel:          bg-gray-600 (#4b5563)   → hover:bg-gray-700
```

---

## Icon Legend

### **Status Indicators:**
```
✅ = Success / Connected / Available
❌ = Failed / Error / Unavailable
⦿ = Selected radio button
○ = Unselected radio button
```

### **Action Icons:**
```
🌐 = Network / Internet
🔌 = Connection / Power
🔄 = Retry / Refresh / Reload
📊 = Status / Statistics / Charts
💾 = Save / Disk / Storage
📧 = Email / Contact / Support
❌ = Close / Cancel / Exit
🔍 = Search / Investigate / Troubleshoot
⏳ = Loading / In Progress
```

### **Service Icons:**
```
Apollo.io: ❌ (red X when failed)
ZoomInfo: ❌ (red X when failed)
Internet: ✅ (green check when connected)
```

---

## Typography

### **Header Title:**
```css
Font Size: text-xl (20px)
Font Weight: font-bold (700)
Color: white
Line Height: Leading normal
```

### **Section Headers:**
```css
Font Size: text-base (16px)
Font Weight: font-semibold (600)
Color: text-gray-900 (#111827)
```

### **Option Labels:**
```css
Font Size: text-base (16px)
Font Weight: font-medium (500)
Color: text-gray-900 (#111827)
```

### **Option Descriptions:**
```css
Font Size: text-sm (14px)
Font Weight: normal (400)
Color: text-gray-600 (#4b5563)
Margin Top: mt-1
```

### **Body Text:**
```css
Font Size: text-sm (14px)
Color: text-gray-700 (#374151)
```

### **Button Text:**
```css
Font Size: text-base (16px)
Font Weight: medium (500)
Color: white
```

---

## Spacing & Layout

### **Modal Container:**
```css
Max Width: max-w-2xl (672px)
Max Height: max-h-[90vh]
Overflow: overflow-y-auto
Border Radius: rounded-lg
Shadow: shadow-xl
```

### **Modal Sections:**
```css
Header Padding: px-6 py-4
Content Padding: p-6
Footer Padding: px-6 py-4
Section Spacing: space-y-6
```

### **Connection Status Cards:**
```css
Spacing: space-y-3
Card Padding: p-3
```

### **Option Cards:**
```css
Spacing: space-y-3
Card Padding: p-3
Border Width: border-2
```

### **Button Spacing:**
```css
Gap: gap-2 (8px)
Flex Wrap: flex-wrap
Padding: px-4 py-2
```

---

## State Variations

### **Loading State (Retrying):**
```
Button Text: "Retrying..."
Icon: ⏳ (animated spin)
Button State: disabled
Cursor: cursor-not-allowed
Background: bg-gray-400
```

### **Disabled State:**
```css
Background: bg-gray-300 (#d1d5db)
Cursor: cursor-not-allowed
Opacity: opacity-60
```

### **Hover State (Buttons):**
```css
Transition: all 200ms ease
Transform: scale(1.02) (optional)
Shadow: increased shadow depth
```

### **Focus State:**
```css
Outline: ring-2 ring-blue-500
Outline Offset: ring-offset-2
```

---

## Responsive Behavior

### **Mobile (< 640px):**
```css
Modal Width: w-full
Padding: p-4
Font Size: Slightly reduced
Button Layout: Full width stacking
```

### **Tablet (640px - 1024px):**
```css
Modal Width: max-w-2xl
Button Layout: Flex wrap
Spacing: Standard
```

### **Desktop (> 1024px):**
```css
Modal Width: max-w-2xl
Button Layout: Horizontal flex
Full features visible
```

---

## Animation & Transitions

### **Modal Entrance:**
```css
Fade in background: opacity 0 → 1
Scale modal: scale(0.95) → scale(1)
Duration: 200ms
Easing: ease-out
```

### **Button Hover:**
```css
Background: transition-colors
Duration: 150ms
Easing: ease-in-out
```

### **Retry Spinner:**
```css
Animation: animate-spin
Duration: 1s (continuous)
```

### **Radio Selection:**
```css
Border color: transition-colors
Background: transition-colors
Duration: 150ms
```

---

## Component Hierarchy

```
NetworkConnectionErrorModal
├── Modal Overlay (fixed, backdrop)
│   └── Modal Container (white, rounded)
│       ├── Header Section
│       │   ├── Icon (🌐)
│       │   ├── Title
│       │   └── Subtitle
│       │
│       ├── Content Section
│       │   ├── Connection Status Panel
│       │   │   ├── Header (🔌)
│       │   │   ├── Apollo Status Card
│       │   │   ├── ZoomInfo Status Card
│       │   │   ├── Internet Status Card
│       │   │   └── Error Details Box
│       │   │
│       │   ├── Possible Causes List
│       │   │
│       │   ├── Options Section
│       │   │   ├── Retry Option (radio)
│       │   │   ├── Check Status Option (radio)
│       │   │   ├── Save Draft Option (radio)
│       │   │   └── Contact Support Option (radio)
│       │   │
│       │   └── Troubleshooting Panel
│       │       ├── Header (🔍)
│       │       └── Numbered Steps List
│       │
│       └── Footer Section
│           ├── Retry Now Button
│           ├── Service Status Button
│           ├── Save Draft Button
│           ├── Contact Support Button
│           └── Cancel Button
```

---

## Interaction States

### **1. Initial Load:**
```
State: Default
Selected Option: "Retry connection"
Attempt Number: 1 of 3
Button State: Enabled
```

### **2. During Retry:**
```
State: Loading
Button Text: "Retrying..."
Button Icon: ⏳ (spinning)
Button State: Disabled
User Action: Wait for completion
```

### **3. After Failed Retry:**
```
State: Error persists
Attempt Number: 2 of 3 (or 3 of 3)
Modal: Reopens automatically
Action Log: Updated with failure
```

### **4. Max Attempts Reached:**
```
State: Final failure
Attempt Number: 3 of 3
Action: Modal closes
User Notification: "Maximum retry attempts reached"
```

---

## Visual Feedback

### **Success Indicators:**
```
✅ Internet: Connected (green)
Icon: Green checkmark
Text: Green color (text-green-600)
```

### **Error Indicators:**
```
❌ Services: Failed (red)
Icon: Red X
Text: Red color (text-red-600)
Background: Red tint (bg-red-50)
```

### **Warning Indicators:**
```
Background: Orange/amber tint
Border: Orange border
Icon: ⚠️ warning symbol
```

### **Info Indicators:**
```
Background: Blue tint (bg-blue-50)
Border: Blue border (border-blue-200)
Icon: 🔍 or ℹ️
```

---

## Accessibility

### **Screen Reader Support:**
```html
<label> tags for radio buttons
aria-label for icon buttons
role="dialog" for modal
role="alert" for error messages
```

### **Keyboard Navigation:**
```
Tab: Navigate between options
Space: Select radio button
Enter: Activate selected button
Esc: Close modal
```

### **Focus Management:**
```css
Focus ring: ring-2 ring-blue-500
Focus visible: outline-none with custom ring
Tab order: Logical top-to-bottom
```

### **Color Contrast:**
```
WCAG AA Compliance:
- Text on white: ratio > 4.5:1
- Text on colored bg: ratio > 4.5:1
- Icons: Sufficient size (16px+)
```

---

## Browser Compatibility

### **Tested On:**
- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

### **CSS Features Used:**
- ✅ Flexbox
- ✅ Grid (for demo layout)
- ✅ CSS Gradients
- ✅ Transitions
- ✅ Border Radius
- ✅ Box Shadow
- ✅ Transform

---

## Print Styles

### **When Printing:**
```css
@media print {
  /* Hide modal backdrop */
  .modal-backdrop { display: none; }

  /* Show modal content */
  .modal-content {
    position: static;
    max-width: 100%;
  }

  /* Hide action buttons */
  .action-buttons { display: none; }

  /* Expand sections */
  .collapsible { display: block; }
}
```

---

## Dark Mode Considerations

### **If Dark Mode Added:**
```css
/* Header */
bg-gradient-to-r from-orange-600 to-red-600

/* Modal */
bg-gray-800 (instead of white)
text-gray-100 (instead of text-gray-900)

/* Panels */
bg-gray-700 (instead of bg-gray-50)
border-gray-600 (instead of border-gray-200)

/* Buttons */
Increase contrast for visibility
Adjust hover states
```

---

## Performance Optimizations

### **Rendering:**
- Conditional rendering (if !isOpen return null)
- Lazy load modal content
- Minimize reflows

### **Animations:**
- Use transform for movement
- Avoid animating layout properties
- GPU acceleration with transform

### **State Management:**
- Local component state
- Minimal re-renders
- Memoized callbacks

---

## QA Checklist

### **Visual:**
- ✅ Gradient header displays correctly
- ✅ All icons render properly
- ✅ Colors match design spec
- ✅ Spacing is consistent
- ✅ Text is readable
- ✅ Hover states work

### **Functional:**
- ✅ Modal opens/closes
- ✅ Radio buttons select
- ✅ All buttons work
- ✅ Counter increments
- ✅ Loading states show
- ✅ Console logs fire

### **Responsive:**
- ✅ Mobile layout works
- ✅ Tablet layout works
- ✅ Desktop layout works
- ✅ Scrolling works
- ✅ No overflow issues

---

## Reference Screenshots

### **Connection Status Indicators:**
```
❌ Apollo.io:     Connection timeout
   └─ Red X icon, red text, left-aligned

❌ ZoomInfo:      Connection timeout
   └─ Red X icon, red text, left-aligned

✅ Internet:      Connected
   └─ Green check icon, green text, left-aligned
```

### **Option Selection:**
```
Unselected:
┌────────────────────────────────┐
│ ○ Option Label                 │
│   Description text here        │
└────────────────────────────────┘
Gray border, white background

Selected:
┌────────────────────────────────┐
│ ⦿ Option Label                 │
│   Description text here        │
└────────────────────────────────┘
Blue border, blue background tint
```

---

## Summary

**Visual Identity:**
- Urgent (orange-red gradient)
- Clear status indicators
- Structured troubleshooting
- Multiple resolution paths
- Professional appearance

**User Experience:**
- Immediate clarity on issue
- Clear next steps
- Progressive disclosure
- Helpful guidance
- Multiple exit paths

**Technical Quality:**
- Clean component structure
- Proper state management
- Accessible markup
- Responsive design
- Performance optimized

---

**Status:** ✅ **VISUALLY COMPLETE & POLISHED**

All visual elements match the specification and provide clear, professional user experience!
