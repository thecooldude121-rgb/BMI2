import { useEffect, useState } from 'react';
import { fetchDeals } from '../utils/dealsApi';
import { fetchAccounts } from '../utils/accountsApi';
import { fetchContacts } from '../utils/contactsApi';
import { fetchActivities } from '../utils/activitiesApi';
import type { DocumentModule } from '../services/documentsService';

/**
 * THE RECORDS A DOCUMENT CAN BE ATTACHED TO — fetched, not invented.
 *
 * WHAT THIS REPLACES. The upload modal offered four hardcoded lists:
 *
 *   MOCK_DEALS      deal_acme_001, deal_bigco_001, deal_health_001 …
 *   MOCK_ACCOUNTS   account_acme, account_dataflow, account_startco …
 *   MOCK_CONTACTS   contact_john_smith, contact_sarah_lee …
 *   MOCK_ACTIVITIES act_bigco_001, act_acme_meeting_001 …
 *
 * NONE of those ids exists. Real ids in this workspace are `D002`, `C002`,
 * `CT001`. So picking anything from that list sent the server a `record_id`
 * pointing at nothing, and the upload was rejected by
 * `foreignIdsInTenant` — "record_id does not name a contact in this
 * workspace" — behind an earlier failure that masked it (see the module
 * casing note in documentsService).
 *
 * The same invented ids were also the keys of two dead lookup tables in
 * DocumentsLibrary, deleted in this branch. This hook is why they can never be
 * needed again: the picker now offers only records that exist.
 *
 * ONE FETCH PER TYPE, in parallel, on open. `allSettled`, so one failing
 * endpoint costs one section of the picker rather than the whole upload.
 */

export interface RelatedRecordOption {
  /** The server's `module` value — already lowercase, by type. */
  module: DocumentModule;
  /** The server's `record_id`. Real ids only. */
  id: string;
  /** What the user reads. */
  name: string;
  /** Secondary line, e.g. a contact's company. Omitted when unknown. */
  detail?: string;
}

export interface RelatedRecordOptions {
  options: RelatedRecordOption[];
  loading: boolean;
  /** Names the types that failed, so the UI can say which are missing. */
  failed: string[];
}

/**
 * `lead` is absent DELIBERATELY. The server accepts it, but nothing in this
 * modal ever offered leads and adding a fifth list is a product decision, not
 * a bug fix. Recorded here so its absence reads as a choice.
 */
const LIMIT = 200;

export function useRelatedRecordOptions(enabled: boolean): RelatedRecordOptions {
  const [options, setOptions] = useState<RelatedRecordOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    (async () => {
      setLoading(true);
      const [deals, accounts, contacts, activities] = await Promise.allSettled([
        fetchDeals(LIMIT),
        fetchAccounts(LIMIT),
        fetchContacts({ limit: LIMIT }),
        fetchActivities({ limit: LIMIT }),
      ]);
      if (!active) return;

      const out: RelatedRecordOption[] = [];
      const bad: string[] = [];

      /** Coerces to an array: a wrong-shaped payload must not throw here. */
      const list = <T,>(r: PromiseSettledResult<T[]>, label: string): T[] => {
        if (r.status !== 'fulfilled') { bad.push(label); return []; }
        if (!Array.isArray(r.value)) { bad.push(label); return []; }
        return r.value;
      };

      for (const d of list<any>(deals, 'deals')) {
        if (!d?.id) continue;
        out.push({
          module: 'deal', id: String(d.id),
          name: d.name || String(d.id),
          detail: d.company_name || undefined,
        });
      }
      for (const a of list<any>(accounts, 'accounts')) {
        if (!a?.id) continue;
        out.push({
          module: 'account', id: String(a.id),
          name: a.name || String(a.id),
          detail: a.industry || undefined,
        });
      }
      for (const c of list<any>(contacts, 'contacts')) {
        if (!c?.id) continue;
        out.push({
          module: 'contact', id: String(c.id),
          // Fall back to the email rather than a placeholder name.
          name: c.name || c.email || String(c.id),
          detail: c.company || undefined,
        });
      }
      for (const act of list<any>(activities, 'activities')) {
        if (!act?.id) continue;
        out.push({
          module: 'activity', id: String(act.id),
          name: act.subject || String(act.id),
          detail: act.type || undefined,
        });
      }

      setOptions(out);
      setFailed(bad);
      setLoading(false);
    })();

    return () => { active = false; };
  }, [enabled]);

  return { options, loading, failed };
}

/** Human label for a module, for the picker's grouping and its chip. */
export const MODULE_LABEL: Record<DocumentModule, string> = {
  lead: 'Lead', deal: 'Deal', contact: 'Contact', account: 'Account', activity: 'Activity',
};
