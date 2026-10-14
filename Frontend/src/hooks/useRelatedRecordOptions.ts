import { useEffect, useState } from 'react';
import { searchRecords, type RecordKind } from '../utils/recordSearch';
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
 * SERVER SEARCH, NOT A PRELOAD (slice 6). It loaded the first 200 of each type
 * and filtered them in the browser, so the 201st deal could not be attached.
 * Now the box's text goes to each list endpoint (`?search=&limit=10`), the four
 * types in parallel, debounced; `allSettled`, so one failing endpoint costs one
 * type rather than the whole picker. `hidden` is how many matches the server
 * has beyond those shown, so the picker can say "keep typing".
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
  /** Matches the server holds beyond the ones returned, across all types. */
  hidden: number;
}

/**
 * `lead` is absent DELIBERATELY. The server accepts it, but nothing in this
 * modal ever offered leads and adding a fifth type is a product decision, not
 * a bug fix. Recorded here so its absence reads as a choice.
 */
const TYPES: { module: DocumentModule; kind: RecordKind; label: string }[] = [
  { module: 'deal', kind: 'deal', label: 'deals' },
  { module: 'account', kind: 'company', label: 'accounts' },
  { module: 'contact', kind: 'contact', label: 'contacts' },
  { module: 'activity', kind: 'activity', label: 'activities' },
];
const PER_TYPE = 10;

export function useRelatedRecordOptions(enabled: boolean, query = ''): RelatedRecordOptions {
  const [state, setState] = useState<RelatedRecordOptions>({ options: [], loading: false, failed: [], hidden: 0 });

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setState(s => ({ ...s, loading: true }));
    const t = setTimeout(async () => {
      const settled = await Promise.allSettled(TYPES.map(t => searchRecords(t.kind, query, PER_TYPE)));
      if (!active) return;
      const options: RelatedRecordOption[] = [];
      const failed: string[] = [];
      let hidden = 0;
      settled.forEach((r, i) => {
        const t = TYPES[i];
        if (r.status !== 'fulfilled') { failed.push(t.label); return; }
        // A record with no id would post an empty record_id — skipped, never emitted.
        for (const o of r.value.options) if (o.id) options.push({ module: t.module, id: String(o.id), name: o.label, detail: o.detail });
        hidden += Math.max(0, r.value.total - r.value.options.length);
      });
      setState({ options, loading: false, failed, hidden });
    }, 250);
    return () => { active = false; clearTimeout(t); };
  }, [enabled, query]);

  return state;
}

/** Human label for a module, for the picker's grouping and its chip. */
export const MODULE_LABEL: Record<DocumentModule, string> = {
  lead: 'Lead', deal: 'Deal', contact: 'Contact', account: 'Account', activity: 'Activity',
};
