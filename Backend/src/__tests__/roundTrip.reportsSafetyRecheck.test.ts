import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import request from 'supertest';
import { Client, Pool } from 'pg';
import { pool } from '../config/database';
import { app, setupWorkspace, teardownWorkspace, auth, TestWorkspace } from './helpers';
import { DEFINITION_VERSION, type ReportDefinition } from '../services/reports/types';
import { resetReportsPool } from '../config/reportsDatabase';

/**
 * REPORTS SAFETY CHECK — RE-CHECKED AFTER A TEMPORARY FAILURE (reports replay
 * step d, asked for by Venkat 2026-10-16).
 *
 * Before: the behavioural RLS check cached its promise whatever it settled to,
 * so one temporary failure refused every report until the backend restarted.
 * Now only a PASS is cached; a failed check is retried on the next report run.
 * Nothing is ever served before a check has passed — the report's own query is
 * never sent when the check fails.
 */
const CHECK_SQL = 'SELECT count(*)::int AS n FROM deals';

describe('Reports safety check — re-checked after a temporary failure', () => {
  let ws: TestWorkspace;
  const def: ReportDefinition = {
    v: DEFINITION_VERSION, base: 'deals', dimensions: [{ field: 'deals.source' }], metrics: [{ agg: 'count' }],
  };
  const run = () => request(app).post('/api/v1/reports/run').set(auth(ws)).send({ definition: def });

  /** Every SQL text sent on a pg client while `fn` runs (report pool and app pool alike). */
  const sentDuring = async <T>(fn: () => Promise<T>) => {
    const real = Client.prototype.query;
    const sent: string[] = [];
    const spy = vi.spyOn(Client.prototype, 'query').mockImplementation(function (this: Client, ...args: unknown[]) {
      const text = typeof args[0] === 'string' ? args[0] : (args[0] as { text?: string })?.text;
      if (text) sent.push(text);
      return (real as (...a: unknown[]) => unknown).apply(this, args);
    } as never);
    try { return { result: await fn(), sent }; } finally { spy.mockRestore(); }
  };

  beforeAll(async () => {
    ws = await setupWorkspace('rpt-recheck');
    await pool.query(
      `INSERT INTO deals (name, value, currency, source, tenant_id, stage_id)
       VALUES ('recheck deal', 100, 'USD', 'referral', $1,
               (SELECT id FROM pipeline_stages WHERE tenant_id = $1 ORDER BY position LIMIT 1))`,
      [ws.tenantId],
    );
  });

  afterEach(async () => { vi.restoreAllMocks(); await resetReportsPool(); });

  afterAll(async () => {
    await pool.query('DELETE FROM deals WHERE tenant_id = $1', [ws.tenantId]);
    await teardownWorkspace(ws);
    await resetReportsPool();
  });

  it('a connection failure during the check: 503, nothing run — and the NEXT run checks again and succeeds', async () => {
    await resetReportsPool();
    // Only the REPORTS pool's first connect fails; the app pool (auth, etc.) is untouched.
    const realConnect = Pool.prototype.connect;
    let reportConnects = 0;
    vi.spyOn(Pool.prototype, 'connect').mockImplementation(function (this: Pool, ...args: unknown[]) {
      if ((this as unknown as { options: { user?: string } }).options.user === process.env.REPORTS_DB_USER) {
        reportConnects += 1;
        if (reportConnects === 1) {
          return Promise.reject(Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' }));
        }
      }
      return (realConnect as (...a: unknown[]) => unknown).apply(this, args);
    } as never);

    const first = await run();
    expect(first.status, JSON.stringify(first.body)).toBe(503);
    expect(first.body.message).toBe('Reports are not available right now. Nothing was run. Try again in a moment.');
    expect(first.body).not.toHaveProperty('rows');
    expect(first.body.message).not.toMatch(/ECONNREFUSED|REPORTS_DB|row-level/i);  // detail stays in the log
    expect(reportConnects).toBe(1);   // the check's connect only; the report never connected

    // No restart, no reset: the next run re-checks.
    const second = await run();
    expect(second.status, JSON.stringify(second.body)).toBe(200);
    expect(second.body.rows).toEqual([{ dim_0: 'referral', metric_0: '1' }]);
  });

  it('a failure part-way through the check: 503 with the report query never sent, then a re-check that passes', async () => {
    await resetReportsPool();
    // One spy (vitest reuses a spy on the same method, so they must not nest):
    // fail the check's query once, and record every SQL text sent meanwhile.
    const real = Client.prototype.query;
    const sent: string[] = [];
    let failed = false;
    vi.spyOn(Client.prototype, 'query').mockImplementation(function (this: Client, ...args: unknown[]) {
      const text = typeof args[0] === 'string' ? args[0] : (args[0] as { text?: string })?.text;
      if (text) sent.push(text);
      if (!failed && text === CHECK_SQL) {
        failed = true;
        return Promise.reject(Object.assign(new Error('terminating connection due to administrator command'), { code: '57P01' }));
      }
      return (real as (...a: unknown[]) => unknown).apply(this, args);
    } as never);

    const first = await run();
    expect(first.status, JSON.stringify(first.body)).toBe(503);
    expect(failed).toBe(true);
    expect(sent.some(t => t.includes('FROM (SELECT'))).toBe(false);   // no report SQL went out
    expect(sent.some(t => /BEGIN READ ONLY/.test(t))).toBe(false);

    vi.restoreAllMocks();
    const second = await run();
    expect(second.status, JSON.stringify(second.body)).toBe(200);
  });

  it('once the check has PASSED it is not repeated on every run', async () => {
    await resetReportsPool();
    const { sent: firstSent } = await sentDuring(run);
    expect(firstSent.filter(t => t === CHECK_SQL)).toHaveLength(1);
    // The markers the failure tests look for really are what a report run sends.
    expect(firstSent.some(t => t.includes('FROM (SELECT'))).toBe(true);
    expect(firstSent.some(t => /BEGIN READ ONLY/.test(t))).toBe(true);
    const { result, sent } = await sentDuring(run);
    expect(result.status).toBe(200);
    expect(sent.filter(t => t === CHECK_SQL)).toHaveLength(0);
  });

  it('runs arriving together while a check is in flight share ONE check', async () => {
    await resetReportsPool();
    const { result, sent } = await sentDuring(() => Promise.all([run(), run(), run()].map(r => r.then(x => x))));
    expect(result.map(r => r.status)).toEqual([200, 200, 200]);
    expect(sent.filter(t => t === CHECK_SQL)).toHaveLength(1);
  });
});
