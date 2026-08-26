import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { createApp } from '../app';

/**
 * TENANT ISOLATION — the #1 security requirement in CLAUDE.md.
 *
 * "Every table that holds tenant data has a workspace_id column, and every
 *  single query must filter by it. A missed workspace_id filter is a data-leak
 *  bug between tenants, not a style issue."
 *
 * This suite proves that claim instead of asserting it looks true. It drives
 * the REAL Express app (src/app.ts) through the REAL /auth/login endpoint with
 * REAL JWTs, because a hand-supplied token or a direct controller call would
 * skip the exact middleware that establishes scope.
 *
 * It covers three distinct failure modes, all of which were live before this
 * suite existed:
 *
 *   1. A missing WHERE tenant_id — the obvious one.
 *   2. An unscoped JOIN. The base table is filtered, so the query *looks*
 *      correct, but the join pulls a row from another workspace and projects
 *      its columns. This is what actually leaked: `LEFT JOIN leads l ON
 *      d.lead_id = l.id` returned another workspace's lead email.
 *   3. A foreign id accepted from a request body without checking it belongs to
 *      the caller's workspace. This is the WRITE that makes (2) reachable from
 *      the public API: every FK here (deals.lead_id, contacts.company_id,
 *      activities.contact_id) references its parent's global PK, so Postgres
 *      permits a cross-workspace reference and will not stop it.
 *
 * RUNNING IT:
 *   npm run test:isolation:setup   # once — creates bmi_crm_iso_test and migrates it
 *   npm run test:isolation
 *
 * SAFETY: `src/__tests__/setup.ts` refuses to run this against any database
 * not named *_test. It is a vitest setupFile because it has to execute before
 * config/database.ts opens its pool, and a static import here would be hoisted
 * above any guard written in this file.
 */

const app = createApp();

const WS_A = '11111111-1111-1111-1111-111111111111';
const WS_B = '22222222-2222-2222-2222-222222222222';
const PASSWORD = 'isolation-suite-password';

// Fixed ids so teardown is exact and a crashed run leaves nothing to guess at.
const IDS = {
  companyA: 'ISOCA', companyB: 'ISOCB',
  contactA: 'ISOTA', contactB: 'ISOTB',
  dealA: 'ISODA',    dealB: 'ISODB',
  taskA: 'ISOKA',    taskB: 'ISOKB',
};

let tokenA = '';
let tokenB = '';
let leadA = 0;
let leadB = 0;

/** Remove every row this suite creates, in FK-safe order. */
async function cleanup() {
  const ws = [WS_A, WS_B];
  await pool.query('DELETE FROM activities WHERE tenant_id = ANY($1::uuid[])', [ws]);
  await pool.query('DELETE FROM deal_stage_history WHERE tenant_id = ANY($1::uuid[])', [ws]);
  await pool.query('DELETE FROM tasks WHERE tenant_id = ANY($1::uuid[])', [ws]);
  await pool.query('DELETE FROM deals WHERE tenant_id = ANY($1::uuid[])', [ws]);
  await pool.query('DELETE FROM contacts WHERE tenant_id = ANY($1::uuid[])', [ws]);
  await pool.query('DELETE FROM companies WHERE tenant_id = ANY($1::uuid[])', [ws]);
  await pool.query('DELETE FROM leads WHERE tenant_id = ANY($1::uuid[])', [ws]);
  await pool.query('DELETE FROM users WHERE tenant_id = ANY($1::uuid[])', [ws]);
  await pool.query('DELETE FROM tenants WHERE id = ANY($1::uuid[])', [ws]);
}

