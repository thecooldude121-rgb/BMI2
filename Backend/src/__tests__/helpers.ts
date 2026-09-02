import bcrypt from 'bcryptjs';
import request from 'supertest';
import { pool } from '../config/database';
import { createApp } from '../app';

/**
 * Shared machinery for the round-trip regression suite (Prompt C).
 *
 * Every test in this suite drives the REAL Express app through the REAL
 * /auth/login endpoint with a REAL bcrypt-hashed password, exactly like
 * tenantIsolation.test.ts — a hand-minted token would skip the exact
 * middleware (`protect`, `requireTenantId`) the suite exists to exercise.
 *
 * Ids here are all real (gen_random_uuid() for tenants, DB-generated ids for
 * every entity), never pre-agreed constants, because this file runs in the
 * same database as tenantIsolation.test.ts (fixed ids ISOCA/ISOCB/... and
 * tenants 111.../222...) and fileParallelism is false but the two suites
 * must still never collide on an id.
 */

export const app = createApp();

export interface TestWorkspace {
  tenantId: string;
  userId: string;
  email: string;
  token: string;
}

/** One tenant + one admin user, logged in for real. */
export async function setupWorkspace(label: string): Promise<TestWorkspace> {
  const password = 'round-trip-test-password';
  const hash = await bcrypt.hash(password, 10);

  const tenant = await pool.query(
    `INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id`,
    [`RT ${label}`, `rt-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`],
  );
  const tenantId = tenant.rows[0].id;

  const email = `rt-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@roundtrip.example`;
  const user = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, tenant_id)
     VALUES ($1,$2,'Round','Tripper','admin',$3) RETURNING id`,
    [email, hash, tenantId],
  );
  const userId = user.rows[0].id;

  const login = await request(app).post('/api/v1/auth/login').send({ email, password });
  if (login.status !== 200) {
    throw new Error(`setupWorkspace(${label}): real login failed — ${JSON.stringify(login.body)}`);
  }
  const token = login.body.token as string;
  if (!token) throw new Error(`setupWorkspace(${label}): login returned no token`);

  return { tenantId, userId, email, token };
}

/** Remove everything a workspace could hold, in FK-safe order, then the workspace itself. */
export async function teardownWorkspace(ws: TestWorkspace): Promise<void> {
  await pool.query('DELETE FROM deal_stage_history WHERE tenant_id = $1', [ws.tenantId]);
  await pool.query('DELETE FROM activities WHERE tenant_id = $1', [ws.tenantId]);
  await pool.query('DELETE FROM tasks WHERE tenant_id = $1', [ws.tenantId]);
  await pool.query('DELETE FROM deals WHERE tenant_id = $1', [ws.tenantId]);
  await pool.query('DELETE FROM contacts WHERE tenant_id = $1', [ws.tenantId]);
  await pool.query('DELETE FROM companies WHERE tenant_id = $1', [ws.tenantId]);
  await pool.query('DELETE FROM leads WHERE tenant_id = $1', [ws.tenantId]);
  await pool.query('DELETE FROM users WHERE tenant_id = $1', [ws.tenantId]);
  await pool.query('DELETE FROM tenants WHERE id = $1', [ws.tenantId]);
}

export const auth = (ws: TestWorkspace): Record<string, string> => ({
  Authorization: `Bearer ${ws.token}`,
});

/**
 * A second user in an EXISTING workspace, with a chosen role, logged in for
 * real. RBAC has to be tested inside one workspace: a different workspace
 * would be blocked by tenant scoping and prove nothing about roles.
 *
 * Returns the same shape as setupWorkspace so `auth()` works on it, but the
 * caller must NOT pass it to teardownWorkspace — it shares the tenant, which
 * the owning test tears down.
 */
export async function addUserWithRole(
  ws: TestWorkspace,
  role: 'admin' | 'manager' | 'sales',
): Promise<TestWorkspace> {
  const password = 'round-trip-test-password';
  const hash = await bcrypt.hash(password, 10);
  const email = `rt-${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@roundtrip.example`;

  const user = await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, tenant_id)
     VALUES ($1,$2,'Role',$3,$4,$5) RETURNING id`,
    [email, hash, role, role, ws.tenantId],
  );

  const login = await request(app).post('/api/v1/auth/login').send({ email, password });
  if (login.status !== 200) {
    throw new Error(`addUserWithRole(${role}): real login failed — ${JSON.stringify(login.body)}`);
  }
  return { tenantId: ws.tenantId, userId: user.rows[0].id, email, token: login.body.token as string };
}
