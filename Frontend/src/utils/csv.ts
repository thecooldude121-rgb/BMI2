/**
 * CSV building, extracted so the quoting rules are testable.
 *
 * The contacts export previously built rows by interpolating values into a
 * comma-joined template string. A company named "Acme, Inc." shifted every
 * later column on that row, and a note containing a newline split one contact
 * into two malformed rows. Nobody would notice until the file was opened
 * somewhere else, which makes a silently corrupted export worse than no export.
 */

/** Quote a single cell per RFC 4180. */
export function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  // Quote if the value contains a delimiter, a quote, or a line break. A quote
  // inside a quoted field is escaped by doubling it.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Build a CSV document from a header row and body rows.
 *
 * Rows are joined with CRLF because that is what RFC 4180 specifies and what
 * Excel expects; a bare LF is read as a single row by some versions.
 */
export function toCsv(headers: readonly string[], rows: readonly unknown[][]): string {
  return [headers.map(csvCell).join(','), ...rows.map(r => r.map(csvCell).join(','))].join('\r\n');
}
