import React from 'react';
import { Shield } from 'lucide-react';
import { NotAvailable } from '../../../components/common/NotAvailable';

/**
 * Security settings.
 *
 * PHASE 0 REWRITE — every claim on this page used to be fabricated:
 *   - a hardcoded placeholder API key, styled as a live secret, presented to the
 *     user as their own (prefix deliberately not repeated here so secret
 *     scanners don't flag this file)
 *   - three invented active sessions with invented IP addresses
 *   - an invented failed login attempt from 185.220.101.5, which a user would
 *     reasonably read as evidence their account had been attacked
 *   - "Enable 2FA" flipped a green "Enabled" badge with no enrolment, no secret
 *     and no QR code, telling the user their account was protected when it was not
 *
 * All of it is removed. None of these features have a backend: there is no API-key
 * table, no session store (auth is a stateless JWT), no login-attempt log, and no
 * 2FA enrolment. Restore each section only alongside the endpoint that backs it.
 */
const SecuritySettings: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Security</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your account security settings</p>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-start gap-4">
          <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">How your account is secured today</h3>
            <p className="text-sm text-blue-800">
              Sign-in uses your email and password, and your password is stored as a bcrypt hash.
              Sessions are stateless access tokens that expire after 7 days. The additional controls
              below are not built yet — nothing on this page can change your security settings.
            </p>
          </div>
        </div>

        <NotAvailable
          feature="Two-factor authentication"
          detail="There is no enrolment flow, authenticator secret, or recovery code storage behind this yet. Until there is, your account is protected by your password alone."
        />

        <NotAvailable
          feature="API keys"
          detail="The API has no key-issuing endpoint — programmatic access currently uses the same short-lived token as the web app."
        />

        <NotAvailable
          feature="Active session management"
          detail="Sign-in issues a stateless token, so there is no server-side session list to show and no way to revoke one early. Signing out clears the token in this browser only."
        />

        <NotAvailable
          feature="Login history"
          detail="Sign-in attempts are not recorded yet, so there is no history to display."
        />
      </div>
    </div>
  );
};

export default SecuritySettings;
