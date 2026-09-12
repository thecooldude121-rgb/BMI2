import { useEffect, useState } from 'react';
import { fetchMembers, WorkspaceMember } from '../utils/usersApi';

/**
 * THE WORKSPACE'S PEOPLE — one source, for every "pick a colleague" surface.
 *
 * WHY THIS EXISTS. Two document pages each carried their OWN hardcoded list of
 * colleagues, and the two did not agree with each other:
 *
 *   DocumentsLibrary   'Sarah Chen (Sales Team)', 'Mike Johnson (Manager)',
 *                      'Emily Davis (Sales Rep)'   — two of them pre-checked
 *   DocumentDetailPage 'Emily Davis', 'David Wilson', 'Lisa Brown'
 *                      on @bmi.com
 *
 * Between them they invented two people who do not exist in this workspace at
 * all (David Wilson, Lisa Brown), used the wrong email domain (@bmi.com; it is
 * @bmicrm.com), and gave three real users job titles the server does not
 * agree with — "Mike Johnson (Manager)" is `sales`. Neither list overlapped
 * the other except for Emily Davis, so the same product asserted two different
 * teams on two adjacent screens.
 *
 * That is the same failure this repo already paid for with `invitableRolesFor`
 * — a client-side copy of something the server owns, which drifted. The lesson
 * there was recorded as "two lists that must agree will disagree"; this is that
 * again with people instead of roles, and with the additional twist that
 * NEITHER copy was ever right. So there is one list now, and it is fetched.
 *
 * DELIBERATELY NOT A CONTEXT, per `useDashboardData`'s note: a context is what
 * let sample data spread invisibly in the first place. Each consumer calls the
 * hook and passes what it needs down as props.
 */
export interface WorkspaceMembers {
  members: WorkspaceMember[];
  loading: boolean;
  /** Set when the roster could not be loaded — distinct from an empty one. */
  error: string | null;
}

export function useWorkspaceMembers(): WorkspaceMembers {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guards a state update after unmount, and an earlier slow response
    // overwriting a newer one — the pattern useDashboardData uses.
    let active = true;

    (async () => {
      try {
        /*
         * Active members only. A share picker should not offer someone whose
         * access has been revoked, which is the opposite of what Team
         * Management needs (it must show deactivated people in order to
         * reactivate them) — hence the explicit `false` rather than the
         * default.
         */
        const rows = await fetchMembers(false);
        if (!active) return;
        setMembers(Array.isArray(rows) ? rows : []);
        setError(null);
      } catch {
        if (!active) return;
        setMembers([]);
        // An empty picker because the request failed is not the same as an
        // empty picker because you work alone, and the caller must be able to
        // say which.
        setError('Could not load workspace members.');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, []);

  return { members, loading, error };
}

/**
 * A member in the shape `ShareDocumentModal` takes.
 *
 * `user_role` comes straight from the server's `role` and is NOT prettified:
 * the same string Settings → Team and Team Performance show. Title-casing it
 * here would be a third vocabulary for the same field, which is how
 * "Mike Johnson (Manager)" happened in the first place.
 */
export interface ShareTarget {
  user_id: string;
  user_name: string;
  user_avatar: string;
  user_email: string;
  user_role: string;
}

export const toShareTarget = (m: WorkspaceMember): ShareTarget => ({
  user_id: m.id,
  user_name: m.name || m.email,
  user_avatar: m.initials,
  user_email: m.email,
  user_role: m.role,
});
