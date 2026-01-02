# Screen 9.2 - Role-Based Views Quick Reference
**Quick Testing Guide**

---

## 🎯 QUICK COMPARISON

| Feature | Manager | CEO | VP | Rep | Admin | Analyst | Support |
|---------|---------|-----|-----|-----|-------|---------|---------|
| **Profile Header** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Performance Metrics** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **HRMS Section** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Deals Table** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Contacts Table** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Activity History** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Coaching Notes** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Schedule 1-on-1** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **View Calendar** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Send Email** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Add Note** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Edit Note** | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Delete Note** | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ |

*CEO can only edit/delete own notes, not others'

---

## 🔍 WHAT EACH ROLE SEES

### Manager (Full Access)
```
✅ Everything
✅ All buttons
✅ Full CRUD on notes
```

### CEO (Strategic View)
```
✅ All data sections
✅ Add notes
❌ Schedule 1-on-1 (delegates to manager)
⚠️  Edit own notes only
```

### VP (Department View)
```
✅ All data sections
✅ Add notes for department
❌ Schedule 1-on-1
❌ Edit/delete notes
```

### Rep (Limited View)
```
⚠️  Yellow "Limited View" banner
✅ Basic profile only
✅ Calendar + Email
❌ All performance data
❌ All tables
❌ All notes
```

### Admin (System View)
```
✅ All data sections (read-only)
❌ No coaching actions
❌ No scheduling
💡 Manage users in Settings instead
```

### Analyst (Data View)
```
✅ All data sections (read-only)
❌ No coaching actions
❌ No scheduling
💡 Same as Admin
```

### Support (No Access)
```
🔴 Access Denied Screen
❌ Cannot view any data
💬 "Contact administrator for access"
```

---

## ⚡ 2-MINUTE TEST

1. Go to `/team/2`
2. Switch roles in dropdown:

**Manager:** See everything, all buttons
**CEO:** See all, no "Schedule 1-on-1"
**VP:** See all, no "Schedule", no Edit/Delete
**Rep:** Yellow banner, only header
**Admin:** See all, no action buttons
**Analyst:** Same as Admin
**Support:** Red access denied screen

---

## 🎨 VISUAL INDICATORS

### Yellow Banner (Rep)
```
⚠️ Limited Profile View
Contact your manager for detailed performance information.
```

### Red Screen (Support)
```
🔴 Access Restricted
Team member profiles are not available for Support role.
[Back to Team]
```

---

## 📝 BUTTON VISIBILITY

### Schedule 1-on-1 Button
- ✅ Manager ONLY
- ❌ Everyone else

### Add Note Button
- ✅ Manager, CEO, VP
- ❌ Admin, Analyst, Rep, Support

### Edit/Delete Buttons
- ✅ Manager (all notes)
- ✅ CEO (own notes only - shown but should validate)
- ❌ Everyone else

---

## 🔧 PERMISSION VARIABLES

```typescript
canScheduleMeetings      → Manager only
canAddNotes              → Manager, CEO, VP
canEditNotes             → Manager, CEO
canViewPerformance       → All except Rep, Support
canViewDeals             → All except Rep, Support
canViewContacts          → All except Rep, Support
canViewActivities        → All except Rep, Support
canViewCoachingNotes     → All except Rep, Support
hasLimitedView           → Rep only
hasNoAccess              → Support only
```

---

## ✅ VERIFICATION CHECKLIST

**Manager Role:**
- [ ] Schedule 1-on-1 button visible
- [ ] Add Note button visible
- [ ] Edit buttons on notes
- [ ] Delete buttons on notes
- [ ] All 6 sections visible

**CEO Role:**
- [ ] Schedule 1-on-1 button HIDDEN
- [ ] Add Note button visible
- [ ] Edit/Delete buttons visible
- [ ] All 6 sections visible

**VP Role:**
- [ ] Schedule 1-on-1 button HIDDEN
- [ ] Add Note button visible
- [ ] Edit/Delete buttons HIDDEN
- [ ] All 6 sections visible

**Rep Role:**
- [ ] Yellow banner appears
- [ ] Only header + 2 buttons visible
- [ ] All data sections HIDDEN

**Admin/Analyst Roles:**
- [ ] Schedule 1-on-1 button HIDDEN
- [ ] Add Note button HIDDEN
- [ ] Edit/Delete buttons HIDDEN
- [ ] All 6 sections visible (read-only)

**Support Role:**
- [ ] Access denied screen appears
- [ ] Red alert icon
- [ ] Error message
- [ ] Back button works
- [ ] No data loaded

---

## 🚀 TEST URL

```
http://localhost:5173/team/2
```

Switch roles using the dropdown at the top of the page.

---

**Status:** ✅ All 7 roles implemented and working
**Last Updated:** December 26, 2024
