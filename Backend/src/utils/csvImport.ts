import { PoolClient } from 'pg';

/**
 * Shared machinery for CSV import endpoints.
 *
 * THE CONTRACT THIS ENFORCES: every row gets its own verdict.
 *
 * The Leads import wizard is the cautionary example. Its commit loop ends
 * `} catch { failed++; }` — it counts failures and discards every reason, so a
 * user who imports 400 contacts and gets 12 failures learns only the number 12.
 * CLAUDE.md rules that out explicitly for this feature: a row with a bad email,
 * a missing field or a duplicate "must be reported individually with a reason —
 * not silently dropped, and not one generic 'import failed' message".
 *
 * PER-ROW SAVEPOINT, NOT ONE TRANSACTION FOR THE FILE.
 * Partial commit is what a per-row report implies: 397 good rows must not be
 * held hostage by 3 bad ones. But a failed statement poisons a Postgres
 * transaction — every subsequent query returns 25P02 until it is rolled back —
 * so each row runs inside its own SAVEPOINT. A row that throws rolls back to
 * its savepoint and the next row proceeds on a clean transaction.
 *
 * WHY A TRANSACTION AT ALL, THEN? Two reasons, both load-bearing:
 *   1. dry_run. The preview runs the real inserts and ROLLBACKs instead of
 *      COMMITting, so what it reports is what would actually happen — not a
 *      parallel guess that can disagree with the committing path.
 *   2. Duplicate detection sees the batch. Rows inserted earlier in the
 *      transaction are visible to later rows' lookups, so "this email is
 *      already in your workspace" and "this email appeared twice in your file"
 *      are caught by ONE mechanism instead of two that can disagree.
 */

/** Rows per request. Matches the existing bulk-action cap in contactsController. */
export const MAX_IMPORT_ROWS = 500;

export type RowStatus = 'created' | 'skipped' | 'failed';

export interface RowResult {
  /** The client's row index, so a result maps back to a line in the user's file. */
  index: number;
  status: RowStatus;
  /** Only set on a committed create. A dry run assigns ids it will not keep. */
  id?: string;
  /** Why this row was skipped or failed. Required for anything but 'created'. */
  reason?: string;
  /** Non-fatal notes — the row imported, but not entirely as written. */
  warnings?: string[];
}

export interface ImportSummary {
  dry_run: boolean;
  total: number;
  created: number;
  skipped: number;
  failed: number;
  rows: RowResult[];
}

/**
 * A row handler returns what happened. Throwing is also allowed and is treated
 * as a failure — the throw is caught, the savepoint rolled back, and the
 * message used as the reason, so a driver error becomes one row's problem
 * rather than the request's.
 */
export type RowHandler<T> = (
  row: T,
  index: number,
  client: PoolClient,
) => Promise<Omit<RowResult, 'index'>>;

/** Outcome shorthands for handlers. */
export const created = (id: string, warnings?: string[]): Omit<RowResult, 'index'> =>
  ({ status: 'created', id, ...(warnings?.length ? { warnings } : {}) });
export const skipped = (reason: string): Omit<RowResult, 'index'> =>
  ({ status: 'skipped', reason });
export const failed = (reason: string): Omit<RowResult, 'index'> =>
  ({ status: 'failed', reason });

/**
 * Turn a driver error into a sentence a user can act on.
 *
 * Raw Postgres text must never reach the report. "duplicate key value violates
 * unique constraint contacts_tenant_email_key" discloses the schema and is not
 * something anyone can act on — the same objection recorded in HANDOFF against
 * POST /leads returning it verbatim.
 */
