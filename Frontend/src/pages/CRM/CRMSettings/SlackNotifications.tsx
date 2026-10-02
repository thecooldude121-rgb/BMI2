import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Slack — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * a green "Slack Connected" status naming a #sales-team channel, with a Disconnect button, over no Slack integration at all. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const SlackNotifications: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Slack</h2>
      <p className="text-sm text-gray-600 mt-1">Send CRM notifications to Slack</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Slack notification delivery"
          detail="There is no Slack integration. Nothing is connected and no notification is sent to Slack."
        />
    </div>
  </div>
);

export default SlackNotifications;
