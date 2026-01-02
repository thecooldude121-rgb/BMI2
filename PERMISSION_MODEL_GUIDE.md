# Permission Model Guide

## Overview
Comprehensive guide to the BMI Settings permission and access control system, including inheritance models, best practices, and real-world scenarios.

## Table of Contents
1. [Permission Architecture](#permission-architecture)
2. [Role Hierarchy](#role-hierarchy)
3. [Permission Inheritance](#permission-inheritance)
4. [Field-Level Security](#field-level-security)
5. [Sharing Rules](#sharing-rules)
6. [Conflict Resolution](#conflict-resolution)
7. [Best Practices](#best-practices)
8. [Common Scenarios](#common-scenarios)
9. [Troubleshooting](#troubleshooting)

---

## Permission Architecture

### Core Concepts

#### 1. Roles
Roles define a user's position and base permissions within the organization.

```typescript
interface Role {
  id: string;
  name: string;
  parent_role_id?: string;  // Hierarchical structure
  hierarchy_level: number;   // 0 = highest
  permissions: object;       // Base permissions
}
```

**Example Hierarchy:**
```
CEO (level 0)
  ├── VP Sales (level 1)
  │   ├── Regional Manager (level 2)
  │   │   └── Sales Rep (level 3)
  │   └── Sales Engineer (level 2)
  └── VP Marketing (level 1)
      └── Marketing Manager (level 2)
```

#### 2. Permissions
Granular actions that can be performed on resources.

```typescript
interface Permission {
  id: string;
  code: string;          // e.g., "leads.create"
  category: string;      // e.g., "leads"
  resource_type: string; // e.g., "lead"
}
```

**Permission Types:**
- **Read** - View records
- **Write** - Create/edit records
- **Delete** - Remove records
- **Share** - Share with others
- **Export** - Export data
- **Import** - Import data

#### 3. Profiles
Templates that define default permissions and UI preferences.

```typescript
interface Profile {
  id: string;
  name: string;
  default_role_id: string;
  permission_set_ids: string[];
  default_permissions: object;
}
```

#### 4. Permission Sets
Reusable bundles of permissions that can be assigned to users.

```typescript
interface PermissionSet {
  id: string;
  name: string;
  permissions: object;
}
```

### Permission Layers

Permissions are evaluated in layers, with each layer potentially overriding the previous:

```
1. Profile Permissions (Base layer)
   ↓
2. Role Permissions (Adds to profile)
   ↓
3. Permission Sets (Additional grants)
   ↓
4. Field Permissions (Restricts fields)
   ↓
5. Sharing Rules (Grants access to specific records)
   ↓
6. Temporary Access (Time-limited grants)
```

---

## Role Hierarchy

### Inheritance Rules

#### Rule 1: Upward View Access
Users can view all records owned by users below them in the hierarchy.

```
CEO
├── VP Sales (can view Regional Manager's records)
│   ├── Regional Manager (can view Sales Rep's records)
│   │   └── Sales Rep (can only view own records)
```

#### Rule 2: Permission Inheritance
Child roles inherit all permissions from parent roles.

```typescript
// Parent Role: Sales Manager
permissions: {
  leads: { read: true, write: true, delete: false },
  deals: { read: true, write: false }
}

// Child Role: Sales Rep (inherits + adds)
permissions: {
  leads: { read: true, write: true, delete: false },  // Inherited
  deals: { read: true, write: false },                // Inherited
  tasks: { read: true, write: true }                  // Additional
}
```

#### Rule 3: No Downward Override
Parent permissions cannot be restricted by child roles.

```typescript
// ❌ Invalid: Child cannot reduce parent permissions
Parent: { leads: { read: true, write: true } }
Child:  { leads: { read: true, write: false } }  // Write reverts to true

// ✅ Valid: Child can add permissions
Parent: { leads: { read: true } }
Child:  { leads: { read: true, write: true } }   // Can add write
```

### Hierarchy Best Practices

1. **Keep hierarchy shallow** (3-5 levels max)
2. **Align with organizational structure**
3. **Grant minimal permissions at each level**
4. **Use permission sets for specialized access**
5. **Document hierarchy in org chart**

---

## Permission Inheritance

### Inheritance Model

```
Profile Permissions
      ↓
   Role Base
      ↓
Parent Role Permissions
      ↓
Current Role Permissions
      ↓
Permission Sets
      ↓
Field Restrictions
      ↓
Final Effective Permissions
```

### Calculation Algorithm

```typescript
function calculateEffectivePermissions(user: User): Permissions {
  let permissions = {};

  // 1. Start with profile defaults
  permissions = mergePermissions(permissions, user.profile.default_permissions);

  // 2. Add role hierarchy permissions (bottom-up)
  const roleChain = getRoleHierarchy(user.role_id);
  roleChain.reverse().forEach(role => {
    permissions = mergePermissions(permissions, role.permissions);
  });

  // 3. Add permission sets
  user.permission_sets.forEach(set => {
    permissions = mergePermissions(permissions, set.permissions);
  });

  // 4. Apply field restrictions
  permissions = applyFieldRestrictions(permissions, user.field_permissions);

  return permissions;
}

function mergePermissions(base: object, additional: object): object {
  // Union merge: true values take precedence
  return {
    ...base,
    ...Object.keys(additional).reduce((acc, key) => {
      acc[key] = base[key] || additional[key];
      return acc;
    }, {})
  };
}
```

### Examples

#### Example 1: Simple Inheritance
```typescript
// Profile: Standard User
profile_permissions = {
  leads: { read: true }
}

// Role: Sales Rep
role_permissions = {
  leads: { write: true },
  tasks: { read: true, write: true }
}

// Effective Permissions
effective = {
  leads: { read: true, write: true },        // Merged
  tasks: { read: true, write: true }          // From role
}
```

#### Example 2: Multi-Level Inheritance
```typescript
// Grandparent Role: Sales Director
grandparent = {
  leads: { read: true, write: true, delete: true },
  deals: { read: true, write: true },
  reports: { read: true }
}

// Parent Role: Regional Manager
parent = {
  leads: { read: true, write: true },  // Inherited + explicitly set
  contacts: { read: true, write: true }
}

// Current Role: Team Lead
current = {
  tasks: { read: true, write: true }
}

// Effective (all merged)
effective = {
  leads: { read: true, write: true, delete: true },
  deals: { read: true, write: true },
  reports: { read: true },
  contacts: { read: true, write: true },
  tasks: { read: true, write: true }
}
```

---

## Field-Level Security

### Field Permission Model

Field permissions provide granular control over individual fields within a module.

```typescript
interface FieldPermission {
  role_id: string;
  module_name: string;
  field_name: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}
```

### Field Permission Rules

#### Rule 1: Restrictive Override
Field permissions restrict module permissions.

```typescript
// Module Permission
module: { leads: { read: true, write: true } }

// Field Permission
field: { module: 'leads', field: 'revenue', can_write: false }

// Result: User can read revenue but not edit it
```

#### Rule 2: No Expansion
Field permissions cannot grant more access than module permissions.

```typescript
// Module Permission
module: { leads: { read: true, write: false } }

// Field Permission
field: { module: 'leads', field: 'email', can_write: true }

// Result: can_write ignored (module doesn't allow write)
```

### Sensitive Field Protection

```typescript
// Protect financial fields
const sensitiveFields = [
  { module: 'leads', field: 'revenue', roles: ['sales_rep'] },
  { module: 'deals', field: 'margin', roles: ['sales_rep'] }
];

// Implementation
sensitiveFields.forEach(({ module, field, roles }) => {
  roles.forEach(roleId => {
    setFieldPermission({
      role_id: roleId,
      module_name: module,
      field_name: field,
      can_read: false,
      can_write: false,
      can_delete: false
    });
  });
});
```

### Field Security Best Practices

1. **Identify sensitive fields** (PII, financial, confidential)
2. **Restrict by default**, grant selectively
3. **Use consistent naming** for similar fields
4. **Document field sensitivity levels**
5. **Regular access audits** for sensitive fields

---

## Sharing Rules

### Sharing Rule Types

#### 1. Public Sharing
Everyone can access the records.

```typescript
{
  name: "Public Leads",
  rule_type: "public",
  module_name: "leads",
  access_level: "read"
}
```

#### 2. Private Sharing
Only owner and hierarchy can access.

```typescript
{
  name: "Private Deals",
  rule_type: "private",
  module_name: "deals"
}
```

#### 3. Conditional Sharing
Share based on field criteria.

```typescript
{
  name: "Regional Lead Sharing",
  rule_type: "conditional",
  module_name: "leads",
  share_with_roles: ["regional_manager_west"],
  access_level: "read_write",
  criteria: [
    {
      field_name: "region",
      operator: "equals",
      value: "US-West",
      logical_operator: "AND"
    },
    {
      field_name: "status",
      operator: "not_equals",
      value: "lost",
      logical_operator: "AND"
    }
  ]
}
```

### Criteria Operators

```typescript
const operators = {
  equals: (field, value) => field === value,
  not_equals: (field, value) => field !== value,
  greater_than: (field, value) => field > value,
  less_than: (field, value) => field < value,
  contains: (field, value) => field.includes(value),
  starts_with: (field, value) => field.startsWith(value),
  ends_with: (field, value) => field.endsWith(value),
  in: (field, values) => values.includes(field),
  not_in: (field, values) => !values.includes(field),
  is_null: (field) => field === null,
  is_not_null: (field) => field !== null
};
```

### Logical Operators

```typescript
// AND: All criteria must match
{
  criteria: [
    { field: "region", operator: "equals", value: "West", logical_operator: "AND" },
    { field: "status", operator: "equals", value: "active", logical_operator: "AND" }
  ]
}

// OR: Any criteria can match
{
  criteria: [
    { field: "priority", operator: "equals", value: "high", logical_operator: "OR" },
    { field: "value", operator: "greater_than", value: 100000, logical_operator: "OR" }
  ]
}

// Complex: Mix AND/OR (evaluated left-to-right)
{
  criteria: [
    { field: "region", operator: "equals", value: "West", logical_operator: "AND" },
    { field: "status", operator: "equals", value: "active", logical_operator: "OR" },
    { field: "status", operator: "equals", value: "pending", logical_operator: "AND" },
    { field: "value", operator: "greater_than", value: 50000, logical_operator: "AND" }
  ]
}
// Evaluates as: (region=West AND (status=active OR status=pending) AND value>50000)
```

### Priority-Based Conflict Resolution

When multiple sharing rules apply, priority determines which takes effect.

```typescript
const rules = [
  {
    priority: 10,  // Higher priority
    access_level: "read_write",
    criteria: [{ field: "value", operator: "greater_than", value: 100000 }]
  },
  {
    priority: 5,   // Lower priority
    access_level: "read",
    criteria: [{ field: "region", operator: "equals", value: "West" }]
  }
];

// High-value West region leads: read_write (priority 10 wins)
// Regular West region leads: read (only priority 5 applies)
```

---

## Conflict Resolution

### Resolution Order

1. **Explicit deny** (always wins)
2. **Temporary access** (time-limited grant)
3. **Sharing rules** (by priority)
4. **Permission sets** (additive)
5. **Role permissions** (hierarchical)
6. **Profile permissions** (base layer)

### Conflict Examples

#### Example 1: Field vs Module
```typescript
// Module: Can write to leads
module_permissions = { leads: { write: true } }

// Field: Cannot write revenue field
field_permissions = { module: 'leads', field: 'revenue', can_write: false }

// Result: Can write all fields except revenue
```

#### Example 2: Multiple Sharing Rules
```typescript
// Rule 1 (priority 10)
{ access_level: "read_write", criteria: "value > 100000" }

// Rule 2 (priority 5)
{ access_level: "read", criteria: "region = West" }

// High-value West lead: read_write (Rule 1)
// Low-value West lead: read (Rule 2)
// High-value East lead: read_write (Rule 1)
// Low-value East lead: no access
```

#### Example 3: Temporary Access Override
```typescript
// Base permission
role_permissions = { leads: { delete: false } }

// Temporary access
temporary_access = {
  permissions: { leads: { delete: true } },
  expires_at: "2024-02-01T00:00:00Z"
}

// Result: Can delete until expiry, then reverts to false
```

### Diagnostic Tools

#### Permission Conflict Checker
```typescript
async function checkPermissionConflicts(user_id: string): Promise<Conflict[]> {
  const conflicts = [];

  // Check for redundant permissions
  const userPerms = await getUserEffectivePermissions(user_id);
  const rolePerms = await getRolePermissions(user.role_id);

  // Redundant: User has permission via role AND permission set
  Object.keys(userPerms.permission_sets).forEach(perm => {
    if (rolePerms[perm] === userPerms.permission_sets[perm]) {
      conflicts.push({
        type: 'redundant',
        message: `Permission '${perm}' redundant in permission set`,
        recommendation: 'Remove from permission set'
      });
    }
  });

  // Conflicting field permissions
  const fieldPerms = await getFieldPermissions(user_id);
  fieldPerms.forEach(field => {
    if (field.can_write && !userPerms.modules[field.module_name]?.write) {
      conflicts.push({
        type: 'conflicting',
        message: `Field write permission without module write permission`,
        recommendation: 'Grant module write or remove field write'
      });
    }
  });

  return conflicts;
}
```

---

## Best Practices

### 1. Principle of Least Privilege
Grant only the minimum permissions needed for job function.

```typescript
// ❌ Bad: Over-permissioned
{
  leads: { read: true, write: true, delete: true, share: true, export: true },
  deals: { read: true, write: true, delete: true },
  reports: { read: true, write: true }
}

// ✅ Good: Minimal necessary permissions
{
  leads: { read: true, write: true },
  deals: { read: true },
  reports: { read: true }
}
```

### 2. Use Permission Sets for Specialized Access
Don't modify roles for temporary or specialized needs.

```typescript
// ❌ Bad: Adding one-off permissions to role
role.permissions.special_reports = { read: true };

// ✅ Good: Create permission set
const specialReportAccess = {
  name: "Special Reports Access",
  permissions: { special_reports: { read: true } }
};
assignPermissionSet(user_id, specialReportAccess.id);
```

### 3. Document Permission Rationale
Explain why permissions are granted.

```typescript
{
  role: "Sales Manager",
  permissions: {
    leads: { read: true, write: true, delete: false },
    // Rationale: Managers review all leads but don't delete to preserve history
  },
  deals: { read: true, write: true, delete: true }
  // Rationale: Managers need full deal control for pipeline management
}
```

### 4. Regular Permission Audits
Review permissions quarterly.

```typescript
// Audit checklist
const auditTasks = [
  'Review role hierarchy alignment with org chart',
  'Check for unused permission sets',
  'Identify users with excessive permissions',
  'Verify sensitive field restrictions',
  'Review temporary access grants',
  'Check sharing rule effectiveness'
];
```

### 5. Test Permission Changes
Always test in sandbox before production.

```typescript
// What-if analysis
const simulation = await simulatePermissionChange({
  role_id: 'role_sales_rep',
  changes: {
    leads: { delete: true }  // Proposed change
  }
});

console.log(simulation);
// {
//   affected_users: 125,
//   new_permissions: { ... },
//   potential_risks: ['Users can now permanently delete leads'],
//   recommendations: ['Enable soft delete', 'Add delete audit trail']
// }
```

---

## Common Scenarios

### Scenario 1: New Employee Onboarding
```typescript
// Step 1: Assign profile
await assignProfile(user_id, 'standard_user_profile');

// Step 2: Assign role based on position
await assignRole(user_id, 'sales_rep_role');

// Step 3: Add to appropriate groups
await addToGroup(user_id, 'sales_west_region_group');

// Step 4: Grant temporary elevated access for training
await grantTemporaryAccess({
  user_id,
  permissions: { all_modules: { read: true } },
  expires_at: addDays(new Date(), 14),
  reason: 'Training period'
});
```

### Scenario 2: Promotion
```typescript
// Promoted from Sales Rep to Manager
const oldRole = 'sales_rep';
const newRole = 'sales_manager';

// Step 1: Update role (inherits manager permissions)
await updateUserRole(user_id, newRole);

// Step 2: Add manager-specific permission set
await assignPermissionSet(user_id, 'team_management_permissions');

// Step 3: Update group memberships
await removeFromGroup(user_id, 'sales_reps_group');
await addToGroup(user_id, 'sales_managers_group');

// Step 4: Audit log
await logPermissionChange({
  user_id,
  change_type: 'promotion',
  old_role: oldRole,
  new_role: newRole,
  reason: 'Promoted to Sales Manager'
});
```

### Scenario 3: Project-Based Access
```typescript
// Temporary access for cross-functional project
await grantTemporaryAccess({
  user_id: 'engineering_user_123',
  resource_type: 'crm_module',
  permissions: {
    leads: { read: true },
    deals: { read: true },
    contacts: { read: true }
  },
  expires_at: '2024-06-30T23:59:59Z',
  reason: 'Q2 Integration Project'
});

// Notification sent on grant and expiry
```

### Scenario 4: Sensitive Data Access
```typescript
// Restrict financial fields for non-finance roles
const financialFields = ['revenue', 'margin', 'cost', 'commission'];
const restrictedRoles = ['sales_rep', 'marketing_user'];

financialFields.forEach(field => {
  restrictedRoles.forEach(role => {
    setFieldPermission({
      role_id: role,
      module_name: 'deals',
      field_name: field,
      can_read: false,
      can_write: false
    });
  });
});
```

### Scenario 5: Regional Restrictions
```typescript
// Sales reps only see their region
await createSharingRule({
  name: 'Regional Lead Access',
  module_name: 'leads',
  rule_type: 'conditional',
  share_with_roles: ['sales_rep'],
  access_level: 'read_write',
  criteria: [
    {
      field_name: 'region',
      operator: 'equals',
      value: '${user.region}', // Dynamic value
      logical_operator: 'AND'
    }
  ]
});
```

---

## Troubleshooting

### Issue 1: User Cannot See Records
**Symptoms:** User reports "No records found"

**Diagnosis:**
```typescript
// Check effective permissions
const perms = await getEffectivePermissions(user_id);
console.log(perms.leads); // { read: true, write: false }

// Check sharing rules
const rules = await getSharingRulesForUser(user_id, 'leads');
console.log(rules); // []

// Check record ownership
const records = await getLeadsByOwner(user_id);
console.log(records.length); // 0
```

**Solution:** Grant read access via sharing rule or assign records.

### Issue 2: Permission Changes Not Taking Effect
**Symptoms:** User still has old permissions

**Diagnosis:**
```typescript
// Check permission cache
const cached = await getPermissionCache(user_id);
console.log(cached.last_updated); // "2024-01-10" (stale)

// Check user session
const session = await getUserSession(user_id);
console.log(session.permissions_loaded_at); // Old timestamp
```

**Solution:** Clear cache and require re-login.

### Issue 3: Conflicting Permissions
**Symptoms:** Unexpected access granted/denied

**Diagnosis:**
```typescript
// Run conflict diagnostics
const conflicts = await checkPermissionConflicts(user_id);
console.log(conflicts);
// [
//   {
//     type: 'conflicting',
//     message: 'Field permission conflicts with module permission',
//     details: { ... }
//   }
// ]
```

**Solution:** Resolve conflicts based on diagnostic recommendations.

---

## Glossary

- **Role** - Position-based permission container
- **Permission** - Specific action on a resource
- **Profile** - Default permission template
- **Permission Set** - Reusable permission bundle
- **Field Permission** - Field-level access control
- **Sharing Rule** - Record-level access grant
- **Temporary Access** - Time-limited permission grant
- **Hierarchy** - Parent-child role relationships
- **Effective Permissions** - Final calculated permissions
- **Access Level** - Degree of access (none/read/read_write/full)

---

## Additional Resources

- [Testing Strategy](TESTING_STRATEGY.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Settings Module Documentation](SETTINGS_MODULE_DOCUMENTATION.md)
- [Security Best Practices](https://docs.your-domain.com/security)

---

**Last Updated:** 2024-01-15
**Version:** 1.0
**Maintained By:** Platform Security Team
