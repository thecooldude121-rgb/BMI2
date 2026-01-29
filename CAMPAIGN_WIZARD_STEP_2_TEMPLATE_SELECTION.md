# CAMPAIGN WIZARD STEP 2 - TEMPLATE SELECTION

## Overview
Complete implementation of Step 2 with 6 campaign templates displayed in a 3x2 grid. Each template shows detailed information including touch count, channel type, use cases, and performance metrics.

---

## COMPLETE TEMPLATE LIST

### Template Grid Layout
**3 columns × 2 rows** = 6 total templates

---

## TEMPLATE 1: COLD OUTREACH

### Header
- **Icon**: 📧 Mail envelope
- **Title**: "COLD OUTREACH" (uppercase, bold)
- **Divider**: Horizontal line below title

### Details
- **Sequence**: 5-touch sequence
- **Channel**: Email only

### Perfect For
- New prospects
- Cold outreach
- Enterprise

### Performance Metrics
- **📊 Open Rate**: 28%
- **💬 Reply Rate**: 8%

### Button
**Text**: "Select Template"
**Style**: Blue background, white text
**Action**: Selects template and advances to Step 3

---

## TEMPLATE 2: WARM INTRO

### Header
- **Icon**: 🤝 Handshake/Sparkles
- **Title**: "WARM INTRO" (uppercase, bold)
- **Divider**: Horizontal line below title

### Details
- **Sequence**: 3-touch sequence
- **Channel**: Email only

### Perfect For
- HRMS leads
- Referrals
- Warm intros

### Performance Metrics
- **📊 Open Rate**: 55%
- **💬 Reply Rate**: 20%

### Button
**Text**: "Select Template"

---

## TEMPLATE 3: RE-ENGAGEMENT

### Header
- **Icon**: 🔄 Refresh/circular arrows
- **Title**: "RE-ENGAGEMENT" (uppercase, bold)
- **Divider**: Horizontal line below title

### Details
- **Sequence**: 4-touch sequence
- **Channel**: Multi-channel

### Perfect For
- Dormant leads
- 90+ days inactive
- Win-back

### Performance Metrics
- **📊 Open Rate**: 18%
- **💬 Reply Rate**: 5%

### Button
**Text**: "Select Template"

---

## TEMPLATE 4: EVENT FOLLOW-UP

### Header
- **Icon**: 🎤 Calendar/microphone
- **Title**: "EVENT FOLLOW-UP" (uppercase, bold)
- **Divider**: Horizontal line below title

### Details
- **Sequence**: 3-touch sequence
- **Channel**: LinkedIn focus

### Perfect For
- Conference leads
- Webinar attendees
- Event networking

### Performance Metrics
- **📊 Open Rate**: N/A (LinkedIn)
- **💬 Reply Rate**: 12%

### Button
**Text**: "Select Template"

---

## TEMPLATE 5: TRIAL FOLLOW-UP

### Header
- **Icon**: 🎯 Target
- **Title**: "TRIAL FOLLOW-UP" (uppercase, bold)
- **Divider**: Horizontal line below title

### Details
- **Sequence**: 5-touch sequence
- **Channel**: Email only

### Perfect For
- Demo attendees
- Free trial users
- Product trials

### Performance Metrics
- **📊 Open Rate**: 42%
- **💬 Reply Rate**: 15%

### Button
**Text**: "Select Template"

---

## TEMPLATE 6: START FROM SCRATCH

### Header
- **Icon**: ✨ Sparkles/Zap
- **Title**: "START FROM SCRATCH" (uppercase, bold)
- **Divider**: Horizontal line below title

### Details
- **Sequence**: Build your own custom sequence
- **Channel**: Build your own

### Perfect For
- Unique campaigns
- Custom workflows
- A/B testing

### Performance Metrics
**Text**: "No pre-set performance data" (italic, gray)
- No open rate
- No reply rate

### Button
**Text**: "Start from Scratch"
**Note**: Different button text than other templates

---

