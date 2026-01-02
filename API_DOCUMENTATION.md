# Settings Module API Documentation

## Overview
Complete REST API documentation for the Settings & Administration module.

**Base URL:** `https://your-domain.com/api/v1`

**Authentication:** Bearer Token (JWT)

**Content-Type:** `application/json`

## Authentication

### API Token Format
```
Authorization: Bearer <token>
```

### Token Scopes
```typescript
{
  "leads:read": "Read lead data",
  "leads:write": "Create/update leads",
  "settings:admin": "Full settings access",
  "audit:read": "View audit logs"
}
```

## Rate Limiting

**Default Limits:**
- 60 requests per minute
- 1000 requests per hour
- 10000 requests per day

**Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to perform this action",
    "details": {
      "required_permission": "settings:admin",
      "user_permissions": ["settings:read"]
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `PERMISSION_DENIED` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Roles API

### List Roles
```http
GET /settings/roles
```

**Query Parameters:**
- `search` (string) - Search by name
- `is_active` (boolean) - Filter active/inactive
- `hierarchy_level` (number) - Filter by level
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 25)

**Response:**
```json
{
  "data": [
    {
      "id": "role_abc123",
      "name": "Sales Manager",
      "description": "Manages sales team",
      "parent_role_id": "role_parent",
      "hierarchy_level": 2,
      "is_system": false,
      "is_active": true,
      "permissions": {
        "leads": { "read": true, "write": true, "delete": false },
        "deals": { "read": true, "write": true, "delete": true }
      },
      "restrictions": {},
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "created_by": "user_123"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 150,
    "total_pages": 6
  }
}
```

### Get Role
```http
GET /settings/roles/:id
```

