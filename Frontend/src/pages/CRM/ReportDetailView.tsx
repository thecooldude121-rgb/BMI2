import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RefreshCw, Share2, Trash2, Pencil, Download, CalendarClock, Info, UserCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import PageHeader from '../../components/Layout/PageHeader';
import ProvenancePanel from '../../components/Reports/ProvenancePanel';
import {
  fetchReport, runSavedReport, deleteReport, fetchGrants, setGrant, revokeGrant,
  isReportId, sharedWithLabel, ReportsApiError, fetchTransferCandidates, transferReport,
  type SavedReport, type ReportRun, type ReportGrant, type GrantLevel,
  type TransferCandidate, type TransferRecord,
} from '../../utils/reportsApi';
import { fetchRoster, type WorkspaceMember } from '../../utils/usersApi';

/**
 * SAVED REPORT DETAIL, BY ID — reports replay step e (P3 Phase 5 on main).
 *
 * `/crm/reports/:reportId` resolves a real `saved_reports.id`. The heading is
 * the STORED name; nothing on this page is built from the URL.
 *
 * ─── OLD SLUG ADDRESSES ───────────────────────────────────────────────────
 * `/crm/reports/<slug>` used to render fixture rows ("GlobalCorp Industries",
 * owners "Alex Rodriguez") under a heading title-cased from the slug. A
 * parameter that is not a UUID is answered by an honest "out of date" state
 * WITHOUT a request, and the slug is never echoed: any URL text would render as
 * a report name.
 *
 * ─── EVERY FIGURE COMES FROM GET /reports/:id/run ─────────────────────────
 * No fallback path: if the run fails, the failure is what renders, and a
 * re-run that fails clears the previous table rather than leaving old figures
 * under an error.
 *
 * ─── FIGMA "Report detail" (75:13056) ─────────────────────────────────────
 * Its layout, with honest content: breadcrumb, eyebrow + title + actions, a
 * summary row (the frame's filter chips — here what the definition reads, not
 * fake controls), four tiles (here the run's PROVENANCE, not sample KPIs), the
 * result table, and the "Unavailable actions" note. Its charts are omitted: a
 * run returns a table, and a chart drawn from it would be a second rendering
 * nobody has specified. Sharing is REAL (grants), so Share is a working control
 * for the owner, unlike the frame's "Share · Coming soon".
 */

type RunError = { kind: 'stale' | 'unavailable' | 'timeout' | 'other'; message: string };

const runErrorOf = (e: unknown): RunError => {
  const status = (e as ReportsApiError)?.status;
  const message = (e as Error)?.message ?? 'Something went wrong.';
  return {
    kind: status === 409 ? 'stale' : status === 503 ? 'unavailable' : status === 504 ? 'timeout' : 'other',
    message,
  };
};

/**
 * The runner aliases its SELECT list `dim_0..n` then `metric_0..n`, indexed
 * within each list, while `columns` runs dimensions-then-metrics — so position
 * is not alias index once there are two dimensions. The failure mode is a
 * correct number under the wrong heading.
 */
const rowKeysFor = (columns: ReportRun['columns']): string[] => {
  let dims = 0, metrics = 0;
  return columns.map(c => (c.kind === 'dimension' ? `dim_${dims++}` : `metric_${metrics++}`));
};

const cell = (v: unknown): React.ReactNode =>
  v === null || v === undefined ? <span className="text-ink-muted">—</span> : String(v);

/** The product's words for the report modules (the registry's own labels). */
const MODULE_LABEL: Record<string, string> = {
  deals: 'Deals', companies: 'Accounts', contacts: 'Contacts', leads: 'Leads', activities: 'Activities',
};
const moduleLabel = (s: string) => MODULE_LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

const Breadcrumb: React.FC<{ current: string }> = ({ current }) => (
  <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
    <Link to="/crm/dashboard" className="font-semibold text-brand-600 hover:text-brand-700">Dashboard</Link>
    <span className="text-ink-muted" aria-hidden="true">/</span>
    <Link to="/crm/reports" className="font-semibold text-brand-600 hover:text-brand-700">Reports</Link>
    <span className="text-ink-muted" aria-hidden="true">/</span>
    <span className="text-ink-muted" aria-current="page">{current}</span>
  </nav>
);

