import React from 'react';
import { Check, CreditCard, Download, Target } from 'lucide-react';

interface Invoice {
  date: string;
  description: string;
  amount: string;
  status: string;
}

const BillingSettings: React.FC = () => {
  const planFeatures = [
    'Unlimited contacts',
    'Unlimited deals',
    '5 team members',
    'All integrations',
    'AI-powered features',
    'Email & phone support',
    'Custom fields & pipeline'
  ];

  const invoices: Invoice[] = [
    {
      date: "Dec 1, '24",
      description: 'Professional + HRMS',
      amount: '$298',
      status: 'Paid'
    },
    {
      date: "Nov 1, '24",
      description: 'Professional + HRMS',
      amount: '$298',
      status: 'Paid'
    },
    {
      date: "Oct 1, '24",
      description: 'Professional',
      amount: '$99',
      status: 'Paid'
    }
  ];

  const handleDownloadInvoice = (date: string) => {
    alert(`Downloading invoice for ${date}...`);
  };

  const handleUpgradePlan = () => {
    alert('Opening plan upgrade options...');
  };

  const handleManageAddons = () => {
    alert('Opening add-ons management...');
  };

  const handleUpdateCard = () => {
    alert('Opening card update form...');
  };

  const handleAddPaymentMethod = () => {
    alert('Opening payment method addition form...');
  };

  const handleUpdateBillingInfo = () => {
    alert('Opening billing info update form...');
  };

  const handleViewAllInvoices = () => {
    alert('Opening full invoice history...');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Billing & Plan</h2>
          <p className="text-sm text-gray-600 mt-1">Manage your subscription and billing</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">CURRENT PLAN</h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">Professional Plan</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">$99/month</div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Your plan includes:</p>
              <div className="space-y-2">
                {planFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Add-ons:</p>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700">
                  HRMS Connector: <span className="font-semibold">$199/month</span> (Premium)
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="text-lg font-bold text-gray-900 mb-2">
                Total: <span className="text-blue-600">$298/month</span>
              </div>
              <p className="text-sm text-gray-600">
                Next billing date: <span className="font-medium text-gray-900">Jan 1, 2025</span>
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleUpgradePlan}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Upgrade Plan
              </button>
              <button
                onClick={handleManageAddons}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Manage Add-ons
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">PAYMENT METHOD</h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 mb-4">
              <CreditCard className="h-6 w-6 text-gray-600 mt-1" />
              <div>
                <div className="font-medium text-gray-900">Visa ending in 4242</div>
                <div className="text-sm text-gray-600">Expires: 12/2026</div>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleUpdateCard}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Update Card
              </button>
              <button
                onClick={handleAddPaymentMethod}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Add Payment Method
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Billing Address:</p>
              <div className="text-sm text-gray-700 space-y-1">
                <div>123 Main Street</div>
                <div>San Francisco, CA 94102</div>
                <div>United States</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleUpdateBillingInfo}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Update Billing Info
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">BILLING HISTORY</h3>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{invoice.date}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{invoice.description}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 font-medium">{invoice.amount}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <Check className="h-4 w-4" />
                          <span>{invoice.status}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDownloadInvoice(invoice.date)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          [Download]
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-gray-200 text-center mt-4">
              <button
                onClick={handleViewAllInvoices}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                View All Invoices
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">USAGE & LIMITS</h3>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Team Members:</span>
                <span className="text-sm font-semibold text-gray-900">3 / 5 used</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '60%' }}></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">60%</p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Contacts:</span>
                <span className="text-sm font-semibold text-gray-900">147 / ∞ (Unlimited)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Deals:</span>
                <span className="text-sm font-semibold text-gray-900">23 / ∞ (Unlimited)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Storage:</span>
                <span className="text-sm font-semibold text-gray-900">2.3 GB / 50 GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="bg-green-600 h-full rounded-full" style={{ width: '5%' }}></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">5%</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">API Calls:</span>
                <span className="text-sm font-semibold text-gray-900">12,456 / 100,000 per month</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '12%' }}></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">12%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSettings;
