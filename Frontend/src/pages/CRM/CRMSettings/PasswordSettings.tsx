import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { changeMyPassword, MIN_PASSWORD_LENGTH } from '../../../utils/profileApi';

/**
 * Change your own password — POST /auth/change-password.
 *
 * WHAT WAS HERE: `handleSave` was `console.log('Updating password')`. The form
 * collected a current password and a new one, the button said "Update Password",
 * and nothing left the browser. No error, no toast, no request — the user was
 * left believing their password had changed while their old one still worked.
 *
 * THE TOKEN THIS RETURNS MUST BE STORED, and that is the part worth reading
 * twice. The server bumps `users.token_version` inside the same UPDATE that
 * writes the new hash (migration 036), which invalidates every token minted
 * before the call — including the one this very request was authenticated with.
 * It hands back a fresh one. Dropping it does not fail here: this request
 * succeeds, the password really is changed, and the NEXT request the app makes
 * 401s, the boot rehydrate discards the token, and the user is bounced to the
 * login screen seconds after doing the responsible thing. `applyReissuedToken`
 * is called before anything else on success for exactly that reason.
 *
 * THE REQUIREMENTS LIST NOW MATCHES THE SERVER. It used to promise four rules —
 * uppercase, lowercase, a number, a special character — none of which
 * `authController.changePassword` enforces. It requires eight characters and a
 * value different from the current one, so that is what is shown. A checklist
 * that is not the rule is a different kind of fiction from a fake save, but it
 * is still the UI asserting something the backend does not do.
 */

const PasswordSettings: React.FC = () => {
  const { applyReissuedToken } = useAuth();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Checked here only because the server never sees the confirmation field —
  // it is a typing safeguard, not a policy. Everything else is the server's call.
  const mismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

  const handleSave = async () => {
    setError(null);
    setDone(false);

    if (!form.currentPassword || !form.newPassword) {
      setError('Enter your current password and a new one.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('The new password and its confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      const result = await changeMyPassword(form.currentPassword, form.newPassword);

      // FIRST, before any state update. If a render throws after this point the
      // password is still changed and the stored token must already be the live
      // one; the alternative is a session that is silently dead.
      applyReissuedToken(result.token);

      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setDone(true);
    } catch (e) {
      // The server's own words — "Current password is incorrect", "New password
      // must be at least 8 characters", or the rate limiter's 429 message after
      // repeated wrong guesses.
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const eye = (shown: boolean, toggle: () => void, label: string) => (
    <button
      type="button"
      aria-label={label}
      onClick={toggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      {shown ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Password Settings</h2>
        <p className="mt-1 text-sm text-gray-600">Update your password to keep your account secure</p>
      </div>

      <div className="space-y-6">
        {done && (
          <div role="status" className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
            <div className="text-sm text-green-800">
              <p className="font-medium text-green-900">Password updated.</p>
              {/* Said plainly because it is a real consequence the user should
                  know about, and because it is now true — before migration 036
                  this claim would have been false. */}
              <p className="mt-1">
                You are still signed in here. Every other session — other browsers and devices —
                has been signed out and will need the new password.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="current-password" className="mb-2 block text-sm font-medium text-gray-700">
            Current Password
          </label>
          <div className="relative">
            <input
              id="current-password"
              type={showCurrent ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={e => setForm({ ...form, currentPassword: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Enter current password"
            />
            {eye(showCurrent, () => setShowCurrent(!showCurrent), 'Show current password')}
          </div>
        </div>

        <div>
          <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-gray-700">
            New Password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNew ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
            />
            {eye(showNew, () => setShowNew(!showNew), 'Show new password')}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            At least {MIN_PASSWORD_LENGTH} characters, and different from your current password.
          </p>
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
            />
            {eye(showConfirm, () => setShowConfirm(!showConfirm), 'Show confirmed password')}
          </div>
          {mismatch && <p className="mt-1 text-xs text-red-600">The two passwords do not match.</p>}
        </div>

        {/*
          * What the server enforces, and nothing else. The previous list added
          * uppercase, lowercase, a digit and a symbol — a policy this product
          * does not have. Changing the real rule is a backend decision; stating
          * a rule the backend does not apply is just a UI that is wrong.
          */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-blue-900">Password requirements:</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• At least {MIN_PASSWORD_LENGTH} characters long</li>
            <li>• Different from your current password</li>
          </ul>
          <p className="mt-2 text-xs text-blue-700">
            Signing in elsewhere will require the new password — changing it here ends every other
            session on this account.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <Button onClick={handleSave} size="lg" disabled={saving}>
            <Lock className="h-4 w-4" />
            {saving ? 'Updating…' : 'Update Password'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PasswordSettings;
