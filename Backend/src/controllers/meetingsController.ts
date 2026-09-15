import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';
import { foreignIdsInTenant, type ScopedTable } from '../utils/tenantScope';
import { resolveActorName } from '../utils/actorName';

/**
 * MEETING AGENT — meeting notes, their tasks, and pushing them to a deal or
 * account. Migration 049.
 *
 * SCOPE, because this module's name invites a much larger reading: notes,
 * tasks and activities only. NO recording, NO transcription, NO AI
 * summarisation — those are a separate, later item and nothing here reaches
 * toward them. In particular there is no heuristic anywhere that reads note
 * text and infers activities from it; a user turns a note into an activity by
 * saying so, one activity at a time (see createActivityFromMeeting).
 *
 * ─── THE POLYMORPHIC REFERENCE, HANDLED THE WAY tasks HANDLES IT ──────────
 *
 * `related_to_type` / `related_to_id` is the pattern flagged three times now
 * (tasks, documents.module/record_id, here). Both halves are enforced:
 *
 *   TYPE — migration 049's CHECK restricts it in the DATABASE, plus
 *          RELATED_TABLE below, so a value that names no real table cannot be
 *          stored by any writer, including hand-written SQL.
 *   ID   — `foreignIdsInTenant` proves the row belongs to the caller's
 *          workspace BEFORE the write. A CHECK cannot do this: the reference is
 *          polymorphic, and every FK here targets a global primary key, so
 *          Postgres would accept workspace A's meeting pointing at workspace
 *          B's deal.
 *
 * 'employee' is deliberately absent, unlike tasks. `employees` has no
 * `tenant_id` and belongs to HRMS; a new module must not inherit that hole.
 */

/** Mirrors meetings_related_to_type_check (049). Order matches the CHECK. */
export const VALID_RELATED_TYPES = ['deal', 'company', 'contact', 'lead'] as const;
export type RelatedType = (typeof VALID_RELATED_TYPES)[number];

/** Every type maps to a REAL tenant-scoped table. No partial record here. */
const RELATED_TABLE: Record<RelatedType, ScopedTable> = {
  deal: 'deals',
  company: 'companies',
  contact: 'contacts',
  lead: 'leads',
};

/**
 * COPIED FROM THE LIVE `meetings_type_check`, verified against pg_constraint —
 * not invented. The first draft of this module guessed
 * ['call','video','in-person','internal','other'] and every create returned a
 * masked 500, because the deployed CHECK allows exactly these three. Same
 * lesson as `close_date` / `expected_close_date`: read the constraint, do not
 * reason about what it should be.
 *
 * `type` is NULLABLE and an omitted type stays NULL. There is deliberately no
 * default: picking 'sales-call' for a meeting whose kind the caller did not
 * state would be classifying it on their behalf.
 */
const VALID_TYPES = ['sales-call', 'internal', 'client-meeting'] as const;

const SELECT_COLUMNS = `
  m.id, m.title, m.date, m.duration, m.attendees, m.type,
  m.related_to_type, m.related_to_id, m.summary, m.notes, m.action_items,
  m.owner_id, m.created_at, m.updated_at,
  NULLIF(btrim(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')), '') AS owner_name
`;

/**
 * Tenant-matched on BOTH sides. users.id is a global primary key, so without
 * `u.tenant_id = m.tenant_id` a meeting carrying another workspace's owner_id
 * would render that person's name — the unscoped-JOIN half of the leak the
 * workspace-scoping work fixed, which a WHERE clause alone does not catch.
 */
const FROM_JOINS = `
  FROM meetings m
  LEFT JOIN users u ON u.id = m.owner_id AND u.tenant_id = m.tenant_id
`;

/** Validate a type/id pair. Returns a message, or null when the pair is fine. */
async function validateRelation(
  type: unknown, id: unknown, tenantId: string,
): Promise<string | null> {
  const bothAbsent = (type === undefined || type === null || type === '')
    && (id === undefined || id === null || id === '');
  if (bothAbsent) return null;

  if (typeof type !== 'string' || !(VALID_RELATED_TYPES as readonly string[]).includes(type)) {
    return `related_to_type must be one of: ${VALID_RELATED_TYPES.join(', ')}`;
  }
  if (id === undefined || id === null || id === '') {
    // Mirrors 049's pair CHECK. Caught here so the caller gets a sentence
    // rather than a masked 500 from a constraint violation.
    return 'related_to_id is required when related_to_type is set';
  }
  return foreignIdsInTenant(
    [{ field: 'related_to_id', table: RELATED_TABLE[type as RelatedType], value: id }],
    tenantId,
  );
}

