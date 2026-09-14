import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, Target, TrendingDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { activityLabel, fetchProjection, quarterLabelFor } from '../../utils/targetsApi';
import {
  problemsFor, rollup, activityNote, STATUS_CLASS, STATUS_LABEL,
  type ActivityMeasurement, type ProjectionRow,
} from '../../utils/salesGuidance';

/**
 * SALES INTELLIGENCE GUIDE — role-differentiated corrective guidance.
 *
 * It occupies the slot the dashboard's "AI Insights" preview held. That panel
 * was two fixed sentences ("3 deals need attention", "close rate up 12%")
 * behind a PREVIEW · SAMPLE CONTENT label; this replaces them with figures that
 * come from GET /targets/projection or are not shown at all.
 *
 * THREE VIEWS, ONE REQUEST, ONE PERMISSION PATH. The endpoint already returns
 * exactly the people the caller may see — themselves, their reporting subtree,
 * or everyone for an admin — so the role here changes only what is SAID about
 * those rows, never which rows arrive. Adding a query of its own is the one
 * thing this component must not do: it would be a second place for the read
 * scoping that was just fixed to be forgotten.
 *
 * WHAT IT IS NOT ALLOWED TO DO, and does not:
 *  - no verdict without its numbers. Every status renders its `status_reason`,
 *    and every problem carries the arithmetic behind it (utils/salesGuidance).
 *  - no invented figure anywhere. Where the projection returns null it returns
 *    a reason with it, and the reason is what renders.
 *  - no silent omission. "Not enough data" and "no quota" are their own states
 *    with their own wording, and the roll-up counts the people it could not
 *    assess instead of quietly describing a smaller team than it claims.
 */

const ROLE_HELP =
  'Targets and projections are visible to you, to anyone above you in your reporting line, and to admins.';

/** Evidence rendered under a verdict. Never rendered on its own, never optional. */
const Evidence: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[12px] leading-relaxed text-gray-600 mt-1">{children}</p>
);

