import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, FileText } from 'lucide-react';
import AIScoreBreakdown from '../../components/LeadQualification/AIScoreBreakdown';
import BANTFramework from '../../components/LeadQualification/BANTFramework';
import QualificationDecision from '../../components/LeadQualification/QualificationDecision';
import QualificationHistory from '../../components/LeadQualification/QualificationHistory';
import { useToast } from '../../contexts/ToastContext';

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

  const handleQualify = async () => {
    try {
      showToast('Lead qualified and synced to CRM successfully!', 'success');
      navigate('/lead-gen/leads');
    } catch (error) {
      showToast('Failed to qualify lead', 'error');
    }
  };

  const handleDisqualify = async () => {
    try {
      showToast('Lead disqualified', 'success');
      navigate('/lead-gen/leads');
    } catch (error) {
      showToast('Failed to disqualify lead', 'error');
    }
  };

  const handleSaveDraft = async () => {
    try {
      showToast('Qualification saved as draft', 'success');
    } catch (error) {
      showToast('Failed to save draft', 'error');
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
                  <span className="text-yellow-500">🟡</span>
                  <span className="text-gray-600">
                    Current Status: <span className="font-medium">{lead.status}</span> → Qualification Pending
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Last Updated: {lead.lastUpdated}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleQualify}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Qualify Lead
                </button>
                <button
                  onClick={handleDisqualify}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Disqualify
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
        />

        <BANTFramework
          bantData={qualificationData.bantData}
          onUpdate={handleUpdateBANT}
        />

        <QualificationDecision
          aiScore={qualificationData.aiScore}
          bantScore={20}
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
    </div>
  );
};

export default LeadQualificationPage;
