# Roles Management - Quick Start Guide

## Accessing the Module

1. Navigate to **Settings** from the main menu
2. Click on **Roles & Permissions** card
3. The Roles Management interface opens with sidebar tree and details panel

## Interface Overview

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Settings                                           │
├──────────────┬──────────────────────────────────────────────┤
│   SIDEBAR    │           DETAILS PANEL                       │
│   (Roles     │                                               │
│    Tree)     │    • Role name & description                  │
│              │    • Metadata (created, modified)             │
│  [Search]    │    • Permissions summary                      │
│              │    • Inheritance path                         │
│  📁 Role 1   │    • Child roles list                         │
│   └─ Role 2  │                                               │
│   └─ Role 3  │    [Edit] [Clone] [Delete]                    │
│  📁 Role 4   │                                               │
│              │                                               │
└──────────────┴──────────────────────────────────────────────┘
```

## Common Tasks

### Create a New Top-Level Role
1. Click **+** button in sidebar header
2. Enter role name (required)
3. Add description (optional)
4. Click **Create Role**

### Create a Child Role
1. Hover over parent role in tree
2. Click **+** icon that appears
3. Enter role details
4. Click **Create Role**

### Edit a Role
1. Click role in tree to select
2. Click **Edit** button
3. Modify fields
4. Click **Save** or **Cancel**

### Clone a Role
1. Select role to clone
2. Click **Clone** button
3. Confirm in modal
4. Edit the cloned role as needed

### Delete a Role
1. Select role to delete
2. Click **Delete** button
3. Confirm deletion (if no children)

### Move a Role (Drag & Drop)
1. Click and hold on role
2. Drag to new parent role
3. Release to drop
4. System updates hierarchy automatically

### Search for Roles
1. Type in search box at top of sidebar
2. Tree auto-filters to matches
3. Clear search to see all roles

## Visual Indicators

| Indicator | Meaning |
|-----------|---------|
| 🛡️ Shield icon | Role entry |
| **L1, L2, L3** | Hierarchy level |
| 🟢 Green badge | Permission count |
| ⚠️ Amber icon | Conflict warning |
| 🟣 Purple badge | System role |
| 🟢 Active badge | Role is active |
| ⚪ Inactive badge | Role is inactive |

## Quick Actions

| Action | Location | Shortcut |
|--------|----------|----------|
| Create top-level role | Sidebar header + | - |
| Create child role | Hover over parent | + icon |
| Expand/collapse | Tree node | ▼/▶ icon |
| Select role | Click in tree | Click |
| Edit role | Details panel | Edit button |
| Clone role | Details panel | Clone button |
| Delete role | Details panel | Delete button |

## Permissions Summary

When viewing a role, the permissions section shows:

- **Direct**: Permissions assigned to this role only
- **Inherited**: Permissions from parent roles
- **Total**: Combined permissions (Direct + Inherited)

Toggle **Show Details** to see the full inheritance path.

## Safety Features

✅ **Cycle Prevention**: Cannot create circular hierarchies
✅ **Child Protection**: Cannot delete roles with children
✅ **System Lock**: System roles cannot be edited/deleted
✅ **Confirmation**: Modals confirm destructive actions

## Tips

💡 **Use Search**: For large hierarchies, search is faster than scrolling
💡 **Clone Templates**: Create template roles and clone for consistency
💡 **Check Inheritance**: Use "Show Details" to understand permission flow
💡 **Name Consistently**: Use naming patterns for easy identification
💡 **Document Well**: Add descriptions to help others understand roles

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Navigate between elements |
| Enter | Submit form/confirm |
| Escape | Close modal/cancel |
| Arrow keys | Navigate tree (planned) |

## Troubleshooting

### Can't see my role
- Check search filter (clear it)
- Expand parent roles
- Verify role exists in database

### Can't move a role
- Check if it would create a cycle
- Verify you have permissions
- Ensure it's not a system role

### Can't delete a role
- Check if role has children
- Verify it's not a system role
- Ensure you have permissions

### Changes not saving
- Check internet connection
- Verify database access
- Check console for errors

## Need Help?

- See full guide: `ROLES_MANAGEMENT_GUIDE.md`
- Check API documentation: `API_DOCUMENTATION.md`
- Review permission model: `PERMISSION_MODEL_GUIDE.md`
- Contact system administrator

---

**Version**: 1.0.0
**Last Updated**: October 2025
**Module**: Settings > Roles & Permissions