const ReportDetailView: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  if (!isReportId(reportId)) return <OutdatedAddress />;
  // Keyed so a navigation to another report starts from a clean slate.
  return <SavedReportDetail key={reportId} reportId={reportId} />;
};

const OutdatedAddress: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4" data-testid="report-outdated-address">
      <Breadcrumb current="Out-of-date address" />
      <PageHeader eyebrow="Reports" title="This report address is out of date" />
      <EmptyState
        title="Nothing to show at this address"
        reason="Reports used to have addresses made from their names. Saved reports now open from the Reports list, where each one has its own permanent address."
        action={<Button variant="secondary" onClick={() => navigate('/crm/reports')}>Go to Reports</Button>}
      />
    </div>
  );
};

const SavedReportDetail: React.FC<{ reportId: string }> = ({ reportId }) => {
  const navigate = useNavigate();

  const [report, setReport] = useState<SavedReport | null>(null);
  const [metaState, setMetaState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [metaError, setMetaError] = useState<string | null>(null);

  const [run, setRun] = useState<ReportRun | null>(null);
  const [runError, setRunError] = useState<RunError | null>(null);
  const [running, setRunning] = useState(false);
  const [ranAt, setRanAt] = useState<Date | null>(null);

  const [shareCount, setShareCount] = useState<number | null>(null);
  const [shareCountFailed, setShareCountFailed] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  // Set only after the server confirmed the transfer and recorded it.
  const [transferred, setTransferred] = useState<TransferRecord | null>(null);

  const doRun = useCallback(async () => {
    setRunning(true);
    setRunError(null);
    try {
      const result = await runSavedReport(reportId);
      setRun(result);
      setRanAt(new Date());
    } catch (e) {
      // Never leave the previous figures up under an error.
      setRun(null);
      setRanAt(null);
      setRunError(runErrorOf(e));
    } finally {
      setRunning(false);
    }
  }, [reportId]);

  const loadShareCount = useCallback(async () => {
    try {
      const { grants } = await fetchGrants(reportId);
      setShareCount(grants.length);
      setShareCountFailed(false);
    } catch {
      // "Not shared" would be a claim about who has access; say we don't know.
      setShareCount(null);
      setShareCountFailed(true);
    }
  }, [reportId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meta = await fetchReport(reportId);
        if (cancelled) return;
        setReport(meta);
        setMetaState('ok');
        void loadShareCount();
        void doRun();
      } catch (e) {
        if (cancelled) return;
        if ((e as ReportsApiError)?.status === 404) setMetaState('missing');
        else { setMetaState('error'); setMetaError((e as Error).message); }
      }
    })();
    return () => { cancelled = true; };
  }, [reportId, doRun, loadShareCount]);

  const rowKeys = useMemo(() => (run ? rowKeysFor(run.columns) : []), [run]);

  const onDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteReport(reportId);
      // Only after the server confirmed it.
      navigate('/crm/reports', { replace: true });
    } catch (e) {
      setDeleteError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  if (metaState === 'loading') {
    return (
      <div className="flex flex-col gap-4">
        <Breadcrumb current="Saved report" />
        <p className="text-sm text-ink-muted" role="status">Loading report…</p>
      </div>
    );
  }

  if (metaState === 'missing') {
    // ONE message for "does not exist" and "not shared with you" — telling them
    // apart would tell a prober which report ids exist. The server answers 404
    // for both, never 403.
    return (
      <div className="flex flex-col gap-4" data-testid="report-not-found">
        <Breadcrumb current="Not found" />
        <PageHeader eyebrow="Reports" title="Report not found" />
        <EmptyState
          title="This report doesn't exist, or it isn't shared with you"
          reason="Saved reports are private unless their owner shares them. If you expected to see this one, ask its owner to share it with you."
          action={<Button variant="secondary" onClick={() => navigate('/crm/reports')}>Go to Reports</Button>}
        />
      </div>
    );
  }

  if (metaState === 'error' || !report) {
    return (
      <div className="flex flex-col gap-4" data-testid="report-load-error">
        <Breadcrumb current="Saved report" />
        <PageHeader eyebrow="Reports" title="Couldn't load this report" />
        <EmptyState
          tone="error"
          title="The report couldn't be loaded"
          reason={metaError ?? 'Something went wrong.'}
          action={<Button variant="secondary" onClick={() => window.location.reload()}>Try again</Button>}
        />
      </div>
    );
  }

  if (transferred) {
    // The new owner is active, so the report is no longer ownerless and no
    // longer visible to the admin who moved it (step c's rule) — say so
    // rather than leaving a page that would now 404 on its next request.
    return (
      <div className="flex flex-col gap-4" data-testid="report-transferred">
        <Breadcrumb current={report.name} />
        <PageHeader eyebrow="Reports" title={`Transferred to ${transferred.to_user_name}`} />
        <Alert tone="success" title={`“${report.name}” now belongs to ${transferred.to_user_name}`}>
          They have full owner rights.{' '}
          {report.status === 'draft' ? 'It is still a draft, private to them until they save it,' : 'It is private to them now,'} so it no longer appears in your list.
          {' '}Recorded: moved by {transferred.transferred_by_name}
          {transferred.from_user_name ? ` from ${transferred.from_user_name}` : ' (it had no owner)'}
          {' '}on {new Date(transferred.transferred_at).toLocaleString()}.
        </Alert>
        <div><Button variant="secondary" onClick={() => navigate('/crm/reports')}>Go to Reports</Button></div>
      </div>
    );
  }

  const a = report.abilities;
  const ownerLine = report.owner_id === null
    ? 'No owner — the account that created it was deleted'
    : report.ownerless
      ? `Owner ${report.owner_name ?? 'unknown'} is deactivated`
      : `Owner: ${report.owner_name ?? 'unknown'}`;
  const dims = run?.columns.filter(c => c.kind === 'dimension') ?? [];
  const metrics = run?.columns.filter(c => c.kind === 'metric') ?? [];
  const filterCount = report.definition.filters?.length ?? 0;

  return (
    <div className="flex flex-col gap-4" data-testid="report-detail">
      <Breadcrumb current={report.name} />

      <PageHeader
        eyebrow={`${report.status === 'draft' ? 'Draft' : 'Saved report'}${report.category ? ` · ${report.category}` : ''}`}
        title={report.name}
        description={report.description ?? undefined}
        actions={(
          <>
            <Button variant="secondary" onClick={() => void doRun()} disabled={running}>
              <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} aria-hidden="true" />
              {running ? 'Running…' : 'Re-run'}
            </Button>
            {/* Controls follow the SERVED abilities; one you lack is absent, not disabled. */}
            {a.can_share && (
              <Button variant="secondary" onClick={() => setShareOpen(true)}>
                <Share2 className="h-4 w-4" aria-hidden="true" /> Share
              </Button>
            )}
            {a.can_edit && (
              <Button variant="secondary" onClick={() => navigate(`/crm/custom-report-builder?id=${encodeURIComponent(reportId)}`)}>
                <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
              </Button>
            )}
            {a.can_transfer && (
              <Button variant="secondary" onClick={() => setTransferOpen(true)}>
                <UserCheck className="h-4 w-4" aria-hidden="true" /> Transfer
              </Button>
            )}
            {a.can_delete && (
              <Button variant="secondary" onClick={() => { setDeleteError(null); setConfirmDelete(true); }}>
                <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
              </Button>
            )}
            <Button variant="secondary" disabled title="Exports are not built yet">
              <Download className="h-4 w-4" aria-hidden="true" /> Export · Coming soon
            </Button>
            <Button variant="secondary" disabled title="Scheduled reports are not built yet">
              <CalendarClock className="h-4 w-4" aria-hidden="true" /> Schedule · Coming soon
            </Button>
          </>
        )}
      />

      {report.status === 'draft' && (
        <Alert tone="info" title="This is a draft">
          {report.ownerless
            ? 'Its owner is no longer active, so as an admin you can view, delete or transfer it. Whoever you transfer it to gets it as a draft, private to them.'
            : <>Only you can see it, and it can&rsquo;t be shared yet. Open it in the builder and choose Save report when it is ready.</>}
        </Alert>
      )}

      {/* Meta line: owner, sharing (from the real grants), when the figures ran. */}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted" data-testid="report-meta">
        <span>{ownerLine}</span>
        <span aria-hidden="true">·</span>
        <span data-testid="report-shared-with">
          {shareCountFailed ? "Couldn't load who it's shared with" : shareCount === null ? 'Checking sharing…' : sharedWithLabel(shareCount)}
        </span>
        {ranAt && run && (
          <>
            <span aria-hidden="true">·</span>
            <span>Ran at {ranAt.toLocaleTimeString()} in {run.ms} ms</span>
          </>
        )}
      </p>

      {/* The frame's filter-chip row: what the definition reads. Read-only facts, not controls. */}
      <div className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface-panel px-4 py-3" data-testid="report-summary">
        <Badge tone="neutral">Data: {moduleLabel(report.definition.base)}</Badge>
        {(report.definition.joins ?? []).map(j => <Badge key={j} tone="neutral">Linked: {moduleLabel(j)}</Badge>)}
        {dims.map(d => <Badge key={d.key} tone="neutral">Grouped by {d.label}</Badge>)}
        {metrics.map(m => <Badge key={m.key} tone="neutral">{m.label}</Badge>)}
        <Badge tone="neutral">{filterCount === 0 ? 'No filters' : `${filterCount} ${filterCount === 1 ? 'filter' : 'filters'}`}</Badge>
      </div>

      {runError && (
        <div data-testid={`report-error-${runError.kind}`}>
          {runError.kind === 'stale' && (
            <Alert tone="warning" title="This report can no longer run">
              A field or module it uses is no longer available, so nothing is shown rather than a partial result.
              {' '}{runError.message}{' '}
              {a.can_edit ? 'Open it in the builder (Edit) to fix the definition.' : 'Ask its owner to update it.'}
            </Alert>
          )}
          {runError.kind === 'unavailable' && (
            <Alert tone="danger" title="Reports are not available right now" action={<Button variant="secondary" onClick={() => void doRun()}>Try again</Button>}>
              Nothing was run, so no figures are shown. This is usually temporary.
            </Alert>
          )}
          {runError.kind === 'timeout' && (
            <Alert tone="danger" title="This report took too long and was stopped">
              Nothing is shown: a partial answer from a query that was cut off is not a smaller version of the right answer.
            </Alert>
          )}
          {runError.kind === 'other' && (
            <Alert tone="danger" title="Couldn't run this report" action={<Button variant="secondary" onClick={() => void doRun()}>Try again</Button>}>
              {runError.message}
            </Alert>
          )}
        </div>
      )}

      {!run && !runError && <p className="text-sm text-ink-muted" role="status">Running report…</p>}

      {run && (
        <>
          <ProvenancePanel provenance={run.provenance} />

          <section className="flex flex-col gap-3" aria-labelledby="report-results-heading">
            <div className="flex items-end justify-between gap-2">
              <h2 id="report-results-heading" className="text-xl font-semibold leading-7 text-ink-heading">Results</h2>
              <span className="text-xs text-ink-muted">
                {run.rows.length} {run.rows.length === 1 ? 'row' : 'rows'}
              </span>
            </div>
            <div className="overflow-hidden rounded-card border border-line bg-surface-panel">
              {run.rows.length === 0 ? (
                <EmptyState
                  title="No rows matched this report"
                  reason="That is a result, not a failure: nothing in this workspace fits the report's filters."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="report-results">
                    <thead className="bg-surface-sunken">
                      <tr>
                        {run.columns.map(c => (
                          <th
                            key={c.key}
                            scope="col"
                            className={`border-b border-line px-3 py-2 text-xs font-semibold uppercase text-ink-muted ${c.kind === 'metric' ? 'text-right' : 'text-left'}`}
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {run.rows.map((r, i) => (
                        <tr key={i} className="border-b border-line last:border-0">
                          {run.columns.map((c, n) => (
                            <td key={c.key} className={`px-3 py-2 text-ink ${c.kind === 'metric' ? 'text-right tabular-nums' : ''}`}>
                              {cell(r[rowKeys[n]])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="border-t border-line px-3 py-2 text-xs text-ink-muted">
                {run.provenance.truncated
                  ? `First ${run.provenance.row_limit.toLocaleString()} rows · there are more`
                  : `${run.rows.length} ${run.rows.length === 1 ? 'row' : 'rows'} · complete`}
              </div>
            </div>
          </section>
        </>
      )}

      <div className="flex items-start gap-2 rounded-card border border-line bg-surface-subtle px-4 py-3" data-testid="report-unavailable-actions">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-ink">Not available yet</p>
          <p className="text-ink-muted">
            Export and scheduling are not built yet, so those buttons are disabled.
            The figures above are calculated from your workspace each time the report runs.
          </p>
        </div>
      </div>

      <Modal
        isOpen={confirmDelete}
        onClose={() => { if (!deleting) setConfirmDelete(false); }}
        title={`Delete “${report.name}”?`}
        size="sm"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</Button>
            <Button variant="danger" onClick={() => void onDelete()} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete report'}
            </Button>
          </div>
        )}
      >
        <div className="flex flex-col gap-3 text-sm text-ink-muted">
          <p>This removes the saved report and everyone&rsquo;s access to it. The records it reports on are not touched.</p>
          {deleteError && <Alert tone="danger" title="The report was not deleted">{deleteError}</Alert>}
        </div>
      </Modal>

      {transferOpen && (
        <TransferDialog
          reportId={reportId}
          reportName={report.name}
          onClose={() => setTransferOpen(false)}
          onTransferred={(result) => {
            setTransferOpen(false);
            if (result.report.abilities?.can_view) {
              // Transferred to themselves: they own it now; show it with owner controls.
              setReport(result.report);
              void loadShareCount();
            } else {
              setTransferred(result.transfer);
            }
          }}
        />
      )}

      {shareOpen && (
        <ShareDialog
          reportId={reportId}
          reportName={report.name}
          ownerId={report.owner_id}
          onClose={() => { setShareOpen(false); void loadShareCount(); }}
        />
      )}
    </div>
  );
};

/**
 * SHARING, against the real `saved_report_grants`. Only active members are
 * offered (access nobody can use reads as a share that worked). Nobody is
 * emailed, and the dialog says so.
 */
/**
 * TRANSFER AN OWNERLESS REPORT (admin only — step c). The picker is step c's
 * `GET /reports/:id/transfer-candidates`: active members of this workspace,
 * nobody else. Success is reported only after the server moved the report and
 * recorded the transfer; a refusal keeps the dialog open with its reason.
 */
const TransferDialog: React.FC<{
  reportId: string;
  reportName: string;
  onClose: () => void;
  onTransferred: (r: { report: SavedReport; transfer: TransferRecord }) => void;
}> = ({ reportId, reportName, onClose, onTransferred }) => {
  const [people, setPeople] = useState<TransferCandidate[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [choice, setChoice] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTransferCandidates(reportId)
      .then(list => { if (!cancelled) setPeople(list); })
      .catch((e: Error) => { if (!cancelled) setLoadError(e.message); });
    return () => { cancelled = true; };
  }, [reportId]);

  const submit = async () => {
    if (!choice) return;
    setSaving(true);
    setSaveError(null);
    try {
      onTransferred(await transferReport(reportId, Number(choice)));
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={() => { if (!saving) onClose(); }}
      title="Transfer this report"
      description={reportName}
      size="sm"
      footer={(
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={!choice || saving}>
            {saving ? 'Transferring…' : 'Transfer'}
          </Button>
        </div>
      )}
    >
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-ink-muted">
          This report has no active owner. The person you choose becomes its owner with full rights, and the
          transfer is recorded. Once they own it, it is private to them unless they share it.
        </p>
        {loadError && <Alert tone="danger" title="Couldn't load the people you can choose">{loadError}</Alert>}
        {!loadError && people === null && <p className="text-ink-muted" role="status">Loading people…</p>}
        {people && people.length === 0 && (
          <p className="text-ink-muted">There is nobody active in this workspace to transfer it to.</p>
        )}
        {people && people.length > 0 && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink">New owner</span>
            <select
              value={choice}
              onChange={e => setChoice(e.target.value)}
              className="rounded-ctrl border border-line bg-white px-2 py-1.5 text-sm"
            >
              <option value="">Choose an active member…</option>
              {people.map(p => (
                <option key={p.id} value={String(p.id)}>{p.name ? `${p.name} · ${p.email}` : p.email}</option>
              ))}
            </select>
          </label>
        )}
        {saveError && <Alert tone="danger" title="The report was not transferred">{saveError}</Alert>}
      </div>
    </Modal>
  );
};

const ShareDialog: React.FC<{
  reportId: string; reportName: string; ownerId: number | null; onClose: () => void;
}> = ({ reportId, reportName, ownerId, onClose }) => {
  const [grants, setGrants] = useState<ReportGrant[]>([]);
  const [levels, setLevels] = useState<GrantLevel[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const [g, roster] = await Promise.all([fetchGrants(reportId), fetchRoster(false)]);
      setGrants(g.grants);
      setLevels(g.grantLevels);
      setMembers(roster.members.filter(m => m.isActive));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [reportId]);

  useEffect(() => { void reload(); }, [reload]);

  const granted = useMemo(() => new Set(grants.map(g => g.user_id)), [grants]);
  // The owner already has every right and cannot be granted one.
  const ungranted = members.filter(m => !granted.has(Number(m.id)) && Number(m.id) !== ownerId);

  const act = async (fn: () => Promise<void>) => {
    setErr(null);
    try { await fn(); await reload(); } catch (e) { setErr((e as Error).message); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Share this report" description={reportName} size="md">
      <div className="flex flex-col gap-5 text-sm">
        {err && <Alert tone="danger" title="That didn't save">{err}</Alert>}

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase text-ink-muted">Who has access</h3>
          {busy && <p className="text-ink-muted" role="status">Loading…</p>}
          {!busy && grants.length === 0 && <p className="text-ink-muted">Nobody else. A report is private until you share it.</p>}
          <ul className="flex flex-col gap-1.5">
            {grants.map(g => (
              <li key={g.user_id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-ink">
                  {g.name ?? g.email}<span className="text-ink-muted"> · {g.email}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <select
                    aria-label={`Access for ${g.name ?? g.email}`}
                    value={g.level}
                    onChange={e => void act(() => setGrant(reportId, g.user_id, e.target.value as GrantLevel))}
                    className="rounded-ctrl border border-line bg-white px-2 py-1 text-xs"
                  >
                    {levels.map(l => <option key={l} value={l}>{l === 'edit' ? 'Can edit' : 'Can view'}</option>)}
                  </select>
                  <Button variant="ghost" size="sm" onClick={() => void act(() => revokeGrant(reportId, g.user_id))}>
                    Remove
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase text-ink-muted">Add someone</h3>
          {!busy && ungranted.length === 0 && <p className="text-ink-muted">Everyone active in this workspace already has access.</p>}
          <ul className="flex flex-col gap-1.5">
            {ungranted.map(m => (
              <li key={m.id} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-ink">
                  {m.name || m.email}<span className="text-ink-muted"> · {m.email}</span>
                </span>
                <Button variant="link" size="sm" onClick={() => void act(() => setGrant(reportId, Number(m.id), 'view'))}>
                  Give view access
                </Button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-muted">
            Sharing takes effect immediately. Nobody is emailed — report sharing does not send mail.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default ReportDetailView;
