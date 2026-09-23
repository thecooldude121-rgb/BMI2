import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import type { Provenance } from '../../utils/reportsApi';

/**
 * WHAT A REPORT WAS COMPUTED FROM — rendered next to every figure.
 *
 * P3 Phase 4. Shared deliberately: the builder's preview and (Phase 5) the
 * report detail view both render this, so the same run is described the same way
 * wherever it appears. A disclosure each surface phrases for itself is one that
 * gets softened in a redesign.
 *
 * ─── THE SENTENCE IS THE SERVER'S, VERBATIM ───────────────────────────────
 *
 * `provenance.disclosure` is composed server-side and printed as-is. This
 * component chooses PLACEMENT and EMPHASIS; it does not compose, shorten or
 * paraphrase. The numbers beneath it are the same facts in tabular form for a
 * reader who wants them, not a second calculation.
 *
 * ─── WHY PLACEMENT IS DRIVEN BY `mostly_seeded` ───────────────────────────
 *
 * Above 50% seeded input (the product threshold) the note renders as a WARNING
 * above the figures rather than a footnote beside them. Same fact either way —
 * a reader deciding whether to trust a chart should not have to scroll to
 * discover that four fifths of it is demo data.
 *
 * ─── null IS NOT ZERO ─────────────────────────────────────────────────────
 *
 * `rows_seeded === null` means the module cannot measure it. It renders as
 * "not recorded", never as 0 — a 0 would claim "none of this is seeded", which
 * is a different statement and the exact class of defect this project keeps
 * removing.
 */
export const ProvenanceNote: React.FC<{
  provenance: Provenance;
  /** `compact` for a preview pane; `full` above a report's figures. */
  variant?: 'compact' | 'full';
}> = ({ provenance: p, variant = 'full' }) => {
  const warn = p.mostly_seeded || p.truncated;
  const Icon = warn ? AlertTriangle : Info;

  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        warn ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50'
      }`}
      role="note"
      data-testid="provenance-note"
      data-mostly-seeded={p.mostly_seeded ? 'true' : 'false'}
    >
      <div className="flex items-start gap-2">
        <Icon
          className={`h-4 w-4 flex-shrink-0 mt-0.5 ${warn ? 'text-amber-700' : 'text-gray-400'}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          {p.mostly_seeded && (
            <p className="text-[12px] font-semibold text-amber-900 mb-0.5">
              Most of this report is seeded demo data.
            </p>
          )}
          {/* The server's sentence, verbatim. */}
          <p className={`text-[12px] leading-relaxed ${warn ? 'text-amber-900' : 'text-gray-600'}`}>
            {p.disclosure}
          </p>

          {variant === 'full' && (
            <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-gray-500">
              <div>
                <dt className="inline">Rows behind it: </dt>
                <dd className="inline font-medium text-gray-700 tabular-nums">
                  {p.rows_matched.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="inline">Seeded: </dt>
                <dd className="inline font-medium text-gray-700 tabular-nums">
                  {/*
                    * null renders as "not recorded". Never 0 — see the header.
                    */}
                  {p.rows_seeded === null
                    ? 'not recorded for this module'
                    : `${p.rows_seeded.toLocaleString()} of ${p.rows_matched.toLocaleString()}`}
                </dd>
              </div>
              {p.excluded_test > 0 && (
                <div>
                  <dt className="inline">Test rows excluded: </dt>
                  <dd className="inline font-medium text-gray-700 tabular-nums">
                    {p.excluded_test.toLocaleString()}
                  </dd>
                </div>
              )}
              {/*
                * COVERAGE IS A SEPARATE NUMBER FROM THE SEEDED SHARE, and both
                * render. Reporting either alone is what made the old
                * "Revenue by Industry" card misleading: 89% coverage invites
                * trust, while 81% seeded is the fact that changes the reading.
                */}
              {p.coverage.map(c => (
                <div key={`${c.kind}:${c.key}`}>
                  {/*
                    * "linked" for a join, "recorded" for a dimension. They are
                    * different gaps and the wording is the only thing telling
                    * them apart: a deal with no account CANNOT reach the
                    * account's industry, whereas a deal linked to an account
                    * that simply has no industry recorded is a different
                    * problem with a different fix.
                    */}
                  <dt className="inline">
                    {c.label} {c.kind === 'join' ? 'linked' : 'recorded'}:{' '}
                  </dt>
                  <dd className="inline font-medium text-gray-700 tabular-nums">
                    {c.matched.toLocaleString()} of {c.of.toLocaleString()}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProvenanceNote;