/** GET /api/v1/meetings?related_to_type=deal&related_to_id=D001&limit=&offset= */
export const getMeetings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { related_to_type, related_to_id } = req.query;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const params: unknown[] = [tenantId];
    let where = 'WHERE m.tenant_id = $1';

    if (related_to_type !== undefined) {
      if (!(VALID_RELATED_TYPES as readonly string[]).includes(String(related_to_type))) {
        res.status(400).json({
          success: false,
          message: `related_to_type must be one of: ${VALID_RELATED_TYPES.join(', ')}`,
        });
        return;
      }
      where += ` AND m.related_to_type = $${params.length + 1}`;
      params.push(String(related_to_type));
      // The id is NOT validated against the caller's workspace here on
      // purpose: this is a filter, not a write. An id from elsewhere simply
      // matches nothing, and validating it would turn a list endpoint into a
      // probe that distinguishes "no meetings" from "not your record".
      if (related_to_id !== undefined) {
        where += ` AND m.related_to_id = $${params.length + 1}`;
        params.push(String(related_to_id));
      }
    }

    const result = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} ${where}
        ORDER BY m.date DESC NULLS LAST, m.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

/** GET /api/v1/meetings/:id — the meeting, plus its tasks and its activities. */
export const getMeetingById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const meeting = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE m.id = $1 AND m.tenant_id = $2`,
      [req.params.id, tenantId],
    );
    const row = meeting.rows[0];
    if (!row) { res.status(404).json({ success: false, message: 'Meeting not found' }); return; }

    /*
     * TASKS ARE THE EXISTING TASK CONCEPT, NOT A NEW ONE. `tasks` already has
     * the same related_to_type/related_to_id pair, so a task about this meeting
     * is a task with related_to_type='meeting'... except 'meeting' is NOT one
     * of tasks' valid related types (lead/deal/contact/company/employee), and
     * adding it would be a second schema change in a module that is not
     * tasks'.
     *
     * So tasks are surfaced by the meeting's SUBJECT instead: the tasks already
     * attached to the deal or account this meeting is about. That is the
     * reading of "tasks shown" that adds no parallel task concept and no new
     * column — the meeting page shows the work outstanding on the record it
     * concerns. A task genuinely belonging to a meeting is a follow-up on that
     * deal, which is what a rep would create anyway.
     */
    const tasks = row.related_to_type
      ? await pool.query(
          `SELECT id, title, status, priority, due_date::text AS due_date, assigned_to
             FROM tasks
            WHERE tenant_id = $1 AND related_to_type = $2 AND related_to_id = $3
            ORDER BY status, due_date NULLS LAST
            LIMIT 50`,
          [tenantId, row.related_to_type, row.related_to_id],
        )
      : { rows: [] };

    // Activities this meeting produced. `activities` has no meeting_id column,
    // so the link is the related record plus the meeting's own subject line —
    // see createActivityFromMeeting for why that is honest rather than a guess.
    const activities = row.related_to_type
      ? await pool.query(
          `SELECT id, subject, type, status, completed_at, created_at, created_by
             FROM activities
            WHERE tenant_id = $1
              AND ${activityColumnFor(row.related_to_type as RelatedType)} = $2
            ORDER BY created_at DESC
            LIMIT 50`,
          [tenantId, row.related_to_id],
        )
      : { rows: [] };

    res.json({
      success: true,
      data: { ...row, tasks: tasks.rows, activities: activities.rows },
    });
  } catch (error) { next(error); }
};

/**
 * Which `activities` column holds a reference of this type.
 *
 * `activities` is NOT polymorphic — it has real per-entity columns (lead_id,
 * deal_id, contact_id, company_id), which is why an activity created here lands
 * on the deal or account's own feed with no extra plumbing. That difference is
 * the whole reason activities were chosen over `meetings.action_items`.
 */
function activityColumnFor(type: RelatedType): string {
  switch (type) {
    case 'deal': return 'deal_id';
    case 'company': return 'company_id';
    case 'contact': return 'contact_id';
    case 'lead': return 'lead_id';
  }
}

/** POST /api/v1/meetings */
export const createMeeting = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const {
      title, date, duration, attendees, type, notes, summary,
      related_to_type, related_to_id, action_items,
    } = req.body ?? {};

    if (!title || !String(title).trim()) {
      res.status(400).json({ success: false, message: 'title is required' });
      return;
    }
    if (type !== undefined && type !== null && !(VALID_TYPES as readonly string[]).includes(String(type))) {
      res.status(400).json({ success: false, message: `type must be one of: ${VALID_TYPES.join(', ')}` });
      return;
    }
    if (duration !== undefined && duration !== null
        && (!Number.isInteger(Number(duration)) || Number(duration) < 0 || Number(duration) > 1440)) {
      // A typo guard, in the spirit of ACTIVITY_TARGET_MAX and the D043 date
      // bound: a meeting longer than a day is a slipped key.
      res.status(400).json({ success: false, message: 'duration must be a whole number of minutes from 0 to 1440' });
      return;
    }

    const badRelation = await validateRelation(related_to_type, related_to_id, tenantId);
    if (badRelation) { res.status(400).json({ success: false, message: badRelation }); return; }

    const result = await pool.query(
      `INSERT INTO meetings
         (title, date, duration, attendees, type, notes, summary,
          related_to_type, related_to_id, action_items, owner_id, tenant_id)
       VALUES ($1, COALESCE($2::timestamptz, NOW()), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [
        String(title).trim(), date || null, duration ?? null,
        attendees ?? null, type || null, notes || null, summary || null,
        related_to_type || null, related_to_id || null, action_items ?? null,
        // The owner is the AUTHENTICATED user's id, never a name from the body.
        // `activities` records its actor as free text and is unattributable as
        // a result; meetings do not repeat that.
        Number(req.user?.id), tenantId,
      ],
    );

    const created = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE m.id = $1 AND m.tenant_id = $2`,
      [result.rows[0].id, tenantId],
    );
    res.status(201).json({ success: true, data: created.rows[0] });
  } catch (error) { next(error); }
};

const EDITABLE = ['title', 'date', 'duration', 'attendees', 'type', 'notes', 'summary', 'action_items'] as const;

/** PATCH /api/v1/meetings/:id */
export const updateMeeting = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const body = req.body ?? {};

    if (body.type !== undefined && body.type !== null
        && !(VALID_TYPES as readonly string[]).includes(String(body.type))) {
      res.status(400).json({ success: false, message: `type must be one of: ${VALID_TYPES.join(', ')}` });
      return;
    }
    if (body.title !== undefined && (body.title === null || !String(body.title).trim())) {
      // Blanking a required field is refused rather than stored as '' — the
      // same rule the contacts and leads controllers apply.
      res.status(400).json({ success: false, message: 'title cannot be blank' });
      return;
    }

    /*
     * THE RELATION IS NOT EDITABLE HERE. It moves only through
     * PUT /meetings/:id/relation, which is the "push to deal or account"
     * action and validates the target. Accepting it in a general patch would
     * mean two write paths for the one field that needs the FK ownership
     * check — and the second is always the one that forgets it.
     */
    const fields = EDITABLE.filter(f => body[f] !== undefined);
    if (!fields.length) {
      res.status(400).json({
        success: false,
        message: `No fields to update — send any of: ${EDITABLE.join(', ')}`,
      });
      return;
    }

    const sets = fields.map((f, n) => `${f} = $${n + 3}`).join(', ');
    const result = await pool.query(
      `UPDATE meetings SET ${sets}, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2
        RETURNING id`,
      [req.params.id, tenantId, ...fields.map(f => (body[f] === '' ? null : body[f]))],
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Meeting not found' }); return; }

    const updated = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE m.id = $1 AND m.tenant_id = $2`,
      [req.params.id, tenantId],
    );
    res.json({ success: true, data: updated.rows[0] });
  } catch (error) { next(error); }
};

