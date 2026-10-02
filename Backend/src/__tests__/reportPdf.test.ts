import { describe, it, expect } from 'vitest';
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { toPdf, pdfFilename } from '../services/reports/pdf';
import type { ReportRun } from '../services/reports/runner';

/**
 * PDF EXPORT. P3 Phase 7. PURE — no database.
 *
 * THE TEXT IS EXTRACTED WITH A REAL PDF READER (pypdf), not asserted against
 * our own byte stream. pdfkit compresses its content streams, so searching the
 * raw buffer for a sentence would find nothing even when the sentence is
 * rendered — and worse, could be made to "pass" by writing the text somewhere
 * invisible. Extraction is the only check that answers "would a reader see it".
 */

const run = (over: Partial<ReportRun> = {}): ReportRun => ({
  columns: [
    { key: 'd', label: 'Owner', kind: 'dimension' },
    { key: 'm', label: 'Sum of Value', kind: 'metric' },
  ],
  rows: [{ dim_0: 'Alex Rodriguez', metric_0: '30000' }],
  provenance: {
    rows_returned: 1, rows_matched: 18, rows_seeded: 15, rows_real: 3,
    seeded_share: 0.83, mostly_seeded: true, excluded_test: 3,
    coverage: [{ kind: 'dimension', key: 'deals.owner_name', label: 'Owner (linked user)', matched: 1, of: 18 }],
    currencies: null, truncated: false, row_limit: 5000,
    disclosure: 'Based on 18 rows — 15 of them seeded demo data, 3 real.',
  },
  ms: 7,
  ...over,
});

const meta = { reportName: 'Pipeline by Owner', generatedAt: '2026-10-03T10:00:00.000Z' };

