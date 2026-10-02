import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import { NotAvailable } from '../../components/common/NotAvailable';
import { Button } from '../../components/ui/Button';

/**
 * Lead sources (/crm/leads/integrations, linked from the Leads page).
 *
 * Rewritten 2026-10-03. This page used to show "BMI Lead Generation Tool —
 * Connected" (3,547 leads imported, "Real-time") and "BMI HRMS Module —
 * Connected" (892), plus Apollo/ZoomInfo cards and a banner promising
 * "unlimited leads … included FREE" — every status, count and price invented.
 * The HRMS card also implied HRMS feeds leads into this CRM, a cross-product
 * read CLAUDE.md rules out.
 *
 * What is real: the Lead Generation module link, whose status is served by
 * GET /module-links and managed under Settings → Connected Modules (admins and
 * managers). This page points there rather than restating a status it does
 * not fetch.
 */
const IntegrationsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lead Sources</h1>
          <p className="text-gray-600 mt-1">Where leads in this CRM can come from</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start gap-3">
            <Link2 className="h-5 w-5 text-indigo-600 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">BMI Lead Generation</h2>
              <p className="text-sm text-gray-600 mt-1">
                A separate BMI product that can send contacts into this CRM once it is linked.
                Whether it is linked, and the link itself, are managed by an admin or manager
                under Settings → Connected Modules.
              </p>
              <div className="mt-4">
                <Button onClick={() => navigate('/crm/settings')}>Open Settings</Button>
              </div>
            </div>
          </div>
        </div>

        <NotAvailable
          feature="Connecting a third-party lead provider"
          detail="No provider (Apollo.io, ZoomInfo, LinkedIn Sales Navigator, Lusha…) can be connected yet, and nothing is synced from one."
        />
      </div>
    </div>
  );
};

export default IntegrationsPage;
