# Direct Reports - Role Visibility Matrix

## Quick Reference Card

### 📊 Access Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DIRECT REPORTS VISIBILITY MATRIX                      │
├──────────┬────────────┬───────────────────────────────────────────────────┤
│   ROLE   │   ACCESS   │              WHAT THEY SEE/DO                     │
├──────────┼────────────┼───────────────────────────────────────────────────┤
│   CEO    │ ✅ FULL    │ • View all direct reports                        │
│          │            │ • Schedule meetings (Email, Call, 1-on-1)        │
│          │            │ • View team stats & coaching alerts              │
│          │            │ • Full access to all data                        │
├──────────┼────────────┼───────────────────────────────────────────────────┤
│    VP    │ ✅ FULL    │ • View direct reports                            │
│          │            │ • Schedule meetings (Email, Call, 1-on-1)        │
│          │            │ • View team stats & performance data             │
│          │            │ • Department-level visibility                    │
├──────────┼────────────┼───────────────────────────────────────────────────┤
│ Manager  │ ✅ FULL    │ • View own direct reports                        │
│          │            │ • Schedule meetings (Email, Call, 1-on-1)        │
│          │            │ • Edit coaching notes                            │
│          │            │ • Full team management                           │
├──────────┼────────────┼───────────────────────────────────────────────────┤
│  Admin   │ ⚠️ READ    │ • View direct reports (read-only)               │
│          │   ONLY     │ • View team stats                                │
│          │            │ • NO action buttons (no Email/Call/1-on-1)       │
│          │            │ • For system monitoring only                     │
├──────────┼────────────┼───────────────────────────────────────────────────┤
│ Analyst  │ ⚠️ READ    │ • View direct reports (read-only)               │
│          │   ONLY     │ • View team stats for analysis                   │
│          │            │ • NO action buttons                              │
│          │            │ • For reporting/analytics only                   │
├──────────┼────────────┼───────────────────────────────────────────────────┤
│   Rep    │ ❌ HIDDEN  │ • Direct Reports section NOT VISIBLE            │
│          │            │ • Only basic profile info                        │
│          │            │ • No team structure visibility                   │
│          │            │ • Maintains hierarchy boundaries                 │
├──────────┼────────────┼───────────────────────────────────────────────────┤
│ Support  │ ❌ NONE    │ • No access to team performance                  │
│          │            │ • Limited profile view only                      │
│          │            │ • No team data visible                           │
└──────────┴────────────┴───────────────────────────────────────────────────┘
```

---

## 🔘 Action Buttons Matrix

```
┌────────────┬──────────────┬──────┬────────────────┬──────────┐
│    ROLE    │ VIEW PROFILE │EMAIL │ SCHEDULE CALL  │  1-ON-1  │
├────────────┼──────────────┼──────┼────────────────┼──────────┤
│    CEO     │      ✅      │  ✅  │       ✅       │    ✅    │
│     VP     │      ✅      │  ✅  │       ✅       │    ✅    │
│  Manager   │      ✅      │  ✅  │       ✅       │    ✅    │
│   Admin    │      ✅      │  ❌  │       ❌       │    ❌    │
│  Analyst   │      ✅      │  ❌  │       ❌       │    ❌    │
│    Rep     │      —       │  —   │       —        │    —     │
│  Support   │      —       │  —   │       —        │    —     │
└────────────┴──────────────┴──────┴────────────────┴──────────┘
```

**Legend:**
- ✅ = Visible & Functional
- ❌ = Hidden (read-only mode)
- — = Section not visible

---

## 🎯 Quick Decision Tree

**"Should I see Direct Reports?"**

```
Are you viewing a Manager's profile?
│
├─ YES → What's your role?
│        │
│        ├─ CEO/VP/Manager → ✅ YES (Full Access)
│        ├─ Admin → ✅ YES (Read-Only)
│        ├─ Analyst → ✅ YES (Read-Only)
│        ├─ Rep → ❌ NO (Hidden)
│        └─ Support → ❌ NO (Hidden)
│
└─ NO → Direct Reports section not applicable
```

---

## 📱 Visual Indicators

### Role Banner Messages

```
┌──────────────────────────────────────────────────────────────┐
│ CEO                                                           │
│ ✅ Can view all direct reports, schedule meetings,           │
│    full access to all data                                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ VP                                                            │
│ ✅ Can view direct reports, schedule meetings,               │
│    view performance data                                     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Manager                                                       │
│ ✅ Viewing own team - Full access to direct reports          │
│    and all actions                                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Admin                                                         │
│ ⚠️ Read-only access - Can view but not schedule 1-on-1s     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Analyst                                                       │
│ ⚠️ Read-only access - Data visibility for analysis only     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Rep                                                           │
│ ❌ Direct Reports section hidden - Reps don't see           │
│    team structure                                            │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Support                                                       │
│ ❌ No access to team performance data                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Shortcuts

