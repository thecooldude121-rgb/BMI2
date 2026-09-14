import { pool } from '../config/database';
import type { ClosedDeal, OpenDeal } from './targetProjection';

/**
 * Loads what projectTarget() needs for one workspace, in ONE query.
 *
 * WHERE A CLOSE TIME COMES FROM, and why it is the only source:
 * deals has no closed_at column, and `updated_at` moves on every edit, so it
 * says nothing about when a deal was won. The one honest record is
 * deal_stage_history: the time the deal moved INTO the stage it is in now.
 * Matching `to_stage` against the deal's CURRENT stage slug means a deal won,
 * reopened and won again is timed by its latest win, and a deal won then
 * reopened is simply open.
 *
 * A deal that is closed by stage but has NO such row — created directly in a
 * won stage (createDeal writes no history), or closed before history was
 * recorded — is returned as UNTIMED. It is counted and reported, and never
 * placed in time by guessing. On live data today that is both closed deals.
 *
 * EXCLUSIONS, matching the rest of the API:
 *   - is_test deals: never, anywhere.
 *   - archived OPEN deals: not pipeline anyone is working.
 *   - archived CLOSED deals: KEPT. Archiving tidies a board; it does not undo
 *     a win or a loss.
 *
 * TENANT SCOPING: every relation is filtered by the caller's tenant, and both
 * joins carry the tenant predicate (the project rule — the global-id FK alone
 * would accept another workspace's stage or history row).
 */
export async function loadProjectionDeals(tenantId: string): Promise<{
  closed: ClosedDeal[];
  untimedClosed: { ownerId: number | null; outcome: 'won' | 'lost' }[];
  open: OpenDeal[];
}> {
  const r = await pool.query(
    `SELECT d.id, d.assigned_to_user_id AS owner_id, d.value, d.currency, d.created_at,
            -- As TEXT, parsed as UTC below. node-postgres turns a DATE into
            -- LOCAL midnight, and this server runs in Asia/Kolkata: a deal due
            -- 1 July would land at 30 June 18:30Z and be counted in Q2.
            d.expected_close_date::text AS expected_close_date,
            d.is_archived,
            ps.slug, ps.name AS stage_name, ps.position, ps.stage_type,
            (SELECT max(h.changed_at)
               FROM deal_stage_history h
              WHERE h.deal_id = d.id
                AND h.tenant_id = d.tenant_id
                AND h.to_stage = ps.slug) AS closed_at
       FROM deals d
       JOIN pipeline_stages ps ON ps.id = d.stage_id AND ps.tenant_id = d.tenant_id
      WHERE d.tenant_id = $1 AND d.is_test = false`,
    [tenantId],
  );

  const closed: ClosedDeal[] = [];
  const untimedClosed: { ownerId: number | null; outcome: 'won' | 'lost' }[] = [];
  const open: OpenDeal[] = [];

  for (const row of r.rows) {
    const ownerId = row.owner_id === null ? null : Number(row.owner_id);
    const value = Number(row.value);
    if (row.stage_type === 'open') {
      if (row.is_archived) continue;
      open.push({
        dealId: row.id, ownerId, value, currency: row.currency,
        stageSlug: row.slug, stageName: row.stage_name, stagePosition: Number(row.position),
        expectedCloseDate: row.expected_close_date ? new Date(`${row.expected_close_date}T00:00:00Z`) : null,
      });
      continue;
    }
    const outcome = row.stage_type === 'won' ? 'won' : 'lost';
    if (row.closed_at === null) { untimedClosed.push({ ownerId, outcome }); continue; }
    closed.push({
      dealId: row.id, ownerId, outcome, value, currency: row.currency,
      closedAt: new Date(row.closed_at),
      createdAt: row.created_at ? new Date(row.created_at) : null,
    });
  }
  return { closed, untimedClosed, open };
}

/**
 * ACTIVITY TARGET MEASUREMENT — why it is not computed, and the evidence for
 * saying so.
 *
 * `quotas.activity_targets` stores real per-week targets for calls, meetings
 * and emails (migration 044), and the Settings screen writes them. NOTHING can
 * currently measure them, and the reason is structural rather than a missing
 * query:
 *
 *   THE DEPLOYED `activities` TABLE HAS NO USER REFERENCE. Its actor columns
 *   are `created_by` and `assigned_to`, both `character varying` holding
 *   free-text names, and there is no `user_id` or `assigned_to_user_id`. (The
 *   spec in CLAUDE.md shows `user_id UUID REFERENCES users(id)` and an
 *   `occurred_at`; neither was deployed — the same class of drift as
 *   `close_date` / `expected_close_date`.)
 *
 * Attributing an activity to a rep would therefore mean matching on a DISPLAY
 * NAME. That is precisely the defect migrations 039-043 exist to remove — two
 * people sharing a name share the number, and a renamed person silently loses
 * their history — and it was rejected for `deals.company_name` for the same
 * reason. So attainment is reported as NOT MEASURABLE, with the targets still
 * shown, rather than computed from a key that is not a key.
 *
 * The count IS real and is returned as evidence: on live data it is 0, which
 * distinguishes "nobody logs activity here" from "this rep did nothing" — a
 * distinction the panel would otherwise get wrong in the accusatory direction.
 *
 * THE FIX, when it is wanted, is a migration giving `activities` an
 * `assigned_to_user_id` FK the way 039 gave one to `deals`, plus a writer on
 * the create path. It is deliberately NOT done here: it is a schema decision,
 * and with 0 rows recorded there would still be nothing to measure.
 */
export const ACTIVITY_MEASUREMENT_REASON =
  'Activity targets cannot be measured yet: the activities table records who acted only as a free-text name '
  + '(created_by / assigned_to) and has no user reference, so attainment cannot be attributed to a person '
  + 'without matching on a display name. Targets are shown; attainment is not calculated.';

/** How many activities the workspace recorded in a window. Real, and the evidence for the note above. */
export async function countActivitiesInPeriod(
  tenantId: string, start: Date, end: Date,
): Promise<number> {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS n
       FROM activities
      WHERE tenant_id = $1
        AND COALESCE(completed_at, scheduled_at, created_at) >= $2
        AND COALESCE(completed_at, scheduled_at, created_at) <  $3`,
    [tenantId, start, end],
  );
  return Number(r.rows[0]?.n ?? 0);
}
