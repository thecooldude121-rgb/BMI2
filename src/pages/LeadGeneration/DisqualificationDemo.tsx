import React, { useState } from 'react';
import { XCircle, CheckCircle, Clock, TrendingDown, Users, FileText, AlertCircle } from 'lucide-react';
import DisqualifyLeadModal, { DisqualificationData } from '../../components/LeadQualification/DisqualifyLeadModal';
import {
  sampleLeads,
  exampleDisqualifications,
  getDisqualificationStats,
  getReasonById,
  getCompetitorById
} from '../../utils/disqualificationMockData';
import { simulateDisqualification } from '../../services/disqualificationService';

const DisqualificationDemo: React.FC = () => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [lastDisqualification, setLastDisqualification] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const stats = getDisqualificationStats();
  const selectedLead = sampleLeads.find(lead => lead.id === selectedLeadId);

  const handleDisqualify = async (data: DisqualificationData) => {
    if (!selectedLeadId) return;

    try {
      const result = await simulateDisqualification(selectedLeadId, data);
      setLastDisqualification(result);
      setShowSuccess(true);
      setShowModal(false);

      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Disqualification failed:', error);
    }
  };

  const openModal = (leadId: string) => {
    setSelectedLeadId(leadId);
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Disqualification Modal Demo
          </h1>
          <p className="text-gray-600">
            Test the comprehensive disqualification workflow with sample leads
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && lastDisqualification && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">
                  Lead Disqualified Successfully
                </h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Lead ID:</strong> {lastDisqualification.leadId}</p>
                  <p><strong>Reason:</strong> {lastDisqualification.reason}</p>
                  <p><strong>Re-engagement:</strong> {formatDate(lastDisqualification.reEngagementDate)}</p>
                  {lastDisqualification.competitor && (
                    <p><strong>Competitor:</strong> {getCompetitorById(lastDisqualification.competitor)?.name}</p>
                  )}
                </div>
                <button
                  onClick={() => console.log('Full record:', lastDisqualification)}
                  className="mt-2 text-sm text-green-700 hover:text-green-900 font-medium"
                >
                  View full record in console →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Disqualified</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDisqualified}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Re-engagement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageReEngagementMonths.toFixed(1)} mo
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Top Reason</p>
                <p className="text-sm font-semibold text-gray-900">Budget Issues</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Top Competitor</p>
                <p className="text-sm font-semibold text-gray-900">
                  {stats.topCompetitors[0]?.name || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sample Leads */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Sample Leads</h2>
              <p className="text-sm text-gray-600 mt-1">
                Click "Disqualify" to test the modal
              </p>
            </div>
            <div className="p-6 space-y-4">
              {sampleLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                        <p className="text-sm text-gray-600">{lead.title}</p>
                        <p className="text-sm text-gray-500">{lead.company}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => openModal(lead.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <XCircle className="h-4 w-4" />
                      Disqualify
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lead.aiScore >= 80
                        ? 'bg-green-100 text-green-700'
                        : lead.aiScore >= 60
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      AI: {lead.aiScore}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lead.bantScore >= 16
                        ? 'bg-green-100 text-green-700'
                        : lead.bantScore >= 12
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      BANT: {lead.bantScore}
                    </span>
                    <span className="text-gray-500">
                      {lead.email}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disqualification History */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Disqualifications
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Example disqualification records
              </p>
            </div>
            <div className="p-6 space-y-4">
              {exampleDisqualifications.map((disq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {disq.leadId}
                      </h3>
                      <p className="text-sm text-red-600 font-medium">
                        {disq.reason}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      disq.reEngagement === 'never'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {disq.reEngagement === 'never' ? 'No Re-engage' : disq.reEngagement.replace('_', ' ')}
                    </span>
                  </div>

                  {disq.additionalDetails && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {disq.additionalDetails}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>By {disq.disqualifiedBy}</span>
                    <span>{formatDate(disq.disqualifiedAt)}</span>
                  </div>

                  {disq.competitor && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-600">
                        Lost to: <span className="font-medium text-gray-900">
                          {getCompetitorById(disq.competitor)?.name}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats by Category */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Disqualifications by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byCategory).map(([category, count]) => (
              <div key={category} className="text-center">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Testing Instructions
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Click "Disqualify" on any sample lead to open the modal</li>
                <li>Try high-quality leads (AI ≥80, BANT ≥16) to see the warning</li>
                <li>Select competition reasons to see the competitor dropdown</li>
                <li>Test different re-engagement periods (3, 6, 12 months, never)</li>
                <li>Check the browser console for detailed simulation logs</li>
                <li>All data is simulated - no actual database changes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Disqualification Modal */}
      {selectedLead && (
        <DisqualifyLeadModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedLeadId(null);
          }}
          onConfirm={handleDisqualify}
          lead={{
            name: selectedLead.name,
            title: selectedLead.title,
            company: selectedLead.company,
            email: selectedLead.email,
            aiScore: selectedLead.aiScore,
            bantScore: selectedLead.bantScore
          }}
          owner="John Smith"
        />
      )}
    </div>
  );
};

export default DisqualificationDemo;
