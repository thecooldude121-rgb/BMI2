# Campaign Owner Dropdown - Quick Test Guide (2 Minutes)

## Access
**URL**: `/demo/campaign-wizard-step1`
**Location**: Scroll down to "Campaign Owner" section (below tags)

## Quick Test Sequence

### Test 1: View Selected Owner (10 seconds)
1. See default selected owner: "👤 Adithya (You)"
2. Shows email: "adithya@company.com"
3. Dropdown chevron icon on right ✓

### Test 2: Open Dropdown (15 seconds)
1. Click the dropdown button
2. Blue border + ring appears ✓
3. Chevron rotates 180° ✓
4. Menu slides down with fade animation ✓
5. Search input at top with magnifying glass icon ✓
6. List of team members below ✓
7. Footer info at bottom ✓

### Test 3: View Team Members (20 seconds)
**Expected members in order:**
1. 👤 **Adithya (You)** ✓ ← Selected with checkmark
   - adithya@company.com
   - [Admin] Sales Director

2. 👤 Sarah Chen
   - sarah.chen@company.com
   - [Manager] Sales Manager

3. 👤 Michael Rodriguez
   - michael.r@company.com
   - [Rep] Senior Account Executive

4. 👤 Emily Johnson
   - emily.j@company.com
   - [Rep] Account Executive

5. 👤 Jessica Martinez
   - jessica.m@company.com
   - [Rep] Account Executive

6. 👤 James Anderson
   - james.a@company.com
   - [Rep] Account Executive

### Test 4: Hover Over User (10 seconds)
1. Hover over "Sarah Chen"
2. Row background turns blue (bg-blue-50) ✓
3. Hover over another user
4. Previous hover clears, new one highlights ✓

### Test 5: Select Different Owner (20 seconds)
1. Click on "Sarah Chen"
2. Dropdown closes immediately ✓
3. Selected value updates to "👤 Sarah Chen" ✓
4. Shows email: "sarah.chen@company.com" ✓
5. Warning message appears ✓
6. Warning text: "⚠️ Owner changed" ✓
7. Details: "Sarah Chen will receive all notifications..." ✓
8. Auto-save indicator appears: "Auto-saving owner selection..." ✓

### Test 6: Search Functionality (30 seconds)
1. Open dropdown
2. Click search input (auto-focused) ✓
3. Type "sarah"
4. List filters to show only Sarah Chen ✓
5. Type "michael"
6. List filters to show only Michael Rodriguez ✓
7. Type "xyz" (no match)
8. Shows: 👤 icon, "No results found", "Try a different search term" ✓
9. Clear search
10. All users reappear ✓

### Test 7: Search by Email (15 seconds)
1. Open dropdown
2. Type "@company.com" in search
3. All users shown (all have matching email) ✓
4. Type "sarah.chen"
5. Only Sarah Chen shown ✓

### Test 8: Keyboard Navigation (30 seconds)
1. Open dropdown
2. Type "e" (filters to Emily)
3. Press Down Arrow
4. Emily Johnson highlights in blue ✓
5. Press Down Arrow again
6. Next item highlights ✓
7. Press Up Arrow
8. Previous item highlights ✓
9. Press Enter
10. Selected owner updates to highlighted user ✓
11. Dropdown closes ✓

### Test 9: Escape to Close (10 seconds)
1. Open dropdown
2. Type some search text
3. Press Escape
4. Dropdown closes ✓
5. Search query clears ✓

### Test 10: Click Outside to Close (10 seconds)
1. Open dropdown
2. Click anywhere outside the dropdown
3. Dropdown closes ✓
4. Search query clears ✓

### Test 11: Role Badges (15 seconds)
**Verify badge colors:**
- Adithya: [Admin] - Purple badge (bg-purple-100 text-purple-800) ✓
- Sarah Chen: [Manager] - Blue badge (bg-blue-100 text-blue-800) ✓
- Others: [Rep] - Green badge (bg-green-100 text-green-800) ✓

### Test 12: Current User Always First (10 seconds)
1. Open dropdown
2. "Adithya (You)" is first in list ✓
3. Has "(You)" indicator in blue text ✓
4. Checkmark visible when selected ✓

### Test 13: Auto-Save (10 seconds)
1. Change owner to different user
2. See "Auto-saving owner selection..." with pulsing dot ✓
3. Wait 5 seconds
4. Console shows: "Campaign owner auto-saved: [Name]" ✓
5. Indicator disappears ✓

## Visual States Checklist

### Dropdown Button States
- [ ] Default: Gray border, white background
- [ ] Open: Blue border + blue ring, chevron rotated
- [ ] Shows avatar circle with initials
- [ ] Shows user name and email
- [ ] Shows "(You)" for current user

### Dropdown Menu
- [ ] White background with shadow
- [ ] Search input at top with icon
- [ ] Scrollable list (max 300px height)
- [ ] Each user shows avatar, name, email, role badge, title
- [ ] Selected user has checkmark
- [ ] Hover state: blue background
- [ ] Footer with info text

### Warning Message
- [ ] Yellow border and background
- [ ] Alert icon on left
- [ ] "Owner changed" heading
- [ ] Details about notifications
- [ ] Auto-dismisses after 5 seconds
- [ ] Slide-in animation

### Avatar Design
- [ ] Circular gradient (blue-500 to blue-600)
- [ ] White text with initials
- [ ] 36px x 36px (w-9 h-9)
- [ ] Consistent across dropdown and button

## Expected Console Output
```
Campaign owner auto-saved: Sarah Chen
Campaign owner auto-saved: Michael Rodriguez
```

## All Features Working ✓
- ✅ Avatar with initials (blue gradient)
- ✅ User name and email display
- ✅ "(You)" indicator for current user
- ✅ Dropdown expands/collapses
- ✅ Chevron rotates on open
- ✅ Search input with icon
- ✅ Filter by name or email
- ✅ "No results" empty state
- ✅ Hover highlights row
- ✅ Click to select owner
- ✅ Checkmark on selected user
- ✅ Role badges (Admin/Manager/Rep)
- ✅ User title displayed
- ✅ Warning message on change
- ✅ Auto-save after 5 seconds
- ✅ Keyboard navigation (arrows)
- ✅ Enter to select
- ✅ Escape to close
- ✅ Click outside to close
- ✅ Current user always first
- ✅ Footer info text
- ✅ Smooth animations

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Click | Open/close dropdown |
| Enter | Select highlighted user |
| Escape | Close dropdown |
| Arrow Down | Highlight next user |
| Arrow Up | Highlight previous user |
| Type | Filter users |

## Permissions Notes
- Only users with "Campaign Owner" permission shown
- Current user (Adithya) always appears first
- Others sorted alphabetically
- 6 total users available for selection
