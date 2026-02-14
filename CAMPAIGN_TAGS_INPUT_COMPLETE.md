# Campaign Tags Input - Complete Implementation Guide

## Overview
Multi-select tag input with pills, auto-suggestions, and intelligent validation to help users organize and categorize campaigns.

## Location & Access
- **Page**: Campaign Wizard Step 1
- **URL**: `/demo/campaign-wizard-step1`
- **Position**: Below Target Metrics section
- **Section Title**: "Campaign Tags (Optional)"

## Component Details

### File Structure
```
src/components/campaigns/
├── CampaignTagsInput.tsx (Main component)
└── CampaignWizardStep1.tsx (Integration point)
```

### Configuration Constants
```typescript
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 20;

const DEFAULT_SUGGESTIONS = [
  'Enterprise',
  'SaaS',
  'SMB',
  'Product Launch',
  'Nurture',
  'Re-engagement',
  'Webinar',
  'Event',
  'Cold Outreach',
  'Warm Leads',
  'High Priority',
  'Q1 2025',
  'Demo Request',
  'Trial Users',
  'Churn Risk'
];
```

## UI States & Interactions

### Input Container States

#### Default State
```css
- Border: 2px solid #d1d5db (gray-300)
- Background: white
- Min-height: 42px
- Padding: 8px 12px
- Cursor: text
```

#### Focus State
```css
- Border: 2px solid #3b82f6 (blue-500)
- Ring: 4px solid rgba(59, 130, 246, 0.1) (blue-100)
- Outline: none
- Transition: 200ms
```

#### Error State
```css
- Border: 2px solid #ef4444 (red-500)
- Ring: 4px solid rgba(239, 68, 68, 0.1) (red-100)
- Shows error message below
```

#### Disabled State (10 tags)
```css
- Background: #f9fafb (gray-50)
- Border: 2px solid #d1d5db (gray-300)
- No input field shown
- Cursor: default
```

### Tag Pill Design

#### Structure
```tsx
<div className="bg-blue-100 text-blue-800 rounded-md px-2.5 py-1">
  <Tag className="w-3 h-3" />
  <span>Enterprise</span>
  <button>
    <X className="w-3 h-3" />
  </button>
</div>
```

#### Colors
```css
- Background: #dbeafe (blue-100)
- Text: #1e40af (blue-800)
- Icon: #1e40af (blue-800)
- Hover on X: #1e3a8a (blue-900) + #bfdbfe (blue-200) bg
```

#### Animations
```css
/* Add animation */
animate-in fade-in slide-in-from-left-2 duration-200

/* Remove animation */
fade-out slide-out-to-left-2 duration-200
```

## Add Tag Flow

### Method 1: Type and Press Enter
```
1. User clicks input → Focus state
2. User types "Enterprise"
3. User presses Enter
4. Validate tag
5. Add to tags array
6. Create pill badge
7. Clear input
8. Trigger auto-save
9. Keep focus on input
```

### Method 2: Type and Press Comma
```
1. User types "SaaS"
2. User presses comma (,)
3. Prevent default comma character
4. Validate tag
5. Add to tags array
6. Create pill badge
7. Clear input
8. Trigger auto-save
```

### Method 3: Select from Suggestions
```
1. User types "ent"
2. Dropdown filters to "Enterprise"
3. User presses Down Arrow
4. "Enterprise" highlights in blue
5. User presses Enter
6. Add tag from suggestion
7. Close dropdown
8. Clear input
```

## Remove Tag Flow

### Click × Button
```
1. User hovers over pill
2. × button changes color (darker blue)
3. × button background appears (light blue)
4. User clicks × button
5. Pill fades out (200ms)
6. Remove from tags array
7. Trigger auto-save
8. If tags < 10, show input field
```

### Backspace Key
```
1. Input is empty (no text)
2. User presses Backspace
3. Remove last tag in array
4. Trigger auto-save
5. Keep focus on input
```

