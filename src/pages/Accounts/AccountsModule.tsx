import React from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { AccountsProvider } from '../../contexts/AccountsContext';
import EnhancedAccountDetailView from './EnhancedAccountDetailView';
import TechStartDetailView from './TechStartDetailView';
import { Building2 } from 'lucide-react';

const AccountsListPlaceholder: React.FC = () => {
  return (
    <div className="h-full p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">
            This is the simple Accounts module view.
          </p>
          <p className="text-sm text-gray-500">
            For the full CRM Accounts experience, navigate to CRM → Accounts
          </p>
        </div>
      </div>
    </div>
  );
};

const AccountDetailRouter: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();

  if (accountId === 'ACC-2024-0089') {
    return <TechStartDetailView />;
  }

  return <EnhancedAccountDetailView />;
};

const AccountsModule: React.FC = () => {
  return (
    <AccountsProvider>
      <Routes>
        <Route path="/" element={<AccountsListPlaceholder />} />
        <Route path="/:accountId" element={<AccountDetailRouter />} />
      </Routes>
    </AccountsProvider>
  );
};

export default AccountsModule;
