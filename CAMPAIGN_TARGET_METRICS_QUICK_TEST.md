# Campaign Target Metrics - Quick Test Guide (2 Minutes)

## Access
**URL**: `/demo/campaign-wizard-step1`
**Location**: Scroll down to "Target Metrics (Optional)" section

## Quick Test Sequence

### Test 1: Target Open Rate (30 seconds)
1. Click "Target Open Rate" input
2. Border turns blue ✓
3. Type "30"
4. Press Tab or click outside
5. See "30%" formatted ✓
6. See green indicator with "↑ 20% above average" ✓
7. See "Industry avg: 25%" replaced by comparison ✓

### Test 2: Target Reply Rate (30 seconds)
1. Click "Target Reply Rate" input
2. Type "8"
3. Press Tab
4. See "8%" formatted ✓
5. See yellow indicator with "↓ 20% below average" ✓

### Test 3: Target Opportunities (30 seconds)
1. Click "Target Opportunities" input
2. Type "150"
3. Press Tab
4. See "150" (no percent sign) ✓
5. No comparison indicator (industryAvg is 0) ✓
6. See hint: "Number of qualified opportunities" ✓

### Test 4: Target Revenue (30 seconds)
1. Click "Target Revenue" input
2. Type "500000"
3. Press Tab
4. See "$500,000" with comma formatting ✓
5. See hint: "Expected revenue from campaign" ✓

### Test 5: Clear Button (15 seconds)
1. Hover over any filled input
2. See X button on right ✓
3. Click X button
4. Field clears instantly ✓

### Test 6: Keyboard Shortcuts (15 seconds)
1. Click "Target Open Rate" input
2. Value is 30
3. Press Up Arrow → increases to 31 ✓
4. Press Down Arrow → decreases to 30 ✓
5. Press Cmd/Ctrl + Up → increases to 40 ✓
6. Press Cmd/Ctrl + Down → decreases to 30 ✓

### Test 7: Auto-Save Indicator (10 seconds)
1. Change any value
2. See yellow pulsing dot ✓
3. See "Auto-saving in 5 seconds..." ✓
4. Wait 5 seconds
5. Console shows: "Target metrics auto-saved: {openRate: 30, ...}" ✓
6. Indicator disappears ✓

## Visual States Checklist

### Input States
- [ ] Default: Gray border (#d1d5db)
- [ ] Hover: Darker border (#9ca3af)
- [ ] Focus: Blue border + blue ring
- [ ] With Value: Shows clear button (X)

### Comparison Indicators
- [ ] Above average: Green background, green text, ↑ icon
- [ ] Below average: Yellow background, yellow text, ↓ icon
- [ ] No comparison: Shows industry average hint

### Formatting
- [ ] Percentage: "30%" (with % sign)
- [ ] Count: "150" (plain number)
- [ ] Currency: "$500,000" (with $ and commas)

## Expected Console Output
```
Target metrics auto-saved: {
  openRate: 30,
  replyRate: 8,
  opportunities: 150,
  revenue: 500000
}
```

## Grid Layout
```
┌─────────────────────────┬─────────────────────────┐
│ Target Open Rate        │ Target Reply Rate       │
│ [30%]                   │ [8%]                    │
│ ↑ 20% above average     │ ↓ 20% below average     │
├─────────────────────────┼─────────────────────────┤
│ Target Opportunities    │ Target Revenue          │
│ [150]                   │ [$500,000]              │
│ Number of qualified...  │ Expected revenue...     │
└─────────────────────────┴─────────────────────────┘
```

## Validation Tests

### Open Rate Validation
- Type "150" → Constrained to 100 ✓
- Type "-10" → Constrained to 0 ✓

### Reply Rate Validation
- Type "150" → Constrained to 100 ✓
- Type "-5" → Constrained to 0 ✓

### Opportunities Validation
- Type "50000" → Constrained to 10000 ✓
- Type "0" → Constrained to 1 ✓
- Type "50.7" → Rounded to 50 ✓

### Revenue Validation
- Type "99999999" → Constrained to 10000000 ✓
- Type "0" → Constrained to 1 ✓
- Type "123.45" → Rounded to 123 ✓

## All Features Working ✓
- ✅ 2x2 grid layout (4 inputs)
- ✅ Border turns blue on focus
- ✅ Auto-format percentages, counts, currency
- ✅ Industry average comparison
- ✅ Green/yellow indicators
- ✅ Clear button (X) on all filled inputs
- ✅ Arrow key increment/decrement
- ✅ Cmd/Ctrl + Up/Down for +10/-10
- ✅ Auto-save after 5 seconds
- ✅ Validation and constraints
- ✅ Responsive hover states
