# Campaign Collaborators Multi-select - Quick Test Guide (2 Minutes)

## Access
**URL**: `/demo/campaign-wizard-step1`
**Location**: Scroll down to "Collaborators" section (below owner dropdown)

## Quick Test Sequence

### Test 1: View Initial State (10 seconds)
1. See label: "Collaborators (Optional)" ✓
2. Search input with 🔍 icon and placeholder: "Search team members..." ✓
3. No pills shown (empty state) ✓
4. Helper text below: "Add team members who can help manage this campaign..." ✓

### Test 2: Open Dropdown (15 seconds)
1. Click the search input
2. Blue border + ring appears ✓
3. Dropdown menu slides down ✓
4. Shows 5 team members (owner excluded) ✓
5. Each has checkbox ☐ + avatar + name + email ✓
6. Footer info at bottom ✓

**Expected members** (if Adithya is owner):
1. ☐ Sarah Chen - sarah.chen@company.com
2. ☐ Michael Rodriguez - michael.r@company.com
3. ☐ Emily Johnson - emily.j@company.com
4. ☐ Jessica Martinez - jessica.m@company.com
5. ☐ James Anderson - james.a@company.com

### Test 3: Select First Collaborator (20 seconds)
1. Click checkbox next to "Sarah Chen"
2. Checkbox fills blue with white checkmark ✓
3. Pill appears below input: [👤 Sarah Chen] [×] ✓
4. Dropdown stays open ✓
5. Count badge shows in input: "👥 1 selected" ✓
6. Auto-save indicator appears: "Auto-saving collaborators..." ✓

### Test 4: Select Multiple Collaborators (20 seconds)
1. Click checkbox next to "Michael Rodriguez"
2. Second pill appears: [👤 Michael Rodriguez] [×] ✓
3. Count badge updates: "👥 2 selected" ✓
4. Click "Emily Johnson" checkbox
5. Third pill appears ✓
6. Count badge: "👥 3 selected" ✓
7. Dropdown remains open ✓

### Test 5: Search Functionality (25 seconds)
1. Type "sarah" in search input
2. List filters to show only Sarah Chen ✓
3. Her checkbox shows checked ✓ (if already selected)
4. Clear search (delete text)
5. All 5 members reappear ✓
6. Type "mike"
7. Filters to show only Michael Rodriguez ✓
8. Type "xyz" (no match)
9. Shows empty state: 👥 icon + "No team members found" ✓

### Test 6: Remove Collaborator via Pill (15 seconds)
1. Click × button on Sarah Chen's pill
2. Pill disappears with animation ✓
3. Count badge updates: "👥 2 selected" ✓
4. Open dropdown
5. Sarah's checkbox is now unchecked ☐ ✓
6. Auto-save indicator appears ✓

### Test 7: Remove via Checkbox (15 seconds)
1. Dropdown open with Michael selected (checked)
2. Click Michael's checkbox again
3. Checkbox unchecks ☐ ✓
4. Michael's pill disappears ✓
5. Count badge updates ✓
6. Dropdown stays open ✓

### Test 8: Owner Auto-excluded (20 seconds)
**Setup**: Adithya is owner
1. Open collaborators dropdown
2. Count members shown: 5 total ✓
3. Adithya NOT in list ✓
4. Change owner to Sarah Chen (in owner dropdown above)
5. Open collaborators dropdown again
6. Sarah Chen NOT in list ✓
7. Adithya NOW appears in list ✓
8. Count members: still 5 total ✓

### Test 9: Max 10 Collaborators (20 seconds)
1. Select 10 collaborators (click all checkboxes)
2. Pills appear for all 10 ✓
3. Count badge: "👥 10 selected" ✓
4. Yellow warning appears: "⚠️ Maximum collaborators reached" ✓
5. Warning text: "You can add up to 10 collaborators per campaign..." ✓
6. Search input becomes disabled (grayed out) ✓
7. Open dropdown
8. All unselected users have opacity-50 and cursor-not-allowed ✓
9. Cannot check any more boxes ✓

### Test 10: Keyboard Interactions (15 seconds)
1. Click search input (dropdown opens)
2. Type to filter users
3. Press Escape
4. Dropdown closes ✓
5. Search query clears ✓

### Test 11: Click Outside to Close (10 seconds)
1. Click search input (dropdown opens)
2. Click anywhere outside dropdown
3. Dropdown closes ✓
4. Search query clears ✓
5. Pills remain visible ✓

### Test 12: Auto-save (10 seconds)
1. Select a collaborator
2. See "Auto-saving collaborators..." with pulsing dot ✓
3. Wait 3 seconds
4. Console shows: "Collaborators auto-saved: Sarah Chen, Mike Johnson" ✓
5. Indicator disappears ✓

