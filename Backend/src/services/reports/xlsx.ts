import { buildZip, type ZipEntry } from './zip';
import { UNATTRIBUTED, type ReportRun } from './runner';
import type { CsvMeta } from './csv';

/**
 * EXCEL EXPORT — P3 Phase 7.
 *
 * ─── THE FORMAT ANSWERS THE INJECTION PROBLEM STRUCTURALLY ────────────────
 *
 * The CSV writer neutralises a leading `=` with an apostrophe, because CSV has
 * no types: a spreadsheet decides what a cell IS by looking at its text.
 *
 * XLSX has types. A cell is a formula only when it carries an `<f>` element,
 * and this writer emits none — every text value goes out as `t="inlineStr"`.
 * So `=HYPERLINK("http://attacker/",A1)` in a deal name is stored as, and
 * displayed as, that literal text. There is nothing to escape and no prefix to
 * add, and no way for a future edit to this file to reintroduce the problem
 * short of deliberately writing a formula element.
 *
 * That is worth stating plainly because it inverts the usual trade: the more
 * complex format is the SAFER one here. The apostrophe in the CSV is a
 * workaround for a format that cannot express "this is text"; xlsx can.
 *
 * ─── WHERE THE DISCLOSURE GOES, AND WHY IT DIFFERS FROM THE CSV ───────────
 *
 * In the CSV the note sits above the data, in the same rectangle, because a CSV
 * has nowhere else to put it — one file, one sheet, no navigation.
 *
 * A workbook has sheets, which creates a real risk the CSV does not have: a
 * reader who opens "Data" and never clicks "About this report" has seen the
 * figures and not the note. A sheet is a thing you can fail to visit.
 *
 * So the note is in BOTH places: it opens as its own first sheet, AND the top
 * rows of the data sheet repeat it. Duplication is the point — the reader meets
 * it whichever way they arrive, and neither copy can be the one they missed.
 */

const ESC: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
};

/**
 * XML escaping, plus removal of characters XML 1.0 cannot represent AT ALL.
 *
 * A control character in a deal name is not merely ugly here: it makes the
 * whole workbook unreadable, and Excel reports that as "file is corrupt"
 * rather than pointing at the cell. Tab, LF and CR are legal and kept.
 */
function xml(s: string): string {
  return s
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/[&<>"']/g, c => ESC[c]);
}

/** Column index (0-based) to a spreadsheet letter: 0 -> A, 26 -> AA. */
export function colLetter(i: number): string {
  let n = i + 1;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

type CellValue = string | number | null;

/**
 * One cell. A number is written as a NUMERIC cell so the recipient can sum the
 * column; everything else is an inline string, which is never evaluated.
 */
function cell(ref: string, v: CellValue): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number' && Number.isFinite(v)) {
    return `<c r="${ref}"><v>${v}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xml(String(v))}</t></is></c>`;
}

function sheetXml(rows: CellValue[][]): string {
  const body = rows.map((cells, r) => {
    const inner = cells.map((v, c) => cell(`${colLetter(c)}${r + 1}`, v)).join('');
    return `<row r="${r + 1}">${inner}</row>`;
  }).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    + `<sheetData>${body}</sheetData></worksheet>`;
}

/** The note rows, shared by the About sheet and the top of the Data sheet. */
function noteRows(run: ReportRun, meta: CsvMeta): CellValue[][] {
  const p = run.provenance;
  const rows: CellValue[][] = [
    ['Report', meta.reportName],
    ['Generated', meta.generatedAt],
  ];
  if (meta.caveat) rows.push(['About this report', meta.caveat]);
  rows.push(['Data note', p.disclosure]);
  rows.push(['Rows behind these figures', p.rows_matched]);
  rows.push([
    'Seeded demo rows',
    p.rows_seeded === null ? 'not recorded for this module' : p.rows_seeded,
  ]);
  for (const c of p.coverage) {
    rows.push([
      `${c.label} ${c.kind === 'join' ? 'linked' : 'recorded'}`,
      `${c.matched} of ${c.of}`,
    ]);
  }
  if (p.currencies && p.currencies.length > 1) {
    rows.push(['Currencies',
      `${p.currencies.join(', ')} — added without conversion, totals are not meaningful as money`]);
  }
  if (p.truncated) {
    rows.push(['TRUNCATED',
      `Only the first ${p.row_limit} rows are included. There are more.`]);
  }
  return rows;
}

export function toXlsx(run: ReportRun, meta: CsvMeta): Buffer {
  const note = noteRows(run, meta);

  let dims = 0, metrics = 0;
  const keys = run.columns.map(c => (c.kind === 'dimension' ? `dim_${dims++}` : `metric_${metrics++}`));

  const dataRows: CellValue[][] = [
    ...note,
    [],                                     // blank separator
    run.columns.map(c => c.label),
  ];
  for (const r of run.rows) {
    dataRows.push(run.columns.map((c, i) => {
      const v = r[keys[i]];
      if (v === null || v === undefined) {
        // A null DIMENSION is a named bucket; a null METRIC is a real absence.
        // Same split as the CSV and both UI surfaces.
        return c.kind === 'dimension' ? UNATTRIBUTED : null;
      }
      // Postgres returns NUMERIC as a string to avoid precision loss. A metric
      // that is a clean number is written as one so the column can be summed;
      // anything else stays text rather than being coerced into a wrong number.
      const n = Number(v);
      return c.kind === 'metric' && v !== '' && Number.isFinite(n) ? n : String(v);
    }));
  }

  const entries: ZipEntry[] = [
    {
      name: '[Content_Types].xml',
      data: Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        + '<Default Extension="xml" ContentType="application/xml"/>'
        + '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        + '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        + '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        + '</Types>', 'utf8'),
    },
    {
      name: '_rels/.rels',
      data: Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
        + '</Relationships>', 'utf8'),
    },
    {
      name: 'xl/workbook.xml',
      // Sheet ORDER is the disclosure decision: "About this report" is sheet 1,
      // so a workbook opens on the note rather than on the numbers.
      data: Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        + 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        + '<sheets>'
        + '<sheet name="About this report" sheetId="1" r:id="rId1"/>'
        + '<sheet name="Data" sheetId="2" r:id="rId2"/>'
        + '</sheets></workbook>', 'utf8'),
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: Buffer.from('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
        + '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>'
        + '</Relationships>', 'utf8'),
    },
    { name: 'xl/worksheets/sheet1.xml', data: Buffer.from(sheetXml(note), 'utf8') },
    { name: 'xl/worksheets/sheet2.xml', data: Buffer.from(sheetXml(dataRows), 'utf8') },
  ];

  return buildZip(entries);
}

export function xlsxFilename(reportName: string, generatedAt: string): string {
  const slug = reportName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report';
  return `${slug}-${generatedAt.slice(0, 10)}.xlsx`;
}

export const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
