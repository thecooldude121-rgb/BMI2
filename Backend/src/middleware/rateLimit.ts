import rateLimit, { Options } from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiting for the credential endpoints.
 *
 * Login validates real credentials as of the auth rewrite, which makes it
 * brute-forceable. Nothing throttled it: no limiter, no lockout, no delay.
 *
 * TWO KEYS, DELIBERATELY. A per-IP limit alone is defeated by spraying one
 * password across many accounts from a botnet; a per-email limit alone is
 * defeated by rotating accounts from one host. Both run on every request and
 * either can reject, so an attacker has to stay under both at once.
 *
 * STORAGE: in-process memory. That is honest to state rather than discover —
 * counters reset on restart and are NOT shared across instances, so a
 * multi-instance deployment multiplies every budget by the instance count. The
 * stack already specifies Redis for exactly this; `store` is the single seam to
 * swap in `rate-limit-redis` when Redis is wired, with no change to call sites.
 *
 * Responses use the standard `RateLimit-*` headers (draft-8) and 429, which is
 * what a DAST scan looks for. `legacyHeaders` is off so we emit one scheme, not
 * two contradicting ones.
 */

/** Shared shape so every limiter answers identically. */
const base: Partial<Options> = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  // A limiter must never leak whether the account exists, so the message is the
  // same regardless of who is being throttled.
  message: { success: false, message: 'Too many attempts. Please try again later.' },
};

/** Normalised so Alice@x.com and alice@x.com share one bucket. */
const emailKey = (req: Request): string => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return email || 'no-email';
};

/**
 * `ipKeyGenerator` is not used: express-rate-limit's default key already handles
 * IPv6 normalisation. Behind a proxy, `app.set('trust proxy', ...)` must be
 * configured or every request appears to come from the proxy and the per-IP
 * limit becomes a global one — see the note in index.ts.
 */

/**
 * 30 FAILED attempts / 15 min per IP.
 *
 * Raised from 10, and now skips successful logins, after the first version locked
 * ME out during its own verification — which is exactly what it would do to a
 * customer. An office behind one NAT address shares this bucket: twenty people
 * signing in on Monday morning, plus anyone mistyping once, would exhaust a
 * budget of 10 before lunch and the fix would look like an outage.
 *
 * The division of labour matters here. The per-EMAIL limit is the defence against
 * brute-forcing one account and stays deliberately tight at 5. This per-IP limit
 * exists for a different attack — spraying one password across many accounts from
 * one host — and only FAILED attempts are evidence of that, so successful sign-ins
 * no longer consume it.
 */
export const loginIpLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
});

/**
 * 5 attempts / 15 min per email address.
 * Lower than the IP budget on purpose: a legitimate person mistyping their own
 * password a handful of times is the case being protected, and five is enough
 * for that while making an online guessing attack against one account useless.
 *
 * `skipSuccessfulRequests` so a correct sign-in does not consume the budget —
 * otherwise a busy shared account could lock itself out by succeeding.
 */
export const loginEmailLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: emailKey,
  skipSuccessfulRequests: true,
});

/**
 * Registration is invite-only, so this is not guarding a guessable secret — it
 * stops an invite token being brute-forced and stops the endpoint being used to
 * probe which emails already exist.
 */
export const registerIpLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

/** Issuing invites is authenticated; this bounds accidental or malicious floods. */
export const inviteLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 30,
  keyGenerator: (req: Request & { user?: { id?: string } }): string =>
    String(req.user?.id ?? 'anonymous'),
});

/** Exported for tests and for a future Redis swap to assert against. */
export const LIMITS = {
  loginPerIp: 30,
  loginPerEmail: 5,
  registerPerIp: 10,
  invitesPerUser: 30,
  windowMinutes: 15,
} as const;

export type { Response };
