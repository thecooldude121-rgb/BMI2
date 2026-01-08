# BANT Validation Service - Quick Reference

## 🚀 Import
```typescript
import * as bantValidation from '../../services/bantValidationService';
```

---

## 📋 Common Functions

### Validate Qualification
```typescript
const validation = bantValidation.validateQualification(bantData);

// Check validation type
if (validation.validationType === 'noBantFilled') {
  // Show incomplete modal
}
if (validation.validationType === 'partialBant') {
  // Show partial modal
}
```

**Returns**:
- `valid`: boolean
- `validationType`: 'noBantFilled' | 'partialBant' | 'lowBantScore' | 'complete'
- `message`: Validation message object
- `bantScore`: Current score
- `filledFieldsCount`: Number of filled fields
- `missingFields`: Array of missing field labels

---

### Calculate Score
```typescript
const score = bantValidation.calculateBantScore(bantData);
// Returns: 0-20
```

---

### Get Percentage
```typescript
const percentage = bantValidation.getBantScorePercentage(bantData);
// Returns: 0-100
```

---

### Get Field Details
```typescript
const { completed, missing } = bantValidation.getDetailedBantFields(bantData);

// completed: Array of filled fields with scores
// missing: Array of empty fields
```

---

### Get Missing Fields
```typescript
const missing = bantValidation.getMissingFields(bantData);
// Returns: ['Budget', 'Timeline']
```

---

### Get Filled Count
```typescript
const count = bantValidation.getFilledFieldsCount(bantData);
// Returns: 0-4
```

---

### Check Low Score
```typescript
const showWarning = bantValidation.shouldShowLowScoreWarning(score);
// Returns: true if score < 15
```

---

### Get Warning Message
```typescript
const warning = bantValidation.getConversionRateWarning(score);
// Returns: Warning message or null
```

---

### Get Primary Missing Field
```typescript
const field = bantValidation.getPrimaryMissingField(bantData);
// Returns: "Timeline" (first missing field)
```

---

## 🎯 Validation Types

| Type | Filled Fields | Blocks? | Action |
|------|--------------|---------|---------|
| `noBantFilled` | 0/4 | ✅ Yes | Show IncompleteBantModal |
| `partialBant` | 1-3/4 | ❌ No | Show PartialBantModal |
| `lowBantScore` | 4/4, score < 15 | ❌ No | Show warning |
| `complete` | 4/4, score ≥ 15 | ❌ No | Proceed normally |

---

## 📊 Score Values

| Status | Budget | Authority | Need | Timeline |
|--------|--------|-----------|------|----------|
| **High** | Confirmed (5) | Decision Maker (5) | Urgent (5) | Immediate (5) |
| **Medium** | Likely (4) | Influencer (4) | Important (4) | Short-term (4) |
| **Low** | Unknown (2) | End User (2) | Nice to have (2) | Long-term (2) |

**Max Score**: 20 points

---

## 🔧 Validation Rules

```typescript
bantValidation.validationRules = {
  minBantScore: 0,
  minBantFieldsFilled: 1,
  warningThreshold: 15,
  recommendedMinimum: 15,
  maxScore: 20
}
```

---

## 💡 Quick Examples

### Example 1: Basic Validation
```typescript
const handleQualify = () => {
  const validation = bantValidation.validateQualification(bantData);

  switch (validation.validationType) {
    case 'noBantFilled':
      setShowIncompleteBantModal(true);
      break;
    case 'partialBant':
      setShowPartialBantModal(true);
      break;
    default:
      setShowQualifyModal(true);
  }
};
```

---

### Example 2: Display Score
```typescript
const BantScoreDisplay = ({ bantData }) => {
  const score = bantValidation.calculateBantScore(bantData);
  const percentage = bantValidation.getBantScorePercentage(bantData);

  return (
    <div>
      <p>BANT Score: {score}/20 ({percentage}%)</p>
      <progress value={score} max="20" />
    </div>
  );
};
```

---

### Example 3: Field Breakdown
```typescript
const BantBreakdown = ({ bantData }) => {
  const { completed, missing } = bantValidation.getDetailedBantFields(bantData);

  return (
    <div>
      {completed.map(field => (
        <div className="text-green-600">
          ✅ {field.label}: {field.displayValue} (+{field.score})
        </div>
      ))}
      {missing.map(field => (
        <div className="text-red-600">
          ❌ {field.label}: Not assessed (-{field.maxScore})
        </div>
      ))}
    </div>
  );
};
```

