import { useCallback } from 'react';
import { useCurrentUser } from '../contexts/CurrentUserContext';
import { roleHas } from '../utils/permissions';
import type { Permission } from '../utils/permissions';
import type { Lead } from '../types/lead';

export function usePermissions() {
  const { currentUser } = useCurrentUser();
  const { id, role } = currentUser;

  const can = useCallback(
    (permission: Permission): boolean => roleHas(role, permission),
    [role],
  );

  const canViewLead = useCallback(
    (lead: Lead): boolean => roleHas(role, 'leads.view_all') || lead.owner_id === id,
    [role, id],
  );

  return { role, can, canViewLead };
}
