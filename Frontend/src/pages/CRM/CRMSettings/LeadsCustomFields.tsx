import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Lead Custom Fields — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * invented field definitions presented as this workspace's configuration. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const LeadsCustomFields: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Lead Custom Fields</h2>
      <p className="text-sm text-gray-600 mt-1">Extra fields on leads</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Custom field management for leads"
          detail="There is no custom-field definition table or endpoint yet."
        />
    </div>
  </div>
);

export default LeadsCustomFields;
