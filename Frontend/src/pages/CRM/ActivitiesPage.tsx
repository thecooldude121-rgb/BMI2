import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Download, Upload, Phone, Mail, Video, CheckCircle, FileText, Clock, BarChart3, Users, Building2, Calendar,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { inputClass, filterSelectClass } from '../../components/ui/Field';
import PageHeader from '../../components/Layout/PageHeader';
import LeadsPager from '../../components/Leads/LeadsPager';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import LogActivityModal from '../../components/CRM/LogActivityModal';
import RecordPicker from '../../components/common/RecordPicker';
import { RECORD_KIND_LABEL, type RecordOption } from '../../utils/recordSearch';
import {
  fetchActivitiesPage,
  fetchActivitySummary,
  updateActivity,
  ACTIVITY_TYPES,
  type ActivityRecord,
  type ActivityFilters,
  type ActivitySummary,
  type ActivityParent,
} from '../../utils/activitiesApi';
import { fetchUsers, type WorkspaceUser } from '../../utils/usersApi';
import { groupActivities, groupingCoverage, type ActivityGroup, type ActivityGroupMode } from '../../utils/activityGrouping';
import { localDay } from '../../utils/dates';

/**
 * Activities — Group A item 4, slice 4b (2026-10-12).
 *
 * The page loaded 200 activities once. Its Type / Date / Owner / Related /
 * Status dropdowns and its search box set state that NOTHING read, so every
 * "filter" left the list unchanged; the Owner list was three hardcoded names;
 * the six tiles counted the loaded rows. Several buttons announced results
 * that never happened — "Meeting cancelled", "Task marked as complete!", "Note
 * shared with team!" — over an unchanged database. Now:
 *   - one server page (25) under real filters, with a pager and the server's
 *     total; the tiles are GET /activities/summary under the SAME filters;
 *   - "today" / "this week" are the viewer's (local midnights, sent as
 *     instants) — the decision taken for Tasks on 2026-10-11;
 *   - Mark complete and Cancel are real saves (PUT /activities/:id), reported
 *     only after the 2xx; actions with nothing behind them are gone or
 *     "Coming soon";
 *   - Log activity opens the real form, after choosing the record it belongs
 *     to (an activity must hang off exactly one, enforced by the server);
 *   - the grouped views regroup THIS PAGE and say so.
 */

const PAGE_SIZE = 25;

const GROUPED_VIEWS: { mode: ActivityGroupMode; label: string; icon: React.ElementType }[] = [
  { mode: 'type', label: 'By Type', icon: BarChart3 },
  { mode: 'owner', label: 'By Owner', icon: Users },
  { mode: 'account', label: 'By Account', icon: Building2 },
];

type DateRange = '' | 'today' | 'yesterday' | 'week' | 'month';
const DATE_LABEL: Record<Exclude<DateRange, ''>, string> = { today: 'Today', yesterday: 'Yesterday', week: 'This week', month: 'This month' };

/** The viewer's local range as instants for ?occurred_after / ?occurred_before. */
function rangeFor(r: DateRange, now = new Date()): { occurred_after?: string; occurred_before?: string } {
  const d = (y: number, m: number, day: number) => new Date(y, m, day);
  const y = now.getFullYear(); const m = now.getMonth(); const t = now.getDate();
  switch (r) {
    case 'today': return { occurred_after: d(y, m, t).toISOString(), occurred_before: d(y, m, t + 1).toISOString() };
    case 'yesterday': return { occurred_after: d(y, m, t - 1).toISOString(), occurred_before: d(y, m, t).toISOString() };
    case 'week': { const s = t - ((now.getDay() + 6) % 7); /* Monday-start week */ return { occurred_after: d(y, m, s).toISOString(), occurred_before: d(y, m, s + 7).toISOString() }; }
    case 'month': return { occurred_after: d(y, m, 1).toISOString(), occurred_before: d(y, m + 1, 1).toISOString() };
    default: return {};
  }
}

type StatusChoice = '' | 'completed' | 'upcoming' | 'overdue' | 'cancelled';
const STATUS_FILTER: Record<Exclude<StatusChoice, ''>, Pick<ActivityFilters, 'status' | 'state'>> = {
  completed: { status: 'completed' }, upcoming: { state: 'upcoming' }, overdue: { state: 'overdue' }, cancelled: { status: 'cancelled' },
};

const when = (r: ActivityRecord) => r.completed_at ?? r.scheduled_at ?? r.created_at;

