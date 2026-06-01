import React, { useState } from 'react';
import { X, Check, ChevronRight, Zap, Users, Shield, Headphones, Settings, TrendingUp } from 'lucide-react';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  currentPrice: number;
  onUpgrade: (plan: 'business' | 'enterprise' | 'add-seat', billingCycle: 'monthly' | 'annual') => void;
}

const UpgradePlanModal: React.FC<UpgradePlanModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  currentPrice,
  onUpgrade
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  if (!isOpen) return null;

  const plans = {
    business: {
      name: 'Business',
      monthlyPrice: 299,
      annualPrice: 287,
      seats: 15,
      features: [
        'Up to 15 user seats',
        'Advanced analytics & reporting',
        'Custom dashboards',
        'Priority email support',
        'API access',
        'Advanced integrations',
        'Team performance tracking',
        'Custom fields & workflows'
      ]
    },
    enterprise: {
      name: 'Enterprise',
      monthlyPrice: null,
      annualPrice: null,
      seats: 'Unlimited',
      features: [
        'Unlimited user seats',
        'Dedicated account manager',
        'Priority 24/7 support',
        'Custom onboarding',
        'Advanced security features',
        'SLA guarantees',
        'Custom integrations',
        'White-label options'
      ]
    },
    addSeat: {
      name: 'Add Individual Seats',
      monthlyPrice: 49,
      annualPrice: 47,
      description: 'Keep your current plan and add seats as needed'
    }
  };

  const calculatePrice = (monthlyPrice: number | null, annualPrice: number | null) => {
    if (!monthlyPrice) return 'Custom';
    if (billingCycle === 'monthly') return `$${monthlyPrice}`;
    return `$${annualPrice}`;
  };

  const handleUpgrade = (planType: 'business' | 'enterprise' | 'add-seat') => {
    onUpgrade(planType, billingCycle);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
            <p className="text-sm text-gray-600 mt-1">
              Current Plan: <span className="font-semibold text-blue-600">{currentPlan}</span> (${currentPrice}/month)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Billing Toggle */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                billingCycle === 'annual' ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
            </span>
            {billingCycle === 'annual' && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Business Plan */}
            <div className="border-2 border-blue-600 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white relative">
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                  POPULAR
                </span>
              </div>

              <div className="mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Business</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {calculatePrice(plans.business.monthlyPrice, plans.business.annualPrice)}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                {billingCycle === 'annual' && (
                  <p className="text-sm text-green-600 font-medium">
                    ${plans.business.annualPrice! * 12}/year (save ${(plans.business.monthlyPrice - plans.business.annualPrice!) * 12})
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">{plans.business.seats} user seats included</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plans.business.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade('business')}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                Upgrade to Business
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="border-2 border-gray-300 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white">
              <div className="mb-6">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-gray-700" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-gray-900">Custom</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{plans.enterprise.seats} user seats</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plans.enterprise.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade('enterprise')}
                className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                Contact Sales
                <Headphones className="w-4 h-4" />
              </button>
            </div>

            {/* Add Seat Option */}
            <div className="border-2 border-green-300 rounded-xl p-6 bg-gradient-to-br from-green-50 to-white">
              <div className="mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Add Seats</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {calculatePrice(plans.addSeat.monthlyPrice, plans.addSeat.annualPrice)}
                  </span>
                  <span className="text-gray-600">/seat/month</span>
                </div>
                {billingCycle === 'annual' && (
                  <p className="text-sm text-green-600 font-medium">
                    ${plans.addSeat.annualPrice! * 12}/year per seat
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">{plans.addSeat.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Keep current {currentPlan} features</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Add seats one at a time</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Scale as you grow</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>No commitment required</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Cancel anytime</span>
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade('add-seat')}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                Add Seat
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">All plans include:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Unlimited contacts and deals</li>
                  <li>• Mobile app access</li>
                  <li>• Data encryption & security</li>
                  <li>• Regular updates & new features</li>
                  <li>• 99.9% uptime SLA</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help choosing? <button className="text-blue-600 hover:text-blue-700 font-medium">Contact our sales team</button>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              All plans come with a 14-day money-back guarantee. No questions asked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePlanModal;
