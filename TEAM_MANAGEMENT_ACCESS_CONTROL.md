# Team Management - Role-Based Access Control

## Overview
Section 11 (Team Management) implements strict role-based access control, ensuring only Admin users can view and manage team settings.

## Access Rules

### Admin Role
✅ **Section 11 VISIBLE in sidebar**
✅ **Can access all features**
✅ **Full read/write permissions**

Access includes:
- View all team members
- Add/edit/remove team members
- Manage roles and permissions
- View audit logs
- Configure team capacity
- Export user data
- Manage billing and seats

### All Other Roles (CEO, VP, Manager, Rep, Analyst, Support)
❌ **Section 11 HIDDEN from sidebar**
❌ **Cannot access `/settings/team-management`**
❌ **Redirect with 403 Forbidden page**

Blocked roles:
- Sales
- Manager
- HR
- Any non-Admin role

## Implementation Details

### 1. Sidebar Visibility Control

**File**: `/src/pages/CRM/CRMSettings.tsx`

```typescript
// Section definition with adminOnly flag
{
  id: 'team',
  label: 'TEAM MANAGEMENT',
  icon: <Users className="h-4 w-4" />,
  subsections: [],
  adminOnly: true  // <-- This flag controls visibility
}

// Filter sections based on user role
const sections = allSections.filter(section => {
  if (section.adminOnly) {
    return user?.role === 'Admin';
  }
  return true;
});
```

**Behavior**:
- If user role is NOT 'Admin', the Team Management section is completely removed from the sidebar
- Section count adjusts automatically (shows 10 sections instead of 11)
- No visual indicator that the section exists for non-admin users

### 2. Page-Level Access Control

**File**: `/src/pages/CRM/CRMSettings/TeamManagement.tsx`

```typescript
import { useAuth } from '../../../contexts/AuthContext';
import ForbiddenAccess from '../../../components/common/ForbiddenAccess';

const TeamManagement: React.FC = () => {
  const { user } = useAuth();

  // Check if user is Admin
  if (!user || user.role !== 'Admin') {
    return (
      <ForbiddenAccess
        title="403 - Access Forbidden"
        message="Team Management settings are only accessible to Admin users. Contact your system administrator for access."
        returnPath="/settings"
        returnLabel="Return to Settings"
      />
    );
  }

  // Rest of component only renders for Admin users
  // ...
};
```

**Behavior**:
- Checks user role on component mount
- If not Admin, immediately renders 403 Forbidden page
- If Admin, renders full Team Management interface
- Re-checks on every render (protects against role changes mid-session)

### 3. 403 Forbidden Page

**File**: `/src/components/common/ForbiddenAccess.tsx`

**Features**:
- Red shield icon with warning
- Clear "403 - Access Forbidden" title
- Customizable message
- "Return to Settings" button
- Additional help text
- Centered, responsive layout

**Props**:
```typescript
interface ForbiddenAccessProps {
  message?: string;      // Custom error message
  title?: string;        // Custom title
  returnPath?: string;   // Where to navigate on button click
  returnLabel?: string;  // Button text
}
```

**Default Message**:
"Team Management settings are only accessible to Admin users. Contact your system administrator for access."

## Testing Scenarios

### Scenario 1: Admin User Access
**Test**: Login as Admin user → Navigate to Settings
**Expected**:
- ✅ "TEAM MANAGEMENT" section visible in left sidebar
- ✅ Clicking section loads team management interface
- ✅ All features accessible
- ✅ Shows 11 sections total

### Scenario 2: Non-Admin Sidebar Check
**Test**: Login as Sales/Manager/HR user → Navigate to Settings
**Expected**:
- ✅ "TEAM MANAGEMENT" section NOT visible in sidebar
- ✅ Shows only 10 sections (Account through Custom Fields)
- ✅ No indication that Section 11 exists
- ✅ Last visible section is "CUSTOM FIELDS"

