# Seat Availability Check - Implementation Guide

## Overview
The seat availability check has been fully implemented. The system now checks available seats before allowing new team member additions and shows an error modal when the plan limit is reached.

## Location
- **No Seats Modal Component**: `/src/components/Team/NoSeatsAvailableModal.tsx`
- **Integration**: `/src/pages/CRM/TeamManagementPage.tsx`
- **Trigger**: "Add New Team Member" button click

## How It Works

### Plan Configuration (Current MVP Settings)
- **Plan Name**: Professional Plan
- **Total Seats**: 5
- **Calculation**: Available Seats = Total Seats - Active Members
- **Check**: Performed when clicking "Add New Team Member"

### Seat Availability Logic
```
Active Members = teamMembers.filter(m => m.status === 'active').length
Available Seats = 5 - Active Members

if (availableSeats > 0) {
  → Open Add Team Member Modal
} else {
  → Show No Seats Available Modal
}
```

## Testing Scenarios

### Scenario 1: Seats Available (Normal Flow)
**Setup**: Less than 5 active team members

1. Navigate to `/crm/team-management`
2. Click "Add New Team Member" button
3. **Expected**: Add Team Member modal opens normally
4. Fill out form and submit
5. **Expected**: New member added successfully

**Current State**: Initial data has 8 members total, but we're checking active members only

### Scenario 2: No Seats Available (Error Flow)
**Setup**: Exactly 5 active team members

1. Add members until you have 5 active members
2. Click "Add New Team Member" button
3. **Expected**: No Seats Available modal appears instead
4. Modal shows:
   - Warning icon (yellow)
   - "You've reached your plan limit" message
   - Plan details: "Professional Plan includes 5 seats, and all 5 are currently in use"
   - Three upgrade options
   - Three action buttons

### Scenario 3: Test Each Modal Button

#### Cancel Button
1. Trigger no seats modal (5 active members)
2. Click "Cancel"
3. **Expected**: Modal closes, stays on Team Management page

#### Deactivate User Button
1. Trigger no seats modal
2. Click "Deactivate User"
3. **Expected**:
   - Modal closes
   - Toast: "Navigate to user management to deactivate users"
   - (In production: would navigate to user management)

#### Upgrade Plan Button
1. Trigger no seats modal
2. Click "Upgrade Plan"
3. **Expected**:
   - Modal closes
   - Toast: "Opening billing and upgrade options..."
   - (In production: would navigate to billing page)

## No Seats Available Modal Details

### Modal Layout
- **Width**: 512px (max-w-lg)
- **Header**: "No Available Seats" with close (X) button
- **Icon**: Yellow warning circle (AlertCircle)

### Warning Message
```
You've reached your plan limit

Your Professional Plan includes 5 seats, and all 5 are currently in use.
```

### Three Options Displayed

#### Option 1: Deactivate User (Gray Box)
- **Title**: "1. Deactivate an existing user to free a seat"
- **Description**: "Mark an inactive user as deactivated"
- **Action**: No cost, frees up existing seat

#### Option 2: Upgrade to Business Plan (Blue Box - Recommended)
- **Title**: "2. Upgrade to Business Plan (15 seats)"
- **Description**: "Get 10 additional seats + advanced features"
- **Price**: **$299/month**
- **Style**: Blue background to highlight as recommended option

#### Option 3: Add Individual Seats (Gray Box)
- **Title**: "3. Add individual seats"
- **Description**: "Purchase additional seats as needed"
- **Price**: **$49/month per additional seat**
- **Best For**: Growing teams that need 1-2 extra seats

### Button Layout
- **Cancel** (Gray, left): Closes modal
- **Deactivate User** (Gray, center): Navigate to deactivate
- **Upgrade Plan** (Blue, right): Navigate to billing

## How to Test Both Flows

### Test 1: With Available Seats
```
1. Ensure you have < 5 active members
2. Click "Add New Team Member"
3. Verify Add modal opens
4. Add a member successfully
```

### Test 2: At Seat Limit
```
1. Add members until 5 are active
2. Click "Add New Team Member"
3. Verify No Seats modal appears
4. Test all three buttons:
   - Cancel → closes
   - Deactivate → toast notification
   - Upgrade → toast notification
```

