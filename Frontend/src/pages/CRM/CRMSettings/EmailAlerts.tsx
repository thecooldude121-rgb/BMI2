import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Email Alerts — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * toggles held in local state that were never saved. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const EmailAlerts: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Email Alerts</h2>
      <p className="text-sm text-gray-600 mt-1">Notifications delivered by email</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Email alerting"
          detail="No alert preference is stored and no alert email is sent."
        />
    </div>
  </div>
);

export default EmailAlerts;
