import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { Provenance } from '../../utils/reportsApi';

/**
 * WHAT A REPORT WAS COMPUTED FROM — shown on the page, not only in the API
 * (reports replay step e; the data is step d's `provenance` block).
 *
 * Four facts, each its own tile where the Figma "Report detail" frame draws its
 * four KPI tiles: seeded vs real, test records left out, rows with no linked
 * record, and whether the result was cut off at the row limit. Above them the
 * server's own sentence, VERBATIM — this component chooses placement and
 * emphasis; it never composes, shortens or paraphrases the disclosure.
 *
 * `rows_seeded === null` means the module cannot measure it. It renders as
 * "Not recorded", never 0: a 0 would claim none of it is demo data.
 */
const Tile: React.FC<{
  label: string;
  value: string;
  detail: React.ReactNode;
  warn?: boolean;
  testId: string;
}> = ({ label, value, detail, warn = false, testId }) => (
  <div
    data-testid={testId}
    className={`flex min-w-0 flex-col gap-1 rounded-card border bg-surface-panel p-4 ${warn ? 'border-warning-700' : 'border-line'}`}
  >
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      {warn && <Badge tone="warning">Check</Badge>}
    </div>
    <p className="text-2xl font-bold leading-8 text-ink tabular-nums">{value}</p>
    <p className="text-xs leading-[18px] text-ink-muted">{detail}</p>
  </div>
);

export const ProvenancePanel: React.FC<{ provenance: Provenance }> = ({ provenance: p }) => {
  const warn = p.mostly_seeded || p.truncated;
  const Icon = warn ? AlertTriangle : Info;
  const n = (v: number) => v.toLocaleString();
  const missing = p.coverage.filter(c => c.of - c.matched > 0);

  return (
    <section aria-label="What this report was computed from" className="flex flex-col gap-3" data-testid="provenance">
      <div
        role="note"
        data-testid="provenance-disclosure"
        data-mostly-seeded={p.mostly_seeded ? 'true' : 'false'}
        className={`flex items-start gap-2 rounded-card border px-4 py-3 ${
          warn ? 'border-warning-700 bg-warning-100' : 'border-line bg-surface-subtle'
        }`}
      >
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${warn ? 'text-warning-700' : 'text-ink-muted'}`} aria-hidden="true" />
        <div className="min-w-0">
          {p.mostly_seeded && (
            <p className="text-sm font-semibold text-warning-800">Most of this report is seeded demo data.</p>
          )}
          <p className={`text-sm leading-[22px] ${warn ? 'text-warning-800' : 'text-ink-muted'}`}>{p.disclosure}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          testId="tile-seeded"
          label="Seeded demo data"
          value={p.rows_seeded === null ? 'Not recorded' : `${n(p.rows_seeded)} of ${n(p.rows_matched)}`}
          detail={p.rows_seeded === null
            ? 'This module does not record which rows are demo data, so it is not stated rather than assumed to be none.'
            : `${n(p.rows_real ?? 0)} real ${p.rows_real === 1 ? 'row' : 'rows'} behind this report.`}
          warn={p.mostly_seeded}
        />
        <Tile
          testId="tile-test"
          label="Test records left out"
          value={n(p.excluded_test)}
          detail={p.excluded_test === 0
            ? 'No test records matched this report.'
            : 'Matched the filters but are flagged as test data, so they are not counted.'}
        />
        <Tile
          testId="tile-coverage"
          label="Rows with no linked record"
          value={p.coverage.length === 0 ? 'Not applicable' : n(missing.reduce((s, c) => s + (c.of - c.matched), 0))}
          detail={p.coverage.length === 0
            ? 'This report reads one module and links no other records.'
            : p.coverage.map(c => (c.of - c.matched > 0
              ? `${n(c.of - c.matched)} of ${n(c.of)} have no ${c.label.toLowerCase()} linked and are not counted.`
              : `All ${n(c.of)} have ${c.label.toLowerCase()} linked.`)).join(' ')}
          warn={missing.length > 0}
        />
        <Tile
          testId="tile-limit"
          label="Row limit"
          value={p.truncated ? 'Cut off' : 'Complete'}
          detail={p.truncated
            ? `Showing the first ${n(p.row_limit)} rows. There are more that are not shown.`
            : `All ${n(p.rows_returned)} result ${p.rows_returned === 1 ? 'row is' : 'rows are'} shown (limit ${n(p.row_limit)}).`}
          warn={p.truncated}
        />
      </div>
    </section>
  );
};

export default ProvenancePanel;
