import PDFDocument from 'pdfkit';
import { UNATTRIBUTED, type ReportRun } from './runner';
import type { CsvMeta } from './csv';

/**
 * PDF EXPORT — P3 Phase 7.
 *
 * ─── WHERE THE DISCLOSURE GOES, AND WHY IT IS THE FOOTER ──────────────────
 *
 * Each format gets the placement its failure mode demands:
 *
 *   CSV   — one block above the data. One sheet, nowhere else to put it.
 *   XLSX  — its own first sheet AND repeated above the data, because a sheet is
 *           a thing you can fail to visit.
 *   PDF   — a block under the title on page 1, AND A CONDENSED LINE IN THE
 *           FOOTER OF EVERY PAGE.
 *
 * The footer is the whole point here. A PDF is the format most likely to be
 * printed, forwarded, or screenshotted a page at a time, and **page 4 on its
 * own must still say what it is made of**. A note that exists only on page 1
 * is a note that survives exactly as long as nobody separates the pages — and
 * separating the pages is what people do with PDFs.
 *
 * ─── WHY pdfkit AND NOT A HEADLESS BROWSER ────────────────────────────────
 *
 * pdfkit is pure JS with no native build step and no bundled browser. The
 * alternative considered and refused was puppeteer, which downloads a Chromium
 * build — rendering a table would mean running a browser on the server, and the
 * dependency is larger than this application.
 */

/** Strip characters that have no business in a rendered document. */
const clean = (s: string): string => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

const A4_MARGIN = 40;
const FONT = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const BODY_SIZE = 9;
const FOOTER_SIZE = 7;
/** Room reserved at the bottom of every page for the footer disclosure. */
const FOOTER_BAND = 46;

/**
 * The footer sentence. Shorter than the full disclosure on purpose — it has to
 * fit two lines at 7pt on every page without crowding the table — but it keeps
 * the two facts that change how a figure is read: how much is seeded, and
 * whether the result was cut off.
 *
 * It is DERIVED from the same provenance block, never written independently, so
 * it cannot say something the page-1 note contradicts.
 */
function footerLine(run: ReportRun, meta: CsvMeta): string {
  const p = run.provenance;
  const bits: string[] = [`${meta.reportName} — generated ${meta.generatedAt.slice(0, 10)}`];

  if (p.rows_seeded === null) {
    bits.push(`${p.rows_matched} rows; how much is seeded demo data is not recorded for this module`);
  } else if (p.rows_seeded > 0) {
    bits.push(`${p.rows_matched} rows, of which ${p.rows_seeded} are seeded demo data`);
  } else {
    bits.push(`${p.rows_matched} rows, none seeded demo data`);
  }

  if (p.currencies && p.currencies.length > 1) {
    bits.push(`amounts span ${p.currencies.join('/')} and are NOT converted`);
  }
  if (p.truncated) bits.push(`TRUNCATED at ${p.row_limit} rows`);

  return bits.join(' · ');
}

/** The detail lines of the page-1 block, mirroring the CSV/XLSX preamble. */
function noteLines(run: ReportRun, meta: CsvMeta): string[] {
  const p = run.provenance;
  const out: string[] = [p.disclosure];
  out.push(`Rows behind these figures: ${p.rows_matched.toLocaleString()}`);
  out.push(`Seeded demo rows: ${
    p.rows_seeded === null ? 'not recorded for this module' : p.rows_seeded.toLocaleString()}`);
  for (const c of p.coverage) {
    out.push(`${c.label} ${c.kind === 'join' ? 'linked' : 'recorded'}: ${c.matched} of ${c.of}`);
  }
  if (p.currencies && p.currencies.length > 1) {
    out.push(`Currencies: ${p.currencies.join(', ')} — added without conversion, `
      + 'so the totals are not meaningful as money.');
  }
  if (p.truncated) {
    out.push(`TRUNCATED: only the first ${p.row_limit.toLocaleString()} rows are included. There are more.`);
  }
  return out;
}

