import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Invoices — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * three invented invoices marked "Paid" with dead download buttons. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const Invoices: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
      <p className="text-sm text-gray-600 mt-1">Billing history</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Invoice history"
          detail="No invoice has ever been issued through this CRM, so there is no billing history to list."
        />
    </div>
  </div>
);

export default Invoices;
