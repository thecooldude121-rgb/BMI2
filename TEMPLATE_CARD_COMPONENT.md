# TEMPLATE CARD COMPONENT

## Overview
Reusable React component for displaying campaign template information in a visually appealing card format. Used in Step 2 of the Campaign Creation Wizard for template selection.

**Location**: `/src/components/campaigns/TemplateCard.tsx`

---

## COMPONENT INTERFACE

### Props

```typescript
interface TemplateCardProps {
  template: CampaignTemplate;        // Template data object
  onSelect: (templateId: string) => void;  // Selection callback
  isSelected?: boolean;              // Selection state (default: false)
}
```

### Type Imports
```typescript
import { CampaignTemplate } from '../../utils/campaignTemplates';
```

---

## VISUAL STRUCTURE

### Card Layout
```
┌─────────────────────────────────────────┐
│ 📧 Template Name        [Multi-channel] │  ← Header with icon & badge
│─────────────────────────────────────────│
│ 5-touch sequence for new prospects      │  ← Description
├─────────────────────────────────────────┤
│ 5-touch sequence     📧 Email only      │  ← Sequence info
│ Duration: 14 days                       │
│                                         │
│ Perfect for:                            │  ← Use cases
│ • New prospects                         │
│ • Cold outreach                         │
│ • Enterprise targets                    │
│ • Wide-scale campaigns                  │
│                                         │
│ Avg Performance:                        │  ← Metrics
│ 📊 Open rate:        28%                │
│ 💬 Reply rate:       8%                 │
│ 🎯 Conversion:       4%                 │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │     Select Template / ✓ Selected    │ │  ← CTA Button
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## CARD SECTIONS

### 1. Header Section
**Elements**:
- Template icon (emoji, 3xl size)
- Template name (lg font, semibold)
- Multi-channel badge (conditional)

**Layout**: Flex row with space-between
**Badge Appearance**: Purple background (only for multi_channel templates)

```tsx
<div className="flex items-center justify-between mb-4">
  <div className="flex items-center gap-3">
    <span className="text-3xl">{template.icon}</span>
    <h3 className="text-lg font-semibold text-gray-900">
      {template.name}
    </h3>
  </div>
  {template.type === 'multi_channel' && (
    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
      Multi-channel
    </span>
  )}
</div>
```

**Examples**:
- 📧 Cold Outreach
- 🤝 Warm Introduction (Multi-channel badge)
- 🔄 Re-engagement

---

### 2. Description Section
**Elements**:
- Template description text
- Bottom border separator

**Styling**: Gray text, small font, padding bottom with border

```tsx
<p className="text-sm text-gray-600 mb-4 border-b pb-4">
  {template.description}
