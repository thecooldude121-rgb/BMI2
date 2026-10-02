import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Active Sessions — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * three invented devices (a MacBook in San Francisco, an iPhone, a Windows PC in New York) and a "Sign Out All Other Sessions" button that did nothing. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const Sessions: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Active Sessions</h2>
      <p className="text-sm text-gray-600 mt-1">Devices signed in to your account</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Active session management"
          detail="Sign-in issues a stateless token, so there is no server-side session list to show and no way to revoke one early. Signing out clears the token in this browser only."
        />
    </div>
  </div>
);

export default Sessions;