function rowErrorMessage(error: unknown): string {
  const e = error as { code?: string; column?: string; constraint?: string; message?: string };
  switch (e.code) {
    case '23505': // unique_violation
      // Reachable despite the pre-insert duplicate check: another request can
      // commit the same email between our SELECT and our INSERT.
      return 'A record with this identifier already exists in your workspace';
    case '23503': // foreign_key_violation
      return 'This row references a record that does not exist in your workspace';
    case '23502': // not_null_violation
      return `A required value is missing${e.column ? ` (${e.column})` : ''}`;
    case '23514': // check_violation
      return `A value is not one this field allows${e.constraint ? ` (${e.constraint})` : ''}`;
    case '22001': // string_data_right_truncation
      return 'A value in this row is too long for its field';
    case '40P01': // deadlock_detected
      // Reachable since companiesController began taking a per-name advisory
      // lock to close the concurrent-duplicate race: two imports whose files
      // share names in OPPOSITE order can each hold what the other wants, and
      // Postgres breaks the tie by aborting one. The savepoint contains it, so
      // the rest of the import still commits and no row is duplicated or lost
      // — but the caller needs to be told it was contention rather than their
      // data, and that retrying will work.
      return 'This row clashed with another import running at the same time — retry it';
    case '40001': // serialization_failure, same story from the caller's side
      return 'This row clashed with another import running at the same time — retry it';
    default:
      return 'This row could not be saved';
  }
}

/**
 * Run `rows` through `handler`, one savepoint each, and commit — or roll back
 * when `dryRun`.
 *
 * The caller owns the client and is responsible for releasing it.
 */
export async function runImport<T>(
  client: PoolClient,
  rows: T[],
  dryRun: boolean,
  handler: RowHandler<T>,
): Promise<ImportSummary> {
  const results: RowResult[] = [];

  await client.query('BEGIN');
  try {
    for (let index = 0; index < rows.length; index++) {
      // Savepoint names are identifiers, not parameters, so they cannot be
      // bound — `index` is a loop counter we generated, never user input.
      const sp = `import_row_${index}`;
      await client.query(`SAVEPOINT ${sp}`);
      try {
        const outcome = await handler(rows[index], index, client);
        if (outcome.status === 'created') {
          await client.query(`RELEASE SAVEPOINT ${sp}`);
        } else {
          // A skip may have written nothing, but rolling back is correct either
          // way and costs nothing on an untouched savepoint.
          await client.query(`ROLLBACK TO SAVEPOINT ${sp}`);
        }
        results.push({ index, ...outcome });
      } catch (error) {
        await client.query(`ROLLBACK TO SAVEPOINT ${sp}`);
        // Log the real error server-side; send the user the safe sentence.
        console.error(`[import] row ${index} failed:`, error);
        results.push({ index, status: 'failed', reason: rowErrorMessage(error) });
      }
    }

    // A dry run must leave the database exactly as it found it.
    await client.query(dryRun ? 'ROLLBACK' : 'COMMIT');
  } catch (error) {
    // Only reachable if BEGIN/COMMIT itself failed — the per-row handler above
    // cannot escape. Roll back so the client is not returned in a broken state.
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }

  return {
    dry_run: dryRun,
    total: rows.length,
    created: results.filter(r => r.status === 'created').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    failed: results.filter(r => r.status === 'failed').length,
    // A dry run assigns ids from MAX(id)+1 inside a transaction it then throws
    // away. Reporting them would show the user ids their records will not have.
    rows: dryRun ? results.map(({ id: _id, ...rest }) => rest) : results,
  };
}

// ── Field validation shared by both importers ────────────────────────────────

/**
 * Email shape check. Deliberately permissive: the job is to catch "not an email
 * at all" (`bob`, `bob@`, `a b@c.com`), not to adjudicate RFC 5322 — a regex
 * strict enough to reject exotic-but-legal addresses would reject real
 * customers' data, which is a worse failure for a migration tool than letting
 * an odd address through to the database.
 */
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;.]+(\.[^\s@,;.]+)+$/;

export function invalidEmail(email: string): boolean {
  return !EMAIL_RE.test(email);
}

/**
 * Report a value too long for its column BEFORE the insert.
 *
 * Without this, an over-long name is a Postgres 22001 which the error handler
 * turns into a 500 — the row's real problem ("Last name is longer than 50
 * characters") replaced by "this row could not be saved". The limits mirror the
 * varchar widths; they are duplicated here only to produce a better message.
 */
export function tooLong(
  value: string | null | undefined,
  max: number,
  label: string,
): string | null {
  if (value != null && value.length > max) {
    return `${label} is ${value.length} characters; the maximum is ${max}`;
  }
  return null;
}

/** First non-null message from a list of checks, or null when all pass. */
export function firstProblem(...checks: (string | null)[]): string | null {
  return checks.find(c => c !== null) ?? null;
}