</p>
```

**Examples**:
- "5-touch sequence for new prospects"
- "3-touch sequence for HRMS leads"
- "4-touch win-back sequence"

---

### 3. Sequence Info Section
**Conditional Display**: Only shows if `template.totalTouches > 0`

**Elements**:
- Touch count and channel type (first row)
- Duration in days (second row)

**Channel Display Logic**:
- Email: "📧 Email only"
- LinkedIn: "💼 LinkedIn only"
- Multi-channel: "🔗 Multi-channel"

```tsx
{template.totalTouches > 0 && (
  <div className="mb-4 space-y-1">
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{template.totalTouches}-touch sequence</span>
      <span className="text-gray-600">
        {template.type === 'email' ? '📧 Email only' :
         template.type === 'linkedin' ? '💼 LinkedIn only' :
         '🔗 Multi-channel'}
      </span>
    </div>
    <div className="text-sm text-gray-500">
      Duration: {template.duration} days
    </div>
  </div>
)}
```

**Examples**:
- "5-touch sequence • 📧 Email only • Duration: 14 days"
- "3-touch sequence • 💼 LinkedIn only • Duration: 10 days"
- "4-touch sequence • 🔗 Multi-channel • Duration: 24 days"

---

### 4. Perfect For Section
**Elements**:
- Section header ("Perfect for:")
- Bulleted list of use cases

**Styling**:
- Small font, semibold header
- Extra small font for list items
- Bullet point character "•"

```tsx
<div className="mb-4">
  <p className="text-xs font-semibold text-gray-700 mb-2">Perfect for:</p>
  <ul className="space-y-1">
    {template.perfectFor.map((item, index) => (
      <li key={index} className="text-xs text-gray-600 flex items-start">
        <span className="mr-2">•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
</div>
```

**Example Output**:
```
Perfect for:
• New prospects
• Cold outreach
• Enterprise targets
• Wide-scale campaigns
```

---

### 5. Performance Metrics Section
**Conditional Display**: Only shows if `template.avgPerformance.openRate > 0`

**Elements**:
- Section header ("Avg Performance:")
- Open rate (conditional - hidden for LinkedIn)
- Reply rate
- Conversion rate (conditional - only if > 0)

**Metric Icons**:
- 📊 Open rate
- 💬 Reply rate
- 🎯 Conversion

**Layout**: Flex row with space-between for label and value

```tsx
{template.avgPerformance.openRate > 0 && (
  <div className="mb-4">
    <p className="text-xs font-semibold text-gray-700 mb-2">Avg Performance:</p>
    <div className="space-y-1">
      {template.type !== 'linkedin' && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">📊 Open rate:</span>
          <span className="font-semibold text-gray-900">
            {template.avgPerformance.openRate}%
          </span>
        </div>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">💬 Reply rate:</span>
        <span className="font-semibold text-gray-900">
          {template.avgPerformance.replyRate}%
        </span>
      </div>
      {template.avgPerformance.conversionRate > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">🎯 Conversion:</span>
          <span className="font-semibold text-gray-900">
            {template.avgPerformance.conversionRate}%
          </span>
        </div>
      )}
    </div>
  </div>
)}
```

**Example Output**:
```
Avg Performance:
📊 Open rate:     28%
💬 Reply rate:    8%
🎯 Conversion:    4%
```

**Special Case - LinkedIn Templates**:
- Open rate is hidden (N/A for LinkedIn)
- Only shows Reply rate and Conversion

```
Avg Performance:
💬 Reply rate:    12%
🎯 Conversion:    5%
```

**Special Case - Custom Blank Template**:
- Entire performance section is hidden (all metrics are 0)

---

### 6. CTA Button Section
**Elements**:
- Full-width button
- Dynamic text based on state

**Button States**:
1. **Selected**: Blue background, white text, "✓ Selected"
2. **Custom Template**: Gray background, "Start from Scratch"
3. **Normal**: Gray background, "Select Template"

**Event Handling**:
- `e.stopPropagation()` prevents card click from triggering twice
- Calls `onSelect(template.id)`

```tsx
<button
  className={`
    w-full py-2 px-4 rounded-lg font-medium text-sm transition-colors
    ${isSelected
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }
  `}
  onClick={(e) => {
    e.stopPropagation();
    onSelect(template.id);
  }}
>
  {isSelected ? '✓ Selected' :
   template.id === 'custom_blank' ? 'Start from Scratch' : 'Select Template'}
</button>
```

**Button Text Logic**:
```typescript
if (isSelected) {
  return '✓ Selected';
} else if (template.id === 'custom_blank') {
  return 'Start from Scratch';
} else {
  return 'Select Template';
}
```

---

## STYLING & INTERACTIONS

### Card States

#### Default State
```css
border: gray-200
background: white
shadow: none
cursor: pointer
```

#### Hover State (Not Selected)
```css
border: blue-300
background: white
shadow: small shadow
```

#### Selected State
```css
border: blue-500
background: blue-50
shadow: medium shadow
```

### Transitions
- All state changes use `transition-all` for smooth animations
- Border color transitions
- Background color transitions
- Shadow transitions

### Color Palette
**Primary Blue**:
- Selected border: `blue-500`
- Selected background: `blue-50`
- Hover border: `blue-300`
- Button background: `blue-600`

**Gray Scale**:
- Default border: `gray-200`
- Text primary: `gray-900`
- Text secondary: `gray-600`
- Text muted: `gray-500`
- Button default: `gray-100`

**Accent Colors**:
- Multi-channel badge: `purple-100` background, `purple-700` text

---

## USAGE EXAMPLES

### Example 1: Basic Grid Layout (Step 2)
```tsx
import { TemplateCard } from '@/components/campaigns/TemplateCard';
import { campaignTemplates } from '@/utils/campaignTemplates';

function TemplateSelectionStep() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaignTemplates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onSelect={setSelectedTemplateId}
          isSelected={selectedTemplateId === template.id}
        />
      ))}
    </div>
  );
}
```

### Example 2: With Category Filtering
```tsx
function TemplateSelectionWithFilters() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'email' | 'linkedin' | 'multi_channel'>('all');

  const filteredTemplates = campaignTemplates.filter(template =>
    filter === 'all' || template.type === filter
  );

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('email')}>Email Only</button>
        <button onClick={() => setFilter('linkedin')}>LinkedIn Only</button>
        <button onClick={() => setFilter('multi_channel')}>Multi-channel</button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={setSelectedTemplateId}
            isSelected={selectedTemplateId === template.id}
          />
        ))}
      </div>
    </div>
  );
}
```

### Example 3: With Preview Modal
```tsx
function TemplateSelectionWithPreview() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const handleSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setPreviewTemplateId(templateId);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-6">
        {campaignTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={handleSelect}
            isSelected={selectedTemplateId === template.id}
          />
        ))}
      </div>

      {previewTemplateId && (
        <TemplatePreviewModal
          templateId={previewTemplateId}
          onClose={() => setPreviewTemplateId(null)}
        />
      )}
    </>
  );
}
```

### Example 4: With Performance Sorting
```tsx
function TemplateSelectionSorted() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'openRate' | 'replyRate' | 'conversionRate'>('replyRate');

  const sortedTemplates = [...campaignTemplates].sort((a, b) =>
    b.avgPerformance[sortBy] - a.avgPerformance[sortBy]
  );

  return (
    <div>
      <div className="mb-4">
        <label>Sort by:</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="openRate">Open Rate</option>
          <option value="replyRate">Reply Rate</option>
          <option value="conversionRate">Conversion Rate</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {sortedTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={setSelectedTemplateId}
            isSelected={selectedTemplateId === template.id}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## CONDITIONAL RENDERING LOGIC

### 1. Multi-channel Badge
**Condition**: `template.type === 'multi_channel'`
**Shows for**: Re-engagement template only
**Hides for**: All other templates

### 2. Sequence Info Section
**Condition**: `template.totalTouches > 0`
**Shows for**: All templates except "Start from Scratch"
**Hides for**: Custom blank template (0 touches)

### 3. Open Rate Metric
**Condition**: `template.type !== 'linkedin'`
**Shows for**: Email and Multi-channel templates
**Hides for**: LinkedIn-only templates (Event Follow-up)
**Reason**: LinkedIn doesn't track open rates

### 4. Conversion Rate Metric
**Condition**: `template.avgPerformance.conversionRate > 0`
**Shows for**: Templates with conversion data
**Hides for**: Templates with 0% conversion (Custom blank)

### 5. Entire Performance Section
**Condition**: `template.avgPerformance.openRate > 0`
**Shows for**: All pre-built templates
**Hides for**: Custom blank template (no historical data)

### 6. Button Text
**Logic**:
```typescript
if (isSelected) → "✓ Selected"
else if (template.id === 'custom_blank') → "Start from Scratch"
else → "Select Template"
```

---

## RESPONSIVE DESIGN

### Recommended Grid Layouts

**Mobile (< 768px)**:
```tsx
<div className="grid grid-cols-1 gap-4">
  {/* 1 card per row */}
</div>
```

**Tablet (768px - 1024px)**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* 2 cards per row */}
</div>
```

**Desktop (> 1024px)**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 3 cards per row */}
</div>
```

**Wide Desktop (> 1536px)**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
  {/* 4 cards per row */}
</div>
```

### Card Dimensions
- **Min Width**: ~280px (mobile)
- **Max Width**: Flexible (container-based)
- **Height**: Auto (content-based)
- **Aspect Ratio**: Varies by template (depends on content)

---

## ACCESSIBILITY

### Keyboard Navigation
**Current Implementation**: Basic click handlers

**Recommended Enhancements**:
```tsx
<div
  role="button"
  tabIndex={0}
  aria-pressed={isSelected}
  aria-label={`Select ${template.name} template`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(template.id);
    }
  }}