## Visual States Checklist

### Search Input States
- [ ] Default: Gray border, search icon, placeholder
- [ ] Focused: Blue border + blue ring
- [ ] With selections: Count badge visible (e.g., "👥 2 selected")
- [ ] At max (10): Input disabled, grayed out

### Dropdown Menu
- [ ] White background with shadow
- [ ] Each user has: checkbox + avatar + name + email
- [ ] Checkbox states: unchecked (☐) vs checked (✓)
- [ ] Selected users have blue checkbox with white checkmark
- [ ] Footer with info text
- [ ] Empty state: user icon + "No team members found"

### Pills (Selected Collaborators)
- [ ] Blue background (bg-blue-50)
- [ ] Blue border (border-blue-200)
- [ ] Avatar circle with initials
- [ ] User name
- [ ] Remove button (×) with hover effect
- [ ] Slide-in animation on appear
- [ ] Arranged in flex-wrap row

### Warning Message (Max Reached)
- [ ] Yellow border and background
- [ ] Alert icon on left
- [ ] "Maximum collaborators reached" heading
- [ ] Details about limit
- [ ] Slide-in animation

### Auto-save Indicator
- [ ] Pulsing yellow dot
- [ ] "Auto-saving collaborators..." text
- [ ] Gray text color
- [ ] Appears after any change
- [ ] Disappears after 3 seconds

## Expected Console Output
```
Collaborators auto-saved: Sarah Chen
Collaborators auto-saved: Sarah Chen, Michael Rodriguez
Collaborators auto-saved: Sarah Chen, Michael Rodriguez, Emily Johnson
Collaborators auto-saved: Michael Rodriguez, Emily Johnson
```

## All Features Working ✓
- ✅ Search input with icon
- ✅ Dropdown opens on focus
- ✅ 5 team members shown (owner excluded)
- ✅ Checkbox for each user
- ✅ Avatar circles with initials
- ✅ User name and email
- ✅ Multi-select (checkboxes stay checked)
- ✅ Pills appear for selected users
- ✅ Pills show avatar + name + remove button
- ✅ Remove via pill × button
- ✅ Remove via checkbox (uncheck)
- ✅ Count badge in input ("X selected")
- ✅ Search/filter by name
- ✅ Search/filter by email
- ✅ Empty state for no results
- ✅ Owner automatically excluded from list
- ✅ Owner changes update available users
- ✅ Max 10 collaborators limit
- ✅ Warning message at max
- ✅ Input disabled at max
- ✅ Remaining checkboxes disabled at max
- ✅ Dropdown stays open after selections
- ✅ Close with Escape
- ✅ Close with click outside
- ✅ Auto-save after 3 seconds
- ✅ Console logs collaborator names
- ✅ Smooth animations (slide, fade)
- ✅ Helper text below component
- ✅ Footer info in dropdown

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Click input | Open dropdown |
| Type | Filter users |
| Escape | Close dropdown + clear search |
| Click outside | Close dropdown |

## Common Test Scenarios

### Scenario 1: Add 3 Collaborators
1. Click input
2. Check Sarah Chen ✓
3. Check Michael Rodriguez ✓
4. Check Emily Johnson ✓
5. Result: 3 pills, "👥 3 selected", dropdown stays open ✓

### Scenario 2: Search and Select
1. Click input
2. Type "sarah"
3. Only Sarah shown
4. Check her checkbox ✓
5. Pill appears ✓
6. Clear search
7. All users reappear ✓

### Scenario 3: Remove All
1. Have 3 collaborators selected
2. Click × on each pill
3. All pills disappear ✓
4. Count badge disappears ✓
5. Open dropdown - all unchecked ✓

### Scenario 4: Change Owner (Exclusion)
1. Owner: Adithya, Collaborators: Sarah + Michael
2. Change owner to Sarah (via owner dropdown)
3. Sarah's pill disappears from collaborators ✓
4. Count updates to "👥 1 selected" ✓
5. Open dropdown - Sarah not in list ✓
6. Adithya now in list ✓

### Scenario 5: Hit Max Limit
1. Select 10 collaborators
2. Yellow warning appears ✓
3. Input grayed out ✓
4. Open dropdown - remaining users disabled ✓
5. Remove one collaborator (via pill ×)
6. Warning disappears ✓
7. Input enabled ✓
8. Can now select one more ✓

## Permissions Notes
- **Collaborators** can view and edit campaign
- **Collaborators** receive notifications
- **Only owner** can delete campaign
- **Owner** is automatically excluded from collaborator list
- Max 10 collaborators per campaign
