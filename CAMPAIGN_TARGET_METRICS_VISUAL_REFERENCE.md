# Campaign Target Metrics - Visual Reference Guide

## Component Location

```
┌─────────────────────────────────────────────────────────────┐
│ Campaign Wizard - Step 1: Basic Information                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Campaign Name Input                                      │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ Q1 2025 Enterprise Outreach                         │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
│ 2. Campaign Objective                                       │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ Lead Generation                                ▼    │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
│ 3. Description                                              │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ Targeting enterprise CTOs...                        │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
│ 4. Campaign Type                                            │
│ [Email] [LinkedIn] [Multi-Channel] [Phone]                 │
│                                                             │
│ 5. Target Metrics (Optional) ← NEW SECTION                 │
│ ┌─────────────────────────────────────────────────────┐     │
│ │ [THIS COMPONENT]                                    │     │
│ └─────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Default State (Empty)

```
┌───────────────────────────────────────────────────────────────┐
│ Target Metrics (Optional)                                     │
│ Set performance goals for your campaign                       │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────────┬─────────────────────────┐         │
│ │ Target Open Rate        │ Target Reply Rate       │         │
│ │ ┌─────────────────────┐ │ ┌─────────────────────┐ │         │
│ │ │ e.g., 30         ▒▒▒│ │ │ e.g., 15         ▒▒▒│ │         │
│ │ └─────────────────────┘ │ └─────────────────────┘ │         │
│ │ Industry avg: 25%       │ Industry avg: 10%       │         │
│ ├─────────────────────────┼─────────────────────────┤         │
│ │ Target Opportunities    │ Target Revenue          │         │
│ │ ┌─────────────────────┐ │ ┌─────────────────────┐ │         │
│ │ │ e.g., 50         ▒▒▒│ │ │ e.g., 100000     ▒▒▒│ │         │
│ │ └─────────────────────┘ │ └─────────────────────┘ │         │
│ │ Number of qualified...  │ Expected revenue...     │         │
│ └─────────────────────────┴─────────────────────────┘         │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ℹ Pro tip: Use arrow keys to adjust values             │   │
│ │          (Cmd/Ctrl + Up/Down for +10/-10)              │   │
│ └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

## Focus State - Target Open Rate

```
┌─────────────────────────────────────────────────────────────┐
│ Target Open Rate                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 30                                                  [X] │ │ ← Blue border + ring
│ └─────────────────────────────────────────────────────────┘ │   Clear button visible
│ Industry avg: 25%                                           │
└─────────────────────────────────────────────────────────────┘
```

### CSS for Focus State
```css
border: 2px solid #3b82f6;
box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
outline: none;
```

## Filled State - Above Average (Green)

```
┌─────────────────────────────────────────────────────────────┐
│ Target Open Rate                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 30%                                                 [X] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ↑ 20% above average                              [GREEN]│ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme - Green (Above Average)
```css
background: #f0fdf4 (green-50)
border: #86efac (green-200)
icon: #16a34a (green-600)
text: #16a34a (green-600)
```

## Filled State - Below Average (Yellow)

```
┌─────────────────────────────────────────────────────────────┐
│ Target Reply Rate                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 8%                                                  [X] │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ↓ 20% below average                             [YELLOW]│ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme - Yellow (Below Average)
```css
background: #fefce8 (yellow-50)
border: #fde047 (yellow-200)
icon: #ca8a04 (yellow-600)
text: #ca8a04 (yellow-600)
```

## All Fields Filled Example

```
┌───────────────────────────────────────────────────────────────┐
│ Target Metrics (Optional)                                     │
│ Set performance goals for your campaign                       │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌─────────────────────────┬─────────────────────────┐         │
│ │ Target Open Rate        │ Target Reply Rate       │         │
│ │ ┌─────────────────────┐ │ ┌─────────────────────┐ │         │
│ │ │ 30%              [X]│ │ │ 15%              [X]│ │         │
│ │ └─────────────────────┘ │ └─────────────────────┘ │         │
│ │ ┌─────────────────────┐ │ ┌─────────────────────┐ │         │
│ │ │↑ 20% above avg [GRN]│ │ │↑ 50% above avg [GRN]│ │         │
│ │ └─────────────────────┘ │ └─────────────────────┘ │         │
│ ├─────────────────────────┼─────────────────────────┤         │
│ │ Target Opportunities    │ Target Revenue          │         │
│ │ ┌─────────────────────┐ │ ┌─────────────────────┐ │         │
│ │ │ 150              [X]│ │ │ $500,000         [X]│ │         │
│ │ └─────────────────────┘ │ └─────────────────────┘ │         │
│ │ Number of qualified...  │ Expected revenue...     │         │
│ └─────────────────────────┴─────────────────────────┘         │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ ℹ Pro tip: Use arrow keys to adjust values             │   │
│ │          (Cmd/Ctrl + Up/Down for +10/-10)              │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                               │
│ ● Auto-saving in 5 seconds...                                │
└───────────────────────────────────────────────────────────────┘
```

## Clear Button States

### Hover State
```
┌─────────────────────────────┐
│ 30%                     [X] │  ← Gray background on X
└─────────────────────────────┘
```

### Default State (No Hover)
```
┌─────────────────────────────┐
│ 30%                      X  │  ← Light gray X, no bg
└─────────────────────────────┘
```