### Scenario 3: Direct URL Access (Non-Admin)
**Test**: Login as non-Admin → Navigate directly to `/settings/team-management`
**Expected**:
- ✅ 403 Forbidden page displayed
- ✅ Red shield icon visible
- ✅ Error message explains admin-only access
- ✅ "Return to Settings" button present
- ✅ Clicking button navigates to `/settings`

### Scenario 4: Direct URL Access (Admin)
**Test**: Login as Admin → Navigate directly to `/settings/team-management`
**Expected**:
- ✅ Team Management page loads normally
- ✅ All data visible
- ✅ All features functional

### Scenario 5: Role Change Mid-Session
**Test**: Login as Admin → Navigate to Team Management → Role changed to Sales (simulated)
**Expected**:
- ✅ Next render shows 403 Forbidden page
- ✅ User can return to Settings
- ✅ Section no longer visible in sidebar

### Scenario 6: Null/Undefined User
**Test**: No authenticated user → Navigate to `/settings/team-management`
**Expected**:
- ✅ 403 Forbidden page displayed
- ✅ Same behavior as non-admin user

## Security Considerations

### 1. Client-Side Protection
- Sidebar filtering prevents accidental navigation
- Page-level checks prevent unauthorized viewing
- 403 page provides clear feedback

### 2. Defense in Depth
- **Level 1**: Sidebar - Section hidden from non-admins
- **Level 2**: Component - Checks role before rendering content
- **Level 3**: (Recommended) Backend - Server-side validation of API calls

### 3. Backend Integration (Recommended)
When implementing backend APIs for team management:

```typescript
// Example backend middleware
function requireAdmin(req, res, next) {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  next();
}

// Apply to team management routes
app.get('/api/team/members', requireAdmin, getTeamMembers);
app.post('/api/team/members', requireAdmin, addTeamMember);
app.put('/api/team/members/:id', requireAdmin, updateTeamMember);
app.delete('/api/team/members/:id', requireAdmin, deleteTeamMember);
```

## Role Hierarchy

Current system supports these roles:
1. **Admin** - Full system access (including Team Management)
2. **Manager** - Access to most features, NO team management
3. **Sales** - CRM and lead generation, NO team management
4. **HR** - HRMS and analytics, NO team management

**Team Management Access**:
- ✅ Admin: Yes
- ❌ Manager: No
- ❌ Sales: No
- ❌ HR: No
- ❌ Any other role: No

## Mock Data Updates

### Team Capacity (Correct Values)
```typescript
{
  activeMembers: 3,              // Updated from 10
  inactiveMembers: 0,            // Updated from 1
  pendingInvites: 0,             // Updated from 1
  availableSeats: 2,             // Updated from 8
  totalCapacity: 5,              // Updated from 20
  plan: 'Professional',
  planTier: '2 of 4',
  costPerSeat: 49,
  monthlyCost: 147,              // 3 seats × $49
  nextBillingDate: 'Jan 1, 2025',
  planRenewal: 'Annual',
  autoSyncStatus: 'Enabled',
  lastSync: 'Dec 13, 2024 at 2:00 PM PST',
  nextSync: 'Continuous (real-time)',
  upgradeOptions: {
    business: { seats: 15, price: '$299/month' },
    enterprise: { seats: 'Unlimited', price: 'Custom pricing' }
  }
}
```

## User Experience

### For Admin Users:
1. See "TEAM MANAGEMENT" in settings sidebar
2. Click to access full team management interface
3. View/edit all team members and settings
4. Seamless experience, no access barriers

### For Non-Admin Users:
1. Navigate to Settings
2. See 10 sections (Account through Custom Fields)
3. No indication Team Management exists
4. If they somehow get the URL:
   - See professional 403 page
   - Clear explanation
   - Easy way to return to Settings

## Error Messages

### 403 Forbidden Page
**Title**: `403 - Access Forbidden`

