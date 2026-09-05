import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getDeal, updateDeal, createDeal,
  transitionDealStage, fetchDealStageHistory,
} from '../../utils/dealsApi';
import { buildStageSpans, type DealStageSpan } from '../../utils/dealStageHistory';
import { fetchActivities, type ActivityRecord } from '../../utils/activitiesApi';
import { documentsService, type Document as DocumentRecord } from '../../services/documentsService';
import { formatDisplayDate, daysFromNow } from '../../utils/dateUtils';
import { calculateDealHealthScore } from '../../utils/dealHealthScore';
import { DealHealthScorePanel } from '../../components/Deal/DealForm/DealHealthScorePanel';
import { X, Keyboard, MoreVertical } from 'lucide-react';
import { DealHeroSection } from '../../components/Deal/DealHeroSection';
import { DealDetailsPanel } from '../../components/Deal/DealDetailsPanel';
import DealStakeholdersSection, { type DealStakeholder } from '../../components/Deal/DealStakeholdersSection';
import DealStageHistory from '../../components/Deal/DealStageHistory';
import { findContactRole } from '../../config/contactRoles';
import { BuyingCommitteeMap } from '../../components/Deal/BuyingCommitteeMap';
import { DealActivityTimeline } from '../../components/Deal/DealActivityTimeline';
import { DealNotesFiles } from '../../components/Deal/DealNotesFiles';
import {
  StageChangeModal,
  UpdateAmountModal,
  EmailComposerModal,
  CallLogModal,
  MeetingSchedulerModal,
  MoreOptionsDropdown,
  DuplicateDealModal,
} from '../../components/Deal/DealModals';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import type { DealValueHistoryEntry } from '../../types/dealManagement';
// computeMomentum / MomentumInput imports removed in Phase 0 — the engine is
// sound but had no real inputs. Re-import them when actual activity data exists
// to feed it (see the note beside `momentumResult` below).
import type { RevenueSchedule } from '../../components/Deal/RevenueTimeline';
import {
  fetchPipelines, findPipeline, defaultPipeline, terminalStage, stageIndex,
  type ApiPipeline,
} from '../../utils/pipelinesApi';

/**
 * The stage ladder, in pipeline order.
 *
 * Hoisted to module scope because three places need it: the fetch mapping, the
 * "move to next stage" affordance, and the keyboard shortcut. It used to exist
 * only inside the fetch effect, which is why the Move Stage modal hardcoded
 * "Proposal -> Negotiation" — the ladder was not in scope where it was needed.
 *
 * These are the slugs stored in deals.stage. pipeline_stages holds display
 * names ('Closed Won') and the two vocabularies have never been reconciled;
 * the server normalises across them when it resolves a probability. See
 * migration 014's header for why that mapping is a separate piece of work.
 */
/*
 * STAGE_LADDER lived here and STAGE_MAP lived inside the fetch effect below —
 * two of the five hardcoded copies of "every pipeline has these same six
 * stages" that this page and its hero carried between them. Both are gone; the
 * deal's own pipeline comes from GET /pipelines.
 *
 * What they got wrong was not hypothetical. STAGE_MAP had no entry for
 * `renewal-quoted`, so a Renewals deal fell through to its default of
 * `{ number: 1 }` and the page rendered "Stage 1 of 6" with Prospecting
 * highlighted — a stage that does not exist in that deal's pipeline.
 */

const TABS = [
  { id: 'overview',    label: 'Overview' },
  // 'AI Insights' was here. Its two panels were fed entirely by hardcoded
  // objects — an invented win probability and score breakdown, three
  // fabricated "similar deals", a predicted value range, churn and upsell
  // figures, and a data-sources panel claiming Clearbit and LinkedIn were
  // syncing. Phase-2 AI is out of scope per CLAUDE.md and the whole tab was
  // invented, so it is removed rather than labelled: a PREVIEW badge is for a
  // panel sitting among real ones, not for a tab with nothing real in it.
  { id: 'people',      label: 'People' },
  { id: 'timeline',    label: 'Timeline' },
  { id: 'files-notes', label: 'Files & Notes' },
  { id: 'deal-info',   label: 'Deal Info' },
] as const;

