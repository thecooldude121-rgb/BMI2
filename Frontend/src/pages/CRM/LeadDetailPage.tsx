import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Phone,
  Mail,
  Calendar,
  Star,
  TrendingUp,
  Activity,
  MessageSquare,
  FileText,
  Clock,
  User,
  Building,
  Tag,
  Target,
  Zap,
  ChevronDown,
  Linkedin,
  Globe,
  Users,
  TrendingDown,
  Plus,
  Upload,
  Send,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Bell,
  X,
} from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import LeadScoreBreakdownPanel from '../../components/Lead/LeadScoreBreakdownPanel';
import LeadConversionWizard from '../../components/Leads/LeadConversionWizard';
import { useLeads } from '../../contexts/LeadContext';
import { fetchLeadByIdFromAPI } from '../../utils/leadsApi';
import { computeMultiFactorScore } from '../../utils/leadScoring/multiFactorScore';
import { computeConversionReadiness } from '../../utils/conversionReadiness';
import TerminalStatusModal from '../../components/Leads/TerminalStatusModal';
import OutreachComposer from '../../components/Leads/OutreachComposer';
import type { OutreachFollowUp } from '../../components/Leads/OutreachComposer';
import type { TerminalAction } from '../../utils/leadReasons';
import type { Lead, LeadActivity, ActivityType } from '../../types/lead';
import { buildTimeline } from '../../utils/leadTimeline';
import ActivityTimeline from '../../components/Leads/ActivityTimeline';
import SalesMemoryBlock from '../../components/Leads/SalesMemoryBlock';
import MergeReviewModal from '../../components/Leads/MergeReviewModal';
import SourcePlaybookCard from '../../components/Leads/SourcePlaybookCard';
import { findDuplicates } from '../../utils/leadDuplicates';

// ── Display helpers ───────────────────────────────────────────────────────────

const leadDisplayName = (lead: Lead) =>
  lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const leadLocation = (lead: Lead) =>
  [lead.city, lead.state, lead.country].filter(Boolean).join(', ') || '—';

const leadAnnualRevenue = (lead: Lead) =>
  lead.annual_revenue ? `$${lead.annual_revenue.toLocaleString()} (estimated)` : '—';

// ── Component ─────────────────────────────────────────────────────────────────