>
  {/* Card content */}
</div>
```

### Screen Reader Support
**Current Implementation**: Semantic HTML

**Recommended Enhancements**:
```tsx
<div aria-describedby={`template-${template.id}-description`}>
  <h3 id={`template-${template.id}-name`}>{template.name}</h3>
  <p id={`template-${template.id}-description`}>{template.description}</p>
  <div aria-label="Template statistics">
    <span aria-label={`Open rate ${template.avgPerformance.openRate} percent`}>
      📊 Open rate: {template.avgPerformance.openRate}%
    </span>
  </div>
</div>
```

### Focus States
**Recommended Addition**:
```css
.template-card:focus {
  outline: 2px solid blue-500;
  outline-offset: 2px;
}
```

---

## VISUAL VARIATIONS

### Template Cards by Type

#### 1. Cold Outreach (Email)
```
┌─────────────────────────────────────┐
│ 📧 Cold Outreach                    │
│─────────────────────────────────────│
│ 5-touch sequence for new prospects  │
├─────────────────────────────────────┤
│ 5-touch sequence    📧 Email only   │
│ Duration: 14 days                   │
│                                     │
│ Perfect for:                        │
│ • New prospects                     │
│ • Cold outreach                     │
│ • Enterprise targets                │
│ • Wide-scale campaigns              │
│                                     │
│ Avg Performance:                    │
│ 📊 Open rate:      28%              │
│ 💬 Reply rate:     8%               │
│ 🎯 Conversion:     4%               │
│                                     │
│ [     Select Template     ]         │
└─────────────────────────────────────┘
```

#### 2. Re-engagement (Multi-channel)
```
┌─────────────────────────────────────┐
│ 🔄 Re-engagement    [Multi-channel] │
│─────────────────────────────────────│
│ 4-touch win-back sequence           │
├─────────────────────────────────────┤
│ 4-touch sequence   🔗 Multi-channel │
│ Duration: 24 days                   │
│                                     │
│ Perfect for:                        │
│ • Dormant leads (90+ days)          │
│ • Past prospects                    │
│ • Win-back campaigns                │
│ • Cold leads                        │
│                                     │
│ Avg Performance:                    │
│ 📊 Open rate:      18%              │
│ 💬 Reply rate:     5%               │
│ 🎯 Conversion:     2%               │
│                                     │
│ [     Select Template     ]         │
└─────────────────────────────────────┘
```

#### 3. Event Follow-up (LinkedIn)
```
┌─────────────────────────────────────┐
│ 🎤 Event Follow-up                  │
│─────────────────────────────────────│
│ 3-touch post-event sequence         │
├─────────────────────────────────────┤
│ 3-touch sequence  💼 LinkedIn only  │
│ Duration: 10 days                   │
│                                     │
│ Perfect for:                        │
│ • Conference leads                  │
│ • Webinar attendees                 │
│ • Event networking                  │
│ • Trade show contacts               │
│                                     │
│ Avg Performance:                    │
│ 💬 Reply rate:     12%              │  ← No open rate!
│ 🎯 Conversion:     5%               │
│                                     │
│ [     Select Template     ]         │
└─────────────────────────────────────┘
```

#### 4. Start from Scratch (Blank)
```
┌─────────────────────────────────────┐
│ ✨ Start from Scratch               │
│─────────────────────────────────────│
│ Build your own custom sequence      │
├─────────────────────────────────────┤
│                                     │  ← No sequence info!
│ Perfect for:                        │
│ • Unique campaigns                  │
│ • Custom workflows                  │
│ • A/B testing                       │
│ • Specialized outreach              │
│                                     │  ← No performance section!
│                                     │
│ [    Start from Scratch    ]        │  ← Different button text!
└─────────────────────────────────────┘
```

---

## PERFORMANCE CONSIDERATIONS

### Rendering Optimization
**Current Implementation**: Basic rendering

**Recommended Optimization**:
```tsx
export const TemplateCard = React.memo<TemplateCardProps>(
  ({ template, onSelect, isSelected = false }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    return (
      prevProps.template.id === nextProps.template.id &&
      prevProps.isSelected === nextProps.isSelected
    );
  }
);
```

### Click Handler Optimization
```tsx
const handleSelect = useCallback(() => {
  onSelect(template.id);
}, [onSelect, template.id]);