const StatusChip: React.FC<{ status: ProjectionRow['status'] }> = ({ status }) => (
  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_CLASS[status]}`}>
    {STATUS_LABEL[status]}
  </span>
);

/**
 * The activity half, which is deliberately NOT an attainment figure.
 *
 * `activities` has no user reference (only free-text `created_by` /
 * `assigned_to`), so attributing activity to a person would mean keying on a
 * display name — the defect migrations 039-043 removed. The server says so in
 * `activity_measurement.reason`; this renders the targets and that reason, and
 * never a shortfall. Rendering nothing would be worse than either: silence
 * over an unmeasured target reads as "you are meeting it".
 */
const ActivityBlock: React.FC<{ row: ProjectionRow; measurement: ActivityMeasurement }> = ({ row, measurement }) => {
  const note = activityNote(row, measurement);
  if (!note) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <p className="text-[12px] text-gray-600">
          <span className="font-semibold text-gray-800">Activity targets:</span> none set for this period.
          Calls, meetings and emails per week are set in Settings &rsaquo; Sales Targets.
        </p>
      </div>
    );
  }
  const entries = Object.entries(note.targets ?? {});
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-[12px] font-semibold text-gray-800">Activity targets</span>
        {entries.map(([key, value]) => (
          <span key={key} className="text-[12px] text-gray-700">
            {/* The SHARED label map, the same one Settings > Sales Targets
                uses. A second spelling of "Calls / week" in this file would be
                one more list to drift. */}
            {activityLabel(key)}: <span className="font-semibold">{value}</span>
          </span>
        ))}
      </div>
      {!note.measurable && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
          <span className="font-semibold">Attainment is not calculated.</span> {note.note}{' '}
          <span className="text-gray-400">{measurement.reason}</span>
        </p>
      )}
    </div>
  );
};

/** One person's own status, with the pipeline and activity reasons kept apart. */
const OwnStatus: React.FC<{ row: ProjectionRow; measurement: ActivityMeasurement }> = ({ row, measurement }) => {
  const problems = problemsFor(row);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip status={row.status} />
          {row.quota && (
            <span className="text-[12px] text-gray-500 tabular-nums">
              {row.quota.currency} {(row.attained ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              {' of '}
              {row.quota.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
        {/* The server's own sentence, which already carries the arithmetic. */}
        <Evidence>{row.status_reason}</Evidence>
      </div>

      {problems.map(p => (
        <div key={p.kind} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2">
            {p.kind === 'pipeline'
              ? <Target className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
              : <TrendingDown className="h-4 w-4 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />}
            <div>
              <p className="text-[13px] font-semibold text-amber-900">
                {p.kind === 'pipeline' ? 'Pipeline coverage gap' : 'Conversion below the workspace'}
              </p>
              <Evidence>{p.evidence}</Evidence>
            </div>
          </div>
        </div>
      ))}

      <ActivityBlock row={row} measurement={measurement} />
    </div>
  );
};

/** A roll-up row for a manager or admin: who, what state, and why. */
const TeamRow: React.FC<{ row: ProjectionRow }> = ({ row }) => {
  const problems = problemsFor(row);
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-gray-900">{row.name}</span>
        <StatusChip status={row.status} />
        {problems.map(p => (
          <span key={p.kind} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
            {p.kind}
          </span>
        ))}
      </div>
      <Evidence>{row.status_reason}</Evidence>
      {problems.map(p => <Evidence key={p.kind}>{p.evidence}</Evidence>)}
    </li>
  );
};

export const SalesIntelligenceGuide: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ProjectionRow[] | null>(null);
  const [measurement, setMeasurement] = useState<ActivityMeasurement | null>(null);
  const [period, setPeriod] = useState<string>(() => quarterLabelFor(new Date()));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const label = quarterLabelFor(new Date());
    fetchProjection(label)
      .then(r => {
        if (cancelled) return;
        setRows(r.rows);
        setMeasurement(r.activityMeasurement);
        setPeriod(r.periodLabel);
        setError(null);
      })
      // A failed load says so. It does NOT fall back to an empty roster, which
      // would render as "nobody is off pace" — a false all-clear is the worst
      // possible failure mode for a panel like this.
      .catch((e: Error) => { if (!cancelled) { setRows(null); setError(e.message); } });
    return () => { cancelled = true; };
  }, []);

  const heading = (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
      <h2 className="text-[18px] font-semibold text-gray-900">Sales Intelligence Guide</h2>
      <span className="text-[11px] text-gray-400">{period}</span>
    </div>
  );

  const frame = (children: React.ReactNode) => (
    <section
      className="mb-8 rounded-xl border border-gray-200 bg-white p-6"
      aria-label="Sales Intelligence Guide"
      data-testid="sales-intelligence-guide"
    >
      {heading}
      {children}
    </section>
  );

  if (error) {
    return frame(
      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-[12px] text-red-800">
          Could not load your targets, so nothing is shown here rather than an all-clear.
          <span className="block text-red-600 mt-0.5">{error}</span>
        </p>
      </div>,
    );
  }

  if (rows === null) {
    return frame(<p className="text-[12px] text-gray-400">Loading your targets…</p>);
  }

  const me = rows.find(r => Number(r.user_id) === Number(user?.id));
  const role = user?.role ?? 'Unknown';

  // ── Individual (AE / rep) ─────────────────────────────────────────────────
  if (role === 'Sales' || (role !== 'Admin' && role !== 'Manager')) {
    if (!me) {
      return frame(
        <p className="text-[12px] text-gray-600">
          No target is recorded for you in {period}.{' '}
          <span className="text-gray-400">{ROLE_HELP}</span>
        </p>,
      );
    }
    return frame(<OwnStatus row={me} measurement={measurement as ActivityMeasurement} />);
  }

  // ── Manager and Admin share the roll-up; the scope differs, and is stated ──
  const others = rows.filter(r => Number(r.user_id) !== Number(user?.id));
  const r = rollup(role === 'Admin' ? rows : others);
  const scopeLine = role === 'Admin'
    ? `${r.total} ${r.total === 1 ? 'person' : 'people'} across the workspace.`
    : `${r.total} ${r.total === 1 ? 'person' : 'people'} in your reporting line.`;

  return frame(
    <div className="space-y-4">
      <p className="text-[12px] text-gray-500">
        {scopeLine} <span className="text-gray-400">{ROLE_HELP}</span>
      </p>

      {/* Per-currency, never summed across currencies — the same rule the
          projection applies to deals. */}
      {r.quotaTotals.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {r.quotaTotals.map(t => (
            <div key={t.currency} className="rounded-lg border border-gray-200 px-4 py-2">
              <p className="text-[11px] text-gray-500">
                {t.currency} · {t.count} {t.count === 1 ? 'quota' : 'quotas'}
              </p>
              <p className="text-[14px] font-semibold text-gray-900 tabular-nums">
                {t.attained.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                {' of '}
                {t.quota.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
          ))}
        </div>
      )}

      {role === 'Manager' && me && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-[12px] font-semibold text-gray-800 mb-1">Your own target</p>
          <div className="flex flex-wrap items-center gap-2"><StatusChip status={me.status} /></div>
          <Evidence>{me.status_reason}</Evidence>
        </div>
      )}

      {r.offPace.length > 0 ? (
        <div>
          <p className="text-[13px] font-semibold text-gray-900 mb-1">
            Off pace ({r.offPace.length})
          </p>
          <ul className="divide-y divide-gray-100">
            {r.offPace.map(row => <TeamRow key={row.user_id} row={row} />)}
          </ul>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[12px] text-emerald-900">
            Nobody with a measurable target is off pace in {period}.
          </p>
        </div>
      )}

      {/* Counted, never dropped: a roll-up that omits the people it could not
          assess describes a smaller team than it claims to. */}
      {(r.notEnoughData.length > 0 || r.noQuota.length > 0) && (
        <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <HelpCircle className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-[12px] text-gray-600">
            {r.noQuota.length > 0 && (
              <p>
                <span className="font-semibold text-gray-800">{r.noQuota.length}</span>{' '}
                {r.noQuota.length === 1 ? 'person has' : 'people have'} no quota set for {period}:{' '}
                {r.noQuota.map(x => x.name).join(', ')}.
              </p>
            )}
            {r.notEnoughData.length > 0 && (
              <p className="mt-0.5">
                <span className="font-semibold text-gray-800">{r.notEnoughData.length}</span>{' '}
                {r.notEnoughData.length === 1 ? 'person has' : 'people have'} a quota but not enough closed-deal
                history to project against it, so no status is claimed for{' '}
                {r.notEnoughData.length === 1 ? 'them' : 'them'}:{' '}
                {r.notEnoughData.map(x => x.name).join(', ')}.
              </p>
            )}
          </div>
        </div>
      )}

      {measurement && !measurement.measurable && (
        <p className="text-[11px] leading-relaxed text-gray-400">
          <span className="font-semibold text-gray-500">Activity targets are not assessed above.</span>{' '}
          {measurement.reason}
        </p>
      )}
    </div>,
  );
};

export default SalesIntelligenceGuide;
