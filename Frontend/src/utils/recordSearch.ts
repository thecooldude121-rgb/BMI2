import { fetchContactsPage } from './contactsApi';
import { fetchAccountsPage } from './accountsApi';
import { fetchDealsPage } from './dealsApi';
import { fetchLeadsPage } from './leadsApi';
import { fetchActivitiesPage } from './activitiesApi';

/**
 * Server-side record search for pickers — slice 6 (Group A item 4).
 *
 * Every picker used to load the first 200 contacts / accounts / deals once and
 * filter them in the browser, so record #201 could never be chosen, and leads
 * were not offered at all. This asks the list endpoint the server already pages
 * and searches (`?search=&limit=`), returning the first matches AND the
 * server's total, so a picker can say "Showing 10 of 4,312 — keep typing".
 * An empty query returns the most recently updated records.
 *
 * Every endpoint here is workspace-scoped on the server; this module adds no
 * filtering of its own.
 */
export type RecordKind = 'contact' | 'company' | 'deal' | 'lead' | 'activity';

export interface RecordOption {
  kind: RecordKind;
  id: string;
  label: string;
  /** Secondary line (company, industry, stage …); omitted when unknown. */
  detail?: string;
}

export interface RecordSearchResult { options: RecordOption[]; total: number }

export const RECORD_KIND_LABEL: Record<RecordKind, string> = {
  contact: 'Contact', company: 'Account', deal: 'Deal', lead: 'Lead', activity: 'Activity',
};

export const PICKER_PAGE = 10;

const join = (...parts: (string | null | undefined)[]) => parts.filter(p => p && String(p).trim()).join(' · ') || undefined;

export async function searchRecords(kind: RecordKind, query: string, limit = PICKER_PAGE): Promise<RecordSearchResult> {
  const search = query.trim() || undefined;
  switch (kind) {
    case 'contact': {
      const r = await fetchContactsPage({ search, limit, offset: 0, sort: search ? 'name' : 'updated_at', dir: search ? 'asc' : 'desc' });
      return {
        total: r.total,
        options: r.contacts.map(c => ({ kind, id: c.id, label: c.name?.trim() || c.email || c.id, detail: join(c.company, c.email) })),
      };
    }
    case 'company': {
      const r = await fetchAccountsPage({ search, limit, offset: 0, sort: search ? 'name' : 'updated_at', dir: search ? 'asc' : 'desc' });
      return { total: r.total, options: r.accounts.map(a => ({ kind, id: a.id, label: a.name || a.id, detail: join(a.industry, a.domain) })) };
    }
    case 'deal': {
      const r = await fetchDealsPage({ search, limit, offset: 0, sort: search ? 'name' : 'updated_at', dir: search ? 'asc' : 'desc' });
      return {
        total: r.total,
        options: r.deals.map((d: { id: string; name?: string; title?: string; company_name?: string; stage?: string }) => ({
          kind, id: d.id, label: d.name || d.title || d.id, detail: join(d.company_name, d.stage),
        })),
      };
    }
    case 'lead': {
      const r = await fetchLeadsPage({ search, limit, offset: 0 });
      return {
        total: r.total,
        options: r.leads.map(l => ({
          kind, id: String(l.id),
          label: [l.first_name, l.last_name].filter(Boolean).join(' ') || l.email || String(l.id),
          detail: join(l.company, l.email),
        })),
      };
    }
    case 'activity': {
      const r = await fetchActivitiesPage({ search, limit, offset: 0 });
      return { total: r.total, options: r.activities.map(a => ({ kind, id: a.id, label: a.subject || a.id, detail: join(a.type, a.company_name) })) };
    }
  }
}
