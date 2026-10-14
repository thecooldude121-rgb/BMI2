import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/** H2 (2026-10-14): unbuilt sign-in options are disabled and labelled; no false claims. */
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: null, loading: false, login: vi.fn() }) }));
import Login from './Login';

it('SSO and password reset are disabled and say why; the panel makes no unbacked claims', () => {
  const { container } = render(<MemoryRouter><Login /></MemoryRouter>);
  expect(screen.getByRole('button', { name: /Google · not configured/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Microsoft · not configured/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: /Forgot password\? · Coming soon/ })).toBeDisabled();
  const text = container.textContent ?? '';
  for (const claim of [/Outperform/i, /Trusted by/i, /Enterprise-grade/i, /Salesforce/, /HubSpot/, /AI-driven/i, /Billboard/i, /© 2024/]) {
    expect(text, String(claim)).not.toMatch(claim);
  }
});
