import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Plan — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * an invented plan name, monthly price, renewal date and feature list, with Upgrade / Change Plan buttons. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const BillingPlan: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Plan</h2>
      <p className="text-sm text-gray-600 mt-1">Your subscription plan</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Plan management"
          detail="No plan or subscription is recorded for this workspace, so there is no current plan to show or change."
        />
    </div>
  </div>
);

export default BillingPlan;
