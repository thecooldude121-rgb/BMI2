import React from 'react';
import { ArrowRight, CheckCircle, Shield, Lock, Users, Key, AlertTriangle } from 'lucide-react';

const LoginWireframe: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">BMI Platform Login Flow Documentation</h1>
          <p className="text-lg text-gray-600">Complete authentication workflow and security architecture</p>
        </div>

        {/* Flow Diagram */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <ArrowRight className="h-6 w-6 mr-2 text-blue-600" />
            Authentication Flow
          </h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">User Accesses Login Page</h3>
                <p className="text-gray-600 mb-3">User navigates to <code className="bg-gray-100 px-2 py-1 rounded text-sm">/login</code></p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>Check if user is already authenticated</li>
                  <li>If authenticated, redirect to appropriate dashboard based on role</li>
                  <li>Load remembered email if "Remember Me" was previously checked</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">User Enters Credentials</h3>
                <p className="text-gray-600 mb-3">Real-time validation and security checks</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>Email format validation (regex)</li>
                  <li>Password strength indicator (weak/medium/strong)</li>
                  <li>Caps Lock detection and warning</li>
                  <li>Field-level error messages on blur</li>
                  <li>Show/hide password toggle</li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Form Submission & Validation</h3>
                <p className="text-gray-600 mb-3">Client-side validation before API call</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>Validate all required fields</li>
                  <li>Check rate limiting (max 5 attempts)</li>
                  <li>Display loading state</li>
                  <li>Disable form during submission</li>
                </ul>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication</h3>
                <p className="text-gray-600 mb-3">Supabase Auth API call</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>Call Supabase <code className="bg-gray-100 px-2 py-1 rounded text-sm">auth.signInWithPassword()</code></li>
                  <li>Handle authentication response</li>
                  <li>Store session token</li>
                  <li>Retrieve user role and permissions from database</li>
                </ul>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                5
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Success Handling</h3>
                <p className="text-gray-600 mb-3">Post-authentication actions</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 text-sm">
                  <li>Store "Remember Me" preference in localStorage</li>
                  <li>Update AuthContext with user data</li>
                  <li>Load user permissions into state</li>
                  <li>Initialize session management</li>
                  <li>Redirect based on user role</li>
                </ul>
              </div>
            </div>

            {/* Step 6 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                ✓
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Role-Based Redirect</h3>
                <p className="text-gray-600 mb-3">Navigate to appropriate dashboard</p>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Admin:</span>
                    <code className="bg-white px-3 py-1 rounded border border-gray-200">/settings</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Manager:</span>
                    <code className="bg-white px-3 py-1 rounded border border-gray-200">/</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Sales:</span>
                    <code className="bg-white px-3 py-1 rounded border border-gray-200">/</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">HR:</span>
                    <code className="bg-white px-3 py-1 rounded border border-gray-200">/</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="h-6 w-6 mr-2 text-green-600" />
              Security Features
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Rate Limiting:</span> Max 5 login attempts, 5-minute lockout
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">CSRF Protection:</span> Handled by Supabase
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Session Management:</span> JWT tokens with automatic refresh
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Secure Storage:</span> HTTP-only cookies for tokens
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Password Strength:</span> Real-time validation and feedback
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">2FA Ready:</span> Infrastructure prepared for future implementation
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Key className="h-6 w-6 mr-2 text-blue-600" />
              Validation Rules
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Email:</span> Must be valid email format (regex validated)
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Password:</span> Minimum 6 characters required
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Real-time Feedback:</span> Errors shown on blur and submit
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Caps Lock Detection:</span> Warning when caps lock is active
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Remember Me:</span> Persists email in localStorage
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Accessible:</span> Full ARIA labels and keyboard navigation
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Error Handling */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-orange-600" />
            Error Handling
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Client-Side Errors</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded mr-2 text-xs">400</span>
                  Invalid email format
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded mr-2 text-xs">400</span>
                  Password too short
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-orange-50 text-orange-700 px-2 py-0.5 rounded mr-2 text-xs">429</span>
                  Rate limit exceeded
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-orange-50 text-orange-700 px-2 py-0.5 rounded mr-2 text-xs">WARN</span>
                  Caps Lock detected
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Server-Side Errors</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded mr-2 text-xs">401</span>
                  Invalid credentials
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded mr-2 text-xs">403</span>
                  Account disabled/locked
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded mr-2 text-xs">500</span>
                  Server error
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded mr-2 text-xs">503</span>
                  Service unavailable
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* SSO Integration */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            SSO Integration (Future)
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Google OAuth 2.0</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>OAuth 2.0 flow via Supabase</li>
                <li>Automatic account creation</li>
                <li>Profile picture sync</li>
                <li>Email verification bypassed</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Microsoft Azure AD</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Azure AD integration</li>
                <li>Enterprise SSO support</li>
                <li>Group/role mapping</li>
                <li>Multi-tenant capable</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> SSO buttons are currently placeholders. Integration requires Supabase project configuration and OAuth app setup with respective providers.
            </p>
          </div>
        </div>

        {/* Logout Flow */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Lock className="h-6 w-6 mr-2 text-red-600" />
            Logout Flow
          </h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">User clicks Logout</h4>
                <p className="text-sm text-gray-600">From header or settings menu</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Clear Session</h4>
                <p className="text-sm text-gray-600">Call <code className="bg-gray-100 px-2 py-1 rounded">auth.signOut()</code>, clear AuthContext</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Clean Local Storage</h4>
                <p className="text-sm text-gray-600">Remove tokens (if Remember Me wasn't checked, also clear email)</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Redirect to Login</h4>
                <p className="text-sm text-gray-600">Navigate to <code className="bg-gray-100 px-2 py-1 rounded">/login</code></p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Stack */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Technical Stack</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Frontend</h3>
              <ul className="text-sm space-y-1 text-blue-100">
                <li>React 18 + TypeScript</li>
                <li>React Router v7</li>
                <li>Tailwind CSS</li>
                <li>Lucide Icons</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Authentication</h3>
              <ul className="text-sm space-y-1 text-blue-100">
                <li>Supabase Auth</li>
                <li>JWT Tokens</li>
                <li>Row Level Security</li>
                <li>Role-based Access</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Security</h3>
              <ul className="text-sm space-y-1 text-blue-100">
                <li>HTTPS Only</li>
                <li>CSRF Protection</li>
                <li>Rate Limiting</li>
                <li>Input Sanitization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginWireframe;
