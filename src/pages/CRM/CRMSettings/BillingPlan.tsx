import React from 'react';
import { Check } from 'lucide-react';

const BillingPlan: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Current Plan</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your subscription plan</p>
      </div>

      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm opacity-90">Current Plan</div>
            <div className="text-3xl font-bold">Professional</div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Monthly</div>
            <div className="text-3xl font-bold">$99</div>
          </div>
        </div>
        <div className="text-sm opacity-90">Next billing date: March 15, 2024</div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="font-semibold text-gray-900">Plan Features:</div>
        {['Unlimited contacts', 'Advanced reporting', 'API access', 'Priority support', 'Custom integrations'].map((feature) => (
          <div key={feature} className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-500" />
            <span className="text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Upgrade Plan
        </button>
        <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Change Plan
        </button>
      </div>
    </div>
  );
};

export default BillingPlan;