**Response:**
```json
{
  "data": {
    "id": "role_abc123",
    "name": "Sales Manager",
    "description": "Manages sales team",
    "parent_role_id": "role_parent",
    "hierarchy_level": 2,
    "permissions": { ... },
    "children": [
      { "id": "role_child1", "name": "Sales Rep" }
    ],
    "user_count": 25,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Create Role
```http
POST /settings/roles
```

**Request Body:**
```json
{
  "name": "Regional Manager",
  "description": "Manages regional sales",
  "parent_role_id": "role_parent",
  "permissions": {
    "leads": { "read": true, "write": true, "delete": false }
  },
  "restrictions": {
    "max_deal_value": 100000
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "role_new123",
    "name": "Regional Manager",
    "hierarchy_level": 3,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Update Role
```http
PATCH /settings/roles/:id
```

**Request Body:**
```json
{
  "name": "Senior Sales Manager",
  "description": "Updated description",
  "is_active": true
}
```

**Response:**
```json
{
  "data": {
    "id": "role_abc123",
    "updated_at": "2024-01-15T10:35:00Z"
  }
}
```

### Delete Role
```http
DELETE /settings/roles/:id
```

**Response:**
```json
{
  "data": {
    "id": "role_abc123",
    "deleted": true,
    "deleted_at": "2024-01-15T10:40:00Z"
  }
}
```

### Get Role Hierarchy
```http
GET /settings/roles/hierarchy
```

**Response:**
```json
{
  "data": [
    {
      "role": {
        "id": "role_root",
        "name": "System Admin",
        "hierarchy_level": 0
      },
      "children": [
        {
          "role": {
            "id": "role_child",
            "name": "Sales Manager",
            "hierarchy_level": 1
          },
          "children": [],
          "user_count": 25
        }
      ],
      "user_count": 5
    }
  ]
}
```

---

## Permissions API

### List Permissions
```http
GET /settings/permissions
```

**Query Parameters:**
- `category` (string) - Filter by category
- `resource_type` (string) - Filter by resource

**Response:**
```json
{
  "data": [
    {
      "id": "perm_123",
      "name": "View Leads",
      "code": "leads.read",
      "description": "View lead records",
      "category": "leads",
      "resource_type": "lead",
      "is_system": true,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Assign Permission to Role
```http
POST /settings/roles/:roleId/permissions
```

**Request Body:**
```json
{
  "permission_id": "perm_123",
  "access_level": "read_write",
  "conditions": {
    "region": "US-West",
    "status": "active"
  }
}
```

**Response:**
```json
{
  "data": {
    "role_id": "role_abc123",
    "permission_id": "perm_123",
    "access_level": "read_write",
    "granted_at": "2024-01-15T10:45:00Z"
  }
}
```

### Revoke Permission from Role
```http
DELETE /settings/roles/:roleId/permissions/:permissionId
```

**Response:**
```json
{
  "data": {
    "revoked": true,
    "revoked_at": "2024-01-15T10:50:00Z"
  }
}
```

---

## Field Permissions API

### Get Field Permissions
```http
GET /settings/roles/:roleId/fields/:moduleName
```

**Response:**
```json
{
  "data": [
    {
      "id": "field_perm_123",
      "role_id": "role_abc123",
      "module_name": "leads",
      "field_name": "revenue",
      "can_read": true,
      "can_write": false,
      "can_delete": false,
      "conditions": {},
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Set Field Permission
```http
PUT /settings/field-permissions
```

**Request Body:**
```json
{
  "role_id": "role_abc123",
  "module_name": "leads",
  "field_name": "revenue",
  "can_read": true,
  "can_write": false,
  "can_delete": false
}
```

**Response:**
```json
{
  "data": {
    "id": "field_perm_123",
    "updated_at": "2024-01-15T10:55:00Z"
  }
}
```

---

## Sharing Rules API

### List Sharing Rules
```http
GET /settings/sharing-rules
```

**Query Parameters:**
- `module_name` (string) - Filter by module
- `is_active` (boolean) - Filter active rules

**Response:**
```json
{
  "data": [
    {
      "id": "share_rule_123",
      "name": "Share Regional Leads",
      "description": "Share leads with regional team",
      "module_name": "leads",
      "rule_type": "conditional",
      "share_with_roles": ["role_regional_mgr"],
      "share_with_groups": ["group_sales_west"],
      "share_with_users": [],
      "access_level": "read_write",
      "is_active": true,
      "priority": 10,
      "criteria": [
        {
          "field_name": "region",
          "operator": "equals",
          "value": "US-West",
          "logical_operator": "AND"
        }
      ],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Sharing Rule
```http
POST /settings/sharing-rules
```

**Request Body:**
```json
{
  "name": "Share High Value Leads",
  "module_name": "leads",
  "rule_type": "conditional",
  "share_with_roles": ["role_sales_director"],
  "access_level": "read",
  "priority": 5,
  "criteria": [
    {
      "field_name": "estimated_value",
      "operator": "greater_than",
      "value": "100000",
      "logical_operator": "AND"
    },
    {
      "field_name": "status",
      "operator": "equals",
      "value": "qualified",
      "logical_operator": "AND"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "id": "share_rule_new",
    "created_at": "2024-01-15T11:00:00Z"
  }
}
```

---

## Temporary Access API

### Grant Temporary Access
```http
POST /settings/temporary-access
```

**Request Body:**
```json
{
  "user_id": "user_123",
  "resource_type": "lead",
  "resource_id": "lead_abc",
  "permissions": {
    "read": true,
    "write": true,
    "delete": false
  },
  "expires_at": "2024-01-22T10:00:00Z",
  "reason": "Cover for vacation"
}
```

**Response:**
```json
{
  "data": {
    "id": "temp_access_123",
    "user_id": "user_123",
    "expires_at": "2024-01-22T10:00:00Z",
    "granted_at": "2024-01-15T11:05:00Z"
  }
}
```

### Revoke Temporary Access
```http
DELETE /settings/temporary-access/:id
```

**Response:**
```json
{
  "data": {
    "id": "temp_access_123",
    "revoked": true,
    "revoked_at": "2024-01-15T11:10:00Z"
  }
}
```

### List Active Temporary Access
```http
GET /settings/temporary-access/active
```

**Query Parameters:**
- `user_id` (string) - Filter by user

**Response:**
```json
{
  "data": [
    {
      "id": "temp_access_123",
      "user_id": "user_123",
      "resource_type": "lead",
      "permissions": { ... },
      "expires_at": "2024-01-22T10:00:00Z",
      "time_remaining_ms": 604800000
    }
  ]
}
```

---

## Audit Logs API

### List Audit Logs
```http
GET /settings/audit-logs
```

**Query Parameters:**
- `user_id` (string) - Filter by user
- `activity_type` (string[]) - Filter by type
- `module_name` (string) - Filter by module
- `date_from` (ISO 8601) - Start date
- `date_to` (ISO 8601) - End date
- `limit` (number) - Max results (default: 100)

**Response:**
```json
{
  "data": [
    {
      "id": "audit_123",
      "user_id": "user_123",
      "activity_type": "update",
      "module_name": "leads",
      "record_id": "lead_abc",
      "action": "Updated lead status",
      "description": "Changed status from 'new' to 'qualified'",
      "old_values": {
        "status": "new"
      },
      "new_values": {
        "status": "qualified"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "device_fingerprint": "fp_xyz789",
      "metadata": {},
      "created_at": "2024-01-15T11:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 5234
  }
}
```

### Export Audit Logs
```http
POST /settings/audit-logs/export
```

**Request Body:**
```json
{
  "format": "csv",
  "filters": {
    "date_from": "2024-01-01T00:00:00Z",
    "date_to": "2024-01-31T23:59:59Z",
    "activity_types": ["create", "update", "delete"]
  }
}
```

**Response:**
```json
{
  "data": {
    "export_id": "export_123",
    "status": "processing",
    "download_url": null,
    "estimated_completion": "2024-01-15T11:20:00Z"
  }
}
```

---

## User Groups API

### List User Groups
```http
GET /settings/user-groups
```

**Response:**
```json
{
  "data": [
    {
      "id": "group_123",
      "name": "Sales West Region",
      "description": "Western regional sales team",
      "parent_group_id": "group_sales",
      "group_type": "regional",
      "hierarchy_path": "/sales/west",
      "is_active": true,
      "member_count": 45,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create User Group
```http
POST /settings/user-groups
```

**Request Body:**
```json
{
  "name": "Sales East Region",
  "description": "Eastern regional sales team",
  "parent_group_id": "group_sales",
  "group_type": "regional"
}
```

**Response:**
```json
{
  "data": {
    "id": "group_new",
    "hierarchy_path": "/sales/east",
    "created_at": "2024-01-15T11:25:00Z"
  }
}
```

### Add User to Group
```http
POST /settings/user-groups/:groupId/members
```

**Request Body:**
```json
{
  "user_id": "user_123",
  "role_in_group": "member"
}
```

**Response:**
```json
{
  "data": {
    "group_id": "group_123",
    "user_id": "user_123",
    "added_at": "2024-01-15T11:30:00Z"
  }
}
```

---

## Security Policies API

### Get Password Policy
```http
GET /settings/security/password-policy
```

**Response:**
```json
{
  "data": {
    "id": "policy_123",
    "min_length": 8,
    "require_uppercase": true,
    "require_lowercase": true,
    "require_numbers": true,
    "require_special_chars": true,
    "expiry_days": 90,
    "history_count": 5,
    "max_login_attempts": 5,
    "lockout_duration_minutes": 30,
    "is_active": true,
    "updated_at": "2024-01-15T11:35:00Z"
  }
}
```

### Update Password Policy
```http
PATCH /settings/security/password-policy
```

**Request Body:**
```json
{
  "min_length": 12,
  "expiry_days": 60,
  "max_login_attempts": 3
}
```

**Response:**
```json
{
  "data": {
    "id": "policy_123",
    "updated_at": "2024-01-15T11:40:00Z"
  }
}
```

---

## API Tokens API

### List API Tokens
```http
GET /settings/api-tokens
```

**Query Parameters:**
- `user_id` (string) - Filter by user

**Response:**
```json
{
  "data": [
    {
      "id": "token_123",
      "user_id": "user_123",
      "token_name": "Mobile App",
      "token_preview": "bmi_abc123...",
      "scopes": ["leads:read", "deals:read"],
      "expires_at": "2025-01-15T00:00:00Z",
      "last_used_at": "2024-01-15T10:00:00Z",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create API Token
```http
POST /settings/api-tokens
```

**Request Body:**
```json
{
  "user_id": "user_123",
  "token_name": "Integration Service",
  "scopes": ["leads:read", "leads:write", "deals:read"],
  "expires_at": "2025-01-15T00:00:00Z"
}
```

**Response:**
```json
{
  "data": {
    "id": "token_new",
    "token": "bmi_abc123xyz456def789",
    "token_preview": "bmi_abc123...",
    "created_at": "2024-01-15T11:45:00Z",
    "warning": "Save this token now. It will not be shown again."
  }
}
```

### Revoke API Token
```http
DELETE /settings/api-tokens/:id
```

**Response:**
```json
{
  "data": {
    "id": "token_123",
    "revoked": true,
    "revoked_at": "2024-01-15T11:50:00Z"
  }
}
```

---

## Bulk Operations API

### Bulk Create Roles
```http
POST /settings/bulk/roles
```

**Request Body:**
```json
{
  "operation": "create",
  "data": [
    {
      "name": "Role 1",
      "description": "Description 1"
    },
    {
      "name": "Role 2",
      "description": "Description 2"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "operation_id": "bulk_op_123",
    "status": "processing",
    "total": 2,
    "processed": 0,
    "succeeded": 0,
    "failed": 0
  }
}
```

### Bulk Operation Status
```http
GET /settings/bulk/operations/:operationId
```

**Response:**
```json
{
  "data": {
    "operation_id": "bulk_op_123",
    "status": "completed",
    "total": 2,
    "succeeded": 2,
    "failed": 0,
    "results": [
      {
        "id": "role_new1",
        "status": "success"
      },
      {
        "id": "role_new2",
        "status": "success"
      }
    ],
    "completed_at": "2024-01-15T11:55:00Z"
  }
}
```

---

## Webhooks API

### List Webhooks
```http
GET /settings/webhooks
```

**Response:**
```json
{
  "data": [
    {
      "id": "webhook_123",
      "name": "Lead Created Webhook",
      "url": "https://example.com/webhook",
      "events": ["lead.created", "lead.updated"],
      "secret": "whsec_***",
      "is_active": true,
      "retry_count": 3,
      "timeout_seconds": 30,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Webhook
```http
POST /settings/webhooks
```

**Request Body:**
```json
{
  "name": "Deal Updated Webhook",
  "url": "https://example.com/webhook/deals",
  "events": ["deal.updated", "deal.status_changed"],
  "retry_count": 3,
  "timeout_seconds": 30
}
```

**Response:**
```json
{
  "data": {
    "id": "webhook_new",
    "secret": "whsec_abc123xyz",
    "created_at": "2024-01-15T12:00:00Z"
  }
}
```

---

## SDKs & Code Examples

### JavaScript/TypeScript
```typescript
import { SettingsAPI } from '@bmi/settings-sdk';

const api = new SettingsAPI({
  baseURL: 'https://your-domain.com/api/v1',
  apiKey: 'your-api-key'
});

// Create a role
const role = await api.roles.create({
  name: 'Sales Manager',
  permissions: { leads: { read: true, write: true } }
});

// Assign permission
await api.permissions.assign(role.id, 'perm_leads_delete', 'full');

// Create sharing rule
const rule = await api.sharing.create({
  name: 'Regional Sharing',
  module_name: 'leads',
  criteria: [
    { field: 'region', operator: 'equals', value: 'West' }
  ]
});
```

### Python
```python
from bmi_settings import SettingsAPI

api = SettingsAPI(
    base_url='https://your-domain.com/api/v1',
    api_key='your-api-key'
)

# Create a role
role = api.roles.create(
    name='Sales Manager',
    permissions={'leads': {'read': True, 'write': True}}
)

# Fetch audit logs
logs = api.audit.list(
    user_id='user_123',
    date_from='2024-01-01',
    limit=100
)
```

---

## Versioning

**Current Version:** v1

**Deprecation Policy:**
- 6 months notice for breaking changes
- Deprecated endpoints remain functional for 12 months
- Version specified in URL path (`/api/v1/...`)

---

## Support

**Documentation:** https://docs.your-domain.com/api
**Status Page:** https://status.your-domain.com
**Support Email:** api-support@your-domain.com
**GitHub:** https://github.com/your-org/settings-api

---

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Complete CRUD for all settings entities
- Comprehensive audit logging
- Webhook support
- Bulk operations

