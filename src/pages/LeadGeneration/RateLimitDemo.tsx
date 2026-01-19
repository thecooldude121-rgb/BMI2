import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Code } from 'lucide-react';
import RateLimitExceededModal from '../../components/LeadGeneration/RateLimitExceededModal';
import { rateLimitErrorData } from '../../utils/rateLimitErrorMockData';

const RateLimitDemo: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(true);

  // Use mock data from rateLimitErrorMockData
  const apolloStatus = {
    provider: 'apollo' as const,
    used: rateLimitErrorData.rateLimitStatus.apollo.used,
    total: rateLimitErrorData.rateLimitStatus.apollo.limit,
    resetTime: new Date(rateLimitErrorData.rateLimitStatus.apollo.resetTimestamp),
  };

  const zoomInfoStatus = {
    provider: 'zoominfo' as const,
    used: rateLimitErrorData.rateLimitStatus.zoominfo.used,
    total: rateLimitErrorData.rateLimitStatus.zoominfo.limit,
    resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  const handleContinueWithZoomInfo = () => {
    const option = rateLimitErrorData.options.find(opt => opt.id === 'use_zoominfo');
    console.log('✅ Continuing with ZoomInfo only');
    console.log('Option selected:', option);
    console.log('ZoomInfo available requests:', rateLimitErrorData.rateLimitStatus.zoominfo.available);
    console.log('Estimated fields to enrich:', option?.estimatedFields);
    alert('Continuing enrichment with ZoomInfo API...');
    setIsModalOpen(false);
  };

  const handleScheduleForLater = () => {
    const option = rateLimitErrorData.options.find(opt => opt.id === 'wait_for_reset');
    console.log('⏰ Scheduling enrichment for later');
    console.log('Option selected:', option);
    console.log('Wait time:', option?.waitTime);
    console.log('Scheduled time:', option?.scheduledTime);
    console.log('Will resume after Apollo reset:', apolloStatus.resetTime);
    alert('Enrichment scheduled for when Apollo resets!');
    setIsModalOpen(false);
  };

  const handleUpgrade = () => {
    const option = rateLimitErrorData.options.find(opt => opt.id === 'upgrade_plan');
    console.log('🚀 Opening upgrade flow');
    console.log('Option selected:', option);
    console.log('Current plan:', option?.currentPlan);
    console.log('Upgrade to:', option?.upgradePlan);
    console.log('Cost:', option?.cost);
    alert('Redirecting to Apollo.io upgrade page...');
    setIsModalOpen(false);
  };

  const handleOpenSettings = () => {
    console.log('⚙️ Opening enrichment settings');
    navigate('/lead-generation/enrichment');
  };

  const handleClose = () => {
    console.log('❌ Modal closed');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/lead-generation')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Lead Generation</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Limit Error State Demo</h1>
          <p className="text-gray-600">
            Demonstration of the API rate limit exceeded modal with interactive options
          </p>
        </div>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Current Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Current API Status</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Apollo.io</span>
                  <span className="text-xs font-semibold text-red-600">
                    {apolloStatus.used}/{apolloStatus.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
                </div>
                <p className="text-xs text-red-600 mt-1 font-medium">Rate limit exceeded</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">ZoomInfo</span>
                  <span className="text-xs font-semibold text-blue-600">
                    {zoomInfoStatus.used}/{zoomInfoStatus.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '45%' }} />
                </div>
                <p className="text-xs text-green-600 mt-1 font-medium">
                  {zoomInfoStatus.total - zoomInfoStatus.used} requests available
                </p>
              </div>
            </div>
          </div>

          {/* Demo Actions Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Actions</h2>

            <div className="space-y-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-left flex items-center justify-between"
              >
                <span>Show Rate Limit Modal</span>
                <AlertTriangle className="w-5 h-5" />
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">Modal Features:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Visual progress bars for both APIs</li>
                  <li>• Real-time countdown timer</li>
                  <li>• 4 interactive options with radio buttons</li>
                  <li>• Dynamic action button based on selection</li>
                  <li>• Upgrade suggestion panel</li>
                  <li>• Smooth hover states and transitions</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900 font-medium mb-2">Available Options:</p>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>1️⃣ Continue with ZoomInfo (55 requests left)</li>
                  <li>2️⃣ Schedule for later (auto-retry on reset)</li>
                  <li>3️⃣ Upgrade Apollo plan (500/day limit)</li>
                  <li>4️⃣ Skip enrichment (save as draft)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Mock Data Structure */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Mock Data Structure</h2>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs text-green-400 font-mono">
              <code>{JSON.stringify(rateLimitErrorData, null, 2)}</code>
            </pre>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Error Details</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Type: {rateLimitErrorData.error.type}</li>
                <li>• Service: {rateLimitErrorData.error.service}</li>
                <li>• Timestamp: {rateLimitErrorData.error.timestamp}</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-amber-900 mb-2">Apollo Status</h3>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• Used: {rateLimitErrorData.rateLimitStatus.apollo.used}/{rateLimitErrorData.rateLimitStatus.apollo.limit}</li>
                <li>• Percentage: {rateLimitErrorData.rateLimitStatus.apollo.percentage}%</li>
                <li>• Status: {rateLimitErrorData.rateLimitStatus.apollo.status}</li>
                <li>• Resets in: {rateLimitErrorData.rateLimitStatus.apollo.resetsIn}</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-green-900 mb-2">ZoomInfo Status</h3>
              <ul className="text-xs text-green-800 space-y-1">
                <li>• Used: {rateLimitErrorData.rateLimitStatus.zoominfo.used}/{rateLimitErrorData.rateLimitStatus.zoominfo.limit}</li>
                <li>• Available: {rateLimitErrorData.rateLimitStatus.zoominfo.available}</li>
                <li>• Percentage: {rateLimitErrorData.rateLimitStatus.zoominfo.percentage}%</li>
                <li>• Status: {rateLimitErrorData.rateLimitStatus.zoominfo.status}</li>
              </ul>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">Available Options</h3>
              <ul className="text-xs text-indigo-800 space-y-1">
                {rateLimitErrorData.options.map((option, index) => (
                  <li key={option.id}>• Option {index + 1}: {option.id}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Testing Instructions</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. Modal Display</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Click "Show Rate Limit Modal" button</li>
                <li>• Observe amber/orange gradient header</li>
                <li>• See Apollo at 100% (red progress bar)</li>
                <li>• See ZoomInfo at 45% (blue progress bar)</li>
                <li>• Notice countdown timer updating</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. Interactive Options</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Click each of the 4 radio button options</li>
                <li>• Watch option cards highlight in blue when selected</li>
                <li>• See hover states on unselected options</li>
                <li>• Notice action button changes based on selection</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. Action Buttons</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Select "Use ZoomInfo" → Button shows "Continue with ZoomInfo"</li>
                <li>• Select "Wait for Apollo" → Button shows "Schedule for Later"</li>
                <li>• Select "Upgrade" → Button shows "Upgrade Now"</li>
                <li>• Select "Skip" → Button shows "Save Draft"</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">4. Console Logging</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Open browser console (F12)</li>
                <li>• Click any action button</li>
                <li>• See detailed logging of selected action</li>
                <li>• Alert will show confirmation message</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">5. Upgrade Panel</h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• Scroll to see blue gradient upgrade tip</li>
                <li>• Click "View Plans" button</li>
                <li>• See upgrade flow triggered</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <RateLimitExceededModal
        isOpen={isModalOpen}
        onClose={handleClose}
        apolloStatus={apolloStatus}
        zoomInfoStatus={zoomInfoStatus}
        onContinueWithZoomInfo={handleContinueWithZoomInfo}
        onScheduleForLater={handleScheduleForLater}
        onUpgrade={handleUpgrade}
        onOpenSettings={handleOpenSettings}
      />
    </div>
  );
};

export default RateLimitDemo;
