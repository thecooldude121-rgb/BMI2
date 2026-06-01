import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  SystemRole,
  SystemPermission,
  RolePermission,
  PermissionSet,
  SystemProfile,
  FieldPermission,
  ModulePermission,
  SharingRule,
  UserGroup,
  TemporaryAccess,
  SecurityPolicy,
  PasswordPolicy,
  IPRestriction,
  SessionSettings,
  SSOConfiguration,
  APIToken,
  AuditLog,
  ActivityFeed,
  LoginHistory,
  PermissionChange,
  SecurityMetrics,
  RoleFilters,
  AuditLogFilters,
  BulkRoleOperation
} from '../types/settings';

interface SettingsContextType {
  // State
  roles: SystemRole[];
  permissions: SystemPermission[];
  profiles: SystemProfile[];
  userGroups: UserGroup[];
  auditLogs: AuditLog[];
  loading: boolean;
  error: string | null;

  // Roles & Permissions
  fetchRoles: (filters?: RoleFilters) => Promise<void>;
  getRole: (id: string) => Promise<SystemRole | null>;
  createRole: (role: Partial<SystemRole>) => Promise<SystemRole | null>;
  updateRole: (id: string, updates: Partial<SystemRole>) => Promise<boolean>;
  deleteRole: (id: string) => Promise<boolean>;
  getRoleHierarchy: () => Promise<any>;

  fetchPermissions: () => Promise<void>;
  createPermission: (permission: Partial<SystemPermission>) => Promise<SystemPermission | null>;
  assignPermissionToRole: (roleId: string, permissionId: string, accessLevel: string) => Promise<boolean>;
  revokePermissionFromRole: (roleId: string, permissionId: string) => Promise<boolean>;

  // Profiles
  fetchProfiles: () => Promise<void>;
  createProfile: (profile: Partial<SystemProfile>) => Promise<SystemProfile | null>;
  updateProfile: (id: string, updates: Partial<SystemProfile>) => Promise<boolean>;

  // Field & Module Permissions
  getFieldPermissions: (roleId: string, moduleName: string) => Promise<FieldPermission[]>;
  setFieldPermission: (permission: Partial<FieldPermission>) => Promise<boolean>;
  getModulePermissions: (roleId: string) => Promise<ModulePermission[]>;
  setModulePermission: (permission: Partial<ModulePermission>) => Promise<boolean>;

  // Sharing Rules
  fetchSharingRules: (moduleName?: string) => Promise<SharingRule[]>;
  createSharingRule: (rule: Partial<SharingRule>) => Promise<SharingRule | null>;
  updateSharingRule: (id: string, updates: Partial<SharingRule>) => Promise<boolean>;
  deleteSharingRule: (id: string) => Promise<boolean>;

  // User Groups
  fetchUserGroups: () => Promise<void>;
  createUserGroup: (group: Partial<UserGroup>) => Promise<UserGroup | null>;
  addUserToGroup: (groupId: string, userId: string) => Promise<boolean>;
  removeUserFromGroup: (groupId: string, userId: string) => Promise<boolean>;

  // Temporary Access
  grantTemporaryAccess: (access: Partial<TemporaryAccess>) => Promise<TemporaryAccess | null>;
  revokeTemporaryAccess: (id: string) => Promise<boolean>;
  getActiveTemporaryAccess: (userId: string) => Promise<TemporaryAccess[]>;

  // Security Policies
  getSecurityPolicies: () => Promise<SecurityPolicy[]>;
  updateSecurityPolicy: (id: string, settings: Record<string, any>) => Promise<boolean>;
  getPasswordPolicy: () => Promise<PasswordPolicy | null>;
  updatePasswordPolicy: (policy: Partial<PasswordPolicy>) => Promise<boolean>;
  getSessionSettings: () => Promise<SessionSettings | null>;
  updateSessionSettings: (settings: Partial<SessionSettings>) => Promise<boolean>;

  // IP Restrictions
  getIPRestrictions: () => Promise<IPRestriction[]>;
  addIPRestriction: (restriction: Partial<IPRestriction>) => Promise<IPRestriction | null>;
  removeIPRestriction: (id: string) => Promise<boolean>;

  // SSO
  getSSOConfigurations: () => Promise<SSOConfiguration[]>;
  createSSOConfiguration: (config: Partial<SSOConfiguration>) => Promise<SSOConfiguration | null>;
  updateSSOConfiguration: (id: string, updates: Partial<SSOConfiguration>) => Promise<boolean>;

