import React, { useState } from 'react';
import { Shield, Smartphone } from 'lucide-react';

const TwoFactorAuth: React.FC = () => {
  const [enabled, setEnabled] = useState(false);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-start gap-4">
          <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Why Enable 2FA?</h3>
            <p className="text-sm text-blue-800">
              Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
            </p>
          </div>
        </div>

        {enabled ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900">2FA Enabled</span>
              </div>
              <p className="text-sm text-green-800">Your account is protected with two-factor authentication</p>
            </div>
            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
              Disable 2FA
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEnabled(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enable Two-Factor Authentication
          </button>
        )}
      </div>
    </div>
  );
};

export default TwoFactorAuth;
