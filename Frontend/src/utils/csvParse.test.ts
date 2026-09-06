import { describe, it, expect } from 'vitest';
import { parseCsv } from './csvParse';
import { toCsv } from './csv';

describe('parseCsv', () => {
  it('parses a simple document', () => {
    const p = parseCsv('Name,Email\nAda,ada@example.com\nGrace,grace@example.com');
    expect(p.headers).toEqual(['Name', 'Email']);
    expect(p.rows).toEqual([
      { Name: 'Ada', Email: 'ada@example.com' },
      { Name: 'Grace', Email: 'grace@example.com' },
    ]);
  });

  it('handles CRLF, which is what RFC 4180 and Excel produce', () => {
    const p = parseCsv('Name,Email\r\nAda,ada@example.com\r\n');
    expect(p.rows).toEqual([{ Name: 'Ada', Email: 'ada@example.com' }]);
  });

  it('strips a BOM so the first header still matches an alias', () => {
    const p = parseCsv('﻿Name,Email\nAda,ada@example.com');
    expect(p.headers).toEqual(['Name', 'Email']);
  });

  // ── Bug 1: a quoted field containing a newline ──────────────────────────
  // The old parser split on '\n' before parsing quotes, so this became two
  // malformed rows.
  it('keeps a newline inside a quoted field in one row', () => {
    const p = parseCsv('Name,Notes\nAda,"line one\nline two"\nGrace,ok');
    expect(p.rows).toHaveLength(2);
    expect(p.rows[0].Notes).toBe('line one\nline two');
    expect(p.rows[1]).toEqual({ Name: 'Grace', Notes: 'ok' });
  });

  it('keeps a comma inside a quoted field in one cell', () => {
    const p = parseCsv('Name,Company\nAda,"Acme, Inc."');
    expect(p.rows[0].Company).toBe('Acme, Inc.');
  });

  it('unescapes a doubled quote', () => {
    const p = parseCsv('Name,Note\nAda,"she said ""hi"""');
    expect(p.rows[0].Note).toBe('she said "hi"');
  });

  // ── Bug 2: a blank header shifted every later column ────────────────────
  // filter(Boolean) removed the name but not the value, so Email used to read
  // the middle column's value.
  it('does not shift columns when a header is blank', () => {
    const p = parseCsv('Name,,Email\nAda,junk,ada@example.com');
    expect(p.headers).toEqual(['Name', 'Email']);
    expect(p.rows[0]).toEqual({ Name: 'Ada', Email: 'ada@example.com' });
  });

  it('ignores trailing blank headers, as Salesforce exports carry', () => {
    const p = parseCsv('Name,Email,,\nAda,ada@example.com,,');
    expect(p.headers).toEqual(['Name', 'Email']);
    expect(p.rows[0]).toEqual({ Name: 'Ada', Email: 'ada@example.com' });
  });

  // ── Shape edge cases ────────────────────────────────────────────────────
  it('treats a short row as having empty trailing fields', () => {
    const p = parseCsv('Name,Email,Phone\nAda,ada@example.com');
    expect(p.rows[0]).toEqual({ Name: 'Ada', Email: 'ada@example.com', Phone: '' });
  });

  it('skips blank lines rather than emitting empty rows', () => {
    const p = parseCsv('Name\nAda\n\n\nGrace\n');
    expect(p.rows).toEqual([{ Name: 'Ada' }, { Name: 'Grace' }]);
  });

  it('returns nothing for an empty document', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
    expect(parseCsv('\n\n')).toEqual({ headers: [], rows: [] });
  });

  // A record of nothing but empty cells is indistinguishable from a blank line,
  // so it is skipped and the next record becomes the header — which is what
  // someone who left a stray line above their headers means.
  it('skips a leading record of empty cells and headers on the next one', () => {
    expect(parseCsv(',,\na,b,c')).toEqual({
      headers: ['a', 'b', 'c'],
      rows: [],
    });
  });

  it('reads a header-only file as zero rows, not as an error', () => {
    expect(parseCsv('Name,Email')).toEqual({ headers: ['Name', 'Email'], rows: [] });
  });

  // ── The round trip the old parser could not do ──────────────────────────
  // toCsv() quotes any value containing a comma, quote or newline, so an export
  // from this app is exactly the input that used to break on read.
  it('round-trips a document written by toCsv', () => {
    const headers = ['Name', 'Company', 'Notes'];
    const original = [
      ['Ada Lovelace', 'Acme, Inc.', 'first line\nsecond line'],
      ['Grace Hopper', 'Bugs "R" Us', 'plain'],
    ];
    const parsed = parseCsv(toCsv(headers, original));
    expect(parsed.headers).toEqual(headers);
    expect(parsed.rows).toEqual([
      { Name: 'Ada Lovelace', Company: 'Acme, Inc.', Notes: 'first line\nsecond line' },
      { Name: 'Grace Hopper', Company: 'Bugs "R" Us', Notes: 'plain' },
    ]);
  });
});
