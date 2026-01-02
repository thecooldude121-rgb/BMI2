# Roles Management Module - User Guide

## Overview

The Roles Management module provides a comprehensive hierarchical role management system with an intuitive tree-based interface, drag-and-drop functionality, and advanced permission tracking. This module enables administrators to create, organize, and manage role hierarchies with visual feedback and safety features.

## Key Features

### 1. Interactive Sidebar Tree
- **Hierarchical Display**: Roles are organized in a collapsible tree structure showing parent-child relationships
- **Visual Indicators**:
  - Shield icons for all roles
  - Hierarchy level badges (L1, L2, etc.)
  - Permission count badges (green)
  - Conflict indicators (amber alert icons)
- **Expand/Collapse**: Click chevron icons to expand or collapse role branches
- **Quick Actions**: Hover over roles to see quick action buttons for creating child roles

### 2. Drag-and-Drop Hierarchy Editing
- **Drag any role** to reposition it under a different parent
- **Cycle Detection**: System automatically prevents circular hierarchies
- **Visual Feedback**: Dragged roles show reduced opacity
- **Automatic Hierarchy Update**: Hierarchy levels update automatically when roles are moved

### 3. Role Details Panel
When a role is selected, the right panel displays:

#### Basic Information
- **Role Name**: Editable in edit mode
- **Description**: Full-text description of the role's purpose
- **Hierarchy Level**: Current position in the hierarchy
- **Status Badges**:
  - System Role (purple) - Cannot be edited or deleted
  - Active/Inactive (green/gray)
  - Parent role name (if applicable)

#### Metadata Section
- **Created Date**: Timestamp when role was created
- **Last Modified**: Last update timestamp
- **Created By**: User ID of creator
- **Role ID**: Unique identifier (truncated for display)

#### Permissions Summary
- **Direct Permissions**: Permissions assigned directly to this role
- **Inherited Permissions**: Permissions inherited from parent roles
- **Total Permissions**: Sum of direct and inherited
- **Conflict Indicators**: Alerts when permissions conflict with inherited ones

#### Permission Inheritance Path
Toggle "Show Details" to view the complete inheritance chain:
- Shows all parent roles in order
- Displays permission count for each parent
- Visualizes the inheritance flow with arrows

#### Child Roles
- Lists all direct child roles
- Click to navigate to any child role
- Shows count and quick navigation

### 4. Role Actions

#### Create Role
**Two ways to create:**
1. **Top-level role**: Click the + button in sidebar header
2. **Child role**: Click the + icon when hovering over a parent role

**Form fields:**
- Role Name (required)
- Description (optional)
- Business Unit (optional)
- Parent role is auto-selected when creating child roles

#### Clone Role
- Creates an exact copy of the selected role
- Copies all permissions and settings
- Maintains same hierarchy level and parent
- Name is automatically appended with "(Copy)"
- Can be edited after creation

#### Edit Role
- Click "Edit" button in role details
- Modify name, description, and other properties
- Click "Save" to apply changes or "Cancel" to discard
- System roles cannot be edited

#### Delete Role
- Click "Delete" button to remove a role
- **Safety checks:**
  - Cannot delete roles with child roles
  - Must reassign or delete children first
  - Confirmation modal with warning
- System roles cannot be deleted

### 5. Search and Filter

**Search functionality:**
- Real-time search as you type
- Searches both role names and descriptions
- Automatically expands matching branches
- Shows only roles matching the search query
- Clear search to restore full tree view

**Visual feedback:**
- Matching roles remain visible
- Parent roles of matches are shown for context
- Tree automatically expands to show results

### 6. Safety Features

#### Cycle Prevention
The system actively prevents circular hierarchies:
- Detects if moving a role would create a loop
- Shows error alert: "Cannot move role: This would create a circular hierarchy"
- Prevents the operation before any changes are made

#### Child Role Protection
- Roles with children cannot be deleted
- Clear error message directs user to reassign children first
- Prevents accidental data loss

#### System Role Protection
- System roles are marked with purple badge
- Edit and Delete buttons are disabled
- Prevents modification of critical system roles

### 7. Visual Design Elements

#### Color-Coded Badges
- **Blue**: Role hierarchy levels
- **Green**: Permission counts (positive indicator)
- **Amber**: Conflicts or warnings
- **Purple**: System roles
- **Gray**: Inactive roles

#### Interactive States
- **Hover**: Shows quick action buttons
- **Selected**: Blue background with left border
- **Dragging**: Reduced opacity (50%)
- **Drop Target**: Can receive dragged roles

#### Responsive Layout
- **Sidebar**: Fixed 320px width with scroll
- **Main Panel**: Flexible width, centers content
- **Modals**: Centered overlays with backdrop
- **Mobile-friendly**: Touch-compatible interactions

