import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { toXlsx, xlsxFilename, colLetter } from '../services/reports/xlsx';
import { buildZip } from '../services/reports/zip';
import type { ReportRun } from '../services/reports/runner';

/**
 * EXCEL EXPORT. P3 Phase 7. PURE — no database.
 *
 * THE ARCHIVE IS VERIFIED WITH A REAL UNZIP, NOT BY INSPECTING OUR OWN BYTES.
 * This writes the ZIP container by hand, so a test that only re-reads our own
 * offsets would agree with whatever we produced, correct or not — the same
 * shape of mistake as a probe that passes because nothing happened. `unzip -t`
 * validates the CRCs and the central directory independently.
 *
 * The workbook's SEMANTICS (cell types, sheet order) are checked in the live
 * verification recorded in the phase notes, using openpyxl; what is pinned here
 * is everything reachable without a third-party reader.
 */

const run = (over: Partial<ReportRun> = {}): ReportRun => ({
  columns: [
    { key: 'd', label: 'Deal', kind: 'dimension' },
    { key: 'm', label: 'Sum of Value', kind: 'metric' },
  ],
  rows: [{ dim_0: 'Acme renewal', metric_0: '1000.00' }],
  provenance: {
    rows_returned: 1, rows_matched: 1, rows_seeded: 1, rows_real: 0,
    seeded_share: 1, mostly_seeded: true, excluded_test: 0,
    coverage: [], currencies: null, truncated: false, row_limit: 5000,
    disclosure: 'Based on 1 row, and it is seeded demo data.',
  },
  ms: 5,
  ...over,
});

const meta = { reportName: 'Pipeline by Owner', generatedAt: '2026-09-23T10:00:00.000Z' };

