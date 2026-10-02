import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Email Templates — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * invented templates with usage counts and open/reply rates, and "saved successfully" alerts for saves that went nowhere. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const EmailTemplatesManager: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Email Templates</h2>
      <p className="text-sm text-gray-600 mt-1">Reusable email templates</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Template management"
          detail="There is no templates table or endpoint, so no template can be created, saved or used, and no open or reply rate is measured."
        />
    </div>
  </div>
);

export default EmailTemplatesManager;
