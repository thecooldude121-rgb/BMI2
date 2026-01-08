import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, FileText } from 'lucide-react';
import AIScoreBreakdown from '../../components/LeadQualification/AIScoreBreakdown';
import BANTFramework from '../../components/LeadQualification/BANTFramework';
import QualificationDecision from '../../components/LeadQualification/QualificationDecision';
import QualificationHistory from '../../components/LeadQualification/QualificationHistory';
import QualifyLeadModal from '../../components/LeadQualification/QualifyLeadModal';
import DisqualifyLeadModal from '../../components/LeadQualification/DisqualifyLeadModal';
import AddNotesModal from '../../components/LeadQualification/AddNotesModal';
import IncompleteBantModal from '../../components/LeadQualification/IncompleteBantModal';
import PartialBantModal from '../../components/LeadQualification/PartialBantModal';
import { useToast } from '../../contexts/ToastContext';
import * as bantValidation from '../../services/bantValidationService';

interface Lead {
  id: string;
  name: string;
  title: string;
  company: string;
  source: string;
  status: string;
  score: number;
  lastUpdated: string;
}

interface QualificationData {
  aiScore: number;
  baseScore: number;
  hrmsBonus: number;
  hrmsBonusPoints: number;
  scoreComponents: {
    jobTitle: { score: number; max: number; details: string };
    companyProfile: { score: number; max: number; details: string[] };
    engagement: { score: number; max: number; details: string[] };
    intentSignals: { score: number; max: number; details: string[] };
    dataCompleteness: { score: number; max: number; details: string[] };
  };
  aiInsights: string[];
  bantData: any;
  finalStatus: string;
  assignedTo: string;
  notes: string;
}

const LeadQualificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [lead, setLead] = useState<Lead | null>(null);
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [showDisqualifyModal, setShowDisqualifyModal] = useState(false);
  const [showAddNotesModal, setShowAddNotesModal] = useState(false);
  const [showIncompleteBantModal, setShowIncompleteBantModal] = useState(false);
  const [showPartialBantModal, setShowPartialBantModal] = useState(false);
  const bantSectionRef = useRef<HTMLDivElement>(null);
  const [qualificationData, setQualificationData] = useState<QualificationData>({
    aiScore: 92,
    baseScore: 69,
    hrmsBonus: 33,
    hrmsBonusPoints: 23,
    scoreComponents: {
      jobTitle: {
        score: 25,
        max: 25,
        details: 'C-Level Executive (CFO) - Maximum score'
      },
      companyProfile: {
        score: 18,
        max: 25,
        details: [
          'Size: 85 employees (Good: +8)',
          'Revenue: $12-15M (Medium: +5)',
          'Funding: $23M Series A (Good: +5)'
        ]
      },
      engagement: {
        score: 12,
        max: 20,
        details: [
          'Email opened: 2 times (+4)',
          'Clicked links: 1 time (+4)',
          'Replied to outreach: No (-4)',
          'LinkedIn connection: Yes (+4)',
          'Website visits: 2 times (+4)'
        ]
      },
      intentSignals: {
        score: 10,
        max: 15,
        details: [
          'Job postings: 5 roles (+5)',
          'Funding news: Series A (+5)',
          'Technology stack: Matches ICP (0)'
        ]
      },
      dataCompleteness: {
        score: 14,
        max: 15,
        details: [
          'Contact info: 100% complete (+5)',
          'Company info: 100% complete (+5)',
          'Professional details: 90% complete (+4)'
        ]
      }
    },
    aiInsights: [
      'Strong fit: C-level at growing SaaS company',
      'Warm lead from HRMS (33% higher conversion rate)',
      'Active hiring signals indicate growth phase',
      'Recent funding suggests budget availability'
    ],
    bantData: {
      budget: {
        status: 'confirmed',
        range: '$50K - $100K',
        timeline: 'Q1 2025',
        notes: 'Mentioned $75K budget in last call. Approved by board.'
      },
      authority: {
        status: 'decision_maker',
        role: 'Final Approver',
        stakeholders: 'CEO (John Smith), CTO (Michael Torres)',
        process: 'CFO + CEO sign-off required. Board already approved.'
      },
      need: {
        status: 'urgent',
        painPoints: [
          'Manual financial reporting processes',
          'Lack of real-time analytics',
          'Scaling challenges with current tools'
        ],
        impact: 'Current manual processes cost $200K/year in labor. Our solution can save 60% of that time.'
      },
      timeline: {
        status: 'immediate',
        closeDate: '2025-02-15',
        milestones: [
          { date: 'Jan 15', description: 'Demo scheduled' },
          { date: 'Jan 30', description: 'Proposal submission' },
          { date: 'Feb 10', description: 'Final decision meeting' },
          { date: 'Feb 15', description: 'Contract signing (target)' }
        ],
        drivers: 'Q1 planning cycle. CFO wants solution live by March.'
      }
    },
    finalStatus: 'qualified',
    assignedTo: 'John Smith (Senior AE)',
    notes: "Sarah mentioned they're evaluating 2 other vendors but our HRMS relationship gives us strong advantage. She's impressed with our solution and wants to move quickly. Key concern: Integration with their existing ERP system. Action: Schedule technical demo with CTO next week."
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeadData();
  }, [id]);

  const loadLeadData = async () => {
    setLoading(true);
    try {
      setLead({
        id: id || 'sarah-lee',
        name: 'Sarah Lee',
        title: 'CFO',
        company: 'TechStart Inc',
        source: 'HRMS',
        status: 'Contacted',
        score: 92,
        lastUpdated: 'Jan 6, 2025 10:30 AM'
      });
    } catch (error) {
      console.error('Error loading lead:', error);
      showToast('Failed to load lead data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQualify = () => {
    const validation = bantValidation.validateQualification(qualificationData.bantData);

    if (validation.validationType === 'noBantFilled') {
      setShowIncompleteBantModal(true);
      return;
    }

    if (validation.validationType === 'partialBant') {
      setShowPartialBantModal(true);
      return;
    }

    setShowQualifyModal(true);
  };

  const handleCompleteBant = () => {
    setShowIncompleteBantModal(false);
    setShowPartialBantModal(false);
    bantSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleQualifyAnywayFromPartial = () => {
    setShowPartialBantModal(false);
    setShowQualifyModal(true);
  };

  const handleConfirmQualify = async () => {
    try {
      setShowQualifyModal(false);
      showToast('✅ Lead qualified and synced to CRM', 'success');
      setTimeout(() => {
        navigate('/lead-gen/leads');
      }, 1000);
    } catch (error) {
      showToast('Failed to qualify lead', 'error');
    }
  };

  const handleDisqualify = () => {
    setShowDisqualifyModal(true);
  };

  const handleConfirmDisqualify = async (reason: string, sendNotification: boolean) => {
    try {
      setShowDisqualifyModal(false);
      showToast(`Lead disqualified${sendNotification ? ' (notification sent)' : ''}`, 'success');
      setTimeout(() => {
        navigate('/lead-gen/leads');
      }, 1000);
    } catch (error) {
      showToast('Failed to disqualify lead', 'error');
    }
  };

  const handleSaveDraft = async () => {
    try {
      showToast('💾 Draft saved', 'success');
    } catch (error) {
      showToast('Failed to save draft', 'error');
    }
  };

  const handleAddNotes = () => {
    setShowAddNotesModal(true);
  };

  const handleSaveNote = async (note: string, isPrivate: boolean) => {
    try {
      setShowAddNotesModal(false);
      showToast(`Note added${isPrivate ? ' (private)' : ''}`, 'success');
    } catch (error) {
      showToast('Failed to add note', 'error');
    }
  };

  const handleScoreAdjust = async (newScore: number, reason: string) => {
    try {
      setQualificationData(prev => ({ ...prev, aiScore: newScore }));
      showToast(`Score adjusted to ${newScore}/100`, 'success');
    } catch (error) {
      showToast('Failed to adjust score', 'error');
    }
  };

  const handleUpdateBANT = (bantData: any) => {
    setQualificationData(prev => ({ ...prev, bantData }));
  };

  const handleUpdateNotes = (notes: string) => {
    setQualificationData(prev => ({ ...prev, notes }));
  };

  const handleUpdateStatus = (status: string) => {
    setQualificationData(prev => ({ ...prev, finalStatus: status }));
  };

  const handleUpdateAssignee = (assignedTo: string) => {
    setQualificationData(prev => ({ ...prev, assignedTo }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading qualification data...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Lead not found</p>
          <button
            onClick={() => navigate('/lead-gen/leads')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Return to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/lead-gen/leads/${id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lead Details
          </button>

          <h1 className="text-3xl font-bold text-gray-900 text-center mb-8">
            LEAD SCORING & QUALIFICATION
          </h1>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">👤</span>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {lead.name} - {lead.title} @ {lead.company}
                  </h2>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">🏢</span>
                    {lead.source}
                  </span>
                  <span>•</span>
                  <span>Score: {lead.score}/100</span>
                  <div className="flex gap-0.5">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < Math.floor(lead.score / 10) ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  <span className="text-gray-600">
                    Current Status: <span className="font-medium text-yellow-600">{lead.status}</span> → <span className="font-medium text-gray-500">Qualification Pending</span>
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Last Updated: {lead.lastUpdated}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleQualify}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <CheckCircle className="h-4 w-4" />
                  Qualify & Sync
                </button>
                <button
                  onClick={handleDisqualify}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  <XCircle className="h-4 w-4" />
                  Disqualify Lead
                </button>
                <button
                  onClick={handleAddNotes}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <FileText className="h-4 w-4" />
                  Add Notes
                </button>
              </div>
            </div>
          </div>
        </div>

        <AIScoreBreakdown
          aiScore={qualificationData.aiScore}
          baseScore={qualificationData.baseScore}
          hrmsBonus={qualificationData.hrmsBonus}
          hrmsBonusPoints={qualificationData.hrmsBonusPoints}
          scoreComponents={qualificationData.scoreComponents}
          aiInsights={qualificationData.aiInsights}
          onScoreAdjust={handleScoreAdjust}
        />

        <div ref={bantSectionRef}>
          <BANTFramework
            bantData={qualificationData.bantData}
            onUpdate={handleUpdateBANT}
          />
        </div>

        <QualificationDecision
          aiScore={qualificationData.aiScore}
          bantScore={calculateBANTScore()}
          finalStatus={qualificationData.finalStatus}
          assignedTo={qualificationData.assignedTo}
          notes={qualificationData.notes}
          onUpdateStatus={handleUpdateStatus}
          onUpdateAssignee={handleUpdateAssignee}
          onUpdateNotes={handleUpdateNotes}
          onQualify={handleQualify}
          onDisqualify={handleDisqualify}
          onSaveDraft={handleSaveDraft}
        />

        <QualificationHistory leadId={lead.id} />
      </div>

      <QualifyLeadModal
        isOpen={showQualifyModal}
        onClose={() => setShowQualifyModal(false)}
        onConfirm={handleConfirmQualify}
        lead={{
          name: lead?.name || '',
          company: lead?.company || ''
        }}
        aiScore={qualificationData.aiScore}
        bantScore={calculateBANTScore()}
        assignedTo={qualificationData.assignedTo}
        hasIncompleteBANT={calculateBANTScore() < 15}
      />

      <DisqualifyLeadModal
        isOpen={showDisqualifyModal}
        onClose={() => setShowDisqualifyModal(false)}
        onConfirm={handleConfirmDisqualify}
        lead={{
          name: lead?.name || '',
          company: lead?.company || ''
        }}
      />

      <AddNotesModal
        isOpen={showAddNotesModal}
        onClose={() => setShowAddNotesModal(false)}
        onSave={handleSaveNote}
        lead={{
          name: lead?.name || '',
          company: lead?.company || ''
        }}
      />

      <IncompleteBantModal
        isOpen={showIncompleteBantModal}
        onClose={() => setShowIncompleteBantModal(false)}
        onCompleteBant={handleCompleteBant}
        onSaveDraft={handleSaveDraft}
        bantScore={bantValidation.calculateBantScore(qualificationData.bantData)}
        missingFields={{
          budget: !qualificationData.bantData.budget.status,
          authority: !qualificationData.bantData.authority.status,
          need: !qualificationData.bantData.need.status,
          timeline: !qualificationData.bantData.timeline.status
        }}
      />

      <PartialBantModal
        isOpen={showPartialBantModal}
        onClose={() => setShowPartialBantModal(false)}
        onQualifyAnyway={handleQualifyAnywayFromPartial}
        onCompleteBant={handleCompleteBant}
        onSaveDraft={handleSaveDraft}
        bantScore={bantValidation.calculateBantScore(qualificationData.bantData)}
        maxScore={bantValidation.validationRules.maxScore}
        completedFields={bantValidation.getDetailedBantFields(qualificationData.bantData).completed}
        missingFields={bantValidation.getDetailedBantFields(qualificationData.bantData).missing}
      />
    </div>
  );
};

export default LeadQualificationPage;