**Message**:
"Team Management settings are only accessible to Admin users. Contact your system administrator for access."

**Additional Help**:
"If you believe you should have access to this page, please contact your system administrator."

**Action Button**: `Return to Settings` → Navigates to `/settings`

## Files Modified

1. **`/src/utils/teamManagementMockData.ts`**
   - Updated TeamCapacity interface
   - Added new billing and plan properties
   - Adjusted capacity values (5 total, 3 active)

2. **`/src/pages/CRM/CRMSettings/TeamManagement.tsx`**
   - Added useAuth hook
   - Added role check at component entry
   - Renders ForbiddenAccess for non-admin users
   - Updated capacity display with new fields

3. **`/src/pages/CRM/CRMSettings.tsx`**
   - Added useAuth hook
   - Added `adminOnly` flag to SettingsSection type
   - Marked team section as `adminOnly: true`
   - Filter sections based on user role

4. **`/src/components/common/ForbiddenAccess.tsx`** (NEW)
   - Reusable 403 component
   - Customizable message and navigation
   - Professional, centered layout

## Quick Test Commands

### Test as Admin (Default)
1. Login (default user is Admin)
2. Navigate to: CRM → ⋮ → CRM Settings
3. Verify: "TEAM MANAGEMENT" visible at bottom of sidebar
4. Click: Team Management
5. Verify: Full interface loads

### Test as Non-Admin (Simulated)
1. Modify AuthContext to set role to 'Sales'
2. Navigate to: CRM → ⋮ → CRM Settings
3. Verify: "TEAM MANAGEMENT" NOT visible
4. Navigate to: `/settings/team-management` directly
5. Verify: 403 Forbidden page shows
6. Click: "Return to Settings"
7. Verify: Navigates back to Settings page

## Future Enhancements

### Phase 2 Features (Protected)
When these features are added, they'll automatically be protected:
- Role permission editor
- User group management
- Advanced audit logs
- Bulk user operations
- SAML/SSO configuration
- API token management

### Additional Role Granularity
Could add more specific permissions:
- `can_view_team` - View only, no edit
- `can_manage_own_team` - Managers manage their reports only
- `can_configure_roles` - Role configuration separate from user management

### Activity Logging
Track access attempts:
- Log when non-admin tries to access team management
- Alert admins of suspicious access patterns
- Audit trail of all team management changes

## Best Practices

1. **Always check role at component entry**
   - Don't rely on sidebar filtering alone
   - Component-level protection is essential

2. **Provide clear feedback**
   - 403 page explains why access denied
   - Offers path forward (contact admin)
   - Easy navigation back to allowed areas

3. **Test with all roles**
   - Admin should see section
   - All other roles should not
   - Direct URL access should be blocked

4. **Keep it simple**
   - Binary access (admin vs non-admin)
   - No partial permissions (for now)
   - Clear, predictable behavior

## Support & Troubleshooting

### Issue: Admin user doesn't see Team Management
**Solution**:
- Check AuthContext - user.role must be exactly 'Admin'
- Verify no typos in role comparison
- Check browser console for errors

### Issue: Non-admin user sees 403 but should have access
**Solution**:
- Verify user.role is set correctly in AuthContext
- Check if role changed mid-session
- Confirm admin role assignment in backend

### Issue: Section visible but clicking shows 403
**Solution**:
- Sidebar filter not working correctly
- Check sections array filtering logic
- Verify user object exists and has role property

## Summary

Team Management (Section 11) is now fully protected with:
- ✅ Sidebar visibility control (hidden from non-admins)
- ✅ Page-level access control (403 for unauthorized users)
- ✅ Professional 403 Forbidden page
- ✅ Clear error messaging
- ✅ Easy navigation back to Settings
- ✅ Updated team capacity data
- ✅ Build successful, no errors

Only Admin users can view and manage team settings. All other roles are completely blocked from accessing this section.
