import { useEffect, useState } from 'react';
import { fetchUsers } from '../utils/usersApi';

/**
 * Lead owner choices: the workspace's real users (GET /users), as
 * { id: user id as a string, label: display name }. The lead create paths send
 * the id as `assigned_to_user_id`.
 *
 * It replaced `TEAM_MEMBERS` ("SDR Team", "HR Partner", "Account Manager") —
 * placeholder queues that named nobody and were stored as free text — in Quick
 * Add and the Import wizard (Venkat, 2026-10-14; Add Lead moved in H1).
 * `options` is null while loading; a failure is reported, and the lead can
 * still be saved unassigned.
 */
export function useLeadOwnerOptions(): { options: { id: string; label: string }[] | null; error: string | null } {
  const [options, setOptions] = useState<{ id: string; label: string }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetchUsers()
      .then(users => { if (live) setOptions(users.map(u => ({ id: String(u.id), label: u.displayName }))); })
      .catch(e => { if (live) { setError(e?.message ?? 'Could not load the team'); setOptions([]); } });
    return () => { live = false; };
  }, []);
  return { options, error };
}
