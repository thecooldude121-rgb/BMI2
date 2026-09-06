import { fetchPipelines, buildStageLookup, isOpenWith } from '../utils/pipelinesApi';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  EnhancedAccount,
  AccountActivity,
  AccountNote,
  AccountDocument,
  AccountContact,
  AccountDeal,
  AccountFilter,
  AccountView,
  BulkAction,
  MergeAccountsRequest,
  AccountDuplicate,
  AccountImport,
  AccountKPI,
  AccountWorkflow
} from '../types/accounts';
import {
  fetchAccounts,
  createAccountViaAPI,
  updateAccountViaAPI,
  deleteAccountViaAPI,
} from '../utils/accountsApi';
import { fetchContacts } from '../utils/contactsApi';
import { fetchDeals } from '../utils/dealsApi';

interface AccountsContextType {
  accounts: EnhancedAccount[];
  /**
   * Pipeline-wide open-deal figures. Null while loading or if /deals failed —
   * the caller must render that differently from zero.
   */
  dealStats: { openCount: number; openValue: number } | null;
  /** True while accounts are being fetched. Show a skeleton, not an empty list. */
  loading: boolean;
  /** Non-null when the fetch failed. Distinguish "broken" from "no accounts". */
  error: string | null;
  refreshAccounts: () => Promise<void>;
  filteredAccounts: EnhancedAccount[];
  selectedAccountIds: string[];
  currentFilter: AccountFilter;
  currentView: AccountView | null;
  views: AccountView[];

  getAccountById: (id: string) => EnhancedAccount | undefined;
  getAccountHierarchy: (id: string) => EnhancedAccount[];
  getChildAccounts: (parentId: string) => EnhancedAccount[];

