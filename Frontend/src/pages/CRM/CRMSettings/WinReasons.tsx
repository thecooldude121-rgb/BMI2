import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Win / Loss Reasons — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * an invented list of win and loss reasons presented as this workspace's configuration. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const WinReasons: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Win / Loss Reasons</h2>
      <p className="text-sm text-gray-600 mt-1">Reasons recorded when a deal closes</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Win / loss reason configuration"
          detail="No reason list is stored for this workspace, and closing a deal does not record a reason from one."
        />
    </div>
  </div>
);

export default WinReasons;
