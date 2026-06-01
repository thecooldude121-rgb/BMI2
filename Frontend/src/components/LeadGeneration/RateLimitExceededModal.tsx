import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Clock, TrendingUp, Settings, Calendar, Zap } from 'lucide-react';

interface RateLimitStatus {
  provider: 'apollo' | 'zoominfo';
  used: number;
  total: number;
  resetTime: Date;
}

interface RateLimitExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  apolloStatus: RateLimitStatus;
  zoomInfoStatus: RateLimitStatus;
  onContinueWithZoomInfo: () => void;
  onScheduleForLater: () => void;
  onUpgrade: () => void;
  onOpenSettings: () => void;
}

const RateLimitExceededModal: React.FC<RateLimitExceededModalProps> = ({
  isOpen,
  onClose,
  apolloStatus,
  zoomInfoStatus,
  onContinueWithZoomInfo,
  onScheduleForLater,
  onUpgrade,
  onOpenSettings,
}) => {
  const [selectedOption, setSelectedOption] = useState<'zoominfo' | 'wait' | 'upgrade' | 'skip'>('zoominfo');
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const resetTime = new Date(apolloStatus.resetTime);
      const diffMs = resetTime.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeUntilReset('Ready now');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      setTimeUntilReset(`${hours} hours ${minutes} minutes`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);

    return () => clearInterval(interval);
  }, [apolloStatus.resetTime]);

  const calculatePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const handleContinue = () => {
    switch (selectedOption) {
      case 'zoominfo':
        onContinueWithZoomInfo();
        break;
      case 'wait':
        onScheduleForLater();
        break;
      case 'upgrade':
        onUpgrade();
        break;
      case 'skip':
        onClose();
        break;
    }
  };

  const apolloPercentage = calculatePercentage(apolloStatus.used, apolloStatus.total);
  const zoomInfoPercentage = calculatePercentage(zoomInfoStatus.used, zoomInfoStatus.total);
  const zoomInfoAvailable = zoomInfoStatus.total - zoomInfoStatus.used;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">API Rate Limit Exceeded</h2>
                <p className="text-sm text-gray-600">Apollo.io API rate limit reached</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Rate Limit Status */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-900">Rate Limit Status</h3>
            </div>

            {/* Apollo.io Status */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Apollo.io:</span>
                <span className="text-xs font-semibold text-red-600">
                  {apolloStatus.used}/{apolloStatus.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${getProgressBarColor(apolloPercentage)} transition-all duration-500`}
                  style={{ width: `${apolloPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-red-600 font-medium">All requests used for today</span>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>Resets in: {timeUntilReset}</span>
                </div>
              </div>
            </div>

            {/* ZoomInfo Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">ZoomInfo:</span>
                <span className="text-xs font-semibold text-blue-600">
                  {zoomInfoStatus.used}/{zoomInfoStatus.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${getProgressBarColor(zoomInfoPercentage)} transition-all duration-500`}
                  style={{ width: `${zoomInfoPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-green-600 font-medium">
                  Still available ({zoomInfoAvailable} requests remaining)
                </span>
              </div>
            </div>
          </div>

          {/* Options */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">What would you like to do?</h3>

            <div className="space-y-3">
              {/* Option 1: Use ZoomInfo */}
              <label
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedOption === 'zoominfo'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="rateLimitOption"
                  checked={selectedOption === 'zoominfo'}
                  onChange={() => setSelectedOption('zoominfo')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    Use ZoomInfo only for now
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                      Available: {zoomInfoAvailable} requests
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Continue enrichment with ZoomInfo API
                  </div>
                </div>
              </label>

              {/* Option 2: Wait for Apollo Reset */}
              <label
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedOption === 'wait'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="rateLimitOption"
                  checked={selectedOption === 'wait'}
                  onChange={() => setSelectedOption('wait')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Wait for Apollo reset
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                      {timeUntilReset}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Schedule enrichment for later
                  </div>
                </div>
              </label>

              {/* Option 3: Upgrade Apollo Plan */}
              <label
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedOption === 'upgrade'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="rateLimitOption"
                  checked={selectedOption === 'upgrade'}
                  onChange={() => setSelectedOption('upgrade')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Upgrade Apollo plan
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                      Recommended
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Increase rate limit to 500/day
                  </div>
                </div>
              </label>

              {/* Option 4: Skip Enrichment */}
              <label
                className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedOption === 'skip'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="rateLimitOption"
                  checked={selectedOption === 'skip'}
                  onChange={() => setSelectedOption('skip')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    Skip enrichment
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Save draft and enrich manually later
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Upgrade Tip */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-blue-900 mb-2">💡 TIP: Upgrade your Apollo plan</div>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Current:</span>
                    <span className="font-medium">Basic (100 requests/day)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Upgrade to:</span>
                    <span className="font-semibold text-blue-900">Professional (500 requests/day)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Cost:</span>
                    <span className="font-bold text-green-600">$49/month</span>
                  </div>
                </div>
                <button
                  onClick={onUpgrade}
                  className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  View Plans
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Cancel
            </button>

            {selectedOption === 'wait' && (
              <button
                onClick={handleContinue}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Schedule for Later
              </button>
            )}

            {selectedOption === 'zoominfo' && (
              <button
                onClick={handleContinue}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Continue with ZoomInfo
              </button>
            )}

            {selectedOption === 'upgrade' && (
              <button
                onClick={handleContinue}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Upgrade Now
              </button>
            )}

            {selectedOption === 'skip' && (
              <button
                onClick={handleContinue}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Save Draft
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateLimitExceededModal;
