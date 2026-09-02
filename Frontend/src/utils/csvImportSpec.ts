import { toCsv } from './csv';

/**
 * Column recognition for CSV import, shared by contacts and accounts.
 *
 * WHAT THIS IS AND IS NOT
 * This is an ALIAS TABLE, not a mapping UI. A header is matched against a list
 * of names that entity is known by in Salesforce, HubSpot and hand-made
 * spreadsheets; anything unrecognised is reported to the user as ignored rather
 * than guessed at. A full drag-to-map step (the shape of
 * components/Leads/ImportWizard/Step2Mapping.tsx) is real scope and was
 * deliberately left out of v1 — the honest substitute is telling the user
 * exactly which of their columns were understood and which were not, which the
 * panel does before anything is written.
 *
 * The mapped keys below are the field names the API expects. They are NOT the
 * user's headers, and they are not the database's columns either where the two
 * differ (`company_name` and `owner_email` are import-only and are resolved to
 * ids server-side).
 */

export interface FieldSpec {
  /** The key sent to the API. */
  key: string;
  /** Shown in the recognised-columns list and used as the template header. */
  label: string;
  /** Header spellings that map to this field. Matched case/punctuation-insensitively. */
  aliases: string[];
  required?: boolean;
  /** A value for the downloadable template's example row. */
  example?: string;
  /** Split on ';' into an array of strings. */
  list?: boolean;
  /** Excluded from the template — accepted on import but not something to suggest. */
  templateOmit?: boolean;
}

/**
 * Normalise a header for comparison: case, spaces, underscores and punctuation
 * all vary between exports of the same field ("First Name", "first_name",
 * "FirstName"). Comparing the stripped forms means one alias covers all of them.
 */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * CONTACTS.
 *
 * `full_name` is a pseudo-field: the table has no such column, but a single
 * "Name" column is what a HubSpot export and most hand-made sheets actually
 * carry. It is split into first/last at map time, and only used when the row
 * has no separate first/last.
 */
export const CONTACT_FIELDS: FieldSpec[] = [
  { key: 'first_name', label: 'First Name', required: true, example: 'Ada',
    aliases: ['first name', 'firstname', 'given name', 'forename'] },
  { key: 'last_name', label: 'Last Name', required: true, example: 'Lovelace',
    aliases: ['last name', 'lastname', 'surname', 'family name'] },
  { key: 'full_name', label: 'Name', templateOmit: true,
    aliases: ['name', 'full name', 'fullname', 'contact name', 'contact'] },
  { key: 'email', label: 'Email', required: true, example: 'ada@example.com',
    aliases: ['email', 'email address', 'e-mail', 'work email', 'business email', 'primary email'] },
  { key: 'phone', label: 'Phone', example: '+91 80 4000 1000',
    aliases: ['phone', 'phone number', 'business phone', 'work phone', 'office phone', 'telephone'] },
  { key: 'mobile', label: 'Mobile', example: '+91 98800 11111',
    aliases: ['mobile', 'mobile phone', 'cell', 'cell phone', 'mobile number'] },
  { key: 'position', label: 'Job Title', example: 'VP of Engineering',
    aliases: ['job title', 'title', 'position', 'role', 'designation'] },
  { key: 'department', label: 'Department', example: 'Engineering',
    aliases: ['department', 'dept', 'function'] },
  { key: 'company_name', label: 'Account', example: 'Acme Corp',
    aliases: ['account', 'account name', 'company', 'company name', 'organisation', 'organization', 'employer'] },
  { key: 'owner_email', label: 'Owner Email', example: '',
    aliases: ['owner email', 'owner', 'contact owner', 'assigned to', 'account owner'] },
  { key: 'linkedin_url', label: 'LinkedIn URL', example: '',
    aliases: ['linkedin url', 'linkedin', 'linkedin profile'] },
  { key: 'street', label: 'Street', example: '',
    aliases: ['street', 'address', 'street address', 'mailing street', 'address line 1'] },
  { key: 'city', label: 'City', example: 'Bengaluru',
    aliases: ['city', 'mailing city', 'town'] },
  { key: 'state', label: 'State', example: 'Karnataka',
    aliases: ['state', 'province', 'region', 'mailing state'] },
  { key: 'postal_code', label: 'Postal Code', example: '560001',
    aliases: ['postal code', 'zip', 'zip code', 'postcode', 'mailing zip'] },
  { key: 'country', label: 'Country', example: 'India',
    aliases: ['country', 'mailing country'] },
  { key: 'timezone', label: 'Timezone', templateOmit: true,
    aliases: ['timezone', 'time zone'] },
  { key: 'tags', label: 'Tags', list: true, example: 'vip; decision-maker',
    aliases: ['tags', 'tag', 'labels'] },
  { key: 'notes', label: 'Notes', example: 'Met at SaaStr',
    aliases: ['notes', 'note', 'description', 'comments'] },
  { key: 'source', label: 'Source', templateOmit: true,
    aliases: ['source', 'lead source', 'contact source'] },
  { key: 'status', label: 'Status', templateOmit: true,
    aliases: ['status', 'contact status'] },
];

