import { describe, it, expect } from 'vitest';
import {
  matchColumns, mapRows, applyFullNameFallback, buildTemplate,
  findWithinFileDuplicates, CONTACT_FIELDS, ACCOUNT_FIELDS,
} from './csvImportSpec';
import { parseCsv } from './csvParse';

const keyOf = (headers: string[]) =>
  matchColumns(headers, CONTACT_FIELDS).map(m => m.field?.key ?? null);

describe('matchColumns', () => {
  it('matches regardless of case, spacing and punctuation', () => {
    expect(keyOf(['First Name', 'first_name', 'FIRSTNAME'])[0]).toBe('first_name');
    expect(keyOf(['E-Mail'])).toEqual(['email']);
    expect(keyOf(['job title'])).toEqual(['position']);
  });

  it('maps the Salesforce/HubSpot spellings the alias table exists for', () => {
    expect(keyOf(['Email Address'])).toEqual(['email']);
    expect(keyOf(['Company'])).toEqual(['company_name']);
    expect(keyOf(['Mailing City'])).toEqual(['city']);
    expect(keyOf(['Contact Owner'])).toEqual(['owner_email']);
  });

  it('reports an unknown header as unmatched rather than guessing', () => {
    expect(keyOf(['Lead Score', 'Email'])).toEqual([null, 'email']);
  });

  // Two headers for one field: the second must not silently overwrite the first.
  it('claims a field once, leaving later synonyms unmatched', () => {
    expect(keyOf(['Company', 'Account Name'])).toEqual(['company_name', null]);
  });

  it('keeps the account spec separate from the contact spec', () => {
    const m = matchColumns(['Account Name', 'Annual Revenue'], ACCOUNT_FIELDS);
    expect(m.map(x => x.field?.key)).toEqual(['name', 'revenue']);
  });
});

describe('mapRows', () => {
  const run = (csv: string) => {
    const parsed = parseCsv(csv);
    return mapRows(parsed.rows, matchColumns(parsed.headers, CONTACT_FIELDS));
  };

  it('maps recognised columns and drops ignored ones', () => {
    expect(run('Email,Lead Score\nada@example.com,88')).toEqual([{ email: 'ada@example.com' }]);
  });

  // '' is a value and would overwrite a column default; absent lets the server decide.
  it('omits empty cells entirely rather than sending empty strings', () => {
    const [row] = run('Email,Phone\nada@example.com,');
    expect(row).toEqual({ email: 'ada@example.com' });
    expect('phone' in row).toBe(false);
  });

  it('splits tags on semicolons, matching the contacts export', () => {
    expect(run('Email,Tags\na@b.com,"vip; decision-maker"')[0].tags)
      .toEqual(['vip', 'decision-maker']);
  });

  it('keeps a comma inside a tag, which is why the delimiter is not a comma', () => {
    expect(run('Email,Tags\na@b.com,"Acme, Inc. contact; vip"')[0].tags)
      .toEqual(['Acme, Inc. contact', 'vip']);
  });
});

describe('applyFullNameFallback', () => {
  it('splits a single Name column into first and last', () => {
    expect(applyFullNameFallback([{ full_name: 'Ada Lovelace' }]))
      .toEqual([{ first_name: 'Ada', last_name: 'Lovelace' }]);
  });

  it('treats everything before the final word as the first name', () => {
    expect(applyFullNameFallback([{ full_name: 'Ada King Lovelace' }]))
      .toEqual([{ first_name: 'Ada King', last_name: 'Lovelace' }]);
  });

  it('lets explicit first/last columns win over a Name column', () => {
    expect(applyFullNameFallback([{ full_name: 'Wrong Person', first_name: 'Ada', last_name: 'Lovelace' }]))
      .toEqual([{ first_name: 'Ada', last_name: 'Lovelace' }]);
  });

  // No invented surname: the row fails server-side for a missing last name,
  // which is visible, rather than being silently completed.
  it('does not invent a last name for a one-word name', () => {
    expect(applyFullNameFallback([{ full_name: 'Prince' }])).toEqual([{ first_name: 'Prince' }]);
  });

  it('always removes the pseudo-field, which is not a column', () => {
    for (const r of applyFullNameFallback([{ full_name: 'Ada Lovelace' }, { full_name: 'Prince' }])) {
      expect('full_name' in r).toBe(false);
    }
  });
});

