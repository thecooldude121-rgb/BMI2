import { supabase } from '../lib/supabase';

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'REVOKE' | 'COPY' | 'APPLY';
export type EntityType = 'ROLE' | 'PERMISSION' | 'USER_ROLE' | 'PERMISSION_SET' | 'FIELD_PERMISSION' | 'MODULE_PERMISSION';

export interface AuditLogEntry {
  user_name: string;
  action_type: ActionType;
  entity_type: EntityType;
  entity_id: string;
  entity_name: string;
  before_state?: any;
  after_state?: any;
  changes_summary: string;
  ip_address?: string;
  metadata?: any;
}

export const logAuditEntry = async (entry: AuditLogEntry): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_name: entry.user_name,
        action_type: entry.action_type,
        entity_type: entry.entity_type,
        entity_id: entry.entity_id,
        entity_name: entry.entity_name,
        before_state: entry.before_state || null,
        after_state: entry.after_state || null,
        changes_summary: entry.changes_summary,
        ip_address: entry.ip_address || null,
        metadata: entry.metadata || {}
      });

    if (error) {
      console.error('Failed to log audit entry:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging audit entry:', error);
    return false;
  }
};

export const logRoleChange = async (
  userName: string,
  actionType: ActionType,
  roleId: string,
  roleName: string,
  beforeState?: any,
  afterState?: any,
  additionalInfo?: string
) => {
  let summary = '';

  switch (actionType) {
    case 'CREATE':
      summary = `Created new role "${roleName}"`;
      break;
    case 'UPDATE':
      summary = additionalInfo || `Updated role "${roleName}"`;
      break;
    case 'DELETE':
      summary = `Deleted role "${roleName}"`;
      break;
    default:
      summary = `${actionType} operation on role "${roleName}"`;
  }

  return logAuditEntry({
    user_name: userName,
    action_type: actionType,
    entity_type: 'ROLE',
    entity_id: roleId,
    entity_name: roleName,
    before_state: beforeState,
    after_state: afterState,
    changes_summary: summary
  });
};

export const logPermissionChange = async (
  userName: string,
  actionType: ActionType,
  permissionId: string,
  moduleName: string,
  roleName: string,
  beforeState?: any,
  afterState?: any,
  changes?: string[]
) => {
  const changesText = changes && changes.length > 0
    ? `: ${changes.join(', ')}`
    : '';

  const summary = `${actionType.charAt(0) + actionType.slice(1).toLowerCase()} permissions for ${roleName} on ${moduleName} module${changesText}`;

  return logAuditEntry({
    user_name: userName,
    action_type: actionType,
    entity_type: 'MODULE_PERMISSION',
    entity_id: permissionId,
    entity_name: `${moduleName} - ${roleName}`,
    before_state: beforeState,
    after_state: afterState,
    changes_summary: summary
  });
};

export const logUserRoleAssignment = async (
  userName: string,
  actionType: 'ASSIGN' | 'REVOKE',
  userId: string,
  userDisplayName: string,
  fromRole?: string,
  toRole?: string
) => {
  const summary = actionType === 'ASSIGN'
    ? `Changed role from ${fromRole || 'None'} to ${toRole} for ${userDisplayName}`
    : `Revoked ${fromRole} role from ${userDisplayName}`;

  return logAuditEntry({
    user_name: userName,
    action_type: actionType,
    entity_type: 'USER_ROLE',
    entity_id: userId,
    entity_name: userDisplayName,
    before_state: fromRole ? { role_id: 'unknown', role_name: fromRole } : null,
    after_state: toRole ? { role_id: 'unknown', role_name: toRole } : null,
    changes_summary: summary
  });
};

export const logPermissionSetAction = async (
  userName: string,
  actionType: ActionType,
  setId: string,
  setName: string,
  beforeState?: any,
  afterState?: any,
  additionalInfo?: string
) => {
  let summary = '';

  switch (actionType) {
    case 'CREATE':
      summary = `Created permission set "${setName}"`;
      break;
    case 'UPDATE':
      summary = additionalInfo || `Updated permission set "${setName}"`;
      break;
    case 'DELETE':
      summary = `Deleted permission set "${setName}"`;
      break;
    case 'APPLY':
      summary = additionalInfo || `Applied permission set "${setName}"`;
      break;
    default:
      summary = `${actionType} operation on permission set "${setName}"`;
  }

  return logAuditEntry({
    user_name: userName,
    action_type: actionType,
    entity_type: 'PERMISSION_SET',
    entity_id: setId,
    entity_name: setName,
    before_state: beforeState,
    after_state: afterState,
    changes_summary: summary
  });
};

export const logBulkPermissionCopy = async (
  userName: string,
  sourceRole: string,
  targetRoles: string[],
  moduleCount: number
) => {
  const summary = `Copied permissions from ${sourceRole} to ${targetRoles.length} role(s): ${targetRoles.join(', ')}`;

  return logAuditEntry({
    user_name: userName,
    action_type: 'COPY',
    entity_type: 'PERMISSION',
    entity_id: `bulk-copy-${Date.now()}`,
    entity_name: `${sourceRole} → ${targetRoles.join(', ')}`,
    after_state: {
      source_role: sourceRole,
      target_roles: targetRoles,
      modules_copied: moduleCount
    },
    changes_summary: summary
  });
};
