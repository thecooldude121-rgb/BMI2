import { AuthRequest } from './auth';

// Every controller must call this before touching the database. `protect`
// guarantees req.user is set on any route it guards, but this keeps that
// assumption in one place instead of `req.user!.tenant_id` scattered
// everywhere, and fails loudly (500, not a silent cross-tenant leak) if a
// route is ever wired up without `protect`.
export const requireTenantId = (req: AuthRequest): string => {
  // Reads the value `protect` derived from the token's `workspace_id` claim.
  // Deliberately takes no argument other than the request: there is no code path
  // by which a caller can supply a workspace.
  const tenantId = req.user?.workspace_id ?? req.user?.tenant_id;
  if (!tenantId) throw new Error('Missing tenant context — route is not authenticated');
  return tenantId;
};
