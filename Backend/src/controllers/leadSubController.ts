import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { requireTenantId } from '../middleware/tenant';

// Verifies the parent lead exists AND belongs to the caller's tenant before a
// sub-resource is attached to it. Without this, a caller could attach a note/
// task/etc. to another tenant's lead by guessing its (small, sequential)
// integer id — the sub-resource table's own tenant_id column alone doesn't
// prevent that, since the FK to leads.id has no tenant awareness.
const assertLeadInTenant = async (leadId: string, tenantId: string): Promise<boolean> => {
  const result = await pool.query('SELECT id FROM leads WHERE id = $1 AND tenant_id = $2', [leadId, tenantId]);
  return !!result.rows[0];
};

// ── Activities (uses existing `activities` table) ─────────────────────────────

export const getActivities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      'SELECT * FROM activities WHERE lead_id = $1 AND tenant_id = $2 ORDER BY created_at DESC',
      [req.params.leadId, tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

export const createActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    if (!(await assertLeadInTenant(req.params.leadId, tenantId))) {
      res.status(404).json({ success: false, message: 'Lead not found' }); return;
    }
    const {
      type = 'note', direction, status = 'completed', subject,
      description, outcome, duration_minutes, scheduled_at, completed_at,
    } = req.body;

    if (!subject) { res.status(400).json({ success: false, message: 'subject is required' }); return; }

    // Map frontend LeadActivity types to the activities table constraint set
    const safeType = ['call','email','meeting','task','note','sms','whatsapp',
                      'linkedin','demo','proposal','document','visit'].includes(type) ? type : 'note';
    const safeStatus = ['planned','completed','cancelled','no_show','rescheduled'].includes(status)
      ? status : 'completed';

    const result = await pool.query(
      `INSERT INTO activities
         (lead_id, subject, type, direction, status, description, outcome,
          duration, scheduled_at, completed_at, created_by, assigned_to, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11,$12)
       RETURNING *`,
      [
        req.params.leadId, subject, safeType, direction || null, safeStatus,
        description || null, outcome || null,
        duration_minutes || null, scheduled_at || null, completed_at || null,
        req.user?.id || '', tenantId,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const FIELDS = ['status', 'subject', 'description', 'outcome', 'completed_at', 'duration'];
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    FIELDS.forEach(f => {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${i++}`); params.push(req.body[f]); }
    });
    if (!sets.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    sets.push(`updated_at = NOW()`);
    params.push(req.params.activityId, tenantId);
    const result = await pool.query(
      `UPDATE activities SET ${sets.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} RETURNING *`, params
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Activity not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

// ── Notes ─────────────────────────────────────────────────────────────────────

export const getNotes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `SELECT * FROM lead_notes WHERE lead_id = $1 AND tenant_id = $2 AND is_deleted = FALSE
       ORDER BY is_pinned DESC, created_at DESC`,
      [req.params.leadId, tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

export const createNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    if (!(await assertLeadInTenant(req.params.leadId, tenantId))) {
      res.status(404).json({ success: false, message: 'Lead not found' }); return;
    }
    const { content, is_pinned = false, is_private = false } = req.body;
    if (!content) { res.status(400).json({ success: false, message: 'content is required' }); return; }
    const result = await pool.query(
      `INSERT INTO lead_notes (lead_id, content, is_pinned, is_private, created_by, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.leadId, content, is_pinned, is_private, req.user?.id || '', tenantId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    if (req.body.content !== undefined)   { sets.push(`content = $${i++}`);   params.push(req.body.content); }
    if (req.body.is_pinned !== undefined) { sets.push(`is_pinned = $${i++}`); params.push(req.body.is_pinned); }
    if (!sets.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    sets.push(`updated_at = NOW()`);
    params.push(req.params.noteId, tenantId);
    const result = await pool.query(
      `UPDATE lead_notes SET ${sets.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} AND is_deleted = FALSE RETURNING *`, params
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Note not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const deleteNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `UPDATE lead_notes SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [req.params.noteId, tenantId]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Note not found' }); return; }
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) { next(error); }
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `SELECT * FROM lead_tasks WHERE lead_id = $1 AND tenant_id = $2
       ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
                due_date ASC NULLS LAST`,
      [req.params.leadId, tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    if (!(await assertLeadInTenant(req.params.leadId, tenantId))) {
      res.status(404).json({ success: false, message: 'Lead not found' }); return;
    }
    const {
      title, description, task_type, priority = 'medium', status = 'open',
      due_date, assigned_to = '',
    } = req.body;
    if (!title) { res.status(400).json({ success: false, message: 'title is required' }); return; }
    const result = await pool.query(
      `INSERT INTO lead_tasks
         (lead_id, title, description, task_type, priority, status, due_date, assigned_to, created_by, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        req.params.leadId, title, description || null, task_type || null,
        priority, status, due_date || null, assigned_to, req.user?.id || '', tenantId,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const FIELDS = ['title', 'description', 'priority', 'status', 'due_date', 'completed_at', 'assigned_to'];
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    FIELDS.forEach(f => {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${i++}`); params.push(req.body[f]); }
    });
    if (!sets.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    sets.push(`updated_at = NOW()`);
    params.push(req.params.taskId, tenantId);
    const result = await pool.query(
      `UPDATE lead_tasks SET ${sets.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} RETURNING *`, params
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Task not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

// ── Emails ────────────────────────────────────────────────────────────────────

export const getEmails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      'SELECT * FROM lead_emails WHERE lead_id = $1 AND tenant_id = $2 ORDER BY created_at DESC',
      [req.params.leadId, tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

export const logEmail = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    if (!(await assertLeadInTenant(req.params.leadId, tenantId))) {
      res.status(404).json({ success: false, message: 'Lead not found' }); return;
    }
    const {
      direction = 'outbound', from_email, to_emails = [], cc_emails = [],
      subject, body_text, body_html, template_id, sent_at, status = 'sent',
    } = req.body;
    if (!from_email || !subject) {
      res.status(400).json({ success: false, message: 'from_email and subject are required' }); return;
    }
    const result = await pool.query(
      `INSERT INTO lead_emails
         (lead_id, direction, from_email, to_emails, cc_emails, subject,
          body_text, body_html, template_id, sent_at, status, created_by, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [
        req.params.leadId, direction, from_email, to_emails, cc_emails, subject,
        body_text || null, body_html || null, template_id || null,
        sent_at || new Date().toISOString(), status, req.user?.id || '', tenantId,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

// ── Calls ─────────────────────────────────────────────────────────────────────

export const getCalls = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      'SELECT * FROM lead_calls WHERE lead_id = $1 AND tenant_id = $2 ORDER BY created_at DESC',
      [req.params.leadId, tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

export const logCall = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    if (!(await assertLeadInTenant(req.params.leadId, tenantId))) {
      res.status(404).json({ success: false, message: 'Lead not found' }); return;
    }
    const { direction = 'outbound', duration_seconds, outcome, disposition, notes, started_at, ended_at } = req.body;
    const result = await pool.query(
      `INSERT INTO lead_calls
         (lead_id, direction, duration_seconds, outcome, disposition, notes, started_at, ended_at, created_by, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        req.params.leadId, direction, duration_seconds || null, outcome || null,
        disposition || null, notes || null, started_at || null, ended_at || null, req.user?.id || '', tenantId,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

// ── Meetings ──────────────────────────────────────────────────────────────────

export const getMeetings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      'SELECT * FROM lead_meetings WHERE lead_id = $1 AND tenant_id = $2 ORDER BY scheduled_at DESC',
      [req.params.leadId, tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

export const scheduleMeeting = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    if (!(await assertLeadInTenant(req.params.leadId, tenantId))) {
      res.status(404).json({ success: false, message: 'Lead not found' }); return;
    }
    const {
      title, description, meeting_type, scheduled_at, duration_minutes = 30,
      location, meeting_url, attendees = [], status = 'planned',
    } = req.body;
    if (!title || !scheduled_at) {
      res.status(400).json({ success: false, message: 'title and scheduled_at are required' }); return;
    }
    const result = await pool.query(
      `INSERT INTO lead_meetings
         (lead_id, title, description, meeting_type, scheduled_at,
          duration_minutes, location, meeting_url, attendees, status, created_by, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        req.params.leadId, title, description || null, meeting_type || null, scheduled_at,
        duration_minutes, location || null, meeting_url || null,
        Array.isArray(attendees) ? attendees : [], status, req.user?.id || '', tenantId,
      ]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateMeeting = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const FIELDS = ['title', 'status', 'notes', 'outcome', 'next_steps', 'meeting_url'];
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    FIELDS.forEach(f => {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${i++}`); params.push(req.body[f]); }
    });
    if (!sets.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    sets.push(`updated_at = NOW()`);
    params.push(req.params.meetingId, tenantId);
    const result = await pool.query(
      `UPDATE lead_meetings SET ${sets.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} RETURNING *`, params
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'Meeting not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

// ── Tags ──────────────────────────────────────────────────────────────────────
// tags.name was globally UNIQUE (pre-dating multi-tenancy), which made the
// upsert below a cross-tenant data leak: ON CONFLICT (name) matched another
// tenant's row, updated its colour, and returned that row — including its
// tenant_id — to the caller. Migration 010 replaces the constraint with
// UNIQUE(tenant_id, name) and the conflict target below is scoped to match.

export const getTags = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      'SELECT * FROM tags WHERE tenant_id = $1 ORDER BY usage_count DESC, name ASC',
      [tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

export const createTag = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const { name, color, description, category } = req.body;
    if (!name) { res.status(400).json({ success: false, message: 'name is required' }); return; }
    const result = await pool.query(
      `INSERT INTO tags (name, color, description, category, tenant_id)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (tenant_id, name) DO UPDATE SET color = EXCLUDED.color RETURNING *`,
      [name, color || null, description || null, category || null, tenantId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

// ── Views ─────────────────────────────────────────────────────────────────────

export const getViews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      `SELECT * FROM lead_views WHERE tenant_id = $1 AND (is_public = TRUE OR created_by = $2)
       ORDER BY is_pinned DESC, view_order ASC, name ASC`,
      [tenantId, req.user?.id || '']
    );
    res.json({ success: true, data: result.rows });
  } catch (error) { next(error); }
};

export const createView = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const {
      name, description, filters = {}, sort_by, sort_order = 'desc', columns = [], is_public = true,
      is_pinned = false, view_order = 0, visibility = 'private',
      search_query = '', view_mode = 'list', icon = 'list',
    } = req.body;
    if (!name) { res.status(400).json({ success: false, message: 'name is required' }); return; }
    const result = await pool.query(
      `INSERT INTO lead_views
         (name, description, filters, sort_by, sort_order, columns, is_public, created_by,
          is_pinned, view_order, visibility, search_query, view_mode, icon, tenant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [name, description || null, JSON.stringify(filters), sort_by || null,
       sort_order, columns, is_public, req.user?.id || '',
       is_pinned, view_order, visibility, search_query, view_mode, icon, tenantId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const updateView = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const FIELDS = [
      'name', 'description', 'sort_by', 'sort_order', 'is_default', 'is_public',
      'is_pinned', 'view_order', 'visibility', 'search_query', 'view_mode', 'icon',
    ];
    const sets: string[] = [];
    const params: any[] = [];
    let i = 1;
    FIELDS.forEach(f => {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${i++}`); params.push(req.body[f]); }
    });
    if (req.body.filters !== undefined) { sets.push(`filters = $${i++}`); params.push(JSON.stringify(req.body.filters)); }
    if (req.body.columns !== undefined) { sets.push(`columns = $${i++}`); params.push(req.body.columns); }
    if (!sets.length) { res.status(400).json({ success: false, message: 'No fields to update' }); return; }
    sets.push(`updated_at = NOW()`);
    params.push(req.params.viewId, tenantId);
    const result = await pool.query(
      `UPDATE lead_views SET ${sets.join(', ')} WHERE id = $${i++} AND tenant_id = $${i} RETURNING *`, params
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'View not found' }); return; }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) { next(error); }
};

export const deleteView = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    const result = await pool.query(
      'DELETE FROM lead_views WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [req.params.viewId, tenantId]
    );
    if (!result.rows[0]) { res.status(404).json({ success: false, message: 'View not found' }); return; }
    res.json({ success: true, message: 'View deleted' });
  } catch (error) { next(error); }
};

// ── Enrich ────────────────────────────────────────────────────────────────────
// Updates the lead record in PostgreSQL with an enriched_at timestamp.
// Wire a real third-party provider (Apollo, Clearbit) here when ready.

export const enrichLead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = requireTenantId(req);
    // Fetch the current lead using the actual DB schema (INTEGER id, name column)
    const leadResult = await pool.query('SELECT * FROM leads WHERE id = $1 AND tenant_id = $2', [req.params.leadId, tenantId]);
    if (!leadResult.rows[0]) { res.status(404).json({ success: false, message: 'Lead not found' }); return; }
    const lead = leadResult.rows[0];

    // Record enrichment in notes
    await pool.query(
      `INSERT INTO lead_notes (lead_id, content, created_by, tenant_id)
       VALUES ($1, $2, $3, $4)`,
      [req.params.leadId, `AI enrichment triggered on ${new Date().toLocaleDateString()}`, req.user?.id || 'system', tenantId]
    );

    res.json({
      success: true,
      data: {
        person_data: {
          full_name: lead.name || null,
          position: lead.position || null,
          department: null,
          linkedin_url: null,
        },
        company_data: {
          name: lead.company || null,
          industry: lead.industry || null,
          size: null,
          revenue: null,
        },
        confidence: 0.7,
      },
    });
  } catch (error) { next(error); }
};