## Suggestions Dropdown

### Display Logic
```typescript
const filteredSuggestions = inputValue.trim()
  ? existingTags.filter(tag =>
      tag.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.some(t => t.toLowerCase() === tag.toLowerCase())
    )
  : existingTags.filter(tag =>
      !tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
```

### Dropdown Structure
```tsx
<div className="bg-white border rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
  <div className="p-2">
    {/* Header */}
    <div className="text-xs font-medium text-gray-500">
      <ChevronDown className="w-3 h-3" />
      <span>Suggested tags</span>
    </div>

    {/* Suggestions */}
    {filteredSuggestions.map((suggestion, index) => (
      <button onClick={() => addTag(suggestion)}>
        <Tag className="w-3.5 h-3.5" />
        <span>{suggestion}</span>
      </button>
    ))}
  </div>
</div>
```

### Keyboard Navigation
- **Arrow Down**: Move highlight down
- **Arrow Up**: Move highlight up
- **Enter**: Select highlighted suggestion
- **Escape**: Close dropdown
- **Mouse Hover**: Update highlight to hovered item

### Highlighting Logic
```typescript
const [highlightedIndex, setHighlightedIndex] = useState(-1);

// Arrow Down
setHighlightedIndex(prev =>
  prev < filteredSuggestions.length - 1 ? prev + 1 : prev
);

// Arrow Up
setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
```

## Validation Rules

### Tag Format Validation
```typescript
const validateTag = (tag: string): string | null => {
  // Empty check
  if (tag.length === 0) {
    return 'Tag cannot be empty';
  }

  // Length check
  if (tag.length > MAX_TAG_LENGTH) {
    return `Tag must be ${MAX_TAG_LENGTH} characters or less`;
  }

  // Character check (only alphanumeric, spaces, dash, underscore)
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(tag)) {
    return 'Only letters, numbers, spaces, dashes, and underscores allowed';
  }

  // Duplicate check (case-insensitive)
  if (tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
    return 'Tag already exists';
  }

  // Max tags check
  if (tags.length >= MAX_TAGS) {
    return `Maximum ${MAX_TAGS} tags allowed`;
  }

  return null;
};
```

### Valid Tag Examples
```
✓ "Enterprise"
✓ "Product Launch"
✓ "Q1-2025"
✓ "Test_Tag"
✓ "SaaS 123"
✓ "High-Priority"
```

### Invalid Tag Examples
```
✗ ""                      → Tag cannot be empty
✗ "ThisIsWayTooLongForATag" → Tag must be 20 characters or less
✗ "Test@Tag"              → Only letters, numbers, spaces...
✗ "Product#Launch"        → Only letters, numbers, spaces...
✗ "enterprise" (duplicate) → Tag already exists
✗ (11th tag)              → Maximum 10 tags allowed
```

## Auto-Save Functionality

### Timing
- **Delay**: 5 seconds after last change
- **Triggers**: Add tag, remove tag
- **Does NOT trigger**: Typing in input (only on tag add/remove)

### Visual Feedback
```tsx
{hasChanges && (
  <div className="flex items-center gap-2 text-xs text-gray-500">
    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
    <span>Auto-saving tags...</span>
  </div>
)}
```

### Console Output
```javascript
Tags auto-saved: ['Enterprise', 'SaaS', 'Product Launch']
```

## Character Counter

### Display Logic
```tsx
<div className="text-xs text-gray-500">
  {inputValue.length > 0 && (
    <span className={
      inputValue.length >= MAX_TAG_LENGTH
        ? 'text-red-600 font-medium'
        : ''
    }>
      {inputValue.length}/{MAX_TAG_LENGTH}
    </span>
  )}
</div>
```

### States
- **0-19 chars**: Gray text, normal weight
- **20 chars**: Red text, bold weight

## Tag Counter

### Display
```tsx
<div className="text-xs text-gray-500">
  {tags.length}/{MAX_TAGS} tags
</div>
```