/** Page-by-page text, via pypdf. */
function pages(pdf: Buffer): string[] {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-'));
  const file = path.join(dir, 'r.pdf');
  try {
    fs.writeFileSync(file, pdf);
    const out = execFileSync('python3', ['-c', `
import json,sys
from pypdf import PdfReader
r = PdfReader(sys.argv[1])
print(json.dumps([p.extract_text() or '' for p in r.pages]))
`, file]).toString();
    return JSON.parse(out);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** Enough rows to force pagination, so "every page" means something. */
const manyRows = (n: number) => ({
  rows: Array.from({ length: n }, (_, i) => ({ dim_0: `Rep ${i}`, metric_0: String(1000 + i) })),
});

describe('it is a real PDF', () => {
  it('starts with the PDF magic and opens in a reader', async () => {
    const pdf = await toPdf(run(), meta);
    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    expect(pages(pdf).length).toBeGreaterThan(0);
  });

  it('paginates a long result', async () => {
    const pdf = await toPdf(run(manyRows(150)), meta);
    expect(pages(pdf).length).toBeGreaterThan(1);
  });
});

describe('the disclosure block sits under the title on page 1', () => {
  it('renders the sentence, the figures and the coverage', async () => {
    const [p1] = pages(await toPdf(run(), meta));
    expect(p1).toContain('Pipeline by Owner');
    expect(p1).toContain('Based on 18 rows');
    expect(p1).toContain('Rows behind these figures: 18');
    expect(p1).toContain('Owner (linked user) recorded: 1 of 18');
  });

  it('puts the note ABOVE the table, not after it', async () => {
    const [p1] = pages(await toPdf(run(), meta));
    expect(p1.indexOf('Based on 18 rows')).toBeLessThan(p1.indexOf('Sum of Value'));
  });

  it('renders a canned report\'s structural caveat', async () => {
    const [p1] = pages(await toPdf(run(), { ...meta, caveat: 'Industry lives on the account.' }));
    expect(p1).toContain('Industry lives on the account.');
  });

  it('states an unmeasurable seeded count rather than printing 0', async () => {
    const [p1] = pages(await toPdf(run({
      provenance: { ...run().provenance, rows_seeded: null, rows_real: null, seeded_share: null },
    }), meta));
    expect(p1).toContain('not recorded for this module');
    expect(p1).not.toContain('Seeded demo rows: 0');
  });
});

describe('EVERY page carries the disclosure in its footer', () => {
  /*
   * The reason PDF differs from the other two formats. A PDF is the artefact
   * most likely to be printed, forwarded or screenshotted a page at a time, so
   * page 4 on its own must still say what it is made of. A note that exists
   * only on page 1 survives exactly as long as nobody separates the pages —
   * and separating the pages is what people do with PDFs.
   */
  it('repeats the seeded share on all pages, not just the first', async () => {
    const all = pages(await toPdf(run(manyRows(150)), meta));
    expect(all.length).toBeGreaterThan(1);
    for (const [i, text] of all.entries()) {
      expect(text, `page ${i + 1} has no seeded-data note`).toContain('seeded demo data');
    }
  });

  it('repeats a TRUNCATION warning on all pages', async () => {
    const all = pages(await toPdf(run({
      ...manyRows(150),
      provenance: { ...run().provenance, truncated: true },
    }), meta));
    for (const [i, text] of all.entries()) {
      expect(text, `page ${i + 1} does not say it is truncated`).toContain('TRUNCATED');
    }
  });

  it('repeats a mixed-currency warning on all pages', async () => {
    const all = pages(await toPdf(run({
      ...manyRows(150),
      provenance: { ...run().provenance, currencies: ['AED', 'USD'] },
    }), meta));
    for (const [i, text] of all.entries()) {
      expect(text, `page ${i + 1} does not warn about currency`).toContain('NOT converted');
    }
  });

  it('numbers every page, so a missing one is noticeable', async () => {
    const all = pages(await toPdf(run(manyRows(150)), meta));
    all.forEach((text, i) => {
      expect(text).toContain(`Page ${i + 1} of ${all.length}`);
    });
  });

  it('repeats the column headers too, so a loose page is readable', async () => {
    const all = pages(await toPdf(run(manyRows(150)), meta));
    for (const [i, text] of all.entries()) {
      expect(text, `page ${i + 1} has no header row`).toContain('Sum of Value');
    }
  });
});

describe('the data', () => {
  it('names a null dimension', async () => {
    const [p1] = pages(await toPdf(run({ rows: [{ dim_0: null, metric_0: '5' }] }), meta));
    expect(p1).toContain('Not recorded');
  });

  it('says an empty result is a result', async () => {
    const [p1] = pages(await toPdf(run({ rows: [] }), meta));
    expect(p1).toContain('a result, not a failure');
  });

  it('renders a value that would be a formula elsewhere as plain text', async () => {
    // Not an injection risk in a PDF — there is nothing to execute — so it is
    // rendered verbatim rather than prefixed. Worth pinning so nobody "fixes"
    // it by copying the CSV's apostrophe into a format that does not need it.
    const [p1] = pages(await toPdf(run({
      rows: [{ dim_0: '=HYPERLINK("http://x/",A1)', metric_0: '1' }],
    }), meta));
    expect(p1).toContain('=HYPERLINK');
    expect(p1).not.toContain("'=HYPERLINK");
  });

  it('survives control characters instead of producing an unopenable file', async () => {
    const pdf = await toPdf(run({ rows: [{ dim_0: 'bad\x00\x07name', metric_0: '1' }] }), meta);
    expect(pages(pdf)[0]).toContain('badname');
  });
});

describe('filename', () => {
  it('slugifies, dates and ends in .pdf', () => {
    expect(pdfFilename('Pipeline by Owner', '2026-10-03T10:00:00.000Z'))
      .toBe('pipeline-by-owner-2026-10-03.pdf');
  });

  it('cannot inject a path', () => {
    const f = pdfFilename('../../etc/passwd', '2026-10-03T10:00:00.000Z');
    expect(f).not.toContain('/');
    expect(f).not.toContain('..');
  });
});
