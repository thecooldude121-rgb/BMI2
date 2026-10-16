import { describe, it, expect, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pool } from '../config/database';
import { runMigrations, getMigrationStatus, migrationsOnBootMode } from '../config/runMigrations';

/**
 * MIGRATIONS_ON_BOOT (decided by Venkat 2026-10-15): a server checks and REFUSES
 * to start on a pending migration instead of applying it. `npm run db:migrate`
 * still applies. Run against the test database with a scratch migrations folder,
 * so the real folder and the real ledger are only ever read.
 */
describe('MIGRATIONS_ON_BOOT', () => {
  const tmp: string[] = [];
  const folder = (files: Record<string, string>): string => {
    const d = fs.mkdtempSync(path.join(os.tmpdir(), 'migboot-'));
    tmp.push(d);
    for (const [name, sql] of Object.entries(files)) fs.writeFileSync(path.join(d, name), sql);
    return d;
  };
  const ledgerCount = async () =>
    (await pool.query('SELECT count(*)::int AS n FROM public.schema_migrations')).rows[0].n as number;
  const exists = async (table: string) =>
    (await pool.query('SELECT to_regclass($1) IS NOT NULL AS ok', [`public.${table}`])).rows[0].ok as boolean;

  afterEach(async () => {
    vi.restoreAllMocks();
    for (const d of tmp.splice(0)) fs.rmSync(d, { recursive: true, force: true });
    await pool.query("DELETE FROM public.schema_migrations WHERE filename LIKE '999\\_rt\\_%'");
    await pool.query('DROP TABLE IF EXISTS public.rt_migboot_probe');
  });

  it('defaults to check; only "check" and "apply" are accepted', () => {
    expect(migrationsOnBootMode(undefined)).toBe('check');
    expect(migrationsOnBootMode('')).toBe('check');
    expect(migrationsOnBootMode('check')).toBe('check');
    expect(migrationsOnBootMode('apply')).toBe('apply');
    for (const bad of ['Apply', 'true', 'yes', 'apply ']) {
      expect(() => migrationsOnBootMode(bad)).toThrow(/must be "check" \(the default\) or "apply"/);
    }
  });

  it('check mode with a pending migration refuses to start, names it, and changes nothing', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const before = await ledgerCount();
    const dir = folder({ '999_rt_probe.sql': 'CREATE TABLE public.rt_migboot_probe (id int);' });

    await runMigrations({ mode: 'check', dir });

    expect(exit).toHaveBeenCalledWith(1);
    expect(error.mock.calls.flat().join('\n')).toMatch(/999_rt_probe\.sql/);
    expect(getMigrationStatus()).toMatchObject({ ok: false, pending: ['999_rt_probe.sql'] });
    expect(await exists('rt_migboot_probe')).toBe(false);   // not executed
    expect(await ledgerCount()).toBe(before);               // not recorded
  });

  it('check mode against the real folder passes on an up-to-date database without exiting', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await runMigrations({ mode: 'check' });
    expect(exit).not.toHaveBeenCalled();
    expect(getMigrationStatus()).toMatchObject({ ok: true, pending: [] });
  });

  it('the boot file runs the runner in the configured mode, not the apply default', () => {
    const boot = fs.readFileSync(path.join(__dirname, '..', 'index.ts'), 'utf8');
    expect(boot).toMatch(/runMigrations\(\{ mode: migrationsOnBootMode\(\) \}\)/);
    expect(boot).not.toMatch(/runMigrations\(\)/);
  });

  it('apply mode (what db:migrate runs) still applies and records the migration', async () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const dir = folder({ '999_rt_probe.sql': 'CREATE TABLE public.rt_migboot_probe (id int);' });
    await runMigrations({ mode: 'apply', dir });
    expect(exit).not.toHaveBeenCalled();
    expect(await exists('rt_migboot_probe')).toBe(true);
    const row = await pool.query("SELECT 1 FROM public.schema_migrations WHERE filename = '999_rt_probe.sql'");
    expect(row.rowCount).toBe(1);
  });
});
