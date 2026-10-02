import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Delete Account — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * an account-deletion screen whose button did nothing. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const DataDeletion: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Delete Account</h2>
      <p className="text-sm text-gray-600 mt-1">Permanently delete your account</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Account deletion"
          detail="There is no account-deletion flow. An admin or manager can deactivate a member under Team Management, which is soft and reversible."
        />
    </div>
  </div>
);

export default DataDeletion;
