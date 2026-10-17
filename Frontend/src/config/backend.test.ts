import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { resolveBackendOrigin, LIVE_DEV_ORIGIN } from './backendOrigin';

/**
 * The test frontend (vite --mode e2e) must never fall back to the live
 * development backend on :5001 — a misconfiguration fails loudly instead.
 */
describe('resolveBackendOrigin', () => {
  it('e2e mode: no address is an error — there is no default', () => {
    expect(() => resolveBackendOrigin({ MODE: 'e2e' })).toThrow(/VITE_BACKEND_ORIGIN is not set\. It has no default in e2e mode/);
    expect(() => resolveBackendOrigin({ MODE: 'e2e', VITE_BACKEND_ORIGIN: '  ' })).toThrow(/is not set/);
  });

  it('e2e mode: the live development backend (:5001) is refused, however it is spelled', () => {
    for (const v of ['http://localhost:5001', 'http://localhost:5001/', 'http://127.0.0.1:5001', 'http://[::1]:5001']) {
      expect(() => resolveBackendOrigin({ MODE: 'e2e', VITE_BACKEND_ORIGIN: v })).toThrow(/points at :5001/);
    }
  });

  it('e2e mode: a non-URL is refused; the test backend is accepted', () => {
    expect(() => resolveBackendOrigin({ MODE: 'e2e', VITE_BACKEND_ORIGIN: 'localhost5002' })).toThrow(/is not a URL/);
    expect(resolveBackendOrigin({ MODE: 'e2e', VITE_BACKEND_ORIGIN: 'http://localhost:5002/' })).toBe('http://localhost:5002');
  });

  it('every other mode keeps the app as it was: :5001 unless VITE_BACKEND_ORIGIN says otherwise', () => {
    expect(resolveBackendOrigin({ MODE: 'development' })).toBe(LIVE_DEV_ORIGIN);
    expect(resolveBackendOrigin({ MODE: 'production' })).toBe('http://localhost:5001');
    expect(resolveBackendOrigin({ MODE: 'development', VITE_BACKEND_ORIGIN: 'https://api.example.test' })).toBe('https://api.example.test');
  });
});

describe('one place for the backend address', () => {
  const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [p] : [];
  });

  it('no source file but config/backend(Origin).ts names localhost:5001 (a copy would bypass the e2e guard)', () => {
    const src = path.join(__dirname, '..');
    const offenders = walk(src).filter(f => !/[\\/]config[\\/]backend(Origin)?\.ts$/.test(f) && fs.readFileSync(f, 'utf8').includes('localhost:5001'));
    expect(offenders).toEqual([]);
  });
});