### 8. Modals and Confirmations

#### Create Role Modal
- Clean form with clear labels
- Required field indicators (*)
- Parent role shown in blue info box
- Cancel and Create buttons

#### Clone Confirmation
- Shows source role name
- Explains what will be copied
- Blue info box with details
- Cancel and Clone buttons

#### Delete Confirmation
- Red warning box with alert icon
- "Cannot be undone" warning
- Shows if role has children (prevents deletion)
- Cancel and Delete buttons

### 9. Keyboard and Accessibility

**Keyboard Support:**
- Tab through interactive elements
- Enter to submit forms
- Escape to close modals
- Arrow keys for navigation (tree structure)

**Screen Reader Support:**
- Semantic HTML structure
- ARIA labels on buttons
- Descriptive tooltips
- Status announcements

**Focus Management:**
- Clear focus indicators
- Logical tab order
- Modal focus trapping
- Return focus after modal close

## Usage Workflows

### Creating a Department Hierarchy

1. **Create Top-Level Department**
   - Click + in sidebar header
   - Name: "Sales Department"
   - Description: "All sales-related roles"
   - Click "Create Role"

2. **Add Manager Role**
   - Hover over "Sales Department"
   - Click + icon
   - Name: "Sales Manager"
   - Description: "Manages sales team"
   - Click "Create Role"

3. **Add Team Member Role**
   - Hover over "Sales Manager"
   - Click + icon
   - Name: "Sales Representative"
   - Description: "Front-line sales role"
   - Click "Create Role"

Result: Sales Department → Sales Manager → Sales Representative

### Reorganizing Roles

1. **Drag to New Parent**
   - Click and hold on role to move
   - Drag to new parent role
   - Drop to reassign

2. **Verify Changes**
   - Check hierarchy level updated
   - Verify permission inheritance
   - Review child roles if any

### Cloning a Role Template

1. **Select Template Role**
   - Click on role to clone
   - Review its permissions

2. **Clone**
   - Click "Clone" button
   - Confirm in modal
   - New role appears with "(Copy)" suffix

3. **Customize**
   - Click "Edit" on cloned role
   - Update name and description
   - Add/modify permissions as needed

### Finding Roles in Large Hierarchies

1. **Use Search**
   - Type role name in search box
   - Tree auto-expands to matches
   - Click on search result

2. **Navigate Breadcrumbs**
   - View permission inheritance path
   - Click parent roles to navigate up
   - Click child roles to navigate down

## Best Practices

### Hierarchy Design
1. **Keep it Simple**: Aim for 3-5 levels maximum
2. **Logical Grouping**: Group related roles together
3. **Clear Naming**: Use descriptive, consistent names
4. **Document Roles**: Add detailed descriptions

### Permission Management
1. **Inherit First**: Use inheritance before creating overrides
2. **Review Conflicts**: Check for and resolve permission conflicts
3. **Test Changes**: Verify permission changes with test users
4. **Document Exceptions**: Note why overrides exist

### Maintenance
1. **Regular Audits**: Review role hierarchy quarterly
2. **Remove Unused**: Delete or deactivate unused roles
3. **Update Descriptions**: Keep role descriptions current
4. **Monitor Conflicts**: Address permission conflicts promptly

## Technical Details

### Data Structure
```typescript
interface RoleNode {
  id: string;
  name: string;
  description?: string;
  parent_role_id?: string;
  hierarchy_level: number;
  is_system: boolean;
  is_active: boolean;
  permissions: Record<string, any>;
  restrictions: Record<string, any>;
  children: RoleNode[];
  expanded?: boolean;
}
```

### Database Integration
- All changes are immediately saved to Supabase
- Optimistic UI updates with rollback on error
- Real-time data synchronization
- Automatic hierarchy level calculation

### Performance
- Tree rendering optimized for 1000+ roles
- Search operates in O(n) time
- Lazy loading for large hierarchies
- Efficient re-rendering with React state

## Troubleshooting

### Common Issues

**Q: Can't delete a role**
A: Check if role has children. Delete or reassign children first.

**Q: Drag-and-drop not working**
A: Ensure role isn't a system role and cycle detection isn't triggered.

**Q: Permissions not updating**
A: Refresh the page or check console for errors. Verify database connection.

**Q: Search returns no results**
A: Check spelling or try partial name. Ensure roles exist in database.

**Q: Role appears in wrong position**
A: Hierarchy levels may need recalculation. Contact administrator.

## Support

For additional help or to report issues:
1. Check console logs for error messages
2. Verify database connectivity
3. Ensure user has appropriate permissions
4. Contact system administrator

## Future Enhancements

Planned features:
- Bulk role operations
- Role templates library
- Permission conflict auto-resolution
- Advanced search with filters
- Export/import role hierarchies
- Role usage analytics
- Audit trail for changes