function displayStatus(r: ActivityRecord): { label: string; tone: BadgeTone } {
  if (r.status === 'completed') return { label: 'Completed', tone: 'success' };
  if (r.status === 'cancelled') return { label: 'Cancelled', tone: 'neutral' };
  if (r.status === 'no_show') return { label: 'No show', tone: 'neutral' };
  if (r.status === 'rescheduled') return { label: 'Rescheduled', tone: 'neutral' };
  if (r.status === 'planned' && r.scheduled_at && new Date(r.scheduled_at) < new Date()) return { label: 'Overdue', tone: 'danger' };
  if (r.status === 'planned') return { label: 'Upcoming', tone: 'brand' };
  return { label: 'No status', tone: 'neutral' };
}

const ICON: Record<string, React.ElementType> = { meeting: Video, call: Phone, email: Mail, task: CheckCircle, note: FileText };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** An activity hangs off exactly one of these (leads log from their own page). */
const LOG_KINDS: ('contact' | 'company' | 'deal')[] = ['contact', 'company', 'deal'];

const ActivitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'timeline' | ActivityGroupMode>('timeline');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState<DateRange>('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterLinked, setFilterLinked] = useState<'' | NonNullable<ActivityFilters['linked']>>('');
  const [filterStatus, setFilterStatus] = useState<StatusChoice>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey(k => k + 1), []);

  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<ActivityRecord | null>(null);

  // Log activity: choose the record first (an activity hangs off exactly one).
  const [pickerOpen, setPickerOpen] = useState(false);
  // Picked by SERVER search (slice 6) — it loaded the first 200 of each kind.
  const [picked, setPicked] = useState<RecordOption | null>(null);
  const [logParent, setLogParent] = useState<{ parent: ActivityParent; label: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // The real roster for the Owner filter (it was three hardcoded names).
  // activities.assigned_to holds a display name, so the filter sends the name.
  useEffect(() => {
    fetchUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  const filters = useMemo<ActivityFilters>(() => ({
    type: filterType || undefined,
    assigned_to: filterOwner || undefined,
    linked: filterLinked || undefined,
    search: search || undefined,
    ...(filterStatus ? STATUS_FILTER[filterStatus] : {}),
    ...rangeFor(filterDate),
  }), [filterType, filterOwner, filterLinked, search, filterStatus, filterDate]);

  useEffect(() => { setPage(1); }, [filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchActivitiesPage({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })
      .then(r => {
        if (cancelled) return;
        if (r.activities.length === 0 && r.total > 0 && page > 1) { setPage(Math.ceil(r.total / PAGE_SIZE)); return; }
        setRecords(r.activities); setTotal(r.total); setLoadError(null);
      })
      .catch(e => { if (!cancelled) setLoadError(e?.message ?? 'Could not load activities'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    fetchActivitySummary(filters)
      .then(r => { if (!cancelled) { setSummary(r); setSummaryError(null); } })
      .catch(e => { if (!cancelled) setSummaryError(e?.message ?? 'Could not load the activity counts'); });
    return () => { cancelled = true; };
  }, [filters, page, reloadKey]);

  const activeFilters = !!(filterType || filterDate || filterOwner || filterLinked || filterStatus || search);
  const clearAllFilters = () => {
    setFilterType(''); setFilterDate(''); setFilterOwner(''); setFilterLinked(''); setFilterStatus(''); setSearchInput(''); setSearch('');
  };

  const markComplete = async (r: ActivityRecord) => {
    setBusyId(r.id); setNotice(null); setActionError(null);
    try {
      await updateActivity(r.id, { status: 'completed' });
      setNotice(`Marked “${r.subject}” complete.`);
      reload();
    } catch (e: any) {
      setActionError(`“${r.subject}” was not updated — ${e?.message ?? 'the server refused'}`);
    } finally { setBusyId(null); }
  };

  const confirmCancel = async () => {
    const r = cancelling;
    setCancelling(null);
    if (!r) return;
    setBusyId(r.id); setNotice(null); setActionError(null);
    try {
      await updateActivity(r.id, { status: 'cancelled' });
      setNotice(`Cancelled “${r.subject}”.`);
      reload();
    } catch (e: any) {
      setActionError(`“${r.subject}” was not cancelled — ${e?.message ?? 'the server refused'}`);
    } finally { setBusyId(null); }
  };

  /** Timeline: this page grouped by the viewer's local day, newest first. */
  const dayGroups = useMemo((): ActivityGroup<ActivityRecord>[] => {
    const today = localDay(new Date());
    const yesterday = localDay(new Date(Date.now() - 86_400_000));
    const map = new Map<string, ActivityGroup<ActivityRecord>>();
    for (const r of records) {
      const at = new Date(when(r));
      const key = localDay(at);
      const nice = at.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const label = key === today ? 'Today' : key === yesterday ? 'Yesterday' : nice;
      const g = map.get(key);
      if (g) g.items.push(r); else map.set(key, { key, label, items: [r], isUnattributed: false });
    }
    return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [records]);

  const groups = useMemo(
    () => (viewMode === 'timeline' ? dayGroups : groupActivities(viewMode, records, records)),
    [viewMode, dayGroups, records],
  );
  const coverage = viewMode === 'timeline' ? null : groupingCoverage(groups);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const count = (k: keyof ActivitySummary) => (summary ? summary[k].toLocaleString() : '—');

  // Label, then the coloured value, then a caption (Figma 64:17786). Captions
  // say what each server count is. Weeks run Monday–Sunday (decided 2026-10-13).
  const tiles: { label: string; key: keyof ActivitySummary; tone: string; caption: string }[] = [
    { label: 'Total', key: 'total', tone: 'text-brand-600', caption: activeFilters ? 'Matching these filters' : 'All logged activity' },
    { label: 'Today', key: 'today', tone: 'text-brand-600', caption: 'Your local day' },
    { label: 'This Week', key: 'this_week', tone: 'text-brand-600', caption: 'Since Monday' },
    { label: 'Overdue', key: 'overdue', tone: 'text-danger-700', caption: 'Planned, time has passed' },
    { label: 'Meetings Today', key: 'meetings_today', tone: 'text-success-700', caption: 'Meetings on your local day' },
    { label: 'Calls Today', key: 'calls_today', tone: 'text-success-700', caption: 'Calls on your local day' },
  ];


  const relatedLinks = (r: ActivityRecord) => {
    const out: { to: string; label: string; kind: string }[] = [];
    if (r.company_id) out.push({ to: `/crm/accounts/${encodeURIComponent(r.company_id)}`, label: r.company_name || r.company_id, kind: 'Account' });
    if (r.deal_id) out.push({ to: `/crm/deals/${encodeURIComponent(r.deal_id)}`, label: r.deal_name || r.deal_id, kind: 'Deal' });
    if (r.contact_id) out.push({ to: `/crm/contacts/${encodeURIComponent(r.contact_id)}`, label: r.contact_name?.trim() || r.contact_id, kind: 'Contact' });
    if (r.lead_id != null) out.push({ to: `/crm/leads/${r.lead_id}`, label: r.lead_name || `Lead ${r.lead_id}`, kind: 'Lead' });
    return out;
  };

  const renderCard = (r: ActivityRecord) => {
    const Icon = ICON[r.type ?? ''] ?? FileText;
    const st = displayStatus(r);
    const at = new Date(when(r));
    const planned = r.status === 'planned';
    return (
      <Card key={r.id} data-testid={`activity-${r.id}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Badge tone="brand">{r.type ? cap(r.type) : 'No type'}</Badge>
                <h3 className="text-base font-semibold text-ink">{r.subject}</h3>
              </div>
              <span className="text-xs text-ink-muted">{at.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-ink-muted">
              {relatedLinks(r).map(l => (
                <span key={l.to}>{l.kind}: <Link to={l.to} className="font-medium text-brand-600 hover:underline">{l.label}</Link></span>
              ))}
              <span>Owner: <span className="text-ink">{r.assigned_to || 'Unassigned'}</span></span>
              {r.duration != null && <span>{r.duration} min</span>}
              <Badge tone={st.tone}>{st.label}</Badge>
            </div>
            {r.description && <p className="text-[13px] leading-5 text-ink">{r.description}</p>}
            {r.outcome && <p className="text-xs leading-[18px] text-ink-muted">Outcome: {r.outcome}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-2">
            <Button variant="secondary" className="h-8" onClick={() => navigate(`/crm/activities/${encodeURIComponent(r.id)}`)}>View Details</Button>
            {planned && (
              <>
                <Button className="h-8" onClick={() => void markComplete(r)} disabled={busyId === r.id}>
                  {busyId === r.id ? 'Saving…' : 'Mark complete'}
                </Button>
                <Button variant="secondary" className="h-8" onClick={() => setCancelling(r)} disabled={busyId === r.id}>Cancel</Button>
              </>
            )}
            {r.status === 'completed' && (
              <Button variant="secondary" className="h-8" onClick={() => navigate('/crm/tasks?new=1')}>Create follow-up task</Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Customer interactions · ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`}
        title="Activities"
        description="Track all customer interactions across your CRM"
        actions={
          <Button onClick={() => { setPicked(null); setPickerOpen(true); }}><Plus className="h-4 w-4" aria-hidden="true" /> Log activity</Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-6" data-testid="activity-tiles">
        {tiles.map(t => (
          <Card key={t.key} padding="none" className="p-3.5">
            <p className="text-xs font-semibold leading-[18px] text-ink-muted">{t.label}</p>
            <p className={`mt-[5px] text-2xl font-bold leading-8 ${t.tone}`} data-testid={`tile-${t.key}`}>{count(t.key)}</p>
            <p className="mt-[5px] text-xs leading-[18px] text-ink-muted">{t.caption}</p>
          </Card>
        ))}
      </div>
      {summaryError && <Alert tone="danger" title="The activity counts could not load">{summaryError}</Alert>}

      <Card padding="none" className="space-y-2 rounded-[12px] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Type" className={`${filterSelectClass()} w-[120px]`} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Type: All</option>
            {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{cap(t)}</option>)}
          </select>
          <select aria-label="Date" className={`${filterSelectClass()} w-[130px]`} value={filterDate} onChange={e => setFilterDate(e.target.value as DateRange)}>
            <option value="">Date: All</option>
            {(Object.keys(DATE_LABEL) as Exclude<DateRange, ''>[]).map(k => <option key={k} value={k}>{DATE_LABEL[k]}</option>)}
          </select>
          <select aria-label="Owner" className={`${filterSelectClass()} w-[130px]`} value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
            <option value="">Owner: All</option>
            {users.map(u => <option key={u.id} value={u.displayName}>{u.displayName}</option>)}
          </select>
          <select aria-label="Related" className={`${filterSelectClass()} w-[165px]`} value={filterLinked} onChange={e => setFilterLinked(e.target.value as typeof filterLinked)}>
            <option value="">Related: All</option>
            <option value="lead">Leads</option>
            <option value="deal">Deals</option>
            <option value="contact">Contacts</option>
            <option value="company">Accounts</option>
          </select>
          <select aria-label="Status" className={`${filterSelectClass()} w-[135px]`} value={filterStatus} onChange={e => setFilterStatus(e.target.value as StatusChoice)}>
            <option value="">Status: All</option>
            <option value="completed">Completed</option>
            <option value="upcoming">Upcoming</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" className="h-8" disabled title="Export is coming soon"><Download className="h-4 w-4" aria-hidden="true" /> Export · Soon</Button>
            <Button variant="secondary" className="h-8" disabled title="Import is coming soon"><Upload className="h-4 w-4" aria-hidden="true" /> Import · Soon</Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search activities</span>
            <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-ink-muted" aria-hidden="true" />
            {/* The server searches the SUBJECT only, so the placeholder says so (the frame's promises description and record too). */}
            <input className={`${inputClass()} h-8 bg-white pl-8 text-[13px]`} placeholder="Search activity subjects…" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
          </label>
          {activeFilters && <Button variant="secondary" className="h-8" onClick={clearAllFilters}>Clear filters</Button>}
        </div>
      </Card>
      {/* View switcher: one segmented control outside the filter card (Figma). */}
      <div className="inline-flex h-8 max-w-full overflow-x-auto rounded-ctrl border border-line bg-white text-[13px] font-medium" role="group" aria-label="Activity view">
        {[{ mode: 'timeline' as const, label: 'Timeline', icon: Clock }, ...GROUPED_VIEWS].map(({ mode, label, icon: Icon }, i) => (
          <button
            key={mode} type="button" aria-pressed={viewMode === mode} onClick={() => setViewMode(mode)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600 ${i > 0 ? 'border-l border-line' : ''} ${
              viewMode === mode ? 'bg-brand-100 text-brand-700' : 'text-ink hover:bg-surface-sunken'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" /> {label}
          </button>
        ))}
        <button type="button" disabled title="Calendar view is coming soon" className="inline-flex cursor-not-allowed items-center gap-1.5 whitespace-nowrap border-l border-line px-3 text-ink-secondary">
          <Calendar className="h-4 w-4" aria-hidden="true" /> Calendar · Soon
        </button>
      </div>

      {notice && <Alert tone="success" title={notice} action={<Button variant="link" onClick={() => setNotice(null)}>Dismiss</Button>} />}
      {actionError && <Alert tone="danger" title={actionError} />}

      {loadError && (
        <EmptyState tone="error" title="Could not load activities" reason={loadError}
          action={<Button variant="secondary" onClick={reload}>Try again</Button>} />
      )}
      {!loadError && loading && records.length === 0 && <p className="py-8 text-center text-sm text-ink-muted">Loading activities…</p>}
      {!loadError && !loading && total === 0 && (
        activeFilters
          ? <EmptyState title="No activities match these filters" reason="Try a wider date range or clear the filters."
              action={<Button variant="secondary" onClick={clearAllFilters}>Clear filters</Button>} />
          : <EmptyState title="No activity logged yet"
              reason="Calls, emails, meetings and notes logged against a lead, deal, contact or account appear here."
              action={<Button onClick={() => { setPicked(null); setPickerOpen(true); }}>Log activity</Button>} />
      )}

      {!loadError && total > 0 && (
        <div className="space-y-6" aria-busy={loading}>
          {coverage && (
            <p className="rounded-card border border-line bg-surface-panel px-4 py-2.5 text-sm text-ink" data-testid="grouping-note">
              Grouped from the {records.length} {records.length === 1 ? 'activity' : 'activities'} on this page, of {total.toLocaleString()} in all.
              {coverage.unattributed > 0 && (
                <> {coverage.unattributed} {coverage.unattributed === 1 ? 'has' : 'have'} no{' '}
                  {viewMode === 'account' ? 'account linked — an activity logged against a deal, contact or lead carries no account of its own.'
                    : viewMode === 'owner' ? 'owner assigned.' : 'type recorded.'}</>
              )}
            </p>
          )}
          {groups.map(g => (
            <section key={g.key} aria-label={g.label} className="space-y-3">
              <div className="flex items-end justify-between gap-3 border-b-2 border-ink pb-2">
                <h2 className={`text-2xl font-semibold leading-8 ${g.isUnattributed ? 'italic text-ink-secondary' : 'text-ink-heading'}`}>{g.label}</h2>
                <span className="text-xs text-ink-secondary">
                  {g.items.length} shown{viewMode === 'timeline' ? ' · local day' : ''}
                </span>
              </div>
              <div className="space-y-3">{g.items.map(renderCard)}</div>
            </section>
          ))}
          <Card padding="none">
            <LeadsPager page={page} pageCount={pageCount} total={total} pageSize={PAGE_SIZE}
              shown={records.length} loading={loading} onPage={setPage} noun="activities" />
          </Card>
        </div>
      )}

      <ConfirmationModal
        isOpen={cancelling !== null}
        type="danger"
        title="Cancel activity"
        message={cancelling ? `Mark “${cancelling.subject}” as cancelled?` : ''}
        confirmLabel="Cancel activity"
        onCancel={() => setCancelling(null)}
        onConfirm={() => { void confirmCancel(); }}
      />

      <Modal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Log activity"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPickerOpen(false)}>Cancel</Button>
            <Button
              disabled={!picked}
              onClick={() => {
                if (!picked) return;
                const parent: ActivityParent = picked.kind === 'contact' ? { contact_id: picked.id } : picked.kind === 'company' ? { company_id: picked.id } : { deal_id: picked.id };
                setPickerOpen(false);
                setLogParent({ parent, label: `${RECORD_KIND_LABEL[picked.kind]}: ${picked.label}` });
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink-muted">An activity belongs to one record. Choose it first.</p>
        <div className="mt-3 space-y-3">
          <RecordPicker kinds={LOG_KINDS} value={picked} onChange={setPicked} label="Search for the record" />
          <p className="text-xs text-ink-muted">Leads have their own log-activity composer on the lead's page.</p>
        </div>
      </Modal>

      {logParent && (
        <LogActivityModal
          isOpen
          onClose={() => setLogParent(null)}
          parent={logParent.parent}
          parentLabel={logParent.label}
          onLogged={a => { setLogParent(null); setNotice(`Logged “${a.subject}”.`); reload(); }}
        />
      )}
    </div>
  );
};

export default ActivitiesPage;