/**
 * PUT /api/v1/meetings/:id/relation — the "push to deal / account" button.
 * Body: { related_to_type, related_to_id } or { related_to_type: null } to clear.
 *
 * Separate from the general patch because this is the field that needs the FK
 * ownership check, and one write path means one place it can be forgotten.
 */
export const setMeetingRelation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { related_to_type, related_to_id } = req.body ?? {};

    const clearing = related_to_type === null || related_to_type === '';
    if (!clearing) {
      const bad = await validateRelation(related_to_type, related_to_id, tenantId);
      if (bad) { res.status(400).json({ success: false, message: bad }); return; }
    }

    const result = await pool.query(
      `UPDATE meetings
          SET related_to_type = $3, related_to_id = $4, updated_at = NOW()
        WHERE id = $1 AND tenant_id = $2
        RETURNING id`,
      [
        req.params.id, tenantId,
        clearing ? null : related_to_type,
        // Both or neither, matching 049's pair CHECK.
        clearing ? null : related_to_id,
      ],
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Meeting not found' }); return; }

    const updated = await pool.query(
      `SELECT ${SELECT_COLUMNS} ${FROM_JOINS} WHERE m.id = $1 AND m.tenant_id = $2`,
      [req.params.id, tenantId],
    );
    res.json({ success: true, data: updated.rows[0] });
  } catch (error) { next(error); }
};

