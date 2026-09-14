/**
 * ACCOUNT INTELLIGENCE — the provider contract. Capability 5.
 *
 * ─── READ THIS BEFORE EXTENDING ANYTHING HERE ──────────────────────────────
 *
 * THERE IS A SECOND, MORE COMPLETE IMPLEMENTATION OF THIS CAPABILITY on the
 * branch `feature/lead-gen-account-intelligence` (`services/leadGen/`), which
 * calls Lead Gen over HTTP for real. This tree is a MOCK built deliberately in
 * parallel, on instruction, so the panel exists before that integration lands.
 * The two are meant to be reconciled, not merged blindly — see the
 * "Account intelligence" entry in CLAUDE.md.
 *
 * The shapes below deliberately MIRROR that branch's contract (a client keyed
 * on `company_domain`, the same five signal categories, failures returned
 * rather than thrown) so that swapping one for the other is a provider change
 * and not a rewrite of the panel. They were matched by reading its interface,
 * not by copying its code.
 *
 * ─── LEAD GEN IS NOT RUNNING ───────────────────────────────────────────────
 *
 * A comment on that branch states the contract was "CONFIRMED AGAINST THE
 * RUNNING LEAD GEN SERVICE". Per Venkat (2026-09-14) that is NOT the case —
 * Lead Gen does not exist yet as a running service, and that claim overstates
 * what was actually verified. It is recorded here and in CLAUDE.md so it does
 * not stand as fact for whoever picks that branch up. Nothing in this directory
 * depends on Lead Gen being reachable, and no vendor key is wired anywhere.
 */

/**
 * The five categories, matching the other branch exactly. `news` is the one
 * this capability was asked for; the rest come with the contract and are kept
 * so a provider swap does not change the panel's vocabulary.
 */
export const SIGNAL_CATEGORIES = ['hiring', 'funding', 'tech_change', 'exec_move', 'news'] as const;
export type SignalCategory = (typeof SIGNAL_CATEGORIES)[number];

export interface AccountSignal {
  category: SignalCategory;
  headline: string;
  summary: string;
  /**
   * ALL THREE ARE NULL FROM THE MOCK PROVIDER, AND THAT IS THE POINT.
   *
   * A sample item carrying a plausible source name, a link and a date is no
   * longer obviously sample content — it is a fabricated news story with a
   * citation, which is the one thing this panel must never render. A real
   * provider fills them; the mock leaves them null and the panel shows nothing
   * where they would go.
   */
  source: string | null;
  url: string | null;
  published_at: string | null;
}

/**
 * Failures are RETURNED, never thrown — matching the other branch, and for the
 * same reason: this is a read for display. A panel that cannot load its signals
 * should say so; it should not take the account page down with it.
 */
export type AccountIntelligenceResult =
  | { status: 'ok'; signals: AccountSignal[]; preview: boolean; preview_note: string | null }
  | { status: 'error'; detail: string };

export interface AccountIntelligenceProvider {
  /** Names the implementation in the payload, so the client can tell which one answered. */
  readonly name: string;
  /**
   * True when the rows are sample content rather than real signals. The panel
   * reads THIS, never the provider's name, so a third provider added later
   * cannot be mistaken for real by omission.
   */
  readonly isPreview: boolean;
  fetchSignals(companyDomain: string): Promise<AccountIntelligenceResult>;
}

/**
 * 8 seconds, matching the other branch's outbound read.
 *
 * The mock resolves immediately and never consults it. It lives here rather
 * than in the future HTTP provider so the value is part of the CONTRACT both
 * implementations share — a real provider that quietly picked 30s would hold a
 * CRM request open far longer than a page can wait.
 */
export const ACCOUNT_INTELLIGENCE_TIMEOUT_MS = 8_000;

/**
 * Deliberately NOT retried, also matching. The worst outcome of a failed read
 * is an empty panel the user can refresh; retrying multiplies the latency of
 * exactly the failure the timeout exists to bound.
 */
export const ACCOUNT_INTELLIGENCE_RETRIES = 0;
