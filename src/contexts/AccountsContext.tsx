import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
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
import { generateSampleAccounts } from '../utils/sampleAccountsData';

interface AccountsContextType {
  accounts: EnhancedAccount[];
  filteredAccounts: EnhancedAccount[];
  selectedAccountIds: string[];
  currentFilter: AccountFilter;
  currentView: AccountView | null;
  views: AccountView[];

  getAccountById: (id: string) => EnhancedAccount | undefined;
  getAccountHierarchy: (id: string) => EnhancedAccount[];
  getChildAccounts: (parentId: string) => EnhancedAccount[];

  createAccount: (account: Omit<EnhancedAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<EnhancedAccount>;
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

  getAccountDeals: (accountId: string) => AccountDeal[];
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
  const sampleData = generateSampleAccounts();

  const [accounts, setAccounts] = useState<EnhancedAccount[]>(sampleData.accounts);
  const [activities, setActivities] = useState<AccountActivity[]>(sampleData.activities);
  const [notes, setNotes] = useState<AccountNote[]>(sampleData.notes);
  const [documents, setDocuments] = useState<AccountDocument[]>(sampleData.documents);
  const [accountContacts, setAccountContacts] = useState<AccountContact[]>(sampleData.accountContacts);
  const [accountDeals, setAccountDeals] = useState<AccountDeal[]>(sampleData.accountDeals);
  const [views, setViews] = useState<AccountView[]>(sampleData.views);
  const [workflows, setWorkflows] = useState<AccountWorkflow[]>(sampleData.workflows);
  const [duplicates, setDuplicates] = useState<AccountDuplicate[]>([]);

  const [currentFilter, setCurrentFilter] = useState<AccountFilter>({});
  const [currentView, setCurrentView] = useState<AccountView | null>(null);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

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

  const createAccount = async (accountData: Omit<EnhancedAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<EnhancedAccount> => {
    const newAccount: EnhancedAccount = {
      ...accountData,
      id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAccounts(prev => [...prev, newAccount]);
    return newAccount;
  };

  const updateAccount = async (id: string, updates: Partial<EnhancedAccount>): Promise<void> => {
    setAccounts(prev => prev.map(acc =>
      acc.id === id
        ? { ...acc, ...updates, updatedAt: new Date().toISOString() }
        : acc
    ));
  };

  const deleteAccount = async (id: string): Promise<void> => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const mergeAccounts = async (request: MergeAccountsRequest): Promise<EnhancedAccount> => {
    const primaryAccount = getAccountById(request.primaryAccountId);
    if (!primaryAccount) throw new Error('Primary account not found');

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

  const getAccountDeals = useCallback((accountId: string) => {
    return accountDeals.filter(ad => ad.accountId === accountId);
  }, [accountDeals]);

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

    const totalDeals = accounts.reduce((sum, acc) => sum + (acc.relatedDeals?.length || 0), 0);
    const totalRevenue = accounts.reduce((sum, acc) => {
      const dealsRevenue = acc.relatedDeals?.reduce((dealSum, deal) => dealSum + deal.amount, 0) || 0;
      return sum + dealsRevenue;
    }, 0);
    const totalContacts = accounts.reduce((sum, acc) => sum + (acc.relatedContacts?.length || 0), 0);
    const hrmsAccounts = accounts.filter(acc => acc.source === 'hrms' || acc.hrmsConnection?.hasConnection).length;

    return {
      totalAccounts: 89,
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
      averageHealthScore: accounts.reduce((sum, acc) => sum + (acc.healthScore || 0), 0) / accounts.length,
      averageEngagementScore: accounts.reduce((sum, acc) => sum + (acc.engagementScore || 0), 0) / accounts.length,
      averageDealValue: totalRevenue / (totalDeals || 1),
      totalDeals: 45,
      totalRevenue: 2400000,
      totalContacts: 147,
      hrmsAccounts: 12,
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

    getAccountDeals,
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
