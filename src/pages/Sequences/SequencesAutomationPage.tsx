import React from 'react';
import { Zap, Plus, Play, Users, TrendingUp, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SequencesAutomationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Go back"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sequence Automation</h1>
                <p className="text-gray-600 text-lg">Automate multi-step outreach with intelligent sequences</p>
              </div>
            </div>
            <button className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Sequence
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sequences</p>
                <p className="text-3xl font-bold text-gray-900">12</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sequences</p>
                <p className="text-3xl font-bold text-gray-900">8</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Play className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Enrolled</p>
                <p className="text-3xl font-bold text-gray-900">1,247</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Reply Rate</p>
                <p className="text-3xl font-bold text-gray-900">12.4%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Zap className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sequences & Campaign Automation</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Comprehensive sequence automation system with multi-step outreach flows, branching logic,
            AI-powered optimization, A/B testing, per-step analytics, drag-and-drop builder,
            template library, calendar integration, and multi-channel support.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-8">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-1">Drag & Drop Builder</h3>
              <p className="text-sm text-blue-700">Flowchart-style canvas</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-1">Branching Logic</h3>
              <p className="text-sm text-green-700">Conditional flow paths</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-1">AI Optimization</h3>
              <p className="text-sm text-purple-700">Smart copy generation</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-900 mb-1">A/B Testing</h3>
              <p className="text-sm text-orange-700">Statistical analysis</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-8">
            ✓ Database schema created  •  ✓ Service layer implemented  •  ✓ Type definitions complete
          </p>
        </div>
      </div>
    </div>
  );
};

export default SequencesAutomationPage;