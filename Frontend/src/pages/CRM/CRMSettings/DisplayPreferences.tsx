import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Display — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * a theme and layout selector held in local state that was never saved and changed nothing. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const DisplayPreferences: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Display</h2>
      <p className="text-sm text-gray-600 mt-1">Theme and layout</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Saving display preferences"
          detail="No theme or layout preference is stored and the CRM has no dark theme to switch to."
        />
    </div>
  </div>
);

export default DisplayPreferences;
