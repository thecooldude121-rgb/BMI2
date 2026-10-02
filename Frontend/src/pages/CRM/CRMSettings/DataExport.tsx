import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Export Data — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * a "Request Export" button that did nothing. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const DataExport: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Export Data</h2>
      <p className="text-sm text-gray-600 mt-1">Download a copy of your workspace data</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Data export"
          detail="There is no export job behind this yet, so no export can be requested here. CSV export from individual list pages, where offered, is separate."
        />
    </div>
  </div>
);

export default DataExport;
