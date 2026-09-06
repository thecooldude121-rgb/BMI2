import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Building2, CheckCircle, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Create an account.
 *
 * POST /auth/register has existed since the backend was written and had no UI at
 * all, so the only way to create an account was a curl call. That is half of the
 * "Auth + Workspace shell" item — the app shipped a login form with no way to
 * obtain something to log in with.
 *
 * INVITE-ONLY. Open self-registration was a live exposure: the form joined the
 * existing workspace with no authentication, so anyone reaching this URL got a
 * `sales` account that could read every contact, company and deal in the tenant.
 * An invite token is now required, and it — not this page — determines which
 * workspace is joined and which role is granted.
 *
 * DELIBERATELY NOT HERE (both belong to the Settings module):
 *  - creating a NEW workspace
 *  - the admin UI for issuing invites (POST /invites exists; Settings will use it)
 *
 * The server owns every rule that matters — password length, email uniqueness
 * within the workspace, and the role granted. The checks below are there to save
 * a round trip, never as the authority: the role, for instance, is always
 * 'sales' server-side and cannot be influenced from here.
 */

const API_BASE = 'http://localhost:5001/api/v1';
const MIN_PASSWORD_LENGTH = 8; // mirrors authController.register

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [searchParams] = useSearchParams();
  // The invite comes from the link the admin sent. It is never typed in and never
  // defaulted: no token means no account.
  const inviteToken = searchParams.get('invite') ?? '';

  const [form, setForm] = useState<FormState>({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in? Nothing to do here.
  useEffect(() => { if (user) navigate('/', { replace: true }); }, [user, navigate]);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState | 'general', string>> = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          invite_token: inviteToken,
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Show the server's own message — "already registered in this workspace",
        // "workspace_slug is required", "no workspace configured" are all
        // different problems and the user should see which one they hit.
        setErrors({ general: json.message || 'Could not create your account. Please try again.' });
        return;
      }

      // Register returns a token, but signing in through the normal login path
      // keeps ONE code path for establishing a session — so a change to how
      // sessions are stored can never leave registration behind.
      const result = await login(form.email.trim(), form.password);
      if (result.ok) {
        navigate('/', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch {
      setErrors({ general: 'Could not reach the server. Check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // No invite in the URL: there is nothing this page can do. Shown before the
  // form rather than letting someone fill it in and be rejected on submit.
  if (!inviteToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Building2 className="h-8 w-8 text-brand-600" aria-hidden="true" />
            <span className="text-2xl font-bold text-gray-900">BMI Platform</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">You need an invite</h1>
            <p className="text-sm text-gray-600">
              Accounts are created by invitation only. Ask an admin in your workspace to
              send you an invite link — it will bring you back to this page.
            </p>
            <Link
              to="/login"
              className="inline-block mt-6 text-sm text-brand-600 font-medium hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const field = (hasError: boolean) =>
    `w-full pl-10 pr-4 py-2.5 border ${hasError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Building2 className="h-8 w-8 text-brand-600" aria-hidden="true" />
          <span className="text-2xl font-bold text-gray-900">BMI Platform</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-600 mb-6 text-sm">
            You've been invited to a workspace. Use the email address the invite was sent to.
          </p>

          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2" role="alert">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <div className="relative">
                  <User className="h-4 w-4 text-gray-400 absolute left-3 top-3.5" aria-hidden="true" />
                  <input
                    id="firstName" type="text" value={form.firstName} onChange={set('firstName')}
                    className={field(!!errors.firstName)} aria-invalid={!!errors.firstName} autoComplete="given-name"
                  />
                </div>
                {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <div className="relative">
                  <User className="h-4 w-4 text-gray-400 absolute left-3 top-3.5" aria-hidden="true" />
                  <input
                    id="lastName" type="text" value={form.lastName} onChange={set('lastName')}
                    className={field(!!errors.lastName)} aria-invalid={!!errors.lastName} autoComplete="family-name"
                  />
                </div>
                {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Work email
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-gray-400 absolute left-3 top-3.5" aria-hidden="true" />
                <input
                  id="email" type="email" value={form.email} onChange={set('email')}
                  className={field(!!errors.email)} aria-invalid={!!errors.email} autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3.5" aria-hidden="true" />
                <input
                  id="password" type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={set('password')} className={field(!!errors.password)}
                  aria-invalid={!!errors.password} autoComplete="new-password"
                />
                <button
                  type="button" onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                    : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              {errors.password
                ? <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                : <p className="text-xs text-gray-500 mt-1">At least {MIN_PASSWORD_LENGTH} characters.</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-gray-400 absolute left-3 top-3.5" aria-hidden="true" />
                <input
                  id="confirmPassword" type={showPassword ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={set('confirmPassword')} className={field(!!errors.confirmPassword)}
                  aria-invalid={!!errors.confirmPassword} autoComplete="new-password"
                />
                {form.confirmPassword !== '' && form.confirmPassword === form.password && (
                  <CheckCircle className="h-4 w-4 text-green-600 absolute right-3 top-3.5" aria-hidden="true" />
                )}
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" fullWidth size="lg" loading={submitting}>
              Create account
            </Button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