const handleButtonClick = useCallback((e: React.MouseEvent) => {
  e.stopPropagation();
  onSelect(template.id);
}, [onSelect, template.id]);
```

---

## TESTING CHECKLIST

### Visual Testing
- [ ] All 6 templates render correctly
- [ ] Selected state shows blue border and background
- [ ] Hover state shows blue border and shadow
- [ ] Multi-channel badge appears for Re-engagement only
- [ ] LinkedIn template hides open rate
- [ ] Custom template hides sequence info and performance
- [ ] Button text changes based on state
- [ ] All icons display correctly (emoji)

### Interaction Testing
- [ ] Clicking card triggers onSelect
- [ ] Clicking button triggers onSelect
- [ ] Button click doesn't double-trigger
- [ ] Selected state updates correctly
- [ ] Hover effects work smoothly
- [ ] Transitions are smooth

### Edge Case Testing
- [ ] Template with 0 touches (custom blank)
- [ ] Template with 0 conversion rate
- [ ] LinkedIn template without open rate
- [ ] Multi-channel template with badge
- [ ] Long template names
- [ ] Long "Perfect For" lists
- [ ] Missing performance data

### Responsive Testing
- [ ] Mobile: 1 column layout works
- [ ] Tablet: 2 column layout works
- [ ] Desktop: 3 column layout works
- [ ] Cards maintain proper spacing
- [ ] Text wraps correctly
- [ ] Buttons remain full-width

---

## INTEGRATION WITH WIZARD

### Step 2 Implementation

```tsx
// In CreateCampaignPage.tsx - Step 2

