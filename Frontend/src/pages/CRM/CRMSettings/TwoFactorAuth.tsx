import React from 'react';
import { Shield } from 'lucide-react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * PHASE 0 REWRITE — "Enable Two-Factor Authentication" previously just called
 * setEnabled(true), which rendered a green "2FA Enabled — Your account is
 * protected with two-factor authentication" panel. There was no enrolment, no
 * shared secret, no QR code and no recovery codes: the user was told their
 * account was protected when nothing had changed. Restore this page alongside a
 * real enrolment endpoint.
 */
const TwoFactorAuth: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-start gap-4">
          <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Why 2FA matters</h3>
            <p className="text-sm text-blue-800">
              Two-factor authentication requires a code from your phone in addition to your
              password, so a stolen password alone is not enough to sign in.
            </p>
          </div>
        </div>

        <NotAvailable
          feature="Two-factor authentication"
          detail="Enrolment is not built yet — there is no authenticator secret, QR code, or recovery-code storage. Your account is currently protected by your password alone."
        />
      </div>
    </div>
  );
};

export default TwoFactorAuth;
