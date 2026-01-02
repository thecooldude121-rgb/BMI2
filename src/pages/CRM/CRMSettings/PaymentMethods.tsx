import React from 'react';
import { CreditCard, Plus } from 'lucide-react';

const PaymentMethods: React.FC = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your payment methods</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Payment Method
        </button>
      </div>

      <div className="space-y-3">
        <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">•••• •••• •••• 4242</div>
                <div className="text-sm text-gray-600">Expires 12/25</div>
              </div>
            </div>
            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Default</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;