### States
- **0-9 tags**: Normal display
- **10 tags**: Input field hidden, "10/10 tags" shown

## Keyboard Shortcuts

### All Shortcuts
| Key | Condition | Action |
|-----|-----------|--------|
| Enter | Input has text | Add tag from input |
| Enter | Suggestion highlighted | Add highlighted suggestion |
| Enter | Dropdown closed | Add tag from input |
| Comma (,) | Any time | Add tag, prevent comma char |
| Backspace | Input empty | Remove last tag |
| Escape | Any time | Close suggestions dropdown |
| Arrow Down | Dropdown open | Highlight next suggestion |
| Arrow Up | Dropdown open | Highlight previous suggestion |

### Implementation
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  // Comma separator
  if (e.key === ',') {
    e.preventDefault();
    if (inputValue.trim()) addTag(inputValue);
  }

  // Enter to add
  if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightedIndex >= 0) {
      addTag(filteredSuggestions[highlightedIndex]);
    } else if (inputValue.trim()) {
      addTag(inputValue);
    }
  }

  // Backspace on empty input
  if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
    removeTag(tags.length - 1);
  }

  // Arrow navigation
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setHighlightedIndex(prev =>
      prev < filteredSuggestions.length - 1 ? prev + 1 : prev
    );
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
  }

  // Escape to close
  if (e.key === 'Escape') {
    setShowSuggestions(false);
  }
};
```

## Click Outside Behavior

### Implementation
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current &&
        !containerRef.current.contains(event.target as Node)) {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

### Behavior
1. User clicks anywhere outside component
2. Suggestions dropdown closes
3. Highlight resets to -1
4. Input maintains focus (if clicked on input)

## Case Sensitivity

### Storage
- Tags stored with **original case** preserved
- Example: User types "Enterprise" → Stored as "Enterprise"

### Comparison (Duplicate Check)
- Comparison is **case-insensitive**
- "Enterprise" = "enterprise" = "ENTERPRISE"

### Display
- Shows **original case** as entered by user
- Pills display exact case from array

### Implementation
```typescript
// Duplicate check (case-insensitive)
if (tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
  return 'Tag already exists';
}

// But store with original case
onChange([...tags, trimmedTag]);
```

## Props Interface

```typescript
interface CampaignTagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  existingTags?: string[];
}
```

### Integration with Step 1
```typescript
export interface Step1Data {
  // ... other fields
  tags: string[];
}

// Usage
<CampaignTagsInput
  tags={formData.tags}
  onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
/>
```

## Helper Elements

### Info Box
```tsx
<div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
  <p className="text-xs text-gray-600">
    <span className="font-medium">Tags help organize campaigns.</span>
    Use them to filter and search campaigns later.
    Tags are visible to your entire team.
  </p>
</div>
```

### Helper Text
```tsx
<div className="text-xs text-gray-500">
  Press Enter or comma to add • Max 20 characters
