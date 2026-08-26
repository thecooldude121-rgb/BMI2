import { describe, it, expect } from 'vitest';
import { csvCell, toCsv } from './csv';

describe('csvCell', () => {
  it('quotes a value containing a comma', () => {
    // "Acme, Inc." used to shift every later column on the row.
    expect(csvCell('Acme, Inc.')).toBe('"Acme, Inc."');
  });

  it('escapes an embedded quote by doubling it', () => {
    expect(csvCell('He said "hi"')).toBe('"He said ""hi"""');
  });

  it('quotes a value containing a newline', () => {
    // A multi-line note used to split one record into two broken rows.
    expect(csvCell('line one\nline two')).toBe('"line one\nline two"');
  });

  it('leaves an ordinary value unquoted', () => {
    expect(csvCell('Ada Lovelace')).toBe('Ada Lovelace');
  });

  it('renders null and undefined as empty, not as the words', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
  });

  it('keeps a zero rather than treating it as absent', () => {
    expect(csvCell(0)).toBe('0');
  });
});

describe('toCsv', () => {
  it('keeps column alignment when a cell contains the delimiter', () => {
    const csv = toCsv(['Name', 'Company', 'Email'], [
      ['Ada', 'Acme, Inc.', 'ada@example.com'],
    ]);
    expect(csv).toBe('Name,Company,Email\r\n' + 'Ada,"Acme, Inc.",ada@example.com');
    // The row still has exactly three fields once parsed.
    expect(csv.split('\r\n')[1].match(/("([^"]|"")*"|[^,]*)/g)?.filter(s => s !== '').length).toBe(3);
  });

  it('separates rows with CRLF', () => {
    expect(toCsv(['A'], [['1'], ['2']])).toBe('A\r\n1\r\n2');
  });
});
