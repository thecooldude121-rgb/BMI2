import type { AuthRequest } from '../middleware/auth';

/**
 * The human name to record as the actor on an audit row.
 *
 * ONE COPY, DELIBERATELY. This lived as a module-local const in
 * `dealsController`, and its own comment records that it had previously existed
 * in four places — one of which was missing its `tenant_id` predicate and
 * matched on id alone, a cross-workspace read waiting for two workspaces to
 * share an id. Adding a fifth copy for the stage-configuration controller would
 * have started that over, so it moved here instead.
 *
 * Reads only what `protect` already put on the request, so it costs no query.
 * Falls back to the email, then to 'Unknown' — never to a blank, because an
 * audit row with no actor is worse than one naming an address.
 */
export const resolveActorName = (req: AuthRequest): string => {
  const name = [req.user?.first_name, req.user?.last_name].filter(Boolean).join(' ').trim();
  return name || req.user?.email || 'Unknown';
};
