import React from 'react';
import { History, ArrowRight, AlertCircle } from 'lucide-react';
import type { DealStageSpan } from '../../utils/dealStageHistory';
import { formatDisplayDate } from '../../utils/dateUtils';

/**
 * The stage history audit trail — a named Phase-1 deliverable
 * ("deal detail with ... stage history audit trail", CLAUDE.md).
 *
 * IT DID NOT PREVIOUSLY EXIST AS A RENDER. `DealDetailsPanel` declared a
 * `stageHistory?: Stage[]` prop and never destructured or used it, so the
 * hardcoded five-row array the deal page passed in went nowhere. The
 * fabricated data was real enough to review and the feature was still missing
 * — which is the more interesting half: a fabricated input made the gap
 * invisible, because the prop looked supplied.
 *
 * Everything here comes from deal_stage_history (migration 014) through
 * buildStageSpans. There are no benchmarks: nothing computes a target duration
 * for a stage, and the invented version's "benchmark 7 days" was the clearest
 * tell that the whole block was written rather than measured.
 */

interface Props {
  spans: DealStageSpan[];
  loading?: boolean;
}

const dayLabel = (n: number) => (n === 1 ? '1 day' : `${n} days`);

const DealStageHistory: React.FC<Props> = ({ spans, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-gray-400" />
        Stage history
      </h3>

      {spans.length === 0 ? (
        /* An empty audit trail is the correct display for a deal nobody has
           moved since the trail started recording. It is NOT the same as "this
           deal has no stages" — the deal's current stage is on the hero above.
           Saying which is which matters, because the previous version filled
           this space with an invented five-stage journey. */
        <div className="text-center py-6">
          <AlertCircle className="h-7 w-7 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No stage changes recorded for this deal.</p>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            Every move through the pipeline is recorded here — who moved it,
            when, and how long it sat in the previous stage. Moving this deal to
            its next stage will create the first entry.
          </p>
        </div>
      ) : (
        <ol className="relative border-l border-gray-200 ml-2">
          {spans.map((span, idx) => (
            <li key={`${span.name}-${idx}`} className="ml-5 pb-5 last:pb-0">
              <span
                className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                  span.status === 'current' ? 'bg-indigo-500' : 'bg-gray-300'
                }`}
              />
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {span.name.replace(/-/g, ' ')}
                </span>
                {span.status === 'current' && (
                  <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-1.5 py-0.5 font-medium">
                    Current
                  </span>
                )}
                {/* A duration is only shown when the start is known. The stage
                    the deal was in before the trail begins has no recorded
                    entry point, so it reports no duration rather than 0 days —
                    which would read as "passed through instantly". */}
                {span.startedAt && (
                  <span className="text-xs text-gray-500">
                    {span.status === 'current'
                      ? `${dayLabel(span.days)} so far`
                      : dayLabel(span.days)}
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                {span.startedAt ? (
                  <>
                    {/* The full instant, NOT `.split('T')[0]`. changed_at is
                        TIMESTAMPTZ: a transition at 00:43 +05:30 is 19:13 UTC
                        the previous day, so truncating the ISO string to its
                        date part parses as UTC midnight and displays the wrong
                        day. Observed doing exactly that — a stage move made on
                        02 Sep rendered as 01 Sep. The DATE columns elsewhere in
                        this app (close_date, discovery_date) carry no time and
                        are safe to split; these are not. */}
                    <span>{formatDisplayDate(span.startedAt)}</span>
                    {span.endedAt && (
                      <>
                        <ArrowRight className="h-3 w-3" />
                        <span>{formatDisplayDate(span.endedAt)}</span>
                      </>
                    )}
                  </>
                ) : (
                  <span className="italic">Entered before stage history was recorded</span>
                )}
                {span.changedBy && <span>· moved by {span.changedBy}</span>}
              </div>

              {span.probability != null && (
                <div className="text-xs text-gray-500 mt-0.5">
                  Probability set to {span.probability}%
                  {/* Whether a human overrode the pipeline default is stored
                      per transition, and it is the difference between a rep's
                      judgement and a default nobody chose. */}
                  {span.probabilityOverride ? ' (manual override)' : ' (pipeline default)'}
                </div>
              )}

              {span.reasonCode && (
                <div className="text-xs text-gray-600 mt-1">
                  <span className="bg-gray-100 rounded px-1.5 py-0.5">{span.reasonCode}</span>
                </div>
              )}
              {span.note && (
                <p className="text-xs text-gray-700 mt-1 bg-gray-50 border border-gray-100 rounded px-2 py-1.5">
                  {span.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default DealStageHistory;