const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateLead, deleteLead, leads: allLeads } = useLeads();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [enriching, setEnriching] = useState(false);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showMergeModal, setShowMergeModal]     = useState(false);
  const [terminalModalAction, setTerminalModalAction] = useState<TerminalAction | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  // Unified outreach composer
  const [showOutreachComposer, setShowOutreachComposer] = useState(false);
  const [outreachInitialChannel, setOutreachInitialChannel] = useState<ActivityType>('email');
  // Local activity timeline (prepended on each composer submit; TODO: persist via addActivity API)
  const [activities, setActivities] = useState<LeadActivity[]>([]);

  // Fetch real lead on mount
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchLeadByIdFromAPI(id).then(data => {
      setLead(data);
      setLoading(false);
    });
  }, [id]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new:               'bg-blue-500 text-white',
      assigned:          'bg-indigo-500 text-white',
      enriching:         'bg-cyan-500 text-white',
      attempting_contact: 'bg-orange-500 text-white',
      engaged:           'bg-emerald-500 text-white',
      qualified:         'bg-green-500 text-white',
      sales_accepted:    'bg-teal-500 text-white',
      nurture:           'bg-purple-500 text-white',
      disqualified:      'bg-gray-400 text-white',
      converted:         'bg-teal-600 text-white',
      lost:              'bg-red-500 text-white',
    };
    return colors[status] || 'bg-gray-500 text-white';
  };

  const getStarRating = (score: number) =>
    '⭐'.repeat(Math.min(5, Math.round((score / 100) * 5)));

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (lead) await deleteLead(lead.id);
    navigate('/crm/leads');
    setShowDeleteModal(false);
  };

  // Lifecycle order — used for forward/backward detection
  const LIFECYCLE_ORDER = [
    'new', 'assigned', 'enriching', 'attempting_contact',
    'engaged', 'qualified', 'sales_accepted',
    'nurture', 'disqualified', 'converted', 'lost',
  ];
  const EARLY_STAGES = new Set(['new', 'assigned', 'enriching', 'attempting_contact']);

  const applyStatusChange = async (newStatus: string) => {
    if (!lead) return;
    await updateLead(lead.id, { status: newStatus as Lead['status'] });
    setLead(prev => prev ? { ...prev, status: newStatus as Lead['status'] } : null);
    setShowStatusDropdown(false);
    setPendingStatus(null);
    showToast(`Status updated to ${newStatus}`);
  };

  const handleStatusChange = (newStatus: string) => {
    if (!lead) return;

    if (newStatus === 'disqualified' || newStatus === 'lost') {
      setShowStatusDropdown(false);
      setTerminalModalAction(newStatus as TerminalAction);
      return;
    }

    const currentIdx = LIFECYCLE_ORDER.indexOf(lead.status);
    const targetIdx  = LIFECYCLE_ORDER.indexOf(newStatus);

    // Hard block: early stage → converted (must pass through qualified first)
    if (EARLY_STAGES.has(lead.status) && newStatus === 'converted') {
      showToast('Cannot convert directly from this stage — must reach Qualified first.');
      setShowStatusDropdown(false);
      return;
    }

    // Soft warnings
    const isBackward = currentIdx > -1 && targetIdx > -1 && targetIdx < currentIdx;
    const skipsEngaged =
      ['new', 'assigned', 'enriching', 'attempting_contact'].includes(lead.status) &&
      newStatus === 'qualified';
    const salesAcceptedWithoutQual =
      newStatus === 'sales_accepted' && !lead.is_qualified;

    if (isBackward || skipsEngaged || salesAcceptedWithoutQual) {
      setPendingStatus(newStatus);
      setShowStatusDropdown(false);
      return;
    }

    void applyStatusChange(newStatus);
  };

  const openOutreach = (channel: ActivityType) => {
    setOutreachInitialChannel(channel);
    setShowOutreachComposer(true);
  };

  const handleOutreachSubmit = (activity: LeadActivity, followUp?: OutreachFollowUp) => {
    setActivities(prev => [activity, ...prev]);
    if (followUp?.date && lead) {
      void updateLead(lead.id, { next_follow_up_date: followUp.date });
      setLead(prev => prev ? { ...prev, next_follow_up_date: followUp.date } : null);
    }
    const labels: Record<string, string> = {
      email: 'Email logged', call: 'Call logged', whatsapp: 'WhatsApp logged',
      meeting: 'Meeting logged', note: 'Note saved', task: 'Task created',
    };
    showToast(`✅ ${labels[activity.type] ?? 'Activity logged'}`);
    setShowOutreachComposer(false);
  };

  const handleConvert = () => setShowConvertModal(true);


  const handleTerminalConfirm = async (reason: string, notes: string) => {
    if (!lead || !terminalModalAction) return;
    const status = terminalModalAction;
    const extra = status === 'disqualified'
      ? { disqualified_reason: reason, disqualified_reason_notes: notes || undefined }
      : { lost_reason: reason, lost_reason_notes: notes || undefined };
    await updateLead(lead.id, { status, ...extra } as Partial<Lead>);
    setLead(prev => prev ? { ...prev, status, ...extra } as Lead : null);
    showToast(`Lead marked as ${status}`);
    setTerminalModalAction(null);
  };

  const handleFileUpload = () => {
    showToast('✅ File uploaded successfully!');
    setShowFileUpload(false);
  };

  const handleReEnrich = async () => {
    setEnriching(true);
    setTimeout(() => {
      setEnriching(false);
      showToast('✅ Lead data re-enriched successfully!');
    }, 2000);
  };

  const handleSetReminder = () => {
    showToast('✅ Reminder set successfully!');
    setShowReminderForm(false);
  };

  // ── Loading & not found ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
          <p className="text-gray-600 mb-4">The lead you're looking for doesn't exist or was deleted.</p>
          <button
            onClick={() => navigate('/crm/leads')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  // Derived display values
  const displayName = leadDisplayName(lead);
  const score = lead.ai_score ?? lead.score;
  const enrichmentData = lead.enrichment_data || {};
  const techStack: string[] = enrichmentData.techStack || [];
  const recentNews: { title: string; date: string }[] = enrichmentData.recentNews || [];
  const scoreBreakdown: { factor: string; points: number; description: string }[] =
    enrichmentData.scoreBreakdown || [];
  const similarDeals: { company: string; status: string; value: string }[] =
    enrichmentData.similarDeals || [];
  const recommendedActions: { priority: string; action: string; reason: string; bestTime?: string }[] =
    (lead.ai_recommendations as any[]) || [];

  // Duplicate detection (person-level, scans entire lead pool)
  const duplicateCandidates = lead ? findDuplicates(lead, allLeads ?? []) : [];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
          <span className="text-sm">{toast}</span>
          <button onClick={() => setToast(null)} className="ml-1">
            <X className="h-4 w-4 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Status transition soft warning */}
      {pendingStatus && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">Confirm status change</h3>
            <p className="text-sm text-gray-600 mb-4">
              {pendingStatus === 'sales_accepted' && !lead?.is_qualified
                ? 'This lead is not formally qualified yet. Moving to Sales Accepted anyway?'
                : LIFECYCLE_ORDER.indexOf(pendingStatus) < LIFECYCLE_ORDER.indexOf(lead?.status ?? '')
                  ? `Moving backwards to "${pendingStatus.replace(/_/g, ' ')}" — confirm this is intentional.`
                  : `Skipping lifecycle steps to "${pendingStatus.replace(/_/g, ' ')}" — confirm this is intentional.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => void applyStatusChange(pendingStatus)}
                className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
              >
                Proceed anyway
              </button>
              <button
                onClick={() => setPendingStatus(null)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Delete Lead"
        message={`Are you sure you want to delete ${displayName}? This action cannot be undone.`}
        confirmLabel="Delete"
        type="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-8 py-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button onClick={() => navigate('/crm/leads')} className="hover:text-blue-600">
            Leads
          </button>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">{displayName}</span>
        </div>
      </div>

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <span>🎯</span>
              <span>Lead: {displayName}</span>
            </h1>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/crm/leads/${id}/edit`)}
                className="flex items-center px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-lg">{lead.position || '—'} at {lead.company || '—'}</p>
          <div className="flex items-center space-x-4 mt-3">
            <div className="flex items-center space-x-2 relative">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold ${getStatusColor(lead.status)} cursor-pointer hover:opacity-90`}
              >
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)} ▼
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-20 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
                  {([
                    'new', 'assigned', 'enriching', 'attempting_contact',
                    'engaged', 'qualified', 'sales_accepted',
                    'nurture', 'disqualified', 'converted', 'lost',
                  ] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Score:</span>
              <span className="text-xl font-bold text-green-800">{score}/100</span>
              <span className="text-lg">{getStarRating(score)}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => openOutreach('email')}
            className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Mail className="h-4 w-4 mr-2" />
            Send Email
          </button>
          <button
            onClick={() => openOutreach('call')}
            className="flex items-center px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <Phone className="h-4 w-4 mr-2" />
            Log Call
          </button>
          <button
            onClick={() => openOutreach('meeting')}
            className="flex items-center px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </button>
          <button
            onClick={() => setShowConvertModal(true)}
            className="flex items-center px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
          >
            <Users className="h-4 w-4 mr-2" />
            Convert to Contact
          </button>
          <button
            onClick={() => setTerminalModalAction('lost')}
            className="flex items-center px-5 py-2.5 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Mark as Lost
          </button>
        </div>
      </div>

      {/* Conversion Readiness Card */}
      {(() => {
        const mfs      = computeMultiFactorScore(lead);
        const rdns     = computeConversionReadiness(lead, mfs);
        const isActive = !['converted', 'lost', 'disqualified'].includes(lead.status);
        if (!isActive) return null;

        const STATE_STYLE: Record<string, { card: string; chip: string }> = {
          ready_for_deal:            { card: 'border-green-200  bg-green-50',  chip: 'bg-green-100  text-green-700  border-green-200'  },
          ready_for_account_contact: { card: 'border-teal-200   bg-teal-50',   chip: 'bg-teal-100   text-teal-700   border-teal-200'   },
          ready_for_contact:         { card: 'border-blue-200   bg-blue-50',   chip: 'bg-blue-100   text-blue-700   border-blue-200'   },
          needs_qualification:       { card: 'border-amber-200  bg-amber-50',  chip: 'bg-amber-100  text-amber-700  border-amber-200'  },
          needs_enrichment:          { card: 'border-orange-200 bg-orange-50', chip: 'bg-orange-100 text-orange-700 border-orange-200' },
          not_ready:                 { card: 'border-gray-200   bg-gray-50',   chip: 'bg-gray-100   text-gray-500   border-gray-200'   },
        };
        const style = STATE_STYLE[rdns.state] ?? STATE_STYLE.not_ready;
        const isConvertible = ['ready_for_deal', 'ready_for_account_contact', 'ready_for_contact'].includes(rdns.state);

        return (
          <div className={`mx-8 mt-6 rounded-xl border-2 p-5 ${style.card}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Conversion Readiness
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.chip}`}>
                    {rdns.label}
                  </span>
                </div>

                {/* Checklist — 2-column grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 mb-3">
                  {rdns.checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <span className={item.met ? 'text-green-500' : 'text-gray-300'}>
                        {item.met ? '✓' : '✗'}
                      </span>
                      <span className={item.met ? 'text-gray-700' : 'text-gray-400'}>{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Reasons / blockers */}
                {rdns.reasons.length > 0 && (
                  <div className="space-y-0.5">
                    {rdns.reasons.map((r, i) => (
                      <p key={i} className="text-xs text-gray-600 italic">{r}</p>
                    ))}
                  </div>
                )}
              </div>

              {isConvertible && (
                <button
                  onClick={handleConvert}
                  className="shrink-0 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  Convert →
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Conversion Wizard */}
      {showConvertModal && (
        <LeadConversionWizard
          lead={lead}
          readiness={computeConversionReadiness(lead, computeMultiFactorScore(lead))}
          isOpen={showConvertModal}
          onClose={() => setShowConvertModal(false)}
          onUpdateLead={updateLead}
        />
      )}

      {/* Two Column Layout */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* Duplicate detection banner */}
            {duplicateCandidates.length > 0 && (
              <div className={`rounded-lg border px-4 py-3 ${
                duplicateCandidates[0].risk === 'high'
                  ? 'bg-red-50 border-red-200'
                  : duplicateCandidates[0].risk === 'medium'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                      duplicateCandidates[0].risk === 'high' ? 'text-red-500'
                      : duplicateCandidates[0].risk === 'medium' ? 'text-amber-500'
                      : 'text-gray-400'
                    }`} />
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${
                        duplicateCandidates[0].risk === 'high' ? 'text-red-800'
                        : duplicateCandidates[0].risk === 'medium' ? 'text-amber-800'
                        : 'text-gray-700'
                      }`}>
                        {duplicateCandidates.length === 1 ? 'Similar lead found' : `${duplicateCandidates.length} similar leads found`}
                        {' · '}
                        <span className="font-normal capitalize">{duplicateCandidates[0].risk} confidence</span>
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {duplicateCandidates.slice(0, 3).map(c => {
                          const cl = (allLeads ?? []).find(l => l.id === c.leadId);
                          if (!cl) return null;
                          const name = cl.full_name || [cl.first_name, cl.last_name].filter(Boolean).join(' ') || cl.email || c.leadId;
                          return (
                            <p key={c.leadId} className="text-xs text-gray-600">
                              <span className="font-medium">{name}</span>
                              {cl.company && ` · ${cl.company}`}
                              {' — '}
                              {c.signals[0]?.reason}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMergeModal(true)}
                    className="flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 whitespace-nowrap transition-colors"
                  >
                    Review &amp; Merge
                  </button>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>👤 BASIC INFORMATION</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Name</p>
                  <p className="text-base text-gray-900">{displayName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                  <p className="text-base text-gray-900">{lead.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                  <p className="text-base text-gray-900">{lead.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Mobile</p>
                  <p className="text-base text-gray-900">{lead.mobile || '—'}</p>
                </div>
                {lead.linkedin_url && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500 mb-1">LinkedIn</p>
                    <a
                      href={lead.linkedin_url.startsWith('http') ? lead.linkedin_url : `https://${lead.linkedin_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <Linkedin className="h-4 w-4" />
                      <span>{lead.linkedin_url}</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Company</p>
                  <p className="text-base font-semibold text-gray-900">{lead.company || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Title</p>
                  <p className="text-base text-gray-900">{lead.position || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Department</p>
                  <p className="text-base text-gray-900">{lead.department || '—'}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">Source:</span>
                    <span className="text-sm text-gray-900">
                      🎯 {lead.source || '—'}{lead.source_detail ? ` (${lead.source_detail})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">Added:</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(lead.created_at)} by {lead.created_by || 'System'}
                    </span>
                  </div>
                  {lead.enriched_at && (
                    <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg mt-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">
                        🤖 AI Enriched — last updated {formatDate(lead.enriched_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                  <button className="px-3 py-1 border-2 border-dashed border-gray-300 rounded-full text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600">
                    + Add Tag
                  </button>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Building className="h-5 w-5 text-blue-600" />
                <span>🏢 COMPANY INFORMATION</span>
                {lead.enriched_at && (
                  <span className="text-sm font-normal text-purple-600">(🤖 AI Enriched)</span>
                )}
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Company</p>
                  <p className="text-base font-semibold text-gray-900">{lead.company || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Industry</p>
                  <p className="text-base text-gray-900">{lead.industry || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Company Size</p>
                  <p className="text-base text-gray-900">{lead.company_size || '—'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Annual Revenue</p>
                  <p className="text-base text-gray-900">{leadAnnualRevenue(lead)}</p>
                </div>
                {lead.website && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Website</p>
                    <a
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <Globe className="h-4 w-4" />
                      <span>{lead.website}</span>
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Location</p>
                  <p className="text-base text-gray-900">{leadLocation(lead)}</p>
                </div>
                {enrichmentData.founded && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Founded</p>
                    <p className="text-base text-gray-900">{enrichmentData.founded}</p>
                  </div>
                )}
              </div>

              {techStack.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Tech Stack:</p>
                  <ul className="space-y-2">
                    {techStack.map((tech, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="text-sm text-gray-900">{tech}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recentNews.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">Recent News:</p>
                  <ul className="space-y-2">
                    {recentNews.map((news, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-900">{news.title}</p>
                          <p className="text-xs text-gray-500">({news.date})</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => navigate('/crm/accounts')}
                className="mt-6 w-full px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
              >
                View Full Company Profile
              </button>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span>📋 ACTIVITY TIMELINE</span>
              </h3>

              <ActivityTimeline
                events={buildTimeline(lead, activities)}
                onLogActivity={() => openOutreach('call')}
              />
            </div>

            {/* Notes & Files */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>📝 NOTES & FILES</span>
              </h3>

              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No notes or files yet.</p>
                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={() => openOutreach('note')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Note</span>
                  </button>
                  <button
                    onClick={() => setShowFileUpload(true)}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Upload File</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">

            <SourcePlaybookCard lead={lead} />

            <SalesMemoryBlock lead={lead} recentActivities={activities.slice(0, 5)} />

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm border-2 border-purple-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Zap className="h-5 w-5 text-purple-600" />
                <span>🤖 AI INSIGHTS</span>
              </h3>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-green-800 mb-2">{score}/100</div>
                <div className="text-2xl mb-2">{getStarRating(score)}</div>
                <p className="text-sm font-semibold text-gray-700">
                  Rating: {score >= 80 ? 'High Potential' : score >= 60 ? 'Medium Potential' : 'Low Potential'}
                </p>
              </div>

              {scoreBreakdown.length > 0 && (
                <div className="border-t-2 border-purple-300 pt-4 mb-4">
                  <p className="text-sm font-bold text-gray-900 mb-4">━━━ Why This Score? ━━━━━━━━━━━━━━</p>
                  {scoreBreakdown.map((item, index) => (
                    <div key={index} className="mb-4 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.factor}</p>
                          <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                          <p className="text-xs font-semibold text-green-700 mt-1">
                            Score impact: +{item.points} points
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {similarDeals.length > 0 && (
                <div className="border-t-2 border-purple-300 pt-4">
                  <p className="text-sm font-bold text-gray-900 mb-4">━━━ Similar to Successful Deals ━━━</p>
                  {similarDeals.map((deal, index) => (
                    <div key={index} className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-900">• {deal.company}</span>
                      <span className="text-xs text-gray-600">({deal.status}, {deal.value})</span>
                    </div>
                  ))}
                </div>
              )}

              {scoreBreakdown.length === 0 && similarDeals.length === 0 && (
                <div className="border-t-2 border-purple-300 pt-4 text-center text-sm text-gray-500">
                  No AI analysis available yet for this lead.
                </div>
              )}
            </div>

            {/* Multi-factor score breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span>Score Breakdown</span>
              </h3>
              <LeadScoreBreakdownPanel
                multiFactorScore={computeMultiFactorScore(lead)}
                lead={lead}
              />
            </div>

            {/* AI Recommended Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Target className="h-5 w-5 text-orange-600" />
                <span>🎯 AI RECOMMENDED ACTIONS</span>
              </h3>

              {recommendedActions.length > 0 ? (
                <>
                  <div className="mb-4">
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                      Priority: HIGH
                    </span>
                  </div>
                  <div className="space-y-4">
                    {recommendedActions.map((action, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start space-x-2 mb-2">
                          <span className="font-bold text-gray-900">{index + 1}.</span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">{action.action}</p>
                            <p className="text-xs text-gray-600 mt-1">Reason: {action.reason}</p>
                            {action.bestTime && (
                              <p className="text-xs text-gray-600 mt-1">Best time: {action.bestTime}</p>
                            )}
                            {index === 0 && (
                              <div className="mt-3">
                                <button
                                  onClick={() => openOutreach('email')}
                                  className="w-full px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                                >
                                  Compose Email
                                </button>
                              </div>
                            )}
                            {index === 1 && lead.linkedin_url && (
                              <button
                                onClick={() => window.open(
                                  lead.linkedin_url!.startsWith('http') ? lead.linkedin_url! : `https://${lead.linkedin_url}`,
                                  '_blank'
                                )}
                                className="mt-2 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 w-full"
                              >
                                Send via LinkedIn →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start space-x-2">
                        <span className="font-bold text-gray-900">1.</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Contact This Lead Today</p>
                          <p className="text-xs text-gray-600 mt-1">Reason: New lead — reach out within 24 hours for best response rate</p>
                          <div className="mt-3 flex space-x-2">
                            <button
                              onClick={() => openOutreach('email')}
                              className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                            >
                              Send Email
                            </button>
                            <button
                              onClick={() => openOutreach('call')}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs font-medium hover:bg-gray-50"
                            >
                              Log Call
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start space-x-2">
                        <span className="font-bold text-gray-900">2.</span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900">Schedule Discovery Call</p>
                          <p className="text-xs text-gray-600 mt-1">Log a meeting or schedule with the prospect</p>
                          <div className="mt-3">
                            <button
                              onClick={() => openOutreach('meeting')}
                              className="w-full px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700"
                            >
                              Schedule Meeting
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate(`/crm/ai-copilot?query=Help me with the lead ${displayName} at ${lead.company || 'their company'}`)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center justify-center gap-2 text-sm font-medium transition-all"
                >
                  <Zap className="h-4 w-4" />
                  Get More AI Strategy for This Lead
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Ask AI Copilot for personalized strategy and talking points
                </p>
              </div>
            </div>

            {/* Integrations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                <span>🔗 INTEGRATIONS</span>
              </h3>

              <p className="text-sm font-medium text-gray-700 mb-3">Data Sources:</p>
              <div className="space-y-2 mb-4">
                {lead.source && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-900">{lead.source}</span>
                  </div>
                )}
                {lead.enriched_at && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-900">AI Enrichment (completed {formatDate(lead.enriched_at)})</span>
                  </div>
                )}
              </div>

              {lead.enriched_at && (
                <div className="text-xs text-gray-600 mb-3">
                  Last enriched: {formatDate(lead.enriched_at)}
                </div>
              )}

              <button
                onClick={handleReEnrich}
                disabled={enriching}
                className={`w-full px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center space-x-2 ${enriching ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`h-4 w-4 ${enriching ? 'animate-spin' : ''}`} />
                <span>{enriching ? 'Enriching…' : 'Re-enrich Data'}</span>
              </button>
            </div>

            {/* Next Steps */}
            <div className="bg-orange-50 rounded-lg shadow-sm border-2 border-orange-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>⚠️ NEXT STEPS</span>
              </h3>

              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                  {lead.next_follow_up_date
                    ? `Next follow-up: ${formatDate(lead.next_follow_up_date)}`
                    : 'No follow-up scheduled.'}
                </p>
                <p className="text-sm text-gray-700 mb-2">Recommended:</p>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Contact within 24 hours</li>
                  <li>• Convert to Contact after qualification</li>
                </ul>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowReminderForm(true)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-white text-sm font-medium flex items-center justify-center space-x-2"
                >
                  <Bell className="h-4 w-4" />
                  <span>Set Reminder</span>
                </button>
                <button
                  onClick={handleConvert}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                >
                  Convert Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Unified Outreach Composer */}
      {showOutreachComposer && (
        <OutreachComposer
          lead={lead}
          initialChannel={outreachInitialChannel}
          onSubmit={handleOutreachSubmit}
          onClose={() => setShowOutreachComposer(false)}
        />
      )}

      {/* Merge Review Modal */}
      {showMergeModal && lead && duplicateCandidates.length > 0 && (
        <MergeReviewModal
          lead={lead}
          candidateId={duplicateCandidates[0].leadId}
          allLeads={allLeads ?? []}
          candidates={duplicateCandidates}
          isOpen
          onClose={() => setShowMergeModal(false)}
          onUpdateLead={updateLead}
          onShowToast={(msg, type) => {
            if (type === 'success') showToast(`✅ ${msg}`);
            else showToast(msg);
          }}
        />
      )}

      {/* Mark as Disqualified / Lost */}
      <TerminalStatusModal
        open={terminalModalAction !== null}
        action={terminalModalAction ?? 'lost'}
        count={1}
        leadName={lead ? leadDisplayName(lead) : undefined}
        onConfirm={handleTerminalConfirm}
        onClose={() => setTerminalModalAction(null)}
      />

      {/* File Upload */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Upload File</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">Drag and drop your file here</p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <input type="file" id="fileInput" className="hidden" />
              <label htmlFor="fileInput" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block">
                Choose File
              </label>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={handleFileUpload} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Upload</button>
              <button onClick={() => setShowFileUpload(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder Form */}
      {showReminderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Set Reminder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option>Follow up call</option>
                  <option>Send email</option>
                  <option>Check status</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reminder Date & Time</label>
                <input type="datetime-local" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} placeholder="Reminder notes…" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={handleSetReminder} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Set Reminder</button>
              <button onClick={() => setShowReminderForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetailPage;