/** ACCOUNTS (the `companies` table). */
export const ACCOUNT_FIELDS: FieldSpec[] = [
  { key: 'name', label: 'Account Name', required: true, example: 'Acme Corp',
    aliases: ['account name', 'name', 'company', 'company name', 'organisation', 'organization'] },
  { key: 'domain', label: 'Domain', example: 'acme.com',
    aliases: ['domain', 'company domain', 'email domain', 'website domain'] },
  { key: 'industry', label: 'Industry', example: 'IT Services',
    aliases: ['industry', 'sector', 'vertical'] },
  { key: 'size', label: 'Company Size', example: '51-200',
    aliases: ['company size', 'size', 'employees', 'employee count', 'number of employees', 'headcount'] },
  { key: 'revenue', label: 'Annual Revenue', example: '25000000',
    aliases: ['annual revenue', 'revenue', 'turnover'] },
  { key: 'website', label: 'Website', example: 'https://acme.com',
    aliases: ['website', 'url', 'web site', 'company website'] },
  { key: 'phone', label: 'Phone', example: '+91 80 4000 1000',
    aliases: ['phone', 'phone number', 'company phone', 'telephone'] },
  { key: 'street', label: 'Street', example: '',
    aliases: ['street', 'address', 'street address', 'billing street', 'address line 1'] },
  { key: 'city', label: 'City', example: 'Bengaluru',
    aliases: ['city', 'billing city', 'town'] },
  { key: 'state', label: 'State', example: 'Karnataka',
    aliases: ['state', 'province', 'region', 'billing state'] },
  { key: 'zip_code', label: 'Postal Code', example: '560001',
    aliases: ['postal code', 'zip', 'zip code', 'postcode', 'billing zip'] },
  { key: 'country', label: 'Country', example: 'India',
    aliases: ['country', 'billing country'] },
  { key: 'description', label: 'Description', example: '',
    aliases: ['description', 'notes', 'about'] },
];

export interface ColumnMatch {
  header: string;
  field: FieldSpec | null;
}

/**
 * Match each header to a field, first-come-first-served.
 *
 * A field already claimed by an earlier column is not claimed again: a file
 * with both "Company" and "Account Name" would otherwise have its second column
 * silently overwrite the first. The later one is reported as ignored, which is
 * visible, instead of winning invisibly.
 */
export function matchColumns(headers: string[], fields: FieldSpec[]): ColumnMatch[] {
  const byAlias = new Map<string, FieldSpec>();
  for (const f of fields) {
    byAlias.set(norm(f.label), f);
    for (const a of f.aliases) byAlias.set(norm(a), f);
  }
  const claimed = new Set<string>();
  return headers.map(header => {
    const field = byAlias.get(norm(header));
    if (!field || claimed.has(field.key)) return { header, field: null };
    claimed.add(field.key);
    return { header, field };
  });
}