beforeAll(async () => {
  await cleanup();

  await pool.query(
    `INSERT INTO tenants (id, name, slug) VALUES ($1,'Workspace A','iso-ws-a'), ($2,'Workspace B','iso-ws-b')`,
    [WS_A, WS_B],
  );

  // Real users with real bcrypt hashes, so login is a genuine login. Creating
  // fixture users is setup; hand-minting a token would not be — it would skip
  // the middleware under test.
  const hash = await bcrypt.hash(PASSWORD, 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role, tenant_id)
     VALUES ('alan@iso-a.example',$1,'Alan','Aycroft','admin',$2),
            ('bea@iso-b.example',$1,'Bea','Beeworth','admin',$3)`,
    [hash, WS_A, WS_B],
  );

  // One record of every kind in each workspace.
  await pool.query(
    `INSERT INTO companies (id, name, tenant_id) VALUES ($1,'A Industries',$3), ($2,'B Industries',$4)`,
    [IDS.companyA, IDS.companyB, WS_A, WS_B],
  );
  await pool.query(
    `INSERT INTO contacts (id, first_name, last_name, email, tenant_id)
     VALUES ($1,'Cara','Contact-A','cara@iso-a.example',$3),
            ($2,'Cliff','Contact-B','cliff@iso-b.example',$4)`,
    [IDS.contactA, IDS.contactB, WS_A, WS_B],
  );
  await pool.query(
    `INSERT INTO deals (id, name, title, value, stage, tenant_id)
     VALUES ($1,'Deal in A','Deal in A',1000,'prospecting',$3),
            ($2,'Deal in B','Deal in B',2000,'prospecting',$4)`,
    [IDS.dealA, IDS.dealB, WS_A, WS_B],
  );
  await pool.query(
    `INSERT INTO tasks (id, title, tenant_id) VALUES ($1,'Task in A',$3), ($2,'Task in B',$4)`,
    [IDS.taskA, IDS.taskB, WS_A, WS_B],
  );
  const leads = await pool.query(
    `INSERT INTO leads (first_name, last_name, email, company, tenant_id)
     VALUES ('Lena','Lead-A','lena@iso-a.example','A Industries',$1),
            ('Liam','Lead-B','liam@iso-b.example','B Industries',$2)
     RETURNING id, tenant_id`,
    [WS_A, WS_B],
  );
  leadA = leads.rows.find(r => r.tenant_id === WS_A).id;
  leadB = leads.rows.find(r => r.tenant_id === WS_B).id;

  // Log in the way the frontend does. If this breaks, everything below is
  // meaningless — so it is asserted, not assumed.
  const loginA = await request(app).post('/api/v1/auth/login')
    .send({ email: 'alan@iso-a.example', password: PASSWORD });
  const loginB = await request(app).post('/api/v1/auth/login')
    .send({ email: 'bea@iso-b.example', password: PASSWORD });
  expect(loginA.status, `login A failed: ${JSON.stringify(loginA.body)}`).toBe(200);
  expect(loginB.status, `login B failed: ${JSON.stringify(loginB.body)}`).toBe(200);
  tokenA = loginA.body.token;
  tokenB = loginB.body.token;
  expect(tokenA, 'workspace A token').toBeTruthy();
  expect(tokenB, 'workspace B token').toBeTruthy();
});

afterAll(async () => {
  await cleanup();
  await pool.end();
});

const asA = (path: string) => request(app).get(path).set('Authorization', `Bearer ${tokenA}`);

// ---------------------------------------------------------------------------
// 1. The baseline the task asked for: a query scoped to A cannot return B's row.
// ---------------------------------------------------------------------------
describe('a list scoped to workspace A never returns workspace B rows', () => {
  const cases: { name: string; path: string; aId: string | (() => string); bId: string | (() => string) }[] = [
    { name: 'companies', path: '/api/v1/companies', aId: IDS.companyA, bId: IDS.companyB },
    { name: 'contacts',  path: '/api/v1/contacts',  aId: IDS.contactA, bId: IDS.contactB },
    { name: 'deals',     path: '/api/v1/deals',     aId: IDS.dealA,    bId: IDS.dealB },
    { name: 'tasks',     path: '/api/v1/tasks',     aId: IDS.taskA,    bId: IDS.taskB },
    { name: 'leads',     path: '/api/v1/leads',     aId: () => String(leadA), bId: () => String(leadB) },
  ];

  for (const c of cases) {
    it(`GET ${c.path} returns A's record and not B's`, async () => {
      const res = await asA(c.path);
      expect(res.status).toBe(200);
      const ids = res.body.data.map((r: any) => String(r.id));
      const a = typeof c.aId === 'function' ? c.aId() : c.aId;
      const b = typeof c.bId === 'function' ? c.bId() : c.bId;
      expect(ids, `${c.name}: A's own record must be visible`).toContain(a);
      expect(ids, `${c.name}: B's record LEAKED into A's list`).not.toContain(b);
    });
  }

  it("fetching B's record by id as A is a 404, not a read", async () => {
    for (const [path, id] of [
      ['/api/v1/companies', IDS.companyB],
      ['/api/v1/contacts', IDS.contactB],
      ['/api/v1/deals', IDS.dealB],
      ['/api/v1/tasks', IDS.taskB],
    ] as const) {
      const res = await asA(`${path}/${id}`);
      expect(res.status, `${path}/${id} must not be readable by workspace A`).toBe(404);
    }
  });

  it("A cannot modify or delete B's record", async () => {
    const put = await request(app).put(`/api/v1/deals/${IDS.dealB}`)
      .set('Authorization', `Bearer ${tokenA}`).send({ name: 'hijacked' });
    expect(put.status).toBe(404);

    const del = await request(app).delete(`/api/v1/contacts/${IDS.contactB}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(del.status).toBe(404);

    // And prove it in Postgres, not from the response — a 404 with a completed
    // write would look identical from here.
    const still = await pool.query(
      'SELECT name FROM deals WHERE id = $1 AND tenant_id = $2', [IDS.dealB, WS_B]);
    expect(still.rows[0].name).toBe('Deal in B');
  });

  it('scope comes from the token only — a workspace_id query param cannot override it', async () => {
    const res = await request(app)
      .get(`/api/v1/deals?workspace_id=${WS_B}&tenant_id=${WS_B}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((r: any) => String(r.id));
    expect(ids).not.toContain(IDS.dealB);
  });
});

