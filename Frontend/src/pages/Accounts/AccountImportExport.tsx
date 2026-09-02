import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CsvImportPanel from '../../components/CRM/CsvImportPanel';
import { ACCOUNT_FIELDS } from '../../utils/csvImportSpec';
import { importAccountsViaAPI } from '../../utils/importApi';
import { NotAvailable } from '../../components/common/NotAvailable';

/**
 * Account CSV import, routed at /crm/accounts/import-export and reached from the
 * Import button on the accounts list.
 *
 * WHAT THIS REPLACES: twelve lines that rendered a heading and the sentence
 * "This component will handle CSV/XLS import and export functionality." The
 * button worked, the navigation succeeded, and the user arrived at a page
 * promising the feature in the future tense. Because it never used
 * <NotAvailable>, it also appeared in no inventory of unfinished work — see the
 * audit-tooling note in HANDOFF.md.
 *
 * IMPORT IS BUILT; EXPORT IS NOT, and the two are labelled differently rather
 * than sharing one vague heading. The accounts list already exports the
 * selected rows as JSON; a CSV export from this page is a separate small piece
 * of work and says so honestly below instead of being implied by the route name.
 */
const AccountImportExport: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <button
          onClick={() => navigate('/crm/accounts')}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to accounts
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Import Accounts</h1>
        <p className="mt-1 text-sm text-gray-600">
          Load accounts from a Salesforce, HubSpot or spreadsheet export. You will see exactly
          what will be created before anything is saved.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <CsvImportPanel
          entityPlural="accounts"
          fields={ACCOUNT_FIELDS}
          templateFilename="accounts_template.csv"
          dedupeKey="name"
          dedupeLabel="account name"
          onImport={importAccountsViaAPI}
        />
      </div>

      <NotAvailable
        feature="Exporting accounts to CSV from this page"
        detail="Select accounts on the accounts list and use Export there to download them as JSON. A CSV export has not been built."
      />
    </div>
  );
};

export default AccountImportExport;
