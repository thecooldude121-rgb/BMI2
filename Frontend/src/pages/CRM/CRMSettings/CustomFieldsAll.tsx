import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Custom Fields — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * invented field definitions presented as this workspace's configuration, "added successfully" alerts for fields that were never saved, and developer notes ("LEADS (Module 2)"). None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const CustomFieldsAll: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Custom Fields</h2>
      <p className="text-sm text-gray-600 mt-1">Extra fields on leads, contacts, accounts and deals</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Custom field configuration"
          detail="There is no custom-field definition table or endpoint. Fields added here were never saved and never appeared on any record."
        />
    </div>
  </div>
);

export default CustomFieldsAll;