export const ComprehensiveDealDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [showStageChange, setShowStageChange] = useState(false);
  const [showUpdateAmount, setShowUpdateAmount] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [showCallLog, setShowCallLog] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTopMoreActions, setShowTopMoreActions] = useState(false);
  const [showDuplicateDeal, setShowDuplicateDeal] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  // Only read now. handleViewBattleCard used to set it from the AI panel's
  // "View Battle Card" action; DealDetailsPanel expands cards on its own.
  const [expandedBattleCard] = useState<string | null>(null);
  const [savedRevenueSchedule, setSavedRevenueSchedule] = useState<RevenueSchedule | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  // Was `true`, unconditionally, which showed admin-only fields on the Deal
  // Info panel to every user. RBAC is enforced at the API per CLAUDE.md; this
  // only governs what the panel renders.
  const isAdmin = user?.role === 'Admin';
  const battleCardRef      = useRef<HTMLDivElement>(null);
  const revenueTimelineRef = useRef<HTMLDivElement>(null);
  const heroRef            = useRef<HTMLDivElement>(null);
  // The 'E' shortcut needs the current primary stakeholder's address, but its
  // listener is bound once. A ref keeps the handler stable while still reading
  // a live value — and it starts empty rather than at a placeholder address,
  // so pressing E before a deal loads opens an empty composer instead of
  // addressing a stranger.
  const primaryStakeholderEmailRef = useRef<string>('');

  const [emailDetails, setEmailDetails] = useState({ to: '', subject: '', body: '' });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Baseline deal shape — overwritten by API data on mount
  const [deal, setDeal] = useState<any>({
    id: id || '1',
    companyName: 'Loading…',
    dealName: 'Loading…',
    amount: 0,
    currency: 'USD',
    base_amount_usd: 0,
    stage: 'prospecting',
    stageName: 'Prospecting',
    stageNumber: 1,
    totalStages: 6,
    closeDate: '',
    expectedCloseDate: '',
    owner: '',
    ownerId: '',
    ownerInfo: undefined as any,
    createdDate: '',
    accountName: '',
    accountSize: '',
    accountIndustry: '',
    // Resolved from the joined companies row (migration 027). Empty when the
    // deal is not linked to an account, which is the majority case today.
    companyId: '',
    companyResolvedName: '',
    companyIndustry: '',
    companyWebsite: '',
    companyDomain: '',
    companySize: '',
    companyCity: '',
    companyState: '',
    companyCountry: '',
    contactName: '',
    contactTitle: '',
    source: '',
    aiScore: 0,
    aiHealth: 'Unknown',
    daysAway: 0,
    probability: 0,
    winProbAI: 0,
    winProbOverrideReason: '',
    daysInStage: 0,
    totalDealAge: 0,
    package: '',
    contractTerm: '',
    paymentTerms: '',
    tags: [] as string[],
    nextStep: '',
    description: '',
    dealType: '',
    stakeholders: [] as any[],
    competitors: [] as any[],
    daysSinceContact: 0,
    dealValueHistory: [] as DealValueHistoryEntry[],
    salesDriveFolder: '',
    agreementUrl: '',
    accountModuleSetup: '',
    clientDiscovers: '',
    discoveryDate: '',
    platformFee: null as number | null,
    customFee: null as number | null,
    licenseFee: null as number | null,
    onboardingFee: null as number | null,
    whiteLabellingFee: null as number | null,
    exchangeRate: null as number | null,
    nrMargin: null as number | null,
    startDate: '',
    contractEndDate: '',
    country: '',
  });

  useEffect(() => {
    if (!id) { setLoading(false); return; }

    getDeal(id)
      .then(({ data }) => {
        const stage = data.stage || 'prospecting';
        // Name and number are DERIVED from the pipeline below, not looked up
        // here — this effect runs before the pipelines resolve. Seeded from the
        // slug so the page has something honest to show for one frame.
        const stageInfo = { name: stage.charAt(0).toUpperCase() + stage.slice(1), number: 1 };
        const closeDateIso: string = data.expected_close_date ?? '';
        const daysAway = daysFromNow(closeDateIso);
        const createdIso: string = data.created_at ?? '';
        const totalDealAge = createdIso
          ? Math.round((Date.now() - new Date(createdIso).getTime()) / 86400000)
          : 0;
        const rawTags = data.tags;
        const tags: string[] = Array.isArray(rawTags)
          ? rawTags
          : typeof rawTags === 'string'
            ? rawTags.replace(/[{}"]/g, '').split(',').filter(Boolean)
            : [];

        setDeal({
          id: data.id,
          dealName: data.name || data.title || 'Untitled Deal',
          companyName: data.company_name || '',
          accountName: data.company_name || '',
          amount: Number(data.value) || 0,
          currency: data.currency || 'USD',
          base_amount_usd: Number(data.base_amount_usd) || 0,
          stage,
          pipelineId: data.pipeline_id || 'new-business',
          stageName: stageInfo.name,
          stageNumber: stageInfo.number,
          totalStages: 6,
          closeDate: formatDisplayDate(closeDateIso),
          expectedCloseDate: formatDisplayDate(closeDateIso),
          owner: data.assigned_to || '',
          ownerId: data.owner_id || '',
          ownerInfo: {
            id: data.owner_id || undefined,
            name: data.assigned_to || '',
            email: data.owner_email || undefined,
            lastActiveAt: data.owner_last_active_at || undefined,
            outOfOffice: data.owner_out_of_office ? Boolean(data.owner_out_of_office) : undefined,
          },
          createdDate: formatDisplayDate(createdIso.split('T')[0]),
          accountSize: '',
          accountIndustry: data.account_industry || '',
          companyId: data.company_id || '',
          companyResolvedName: data.company_name_resolved || '',
          companyIndustry: data.company_industry || '',
          companyWebsite: data.company_website || '',
          companyDomain: data.company_domain || '',
          companySize: data.company_size || '',
          companyCity: data.company_city || '',
          companyState: data.company_state || '',
          companyCountry: data.company_country || '',
          contactName: data.contact_name || '',
          contactTitle: data.contact_title || '',
          source: data.source || '',
          aiScore: 0,
          aiHealth: 'Unknown',
          daysAway,
          probability: Number(data.probability) || 0,
          winProbAI: Number(data.win_prob_ai) || Number(data.probability) || 0,
          winProbOverrideReason: data.win_prob_override_reason || '',
          daysInStage: 0,
          totalDealAge,
          package: data.product || '',
          contractTerm: data.contract_term || '',
          paymentTerms: data.payment_terms || '',
          tags,
          nextStep: data.next_step || '',
          description: data.description || '',
          dealType: data.deal_type || '',
          stakeholders: Array.isArray(data.stakeholders) ? data.stakeholders : [],
          competitors: Array.isArray(data.competitors) ? data.competitors : [],
          // Computed server-side from deals.updated_at. Replaces the literal 5
          // that was passed to the hero and the timeline.
          daysSinceContact: Number(data.days_since_contact) || 0,
          dealValueHistory: Array.isArray(data.value_history) ? data.value_history : [],
          salesDriveFolder: data.sales_drive_folder || '',
          agreementUrl: data.agreement_url || '',
          accountModuleSetup: data.account_module_setup || '',
          clientDiscovers: data.client_discovers || '',
          discoveryDate: data.discovery_date ? data.discovery_date.split('T')[0] : '',
          platformFee: data.platform_fee != null ? Number(data.platform_fee) : null,
          customFee: data.custom_fee != null ? Number(data.custom_fee) : null,
          licenseFee: data.license_fee != null ? Number(data.license_fee) : null,
          onboardingFee: data.onboarding_fee != null ? Number(data.onboarding_fee) : null,
          whiteLabellingFee: data.white_labelling_fee != null ? Number(data.white_labelling_fee) : null,
          exchangeRate: data.exchange_rate != null ? Number(data.exchange_rate) : 1,
          nrMargin: data.nr_margin != null ? Number(data.nr_margin) : null,
          startDate: data.start_date ? data.start_date.split('T')[0] : '',
          contractEndDate: data.contract_end_date ? data.contract_end_date.split('T')[0] : '',
          country: data.country || '',
        });
      })
      .catch((err) => setFetchError(err.message ?? 'Failed to load deal'))
      .finally(() => setLoading(false));
  }, [id]);

  // Map loaded deal → formData shape expected by calculateDealHealthScore.
  // contactTitle is stored as the CRM role ID (champion, decision-maker, etc.)
  // because buildPayload sends contactRole as contact_title to the backend.
  const healthFormData = useMemo(() => ({
    dealName: deal.dealName,
    dealValue: String(deal.amount),
    closeDate: deal.closeDate,
    accountName: deal.accountName,
    primaryContactName: deal.contactName,
    contactRole: deal.contactTitle,
    additionalContacts: deal.stakeholders.filter((s: any) => !s.isPrimary),
    nextSteps: deal.nextStep,
    product: deal.package,
    source: deal.source,
    description: deal.description,
    dealType: deal.dealType,
  }), [deal]);

  const healthResult = useMemo(() => calculateDealHealthScore(healthFormData), [healthFormData]);

  // Compute days in current stage from stageChangedAt if available; undefined triggers component fallback

  // PHASE 0: the momentum badge was computed from a hardcoded demo fixture —
  // the block here was literally commented "Demo Accelerating — replace these
  // values to show Decelerating". Every deal in the product therefore displayed
  // the same invented momentum, and it was written back to the database (see
  // the removed effect below).
  //
  // `computeMomentum` itself is sound; it has no real inputs. To restore this,
  // feed it from actual data: response times from the email/activity log,
  // daysSinceLastTwoWay from the last inbound activity, stakeholder counts from
  // a deal_stakeholders table, and stage benchmarks from historical stage
  // durations. Until those exist, the badge is hidden rather than faked —
  // DealHeroSection guards on `momentumResult &&`, so undefined omits it.
  const momentumResult = undefined;

  // Revenue schedule seed data — branched by deal ID
  // TODO: replace with API field once revenueSchedule is persisted in the DB
  const seedRevenueSchedule = useMemo((): RevenueSchedule | null => {
    if (id === 'D036') {
      return {
        type: 'milestone',
        currency: 'USD',
        totalValue: 50000,
        installments: [
          { label: 'Contract Signing',       amount: 15000, dueDate: '1 Jun 2026',  status: 'paid'     },
          { label: 'Implementation Kickoff', amount: 20000, dueDate: '30 Jun 2026', status: 'upcoming' },
          { label: 'Go-Live',                amount: 15000, dueDate: '15 Aug 2026', status: 'upcoming' },
        ],
      };
    }
    if (id === 'D029') {
      return {
        type: 'recurring',
        currency: 'USD',
        totalValue: 15000,
        installments: [
          { label: 'Month 1', amount: 5000, dueDate: 'Jan 2025', status: 'overdue'  },
          { label: 'Month 2', amount: 5000, dueDate: 'Feb 2025', status: 'overdue'  },
          { label: 'Month 3', amount: 5000, dueDate: 'Mar 2025', status: 'upcoming' },
        ],
      };
    }
    return null;
  }, [id]);

  const activeRevenueSchedule = savedRevenueSchedule ?? seedRevenueSchedule;

  const handleViewRevenue = () => {
    setActiveTab('overview');
  };

  // PHASE 0: removed an effect that silently persisted the demo-derived
  // momentum level to the database on every page view:
  //
  //     updateDeal(id, { momentum_score: momentumResult.level }).catch(() => {});
  //
  // Three separate problems. It wrote fabricated data to real records; it fired
  // a PUT on every view of every deal; and because `momentum_score` is not a
  // column in the live schema, the request 500'd every time — swallowed by the
  // empty catch, so nobody ever saw it fail. Any future write belongs in an
  // explicit user action or a server-side computation, never an unconditional
  // effect with a silenced error handler.

  // Global keyboard shortcuts — fires when focus is NOT in an input/textarea/select
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      switch (e.key.toLowerCase()) {
        case 'e':
          handleSendEmail(primaryStakeholderEmailRef.current, '', '');
          break;
        case 'c':
          setShowCallLog(true);
          break;
        case 'm':
          setShowMeetingScheduler(true);
          break;
        case 'p':
          showToast('Proposal creator coming soon', 'info');
          break;
        case 's':
          if (deal.stageNumber < deal.totalStages) setShowStageChange(true);
          break;
        case 'u':
          setShowUpdateAmount(true);
          break;
        case '?':
          setShowShortcuts(true);
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deal.stageNumber, deal.totalStages]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    const hero = heroRef.current;
    const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 0;
    window.scrollTo({ top: heroBottom, behavior: 'instant' });
  };

  /**
   * ── WHAT USED TO BE HERE, AND WHY IT IS GONE ─────────────────────────────
   *
   * Nine hardcoded objects sat between this comment and `handleMoreAction`,
   * every one of them identical for every deal anyone opened:
   *
   *   aiIntelligenceData  invented win probability, a four-category score
   *                       breakdown, "+20% high engagement (92% response
   *                       rate)", "Competitor mentioned (Salesforce)", and
   *                       four next-best-actions naming a contact who does
   *                       not exist.
   *   stageHistory        an invented audit trail with per-stage benchmarks.
   *                       -> now GET /deals/:id/stage-history (migration 014).
   *   accountData         "Acme Corp", $12M revenue, Series B, $8M raised,
   *                       45% YoY growth, a tech stack and a competitor list.
   *                       -> the real company row, joined on deals.company_id
   *                       (migration 027). The enrichment fields are DELETED,
   *                       not re-sourced: there is no enrichment provider and
   *                       enrichment is out of phase.
   *   contacts            "John Smith, VP Sales, Champion, john@acme.com"
   *                       with an engagement sparkline and a response rate.
   *                       -> deals.stakeholders, a real jsonb column this page
   *                       was ALREADY fetching into state and then ignoring.
   *   hrmsConnection      a recruited-employee story. HRMS is a separate
   *                       platform across the SSO boundary and `employees`
   *                       has no tenant_id, so nothing here may join it.
   *   activities          an invented timeline with AI meeting summaries,
   *                       sentiment scores and extracted action items.
   *                       -> GET /activities?deal_id=.
   *   notes               two authored notes with @mentions.
   *                       -> activities of type 'note' on this deal.
   *   files               four PDFs with versions, sizes and a share link.
   *                       -> GET /documents for module 'deals'.
   *   sidebarData         the entire AI Insights right rail: deal score 78,
   *                       win probability 67%, "$48K - $52K predicted range",
   *                       three similar deals with similarity percentages,
   *                       churn risk, upsell potential, and a data-sources
   *                       panel claiming Clearbit and LinkedIn were syncing.
   *
   * The AI Insights tab is deleted rather than labelled. Phase-2 AI is out of
   * scope per CLAUDE.md ("omit these rather than half-building them"), and
   * unlike the dashboard panels that carry a PREVIEW badge, there was nothing
   * real beside it to give a label context — the tab was invented end to end.
   *
   * DealHealthScorePanel stays. calculateDealHealthScore is a deterministic
   * function over real deal fields, not a model output.
   */

  // ── Stage history — the audit trail, from deal_stage_history ──────────────
  const [stageSpans, setStageSpans] = useState<DealStageSpan[]>([]);
  const [stageHistoryError, setStageHistoryError] = useState<string | null>(null);
  const [stageHistoryLoading, setStageHistoryLoading] = useState(true);

  const loadStageHistory = useCallback(() => {
    if (!id) { setStageHistoryLoading(false); return; }
    setStageHistoryLoading(true);
    fetchDealStageHistory(id)
      .then(entries => { setStageSpans(buildStageSpans(entries)); setStageHistoryError(null); })
      .catch(e => setStageHistoryError(e?.message ?? 'Could not load stage history'))
      .finally(() => setStageHistoryLoading(false));
  }, [id]);

  useEffect(() => { loadStageHistory(); }, [loadStageHistory]);

  // ── Timeline and notes — both are `activities` rows on this deal ──────────
  // One request. A note IS an activity with type 'note' (the activities_type_
  // check allows it), so splitting them into two fetches would ask the same
  // endpoint the same question twice.
  const [dealActivities, setDealActivities] = useState<ActivityRecord[]>([]);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const loadActivities = useCallback(() => {
    if (!id) { setActivitiesLoading(false); return; }
    setActivitiesLoading(true);
    fetchActivities({ deal_id: id, limit: 200 })
      .then(rows => { setDealActivities(rows); setActivitiesError(null); })
      .catch(e => setActivitiesError(e?.message ?? 'Could not load activity'))
      .finally(() => setActivitiesLoading(false));
  }, [id]);

  useEffect(() => { loadActivities(); }, [loadActivities]);

  const timelineActivities = useMemo(
    () => dealActivities.filter(a => a.type !== 'note'),
    [dealActivities],
  );
  const dealNotes = useMemo(
    () => dealActivities.filter(a => a.type === 'note'),
    [dealActivities],
  );

  // ── Files — documents attached to this deal ───────────────────────────────
  const [dealDocuments, setDealDocuments] = useState<DocumentRecord[]>([]);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(true);

  useEffect(() => {
    if (!id) { setDocumentsLoading(false); return; }
    let cancelled = false;
    setDocumentsLoading(true);
    documentsService.loadDocuments({ entity_type: 'deals', entity_id: id, limit: 100 })
      .then(({ data }) => { if (!cancelled) { setDealDocuments(data); setDocumentsError(null); } })
      .catch(e => { if (!cancelled) setDocumentsError(e?.message ?? 'Could not load files'); })
      .finally(() => { if (!cancelled) setDocumentsLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  /**
   * ── Stakeholders — the buying committee, from deals.stakeholders ──────────
   *
   * This is real, persisted data that the page was already loading. `deal`
   * state has carried `stakeholders` from the API response since this view was
   * written; it rendered a hardcoded array of two people beside it.
   *
   * Five of twenty-five deals are populated today. The roles are the same
   * vocabulary as config/contactRoles.ts and contacts.buying_role
   * (migration 026), so the deal committee and the account team agree.
   *
   * Note what is NOT derived here: engagement percentages, response rates,
   * "last contact N days ago" and the sparkline the old array carried. There
   * is no email or call tracking in this product, so every one of those was
   * invented. A stakeholder shows a name, a title and a role — what is stored.
   */
  const stakeholders = useMemo(() => {
    const raw = Array.isArray(deal.stakeholders) ? deal.stakeholders : [];
    return raw
      .filter((s: any) => s && (s.name || s.title))
      .map((s: any, idx: number) => ({
        id: String(s.id ?? `stakeholder-${idx}`),
        name: String(s.name ?? '').trim(),
        title: s.title ? String(s.title) : '',
        email: s.email ? String(s.email) : '',
        // The stored role id ('decision-maker'), or null when the deal form
        // saved a stakeholder without one. Null must stay null — a default
        // would assert a position on the committee that nobody chose.
        role: s.role ? String(s.role) : null,
        isPrimary: Boolean(s.isPrimary),
      }));
  }, [deal.stakeholders]);

  /**
   * ── Account — the joined company row ──────────────────────────────────────
   *
   * getDealById joins companies on deals.company_id with a matching tenant_id
   * and projects company_* fields. When the deal is not linked to an account
   * (22 of 25 rows), every field here is empty and the People tab says so
   * rather than falling back to the free-text company_name as though it were a
   * resolved account.
   *
   * `companyName` still falls back to the free-text column, because for an
   * unlinked deal that string is the only record of who the deal is with — but
   * it is labelled in the UI as unlinked, so it cannot be mistaken for a
   * relationship that would let you click through.
   */
  /**
   * The stage this deal would advance to. Null at the end of the ladder and on
   * a closed deal — Closed Won has no "next", and offering one is how a modal
   * ends up claiming a move it cannot make.
   */
  /*
   * THE DEAL'S OWN PIPELINE. Everything stage-shaped on this page derives from
   * it: the display name, the "Stage N of M" counter, the strip in the hero,
   * which stage "next" means, and which stage "won" and "lost" mean.
   */
  const [pipelines, setPipelines] = useState<ApiPipeline[]>([]);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPipelines()
      .then(list => { if (!cancelled) { setPipelines(list); setPipelineError(null); } })
      .catch((e: Error) => { if (!cancelled) setPipelineError(e.message); });
    return () => { cancelled = true; };
  }, []);

  const dealPipeline = useMemo(
    () => findPipeline(pipelines, deal.pipelineId) ?? defaultPipeline(pipelines),
    [pipelines, deal.pipelineId],
  );

  /** Ordered stages of this deal's pipeline. Empty until they load. */
  const pipelineStages = useMemo(() => dealPipeline?.stages ?? [], [dealPipeline]);

  /**
   * Name and position, resolved against the pipeline rather than a constant.
   *
   * A stage the pipeline does not list — one retired since the deal last moved —
   * yields a null index, and the page shows the slug rather than pretending the
   * deal is in stage 1. That specific wrong answer is what the old STAGE_MAP
   * default produced for every Renewals and Partnerships deal.
   */
  const resolvedStage = useMemo(() => {
    const st = pipelineStages.find(s => s.slug === deal.stage) ?? null;
    return {
      name: st?.name ?? deal.stageName ?? deal.stage,
      number: stageIndex(dealPipeline, deal.stage) ?? 0,
      total: pipelineStages.length,
      stage: st,
    };
  }, [pipelineStages, dealPipeline, deal.stage, deal.stageName]);

  const nextStage = useMemo(() => {
    const idx = pipelineStages.findIndex(st => st.slug === deal.stage);
    if (idx < 0) return null;
    const candidate = pipelineStages[idx + 1];
    // No "next" past the end, and never into a LOST stage — advancing a deal
    // should not be able to mean losing it. Detected by stage_type rather than
    // by the literal 'closed-lost', which was only ever right for one pipeline.
    if (!candidate || candidate.stage_type === 'lost' || candidate.archived_at) return null;
    return { key: candidate.slug, name: candidate.name, number: idx + 2 };
  }, [pipelineStages, deal.stage]);

  /**
   * Days in the current stage.
   *
   * This read `deal.stageChangedAt`, a field the API does not return, then fell
   * back to `deal.daysInStage`, which the fetch mapping hardcodes to 0 — so it
   * was always undefined, and the hero's velocity strip supplied its own
   * fallback of 8. Both halves were invented.
   *
   * It now comes from the current span of the real stage history: the deal
   * entered its present stage at that transition's changed_at, so the elapsed
   * time is a measurement rather than an estimate. Undefined when the deal has
   * no recorded transition, which is honest — nothing knows when it arrived.
   */
  const timeInStage: number | undefined = useMemo(() => {
    const current = stageSpans.find(sp => sp.status === 'current');
    return current && current.startedAt ? current.days : undefined;
  }, [stageSpans]);

  const primaryStakeholder = useMemo(
    () => stakeholders.find((st: DealStakeholder) => st.isPrimary) ?? stakeholders[0] ?? null,
    [stakeholders],
  );

  /**
   * Committee nodes for BuyingCommitteeMap, which keys on display labels
   * ('Decision Maker') while the stored values are ids ('decision-maker').
   *
   * A stakeholder with no stored role is EXCLUDED rather than placed on a
   * default node. The map's whole purpose is showing which seats are empty, so
   * putting an unassigned person into one would fill a gap that is really open
   * — the same mistake as defaulting a role, expressed as a diagram.
   *
   * No `daysAgo` is passed. The map colours a node green/amber/red by days
   * since contact and falls back to red without it, which reads as "cold" when
   * the truth is "not tracked". Better a uniform unknown than a colour that
   * asserts a state; the node still shows the seat is filled.
   */
  const committeeContacts = useMemo(
    () => stakeholders
      .map((st: DealStakeholder) => {
        const cfg = findContactRole(st.role);
        return cfg ? { id: st.id, name: st.name, role: cfg.label } : null;
      })
      .filter((c: { id: string; name: string; role: string } | null): c is { id: string; name: string; role: string } => c !== null),
    [stakeholders],
  );

  /** deals.competitors is a real jsonb column written by the deal form. */
  const dealCompetitors = useMemo(() => {
    const raw = Array.isArray(deal.competitors) ? deal.competitors : [];
    return raw
      .map((c: any) => (typeof c === 'string' ? c : c?.name))
      .filter((n: unknown): n is string => typeof n === 'string' && n.trim().length > 0);
  }, [deal.competitors]);

  /** Real activities mapped to the timeline component's display shape. */
  const timelineEntries = useMemo(
    () => timelineActivities.map(a => {
      const whenIso = a.completed_at ?? a.scheduled_at ?? a.created_at ?? '';
      const when = whenIso ? new Date(whenIso) : null;
      return {
        id: a.id,
        // The component's union has no 'task'/'demo'/'proposal' member; those
        // map to 'note' so they still appear rather than being dropped.
        type: (['email', 'call', 'meeting', 'note'].includes(a.type ?? '')
          ? a.type
          : 'note') as 'email' | 'call' | 'meeting' | 'note',
        // Full instant: these are TIMESTAMPTZ, see the note in DealStageHistory.
        date: when ? formatDisplayDate(whenIso) : '',
        time: when ? when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
        title: a.subject || '(no subject)',
        description: a.description ?? undefined,
        user: a.assigned_to ?? undefined,
        isoDate: whenIso,
        // No aiSummary, engagement, hasRecording or hasTranscript: the invented
        // timeline carried meeting summaries with sentiment confidence scores
        // and extracted action items. Nothing produces them.
      };
    }),
    [timelineActivities],
  );

  /** Notes are activities of type 'note'. */
  const noteEntries = useMemo(
    () => dealNotes.map(a => ({
      id: a.id,
      date: formatDisplayDate(a.completed_at ?? a.created_at ?? ''),
      author: a.assigned_to ?? 'Unknown',
      content: a.description || a.subject || '',
      // The old notes carried ['Competitor', 'Stakeholder'] tags. Activities
      // have no tag column, so no tags rather than invented ones.
      tags: [] as string[],
    })),
    [dealNotes],
  );

  /**
   * Documents attached to this deal.
   *
   * The invented list had versions, supersession chains, "shared with buyer"
   * flags, share links and buyer-opened timestamps. `documents` stores a
   * version integer and nothing about sharing — documentsService.shareDocument
   * is explicitly unimplemented because there is no document_shares table — so
   * every row reports isSharedWithBuyer false and no link, which is true.
   */
  const fileEntries = useMemo(
    () => dealDocuments.map(d => ({
      id: d.id,
      name: d.name,
      size: d.file_size ? `${(d.file_size / 1024 / 1024).toFixed(1)} MB` : '—',
      date: formatDisplayDate(d.created_at ?? ''),
      uploadedBy: d.owner_name || '—',
      version: d.version ?? 1,
      isLatest: true,
      isSuperseded: false,
      baseId: d.id,
      isSharedWithBuyer: false,
    })),
    [dealDocuments],
  );

  useEffect(() => {
    primaryStakeholderEmailRef.current = primaryStakeholder?.email ?? '';
  }, [primaryStakeholder]);

  const account = useMemo(() => ({
    id: deal.companyId || '',
    linked: Boolean(deal.companyId),
    name: deal.companyResolvedName || deal.companyName || '',
    industry: deal.companyIndustry || deal.accountIndustry || '',
    website: deal.companyWebsite || '',
    domain: deal.companyDomain || '',
    size: deal.companySize || '',
    location: [deal.companyCity, deal.companyState, deal.companyCountry]
      .filter(Boolean).join(', '),
  }), [deal]);

  const handleMoreAction = async (action: string) => {
    switch (action) {
      case 'clone':
        setShowDuplicateDeal(true);
        break;
      case 'merge':
        showToast('Merge Deal feature coming soon', 'info');
        break;
      case 'change-owner':
        showToast('Use the "Assign Owner" button on the owner card', 'info');
        break;
      case 'change-stage':
        setShowStageChange(true);
        break;
      case 'mark-won': {
        /*
         * TWO BUGS FIXED HERE, both invisible while every pipeline had the same
         * six stages.
         *
         * 1. It wrote the literal 'closed-won'. A Renewals deal's won stage is
         *    `renewal-won`, so this sent a stage that does not exist in that
         *    deal's pipeline. Before Phase A that was written silently; after
         *    it, the server refuses with a 400 and the user saw only "Failed to
         *    update deal stage".
         * 2. It used updateDeal() — a plain field write — so marking a deal won
         *    recorded NO deal_stage_history row, despite this file's own comment
         *    on applyStageTransition saying a move must. The audit trail was
         *    missing exactly the transition that matters most.
         */
        const won = terminalStage(dealPipeline, 'won');
        if (!won) {
          showToast(
            `"${dealPipeline?.name ?? 'This pipeline'}" has no Won stage configured, so this deal cannot be marked won.`,
            'error',
          );
          break;
        }
        const confirmed = window.confirm(
          `Mark "${deal.dealName}" as WON?\n\nThis will move it to the ${won.name} stage.`
        );
        if (confirmed) {
          try {
            await applyStageTransition(stageIndex(dealPipeline, won.slug) ?? 0, won.name, won.slug);
            showToast('🎉 Deal marked as Won!', 'success');
          } catch {
            showToast('Failed to update deal stage.', 'error');
          }
        }
        break;
      }
      case 'mark-lost': {
        const lost = terminalStage(dealPipeline, 'lost');
        if (!lost) {
          showToast(
            `"${dealPipeline?.name ?? 'This pipeline'}" has no Lost stage configured, so this deal cannot be marked lost.`,
            'error',
          );
          break;
        }
        const confirmed = window.confirm(
          `Mark "${deal.dealName}" as LOST?\n\nThis action will move the deal to the ${lost.name} stage.`
        );
        if (confirmed) {
          try {
            await applyStageTransition(stageIndex(dealPipeline, lost.slug) ?? 0, lost.name, lost.slug);
            showToast('Deal marked as Lost.', 'info');
          } catch {
            showToast('Failed to update deal stage.', 'error');
          }
        }
        break;
      }
      case 'archive':
        showToast('Deal archived', 'info');
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this deal?')) {
          showToast('Deal deleted', 'success');
          navigate('/crm/deals');
        }
        break;
      case 'export-pdf':
        showToast('Exporting deal as PDF...', 'success');
        break;
      case 'share':
        showToast('Share link copied to clipboard', 'success');
        break;
    }
  };

  // handleMarkWon / handleMarkLost were bound to props on the AI panel that no
  // longer exists. 'mark-won' and 'mark-lost' remain reachable through
  // MoreOptionsDropdown -> handleMoreAction, which is the real write path.

  const handleDuplicateDeal = async (newName: string) => {
    if (!id) return;
    setIsDuplicating(true);
    try {
      const closeDateIso = deal.closeDate
        ? new Date(deal.closeDate).toISOString().split('T')[0]
        : undefined;

      const { data: newDeal } = await createDeal({
        name: newName,
        title: newName,
        value: deal.amount,
        currency: deal.currency || 'USD',
        base_amount_usd: deal.base_amount_usd || deal.amount,
        pipeline_id: 'new-business',
        pipeline_name: 'New Business',
        deal_type: deal.dealType || 'new-business',
        stage: 'prospecting',
        probability: 10,
        expected_close_date: closeDateIso,
        assigned_to: deal.owner || undefined,
        company_name: deal.companyName || undefined,
        contact_name: deal.contactName || undefined,
        contact_title: deal.contactTitle || undefined,
        source: deal.source || undefined,
        description: deal.description || undefined,
        next_step: deal.nextStep || undefined,
        tags: deal.tags?.length ? deal.tags : undefined,
        product: deal.package || undefined,
        contract_term: deal.contractTerm || undefined,
        payment_terms: deal.paymentTerms || undefined,
        account_industry: deal.accountIndustry || undefined,
        country: deal.country || undefined,
        platform_fee: deal.platformFee ?? undefined,
        custom_fee: deal.customFee ?? undefined,
        license_fee: deal.licenseFee ?? undefined,
        onboarding_fee: deal.onboardingFee ?? undefined,
        white_labelling_fee: deal.whiteLabellingFee ?? undefined,
        exchange_rate: deal.exchangeRate ?? undefined,
        nr_margin: deal.nrMargin ?? undefined,
        start_date: deal.startDate || undefined,
        contract_end_date: deal.contractEndDate || undefined,
        stakeholders: deal.stakeholders?.length ? deal.stakeholders : undefined,
      });
      setShowDuplicateDeal(false);
      const originalId = id;
      navigate(`/crm/deals/${newDeal.id}`);
      showToast(`Deal duplicated → ${newName}`, 'success');
      // Brief delay so the toast renders on the new page; link navigates back to original
      setTimeout(() => {
        showToast(`View original deal: /crm/deals/${originalId}`, 'info');
      }, 400);
    } catch (err) {
      showToast('Failed to duplicate deal. Please try again.', 'error');
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleAssignOwner = async (ownerName: string) => {
    setDeal((prev: any) => ({
      ...prev,
      owner: ownerName,
      ownerInfo: { ...(prev.ownerInfo || {}), name: ownerName },
    }));
    try {
      if (id) await updateDeal(id, { assigned_to: ownerName });
      showToast(`Owner assigned to ${ownerName}`, 'success');
    } catch {
      showToast('Failed to save owner assignment', 'error');
    }
  };

  const handleSaveCloseDate = async (isoDate: string) => {
    if (!id) return;
    const displayDate = new Date(isoDate).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    setDeal((prev: any) => ({ ...prev, closeDate: displayDate }));
    try {
      await updateDeal(id, { expected_close_date: isoDate });
      showToast('Close date updated', 'success');
    } catch {
      showToast('Failed to update close date', 'error');
    }
  };

  /**
   * Moving a deal writes an audit row, and that is why this goes to
   * POST /deals/:id/stage-transition rather than PUT /deals/:id.
   *
   * THIS IS WHY deal_stage_history WAS EMPTY. Both handlers here used to
   * bypass it. `handleStageSelect` called updateDeal() — a plain field update
   * that moves the deal and records nothing — and `handleStageChange`, behind
   * the Move Stage modal, called neither: it fired
   * showToast('Deal moved to Negotiation stage', 'success') and performed no
   * write at all, always naming Negotiation regardless of the deal's stage.
   * The endpoint, the transaction and the table have all existed since
   * migration 014; nothing called them, so the audit trail this page claims to
   * show had no rows to show and the page filled the gap with an invented one.
   *
   * The transition endpoint also derives the probability from the pipeline
   * stage default, so it is deliberately NOT sent here — passing one would be
   * recorded as a human override of a number the user never chose.
   */
  const applyStageTransition = async (stageNum: number, stageName: string, stageKey: string) => {
    if (!id) return;
    if (stageKey === deal.stage) return;

    const prev = { stage: deal.stage, stageName: deal.stageName, stageNumber: deal.stageNumber };
    setDeal((d: any) => ({ ...d, stage: stageKey, stageName, stageNumber: stageNum }));
    try {
      const { data } = await transitionDealStage(id, stageKey);
      // Take the probability back from the server rather than guessing it —
      // it comes from the pipeline stage, which the client does not know.
      if (data && data.probability != null) {
        setDeal((d: any) => ({ ...d, probability: Number(data.probability) }));
      }
      showToast(`Stage updated to ${stageName}`, 'success');
      // The move just wrote a history row; re-read so the audit trail on the
      // Deal Info tab reflects it without a page refresh.
      loadStageHistory();
    } catch (e: any) {
      setDeal((d: any) => ({ ...d, ...prev }));
      showToast(e?.message ?? 'Failed to update stage', 'error');
    }
  };

  const handleStageSelect = applyStageTransition;

  const handleUpdateAmount = async (newAmount: number, reason: string) => {
    if (!id) return;
    const changedBy = user?.name || 'You';
    const historyEntry: DealValueHistoryEntry = {
      previousValue: deal.amount,
      newValue: newAmount,
      changedAt: new Date().toISOString(),
      changedBy,
      reason: reason || undefined,
    };
    const previousAmount = deal.amount;
    const previousHistory = deal.dealValueHistory || [];
    setDeal((prev: any) => ({
      ...prev,
      amount: newAmount,
      dealValueHistory: [historyEntry, ...previousHistory],
    }));
    try {
      await updateDeal(id, { value: newAmount, value_change_reason: reason || undefined });
      showToast(`Deal amount updated to $${newAmount.toLocaleString()}`, 'success');
    } catch {
      setDeal((prev: any) => ({
        ...prev,
        amount: previousAmount,
        dealValueHistory: previousHistory,
      }));
      showToast('Failed to update deal amount', 'error');
    }
  };

  const handleSendEmail = (to: string, subject: string, body: string) => {
    setEmailDetails({ to, subject, body });
    setShowEmailComposer(true);
  };

  const handleScheduleMeeting = () => {
    showToast('Meeting scheduled successfully', 'success');
  };

  // handleViewBattleCard was passed to AIDealIntelligence. DealDetailsPanel
  // owns battle-card expansion itself through expandedBattleCard, which is
  // still wired below.

  /**
   * Was: navigate(`/crm/accounts/${accountData.name.toLowerCase()
   *                 .replace(/\s+/g, '-')}`)
   * which built '/crm/accounts/acme-corp' from the hardcoded account name.
   * Account ids are 'C001', so that route resolved to nothing on every deal —
   * the account page's "Account not found" state. It now uses the real
   * company_id, and is only reachable when the deal is linked.
   */
  const handleViewAccount = () => {
    if (!deal.companyId) return;
    navigate(`/crm/accounts/${deal.companyId}`);
  };

  /*
   * handleAddCEO, handleAddContact, handleAddToHRMS and handleRequestIntro were
   * removed with the components that called them:
   *   - handleAddCEO / handleAddContact fired a success toast and added
   *     nothing; stakeholders are edited on the deal form, which persists.
   *   - handleAddToHRMS claimed "Added to HRMS recruitment targets" and
   *     navigated to /hrms. HRMS is a separate platform across the SSO
   *     boundary and nothing was written.
   *   - handleRequestIntro pre-filled an email to john@acme.com.
   */

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3" />
      Loading deal…
    </div>
  );

  if (fetchError) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <p className="text-red-600 font-medium mb-2">Could not load deal</p>
      <p className="text-sm text-gray-500 mb-4">{fetchError}</p>
      <button onClick={() => navigate('/crm/deals')} className="text-blue-600 text-sm hover:underline">← Back to Deals</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 -mx-6 px-8 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              onClick={() => navigate('/crm/deals')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium shrink-0"
            >
              ← Deals
            </button>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-semibold text-gray-900 truncate">{deal.dealName}</h1>
          </div>
          <div className="flex items-center gap-2">
            {deal.stage === 'closed-won' ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded px-2.5 py-1 flex-shrink-0">
                ✓ WON
              </span>
            ) : deal.stage === 'closed-lost' ? (
              <span className="text-xs font-bold text-red-700 bg-red-100 border border-red-200 rounded px-2.5 py-1 flex-shrink-0">
                ✗ LOST
              </span>
            ) : null}
            <button
              onClick={() => navigate(`/crm/deals/${id}/edit`)}
              className="shrink-0 px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
            <div className="relative">
              <button
                onClick={() => setShowTopMoreActions(!showTopMoreActions)}
                className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
              >
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
              <MoreOptionsDropdown
                isOpen={showTopMoreActions}
                onClose={() => setShowTopMoreActions(false)}
                onAction={(action) => { handleMoreAction(action); setShowTopMoreActions(false); }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div ref={heroRef}>
      <DealHeroSection
        // stageName / stageNumber / totalStages are OVERRIDDEN with the values
        // resolved against the deal's own pipeline. The ones on `deal` are seeded
        // from the slug by the fetch effect, which runs before the pipelines
        // arrive; rendering those would show "Stage 1 of 6" for one frame on
        // every deal and permanently on any deal outside new-business.
        deal={{
          ...deal,
          aiScore: healthResult.score,
          aiHealth: healthResult.label,
          stageName: resolvedStage.name,
          stageNumber: resolvedStage.number,
          totalStages: resolvedStage.total,
        }}
        stages={pipelineStages}
        onEdit={() => navigate(`/crm/deals/${id}/edit`)}
        onMoreAction={handleMoreAction}
        onEmail={() => handleSendEmail(primaryStakeholder?.email ?? '', '', '')}
        onCall={() => setShowCallLog(true)}
        onMeeting={() => setShowMeetingScheduler(true)}
        onProposal={() => showToast('Proposal creator coming soon', 'info')}
        onMoveStage={() => setShowStageChange(true)}
        onUpdateAmount={() => setShowUpdateAmount(true)}
        onAssignOwner={handleAssignOwner}
        onSaveAmount={(amount) => handleUpdateAmount(amount, '')}
        onSaveCloseDate={handleSaveCloseDate}
        // onShowShortcuts removed: DealHeroSection declared the prop and never
        // read it, so this was passing a callback into nothing. The '?' key
        // still opens the modal through this page's own keydown listener.
        momentumResult={momentumResult}
        revenueSchedule={activeRevenueSchedule}
        onViewRevenue={handleViewRevenue}
        // priorityAction, onViewAllActions and healthScoreFactors are gone with
        // aiIntelligenceData: the "next best action" they surfaced was one of
        // four hardcoded suggestions ("Follow up today - 5 days since last
        // contact") shown on every deal, and the score factors were four fixed
        // category scores. daysSinceContact was the literal 5; it is now the
        // real days_since_contact the API computes from deals.updated_at.
        daysSinceContact={deal.daysSinceContact}
        timeInStage={timeInStage}
        onStageSelect={handleStageSelect}
      />
      </div>

      {/* Sticky Tab Navigation — items 16, 17, 18 */}
      {(() => {
        const STAGE_TAB_COLOR: Record<string, string> = {
          prospecting: '#3B82F6',
          qualified: '#22C55E',
          proposal: '#F97316',
          negotiation: '#A855F7',
          'closed-won': '#10B981',
          'closed-lost': '#EF4444',
        };
        const activeColor = STAGE_TAB_COLOR[deal.stage] || '#3B82F6';
        // The orange dot flags a committee gap: no stakeholder on this deal
        // holds a senior buying role. Real now — it reads stored roles, where
        // it used to test a hardcoded array in which the answer never changed.
        const hasSeniorBuyer = stakeholders.some((st: DealStakeholder) => findContactRole(st.role)?.isSeniorBuyer);
        const tabCounts: Record<string, number | null> = {
          'overview':    null,
          'people':      stakeholders.length,
          'timeline':    timelineActivities.length,
          'files-notes': dealNotes.length + dealDocuments.length,
          'deal-info':   null,
        };
        return (
          <div className="sticky top-14 z-40 bg-white border-b border-gray-200 -mx-6 px-8">
            <div className="flex overflow-x-auto scrollbar-none">
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const count = tabCounts[tab.id];
                const showOrangeDot = tab.id === 'people' && !hasSeniorBuyer;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-[3px] -mb-px ${
                      isActive
                        ? 'text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    style={isActive ? { borderBottomColor: activeColor } : {}}
                  >
                    {tab.label}
                    {count !== null && (
                      <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs rounded-full px-1.5">
                        {count}
                      </span>
                    )}
                    {showOrangeDot && (
                      <span className="absolute top-2 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Main Content — tab pages */}
      <div className="max-w-[1920px] mx-auto px-0 pt-2 pb-8">

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-0">

            {/* Section A — Primary stakeholder */}
            {(() => {
              // Was the first element of a hardcoded two-person array: "John
              // Smith, VP Sales, Champion, john@acme.com", with a "Last
              // contact: 5d ago" badge and a phone number, on every deal.
              // Now the stakeholder the deal form marked primary, or the first
              // one recorded. No last-contact badge: nothing tracks it.
              if (!primaryStakeholder) return (
                <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-4 mb-4 text-center text-sm text-gray-500">
                  No stakeholders recorded on this deal —{' '}
                  <button className="text-indigo-600 underline ml-1" onClick={() => handleTabClick('people')}>
                    add one
                  </button>
                </div>
              );
              const c = primaryStakeholder;
              const initials = c.name.split(/\s+/).filter(Boolean)
                .map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
              const roleCfg = findContactRole(c.role);
              return (
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{c.name || 'Unnamed'}</span>
                      {c.title && <span className="text-xs text-gray-500">{c.title}</span>}
                      {roleCfg
                        ? <span className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5 font-medium">{roleCfg.label}</span>
                        : <span className="text-xs border border-dashed border-gray-300 text-gray-400 rounded px-1.5 py-0.5 font-medium">No role set</span>}
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>{c.email}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {c.email && (
                      <Button onClick={() => handleSendEmail(c.email, '', '')} size="sm" className="rounded">
                        Email
                      </Button>
                    )}
                    <button onClick={() => handleTabClick('people')}
                      className="text-xs border border-gray-300 text-gray-600 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors">
                      All stakeholders →
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Section B — Activity summary */}
            {(() => {
              // The counts were real arithmetic over an invented array, so they
              // were consistent and wrong. They now count real activities on
              // this deal. "Response rate: 92%" is deleted outright — it read a
              // number out of a hardcoded string and there is no email tracking
              // to compute one from.
              if (activitiesLoading) {
                return <div className="h-10 bg-gray-50 rounded-lg border border-gray-200 mb-4 animate-pulse" />;
              }
              if (activitiesError) {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-xs text-red-700">
                    Could not load activity for this deal: {activitiesError}
                  </div>
                );
              }
              if (timelineActivities.length === 0) {
                return (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3 mb-4 text-xs text-gray-500">
                    No activity has been logged against this deal yet.
                  </div>
                );
              }
              const count = (t: string) => timelineActivities.filter(a => a.type === t).length;
              const times = timelineActivities
                .map(a => Date.parse(a.completed_at ?? a.scheduled_at ?? a.created_at ?? ''))
                .filter(Number.isFinite);
              const daysSince = times.length
                ? Math.floor((Date.now() - Math.max(...times)) / 86_400_000)
                : null;
              return (
                <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-3 mb-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-600 items-center">
                  {daysSince !== null && (
                    <span className="flex items-center gap-1">
                      Last activity:{' '}
                      <strong className={daysSince <= 3 ? 'text-green-600' : daysSince <= 7 ? 'text-amber-600' : 'text-red-600'}>
                        {daysSince === 0 ? 'Today' : daysSince === 1 ? 'Yesterday' : `${daysSince}d ago`}
                      </strong>
                    </span>
                  )}
                  <span><strong className="text-gray-800">{count('email')}</strong> emails</span>
                  <span><strong className="text-gray-800">{count('call')}</strong> calls</span>
                  <span><strong className="text-gray-800">{count('meeting')}</strong> meetings</span>
                </div>
              );
            })()}

            {/* Section C was <AIDealIntelligence showOnlyNextBestActions>, three
                hardcoded "next best actions" identical on every deal. Removed
                with the rest of aiIntelligenceData — see the note above.

                DealHealthScorePanel moved here from the deleted AI Insights
                tab. It is kept because it is NOT a model output:
                calculateDealHealthScore is a deterministic function over
                fields on this deal, and it says so in its own subtitle. */}
            <div className="max-w-xl">
              <DealHealthScorePanel
                formData={healthFormData}
                subtitle="Based on current deal completeness"
              />
            </div>
          </div>
        )}

        {/* ── Deal Info (full field panel) ── */}
        {activeTab === 'deal-info' && (
          <>
            {/* Surfaced above the panel rather than swallowed: a failed history
                read must not look like a deal that has never moved. */}
            {stageHistoryError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-xs text-red-700">
                Could not load the stage history: {stageHistoryError}
              </div>
            )}
            <DealStageHistory spans={stageSpans} loading={stageHistoryLoading} />
            <div className="h-6" />
            <DealDetailsPanel
              deal={deal}
              // competitors came from accountData.competitors - a two-element
              // literal ['Salesforce','HubSpot'] on every deal.
              // deals.competitors is a real jsonb column the form writes.
              competitors={dealCompetitors}
              expandedBattleCard={expandedBattleCard}
              isAdmin={isAdmin}
              battleCardRef={battleCardRef}
              revenueSchedule={activeRevenueSchedule}
              onSaveRevenueSchedule={(sched) => setSavedRevenueSchedule(sched)}
              revenueTimelineRef={revenueTimelineRef}
              onDealUpdated={(updates) => setDeal((prev: any) => ({ ...prev, ...updates }))}
            />
          </>
        )}

        {/* The 'AI Insights' tab rendered here. See the note beside TABS. */}

        {/* ── People ── */}
        {activeTab === 'people' && (
          <div className="space-y-6">
            <DealStakeholdersSection
              account={account}
              stakeholders={stakeholders}
              onViewAccount={handleViewAccount}
              onAddStakeholder={() => navigate(`/crm/deals/${id}/edit`)}
              onEmail={handleSendEmail}
            />
            <BuyingCommitteeMap
              contacts={committeeContacts}
              onAddContact={() => navigate(`/crm/deals/${id}/edit`)}
            />
          </div>
        )}

        {/* ── Timeline ── */}
        {activeTab === 'timeline' && (
          activitiesError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              Could not load this deal&rsquo;s activity: {activitiesError}
            </div>
          ) : (
            <DealActivityTimeline
              activities={timelineEntries}
              loading={activitiesLoading}
              // Was the literal 5. Now the API's days_since_contact, computed
              // from deals.updated_at.
              daysSinceLastContact={deal.daysSinceContact}
              contacts={stakeholders.map((st: DealStakeholder) => ({ id: st.id, name: st.name }))}
            />
          )
        )}

        {/* ── Files & Notes ── */}
        {activeTab === 'files-notes' && (
          <div className="space-y-6">
            {(activitiesError || documentsError) && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {activitiesError && <div>Could not load notes: {activitiesError}</div>}
                {documentsError && <div>Could not load files: {documentsError}</div>}
              </div>
            )}
            <DealNotesFiles
              notes={noteEntries}
              files={fileEntries}
              loading={activitiesLoading || documentsLoading}
            />
            {/* <DealDataAttribution> rendered here, listing "Lead Gen
                (Apollo.io)", "Clearbit (Company data)", "LinkedIn (Contact
                profile)" and "Salesforce (Tech stack)" as the sources this deal
                was enriched from, with "last enriched 2 days ago" and "94%
                accuracy". None of those integrations exists. Removed. */}
          </div>
        )}

      </div>

      {/* Modals */}
      {/* Current and next stage were the literals "Proposal" and "Negotiation",
          shown on every deal whatever stage it was actually in, above a confirm
          button that wrote nothing. Both now come from the deal. */}
      <StageChangeModal
        isOpen={showStageChange && nextStage !== null}
        onClose={() => setShowStageChange(false)}
        currentStage={deal.stageName}
        nextStage={nextStage?.name ?? ''}
        onConfirm={() => {
          if (!nextStage) return;
          setShowStageChange(false);
          applyStageTransition(nextStage.number, nextStage.name, nextStage.key);
        }}
      />

      <UpdateAmountModal
        isOpen={showUpdateAmount}
        onClose={() => setShowUpdateAmount(false)}
        currentAmount={deal.amount}
        onUpdate={handleUpdateAmount}
      />

      <DuplicateDealModal
        isOpen={showDuplicateDeal}
        onClose={() => setShowDuplicateDeal(false)}
        originalName={deal.dealName}
        dealValue={deal.amount ? `${deal.currency || 'USD'} ${deal.amount.toLocaleString()}` : '—'}
        owner={deal.owner || '—'}
        closeDate={deal.closeDate || '—'}
        onConfirm={handleDuplicateDeal}
        isLoading={isDuplicating}
      />

      {/*
        Three modals were removed here rather than rewired:

          AIBestTimeModal  suggested "best times to reach John Smith" from
                           nothing — a Phase-2 AI feature with no engagement
                           data behind it and a hardcoded contact name.
          FindCEOModal     offered to look up a company's CEO. That is contact
                           enrichment; no provider is configured.
          AddContactModal  reported "Contact added as Champion" and added
                           nothing. Stakeholders are edited on the deal form,
                           which persists them to deals.stakeholders, so the
                           People tab links there instead.
      */}

      <EmailComposerModal
        isOpen={showEmailComposer}
        onClose={() => setShowEmailComposer(false)}
        to={emailDetails.to}
        subject={emailDetails.subject}
        body={emailDetails.body}
      />

      <CallLogModal
        isOpen={showCallLog}
        onClose={() => setShowCallLog(false)}
        contactName={primaryStakeholder?.name ?? ''}
      />

      <MeetingSchedulerModal
        isOpen={showMeetingScheduler}
        onClose={() => setShowMeetingScheduler(false)}
        // Was ['John Smith', 'Alex Rodriguez'] on every deal.
        attendees={[
          ...(primaryStakeholder?.name ? [primaryStakeholder.name] : []),
          ...(user?.name ? [user.name] : []),
        ]}
        onSchedule={handleScheduleMeeting}
      />

      {/* ── Keyboard Shortcuts Modal ── */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowShortcuts(false); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowShortcuts(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-gray-600" />
                <h2 className="text-base font-semibold text-gray-900">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Content */}
            <div className="px-6 py-5">
              <p className="text-xs text-gray-500 mb-5">
                Press these keys anywhere on the deal page — except when typing in a field.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Action</th>
                    <th className="text-right pb-2 font-medium text-gray-500 text-xs uppercase tracking-wide">Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { action: 'Email',                   key: 'E',  desc: 'Open email composer'         },
                    { action: 'Call',                    key: 'C',  desc: 'Log a call'                  },
                    { action: 'Meeting',                 key: 'M',  desc: 'Schedule a meeting'           },
                    { action: 'Proposal',                key: 'P',  desc: 'Create a proposal'            },
                    { action: 'Move to Next Stage',      key: 'S',  desc: 'Advance pipeline stage'       },
                    { action: 'Update Amount',           key: 'U',  desc: 'Edit deal value'              },
                    { action: 'Open Shortcuts',          key: '?',  desc: 'Show this panel'              },
                  ].map(({ action, key, desc }) => (
                    <tr key={key} className="group">
                      <td className="py-2.5 pr-4">
                        <div className="font-medium text-gray-800">{action}</div>
                        <div className="text-xs text-gray-400">{desc}</div>
                      </td>
                      <td className="py-2.5 text-right">
                        <kbd className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-sm font-bold bg-gray-100 text-gray-700 border border-gray-300 rounded-lg shadow-[0_1px_0_0_rgba(0,0,0,0.15)] font-mono">
                          {key}
                        </kbd>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 text-center">
              Shortcuts are disabled when typing in any input field
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprehensiveDealDetailPage;