## VISUAL STRUCTURE

### Page Header
- **Title**: "STEP 2: SELECT TEMPLATE" (bold, large, gray-900)
- **Subtitle**: "Choose a pre-built template or start from scratch" (small, gray-600)
- **Spacing**: 8px below title, 32px below subtitle

### Section Header
- **Text**: "RECOMMENDED TEMPLATES" (uppercase, tracked, semibold, gray-700)
- **Bottom Border**: Gray-200 line
- **Spacing**: Padding bottom 8px, margin bottom 24px

### Grid Layout
- **Columns**: 3 templates per row
- **Gap**: 24px between cards
- **Rows**: 2 rows
- **Total Cards**: 6

---

## TEMPLATE CARD DESIGN

### Card Container
- **Border**: 2px solid gray-200 (default)
- **Border (Selected)**: 2px solid blue-500
- **Background (Default)**: White
- **Background (Selected)**: Blue-50
- **Shadow (Hover)**: Medium shadow
- **Shadow (Selected)**: Medium shadow
- **Border Radius**: Rounded-lg (8px)
- **Padding**: 20px (p-5)
- **Transition**: All properties smooth

### Card Header Section
**Icon + Title**:
- Icon size: 20px (h-5 w-5)
- Icon color: Gray-500 (default), Blue-500 (selected)
- Title: Uppercase, bold, small, tracked, gray-900
- Gap: 8px between icon and title
- Margin bottom: 8px

**Divider**:
- Border bottom: 1px solid gray-300
- Margin bottom: 12px

### Card Body Section
**Minimum Height**: 280px (ensures consistent card heights)

**Sequence/Channel Info**:
- Font size: Small (14px)
- Color: Gray-700 (sequence), Gray-600 (channel)
- Font weight: Medium (sequence)
- Spacing: 4px between lines
- Margin bottom: 16px

**Perfect For Section**:
- Label: "Perfect for:" (extra small, semibold, gray-700)
- Label margin: 8px bottom
- List bullets: "•" character
- List items: Extra small (12px), gray-600
- Item spacing: 4px between items
- Section margin: 16px bottom

**Performance Metrics Section**:
- Label: "Avg Performance:" (extra small, semibold, gray-700)
- Label margin: 8px bottom
- Metric lines: Extra small (12px), gray-600
- Open rate line: 📊 emoji + percentage
- Reply rate line: 💬 emoji + percentage
- Line spacing: 4px between metrics
- Section margin: 24px bottom

**Special Cases**:
- **No Data Available**: "No pre-set performance data" (italic, gray-500)
- **LinkedIn Only**: Shows "N/A (LinkedIn)" for open rate
- **Multi-line display**: Breaks into 2 lines if no data

### Card Button
- **Width**: Full width (100%)
- **Padding**: 10px vertical (py-2.5), 16px horizontal (px-4)
- **Font**: Medium weight, 14px
- **Border Radius**: Rounded-lg (8px)
- **Background**: Blue-500 (default), Blue-600 (selected)
- **Text Color**: White
- **Hover**: Blue-600 (default), Blue-700 (selected)
- **Transition**: Colors smooth

---

## SELECTION BEHAVIOR

### Before Selection
- Border: Gray-200
- Background: White
- Button: Blue-500

### After Selection
- Border: Blue-500 (highlighted)
- Background: Blue-50 (light blue tint)
- Button: Blue-600 (darker blue)
- Shadow: Medium elevation
- Icon: Blue-500 (from gray-500)

### Auto-Advance
When a template is selected:
1. Template ID saved to `formData.template`
2. Automatically advances to Step 3
3. Progress tracker updates (Step 2 marked complete)
4. Step 3 receives selected template ID

---

## TIP CALLOUT

### Design
- **Position**: Below template grid
- **Background**: Blue-50
- **Border**: Blue-200
- **Padding**: 16px
- **Margin Top**: 32px (mb-8 after grid)