### URL
```
http://localhost:5173/team/2
```

### Role Switcher
Use the dropdown at the top of the page:
- CEO (Full Access)
- VP (Full Access)
- Manager (Own Team)
- Rep (No Direct Reports)
- Admin (Read-Only)
- Analyst (Read-Only)
- Support (No Access)

### Expected Views
1. **CEO/VP/Manager:** Full section + all buttons
2. **Admin/Analyst:** Full section + NO action buttons
3. **Rep/Support:** NO section (completely hidden)

---

## 🔍 Verification Points

### ✅ For Full Access Roles (CEO, VP, Manager)
- [ ] Direct Reports section visible
- [ ] "View Team →" button in header
- [ ] Each report card has 3 action buttons
- [ ] Team Rollup Stats section visible
- [ ] Coaching Attention alert visible
- [ ] All buttons are clickable

### ⚠️ For Read-Only Roles (Admin, Analyst)
- [ ] Direct Reports section visible
- [ ] "View Team →" button in header
- [ ] Each report card has ONLY "View Profile" button
- [ ] NO Email/Call/1-on-1 buttons
- [ ] Team Rollup Stats section visible
- [ ] Coaching Attention alert visible

### ❌ For Hidden Roles (Rep, Support)
- [ ] Direct Reports section NOT in DOM
- [ ] No team data visible
- [ ] Only basic profile information shown

---

## 📋 Permission Summary

### What Each Role CAN Do:

**CEO:**
- View all teams across organization
- Schedule meetings with anyone
- Full visibility into performance
- Edit permissions (all data)

**VP:**
- View department teams
- Schedule meetings within department
- Full performance visibility
- Monitor team health

**Manager:**
- View own direct reports
- Schedule 1-on-1s with team
- Edit coaching notes for team
- Full team management

**Admin:**
- View team structure (system monitoring)
- View profiles for user management
- NO people management actions
- NO coaching/scheduling

**Analyst:**
- View team data for reporting
- Access metrics for analysis
- NO actions or editing
- Read-only data access

**Rep:**
- NO team visibility
- Basic profile access only
- Focus on own work

**Support:**
- NO team access
- Limited system access

---

## 🚨 Common Issues

| Issue | Expected Behavior |
|-------|-------------------|
| Rep sees Direct Reports | ❌ BUG - Should be hidden |
| Admin can schedule 1-on-1 | ❌ BUG - Should be read-only |
| Manager can't see section | ❌ BUG - Should have full access |
| Analyst has action buttons | ❌ BUG - Should be read-only |

---

## ✨ Implementation Status

**Status:** ✅ COMPLETE

**Files Modified:**
- `TeamMemberDetailPage.tsx` - Permission logic
- `DirectReportsSection.tsx` - Conditional rendering

**Test Coverage:**
- ✅ All 7 roles tested
- ✅ Action buttons conditional
- ✅ Read-only modes working
- ✅ Section hiding working

---

**Need Help?** See `ROLE_BASED_VISIBILITY_QUICK_TEST.md` for detailed test scenarios.
