import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useAccounts } from '../../contexts/AccountsContext';
import CRMNavigation from '../../components/CRM/CRMNavigation';

const AccountEditPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { getAccountById } = useAccounts();

  const account = accountId ? getAccountById(accountId) : undefined;

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMNavigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Account not found</p>
            <button
              onClick={() => navigate('/crm/accounts')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Back to Accounts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/crm/accounts/${accountId}`)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to {account.name}</span>
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Edit Account</h1>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">
              {account.name}
            </h2>
            <p className="text-blue-700">
              {account.industry} • {account.employeeCount || 0} employees
            </p>
          </div>

          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              The account edit functionality is coming soon.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This will include a comprehensive form to update all account details, custom fields, and relationships.
            </p>
            <button
              onClick={() => navigate(`/crm/accounts/${accountId}`)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return to Account Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountEditPage;
