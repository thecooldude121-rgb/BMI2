import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Download, Share2, Pencil, Trash2, RefreshCw, AlertCircle, Clock, X,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import ProvenanceNote from '../../components/Reports/ProvenanceNote';
import {
  fetchReport, runSavedReport, deleteReport,
  fetchGrants, setGrant, revokeGrant, ReportsApiError,
  type SavedReport, type ReportRun, type ReportGrant, type GrantLevel,
} from '../../utils/reportsApi';
import { fetchRoster, type WorkspaceMember } from '../../utils/usersApi';

/**
 * SAVED REPORT DETAIL — P3 Phase 5. The last of the report facades.
 *
 * ─── ROUTED BY ID, AND THE OLD ROUTE WAS THE BUG ──────────────────────────
 *
 * This page used to live at `/crm/reports/:reportSlug`, where the slug was a
 * DISPLAY NAME run through `toLowerCase().replace(/\s+/g, '-')` by the caller,
 * and the page then title-cased it back to produce a heading. That is a display
 * name used as a primary key — the defect migrations 039-043 exist to remove,
 * and the one this project has rejected for `forecast_snapshots.rep_name`, for
 * `deals.company_name`, and for the meeting/document polymorphic references.
 *
 * It did not even round-trip: "Revenue by Industry" came back as "Revenue By
 * Industry". And two reports sharing a name would have shared a URL.
 *
 * It is now `/crm/reports/:reportId`, resolving a real `saved_reports.id`. A
 * report that does not exist is a 404 saying so, not a page that renders
 * whatever its URL happened to spell.
 *
 * ─── EVERY FIGURE COMES FROM GET /reports/:id/run ──────────────────────────
 *
 * The old page's `getReportData(slug)` returned ~600 lines of fabricated rows —
 * "GlobalCorp Industries", "TechVision Solutions", owners "Alex Rodriguez" and
 * "Sarah Chen" — the same fixture-name family as the deleted meeting and
 * gamification fixtures. It carried a PREVIEW banner, which is why it survived;
 * a banner is not enough for rows that name people and quote their numbers.
 *
 * There is no fallback path here. If the run fails, the failure is what renders.
 */

const fmt = (v: unknown): React.ReactNode =>
  v === null || v === undefined
    ? <span className="text-gray-300">—</span>
    : String(v);

/**
 * The runner aliases its SELECT list `dim_0..n` then `metric_0..n`, indexed
 * within each list, while `columns` runs dimensions-then-metrics. Position is
 * therefore not alias index once there are two dimensions. Same helper as the
 * builder, same reason: the failure mode is a correct number under the wrong
 * heading.
 */
const rowKeysFor = (columns: ReportRun['columns']): string[] => {
  let dims = 0, metrics = 0;
  return columns.map(c => (c.kind === 'dimension' ? `dim_${dims++}` : `metric_${metrics++}`));
};

type LoadError = { message: string; kind: 'missing' | 'stale' | 'timeout' | 'other' };

