# Permission Assignment Matrix - User Guide

## Overview

The Permission Assignment Matrix is a powerful, interactive tool for managing granular permissions across roles and modules in BMI. It provides a spreadsheet-like interface where administrators can efficiently assign, review, and modify permissions with visual feedback and conflict detection.

## Accessing the Matrix

1. Navigate to **Settings** from the main menu
2. Click on **Permission Matrix** card (marked with "New" badge)
3. The matrix interface opens with full-screen layout

## Interface Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Permission Matrix            [🔥 5 Conflicts] [Bulk] [Sets] [Save] │
├────────────────────────────────────────────────────────────────────┤
│ [Search...] [Category ▼] [Export]                                  │
├────────────────────────────────────────────────────────────────────┤
│        │  Leads Module          │  Deals Module                    │
│ Role   │  R  W  D  E  I  H     │  R  W  D  E  I  H               │
├────────┼──────────────────────────────────────────────────────────┤
│ Admin  │  ✓  ✓  ✓  ✓  ✓  □     │  ✓  ✓  ✓  ✓  ✓  □              │
│ Sales  │  ✓  ✓  □  ✓  □  □     │  ✓  ✓  □  ✓  □  □              │
│ View   │  ✓  □  □  □  □  □     │  ✓  □  □  □  □  □              │
└────────┴──────────────────────────────────────────────────────────┘
```

**Legend:**
- **R** = Read
- **W** = Write
- **D** = Delete
- **E** = Export
- **I** = Import
- **H** = Hide

## Key Features

### 1. Interactive Permission Grid

**Table Structure:**
- **Rows**: System roles (Admin, Sales Manager, Sales Rep, etc.)
- **Columns**: Modules grouped by category (CRM, Productivity, etc.)
- **Cells**: Checkbox controls for each permission type

**Sticky Headers:**
- Row headers (roles) stick to the left when scrolling horizontally
- Column headers (modules) stick to the top when scrolling vertically
- Always maintain context while navigating large matrices

### 2. Granular Permission Controls

**Module-Level Permissions:**
Click the checkbox in a module header to apply permission to the entire module and all its fields.

**Three-State Checkboxes:**
- ✓ **All**: All fields have this permission
- ▬ **Some**: Some fields have this permission
- ☐ **None**: No fields have this permission

**Field-Level Permissions:**
Click the expand icon (▼) next to a module name to reveal individual field permissions.

```
Module: Leads
├─ Name       [✓] [✓] [☐] [✓] [☐] [☐]
├─ Email      [✓] [✓] [☐] [✓] [☐] [☐]
├─ Phone      [✓] [☐] [☐] [☐] [☐] [☐]
└─ Score      [✓] [☐] [☐] [☐] [☐] [✓]
```

### 3. Bulk Assignment Mode

**Activating Bulk Mode:**
1. Click the **"Bulk Mode"** button in the header
2. The button turns blue to indicate active mode
3. Checkboxes appear next to roles and modules

**Using Bulk Mode:**
1. **Select Roles**: Check roles you want to modify
2. **Select Modules**: Check modules to apply changes to
3. **Apply Permissions**: Click quick action buttons (✓ read, ✓ write, etc.)
4. **Instant Application**: All selected combinations receive the permission

**Example:**
- Select: Sales Manager, Sales Rep (2 roles)
- Select: Leads, Contacts (2 modules)
- Click: ✓ read
- Result: 4 permission assignments (2 roles × 2 modules)

**Exiting Bulk Mode:**
Click "Exit Bulk Mode" or the Bulk Mode button again.

### 4. Search and Filtering

**Search Box:**
- Search by role name or module name
- Real-time filtering as you type
- Shows only matching rows and columns
- Clear search to restore full view

**Category Filter:**
- Dropdown menu with module categories
- Options: All Categories, CRM, Productivity, etc.
- Filters columns to show only selected category
- Works in combination with search

**Export Function:**
- Download current matrix as CSV/Excel
- Includes all permissions for backup
- Useful for compliance reporting

### 5. Conflict Detection & Resolution

**Automatic Conflict Detection:**
The system continuously monitors for permission conflicts:

**Conflict Types:**

1. **Inherited Override**
   - Child role has permission parent doesn't
   - Warning: May bypass security hierarchy
   - Shown with amber badge

2. **Missing Dependency**
   - Write permission without read permission
   - Delete permission without write permission
   - Shown with red badge

3. **Inconsistent Field Permissions**
   - Some fields accessible, others hidden
   - May confuse users
   - Shown with yellow badge

**Viewing Conflicts:**
1. Click the conflict badge in header (e.g., "5 Conflicts")
2. Opens conflict panel in sidebar
3. Each conflict shows:
   - Role name
   - Module and field affected
   - Conflict type and description
   - Suggested resolution

**Resolving Conflicts:**
- Click on conflict to jump to affected cell
- Adjust permissions to resolve
- Conflict disappears when resolved

### 6. Permission Sets

**What are Permission Sets?**
Reusable templates that bundle multiple permissions together for quick application.

**Creating a Permission Set:**
1. Configure permissions in the matrix
2. Click "Permission Sets" button in header
3. Click "Create Permission Set"
4. Name the set (e.g., "Sales Team Standard")
5. Add description
6. Save as template

**Applying Permission Sets:**
1. Open Permission Sets sidebar
2. Browse available sets
3. Click "Apply" on desired set
4. Permissions are applied to matrix
5. Review and save changes

**Managing Permission Sets:**
- **Edit**: Modify set configuration
- **Clone**: Duplicate for variations
- **Delete**: Remove unused sets
- **Template Badge**: Indicates reusable sets

**Common Permission Sets:**
- **Read-Only Access**: View permissions only
- **Standard User**: Read and write, no delete
- **Power User**: All except import/export
- **Administrator**: Full access to all

### 7. Sidebar Views

The sidebar has three tabs:

**Permission Sets Tab:**
- Browse and manage saved sets
- Create new sets
- Apply sets to matrix
- View set details

**Conflicts Tab:**
- Live conflict monitoring
- Detailed conflict descriptions
- Quick navigation to issues
- Resolution suggestions

**Help Tab:**
- Permission type definitions
- Keyboard shortcuts reference
- Usage tips and best practices
- Quick help information

### 8. Unsaved Changes Tracking

**Change Detection:**
- System tracks all modifications
- Blue badge shows "Unsaved changes"
- Warning if navigating away
- Prevents accidental data loss

**Save Options:**
- **Save Changes**: Commits all modifications to database
- **Discard**: Reverts to last saved state
- **Auto-save**: Optional background saving (planned)

## Permission Types Explained

### Read
**What it does:** View records and their data
**Common use:** All users who need visibility
**Example:** Sales rep can view all leads

### Write
**What it does:** Create new records and edit existing ones
**Requires:** Usually requires Read permission
**Common use:** Users who manage data
**Example:** Sales rep can update lead status

### Delete
**What it does:** Permanently remove records
**Requires:** Usually requires Write permission
**Common use:** Managers and administrators only
**Example:** Sales manager can delete duplicate leads
**⚠️ Use cautiously:** Cannot be undone

### Export
**What it does:** Download data to external files (CSV, Excel)
**Common use:** Reports and data analysis
**Example:** Manager exports monthly sales data
**⚠️ Security:** May expose sensitive information

### Import
**What it does:** Upload data from external files
**Requires:** Usually requires Write permission
**Common use:** Data migration and bulk updates
**Example:** Admin imports new leads from trade show
**⚠️ Data integrity:** Can overwrite existing data

### Hide
**What it does:** Makes fields invisible to role
**Common use:** Sensitive information protection
**Example:** Hide salary field from non-HR users
**Note:** User never sees the field exists

## Workflows

### Setting Up a New Role

1. **Create the Role**
   - Go to Roles & Permissions section first
   - Create role with proper hierarchy

2. **Open Permission Matrix**
   - Navigate to Permission Matrix
   - Locate the new role row

3. **Start with Base Permissions**
   - Enable Read for essential modules
   - Test with a user account

4. **Add Specific Permissions**
   - Expand modules for field-level control
   - Add Write where needed
   - Carefully consider Delete permissions

5. **Review Conflicts**
   - Check conflict panel
   - Resolve any warnings
   - Verify inheritance is correct

6. **Save and Test**
   - Save all changes
   - Log in as test user
   - Verify access levels

### Bulk Permission Update

1. **Enable Bulk Mode**
   - Click "Bulk Mode" button
   - Interface shows checkboxes

2. **Select Targets**
   - Check all relevant roles
   - Check all relevant modules

3. **Apply Changes**
   - Click permission type buttons
   - Or use remove buttons for revocation

4. **Review Changes**
   - Scroll through affected areas
   - Verify expected changes
   - Check for unintended effects

5. **Save Changes**
   - Click "Save Changes"
   - Monitor for errors

### Cloning Permissions Between Roles

1. **Method 1: Permission Sets**
   - Select source role's permissions
   - Create permission set
   - Apply to target role

2. **Method 2: Manual Copy**
   - Open source role in RolesManagement
   - Use Clone feature
   - Adjust in Permission Matrix

3. **Method 3: Bulk Mode**
   - Enable bulk mode
   - Select source role
   - Copy relevant modules
   - Select target role
   - Apply same permissions

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save changes |
| `Ctrl/Cmd + F` | Focus search box |
| `Ctrl/Cmd + B` | Toggle bulk mode |
| `Ctrl/Cmd + Z` | Undo last change (planned) |
| `Esc` | Exit bulk mode / Close sidebar |
| `Tab` | Navigate cells |
| `Space` | Toggle checkbox |
| `←→↑↓` | Navigate matrix |

## Best Practices

### Security

1. **Principle of Least Privilege**
   - Start with minimal permissions
   - Add only what's necessary
   - Regularly audit and remove unused

2. **Role Hierarchy**
   - Respect organizational structure
   - Child roles should not exceed parent
   - Monitor override conflicts

3. **Sensitive Data**
   - Use Hide for confidential fields
   - Limit Export permissions
   - Restrict Delete to management

4. **Regular Audits**
   - Review permissions quarterly
   - Check for orphaned permissions
   - Update as roles evolve

### Efficiency

1. **Use Permission Sets**
   - Create templates for common patterns
   - Reduces setup time for new roles
   - Ensures consistency

2. **Leverage Bulk Mode**
   - For company-wide changes
   - When adding new modules
   - During restructuring

3. **Expand Only When Needed**
   - Keep modules collapsed for overview
   - Expand for field-level precision
   - Collapse when done

4. **Search Effectively**
   - Use search for quick access
   - Combine with category filter
   - Clear filters after use

### Documentation

1. **Name Permission Sets Clearly**
   - Descriptive names (not "Set 1")
   - Include purpose in description
   - Date major template changes

2. **Comment on Exceptions**
   - Note why overrides exist
   - Document special cases
   - Explain conflict resolutions

3. **Keep Records**
   - Export matrix periodically
   - Save permission set configurations
   - Track major changes in audit log

## Troubleshooting

### Issue: Permissions not saving
**Solution:**
- Check internet connection
- Verify user has admin privileges
- Check browser console for errors
- Try refreshing and re-applying

### Issue: Too many conflicts
**Solution:**
- Review role hierarchy structure
- Consolidate overlapping roles
- Use permission inheritance properly
- Consider role restructuring

### Issue: Performance slow with large matrix
**Solution:**
- Use search to limit visible rows/columns
- Filter by category
- Close field expansions when done
- Consider splitting into smaller matrices

### Issue: Bulk mode not selecting all
**Solution:**
- Check search filters are cleared
- Verify category filter is "All"
- Try exiting and re-entering bulk mode
- Manually verify selections

### Issue: Can't see certain modules
**Solution:**
- Check category filter setting
- Clear search query
- Verify modules exist in system
- Check your own permission level

## Advanced Features

### Field-Level Granularity

**Use Cases:**
- Hide salary from non-HR
- Prevent editing of system fields
- Allow viewing but not exporting sensitive data

**Implementation:**
1. Expand module in matrix
2. Configure each field independently
3. Test with user account
4. Document exceptions

### Conditional Permissions (Planned)

Future feature allowing permissions based on:
- Record ownership
- Field values
- Time-based access
- Custom logic

### Permission Analytics (Planned)

Future dashboards showing:
- Most/least restrictive roles
- Permission usage statistics
- Access pattern analysis
- Compliance reporting

## Integration

### With Role Hierarchy
- Matrix respects role parent/child relationships
- Inheritance shown in conflict detection
- Overrides highlighted automatically

### With Audit Logs
- All permission changes logged
- Who made changes and when
- Before/after states tracked
- Compliance trail maintained

### With User Management
- Permissions apply immediately to users
- No logout/login required
- Changes reflected in real-time
- User sessions updated automatically

## Support & Resources

- **Full Documentation**: See `PERMISSION_MATRIX_GUIDE.md`
- **Role Management**: See `ROLES_MANAGEMENT_GUIDE.md`
- **Permission Model**: See `PERMISSION_MODEL_GUIDE.md`
- **API Reference**: See `API_DOCUMENTATION.md`

## Glossary

- **Matrix**: The grid showing roles × modules
- **Cell**: Individual permission checkbox
- **Bulk Mode**: Multi-select mode for efficiency
- **Permission Set**: Reusable permission template
- **Conflict**: Inconsistency in permission hierarchy
- **Field-Level**: Granular control per database field
- **Module-Level**: Broad control for entire module
- **Sticky Header**: Headers that remain visible while scrolling

---

**Version**: 1.0.0
**Last Updated**: October 2025
**Module**: Settings > Permission Matrix
