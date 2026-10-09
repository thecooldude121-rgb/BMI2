import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { pool } from '../config/database';
import { setupWorkspace, teardownWorkspace, TestWorkspace } from './helpers';

/**
 * Migration 064: contacts.company_id is a COMPOSITE reference
 * (company_id, tenant_id) -> companies(id, tenant_id), as 060 made deals.
 * The DATABASE refuses a cross-workspace link — not only the controller.
 */
describe('contacts.company_id is workspace-consistent in the database (064)', () => {
  let ws: TestWorkspace;
  let other: TestWorkspace;
  let mine: string;
  let theirs: string;

  beforeAll(async () => {
    ws = await setupWorkspace('ccscope');
    other = await setupWorkspace('ccscope-other');
    mine = (await pool.query(`INSERT INTO companies (name, tenant_id) VALUES ('Mine', $1) RETURNING id`, [ws.tenantId])).rows[0].id;
    theirs = (await pool.query(`INSERT INTO companies (name, tenant_id) VALUES ('Theirs', $1) RETURNING id`, [other.tenantId])).rows[0].id;
  });
  afterAll(async () => {
    for (const w of [ws, other]) { await pool.query('DELETE FROM contacts WHERE tenant_id = $1', [w.tenantId]); await teardownWorkspace(w); }
  });

  it('refuses a contact pointing at ANOTHER workspace\'s account (23503), even written directly', async () => {
    await expect(pool.query(
      `INSERT INTO contacts (first_name, last_name, email, company_id, tenant_id) VALUES ('X', 'Cross', 'x@cc.example', $1, $2)`,
      [theirs, ws.tenantId])).rejects.toMatchObject({ code: '23503' });
    const c = (await pool.query(`INSERT INTO contacts (first_name, last_name, email, tenant_id) VALUES ('Y', 'Ok', 'y@cc.example', $1) RETURNING id`, [ws.tenantId])).rows[0].id;
    await expect(pool.query('UPDATE contacts SET company_id = $1 WHERE id = $2', [theirs, c])).rejects.toMatchObject({ code: '23503' });
  });

  it('accepts its own account; deleting that account clears ONLY company_id', async () => {
    const c = (await pool.query(`INSERT INTO contacts (first_name, last_name, email, company_id, tenant_id) VALUES ('Z', 'Own', 'z@cc.example', $1, $2) RETURNING id`, [mine, ws.tenantId])).rows[0].id;
    await pool.query('DELETE FROM companies WHERE id = $1', [mine]);
    const row = (await pool.query('SELECT company_id, tenant_id FROM contacts WHERE id = $1', [c])).rows[0];
    expect(row.company_id).toBeNull();
    expect(row.tenant_id).toBe(ws.tenantId);
  });
});
