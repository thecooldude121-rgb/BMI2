import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Billing — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * an invented plan and price, a module add-on charge, a next billing date, a card number fragment, a street address, three "Paid" invoices and usage figures (contacts, deals, storage, API calls), with upgrade buttons that opened an alert. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const BillingSettings: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Billing</h2>
      <p className="text-sm text-gray-600 mt-1">Plan, payment and invoices</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Billing"
          detail="There is no billing system: no plan, subscription, payment method, invoice or usage record is stored anywhere. Nothing on this page reflects what your workspace is charged."
        />
    </div>
  </div>
);

export default BillingSettings;