---

### Example 4: Warnings
```typescript
const BantWarning = ({ bantData }) => {
  const score = bantValidation.calculateBantScore(bantData);
  const warning = bantValidation.getConversionRateWarning(score);

  if (!warning) return null;

  return (
    <div className="bg-yellow-50 p-4">
      ⚠️ {warning}
    </div>
  );
};
```

---

## 🎨 Display Values

### Budget
- `confirmed` → "Confirmed ($50K-$100K)" (if range provided)
- `likely` → "Likely"
- `unknown` → "Unknown"

### Authority
- `decision_maker` → "Decision Maker"
- `influencer` → "Influencer"
- `end_user` → "End User"

### Need
- `urgent` → "Urgent"
- `important` → "Important"
- `nice_to_have` → "Nice to have"

### Timeline
- `immediate` → "Immediate (0-30 days)"
- `short_term` → "Short-term (1-3 mo)"
- `long_term` → "Long-term (3-6 mo)"

---

## ⚡ Performance Tips

1. **Memoize calculations** in React:
```typescript
const score = useMemo(
  () => bantValidation.calculateBantScore(bantData),
  [bantData]
);
```

2. **Avoid repeated calls**:
```typescript
// Bad
const score = bantValidation.calculateBantScore(bantData);
const percentage = bantValidation.getBantScorePercentage(bantData); // Calculates again

// Good
const score = bantValidation.calculateBantScore(bantData);
const percentage = Math.round((score / 20) * 100);
```

3. **Cache field details**:
```typescript
const fields = useMemo(
  () => bantValidation.getDetailedBantFields(bantData),
  [bantData]
);
```

---

## 🐛 Common Issues

### Issue: "Cannot read property 'status' of undefined"
**Fix**: Ensure bantData has all required fields:
```typescript
const bantData = {
  budget: { status: '' },
  authority: { status: '' },
  need: { status: '' },
  timeline: { status: '' }
};
```

### Issue: Score calculation incorrect
**Fix**: Check that status values match expected strings:
```typescript
// Correct
budget: { status: 'confirmed' }

// Incorrect
budget: { status: 'Confirmed' } // Wrong case
budget: { status: 'yes' }       // Wrong value
```

### Issue: Display value shows raw status
**Fix**: Pass the full field data object:
```typescript
// Correct
const display = bantValidation.getFieldDisplayValue(
  'budget',
  'confirmed',
  { range: '$50K-$100K' } // Full data object
);

// Incorrect
const display = bantValidation.getFieldDisplayValue(
  'budget',
  'confirmed',
  'confirmed' // Wrong - not an object
);
```

---

## 🔍 Debugging

### Log validation result:
```typescript
const validation = bantValidation.validateQualification(bantData);
console.log('Validation:', validation);
```

### Log detailed fields:
```typescript
const fields = bantValidation.getDetailedBantFields(bantData);
console.log('Completed:', fields.completed);
console.log('Missing:', fields.missing);
```

### Log all metrics:
```typescript
console.log({
  score: bantValidation.calculateBantScore(bantData),
  percentage: bantValidation.getBantScorePercentage(bantData),
  filledCount: bantValidation.getFilledFieldsCount(bantData),
  missing: bantValidation.getMissingFields(bantData)
});
```

---

## 📦 TypeScript Types

```typescript
import {
  BantData,
  BantFieldData,
  BantFieldDetail,
  ValidationResult,
  ValidationMessage
} from '../../services/bantValidationService';

// Use in component
interface Props {
  bantData: BantData;
}

// Use in state
const [validation, setValidation] = useState<ValidationResult | null>(null);
```

---

## ✅ Checklist

Before using the service:
- [ ] Imported correctly
- [ ] bantData has all 4 fields
- [ ] Each field has a status property
- [ ] Status values are lowercase strings
- [ ] Full data objects passed when needed

---

**Quick Access**: `/src/services/bantValidationService.ts`

**Full Guide**: `VALIDATION_SERVICE_GUIDE.md`

**Test Guide**: `VALIDATION_QUICK_TEST.md`