### Content
- **Icon**: 💡 Lightbulb (20px, blue-500)
- **Icon Position**: Left side, flex-shrink-0
- **Text**: Blue-700, 14px
- **Bold Label**: "TIP:" (font-semibold)
- **Message**: "Templates can be customized after selection. Your changes won't affect the template."

### Layout
- Flexbox with 8px gap
- Icon aligned to top (mt-0.5)
- Text wraps as needed

---

## NAVIGATION

### Bottom Navigation Bar
Located below the main content area.

**Left Button** (Step 2):
- **Text**: "← Previous: Basic Info"
- **Icon**: Left arrow
- **Action**: Returns to Step 1
- **Style**: Gray background, gray text

**Right Button** (Step 2):
- **Text**: "Next: Build Sequence →"
- **Icon**: Right arrow
- **Action**: Advances to Step 3
- **Style**: Blue background, white text
- **State**: Enabled (can proceed without selecting)

**Note**: Unlike template selection buttons, the nav button does NOT automatically select a template. It's just for manual navigation.

---

## DATA STRUCTURE

### Form Data Storage
```typescript
interface CampaignFormData {
  template: string;  // Template ID: 'cold-outreach' | 'warm-intro' | etc.
  // ... other fields
}
```

### Template Object Structure
```typescript
interface Template {
  id: string;              // 'cold-outreach', 'warm-intro', etc.
  name: string;            // Display name
  icon: React.ComponentType; // Lucide icon component
  touchCount: number;      // Number of touches (0 for custom)
  channel: string;         // 'Email only', 'Multi-channel', etc.
  perfectFor: string[];    // Array of use cases
  avgOpenRate: number | null;  // Percentage or null
  avgReplyRate: number | null; // Percentage or null
  description: string;     // Full description
}
```

### Template Selection Handler
```typescript
const handleTemplateSelect = (templateId: string) => {
  setFormData({ ...formData, template: templateId });
  handleNext(); // Auto-advance to Step 3
};
```

---

## TEMPLATE DEFINITIONS

Full template definitions from code:

```typescript
const campaignTemplates = [
  {
    id: 'cold-outreach',
    name: 'Cold Outreach',
    icon: Mail,
    touchCount: 5,
    channel: 'Email only',
    perfectFor: ['New prospects', 'Cold outreach', 'Enterprise'],
    avgOpenRate: 28,
    avgReplyRate: 8,
    description: '5-touch email sequence designed for cold outreach'
  },
  {
    id: 'warm-intro',
    name: 'Warm Intro',
    icon: Sparkles,
    touchCount: 3,
    channel: 'Email only',
    perfectFor: ['HRMS leads', 'Referrals', 'Warm intros'],
    avgOpenRate: 55,
    avgReplyRate: 20,
    description: '3-touch sequence for warm introductions'
  },
  {
    id: 're-engagement',
    name: 'Re-engagement',
    icon: RefreshCw,
    touchCount: 4,
    channel: 'Multi-channel',
    perfectFor: ['Dormant leads', '90+ days inactive', 'Win-back'],
    avgOpenRate: 18,
    avgReplyRate: 5,
    description: '4-touch multi-channel sequence for re-engagement'
  },
  {
    id: 'event-followup',
    name: 'Event Follow-up',
    icon: Calendar,
    touchCount: 3,
    channel: 'LinkedIn focus',
    perfectFor: ['Conference leads', 'Webinar attendees', 'Event networking'],
    avgOpenRate: null,
    avgReplyRate: 12,
    description: '3-touch LinkedIn-focused follow-up'
  },
  {
    id: 'trial-followup',
    name: 'Trial Follow-up',
    icon: Target,
    touchCount: 5,
    channel: 'Email only',
    perfectFor: ['Demo attendees', 'Free trial users', 'Product trials'],
    avgOpenRate: 42,
    avgReplyRate: 15,
    description: '5-touch email sequence for trial users'
  },
  {
    id: 'custom',
    name: 'Start from Scratch',
    icon: Zap,
    touchCount: 0,
    channel: 'Build your own',
    perfectFor: ['Unique campaigns', 'Custom workflows', 'A/B testing'],
    avgOpenRate: null,
    avgReplyRate: null,
    description: 'Build your own custom sequence from scratch'
  }
];
```

