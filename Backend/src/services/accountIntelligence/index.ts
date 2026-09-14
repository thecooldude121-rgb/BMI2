import { MockAccountIntelligenceProvider } from './mockProvider';
import type { AccountIntelligenceProvider } from './types';

/**
 * THE SEAM. Swapping the mock for the real Lead Gen client is a CONFIG CHANGE
 * here, not a rewrite of the controller or the panel.
 *
 * `ACCOUNT_INTELLIGENCE_PROVIDER` selects the implementation:
 *
 *   unset / 'mock'  -> MockAccountIntelligenceProvider  (today, and the default)
 *   'leadgen'       -> not built. There is nothing to call: Lead Gen does not
 *                      exist as a running service (Venkat, 2026-09-14), and no
 *                      vendor key is wired anywhere in this tree.
 *
 * ─── WHY UNSET MEANS MOCK, AND WHY 'leadgen' THROWS ────────────────────────
 *
 * Defaulting to the mock is the safe direction: a missing env var yields
 * clearly-labelled sample content, never a silent failure that looks like "this
 * account has no signals". An absent value must not be readable as "real data,
 * of which there happens to be none" — that is the same "absent means none"
 * rule the served-permission fields follow, pointed the other way.
 *
 * Asking for 'leadgen' THROWS AT STARTUP rather than falling back to the mock.
 * A silent fallback is how a deployment ends up showing placeholder news while
 * its operator believes the integration is live — the same class of failure as
 * `EMAIL_TRANSPORT=log` in production, which this server also refuses to boot
 * with. Loud and unbootable beats quiet and wrong.
 *
 * The real implementation, when it arrives, lands as one more case in this
 * switch. Nothing above it in the stack changes: the controller asks for a
 * provider, the provider answers, and the panel reads `preview` off the payload
 * to decide whether to show the sample-content banner.
 */

export const PROVIDER_ENV = 'ACCOUNT_INTELLIGENCE_PROVIDER';

let cached: AccountIntelligenceProvider | null = null;

export function getAccountIntelligenceProvider(): AccountIntelligenceProvider {
  if (cached) return cached;

  const choice = (process.env[PROVIDER_ENV] ?? 'mock').trim().toLowerCase();

  switch (choice) {
    case '':
    case 'mock':
      cached = new MockAccountIntelligenceProvider();
      return cached;

    case 'leadgen':
      throw new Error(
        `${PROVIDER_ENV}=leadgen, but the Lead Gen provider is not built. `
        + 'Lead Gen is not a running service yet and no client exists in this tree. '
        + `Unset ${PROVIDER_ENV} to serve clearly-labelled sample content instead.`,
      );

    default:
      throw new Error(
        `${PROVIDER_ENV}="${choice}" is not a known provider. Use "mock", or leave it unset.`,
      );
  }
}

/** Test seam only: forget the cached provider so a test can change the env var. */
export function resetAccountIntelligenceProvider(): void {
  cached = null;
}

export * from './types';
