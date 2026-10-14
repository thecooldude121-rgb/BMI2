import { useEffect, useState } from 'react';
import { findLeadDuplicateCandidates } from '../utils/leadDuplicateCandidates';
import type { Lead } from '../types/lead';

/**
 * Server-found candidates for scoring a lead's possible duplicates (slice 6b).
 * `pool` is null until the first answer; `error` says the check did not run,
 * which a page must not present as "no duplicates".
 */
export function useLeadDuplicateCandidates(lead: Lead | null | undefined, enabled = true): { pool: Lead[] | null; error: string | null } {
  const [pool, setPool] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const key = lead ? [lead.id, lead.email, lead.phone, lead.company, lead.last_name].join('|') : '';
  useEffect(() => {
    if (!lead || !enabled) return;
    let live = true;
    setError(null);
    findLeadDuplicateCandidates({ id: String(lead.id), email: lead.email, phone: lead.phone, company: lead.company, last_name: lead.last_name, first_name: lead.first_name })
      .then(p => { if (live) setPool(p); })
      .catch(e => { if (live) { setPool([]); setError(e?.message ?? 'The duplicate check failed'); } });
    return () => { live = false; };
  }, [key, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  return { pool, error };
}