describe('buildTemplate', () => {
  // The template is the documentation for what the importer accepts, so every
  // header in it must actually be recognised when the file comes back.
  it('produces headers the importer recognises', () => {
    for (const fields of [CONTACT_FIELDS, ACCOUNT_FIELDS]) {
      const parsed = parseCsv(buildTemplate(fields));
      expect(parsed.headers.length).toBeGreaterThan(0);
      expect(matchColumns(parsed.headers, fields).filter(m => !m.field)).toEqual([]);
    }
  });

  it('includes the required fields', () => {
    const headers = parseCsv(buildTemplate(CONTACT_FIELDS)).headers;
    expect(headers).toEqual(expect.arrayContaining(['First Name', 'Last Name', 'Email']));
  });

  it('round-trips its own example row through the mapper', () => {
    const parsed = parseCsv(buildTemplate(CONTACT_FIELDS));
    const [row] = mapRows(parsed.rows, matchColumns(parsed.headers, CONTACT_FIELDS));
    expect(row.email).toBe('ada@example.com');
    expect(row.tags).toEqual(['vip', 'decision-maker']);
  });
});

describe('findWithinFileDuplicates', () => {
  const rows = (...emails: (string | undefined)[]) =>
    emails.map(e => (e === undefined ? {} : { email: e }));

  it('flags the later occurrence and points at the first', () => {
    const d = findWithinFileDuplicates(rows('a@x.com', 'b@x.com', 'a@x.com'), 'email');
    expect([...d.keys()]).toEqual([2]);
    expect(d.get(2)).toEqual({ value: 'a@x.com', firstIndex: 0 });
  });

  it('never flags the first occurrence', () => {
    expect(findWithinFileDuplicates(rows('a@x.com'), 'email').size).toBe(0);
  });

  it('flags every repeat after the first, all pointing at the first', () => {
    const d = findWithinFileDuplicates(rows('a@x.com', 'a@x.com', 'a@x.com'), 'email');
    expect([...d.keys()]).toEqual([1, 2]);
    expect(d.get(1)!.firstIndex).toBe(0);
    expect(d.get(2)!.firstIndex).toBe(0);
  });

  // Matches the server's lower(email) / lower(name) lookups.
  it('compares case-insensitively and ignores surrounding space', () => {
    const d = findWithinFileDuplicates(rows('A@X.com', ' a@x.com '), 'email');
    expect(d.has(1)).toBe(true);
  });

  // A missing key is a required-field error, which the server words better.
  it('does not treat repeated blanks or absent keys as duplicates', () => {
    expect(findWithinFileDuplicates(rows('', '', undefined, undefined), 'email').size).toBe(0);
  });

  it('works on an arbitrary key, which is how accounts dedupe on name', () => {
    const d = findWithinFileDuplicates(
      [{ name: 'Acme' }, { name: 'Globex' }, { name: 'acme' }], 'name');
    expect([...d.keys()]).toEqual([2]);
  });

  // The defect this was written for: the duplicate pair straddles a 500-row
  // chunk boundary, so a per-chunk check could not see it during a dry run.
  it('spans a chunk boundary, which is the case that regressed', () => {
    const big: Record<string, unknown>[] = [];
    for (let i = 0; i < 620; i++) big.push({ email: `r${i}@x.com` });
    big[549] = { email: 'r4@x.com' };            // chunk 2 repeats a chunk 1 row
    const d = findWithinFileDuplicates(big, 'email');
    expect([...d.keys()]).toEqual([549]);
    expect(d.get(549)!.firstIndex).toBe(4);
  });
});