---

## INTERACTION FLOWS

### Flow 1: Select Pre-built Template
1. User views 6 template cards
2. User clicks "Select Template" on desired card
3. Card highlights (blue border, blue background)
4. Template ID saved to formData
5. Automatically advances to Step 3
6. Progress tracker shows Step 2 complete

### Flow 2: Start from Scratch
1. User views 6 template cards
2. User clicks "Start from Scratch" on custom card
3. Card highlights
4. Template ID 'custom' saved to formData
5. Automatically advances to Step 3
6. Step 3 shows empty sequence builder (no pre-filled touches)

### Flow 3: Navigate Without Selection
1. User views template cards
2. User does not click any template
3. User clicks "Next: Build Sequence" in bottom nav
4. Advances to Step 3
5. formData.template remains empty string
6. Step 3 shows default state

### Flow 4: Go Back and Change Selection
1. User on Step 3 (after selecting template)
2. User clicks "← Previous: Template"
3. Returns to Step 2
4. Previously selected template still highlighted
5. User can click different template
6. New selection overwrites previous
7. Auto-advances to Step 3 again

---

## RESPONSIVE BEHAVIOR

### Desktop (1024px+)
- 3 columns across
- 2 rows down
- Full card content visible
- No horizontal scrolling

### Tablet (768px - 1023px)
- May reduce to 2 columns
- 3 rows
- Slightly narrower cards
- Content still readable

### Mobile (< 768px)
- Single column
- 6 cards stacked vertically
- Full-width cards
- Touch-friendly buttons
- More scrolling required

---

## ACCESSIBILITY

### Keyboard Navigation
- Tab through all template cards
- Tab to "Select Template" buttons
- Space or Enter to select
- Tab to navigation buttons

### Screen Readers
- Template names announced
- Touch count and channel read
- "Perfect for" list read as list
- Performance metrics announced
- Button purposes clear

### Visual Indicators
- Clear hover states (border change, shadow)
- Selected state highly visible (blue border + background)
- Sufficient color contrast
- Icon + text redundancy

### Focus Management
- Blue outline on keyboard focus
- Focus returns to selected card after selection
- Focus moves to Step 3 on advance

---

## PERFORMANCE CONSIDERATIONS

### Template Icons
All icons are Lucide React components:
- Lightweight SVG
- No image loading delay
- Crisp at any size
- Color customizable via props

### Grid Layout
Using CSS Grid:
- Efficient layout calculation
- No JavaScript layout
- Smooth responsive behavior
- GPU-accelerated rendering

### Selection State
Single source of truth:
- `formData.template` stores selected ID
- Cards derive state from comparison
- No duplicate state tracking
- Prevents sync issues

---

## TESTING CHECKLIST

### Visual Testing
- [ ] All 6 templates display correctly
- [ ] Template icons render properly
- [ ] Titles are uppercase and bold
- [ ] Divider lines show below titles
- [ ] All "Perfect for" bullets visible
- [ ] Performance metrics formatted correctly
- [ ] "N/A (LinkedIn)" shows for Event Follow-up open rate
- [ ] "No pre-set performance data" shows for Start from Scratch
- [ ] Tip callout displays at bottom
- [ ] Lightbulb icon shows in tip

### Interaction Testing
- [ ] Can click "Select Template" on each card
- [ ] Selected card highlights with blue border
- [ ] Selected card gets blue-50 background
- [ ] Selecting template auto-advances to Step 3
- [ ] Can select different template (overwrites previous)
- [ ] "Start from Scratch" button works correctly
- [ ] Hover states show on all cards
- [ ] Hover shadow appears

### Navigation Testing
- [ ] "Previous: Basic Info" returns to Step 1
- [ ] "Next: Build Sequence" advances to Step 3
- [ ] Can navigate without selecting template
- [ ] Returning to Step 2 preserves selection
- [ ] Progress tracker updates correctly

