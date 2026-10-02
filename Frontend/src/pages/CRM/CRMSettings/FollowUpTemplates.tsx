import React from 'react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Follow-up Templates — NOT BUILT.
 *
 * Rewritten 2026-10-03 (step 4, sample-data sweep). This page used to render
 * invented templates with open and click counts. None of it was backed by a table or an endpoint, and nothing
 * resembling real security, billing or configuration state may render
 * unlabelled. Restore the real screen only alongside the API that backs it.
 */
const FollowUpTemplates: React.FC = () => (
  <div>
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-gray-900">Follow-up Templates</h2>
      <p className="text-sm text-gray-600 mt-1">Templates for follow-up emails</p>
    </div>
    <div className="space-y-6">
        <NotAvailable
          feature="Follow-up template management"
          detail="There is no templates table or endpoint, and no email is sent or tracked by this CRM."
        />
    </div>
  </div>
);

export default FollowUpTemplates;