// ---------------------------------------------------------------------------
// 2. The write side: a foreign id from another workspace must be refused.
// ---------------------------------------------------------------------------
describe("a foreign id belonging to another workspace is refused on write", () => {
  it('POST /deals rejects a lead_id from workspace B', async () => {
    const res = await request(app).post('/api/v1/deals')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Deal probing B', value: 1, lead_id: leadB });
    expect(res.status, `expected 400, got ${res.status}: ${JSON.stringify(res.body)}`).toBe(400);
    expect(String(res.body.message)).toMatch(/lead_id/i);
  });

  it('POST /contacts rejects a company_id from workspace B', async () => {
    const res = await request(app).post('/api/v1/contacts')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        first_name: 'Probe', last_name: 'Contact',
        email: 'probe-company@iso-a.example', company_id: IDS.companyB,
      });
    expect(res.status, `expected 400, got ${res.status}: ${JSON.stringify(res.body)}`).toBe(400);
    expect(String(res.body.message)).toMatch(/company_id/i);
  });

  it('POST /activities rejects a contact_id from workspace B', async () => {
    const res = await request(app).post('/api/v1/activities')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ subject: 'Probing call', type: 'call', contact_id: IDS.contactB });
    expect(res.status, `expected 400, got ${res.status}: ${JSON.stringify(res.body)}`).toBe(400);
    expect(String(res.body.message)).toMatch(/contact_id/i);
  });

  it('PUT /deals rejects re-pointing lead_id at workspace B', async () => {
    const res = await request(app).put(`/api/v1/deals/${IDS.dealA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ lead_id: leadB });
    expect(res.status, `expected 400, got ${res.status}: ${JSON.stringify(res.body)}`).toBe(400);
  });

  it('the same ids from the caller\'s OWN workspace are accepted', async () => {
    // The check must reject the other workspace, not break the feature.
    const res = await request(app).put(`/api/v1/deals/${IDS.dealA}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ lead_id: leadA });
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    expect(String(res.body.data.lead_id)).toBe(String(leadA));
  });
});

// ---------------------------------------------------------------------------
// 3. The read side: an unscoped JOIN leaks even when the base table is filtered.
//    Bad references are written straight to Postgres here, because after the
//    fix in (2) the API will not create them — but rows like this can already
//    exist, and the read path must not project them.
// ---------------------------------------------------------------------------
describe('a pre-existing cross-workspace reference does not leak through a JOIN', () => {
  beforeAll(async () => {
    await pool.query('UPDATE deals SET lead_id = $1 WHERE id = $2', [leadB, IDS.dealA]);
    await pool.query('UPDATE contacts SET company_id = $1 WHERE id = $2', [IDS.companyB, IDS.contactA]);
    await pool.query(
      `INSERT INTO activities (subject, type, tenant_id, contact_id) VALUES ('Logged in A','call',$1,$2)`,
      [WS_A, IDS.contactB],
    );
    // Confirm the bad data really is there, so a passing test cannot be a
    // false negative from setup that silently did nothing.
    const check = await pool.query(
      'SELECT lead_id FROM deals WHERE id = $1', [IDS.dealA]);
    expect(String(check.rows[0].lead_id)).toBe(String(leadB));
  });

  it("GET /deals does not expose workspace B's lead email", async () => {
    const res = await asA('/api/v1/deals');
    expect(res.status).toBe(200);
    const deal = res.body.data.find((d: any) => d.id === IDS.dealA);
    expect(deal, "A's own deal should still be listed").toBeTruthy();
    expect(deal.lead_email ?? null, "workspace B's lead email LEAKED").toBeNull();
  });

  it("GET /deals/:id does not expose workspace B's lead name or email", async () => {
    const res = await asA(`/api/v1/deals/${IDS.dealA}`);
    expect(res.status).toBe(200);
    expect(res.body.data.lead_email ?? null).toBeNull();
    expect(res.body.data.lead_name ?? null).toBeNull();
  });

  it("GET /contacts does not expose workspace B's company name", async () => {
    const res = await asA('/api/v1/contacts');
    expect(res.status).toBe(200);
    const contact = res.body.data.find((c: any) => c.id === IDS.contactA);
    expect(contact).toBeTruthy();
    expect(contact.company_name ?? null, "workspace B's company name LEAKED").toBeNull();
  });

  it("GET /activities does not expose workspace B's contact name", async () => {
    const res = await asA('/api/v1/activities');
    expect(res.status).toBe(200);
    const act = res.body.data.find((a: any) => a.subject === 'Logged in A');
    expect(act, "A's own activity should still be listed").toBeTruthy();
    expect(act.contact_name ?? null, "workspace B's contact name LEAKED").toBeNull();
  });

  it("GET /activities/:id does not expose workspace B's contact name", async () => {
    const list = await asA('/api/v1/activities');
    const act = list.body.data.find((a: any) => a.subject === 'Logged in A');
    const res = await asA(`/api/v1/activities/${act.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.contact_name ?? null).toBeNull();
  });
});