  createAccount: (account: Partial<EnhancedAccount>) => Promise<EnhancedAccount>;
  updateAccount: (id: string, updates: Partial<EnhancedAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  mergeAccounts: (request: MergeAccountsRequest) => Promise<EnhancedAccount>;

  getAccountActivities: (accountId: string) => AccountActivity[];
  createActivity: (activity: Omit<AccountActivity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<AccountActivity>;
  updateActivity: (id: string, updates: Partial<AccountActivity>) => Promise<void>;

  getAccountNotes: (accountId: string) => AccountNote[];
  createNote: (note: Omit<AccountNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<AccountNote>;
  updateNote: (id: string, updates: Partial<AccountNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  getAccountDocuments: (accountId: string) => AccountDocument[];
  uploadDocument: (document: Omit<AccountDocument, 'id' | 'createdAt'>) => Promise<AccountDocument>;
  deleteDocument: (id: string) => Promise<void>;

  getAccountContacts: (accountId: string) => AccountContact[];
  linkContact: (accountId: string, contactId: string, data: Partial<AccountContact>) => Promise<void>;
  unlinkContact: (accountId: string, contactId: string) => Promise<void>;

  linkDeal: (accountId: string, dealId: string) => Promise<void>;
  unlinkDeal: (accountId: string, dealId: string) => Promise<void>;

  applyFilter: (filter: AccountFilter) => void;
  clearFilter: () => void;

  setSelectedAccountIds: (ids: string[]) => void;
  executeBulkAction: (action: BulkAction) => Promise<void>;

  saveView: (view: Omit<AccountView, 'id' | 'createdAt'>) => Promise<AccountView>;
  deleteView: (id: string) => Promise<void>;
  applyView: (view: AccountView) => void;

  detectDuplicates: () => Promise<AccountDuplicate[]>;
  resolveDuplicate: (duplicateId: string, action: 'merge' | 'not_duplicate' | 'ignore') => Promise<void>;

  importAccounts: (file: File, mapping: Record<string, string>, options: any) => Promise<AccountImport>;
  exportAccounts: (accountIds: string[], format: 'csv' | 'xlsx') => Promise<string>;

  getKPIs: () => AccountKPI;

  workflows: AccountWorkflow[];
  createWorkflow: (workflow: Omit<AccountWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successCount' | 'failureCount'>) => Promise<AccountWorkflow>;
  updateWorkflow: (id: string, updates: Partial<AccountWorkflow>) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
};

interface AccountsProviderProps {
  children: ReactNode;
}

export const AccountsProvider: React.FC<AccountsProviderProps> = ({ children }) => {
  /**
   * generateSampleAccounts() is GONE, and the file with it.
   *
   * What it actually still supplied by the time this was written was narrower
   * than its reputation — six of its seven collections already returned `[]`,
   * and `accounts` was never read because the state below starts empty. Only
   * `views` was live. But it still shipped five fabricated companies (Acme
   * Corp, TechStart Inc, BigCo…) one line away from a `setAccounts`, which is
   * the standing hazard CLAUDE.md describes: a provider is where fabricated
   * data spreads invisibly, because every consumer inherits it and no single
   * component looks wrong.
   *
   * The six empty collections are now empty here, explicitly, with the reason
   * each one is empty written down. `accountDeals` in particular was the cause
   * of a wrong number on screen: getAccountDeals() filtered it, it was always
   * `[]`, so every account reported "Active Deals 0 / Total Pipeline $0" while
   * 25 real deals existed. An honest-looking zero is still a wrong answer.
   */
  const [accounts, setAccounts] = useState<EnhancedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // No API for account-level activities, notes or documents as first-class
  // account records. The account detail page reads the REAL /activities and
  // /documents endpoints directly instead of going through these.
  const [activities, setActivities] = useState<AccountActivity[]>([]);
  const [notes, setNotes] = useState<AccountNote[]>([]);
  const [documents, setDocuments] = useState<AccountDocument[]>([]);
  // The account<->contact link is contacts.company_id, a real FK, resolved in
  // refreshAccounts below rather than through this list.
  const [accountContacts, setAccountContacts] = useState<AccountContact[]>([]);
  // The account<->deal link is deals.company_id (migration 027). getAccountDeals
  // now reads it; this list survives only for linkDeal/unlinkDeal, which are
  // in-memory and have no callers.
  // Write-only: linkDeal/unlinkDeal still push into it, but nothing reads it —
  // getAccountDeals goes to the real company_id link now. Both of those
  // mutators are in-memory and have zero callers; they go when the account
  // edit form learns to set deals.company_id.
  const [, setAccountDeals] = useState<AccountDeal[]>([]);
  const [workflows, setWorkflows] = useState<AccountWorkflow[]>([]);

  /**
   * Saved views. UI presets, not business data, so defining them here is not
   * fabrication — but two of the three that used to live in the sample file
   * WERE broken: "HRMS Connections" filtered on `source: ['hrms']` and "High
   * Priority" on `priority`, and it sorted by `healthScore`. None of those has
   * a column on `companies`, so both views silently matched nothing while
   * presenting themselves as working filters. They are dropped until there is
   * something to filter on; only the unfiltered default remains.
   *
   * CORRECTION to an earlier note of mine: I justified keeping this state by
   * saying AccountsPage consumes it. IT DOES NOT. AccountsPage destructures
   * `views`, `currentView` and `applyView` from this context and reads none of
   * them — the compiler has been saying so all along as three TS6133s. The
   * whole saved-views surface here (views, currentView, applyView, createView,
   * updateView, deleteView) is unwired: nothing renders a view picker. That is
   * lesson 3/9 again and I walked into it while writing the fix for it.
   * Left in place rather than ripped out mid-cleanup — removing a six-method
   * slice of the context API is its own change, and it is logged in HANDOFF.
   */
  const [views, setViews] = useState<AccountView[]>([
    {
      id: 'view_001',
      name: 'All Accounts',
      description: 'View all accounts',
      isDefault: true,
      isPublic: true,
      // `filter` and `columns` — the sample fixture wrote `filters` and
      // `visibleColumns`, neither of which exists on AccountView. It type-
      // checked only because nothing ever read those keys back.
      filter: {},
      columns: ['name', 'industry', 'status'],
      sortBy: 'name',
      sortOrder: 'asc',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [duplicates, setDuplicates] = useState<AccountDuplicate[]>([]);

  /**
   * Pipeline-wide deal figures, from /deals. Kept separate from the accounts
   * list because deals cannot be attributed per account: `deals` has no
   * account_id, only a free-text company_name, and of 25 deals just one matches
   * a company name exactly. A per-account sum would therefore report 0 for
   * almost every account, which is why the "Active Deals" KPI read 0 while a
   * hardcoded twin next to it read 23.
   */
  const [dealStats, setDealStats] = useState<{ openCount: number; openValue: number } | null>(null);

  const [currentFilter, setCurrentFilter] = useState<AccountFilter>({});
  const [currentView, setCurrentView] = useState<AccountView | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  const refreshAccounts = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // Accounts, their contacts and the deal pipeline together. allSettled so a
      // failing contacts or deals request costs the counts, not the whole list.
      const [accountsRes, contactsRes, dealsRes] = await Promise.allSettled([
        fetchAccounts(),
        fetchContacts({ limit: 500 }),
        fetchDeals(500),
      ]);

      if (accountsRes.status === 'rejected') {
        // Surface the failure. Returning [] here is what hid the broken lead
        // endpoints for so long — an error must not look like an empty list.
        throw accountsRes.reason;
      }
      const loaded = accountsRes.value;

      // contacts.company_id is a REAL foreign key, so this join is exact. It is
      // the join that was missing entirely: nothing ever linked the two, which is
      // why every row read "0 contacts" with 20 contacts pointing at those very
      // accounts.
      let contactsByAccount: Map<string, AccountContact[]> | null = null;
      if (contactsRes.status === 'fulfilled') {
        contactsByAccount = new Map<string, AccountContact[]>();
        for (const c of contactsRes.value) {
          if (!c.companyId) continue;
          const list = contactsByAccount.get(c.companyId) ?? [];
          list.push({
            id: c.id,
            accountId: c.companyId,
            name: c.name,
            role: c.position || undefined,
            email: c.email,
            phone: c.phone,
            isPrimary: c.isPrimary,
          });
          contactsByAccount.set(c.companyId, list);
        }
      }

      // Deals only carry a company NAME. Matched case-insensitively on the
      // trimmed name — the best available and deliberately reported as "matched"
      // rather than "belonging to".
      // Deals now group by the REAL foreign key, deals.company_id (migration
      // 027), not by matching company_name text. The name match this replaces
      // was documented as "matched rather than belonging to", and it was worse
      // than that caveat implied: of 25 deals exactly one name matched a
      // company row, so it attributed 1 deal and missed everything else.
      //
      // An unlinked deal (22 of 25) is now correctly attributed to NO account,
      // rather than to whichever account happened to share its spelling.
      let dealsByAccount: Map<string, AccountDeal[]> | null = null;
      if (dealsRes.status === 'fulfilled') {
        dealsByAccount = new Map();
        let openCount = 0;
        let openValue = 0;
        // Outcome from the workspace's own stages. These two literals belong to
        // the default pipeline, so every closed Renewals and Partnerships deal
        // was counted as OPEN — inflating both the open-deal count and the
        // open pipeline value on every account.
        const stageLookup = buildStageLookup(await fetchPipelines().catch(() => []));
        const stillOpen = isOpenWith(stageLookup);
        for (const d of dealsRes.value) {
          if (!stillOpen(d)) continue;
          const value = Number(d.value) || 0;
          // Pipeline-wide totals count every open deal, linked or not — the
          // pipeline exists regardless of whether anyone has attributed it.
          openCount += 1;
          openValue += value;
          const key = String(d.company_id ?? '').trim();
          if (!key) continue;
          const list = dealsByAccount.get(key) ?? [];
          list.push({
            id: d.id,
            accountId: key,
            name: d.name || d.title || d.id,
            amount: value,
            stage: d.stage ?? undefined,
            closeDate: d.expected_close_date ?? undefined,
            probability: d.probability ?? undefined,
          });
          dealsByAccount.set(key, list);
        }
        setDealStats({ openCount, openValue });
      } else {
        setDealStats(null);
      }

      setAccounts(loaded.map(a => ({
        ...a,
        // undefined, not [], when the lookup did not run — see the type comment.
        relatedContacts: contactsByAccount ? (contactsByAccount.get(a.id) ?? []) : undefined,
        relatedDeals: dealsByAccount ? (dealsByAccount.get(a.id) ?? []) : undefined,
      })));
    } catch (e: any) {
      setError(e?.message ?? 'Could not load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refreshAccounts(); }, [refreshAccounts]);

  const filterAccounts = useCallback((filter: AccountFilter): EnhancedAccount[] => {
    return accounts.filter(account => {
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const matchesSearch =
          account.name.toLowerCase().includes(searchLower) ||
          account.description?.toLowerCase().includes(searchLower) ||
          account.industry?.toLowerCase().includes(searchLower) ||
          account.email?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (filter.type && filter.type.length > 0 && !filter.type.includes(account.type)) {
        return false;
      }

      if (filter.industry && filter.industry.length > 0 && !filter.industry.includes(account.industry)) {
        return false;
      }

      if (filter.accountSize && filter.accountSize.length > 0 && !filter.accountSize.includes(account.accountSize)) {
        return false;
      }

      if (filter.status && filter.status.length > 0 && !filter.status.includes(account.status)) {
        return false;
      }

      if (filter.rating && filter.rating.length > 0 && account.rating && !filter.rating.includes(account.rating)) {
        return false;
      }

      if (filter.ownerId && filter.ownerId.length > 0 && !filter.ownerId.includes(account.ownerId)) {
        return false;
      }

      if (filter.tags && filter.tags.length > 0) {
        const hasTag = filter.tags.some(tag => account.tags.includes(tag));
        if (!hasTag) return false;
      }

      if (filter.healthScoreRange) {
        if (filter.healthScoreRange.min !== undefined && (account.healthScore || 0) < filter.healthScoreRange.min) {
          return false;
        }
        if (filter.healthScoreRange.max !== undefined && (account.healthScore || 0) > filter.healthScoreRange.max) {
          return false;
        }
      }

      if (filter.revenueRange) {
        if (filter.revenueRange.min !== undefined && (account.annualRevenue || 0) < filter.revenueRange.min) {
          return false;
        }
        if (filter.revenueRange.max !== undefined && (account.annualRevenue || 0) > filter.revenueRange.max) {
          return false;
        }
      }

      return true;
    });
  }, [accounts]);

  const filteredAccounts = filterAccounts(currentFilter);

  const getAccountById = useCallback((id: string) => {
    return accounts.find(acc => acc.id === id);
  }, [accounts]);

  const getChildAccounts = useCallback((parentId: string) => {
    return accounts.filter(acc => acc.parentAccountId === parentId);
  }, [accounts]);

  const getAccountHierarchy = useCallback((id: string): EnhancedAccount[] => {
    const account = getAccountById(id);
    if (!account) return [];

    const hierarchy: EnhancedAccount[] = [account];
    let currentParentId = account.parentAccountId;

    while (currentParentId) {
      const parent = getAccountById(currentParentId);
      if (!parent) break;
      hierarchy.unshift(parent);
      currentParentId = parent.parentAccountId;
    }

    return hierarchy;
  }, [accounts, getAccountById]);

  // ── Accounts: real persistence via /api/v1/companies ──────────────────────
  // These four used to be setState-only, so every create/edit/delete was lost
  // on refresh. The interface is unchanged — it already returned Promises — so
  // no consumer needed touching.

  /**
   * Partial, not Omit<EnhancedAccount, 'id'|'createdAt'|'updatedAt'>.
   *
   * The Omit demanded every non-optional field on EnhancedAccount — type,
   * revenueCurrency, status, source, ownerId, createdBy, updatedBy, rating,
   * priority, dataConsent, doNotContact — none of which has a column on
   * `companies` and none of which mapAccountToPayload sends. It matches what
   * createAccountViaAPI already accepts, and it stops the account form having
   * to manufacture values for fields that go nowhere in order to typecheck.
   */
  const createAccount = async (
    accountData: Partial<EnhancedAccount>,
  ): Promise<EnhancedAccount> => {
    const created = await createAccountViaAPI(accountData);
    setAccounts(prev => [...prev, created]);
    return created;
  };

  const updateAccount = async (id: string, updates: Partial<EnhancedAccount>): Promise<void> => {
    const saved = await updateAccountViaAPI(id, updates);
    // Merge rather than replace: the server only knows the columns it stores, so
    // a wholesale swap would discard any richer client-side state on the record.
    setAccounts(prev => prev.map(acc => (acc.id === id ? { ...acc, ...saved } : acc)));
  };

  const deleteAccount = async (id: string): Promise<void> => {
    await deleteAccountViaAPI(id);
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const mergeAccounts = async (request: MergeAccountsRequest): Promise<EnhancedAccount> => {
    const primaryAccount = getAccountById(request.primaryAccountId);
    if (!primaryAccount) throw new Error('Primary account not found');

    // Merge is delete-the-losers only; it does not yet move contacts, deals or
    // activities onto the primary account, because those relationships have no
    // API. Deleting the secondaries server-side at least makes the outcome real
    // and consistent with what the UI shows.
    for (const secondaryId of request.secondaryAccountIds) {
      await deleteAccountViaAPI(secondaryId);
    }
    setAccounts(prev => prev.filter(acc => !request.secondaryAccountIds.includes(acc.id)));

    return primaryAccount;
  };

  const getAccountActivities = useCallback((accountId: string) => {
    return activities.filter(act => act.accountId === accountId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [activities]);

  const createActivity = async (activityData: Omit<AccountActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccountActivity> => {
    const newActivity: AccountActivity = {
      ...activityData,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setActivities(prev => [...prev, newActivity]);

    await updateAccount(activityData.accountId, {
      lastActivityDate: new Date().toISOString()
    });

    return newActivity;
  };

  const updateActivity = async (id: string, updates: Partial<AccountActivity>): Promise<void> => {
    setActivities(prev => prev.map(act =>
      act.id === id
        ? { ...act, ...updates, updatedAt: new Date().toISOString() }
        : act
    ));
  };

  const getAccountNotes = useCallback((accountId: string) => {
    return notes.filter(note => note.accountId === accountId && !note.deletedAt).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notes]);

  const createNote = async (noteData: Omit<AccountNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<AccountNote> => {
    const newNote: AccountNote = {
      ...noteData,
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setNotes(prev => [...prev, newNote]);
    return newNote;
  };

  const updateNote = async (id: string, updates: Partial<AccountNote>): Promise<void> => {
    setNotes(prev => prev.map(note =>
      note.id === id
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    ));
  };

  const deleteNote = async (id: string): Promise<void> => {
    setNotes(prev => prev.map(note =>
      note.id === id
        ? { ...note, deletedAt: new Date().toISOString() }
        : note
    ));
  };

  const getAccountDocuments = useCallback((accountId: string) => {
    return documents.filter(doc => doc.accountId === accountId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [documents]);

  const uploadDocument = async (documentData: Omit<AccountDocument, 'id' | 'createdAt'>): Promise<AccountDocument> => {
    const newDocument: AccountDocument = {
      ...documentData,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    setDocuments(prev => [...prev, newDocument]);
    return newDocument;
  };

  const deleteDocument = async (id: string): Promise<void> => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const getAccountContacts = useCallback((accountId: string) => {
    return accountContacts.filter(ac => ac.accountId === accountId);
  }, [accountContacts]);

  const linkContact = async (accountId: string, contactId: string, data: Partial<AccountContact>): Promise<void> => {
    const newLink: AccountContact = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accountId,
      // The flat shape everything else uses carries a display name; a link
      // created from a bare contactId has none until it is resolved.
      name: data.name ?? '',
      contactId,
      relationshipType: data.relationshipType || 'business',
      isPrimary: data.isPrimary || false,
      title: data.title,
      department: data.department,
      influenceLevel: data.influenceLevel || 'medium',
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAccountContacts(prev => [...prev, newLink]);
  };

  const unlinkContact = async (accountId: string, contactId: string): Promise<void> => {
    setAccountContacts(prev => prev.filter(ac =>
      !(ac.accountId === accountId && ac.contactId === contactId)
    ));
  };

  /*
   * getAccountDeals() was removed rather than repaired.
   *
   * It filtered a sample-seeded `accountDeals` array that is permanently
   * empty, so it returned [] for every account — which is why the detail page
   * reported "Active Deals 0 / Total Pipeline $0" against 25 real deals. The
   * obvious fix was to point it at `relatedDeals`; the reason not to is that
   * NOTHING CONSUMES IT any more. The account detail page queries
   * /deals?company_id= directly, which is the better path for a detail view:
   * targeted rather than sliced out of a 500-row list, and it includes closed
   * deals, which an account history needs and refreshAccounts filters out.
   *
   * A repaired-but-unread provider method is the trap recorded as lesson 3/9
   * in CLAUDE.md, so it goes. `relatedDeals` itself IS still read — by
   * AccountsPage, for the per-row deal counts — and that is where the switch
   * from name-matching to company_id above actually lands.
   */

  const linkDeal = async (accountId: string, dealId: string): Promise<void> => {
    const newLink: AccountDeal = {
      id: `deal_link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      accountId,
      dealId,
      isPrimaryAccount: true,
      createdAt: new Date().toISOString(),
    };

    setAccountDeals(prev => [...prev, newLink]);
  };

  const unlinkDeal = async (accountId: string, dealId: string): Promise<void> => {
    setAccountDeals(prev => prev.filter(ad =>
      !(ad.accountId === accountId && ad.dealId === dealId)
    ));
  };

  const applyFilter = (filter: AccountFilter) => {
    setCurrentFilter(filter);
  };

  const clearFilter = () => {
    setCurrentFilter({});
    setCurrentView(null);
  };

  const executeBulkAction = async (action: BulkAction): Promise<void> => {
    switch (action.action) {
      case 'update_status':
        action.accountIds.forEach(id => {
          updateAccount(id, { status: action.parameters?.status });
        });
        break;
      case 'update_owner':
        action.accountIds.forEach(id => {
          updateAccount(id, { ownerId: action.parameters?.ownerId });
        });
        break;
      case 'add_tags':
        action.accountIds.forEach(id => {
          const account = getAccountById(id);
          if (account) {
            const newTags = [...new Set([...account.tags, ...(action.parameters?.tags || [])])];
            updateAccount(id, { tags: newTags });
          }
        });
        break;
      case 'delete':
        action.accountIds.forEach(id => {
          deleteAccount(id);
        });
        break;
    }
  };

  const saveView = async (viewData: Omit<AccountView, 'id' | 'createdAt'>): Promise<AccountView> => {
    const newView: AccountView = {
      ...viewData,
      id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    setViews(prev => [...prev, newView]);
    return newView;
  };

  const deleteView = async (id: string): Promise<void> => {
    setViews(prev => prev.filter(v => v.id !== id));
  };

  const applyView = (view: AccountView) => {
    setCurrentView(view);
    setCurrentFilter(view.filter);
  };

  const detectDuplicates = async (): Promise<AccountDuplicate[]> => {
    const newDuplicates: AccountDuplicate[] = [];

    for (let i = 0; i < accounts.length; i++) {
      for (let j = i + 1; j < accounts.length; j++) {
        const acc1 = accounts[i];
        const acc2 = accounts[j];

        const matchingFields: string[] = [];
        let score = 0;

        if (acc1.name.toLowerCase() === acc2.name.toLowerCase()) {
          matchingFields.push('name');
          score += 40;
        }

        if (acc1.email && acc2.email && acc1.email.toLowerCase() === acc2.email.toLowerCase()) {
          matchingFields.push('email');
          score += 30;
        }

        if (acc1.phone && acc2.phone && acc1.phone === acc2.phone) {
          matchingFields.push('phone');
          score += 20;
        }

        if (acc1.website && acc2.website && acc1.website.toLowerCase() === acc2.website.toLowerCase()) {
          matchingFields.push('website');
          score += 10;
        }

        if (score >= 50) {
          newDuplicates.push({
            id: `dup_${Date.now()}_${i}_${j}`,
            accountId1: acc1.id,
            accountId2: acc2.id,
            account1: acc1,
            account2: acc2,
            confidenceScore: score,
            matchingFields,
            similarityDetails: {},
            status: 'pending',
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }

    setDuplicates(newDuplicates);
    return newDuplicates;
  };

  const resolveDuplicate = async (duplicateId: string, action: 'merge' | 'not_duplicate' | 'ignore'): Promise<void> => {
    setDuplicates(prev => prev.map(dup =>
      dup.id === duplicateId
        ? { ...dup, status: action === 'merge' ? 'merged' : action === 'not_duplicate' ? 'not_duplicate' : 'ignored' }
        : dup
    ));
  };

  const importAccounts = async (file: File, mapping: Record<string, string>, options: any): Promise<AccountImport> => {
    const importRecord: AccountImport = {
      id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      fileSize: file.size,
      fieldMapping: mapping,
      importOptions: options,
      status: 'completed',
      totalRows: 0,
      successfulRows: 0,
      failedRows: 0,
      skippedRows: 0,
      errors: [],
      createdAccountIds: [],
      importedBy: 'current_user',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return importRecord;
  };

  const exportAccounts = async (accountIds: string[], format: 'csv' | 'xlsx'): Promise<string> => {
    const exportData = accounts.filter(acc => accountIds.includes(acc.id));

    const headers = ['Name', 'Type', 'Industry', 'Status', 'Owner', 'Created Date'];
    const rows = exportData.map(acc => [
      acc.name,
      acc.type,
      acc.industry,
      acc.status,
      acc.ownerId,
      new Date(acc.createdAt).toLocaleDateString()
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    return csv;
  };

  const getKPIs = (): AccountKPI => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

    const activeAccounts = accounts.filter(acc => acc.status === 'active');
    const newThisMonth = accounts.filter(acc =>
      new Date(acc.createdAt).getMonth() === thisMonth
    );
    const newLastMonth = accounts.filter(acc =>
      new Date(acc.createdAt).getMonth() === lastMonth
    );

    const accountsByIndustry: Record<string, number> = {};
    const accountsBySize: Record<string, number> = {};
    const accountsByType: Record<string, number> = {};

    accounts.forEach(acc => {
      accountsByIndustry[acc.industry] = (accountsByIndustry[acc.industry] || 0) + 1;
      accountsBySize[acc.accountSize] = (accountsBySize[acc.accountSize] || 0) + 1;
      accountsByType[acc.type] = (accountsByType[acc.type] || 0) + 1;
    });

    // These three summed `relatedDeals`/`relatedContacts`, which mapRowToAccount
    // deliberately never populates — so all three were structurally 0 forever,
    // regardless of how much real data existed. That is what made the derived
    // "Active Deals" card read 0 next to a hardcoded twin reading 23.
    //
    // Deals are pipeline-wide: they carry no account_id, so they cannot be
    // attributed per account (see dealStats).
    const totalDeals = dealStats?.openCount ?? 0;
    const totalRevenue = dealStats?.openValue ?? 0;
    // Contacts CAN be attributed — contacts.company_id is a real FK — and
    // relatedContacts now holds the real records, so this sum is exact.
    const totalContacts = accounts.reduce((sum, acc) => sum + (acc.relatedContacts?.length ?? 0), 0);
    const hrmsAccounts = accounts.filter(acc => acc.source === 'hrms' || acc.hrmsConnection?.hasConnection).length;

    return {
      totalAccounts: accounts.length,
      activeAccounts: activeAccounts.length,
      newAccountsThisMonth: newThisMonth.length,
      newAccountsLastMonth: newLastMonth.length,
      accountsWithRecentActivity: accounts.filter(acc => {
        const lastActivity = acc.lastActivityDate ? new Date(acc.lastActivityDate) : null;
        if (!lastActivity) return false;
        const daysSince = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 30;
      }).length,
      accountsAtRisk: accounts.filter(acc => (acc.healthScore || 0) < 50).length,
      averageHealthScore: accounts.reduce((sum, acc) => sum + (acc.healthScore || 0), 0) / (accounts.length || 1),
      averageEngagementScore: accounts.reduce((sum, acc) => sum + (acc.engagementScore || 0), 0) / (accounts.length || 1),
      averageDealValue: totalRevenue / (totalDeals || 1),
      totalDeals,
      totalRevenue,
      totalContacts,
      hrmsAccounts,
      topAccountsByRevenue: accounts
        .filter(acc => acc.annualRevenue)
        .sort((a, b) => (b.annualRevenue || 0) - (a.annualRevenue || 0))
        .slice(0, 10),
      topAccountsByDeals: [],
      accountsByIndustry,
      accountsBySize,
      accountsByType,
    };
  };

  const createWorkflow = async (workflowData: Omit<AccountWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successCount' | 'failureCount'>): Promise<AccountWorkflow> => {
    const newWorkflow: AccountWorkflow = {
      ...workflowData,
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setWorkflows(prev => [...prev, newWorkflow]);
    return newWorkflow;
  };

  const updateWorkflow = async (id: string, updates: Partial<AccountWorkflow>): Promise<void> => {
    setWorkflows(prev => prev.map(wf =>
      wf.id === id
        ? { ...wf, ...updates, updatedAt: new Date().toISOString() }
        : wf
    ));
  };

  const deleteWorkflow = async (id: string): Promise<void> => {
    setWorkflows(prev => prev.filter(wf => wf.id !== id));
  };

  const value: AccountsContextType = {
    accounts,
    dealStats,
    loading,
    error,
    refreshAccounts,
    filteredAccounts,
    selectedAccountIds,
    currentFilter,
    currentView,
    views,

    getAccountById,
    getAccountHierarchy,
    getChildAccounts,

    createAccount,
    updateAccount,
    deleteAccount,
    mergeAccounts,

    getAccountActivities,
    createActivity,
    updateActivity,

    getAccountNotes,
    createNote,
    updateNote,
    deleteNote,

    getAccountDocuments,
    uploadDocument,
    deleteDocument,

    getAccountContacts,
    linkContact,
    unlinkContact,

    linkDeal,
    unlinkDeal,

    applyFilter,
    clearFilter,

    setSelectedAccountIds,
    executeBulkAction,

    saveView,
    deleteView,
    applyView,

    detectDuplicates,
    resolveDuplicate,

    importAccounts,
    exportAccounts,

    getKPIs,

    workflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
  };

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  );
};