### Data Persistence Testing
- [ ] Selected template ID saved to formData
- [ ] Template selection survives navigation back/forth
- [ ] Changing selection updates formData
- [ ] Selection state visual matches formData

### Responsive Testing
- [ ] 3-column grid on desktop
- [ ] Proper layout on tablet
- [ ] Single column on mobile
- [ ] Cards remain usable at all sizes
- [ ] Buttons remain clickable on mobile

---

## QUICK TEST (2 MINUTES)

1. **Navigate** to `/lead-generation/campaigns/create`

2. **Complete Step 1** with any data, click "Next: Select Template"

3. **View Templates**:
   - Verify all 6 templates visible
   - Check icons, titles, metrics display correctly

4. **Hover Test**:
   - Hover over "Cold Outreach" - verify border darkens, shadow appears
   - Hover over "Warm Intro" - same effect
   - Hover over all 6 cards

5. **Selection Test**:
   - Click "Select Template" on "Cold Outreach"
   - Verify card highlights (blue border, blue background)
   - Verify auto-advance to Step 3

6. **Return Test**:
   - Click "← Previous: Template" from Step 3
   - Verify "Cold Outreach" still highlighted
   - Click "Select Template" on "Warm Intro"
   - Verify new selection, auto-advance

7. **Custom Template Test**:
   - Return to Step 2 again
   - Click "Start from Scratch" on last card
   - Verify different button text
   - Verify selection and advance

8. **Manual Navigation Test**:
   - Return to Step 2
   - Do NOT click any template
   - Click "Next: Build Sequence" at bottom
   - Verify advances to Step 3

9. **Tip Callout**:
   - Scroll to bottom of Step 2
   - Verify blue box with lightbulb icon
   - Verify tip text readable

10. **Progress Tracker**:
    - Verify Step 2 shows checkmark when complete
    - Verify Step 3 becomes current

**Expected**: All templates display properly, selection works, navigation smooth, data persists.

---

## KNOWN ISSUES

None currently identified.

---

## FUTURE ENHANCEMENTS

1. **Template Preview**: Modal showing full sequence preview
2. **Template Comparison**: Side-by-side comparison view
3. **Template Search**: Filter templates by keyword
4. **Custom Templates**: Save user-created templates
5. **Template Rating**: Show user ratings/reviews
6. **Template Analytics**: Real user performance data
7. **Template Recommendations**: AI suggests best template
8. **Template Variants**: Multiple versions of each type
9. **Template Favorites**: Star frequently used templates
10. **Template Import**: Import templates from other users

---

## EDGE CASES HANDLED

1. **No Template Selected**: Can still proceed to Step 3
2. **Null Performance Metrics**: Shows "N/A" or "No pre-set data"
3. **Long Template Names**: Truncates or wraps properly
4. **Many Perfect For Items**: Cards have min-height for consistency
5. **Template with 0 Touches**: Handled by "Start from Scratch"
6. **Returning to Step**: Maintains selection highlight
7. **Rapid Clicking**: Auto-advance prevents double-navigation

---

## FILE LOCATION
`/src/pages/LeadGeneration/CreateCampaignPage.tsx`

Lines: ~627-707 (renderStep2Template function)

---

## BUILD STATUS
✅ Build successful
✅ No TypeScript errors
✅ No console warnings
✅ All templates render correctly
✅ Selection and navigation functional

---

## SUMMARY

Step 2 Template Selection is complete with:
✅ 6 campaign templates in 3x2 grid
✅ Detailed template information (touches, channel, use cases)
✅ Performance metrics with emojis
✅ Visual selection feedback (blue highlighting)
✅ Auto-advance on template selection
✅ Manual navigation option
✅ Informative tip callout
✅ Consistent card heights
✅ Responsive hover states
✅ Data persistence across navigation
✅ Clean, professional design

**Status**: Production-ready and fully functional
