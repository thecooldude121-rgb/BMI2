# Section 11 - Team Management Quick Reference Card

## Access Summary

| User Role | Sidebar Visible? | Can Access Page? | What They See |
|-----------|------------------|------------------|---------------|
| **Admin** | ✅ Yes | ✅ Yes | Full team management interface |
| **Manager** | ❌ No | ❌ No (403) | Hidden completely |
| **Sales** | ❌ No | ❌ No (403) | Hidden completely |
| **HR** | ❌ No | ❌ No (403) | Hidden completely |
| **Any Other** | ❌ No | ❌ No (403) | Hidden completely |

## Team Capacity (Current)

```
Plan: Professional (Tier 2 of 4)
Total Capacity: 5 users
Active Members: 3 users
Available Seats: 2 seats
Utilization: 60%
Cost per Seat: $49/month
Monthly Cost: $147 (3 × $49)
Next Billing: Jan 1, 2025 (Annual)
```

## Quick Test (2 Minutes)

### Test 1: Admin Access
1. Login (default user is Admin)
2. CRM → ⋮ → CRM Settings
3. ✅ See "TEAM MANAGEMENT" at bottom
4. Click it
5. ✅ Page loads with all data

### Test 2: Non-Admin (Simulate)
1. Change role to 'Sales' in AuthContext
2. Navigate to Settings
3. ✅ "TEAM MANAGEMENT" NOT visible
4. Type URL: `/settings/team-management`
5. ✅ See 403 Forbidden page
6. ✅ "Return to Settings" button works

## File Locations

**Access Control Logic**:
- `/src/pages/CRM/CRMSettings.tsx` - Sidebar filtering
- `/src/pages/CRM/CRMSettings/TeamManagement.tsx` - Page protection
- `/src/components/common/ForbiddenAccess.tsx` - 403 component

**Data**:
- `/src/utils/teamManagementMockData.ts` - Mock data (updated capacity)

**Documentation**:
- `TEAM_MANAGEMENT_ACCESS_CONTROL.md` - Full details
- `SECTION_11_IMPLEMENTATION_SUMMARY.md` - Implementation notes
- `SECTION_11_QUICK_REFERENCE.md` - This file

## Key Code Snippets

### Sidebar Filter (CRMSettings.tsx)
```typescript
// Only show admin-only sections to Admin users
const sections = allSections.filter(section => {
  if (section.adminOnly) {
    return user?.role === 'Admin';
  }
  return true;
});
```

### Page Protection (TeamManagement.tsx)
```typescript
const { user } = useAuth();

// Check if user is Admin
if (!user || user.role !== 'Admin') {
  return <ForbiddenAccess />;
}
```

## Build Status

✅ **Build**: Successful
✅ **TypeScript**: No errors
✅ **Components**: All functional
✅ **Routes**: Protected correctly

## Support

**Issue**: Admin doesn't see section
**Fix**: Verify `user.role === 'Admin'` (case-sensitive)

**Issue**: Non-admin sees section
**Fix**: Check sidebar filtering logic

**Issue**: 403 not showing
**Fix**: Verify role check in TeamManagement.tsx

## Remember

- Only Admin can see/access Section 11
- All other roles: completely hidden
- Direct URL access → 403 Forbidden
- Client-side protection (add server-side for production)

---

✅ Implementation Complete | Ready for Testing
