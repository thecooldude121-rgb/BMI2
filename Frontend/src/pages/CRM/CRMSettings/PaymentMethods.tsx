import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Payment Methods — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * an invented card number fragment and expiry marked "Default". None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const PaymentMethods: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
      <p className="text-sm text-gray-600 mt-1">Cards on file</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Payment method management"
          detail="No payment method is stored. No card has been charged or saved through this CRM."
        />
    </div>
  </div>
);

export default PaymentMethods;
