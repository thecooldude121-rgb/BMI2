import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../config/database';
import { setupWorkspace, teardownWorkspace, TestWorkspace } from './helpers';

/**
 * Reports replay step a (2026-10-15): migrations 055-057 from the P3 branch,
 * byte-for-byte. Nothing in the app uses them yet; this pins the schema the
 * later steps build on, against the real database.
 */
const DEF = JSON.stringify({ v: 1, base: 'deals' });
const RLS_TABLES = ['deals', 'companies', 'contacts', 'leads', 'activities', 'pipeline_stages', 'users'];

describe('reports schema (migrations 055-057)', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  beforeAll(async () => {
    ws = await setupWorkspace('rptschema');
    other = await setupWorkspace('rptschema-other');
  });
  afterAll(async () => { await teardownWorkspace(ws); await teardownWorkspace(other); });

  it('055: row-level security is ON for the seven tables but NOT forced, so the app (the owner) is untouched', async () => {
    const { rows } = await pool.query(
      `SELECT c.relname AS tablename, c.relrowsecurity AS rowsecurity, c.relforcerowsecurity AS forcerowsecurity
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = ANY($1)`,
      [RLS_TABLES]);
    expect(rows).toHaveLength(RLS_TABLES.length);
    for (const r of rows) expect([r.tablename, r.rowsecurity, r.forcerowsecurity]).toEqual([r.tablename, true, false]);
    const policies = await pool.query(
      `SELECT tablename FROM pg_policies WHERE policyname = 'reports_ro_tenant_isolation' AND 'bmi_reports_ro' = ANY(roles) AND cmd = 'SELECT'`);
    expect(policies.rows.map(r => r.tablename).sort()).toEqual([...RLS_TABLES].sort());
  });

  it('055: the reports role is unprivileged', async () => {
    const { rows } = await pool.query(
      `SELECT rolsuper, rolcreatedb, rolcreaterole, rolbypassrls FROM pg_roles WHERE rolname = 'bmi_reports_ro'`);
    expect(rows).toEqual([{ rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolbypassrls: false }]);
  });

  it('056/057: a schedule recipient is a USER of the same workspace — another workspace\'s user is unstorable', async () => {
    const report = (await pool.query(
      `INSERT INTO saved_reports (tenant_id, name, definition, owner_id) VALUES ($1, 'Pinned', $3::jsonb, $2) RETURNING id`,
      [ws.tenantId, ws.userId, DEF])).rows[0].id;
    const schedule = (await pool.query(
      `INSERT INTO saved_report_schedules (tenant_id, report_id, created_by, cadence) VALUES ($1, $2, $3, 'daily') RETURNING id`,
      [ws.tenantId, report, ws.userId])).rows[0].id;
    await pool.query(`INSERT INTO saved_report_schedule_recipients (schedule_id, user_id, tenant_id) VALUES ($1, $2, $3)`,
      [schedule, ws.userId, ws.tenantId]);
    await expect(pool.query(
      `INSERT INTO saved_report_schedule_recipients (schedule_id, user_id, tenant_id) VALUES ($1, $2, $3)`,
      [schedule, other.userId, ws.tenantId])).rejects.toMatchObject({ code: '23503' });
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'saved_report_schedule_recipients'`);
    expect(cols.rows.map(r => r.column_name)).not.toContain('email');
  });

  it('057: a weekly schedule without a weekday is refused (the NULL-accepting CHECK was fixed)', async () => {
    const report = (await pool.query(
      `INSERT INTO saved_reports (tenant_id, name, definition) VALUES ($1, 'Weekly', $2::jsonb) RETURNING id`, [ws.tenantId, DEF])).rows[0].id;
    await expect(pool.query(
      `INSERT INTO saved_report_schedules (tenant_id, report_id, cadence) VALUES ($1, $2, 'weekly')`, [ws.tenantId, report]))
      .rejects.toMatchObject({ code: '23514' });
  });

  it('070: deleting a user clears a report\'s owner and a schedule\'s creator, keeping the workspace', async () => {
    const u = (await pool.query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, 'x', 'Gone', 'Soon', 'sales') RETURNING id`, [ws.tenantId, `gone-${Date.now()}@rt.example`])).rows[0].id;
    const report = (await pool.query(
      `INSERT INTO saved_reports (tenant_id, name, definition, owner_id) VALUES ($1, 'Orphan me', $2::jsonb, $3) RETURNING id`,
      [ws.tenantId, DEF, u])).rows[0].id;
    const schedule = (await pool.query(
      `INSERT INTO saved_report_schedules (tenant_id, report_id, created_by, cadence) VALUES ($1, $2, $3, 'daily') RETURNING id`,
      [ws.tenantId, report, u])).rows[0].id;
    await pool.query('DELETE FROM users WHERE id = $1', [u]);
    expect((await pool.query('SELECT owner_id, tenant_id FROM saved_reports WHERE id = $1', [report])).rows[0])
      .toEqual({ owner_id: null, tenant_id: ws.tenantId });
    expect((await pool.query('SELECT created_by, tenant_id FROM saved_report_schedules WHERE id = $1', [schedule])).rows[0])
      .toEqual({ created_by: null, tenant_id: ws.tenantId });
  });
});