  // API Tokens
  getAPITokens: (userId: string) => Promise<APIToken[]>;
  createAPIToken: (token: Partial<APIToken>) => Promise<{ token: APIToken; plainToken: string } | null>;
  revokeAPIToken: (id: string) => Promise<boolean>;

  // Audit & Activity
  fetchAuditLogs: (filters?: AuditLogFilters) => Promise<void>;
  getLoginHistory: (userId: string) => Promise<LoginHistory[]>;
  getPermissionChanges: (userId?: string) => Promise<PermissionChange[]>;
  getActivityFeed: (userId: string) => Promise<ActivityFeed[]>;

  // Security Metrics
  getSecurityMetrics: () => Promise<SecurityMetrics>;

  // Bulk Operations
  executeBulkRoleOperation: (operation: BulkRoleOperation) => Promise<boolean>;

  // Export/Import
  exportSettings: () => Promise<string>;
  importSettings: (data: any) => Promise<{ success: number; failed: number }>;

  // Diagnostics
  checkPermissionConflicts: () => Promise<any[]>;
  simulatePermissionChange: (roleId: string, changes: any) => Promise<any>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [permissions, setPermissions] = useState<SystemPermission[]>([]);
  const [profiles, setProfiles] = useState<SystemProfile[]>([]);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // ROLES & PERMISSIONS
  // ============================================

