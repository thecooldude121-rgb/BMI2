import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * API Keys — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * two invented "live" and "test" secret keys (prefixes not repeated here) with copy, reveal and delete controls, and a "Create New Key" button that did nothing. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const APIKeys: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
      <p className="text-sm text-gray-600 mt-1">Programmatic access to this workspace</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="API key management"
          detail="There is no screen for issuing keys yet. Module-to-module service credentials do exist on the server (admin or manager, through the API), but no key is shown or created here. No key on this page was ever real."
        />
    </div>
  </div>
);

export default APIKeys;