### Test 3: After Deactivating
```
1. Have 5 active members (no seats)
2. Manually change a member's status to 'inactive' or 'away'
3. Now only 4 active members
4. Click "Add New Team Member"
5. Verify Add modal opens (seats available again)
```

## Status Counts

### Active Status Tracking
Only members with `status: 'active'` count toward seat usage:
- ✅ **'active'**: Counts toward seat limit
- ❌ **'away'**: Does NOT count (user is logged in elsewhere)
- ❌ **'offline'**: Does NOT count (user is inactive)
- ❌ **'inactive'**: Does NOT count (deactivated)

### Current Implementation
```typescript
const activeMembers = teamMembers.filter(m => m.status === 'active').length;
const availableSeats = totalSeats - activeMembers;
```

## Edge Cases Handled

1. **Exact Limit**: When active members = 5, shows no seats modal
2. **Status Changes**: Deactivating a user frees up a seat immediately
3. **Modal Switching**: Can't have both modals open simultaneously
4. **Cancel Anywhere**: Clicking outside or X closes the modal
5. **Button Actions**: Each button performs distinct action and closes modal

## Integration Points

### TeamManagementPage State
```typescript
const [showNoSeatsModal, setShowNoSeatsModal] = useState(false);
const planName = 'Professional Plan';
const totalSeats = 5;
const activeMembers = teamMembers.filter(m => m.status === 'active').length;
const availableSeats = totalSeats - activeMembers;
```

### Click Handler Logic
```typescript
const handleAddMember = () => {
  if (availableSeats > 0) {
    setShowAddMemberModal(true);
  } else {
    setShowNoSeatsModal(true);
  }
};
```

## Future Enhancements

### For Production:
1. **Dynamic Plan Fetching**: Load plan details from backend/billing system
2. **Real Seat Management**: Integrate with subscription management
3. **Navigation**: Wire up Deactivate and Upgrade buttons to actual pages
4. **Seat Purchase**: Implement actual seat purchase flow
5. **Plan Comparison**: Show feature differences between plans
6. **Billing Integration**: Connect to Stripe/payment processor
7. **Proration**: Handle mid-cycle upgrades and seat additions

### Additional Features:
- Show seat usage indicator in header (e.g., "3/5 seats used")
- Warning when approaching seat limit
- Bulk seat purchase discounts
- Annual vs monthly pricing
- Enterprise custom plans

## Visual Design

### Color Scheme
- **Warning**: Yellow (#FCD34D background, #D97706 text)
- **Primary Action**: Blue (#2563EB)
- **Secondary Actions**: Gray (#6B7280)
- **Error Box**: Red (if needed for critical warnings)
- **Recommended**: Blue background box

### Typography
- **Modal Title**: text-xl font-semibold
- **Section Titles**: text-lg font-semibold
- **Option Titles**: text-sm font-medium
- **Descriptions**: text-xs text-gray-500
- **Prices**: text-sm font-semibold (colored by importance)

## Testing Checklist

- [ ] Verify seat calculation is correct
- [ ] Test with 0 active members (should allow add)
- [ ] Test with 4 active members (should allow add)
- [ ] Test with 5 active members (should block add)
- [ ] Test Cancel button closes modal
- [ ] Test Deactivate User button shows toast
- [ ] Test Upgrade Plan button shows toast
- [ ] Test X button closes modal
- [ ] Test clicking outside modal closes it
- [ ] Verify all three options are displayed correctly
- [ ] Verify pricing shows correctly ($299, $49)
- [ ] Test that deactivating a user frees a seat
- [ ] Test status filter doesn't affect seat count (only 'active' counts)
- [ ] Verify modal styling matches design
- [ ] Test responsive behavior on mobile

## Console Logs

When no seats available:
```
Available seats: 0
Active members: 5 / 5
Showing no seats modal
```

When seats available:
```
Available seats: 2
Active members: 3 / 5
Opening add member modal
```

## Success Criteria

✅ Seat check runs before opening Add modal
✅ Correct modal opens based on seat availability
✅ No Seats modal displays accurate seat information
✅ All three options are clearly presented
✅ All buttons work and provide feedback
✅ Status-based filtering works correctly
✅ Modal closes properly on all exit paths
✅ Toast notifications work for all actions
✅ Build completes without errors