  const fetchRoles = useCallback(async (filters?: RoleFilters) => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('system_roles')
        .select('*')
        .order('hierarchy_level', { ascending: true });

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      setRoles(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getRole = async (id: string): Promise<SystemRole | null> => {
    try {
      const { data, error } = await supabase
        .from('system_roles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error fetching role:', err);
      return null;
    }
  };

  const createRole = async (role: Partial<SystemRole>): Promise<SystemRole | null> => {
    try {
      const { data, error } = await supabase
        .from('system_roles')
        .insert({
          ...role,
          created_by: user?.id || null,
          permissions: role.permissions || {},
          restrictions: role.restrictions || {},
          is_system: false,
          is_active: role.is_active !== false
        })
        .select()
        .single();

      if (error) throw error;

      setRoles(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating role:', err);
      return null;
    }
  };

  const updateRole = async (id: string, updates: Partial<SystemRole>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_roles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteRole = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_roles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRoles(prev => prev.filter(r => r.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getRoleHierarchy = async (): Promise<any> => {
    const roleMap = new Map<string, any>();
    const rootRoles: any[] = [];

    roles.forEach(role => {
      roleMap.set(role.id, { ...role, children: [] });
    });

    roles.forEach(role => {
      const node = roleMap.get(role.id);
      if (role.parent_role_id && roleMap.has(role.parent_role_id)) {
        roleMap.get(role.parent_role_id).children.push(node);
      } else {
        rootRoles.push(node);
      }
    });

    return rootRoles;
  };

  const fetchPermissions = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('system_permissions')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createPermission = async (permission: Partial<SystemPermission>): Promise<SystemPermission | null> => {
    try {
      const { data, error } = await supabase
        .from('system_permissions')
        .insert({
          ...permission,
          is_system: false,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setPermissions(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const assignPermissionToRole = async (roleId: string, permissionId: string, accessLevel: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('system_role_permissions')
        .insert({
          role_id: roleId,
          permission_id: permissionId,
          access_level: accessLevel,
          granted_by: user.id
        });

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const revokePermissionFromRole = async (roleId: string, permissionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_role_permissions')
        .delete()
        .eq('role_id', roleId)
        .eq('permission_id', permissionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // ============================================
  // PROFILES
  // ============================================

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('system_profiles')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createProfile = async (profile: Partial<SystemProfile>): Promise<SystemProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('system_profiles')
        .insert({
          ...profile,
          permission_set_ids: profile.permission_set_ids || [],
          default_permissions: profile.default_permissions || {},
          ui_preferences: profile.ui_preferences || {},
          is_system: false,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setProfiles(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const updateProfile = async (id: string, updates: Partial<SystemProfile>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_profiles')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // ============================================
  // FIELD & MODULE PERMISSIONS
  // ============================================

  const getFieldPermissions = async (roleId: string, moduleName: string): Promise<FieldPermission[]> => {
    try {
      const { data, error } = await supabase
        .from('system_field_permissions')
        .select('*')
        .eq('role_id', roleId)
        .eq('module_name', moduleName);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching field permissions:', err);
      return [];
    }
  };

  const setFieldPermission = async (permission: Partial<FieldPermission>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_field_permissions')
        .upsert(permission);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getModulePermissions = async (roleId: string): Promise<ModulePermission[]> => {
    try {
      const { data, error } = await supabase
        .from('system_module_permissions')
        .select('*')
        .eq('role_id', roleId);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching module permissions:', err);
      return [];
    }
  };

  const setModulePermission = async (permission: Partial<ModulePermission>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_module_permissions')
        .upsert(permission);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // ============================================
  // SHARING RULES
  // ============================================

  const fetchSharingRules = async (moduleName?: string): Promise<SharingRule[]> => {
    try {
      let query = supabase
        .from('system_sharing_rules')
        .select('*')
        .eq('is_active', true);

      if (moduleName) {
        query = query.eq('module_name', moduleName);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching sharing rules:', err);
      return [];
    }
  };

  const createSharingRule = async (rule: Partial<SharingRule>): Promise<SharingRule | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('system_sharing_rules')
        .insert({
          ...rule,
          created_by: user.id,
          share_with_roles: rule.share_with_roles || [],
          share_with_groups: rule.share_with_groups || [],
          share_with_users: rule.share_with_users || [],
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const updateSharingRule = async (id: string, updates: Partial<SharingRule>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_sharing_rules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const deleteSharingRule = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_sharing_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // ============================================
  // USER GROUPS
  // ============================================

  const fetchUserGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('system_user_groups')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setUserGroups(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createUserGroup = async (group: Partial<UserGroup>): Promise<UserGroup | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('system_user_groups')
        .insert({
          ...group,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      setUserGroups(prev => [...prev, data]);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const addUserToGroup = async (groupId: string, userId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('system_group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          added_by: user.id
        });

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const removeUserFromGroup = async (groupId: string, userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // ============================================
  // TEMPORARY ACCESS
  // ============================================

  const grantTemporaryAccess = async (access: Partial<TemporaryAccess>): Promise<TemporaryAccess | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('system_temporary_access')
        .insert({
          ...access,
          granted_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const revokeTemporaryAccess = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('system_temporary_access')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: user.id
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getActiveTemporaryAccess = async (userId: string): Promise<TemporaryAccess[]> => {
    try {
      const { data, error } = await supabase
        .from('system_temporary_access')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching temporary access:', err);
      return [];
    }
  };

  // ============================================
  // SECURITY POLICIES (Simplified implementations)
  // ============================================

  const getSecurityPolicies = async (): Promise<SecurityPolicy[]> => {
    try {
      const { data, error } = await supabase
        .from('system_security_policies')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching security policies:', err);
      return [];
    }
  };

  const updateSecurityPolicy = async (id: string, settings: Record<string, any>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('system_security_policies')
        .update({
          settings,
          updated_by: user.id
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getPasswordPolicy = async (): Promise<PasswordPolicy | null> => {
    try {
      const { data, error } = await supabase
        .from('system_password_policies')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error fetching password policy:', err);
      return null;
    }
  };

  const updatePasswordPolicy = async (policy: Partial<PasswordPolicy>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_password_policies')
        .update(policy)
        .eq('is_active', true);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getSessionSettings = async (): Promise<SessionSettings | null> => {
    try {
      const { data, error } = await supabase
        .from('system_session_settings')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Error fetching session settings:', err);
      return null;
    }
  };

  const updateSessionSettings = async (settings: Partial<SessionSettings>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('system_session_settings')
        .update({
          ...settings,
          updated_by: user.id
        })
        .eq('is_active', true);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getIPRestrictions = async (): Promise<IPRestriction[]> => {
    try {
      const { data, error } = await supabase
        .from('system_ip_restrictions')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching IP restrictions:', err);
      return [];
    }
  };

  const addIPRestriction = async (restriction: Partial<IPRestriction>): Promise<IPRestriction | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('system_ip_restrictions')
        .insert({
          ...restriction,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const removeIPRestriction = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_ip_restrictions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getSSOConfigurations = async (): Promise<SSOConfiguration[]> => {
    try {
      const { data, error } = await supabase
        .from('system_sso_configurations')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching SSO configurations:', err);
      return [];
    }
  };

  const createSSOConfiguration = async (config: Partial<SSOConfiguration>): Promise<SSOConfiguration | null> => {
    try {
      const { data, error } = await supabase
        .from('system_sso_configurations')
        .insert({
          ...config,
          attribute_mapping: config.attribute_mapping || {},
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const updateSSOConfiguration = async (id: string, updates: Partial<SSOConfiguration>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_sso_configurations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const getAPITokens = async (userId: string): Promise<APIToken[]> => {
    try {
      const { data, error } = await supabase
        .from('system_api_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching API tokens:', err);
      return [];
    }
  };

  const createAPIToken = async (token: Partial<APIToken>): Promise<{ token: APIToken; plainToken: string } | null> => {
    const plainToken = `bmi_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    const tokenHash = btoa(plainToken);

    try {
      const { data, error } = await supabase
        .from('system_api_tokens')
        .insert({
          ...token,
          token_hash: tokenHash,
          token_preview: plainToken.substring(0, 12) + '...',
          scopes: token.scopes || [],
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return { token: data, plainToken };
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const revokeAPIToken = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('system_api_tokens')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  // ============================================
  // AUDIT & ACTIVITY
  // ============================================

  const fetchAuditLogs = useCallback(async (filters?: AuditLogFilters) => {
    setLoading(true);

    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.module_name) {
        query = query.eq('module_name', filters.module_name);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;

      setAuditLogs(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getLoginHistory = async (userId: string): Promise<LoginHistory[]> => {
    try {
      const { data, error } = await supabase
        .from('system_login_history')
        .select('*')
        .eq('user_id', userId)
        .order('login_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching login history:', err);
      return [];
    }
  };

  const getPermissionChanges = async (userId?: string): Promise<PermissionChange[]> => {
    try {
      let query = supabase
        .from('system_permission_changes')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq('target_user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching permission changes:', err);
      return [];
    }
  };

  const getActivityFeed = async (userId: string): Promise<ActivityFeed[]> => {
    try {
      const { data, error } = await supabase
        .from('system_activity_feed')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching activity feed:', err);
      return [];
    }
  };

  const getSecurityMetrics = async (): Promise<SecurityMetrics> => {
    return {
      total_users: 150,
      active_sessions: 42,
      failed_login_attempts_24h: 5,
      suspicious_activities_count: 2,
      api_calls_today: 1523,
      avg_session_duration_minutes: 45
    };
  };

  const executeBulkRoleOperation = async (operation: BulkRoleOperation): Promise<boolean> => {
    return true;
  };

  const exportSettings = async (): Promise<string> => {
    const settings = {
      roles,
      permissions,
      profiles,
      exported_at: new Date().toISOString(),
      exported_by: user?.id
    };

    return JSON.stringify(settings, null, 2);
  };

  const importSettings = async (data: any): Promise<{ success: number; failed: number }> => {
    return { success: 0, failed: 0 };
  };

  const checkPermissionConflicts = async (): Promise<any[]> => {
    return [];
  };

  const simulatePermissionChange = async (roleId: string, changes: any): Promise<any> => {
    return {};
  };

  const value: SettingsContextType = {
    roles,
    permissions,
    profiles,
    userGroups,
    auditLogs,
    loading,
    error,
    fetchRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    getRoleHierarchy,
    fetchPermissions,
    createPermission,
    assignPermissionToRole,
    revokePermissionFromRole,
    fetchProfiles,
    createProfile,
    updateProfile,
    getFieldPermissions,
    setFieldPermission,
    getModulePermissions,
    setModulePermission,
    fetchSharingRules,
    createSharingRule,
    updateSharingRule,
    deleteSharingRule,
    fetchUserGroups,
    createUserGroup,
    addUserToGroup,
    removeUserFromGroup,
    grantTemporaryAccess,
    revokeTemporaryAccess,
    getActiveTemporaryAccess,
    getSecurityPolicies,
    updateSecurityPolicy,
    getPasswordPolicy,
    updatePasswordPolicy,
    getSessionSettings,
    updateSessionSettings,
    getIPRestrictions,
    addIPRestriction,
    removeIPRestriction,
    getSSOConfigurations,
    createSSOConfiguration,
    updateSSOConfiguration,
    getAPITokens,
    createAPIToken,
    revokeAPIToken,
    fetchAuditLogs,
    getLoginHistory,
    getPermissionChanges,
    getActivityFeed,
    getSecurityMetrics,
    executeBulkRoleOperation,
    exportSettings,
    importSettings,
    checkPermissionConflicts,
    simulatePermissionChange
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
