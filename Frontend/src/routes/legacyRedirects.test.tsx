import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { LEGACY_REDIRECTS } from './legacyRedirects';

/**
 * Slice 5d — /dashboard and /analytics redirect to their real equivalents, and
 * "/" no longer lands a sign-in on the duplicate dashboard.
 */
function Where() { return <p data-testid="where">{useLocation().pathname}</p>; }

describe('legacy routes redirect to the real pages', () => {
  it.each([
    ['/', '/crm/dashboard'],
    ['/dashboard', '/crm/dashboard'],
    ['/analytics', '/crm/reports'],
  ])('%s -> %s', (from, to) => {
    render(
      <MemoryRouter initialEntries={[from]}>
        <Routes>
          {LEGACY_REDIRECTS.map(r => <Route key={r.from} path={r.from} element={<Navigate to={r.to} replace />} />)}
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId('where')).toHaveTextContent(to);
  });

  it('every redirect goes straight to a real page — never to another legacy route', () => {
    const froms = new Set(LEGACY_REDIRECTS.map(r => r.from));
    for (const r of LEGACY_REDIRECTS) {
      expect(froms.has(r.to), `${r.from} -> ${r.to} chains`).toBe(false);
      expect(r.to.startsWith('/crm/'), r.to).toBe(true);
    }
  });

  it('App renders this list and no longer routes the duplicate pages', () => {
    const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    expect(app).toContain('LEGACY_REDIRECTS.map');
    expect(app).not.toMatch(/import\('\.\/pages\/Dashboard'\)|Analytics\/Analytics|DataProvider/);
  });
});
