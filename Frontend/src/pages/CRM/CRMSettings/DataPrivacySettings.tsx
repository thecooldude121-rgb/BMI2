import React from 'react';
import { Info } from 'lucide-react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Data & Privacy settings.
 *
 * PHASE 0 REWRITE — this page answered statutory obligations with alert():
 *   - "Request Export" promised an email with the user's data within 24 hours
 *   - a "recent exports" list offered all_data_export.zip (45 MB) for download,
 *     a file that has never existed
 *   - "Delete My Account" reported "Account deletion process initiated. You will
 *     receive a confirmation email."
 *   - retention windows and cookie/consent toggles reported "saved successfully"
 *     and were discarded on unmount
 *
 * Under GDPR/CCPA a data-subject access request and a deletion request are legal
 * duties with statutory deadlines. Telling a user their request is in progress
 * when no request exists is materially worse than offering nothing, so every
 * control here is removed until it is backed by a real endpoint.
 *
 * To implement properly you will need: an export job (write to object storage,
 * signed download URL, retention on the artefact itself), a deletion workflow
 * with a grace period and hard-delete across all tenant-scoped tables, and a
 * consent record that is stored and auditable — consent you cannot produce is
 * consent you did not obtain.
 */
const DataPrivacySettings: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Data &amp; Privacy</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your data, privacy, and account settings</p>
      </div>

      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex items-start gap-4">
          <Info className="h-6 w-6 text-amber-700 flex-shrink-0 mt-1" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-amber-900 mb-2">Requests are handled manually for now</h3>
            <p className="text-sm text-amber-800">
              Self-service data export and account deletion are not built yet. To request a copy of
              your data or ask for your account to be deleted, contact your administrator directly —
              those requests are carried out by hand against the database. Nothing on this page
              submits a request.
            </p>
          </div>
        </div>

        <NotAvailable
          feature="Exporting your data"
          detail="There is no export job or download endpoint yet, so no export can be requested or retrieved here."
        />

        <NotAvailable
          feature="Data retention controls"
          detail="Retention windows for deleted items and activity logs are not enforced anywhere yet, so setting them here would have no effect."
        />

        <NotAvailable
          feature="Privacy and cookie preferences"
          detail="Consent choices are not stored yet. A consent record has to be persisted and auditable to be meaningful, so these toggles are withheld rather than shown as saved."
        />

        <NotAvailable
          feature="Deleting your account"
          detail="There is no deletion workflow behind this yet. Ask your administrator to remove your account and its data."
        />
      </div>
    </div>
  );
};

export default DataPrivacySettings;