import { TemplateCard } from '@/components/campaigns/TemplateCard';
import { campaignTemplates } from '@/utils/campaignTemplates';

function Step2TemplateSelection() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleNext = () => {
    if (!selectedTemplateId) {
      toast.error('Please select a template');
      return;
    }

    // Load template sequences for Step 3
    const selectedTemplate = campaignTemplates.find(t => t.id === selectedTemplateId);
    setCampaignData(prev => ({
      ...prev,
      templateId: selectedTemplateId,
      sequences: selectedTemplate?.sequences || []
    }));

    setCurrentStep(3);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose a Template</h2>
        <p className="text-gray-600">
          Select a pre-built sequence or start from scratch
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaignTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={setSelectedTemplateId}
            isSelected={selectedTemplateId === template.id}
          />
        ))}
      </div>

      <div className="flex justify-between pt-6">
        <button onClick={() => setCurrentStep(1)}>Back</button>
        <button
          onClick={handleNext}
          disabled={!selectedTemplateId}
        >
          Next: Build Sequence
        </button>
      </div>
    </div>
  );
}
```

---

## FUTURE ENHANCEMENTS

### Phase 2 Features
1. **Template Preview Modal**
   - Click card to preview all touches
   - Show full email content
   - Preview subject lines and bodies

2. **Performance Comparison**
   - Hover to compare with other templates
   - Show industry benchmarks
   - Display success stories

3. **Template Favoriting**
   - Star icon to favorite templates
   - "My Favorites" filter
   - Recently used section

4. **Template Recommendations**
   - AI-based recommendations
   - Based on lead source
   - Based on past campaign performance

5. **Template Customization Preview**
   - Show how many touches user can edit
   - Preview personalization
   - Show A/B testing options

### Advanced Features
1. **Drag and drop** for custom ordering
2. **Template cloning** for variations
3. **Template sharing** across team
4. **Template analytics** dashboard
5. **Custom template creation** and saving

---

## COMPONENT STRUCTURE SUMMARY

```
TemplateCard
├── Card Container (with selection state)
│   ├── Header Section
│   │   ├── Icon + Name
│   │   └── Multi-channel Badge (conditional)
│   ├── Description Section
│   ├── Sequence Info Section (conditional)
│   │   ├── Touch count + Channel type
│   │   └── Duration
│   ├── Perfect For Section
│   │   └── Bulleted list
│   ├── Performance Section (conditional)
│   │   ├── Open rate (conditional)
│   │   ├── Reply rate
│   │   └── Conversion rate (conditional)
│   └── CTA Button
│       └── Dynamic text based on state
```

---

## FILE LOCATION
`/src/components/campaigns/TemplateCard.tsx`

---

## BUILD STATUS
✅ Build successful
✅ TypeScript compilation passed
✅ All imports resolved correctly
✅ Component ready for use in Step 2

---

## SUMMARY

TemplateCard component is complete with:
✅ Comprehensive template display (icon, name, description, metrics)
✅ Dynamic selection state with visual feedback
✅ Conditional rendering for different template types
✅ Multi-channel badge for hybrid templates
✅ Performance metrics display (open, reply, conversion)
✅ "Perfect For" use case list
✅ Responsive hover and selected states
✅ Smooth transitions and animations
✅ Click handler with stopPropagation
✅ Dynamic button text (Select/Selected/Start from Scratch)
✅ Full support for all 6 campaign templates
✅ Special handling for LinkedIn (no open rate)
✅ Special handling for Custom blank (no metrics)
✅ Production-ready styling with Tailwind CSS
✅ Type-safe with TypeScript interfaces

**Status**: Ready for integration into Campaign Wizard Step 2
**Dependencies**: Requires `/src/utils/campaignTemplates.ts`