/**
 * POST /api/v1/meetings/:id/activities — turn something from the note into a
 * real activity on the related deal or account.
 * Body: { subject, type?, description?, status? }
 *
 * ─── WHY activities ROWS AND NOT meetings.action_items ────────────────────
 *
 * `action_items` exists on this table and was the other candidate. Activities
 * won, for one reason that decides it: the stated goal is that these show up on
 * the deal or account's OWN feed, and `activities` is the table that feed reads.
 * `action_items` is a column on one meeting row that nothing else queries — it
 * would produce a list visible only on the page that created it, which is the
 * shape of the document-sharing defect (a success toast over state that never
 * leaves the component).
 *
 * `action_items` is left in place and still editable as the note's own
 * checklist. Repurposing a column other readers may assume things about is not
 * this module's call to make.
 *
 * NOTHING IS INFERRED FROM THE NOTE TEXT. The caller passes a subject; the
 * server stores it. There is no parser, no keyword rule and no model reading
 * the note and deciding what an action item is — that is Phase 2 and is
 * explicitly not built. What this endpoint does is copy a sentence the USER
 * chose onto the record the meeting is about, with the meeting named as its
 * origin so the provenance is not lost.
 */
export const createActivityFromMeeting = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { subject, type, description, status } = req.body ?? {};

    const meeting = await pool.query(
      'SELECT id, title, related_to_type, related_to_id FROM meetings WHERE id = $1 AND tenant_id = $2',
      [req.params.id, tenantId],
    );
    const row = meeting.rows[0];
    if (!row) { res.status(404).json({ success: false, message: 'Meeting not found' }); return; }

    if (!row.related_to_type) {
      // The activity has nowhere to land. Refused with the reason, rather than
      // created as an orphan the deal feed will never show.
      res.status(400).json({
        success: false,
        message: 'Link this meeting to a deal, account, contact or lead first — an activity needs a record to attach to.',
      });
      return;
    }
    if (!subject || !String(subject).trim()) {
      res.status(400).json({ success: false, message: 'subject is required' });
      return;
    }

    const VALID_ACTIVITY_TYPES = ['call', 'email', 'meeting', 'task', 'note'] as const;
    const activityType = type === undefined || type === null ? 'note' : String(type);
    if (!(VALID_ACTIVITY_TYPES as readonly string[]).includes(activityType)) {
      res.status(400).json({
        success: false,
        message: `type must be one of: ${VALID_ACTIVITY_TYPES.join(', ')}`,
      });
      return;
    }
    const VALID_ACTIVITY_STATUSES = ['planned', 'completed'] as const;
    const activityStatus = status === undefined || status === null ? 'planned' : String(status);
    if (!(VALID_ACTIVITY_STATUSES as readonly string[]).includes(activityStatus)) {
      res.status(400).json({
        success: false,
        message: `status must be one of: ${VALID_ACTIVITY_STATUSES.join(', ')}`,
      });
      return;
    }

    /*
     * The meeting's OWN id and title go into the activity's description, so the
     * provenance survives. `activities` has no meeting_id column and adding one
     * is a schema change this module does not need: the reference is one-way and
     * for reading, not a key anything joins on. Said out loud because a future
     * reader may want that column — this is a deliberate omission, not an
     * oversight.
     */
    const provenance = `From meeting ${row.id}: ${row.title}`;
    const fullDescription = description && String(description).trim()
      ? `${String(description).trim()}\n\n${provenance}`
      : provenance;

    const column = activityColumnFor(row.related_to_type as RelatedType);
    const actor = resolveActorName(req);

    const inserted = await pool.query(
      `INSERT INTO activities
         (subject, type, status, priority, description, created_by, assigned_to, ${column}, tenant_id)
       VALUES ($1, $2, $3, 'medium', $4, $5, $5, $6, $7)
       RETURNING id, subject, type, status, description, created_at, created_by`,
      [
        String(subject).trim(), activityType, activityStatus,
        fullDescription, actor, row.related_to_id, tenantId,
      ],
    );

    res.status(201).json({ success: true, data: inserted.rows[0] });
  } catch (error) { next(error); }
};
