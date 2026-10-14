import { describe, it, expect } from 'vitest';
import { parseRateLimit } from './rateLimitHeader';

describe('parseRateLimit (IETF draft-8, as express-rate-limit writes it)', () => {
  it('reads each named limiter', () => {
    expect(parseRateLimit('"login-ip"; r=29; t=900, "login-email"; r=4; t=873')).toEqual({
      'login-ip': { remaining: 29, resetSeconds: 900 },
      'login-email': { remaining: 4, resetSeconds: 873 },
    });
  });
  it('missing or malformed input gives nothing, never a guessed count', () => {
    expect(parseRateLimit(null)).toEqual({});
    expect(parseRateLimit('garbage, "x"; t=5')).toEqual({});
  });
});
