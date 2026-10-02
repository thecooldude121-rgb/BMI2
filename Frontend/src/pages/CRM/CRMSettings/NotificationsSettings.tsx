import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Notifications — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * toggles held in local state, a "Notification preferences saved successfully!" alert for a save that went nowhere, and developer notes ("Leads (Module 2)", "Navigate to Screen 10.1 > Slack connector"). None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const NotificationsSettings: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
      <p className="text-sm text-gray-600 mt-1">Choose what you are notified about</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Notification setup"
          detail="No notification preference is stored and no notification is delivered by email, in-app or Slack. Changing a toggle here would not have changed anything."
        />
    </div>
  </div>
);

export default NotificationsSettings;
