/**
 * CSV reading, the counterpart to the writer in ./csv.ts.
 *
 * WHY IT LIVES HERE NOW
 * This started as components/Leads/ImportWizard/csvParser.ts, when leads were
 * the only entity that could be imported. Contacts and accounts import through
 * the same code, so it sits beside toCsv() rather than inside one feature's
 * wizard. Nothing about the lead wizard's behaviour changed in the move.
 *
 * TWO BUGS FIXED IN THE MOVE, both reachable from a real Salesforce/HubSpot
 * export and both silent — they corrupt rows rather than failing:
 *
 * 1. THE OLD PARSER SPLIT ON NEWLINES BEFORE IT PARSED QUOTES.
 *    `text.split('\n')` ran first, so a quoted field containing a line break
 *    was torn into two rows, each malformed. RFC 4180 explicitly permits a
 *    newline inside a quoted field, and this project emits them: csvCell()
 *    quotes any value containing \n, so a contact whose `notes` span two lines
 *    exports correctly and could not be read back in. The app's own export was
 *    not round-trippable through its own import. Parsing is now a single
 *    character scan over the whole document, where a newline inside quotes is
 *    just another character.
 *
 * 2. `headers.filter(Boolean)` DROPPED BLANK HEADERS FROM THE HEADER ARRAY BUT
 *    NOT THE MATCHING VALUES FROM EACH ROW.
 *    Headers `Name,,Email` became ['Name','Email'], so row `a,b,c` was read as
 *    Name=a, Email=b — every column after the gap shifted left by one, and the
 *    last one vanished. Salesforce exports routinely carry blank trailing or
 *    interior columns. Positional alignment is now preserved: an unnamed column
 *    keeps its slot and its values are ignored, which is what a reader means by
 *    "that column has no header".
 */

export interface ParsedCsv {
  /** Named headers, in file order. Unnamed columns are omitted here but still
   *  hold their position when values are matched up. */
  headers: string[];
  rows: Record<string, string>[];
}

/** The largest file we will read. Beyond this, ask the user to split it. */
export const MAX_ROWS = 1000;

/**
 * Split a whole CSV document into a grid of raw cells.
 *
 * One pass, character by character, tracking whether we are inside a quoted
 * field. That is the only way a delimiter or a line break inside quotes can be
 * distinguished from one that ends a field or a record.
 */
function toGrid(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let i = 0;

  // A BOM is common in files Excel has written and would otherwise become part
  // of the first header's name, so no alias would ever match it.
  if (text.charCodeAt(0) === 0xfeff) i = 1;

  const endField = () => { row.push(field); field = ''; };
  const endRow = () => { endField(); rows.push(row); row = []; };

  while (i < text.length) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        // A doubled quote inside a quoted field is one literal quote.
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        quoted = false;
        i++;
        continue;
      }
      // Newlines inside quotes are content, not record separators. This is the
      // whole point of the rewrite.
      field += ch;
      i++;
      continue;
    }

    if (ch === '"' && field === '') { quoted = true; i++; continue; }
    if (ch === ',')  { endField(); i++; continue; }
    if (ch === '\r') {
      // Handle CRLF and a lone CR identically; both end the record.
      endRow();
      i += text[i + 1] === '\n' ? 2 : 1;
      continue;
    }
    if (ch === '\n') { endRow(); i++; continue; }

    field += ch;
    i++;
  }

  // Whatever is buffered when the text runs out is the final field. Skip it
  // only when the document ended exactly on a record separator, which leaves an
  // empty buffer and an empty row.
  if (field !== '' || row.length > 0) endRow();

  return rows;
}

/** True for a row that carries nothing but empty cells. */
function isBlankRow(cells: string[]): boolean {
  return cells.every(c => c.trim() === '');
}

/**
 * Parse a CSV document into named rows.
 *
 * Values and header names are trimmed: leading spaces after a comma are a
 * formatting artefact in hand-edited files, not data. A value that was quoted
 * specifically to preserve its spaces is the one case this gets wrong, and that
 * is the trade the previous parser made too.
 */
export function parseCsv(text: string): ParsedCsv {
  const grid = toGrid(text);

  // Drop leading and trailing blank records. An interior blank line is dropped
  // too (below) rather than becoming a row of empty strings.
  while (grid.length && isBlankRow(grid[0])) grid.shift();
  if (grid.length === 0) return { headers: [], rows: [] };

  const rawHeaders = grid[0].map(h => h.trim());
  // Positions of the columns that actually have a name. Keeping the INDEX, not
  // just the name, is what fixes the column-shift bug: an unnamed column still
  // occupies its slot when values are read back.
  // At least one column is always named here: the blank-record check above uses
  // the same trimmed-empty test, so a row that survived it has a non-empty cell.
  const named = rawHeaders
    .map((name, index) => ({ name, index }))
    .filter(h => h.name !== '');

  const rows: Record<string, string>[] = [];
  for (let r = 1; r < grid.length; r++) {
    const cells = grid[r];
    if (isBlankRow(cells)) continue;
    const row: Record<string, string> = {};
    // A short row is legal: trailing empty fields are frequently omitted.
    for (const { name, index } of named) row[name] = (cells[index] ?? '').trim();
    rows.push(row);
  }

  return { headers: named.map(h => h.name), rows };
}

/** Read a File as UTF-8 text. Rejects rather than resolving '' on failure. */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve((e.target?.result as string) ?? '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'UTF-8');
  });
}