/**
 * Turn parsed CSV rows into API payload rows using the matched columns.
 *
 * Empty strings are dropped rather than sent: an absent key lets the server and
 * the column defaults decide, whereas '' is a value and would overwrite them.
 */
export function mapRows(
  rows: Record<string, string>[],
  matches: ColumnMatch[],
): Record<string, unknown>[] {
  const used = matches.filter(m => m.field !== null) as { header: string; field: FieldSpec }[];
  return rows.map(row => {
    const out: Record<string, unknown> = {};
    for (const { header, field } of used) {
      const raw = (row[header] ?? '').trim();
      if (raw === '') continue;
      // Tags are semicolon-separated so that a tag may itself contain a comma,
      // and so an export from this app round-trips: the contacts export joins
      // tags with '; '.
      out[field.key] = field.list
        ? raw.split(';').map(t => t.trim()).filter(Boolean)
        : raw;
    }
    return out;
  });
}

/**
 * Contacts only: fold a single "Name" column into first/last.
 *
 * Runs after mapRows so it sees the mapped keys. Only applies when the row has
 * no explicit first/last name — an explicit column always wins over a split.
 */
export function applyFullNameFallback(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map(row => {
    const { full_name, ...rest } = row as { full_name?: string } & Record<string, unknown>;
    if (!full_name) return rest;
    if (rest.first_name || rest.last_name) return rest;
    const parts = String(full_name).trim().split(/\s+/);
    return parts.length === 1
      // One word is a first name with no surname. The server will reject the row
      // for a missing last name, which is the correct and visible outcome —
      // inventing a placeholder surname would be fabricating data.
      ? { ...rest, first_name: parts[0] }
      : { ...rest, first_name: parts.slice(0, -1).join(' '), last_name: parts[parts.length - 1] };
  });
}

/** Build the downloadable template: the header row plus one example row. */
export function buildTemplate(fields: FieldSpec[]): string {
  const shown = fields.filter(f => !f.templateOmit);
  return toCsv(shown.map(f => f.label), [shown.map(f => f.example ?? '')]);
}

/**
 * Find rows whose dedupe key repeats one already seen EARLIER IN THE SAME FILE.
 *
 * WHY THIS EXISTS — a real defect found by running a 620-row file through the UI.
 *
 * The server's duplicate check is authoritative and catches both "already in
 * your workspace" and "appears twice in your file", because rows inserted
 * earlier in its transaction are visible to later lookups. That holds WITHIN one
 * request. A file larger than MAX_IMPORT_ROWS is sent as several requests, and
 * during a DRY RUN each one rolls back — so chunk 2 cannot see chunk 1's rows,
 * and a duplicate straddling the boundary goes unreported in the preview. At
 * commit, chunk 1 has committed, so the same duplicate IS caught: the preview
 * said 618 importable and the commit imported 617.
 *
 * Nothing was corrupted by that — the commit was correct and reported the skip —
 * but a preview that disagrees with the commit is exactly what the dry run is
 * supposed to rule out.
 *
 * The fix is to determine within-file duplicates BEFORE chunking, where the
 * whole file is in hand and the answer cannot depend on how it is split. This is
 * not second-guessing the database: it answers a question about the file only
 * the client can see whole, and the server stays the authority on everything
 * else. Rows flagged here are never sent, so the two can no longer disagree.
 *
 * Comparison is trimmed and case-insensitive, matching the server's
 * `lower(email)` / `lower(name)` lookups. A row with no value for the key is
 * never a duplicate — it is a missing required field, which the server reports
 * with a better message than this could.
 */
export function findWithinFileDuplicates(
  rows: Record<string, unknown>[],
  key: string,
): Map<number, { value: string; firstIndex: number }> {
  const seen = new Map<string, number>();
  const dupes = new Map<number, { value: string; firstIndex: number }>();

  rows.forEach((row, index) => {
    const raw = row[key];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) return;
    const norm = value.toLowerCase();
    const firstIndex = seen.get(norm);
    if (firstIndex === undefined) {
      seen.set(norm, index);
    } else {
      dupes.set(index, { value, firstIndex });
    }
  });

  return dupes;
}
