import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Integrations — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * invented "Active" integrations (Apollo.io, Gmail, Google Calendar, Slack, Zoom) with sync counts, "last sync" times, a "2,450 syncs" tile, an activity log, and developer notes ("Navigate to Screen 10.1"). None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const IntegrationsOverview: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Integrations</h2>
      <p className="text-sm text-gray-600 mt-1">Connected apps and data sync</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Connecting a third-party app"
          detail="No third-party app is connected and nothing is synced. The one real connection is the BMI Lead Generation link, under Connected Modules (admins and managers)."
        />
    </div>
  </div>
);

export default IntegrationsOverview;