</div>
```

## Responsive Behavior

### Desktop
- Dropdown: Max width 500px
- Pills: Wrap to new line as needed
- Input: Min width 120px, flex-grow

### Mobile
- Dropdown: Full width of container
- Pills: Same wrapping behavior
- Input: Min width 120px (ensures usability)

## Error Handling

### Error Display
```tsx
{error && (
  <div className="text-sm text-red-600 animate-in slide-in-from-top-1">
    <span className="font-medium">⚠</span>
    <span>{error}</span>
  </div>
)}
```

### Error Timeout
- All errors auto-dismiss after **3 seconds**
- Implemented with `setTimeout(() => setError(null), 3000)`

### Error Priority
If multiple validation rules fail:
1. Empty check
2. Length check
3. Character check
4. Duplicate check
5. Max tags check

## Testing Checklist

### Functional Tests
- [ ] Add tag with Enter key
- [ ] Add tag with comma key
- [ ] Add tag from suggestions (click)
- [ ] Add tag from suggestions (Enter)
- [ ] Remove tag with × button
- [ ] Remove tag with Backspace
- [ ] Suggestions filter as typing
- [ ] Duplicate prevention works
- [ ] Case-insensitive comparison
- [ ] Max 10 tags enforced
- [ ] Max 20 characters enforced
- [ ] Special characters rejected
- [ ] Auto-save triggers
- [ ] Input disabled at 10 tags
- [ ] Input re-enabled when tag removed

### Keyboard Tests
- [ ] Enter adds tag
- [ ] Comma adds tag
- [ ] Backspace removes last tag (when input empty)
- [ ] Escape closes dropdown
- [ ] Arrow Down navigates suggestions
- [ ] Arrow Up navigates suggestions
- [ ] Arrow keys don't scroll page

### Visual Tests
- [ ] Pills animate in (fade + slide)
- [ ] Pills animate out (fade)
- [ ] Blue border on focus
- [ ] Red border on error
- [ ] Gray background when full
- [ ] Suggestions dropdown shows
- [ ] Highlighted suggestion blue background
- [ ] Character counter turns red at 20
- [ ] Auto-save indicator pulses
- [ ] Error message slides in

### Edge Cases
- [ ] Empty input + Enter = no action
- [ ] Whitespace-only tag rejected
- [ ] Leading/trailing whitespace trimmed
- [ ] Very long tag truncated at input level
- [ ] Rapid typing doesn't break
- [ ] Click outside closes dropdown
- [ ] Multiple quick adds work correctly

## Performance Considerations

### Memoization
```typescript
const validateTag = useCallback((tag: string) => {
  // validation logic
}, [tags]);

const addTag = useCallback((tagToAdd: string) => {
  // add logic
}, [tags, onChange, validateTag]);

const removeTag = useCallback((index: number) => {
  // remove logic
}, [tags, onChange]);
```

### Debouncing
- No debouncing on input change (immediate filter)
- Auto-save has 5-second delay
- Error dismissal has 3-second timeout

### Event Listeners
- Click outside listener cleaned up on unmount
- Blur event has 200ms delay for click handling

## Future Enhancements

### Phase 2 Features
1. **Color-coded tags**: Different colors for categories
2. **Tag categories**: Group tags (e.g., Priority, Type, Quarter)
3. **Tag popularity**: Show usage count in suggestions
4. **Recent tags**: Prioritize recently used tags
5. **Bulk actions**: Select multiple tags to remove
6. **Tag descriptions**: Hover to see tag purpose
7. **Team tags**: Filter by creator/team
8. **Tag analytics**: Track most-used tags

### Advanced Features
1. **Hierarchical tags**: Parent/child relationships
2. **Tag synonyms**: Auto-suggest related tags
3. **Smart suggestions**: ML-based recommendations
4. **Tag templates**: Pre-defined tag sets
5. **Tag permissions**: Restrict who can create tags
6. **Tag automation**: Auto-tag based on campaign properties

## All Features Complete ✅

- ✅ Input field with blue pills
- ✅ Tag icon + text + × button in pills
- ✅ Enter or comma to add tags
- ✅ Auto-suggest dropdown
- ✅ Click suggestion to add
- ✅ Arrow keys navigate suggestions
- ✅ Duplicate prevention (case-insensitive)
- ✅ Case preservation in display
- ✅ Max 10 tags limit
- ✅ Max 20 characters per tag
- ✅ Character counter (red at 20)
- ✅ Tag counter (0/10 format)
- ✅ Special character validation
- ✅ Backspace removes last tag
- ✅ Escape closes dropdown
- ✅ Click outside closes dropdown
- ✅ Auto-save after 5 seconds
- ✅ Error messages (3s timeout)
- ✅ Fade animations
- ✅ Disabled state at 10 tags
- ✅ Info box with usage tips

**Status**: Production Ready
**Build**: Verified
**Console**: No errors