export function toPdf(run: ReportRun, meta: CsvMeta): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // `bufferPages` keeps every page addressable until the end, which is the
    // only way to write "Page 2 of 7" — the total is not known while the table
    // is still being laid out.
    const doc = new PDFDocument({
      size: 'A4', margin: A4_MARGIN, bufferPages: true,
      info: {
        Title: clean(meta.reportName),
        // No Author: there is no single person a report belongs to, and
        // inventing one would be a fabricated attribution inside file metadata
        // where nobody would think to check it.
        Creator: 'BMI CRM',
        CreationDate: new Date(meta.generatedAt),
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const usable = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const bottomLimit = doc.page.height - doc.page.margins.bottom - FOOTER_BAND;

    // ── Title ─────────────────────────────────────────────────────────────
    doc.font(FONT_BOLD).fontSize(16).fillColor('#111827')
      .text(clean(meta.reportName), { width: usable });
    doc.moveDown(0.3);

    // ── The disclosure block, directly under the title ────────────────────
    const blockTop = doc.y;
    doc.font(FONT).fontSize(8).fillColor('#374151');
    if (meta.caveat) {
      doc.font(FONT_BOLD).text(clean(meta.caveat), left + 8, doc.y + 6, { width: usable - 16 });
      doc.font(FONT);
    } else {
      doc.y = doc.y + 6;
    }
    for (const line of noteLines(run, meta)) {
      doc.text(clean(line), left + 8, doc.y + 2, { width: usable - 16 });
    }
    const blockBottom = doc.y + 6;
    // A rule down the left edge so the block reads as a note about the table
    // rather than as part of it.
    doc.save().lineWidth(2).strokeColor('#6366F1')
      .moveTo(left + 1, blockTop).lineTo(left + 1, blockBottom).stroke().restore();
    doc.y = blockBottom + 10;

    // ── Column widths from real font metrics ──────────────────────────────
    //
    // Measured, not guessed: a fixed share per column makes a long account name
    // overlap its neighbour, which in a printed table silently changes which
    // value a reader thinks belongs to which row.
    let dims = 0, metrics = 0;
    const keys = run.columns.map(c => (c.kind === 'dimension' ? `dim_${dims++}` : `metric_${metrics++}`));

    const cellText = (r: Record<string, unknown>, i: number): string => {
      const v = r[keys[i]];
      if (v === null || v === undefined) {
        return run.columns[i].kind === 'dimension' ? UNATTRIBUTED : '';
      }
      return clean(String(v));
    };

    doc.fontSize(BODY_SIZE);
    const natural = run.columns.map((c, i) => {
      doc.font(FONT_BOLD);
      let w = doc.widthOfString(c.label);
      doc.font(FONT);
      // Sampling the first 200 rows rather than all 5,000: the width only has
      // to be representative, and measuring every cell of a full export is
      // thousands of metric lookups for a column that is already wide enough.
      for (const r of run.rows.slice(0, 200)) {
        w = Math.max(w, doc.widthOfString(cellText(r, i)));
      }
      return w + 12;
    });

    const totalNatural = natural.reduce((a, b) => a + b, 0);
    const widths = totalNatural <= usable
      ? natural
      : natural.map(w => (w / totalNatural) * usable);

    const drawHeader = (): void => {
      doc.font(FONT_BOLD).fontSize(BODY_SIZE).fillColor('#111827');
      let x = left;
      run.columns.forEach((c, i) => {
        doc.text(c.label, x, doc.y, {
          width: widths[i] - 6,
          align: c.kind === 'metric' ? 'right' : 'left',
          lineBreak: false, continued: false,
        });
        x += widths[i];
      });
      doc.moveDown(0.2);
      doc.save().lineWidth(0.5).strokeColor('#D1D5DB')
        .moveTo(left, doc.y).lineTo(left + usable, doc.y).stroke().restore();
      doc.moveDown(0.3);
      doc.font(FONT).fillColor('#374151');
    };

    drawHeader();

    for (const r of run.rows) {
      if (doc.y > bottomLimit) {
        doc.addPage();
        // The header repeats on every page for the same reason the footer
        // does: a page read on its own must be interpretable.
        drawHeader();
      }
      const rowY = doc.y;
      let x = left;
      run.columns.forEach((c, i) => {
        doc.text(cellText(r, i), x, rowY, {
          width: widths[i] - 6,
          align: c.kind === 'metric' ? 'right' : 'left',
          lineBreak: false, continued: false,
        });
        x += widths[i];
      });
      doc.y = rowY + BODY_SIZE + 3;
    }

    if (run.rows.length === 0) {
      doc.font(FONT).fontSize(BODY_SIZE).fillColor('#6B7280')
        .text('No rows matched this report. That is a result, not a failure.', left, doc.y + 6);
    }

    // ── Footers, written last because "of N" needs the total ──────────────
    const line = footerLine(run, meta);
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const y = doc.page.height - doc.page.margins.bottom - FOOTER_BAND + 10;
      doc.save().lineWidth(0.5).strokeColor('#D1D5DB')
        .moveTo(left, y - 6).lineTo(left + usable, y - 6).stroke().restore();
      doc.font(FONT).fontSize(FOOTER_SIZE).fillColor('#6B7280')
        .text(clean(line), left, y, { width: usable - 70, lineBreak: true });
      doc.text(`Page ${i + 1} of ${range.count}`,
        left + usable - 70, y, { width: 70, align: 'right', lineBreak: false });
    }

    doc.end();
  });
}

export function pdfFilename(reportName: string, generatedAt: string): string {
  const slug = reportName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report';
  return `${slug}-${generatedAt.slice(0, 10)}.pdf`;
}
