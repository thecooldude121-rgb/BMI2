import React, { useState } from 'react';
import {
  Shield,
  Key,
  Monitor,
  Smartphone,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
  ExternalLink,
  LogOut,
  AlertTriangle
} from 'lucide-react';

interface Session {
  id: string;
  device: string;
  location: string;
  date: string;
  ip: string;
  isCurrent: boolean;
}

interface LoginAttempt {
  id: string;
  date: string;
  device: string;
  success: boolean;
  location?: string;
  ip?: string;
}

const SecuritySettings: React.FC = () => {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  const apiKey = 'sk_live_abc123456789...';
  const apiKeyCreated = 'Nov 1, 2024';
  const apiKeyLastUsed = 'Dec 13, 2024 at 9:45 AM';
  const apiRequests = '12,456';
  const apiSuccessRate = '99.6%';

  const sessions: Session[] = [
    {
      id: '1',
      device: 'Chrome on Mac',
      location: 'San Francisco, CA, USA',
      date: 'Dec 13, 2024 at 9:45 AM',
      ip: '192.168.1.100',
      isCurrent: true
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'San Francisco, CA, USA',
      date: 'Dec 12, 2024 at 6:30 PM',
      ip: '192.168.1.105',
      isCurrent: false
    },
    {
      id: '3',
      device: 'Chrome on Windows',
      location: 'San Jose, CA, USA',
      date: 'Dec 10, 2024 at 2:15 PM',
      ip: '192.168.50.20',
      isCurrent: false
    }
  ];

  const loginHistory: LoginAttempt[] = [
    {
      id: '1',
      date: 'Dec 13, 2024 9:45 AM',
      device: 'Chrome on Mac (Current)',
      success: true
    },
    {
      id: '2',
      date: 'Dec 12, 2024 6:30 PM',
      device: 'Safari on iPhone',
      success: true
    },
    {
      id: '3',
      date: 'Dec 12, 2024 8:00 AM',
      device: 'Chrome on Mac',
      success: true
    },
    {
      id: '4',
      date: 'Dec 11, 2024 9:00 AM',
      device: 'Chrome on Mac',
      success: true
    },
    {
      id: '5',
      date: 'Dec 10, 2024 11:30 PM',
      device: 'Failed login attempt',
      success: false,
      location: 'Unknown',
      ip: '185.220.101.5'
    }
  ];

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const handleRegenerateKey = () => {
    if (confirm('Are you sure you want to regenerate your API key? This will invalidate your current key.')) {
      alert('API key regenerated successfully!');
    }
  };

  const handleSignOut = (sessionId: string) => {
    if (confirm('Sign out of this session?')) {
      alert(`Session ${sessionId} signed out successfully!`);
    }
  };

  const handleSignOutAll = () => {
    if (confirm('Sign out of all other sessions?')) {
      alert('All other sessions have been signed out successfully!');
    }
  };

  const handleEnable2FA = () => {
    alert('2FA setup wizard would open here');
    setTwoFactorEnabled(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your account security settings</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">TWO-FACTOR AUTHENTICATION (2FA)</h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              {twoFactorEnabled ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Enabled</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Not Enabled</span>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-700 mb-4">
              Add an extra layer of security to your account.<br />
              You'll need your phone to sign in.
            </p>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Methods available:</p>
              <ul className="ml-4 space-y-1 text-sm text-gray-700">
                <li>• Authenticator app (Google Authenticator, Authy)</li>
                <li>• SMS text message</li>
              </ul>
            </div>

            {twoFactorEnabled ? (
              <button
                onClick={() => setTwoFactorEnabled(false)}
                className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                onClick={handleEnable2FA}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Enable 2FA
              </button>
            )}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">API KEYS</h3>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Your API Key:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2 bg-gray-50 text-sm font-mono rounded border border-gray-200">
                  {apiKey}
                </code>
                <button
                  onClick={handleCopyApiKey}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Copy"
                >
                  <Copy className="h-5 w-5" />
                </button>
                <button
                  onClick={handleRegenerateKey}
                  className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>
              {apiKeyCopied && (
                <p className="text-xs text-green-600 mt-1">API key copied to clipboard!</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Created:</span>
                <span className="ml-2 font-medium text-gray-900">{apiKeyCreated}</span>
              </div>
              <div>
                <span className="text-gray-600">Last used:</span>
                <span className="ml-2 font-medium text-gray-900">{apiKeyLastUsed}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">API Usage This Month:</p>
              <p className="text-sm text-gray-900">
                <span className="font-semibold">{apiRequests}</span> requests | <span className="font-semibold">{apiSuccessRate}</span> success rate
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-2 text-sm">
                View API Documentation
                <ExternalLink className="h-4 w-4" />
              </button>
              <p className="text-xs text-gray-500 mt-1">(Links to external API docs)</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">ACTIVE SESSIONS</h3>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm font-medium text-gray-700 mb-4">Where you're signed in:</p>

            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {session.device.includes('iPhone') ? (
                        <Smartphone className="h-5 w-5 text-gray-600 mt-1" />
                      ) : (
                        <Monitor className="h-5 w-5 text-gray-600 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {session.device} {session.isCurrent && '(Current Session)'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{session.location}</div>
                        <div className="text-sm text-gray-600">{session.date}</div>
                        <div className="text-sm text-gray-600">IP: {session.ip}</div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <button
                        onClick={() => handleSignOut(session.id)}
                        className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200 text-center">
              <button
                onClick={handleSignOutAll}
                className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Sign Out All Other Sessions
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">LOGIN HISTORY</h3>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm font-medium text-gray-700 mb-4">Recent login activity:</p>

            <div className="space-y-2">
              {loginHistory.map((attempt) => (
                <div key={attempt.id} className="flex items-start gap-3 py-2">
                  {attempt.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm text-gray-900">
                      {attempt.date} - {attempt.device}
                    </div>
                    {!attempt.success && attempt.location && attempt.ip && (
                      <div className="text-sm text-gray-600 mt-1">
                        Location: {attempt.location} | IP: {attempt.ip}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200 text-center">
              <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                View Full History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
