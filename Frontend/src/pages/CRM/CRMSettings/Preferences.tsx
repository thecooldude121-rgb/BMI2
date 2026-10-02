import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Preferences — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * toggles and selectors held in local state that were never saved, with developer notes ("Controls Screen 5.1 default view", "Dashboard (Screen 1.1)"). None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const Preferences: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
      <p className="text-sm text-gray-600 mt-1">Personal display and behaviour preferences</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Saving personal preferences"
          detail="No personal preference is stored, so nothing chosen here would change how the CRM behaves. Workspace-wide settings that are real live under Preferences \u2192 General."
        />
    </div>
  </div>
);

export default Preferences;
