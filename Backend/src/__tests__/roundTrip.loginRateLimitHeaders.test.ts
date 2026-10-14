import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './helpers';

/**
 * The login page's "attempts left" banner reads the SERVER's count (decided
 * 2026-10-13; it was a browser-side counter with an invented 5-minute lockout).
 * For that to work a browser must be allowed to read the header (CORS expose)
 * and the per-email limiter must be identifiable within it.
 */
describe('Login rate-limit headers are readable by the login page', () => {
  const email = `nobody-${Date.now()}@ratelimit.example`;

  it('a failed sign-in carries "login-email" with the remaining count, and CORS exposes it', async () => {
    const first = await request(app).post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:5173').send({ email, password: 'wrong-password-1' });
    expect(first.status).toBe(401);
    expect(first.headers['access-control-expose-headers']).toMatch(/RateLimit/);
    expect(first.headers['ratelimit']).toMatch(/"login-email"; r=4; t=\d+/);
    expect(first.headers['ratelimit']).toMatch(/"login-ip"; r=\d+/);

    const second = await request(app).post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:5173').send({ email, password: 'wrong-password-2' });
    expect(second.headers['ratelimit']).toMatch(/"login-email"; r=3;/);
  });

  it('after five failures the sixth is a 429 with a Retry-After', async () => {
    const e2 = `locked-${Date.now()}@ratelimit.example`;
    for (let k = 0; k < 5; k++) {
      await request(app).post('/api/v1/auth/login').send({ email: e2, password: `bad-${k}` });
    }
    const sixth = await request(app).post('/api/v1/auth/login').send({ email: e2, password: 'bad-6' });
    expect(sixth.status).toBe(429);
    expect(Number(sixth.headers['retry-after'])).toBeGreaterThan(0);
    expect(sixth.headers['ratelimit']).toMatch(/"login-email"; r=0;/);
  });
});