const ReportDetailView: React.FC = () => {
  const navigate = useNavigate();
  // `reportId`, not `reportSlug`. The route parameter is the id.
  const { reportId } = useParams<{ reportId: string }>();

  const [report, setReport] = useState<SavedReport | null>(null);
  const [run, setRun] = useState<ReportRun | null>(null);
  const [error, setError] = useState<LoadError | null>(null);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);
  const [ranAt, setRanAt] = useState<Date | null>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const classify = (e: unknown): LoadError => {
    const err = e as ReportsApiError;
    const status = err?.status;
    return {
      message: err?.message ?? 'Something went wrong.',
      kind: status === 404 ? 'missing'
        : status === 409 ? 'stale'
        : status === 504 ? 'timeout'
        : 'other',
    };
  };

  const load = useCallback(async (mode: 'initial' | 'rerun') => {
    if (!reportId) return;
    if (mode === 'initial') setLoading(true); else setRerunning(true);
    setError(null);
    try {
      // Metadata first: a 404 here means the report is gone or not shared with
      // this caller, and running it would answer the same 404 less clearly.
      const meta = mode === 'initial' ? await fetchReport(reportId) : report;
      if (mode === 'initial') setReport(meta);

      const result = await runSavedReport(reportId);
      setRun(result);
      // The age of the figures, recorded when they arrived. Phase 9 may serve
      // results from a cache, and a cached result must show its age — so the
      // page states when it ran from the start rather than gaining it later.
      setRanAt(new Date());
    } catch (e) {
      setRun(null);
      setError(classify(e));
    } finally {
      setLoading(false);
      setRerunning(false);
    }
  }, [reportId, report]);

  useEffect(() => { void load('initial'); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [reportId]);

  const rowKeys = useMemo(() => (run ? rowKeysFor(run.columns) : []), [run]);
  const dimCount = useMemo(
    () => (run ? run.columns.filter(c => c.kind === 'dimension').length : 0),
    [run],
  );

  const onDelete = async () => {
    if (!reportId) return;
    try {
      await deleteReport(reportId);
      navigate('/crm/reports', { replace: true });
    } catch (e) {
      setConfirmDelete(false);
      setError(classify(e));
    }
  };

  if (!reportId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMNavigation />
        <div className="p-8"><p className="text-[13px] text-gray-600">No report specified.</p></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMNavigation />
        <div className="p-8"><p className="text-[12px] text-gray-400">Loading report…</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="p-8 max-w-6xl">
        <button
          onClick={() => navigate('/crm/reports')}
          className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Reports
        </button>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="text-[22px] font-semibold text-gray-900">
              {/* The STORED name. Not reconstructed from the URL. */}
              {report?.name ?? 'Report'}
            </h1>
            {report?.description && (
              <p className="text-[13px] text-gray-600 mt-1">{report.description}</p>
            )}
            <p className="text-[12px] text-gray-400 mt-1.5">
              {report?.category && <span>{report.category} · </span>}
              {/* Ownerless is a real state — the owner FK is ON DELETE SET NULL,
                  so a report outlives the person who made it. Say so plainly
                  rather than printing a blank. */}
              {report?.owner_name
                ? <span>Created by {report.owner_name}</span>
                : <span>No owner (the person who created this no longer has an account)</span>}
              {ranAt && (
                <span className="ml-1">
                  {' · '}Ran at {ranAt.toLocaleTimeString()}
                  {run && <> in {run.ms} ms</>}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => void load('rerun')} disabled={rerunning}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${rerunning ? 'animate-spin' : ''}`} aria-hidden="true" />
              {rerunning ? 'Running…' : 'Re-run'}
            </Button>

            {/*
              * Controls are rendered from the SERVER'S `abilities`, and an
              * ability the caller lacks gets NO control rather than a disabled
              * one — the same call TeamManagement's role picker makes: a
              * disabled control advertises an action that does not exist for
              * you. Delete and re-share are owner-only, narrower than `edit`.
              */}
            {report?.abilities.can_edit && (
              <Button variant="secondary"
                onClick={() => navigate(`/crm/custom-report-builder?id=${encodeURIComponent(reportId)}`)}>
                <Pencil className="h-4 w-4 mr-1.5" aria-hidden="true" /> Edit
              </Button>
            )}
            {report?.abilities.can_share && (
              <Button variant="secondary" onClick={() => setShareOpen(true)}>
                <Share2 className="h-4 w-4 mr-1.5" aria-hidden="true" /> Share
              </Button>
            )}
            {report?.abilities.can_delete && (
              <Button variant="secondary" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" /> Delete
              </Button>
            )}
          </div>
        </div>

        {/* ── Failure states, each saying which one it is ─────────────────── */}
        {error && (
          <div
            data-testid={`report-error-${error.kind}`}
            className={`rounded-lg border px-4 py-3 mb-5 flex items-start gap-2 ${
              error.kind === 'stale' ? 'border-amber-300 bg-amber-50' : 'border-red-200 bg-red-50'
            }`}
          >
            <AlertCircle
              className={`h-4 w-4 flex-shrink-0 mt-0.5 ${error.kind === 'stale' ? 'text-amber-600' : 'text-red-600'}`}
              aria-hidden="true"
            />
            <div className={`text-[12px] ${error.kind === 'stale' ? 'text-amber-900' : 'text-red-800'}`}>
              {error.kind === 'missing' && (
                <>
                  <strong>This report doesn&rsquo;t exist, or isn&rsquo;t shared with you.</strong>
                  {/* Deliberately ONE message for both, the same reason a failed
                      login does not say which half was wrong: distinguishing
                      them tells a prober which report ids exist. */}
                  <span className="block mt-1">
                    Reports are private unless their owner shares them.
                  </span>
                </>
              )}
              {error.kind === 'stale' && (
                <>
                  <strong>This report can no longer run.</strong> A field or module it refers
                  to is no longer available, so nothing is shown rather than a partial
                  result.
                  <span className="block mt-1">{error.message}</span>
                  {report?.abilities.can_edit
                    ? <span className="block mt-1">Open it in the builder to fix the definition.</span>
                    : <span className="block mt-1">Ask its owner to update the definition.</span>}
                </>
              )}
              {error.kind === 'timeout' && (
                <>
                  <strong>This report took too long and was stopped.</strong>
                  <span className="block mt-1">
                    Nothing is shown, because a partial answer to a query that was cut off
                    is not a smaller version of the right answer. Narrowing the filters
                    usually fixes it.
                  </span>
                </>
              )}
              {error.kind === 'other' && (
                <>
                  <strong>Couldn&rsquo;t run this report.</strong>
                  <span className="block mt-1">{error.message}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── The result ─────────────────────────────────────────────────── */}
        {run && (
          <>
            {/* Disclosure first. The seeded-vs-real split is not a footnote:
                most of this workspace's core data is a synthetic seed load, so
                a figure read without it is a figure read wrong. */}
            <div className="mb-4">
              <ProvenanceNote provenance={run.provenance} />
            </div>

            <section className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              {run.rows.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-[13px] text-gray-700">No rows matched this report.</p>
                  <p className="text-[12px] text-gray-500 mt-1">
                    That is a result, not a failure — nothing in this workspace fits the
                    report&rsquo;s filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="bg-gray-50">
                      <tr>
                        {run.columns.map((c, i) => (
                          <th
                            key={c.key}
                            className={`px-4 py-2.5 font-semibold text-gray-600 border-b border-gray-200 ${
                              i >= dimCount ? 'text-right' : 'text-left'
                            }`}
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {run.rows.map((r, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          {run.columns.map((c, n) => (
                            <td
                              key={c.key}
                              className={`px-4 py-2.5 text-gray-800 ${
                                n >= dimCount ? 'text-right tabular-nums' : ''
                              }`}
                            >
                              {fmt(r[rowKeys[n]])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/*
              * Export and scheduling are NOT rendered as controls.
              *
              * The old page had a download menu whose items were `console.log`
              * calls behind a "Report exported successfully" toast with a "View
              * File" button — a user would go looking on disk for a file that
              * was never written. And a schedule modal collecting a frequency,
              * a time, a format and three hardcoded recipients ("alex",
              * "sarah", "mike") that went nowhere.
              *
              * Both are real, funded phases (7 and 8). Until then this states
              * where they are rather than offering a button that lies, because
              * a dead control is worse than an absent one: a user plans around
              * it.
              */}
            <p className="text-[12px] text-gray-400 mt-3 flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Export and scheduled delivery aren&rsquo;t built yet. The figures above are
              live, so there is nothing stopping them — they are just not done.
            </p>
          </>
        )}

        {/* ── Delete confirmation ────────────────────────────────────────── */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-5" role="dialog" aria-label="Confirm delete">
              <h2 className="text-[15px] font-semibold text-gray-900">
                Delete &ldquo;{report?.name}&rdquo;?
              </h2>
              <p className="text-[12px] text-gray-600 mt-2">
                This removes the saved report and everyone&rsquo;s access to it. The deals,
                companies and contacts it reports on are not touched.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                <Button onClick={() => void onDelete()}>Delete report</Button>
              </div>
            </div>
          </div>
        )}

        {shareOpen && report && (
          <ShareDialog
            reportId={reportId}
            reportName={report.name}
            onClose={() => setShareOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

/**
 * SHARING, against the real `saved_report_grants` table.
 *
 * The facade's version collected three hardcoded colleagues, an "allow edit"
 * switch and a "notify by email" switch, and persisted none of it. Two of those
 * three things now exist for real (the roster, and the edit level); the email
 * notification does not, so it is not offered — `services/email` has two
 * consumers and this is not one of them.
 *
 * `view` is the floor a share grants and `edit` is what the owner adds on top,
 * so there is no edit-only option to pick: one row per person holding one
 * level, which is what makes edit-without-view unrepresentable.
 */
const ShareDialog: React.FC<{
  reportId: string;
  reportName: string;
  onClose: () => void;
}> = ({ reportId, reportName, onClose }) => {
  const [grants, setGrants] = useState<ReportGrant[]>([]);
  const [levels, setLevels] = useState<GrantLevel[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const [g, roster] = await Promise.all([
        fetchGrants(reportId),
        // Only active members: sharing with a deactivated account grants access
        // nobody can use and reads as a share that worked.
        fetchRoster(false),
      ]);
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
  const ungranted = useMemo(
    () => members.filter(m => !granted.has(Number(m.id))),
    [members, granted],
  );

  const act = async (fn: () => Promise<void>) => {
    setErr(null);
    try { await fn(); await reload(); } catch (e) { setErr((e as Error).message); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto"
        role="dialog" aria-label="Share report">
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">Share this report</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">{reportName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {err && (
            <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{err}</p>
          )}

          <div>
            <h3 className="text-[12px] font-semibold text-gray-700 mb-2">Who has access</h3>
            {busy && <p className="text-[12px] text-gray-400">Loading…</p>}
            {!busy && grants.length === 0 && (
              <p className="text-[12px] text-gray-500">
                Only you. A report is private until it is shared — there is no
                &ldquo;private&rdquo; setting to check, because private is simply the absence
                of anyone else having access.
              </p>
            )}
            <ul className="space-y-1.5">
              {grants.map(g => (
                <li key={g.user_id} className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-gray-800 min-w-0 truncate">
                    {g.name ?? g.email}
                    <span className="text-gray-400"> · {g.email}</span>
                  </span>
                  <span className="flex items-center gap-1.5 flex-shrink-0">
                    <select
                      aria-label={`Access for ${g.name ?? g.email}`}
                      value={g.level}
                      onChange={e => void act(() => setGrant(reportId, g.user_id, e.target.value as GrantLevel))}
                      className="text-[12px] rounded border border-gray-300 px-2 py-1"
                    >
                      {levels.map(l => (
                        <option key={l} value={l}>{l === 'edit' ? 'Can edit' : 'Can view'}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => void act(() => revokeGrant(reportId, g.user_id))}
                      className="text-[12px] text-red-600 hover:text-red-800 px-1"
                    >
                      Remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[12px] font-semibold text-gray-700 mb-2">Add someone</h3>
            {!busy && ungranted.length === 0 && (
              <p className="text-[12px] text-gray-500">
                Everyone active in this workspace already has access.
              </p>
            )}
            <ul className="space-y-1.5">
              {ungranted.map(m => (
                <li key={m.id} className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-gray-800 min-w-0 truncate">
                    {m.name || m.email}<span className="text-gray-400"> · {m.email}</span>
                  </span>
                  <button
                    onClick={() => void act(() => setGrant(reportId, Number(m.id), 'view'))}
                    className="text-[12px] text-indigo-600 hover:text-indigo-800 flex-shrink-0"
                  >
                    Give view access
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-gray-400 mt-2 flex items-start gap-1">
              <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
              Sharing takes effect immediately. Nobody is emailed — this CRM sends
              transactional mail only for invites, and report sharing is not wired to it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailView;