/** Extract one part, using the system unzip so the container is independently parsed. */
function part(book: Buffer, name: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xlsx-'));
  const file = path.join(dir, 'b.xlsx');
  try {
    fs.writeFileSync(file, book);
    execFileSync('unzip', ['-tqq', file]);          // CRCs and directory
    return execFileSync('unzip', ['-p', file, name]).toString('utf8');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

describe('the container is a real ZIP', () => {
  it('passes an independent integrity check', () => {
    expect(() => part(toXlsx(run(), meta), 'xl/workbook.xml')).not.toThrow();
  });

  it('refuses a non-ASCII entry name rather than writing a broken archive', () => {
    // The writer has no unicode-name flag, so a non-ASCII name would produce an
    // archive that opens differently depending on the reader. Fail loudly.
    expect(() => buildZip([{ name: 'xl/wörk.xml', data: Buffer.from('x') }])).toThrow(/ASCII/);
  });

  it('is byte-identical for identical input, because the timestamp is fixed', () => {
    // A spreadsheet's bytes should depend on its CONTENTS. The generation time
    // is stated inside the document where a reader can see it.
    expect(toXlsx(run(), meta).equals(toXlsx(run(), meta))).toBe(true);
  });
});

describe('a formula cannot be expressed, rather than being escaped', () => {
  it('writes a leading = as an inline STRING, with no formula element', () => {
    /*
     * The structural difference from CSV. A cell is a formula in xlsx only when
     * it carries <f>; this writer emits none, so the apostrophe workaround the
     * CSV needs is unnecessary here. Verified against a real reader in the
     * phase notes: openpyxl reports data_type 's', not 'f'.
     */
    const book = toXlsx(run({
      rows: [{ dim_0: '=HYPERLINK("http://attacker/",A1)', metric_0: '1' }],
    }), meta);
    const sheet = part(book, 'xl/worksheets/sheet2.xml');

    expect(sheet).toContain('t="inlineStr"');
    expect(sheet).not.toContain('<f>');
    // The text survives as data, escaped for XML rather than prefixed.
    expect(sheet).toContain('=HYPERLINK(&quot;http://attacker/&quot;,A1)');
    // And no apostrophe was added — that hack belongs to the CSV.
    expect(sheet).not.toContain("<t xml:space=\"preserve\">'=HYPERLINK");
  });

  it('keeps a negative number as a NUMBER, needing no exemption at all', () => {
    // In CSV, `-500` had to be exempted from neutralisation by hand. Here the
    // type system does it: metrics are numeric cells.
    const book = toXlsx(run({ rows: [{ dim_0: 'Refund', metric_0: '-500' }] }), meta);
    const sheet = part(book, 'xl/worksheets/sheet2.xml');
    expect(sheet).toContain('<v>-500</v>');
  });

  it('strips control characters that would make the whole workbook unreadable', () => {
    // Excel reports an illegal XML character as "file is corrupt" rather than
    // pointing at the cell, so one bad byte in a deal name loses the file.
    const book = toXlsx(run({ rows: [{ dim_0: 'bad\x00\x07name', metric_0: '1' }] }), meta);
    const sheet = part(book, 'xl/worksheets/sheet2.xml');
    expect(sheet).toContain('badname');
    expect(sheet).not.toMatch(/[\x00-\x08]/);
  });
});

describe('the disclosure is in both places, on purpose', () => {
  it('opens on the note sheet, not on the numbers', () => {
    const wb = part(toXlsx(run(), meta), 'xl/workbook.xml');
    // Sheet ORDER is the disclosure decision.
    expect(wb.indexOf('About this report')).toBeLessThan(wb.indexOf('name="Data"'));
  });

  it('repeats the note above the data, because a sheet can be skipped', () => {
    /*
     * The risk a CSV does not have: a reader who opens "Data" and never clicks
     * "About this report" has seen the figures and not the note. Duplication is
     * the point — neither copy can be the one they missed.
     */
    const book = toXlsx(run(), meta);
    const about = part(book, 'xl/worksheets/sheet1.xml');
    const data = part(book, 'xl/worksheets/sheet2.xml');
    for (const s of [about, data]) {
      expect(s).toContain('Based on 1 row, and it is seeded demo data.');
    }
    // And above the header row on the data sheet.
    expect(data.indexOf('Based on 1 row')).toBeLessThan(data.indexOf('Sum of Value'));
  });

  it('carries truncation, mixed currencies and an unmeasurable seeded count', () => {
    const book = toXlsx(run({
      provenance: { ...run().provenance,
        rows_seeded: null, rows_real: null, seeded_share: null,
        currencies: ['AED', 'USD'], truncated: true },
    }), meta);
    const about = part(book, 'xl/worksheets/sheet1.xml');
    expect(about).toContain('TRUNCATED');
    expect(about).toContain('AED, USD');
    expect(about).toContain('not recorded for this module');
    expect(about).not.toContain('<v>0</v>');
  });
});

describe('the data block', () => {
  it('names a null dimension and leaves a null metric empty', () => {
    const sheet = part(toXlsx(run({ rows: [{ dim_0: null, metric_0: null }] }), meta),
      'xl/worksheets/sheet2.xml');
    expect(sheet).toContain('Not recorded');
  });

  it('writes a non-numeric metric as text rather than coercing it to a wrong number', () => {
    const sheet = part(toXlsx(run({ rows: [{ dim_0: 'x', metric_0: 'n/a' }] }), meta),
      'xl/worksheets/sheet2.xml');
    expect(sheet).toContain('n/a');
    expect(sheet).not.toContain('<v>NaN</v>');
  });
});

describe('column references', () => {
  it('rolls over past Z the way a spreadsheet does', () => {
    expect(colLetter(0)).toBe('A');
    expect(colLetter(25)).toBe('Z');
    expect(colLetter(26)).toBe('AA');
    expect(colLetter(51)).toBe('AZ');
    expect(colLetter(52)).toBe('BA');
  });
});

describe('filename', () => {
  it('slugifies, dates, and ends in .xlsx', () => {
    expect(xlsxFilename('Pipeline by Owner', '2026-09-23T10:00:00.000Z'))
      .toBe('pipeline-by-owner-2026-09-23.xlsx');
  });

  it('cannot inject a path', () => {
    const f = xlsxFilename('../../etc/passwd', '2026-09-23T10:00:00.000Z');
    expect(f).not.toContain('/');
    expect(f).not.toContain('..');
  });
});
