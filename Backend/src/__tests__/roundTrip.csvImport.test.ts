import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';

describe('CSV import — round trip', () => {
  let ws: TestWorkspace;

  beforeAll(async () => { ws = await setupWorkspace('csv'); });
  afterAll(async () => {
    await pool.query('DELETE FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
    await pool.query('DELETE FROM companies WHERE tenant_id = $1', [ws.tenantId]);
    await teardownWorkspace(ws);
  });

  describe('Contacts import', () => {
    it('dry_run writes nothing to Postgres, even for entirely valid rows', async () => {
      const before = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
      const res = await request(app).post('/api/v1/contacts/import').set(auth(ws)).send({
        dry_run: true,
        rows: [{ first_name: 'Dry', last_name: 'Run', email: `dryrun.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com` }],
      });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data.created).toBe(1); // reports what WOULD happen
      const after = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
      expect(after.rows[0].n).toBe(before.rows[0].n); // but nothing actually committed
    });

    it('a mixed batch: valid rows commit, an invalid row is rejected with the correct per-row reason, a within-file duplicate is caught', async () => {
      const stamp = Date.now();
      const validEmail1 = `valid1.${stamp}@example.com`;
      const validEmail2 = `valid2.${stamp}@example.com`;
      const dupeEmail = `dupe.${stamp}@example.com`;

      const rows = [
        { first_name: 'Valid', last_name: 'One', email: validEmail1 },
        { first_name: 'Bad', last_name: 'Email', email: 'not-an-email' },
        { first_name: 'Valid', last_name: 'Two', email: validEmail2 },
        { first_name: 'Dupe', last_name: 'First', email: dupeEmail },
        { first_name: 'Dupe', last_name: 'Second', email: dupeEmail }, // same email, same file
      ];

      const res = await request(app).post('/api/v1/contacts/import').set(auth(ws)).send({ rows });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      const summary = res.body.data;
      expect(summary.total).toBe(5);
      expect(summary.created).toBe(3); // two valid + first of the duplicate pair
      expect(summary.failed).toBe(1);
      expect(summary.skipped).toBe(1);

      const badRow = summary.rows.find((r: { index: number }) => r.index === 1);
      expect(badRow.status).toBe('failed');
      expect(badRow.reason).toMatch(/not a valid email/);

      const dupeRow = summary.rows.find((r: { index: number }) => r.index === 4);
      expect(dupeRow.status).toBe('skipped');
      expect(dupeRow.reason).toMatch(/already exists/);

      // Re-read Postgres directly — the real test.
      const created = await pool.query(
        'SELECT email FROM contacts WHERE tenant_id = $1 AND email = ANY($2::varchar[])',
        [ws.tenantId, [validEmail1, validEmail2, dupeEmail]],
      );
      expect(created.rows.map(r => r.email).sort()).toEqual([dupeEmail, validEmail1, validEmail2].sort());
      const badEmailRow = await pool.query(`SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1 AND first_name = 'Bad'`, [ws.tenantId]);
      expect(badEmailRow.rows[0].n).toBe(0);
      // Only ONE row for the duplicate email, not two.
      const dupeCount = await pool.query('SELECT COUNT(*)::int AS n FROM contacts WHERE tenant_id = $1 AND email = $2', [ws.tenantId, dupeEmail]);
      expect(dupeCount.rows[0].n).toBe(1);
      // And it must be the FIRST of the pair that won, not the second.
      const dupeWinner = await pool.query('SELECT first_name FROM contacts WHERE tenant_id = $1 AND email = $2', [ws.tenantId, dupeEmail]);
      expect(dupeWinner.rows[0].first_name).toBe('Dupe');
    });

    /**
     * CROSS-CHUNK DUPLICATE — the exact bug HANDOFF.md records as found and
     * fixed: a duplicate straddling a chunk boundary. The backend's own
     * duplicate check only sees rows already committed, so it is chunk-order
     * dependent BY DESIGN once a file is split across requests. This test
     * drives two REAL, separate POSTs (simulating two chunks of one large
     * import) and confirms the second one catches the duplicate against the
     * first chunk's already-committed row.
     */
    it('a duplicate email split across two import requests (chunks) is caught by the second', async () => {
      const email = `crosschunk.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`;

      const chunk1 = await request(app).post('/api/v1/contacts/import').set(auth(ws)).send({
        rows: [{ first_name: 'Chunk', last_name: 'One', email }],
      });
      expect(chunk1.status).toBe(200);
      expect(chunk1.body.data.created).toBe(1);

      const chunk2 = await request(app).post('/api/v1/contacts/import').set(auth(ws)).send({
        rows: [{ first_name: 'Chunk', last_name: 'Two', email }],
      });
      expect(chunk2.status).toBe(200);
      expect(chunk2.body.data.created).toBe(0);
      expect(chunk2.body.data.skipped).toBe(1);
      expect(chunk2.body.data.rows[0].reason).toMatch(/already exists/);

      const rows = await pool.query('SELECT first_name FROM contacts WHERE tenant_id = $1 AND email = $2', [ws.tenantId, email]);
      expect(rows.rows.length).toBe(1);
      expect(rows.rows[0].first_name).toBe('Chunk'); // chunk 1's row survived, chunk 2 did not overwrite it
    });

    it('company_name resolves to a real company_id when it matches exactly; is unlinked with a warning when it does not', async () => {
      const co = await request(app).post('/api/v1/companies').set(auth(ws)).send({ name: `Linked Co ${Date.now()}` });
      const companyId = co.body.data.id;
      const companyName = co.body.data.name;

      const res = await request(app).post('/api/v1/contacts/import').set(auth(ws)).send({
        rows: [
          { first_name: 'Linked', last_name: 'Contact', email: `linked.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`, company_name: companyName },
          { first_name: 'Unlinked', last_name: 'Contact', email: `unlinked.${Date.now()}.${Math.random().toString(36).slice(2, 8)}@example.com`, company_name: 'Nonexistent Co XYZ' },
        ],
      });
      expect(res.status).toBe(200);
      expect(res.body.data.created).toBe(2);
      expect(res.body.data.rows[1].warnings?.[0]).toMatch(/No account named/);

      const linked = await pool.query(`SELECT company_id FROM contacts WHERE tenant_id = $1 AND first_name = 'Linked'`, [ws.tenantId]);
      expect(linked.rows[0].company_id).toBe(companyId);
      const unlinked = await pool.query(`SELECT company_id FROM contacts WHERE tenant_id = $1 AND first_name = 'Unlinked'`, [ws.tenantId]);
      expect(unlinked.rows[0].company_id).toBeNull();

      await pool.query('DELETE FROM companies WHERE id = $1', [companyId]);
    });
  });

  describe('Accounts (companies) import', () => {
    it('a mixed batch: valid row commits, invalid size is rejected, within-file duplicate name is caught', async () => {
      const stamp = Date.now();
      const rows = [
        { name: `Valid Import Co ${stamp}`, size: '11-50' },
        { name: `Bad Size Co ${stamp}`, size: 'not-a-size' },
        { name: `Repeated Co ${stamp}` },
        { name: `Repeated Co ${stamp}` }, // exact duplicate name, same file
      ];
      const res = await request(app).post('/api/v1/companies/import').set(auth(ws)).send({ rows });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body.data.created).toBe(2);
      expect(res.body.data.failed).toBe(1);
      expect(res.body.data.skipped).toBe(1);
      expect(res.body.data.rows[1].reason).toMatch(/not a valid company size/);
      expect(res.body.data.rows[3].reason).toMatch(/already exists/);

      const repeated = await pool.query(`SELECT COUNT(*)::int AS n FROM companies WHERE tenant_id = $1 AND name = $2`, [ws.tenantId, `Repeated Co ${stamp}`]);
      expect(repeated.rows[0].n).toBe(1); // exactly one row, not two
    });
  });
});
