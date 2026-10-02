import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * In-App Notifications — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * toggles held in local state that were never saved. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const InAppNotifications: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">In-App Notifications</h2>
      <p className="text-sm text-gray-600 mt-1">Notifications shown inside the CRM</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="In-app notification setup"
          detail="No notification preference is stored and there is no in-app notification feed."
        />
    </div>
  </div>
);

export default InAppNotifications;