### Click Animation
```
Frame 1: [X]  ← Normal
Frame 2: (X)  ← Scale down
Frame 3: [ ]  ← Empty
```

## Keyboard Shortcut Visualization

### Arrow Up (Value: 25)
```
Before:  ┌─────┐
         │ 25  │
         └─────┘
            ↑ (press Up Arrow)
After:   ┌─────┐
         │ 26  │
         └─────┘
```

### Cmd/Ctrl + Up (Value: 25)
```
Before:  ┌─────┐
         │ 25  │
         └─────┘
            ⌘↑ (press Cmd+Up)
After:   ┌─────┐
         │ 35  │
         └─────┘
```

## Auto-Save Indicator Animation

```
State 1 (0s):  ● Auto-saving in 5 seconds...  (pulse bright)
State 2 (1s):  ○ Auto-saving in 5 seconds...  (pulse dim)
State 3 (2s):  ● Auto-saving in 5 seconds...  (pulse bright)
State 4 (3s):  ○ Auto-saving in 5 seconds...  (pulse dim)
State 5 (4s):  ● Auto-saving in 5 seconds...  (pulse bright)
State 6 (5s):  [SAVED - indicator disappears]
```

## Responsive Behavior

### Desktop (≥768px)
```
┌──────────────────────┬──────────────────────┐
│ Target Open Rate     │ Target Reply Rate    │
│ [30%]            [X] │ [15%]            [X] │
├──────────────────────┼──────────────────────┤
│ Target Opportunities │ Target Revenue       │
│ [150]            [X] │ [$500,000]       [X] │
└──────────────────────┴──────────────────────┘
                2x2 Grid
```

### Mobile (<768px)
```
┌────────────────────────────────┐
│ Target Open Rate               │
│ [30%]                      [X] │
├────────────────────────────────┤
│ Target Reply Rate              │
│ [15%]                      [X] │
├────────────────────────────────┤
│ Target Opportunities           │
│ [150]                      [X] │
├────────────────────────────────┤
│ Target Revenue                 │
│ [$500,000]                 [X] │
└────────────────────────────────┘
         Stacked Vertically
```

## Comparison Badge Variations

### Green Badge (Above Average)
```
┌───────────────────────────┐
│ ↑  20% above average      │
│ [─────────────────]       │
│  Green bg   Green text    │
└───────────────────────────┘
```

### Yellow Badge (Below Average)
```
┌───────────────────────────┐
│ ↓  20% below average      │
│ [─────────────────]       │
│  Yellow bg  Yellow text   │
└───────────────────────────┘
```

### No Badge (No Industry Avg)
```
┌───────────────────────────┐
│ Number of qualified       │
│ opportunities             │
│ [Gray text hint]          │
└───────────────────────────┘
```

## Number Formatting Examples

### Percentage Fields
```
Input:  "30"
Blur:   "30%"
Focus:  "30"
```

### Count Fields
```
Input:  "1500"
Blur:   "1,500"
Focus:  "1500"
```

### Currency Fields
```
Input:  "500000"
Blur:   "$500,000"
Focus:  "500000"
```

## Validation Error States (Future)

### Out of Range (Open Rate > 100)
```
┌─────────────────────────────────────┐
│ Target Open Rate                    │
│ ┌─────────────────────────────────┐ │
│ │ 150%                        [X] │ │ ← Red border
│ └─────────────────────────────────┘ │
│ ⚠ Must be between 0 and 100         │ ← Error message
└─────────────────────────────────────┘
```

## Color Palette Reference

### Borders
- Default: #d1d5db (gray-300)
- Hover: #9ca3af (gray-400)
- Focus: #3b82f6 (blue-500)
- Error: #ef4444 (red-500)

### Backgrounds
- Input: #ffffff (white)
- Green comparison: #f0fdf4 (green-50)
- Yellow comparison: #fefce8 (yellow-50)
- Info box: #eff6ff (blue-50)

### Text
- Label: #111827 (gray-900)
- Input: #111827 (gray-900)
- Placeholder: #9ca3af (gray-400)
- Hint: #6b7280 (gray-500)
- Green text: #16a34a (green-600)
- Yellow text: #ca8a04 (yellow-600)

### Icons
- Clear button: #9ca3af → #4b5563 (gray-400 → gray-600)
- TrendingUp: #16a34a (green-600)
- TrendingDown: #ca8a04 (yellow-600)
- Info: #3b82f6 (blue-600)

## Interaction Timeline

```
0ms:   User clicks input
50ms:  Border changes to blue
100ms: Focus ring appears
---
User types "30"
---
500ms: Display value updates to "30"
---
User presses Tab (blur)
---
0ms:   Focus ring fades out
50ms:  Value formats to "30%"
100ms: Comparison badge appears
150ms: Badge slides in from bottom
---
5000ms: Auto-save triggers
5050ms: Auto-save indicator disappears
```

## All Visual States Summary

1. ✅ Empty state (placeholder visible)
2. ✅ Hover state (darker border)
3. ✅ Focus state (blue border + ring)
4. ✅ Filled state (clear button visible)
5. ✅ Above average (green badge)
6. ✅ Below average (yellow badge)
7. ✅ No comparison (hint text)
8. ✅ Auto-save indicator (pulsing dot)
9. ✅ Clear button hover (gray background)
10. ✅ Responsive mobile (stacked)

**Status**: All visual states implemented ✅
