import { useCallback, useEffect, useState } from 'react';
import type { Lead } from '../types/lead';
import { fetchLeadsFromAPI } from '../utils/leadsApi';
import { fetchDeals } from '../utils/dealsApi';
import { fetchTasks, fetchActivities } from '../utils/activitiesApi';
import type { TaskRecord, ActivityRecord } from '../utils/activitiesApi';
import { fetchContacts } from '../utils/contactsApi';
import type { Contact } from '../types/contact';
import { fetchAccounts } from '../utils/accountsApi';
import type { EnhancedAccount } from '../types/accounts';

/**
 * Real data for the dashboard.
 *
 * Replaces DataContext, which the dashboard and its four widgets were all
 * reading from. DataContext makes zero network calls: it seeds React state from
 * generateSampleData() and every write is a setState, so the numbers on the
 * landing page were invented and any edit vanished on refresh.
 *
 * Fetched here once and passed down as props rather than each widget calling
 * useData() for itself — five components sharing one context previously meant
 * one copy of the data; five components each fetching would mean five identical
 * round trips on every dashboard load.
 *
 * Deliberately NOT a context. The dashboard is the only consumer, and a context
 * is what let sample data spread to eighteen files unnoticed in the first place.
 */

/** Deal rows come back untyped from the API; this is the subset the dashboard reads. */
export interface DashboardDeal {
  id: string;
  title?: string | null;
  name?: string | null;
  value?: number | string | null;
  stage?: string | null;
  currency?: string | null;
  created_at?: string | null;
  /** Real columns, needed by the CRM dashboard's pipeline and top-deals panels. */
  company_name?: string | null;
  expected_close_date?: string | null;
  next_step?: string | null;
  probability?: number | null;
}

export interface DashboardData {
  leads: Lead[];
  deals: DashboardDeal[];
  tasks: TaskRecord[];
  activities: ActivityRecord[];
  /**
   * Added so /crm/dashboard can read its Contacts and Accounts tiles from the
   * same place /dashboard does. Both pages previously disagreed with the
   * Contacts and Accounts pages because CRMDashboard held literals ('147'
   * contacts against a real 20).
   */
  contacts: Contact[];
  accounts: EnhancedAccount[];
  loading: boolean;
  error: string | null;
  /**
   * True when any list came back exactly at its request limit, meaning there is
   * probably more and the totals derived from it are lower bounds rather than
   * exact. Surfaced rather than hidden: a pipeline total that silently omits
   * deals past the limit is the same class of untruth as a made-up one.
   */
  truncated: boolean;
  reload: () => void;
}

/**
 * High enough that the cap is not reached at current data volumes, low enough
 * not to pull the whole table into the browser. The real fix is a server-side
 * aggregate endpoint for the summary tiles; until then `truncated` tells the
 * user when the client-side sum has stopped being complete.
 */
const LIST_LIMIT = 500;

export function useDashboardData(): DashboardData {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<DashboardDeal[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [accounts, setAccounts] = useState<EnhancedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    // Guards against a state update after the dashboard unmounts, and against
    // an earlier slow response overwriting a newer one after a reload.
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      // allSettled, not all: one failing endpoint should degrade one widget, not
      // blank the whole dashboard. A partial dashboard that says which part
      // failed is more useful than an error page.
      const [leadsRes, dealsRes, tasksRes, activitiesRes, contactsRes, accountsRes] =
        await Promise.allSettled([
          fetchLeadsFromAPI({ limit: LIST_LIMIT }),
          fetchDeals(LIST_LIMIT),
          fetchTasks({ limit: LIST_LIMIT }),
          fetchActivities({ limit: 20 }),
          fetchContacts({ limit: LIST_LIMIT }),
          fetchAccounts(LIST_LIMIT),
        ]);

      if (!active) return;

      const failures: string[] = [];

      if (leadsRes.status === 'fulfilled') setLeads(leadsRes.value);
      else failures.push('leads');

      if (dealsRes.status === 'fulfilled') setDeals(dealsRes.value as DashboardDeal[]);
      else failures.push('deals');

      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value);
      else failures.push('tasks');

      if (activitiesRes.status === 'fulfilled') setActivities(activitiesRes.value);
      else failures.push('activity');

      if (contactsRes.status === 'fulfilled') setContacts(contactsRes.value);
      else failures.push('contacts');

      if (accountsRes.status === 'fulfilled') setAccounts(accountsRes.value);
      else failures.push('accounts');

      const atLimit = [leadsRes, dealsRes, tasksRes, contactsRes, accountsRes].some(
        (r) => r.status === 'fulfilled' && (r.value as unknown[]).length >= LIST_LIMIT,
      );
      setTruncated(atLimit);

      setError(
        failures.length === 0
          ? null
          : `Could not load ${failures.join(', ')}. Those figures are missing rather than zero.`,
      );
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  return { leads, deals, tasks, activities, contacts, accounts, loading, error, truncated, reload };
}

/** Deal value arrives as a numeric string from pg for NUMERIC columns. */
export const dealValue = (d: DashboardDeal): number => {
  const n = typeof d.value === 'string' ? Number.parseFloat(d.value) : d.value;
  return Number.isFinite(n) ? (n as number) : 0;
};

/**
 * deals.stage has no CHECK constraint, and the live table holds values outside
 * the pipeline_stages list — 'partner-evaluation' and 'renewal-quoted' among
 * them. So "is this deal closed" has to be asked by prefix rather than by
 * matching a known set, or those rows silently count as open pipeline.
 */
export const isClosedWon = (d: DashboardDeal): boolean => d.stage === 'closed-won';
export const isClosedLost = (d: DashboardDeal): boolean => d.stage === 'closed-lost';
export const isOpen = (d: DashboardDeal): boolean => !isClosedWon(d) && !isClosedLost(d);
