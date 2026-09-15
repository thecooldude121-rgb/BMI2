import { LEAD_GEN_MODULE, leadGenLink } from './link';

/**
 * Endpoint 3 of docs/crm-leadgen-integration-contract.md section 5, called
 * FROM this CRM:
 *
 *   GET {base_url}/api/v1/account-intelligence
 *     ?company_domain={domain}&since={ISO}&limit={n}
 *
 * This is the first outbound call this CRM makes to another module. It is a
 * READ FOR DISPLAY, which sets every policy below: short timeout, no retry, and
 * failures returned rather than thrown, so a panel can say "couldn't load this
 * right now" instead of a page failing to render.
 *
 * CONFIRMED AGAINST THE RUNNING LEAD GEN SERVICE, not just its contract doc:
 * the success body is a BARE JSON ARRAY (not wrapped in an object), an unknown
 * domain returns [] rather than 404, `url` is genuinely nullable, rows already
 * arrive newest-first, and both `Authorization: Bearer` and `X-API-Key` are
 * accepted. Sending a workspace_id that does not match either side of the link
 * is a 403, which is why it is only sent when the link actually recorded one.
 */

/** The vocabulary Lead Gen stores in account_intelligence_feed.category. */
export const SIGNAL_CATEGORIES = ['hiring', 'funding', 'tech_change', 'exec_move', 'news'] as const;
export type SignalCategory = (typeof SIGNAL_CATEGORIES)[number];

export interface AccountSignal {
  id: string;
  source: string | null;
  /** One of SIGNAL_CATEGORIES in practice; kept open so an added value renders. */
  category: string | null;
  headline: string;
  url: string | null;
  published_at: string | null;
}

export type AccountIntelligenceResult =
  | { status: 'ok'; signals: AccountSignal[] }
  /** No link row, or a link with no usable key. Not an error -- render nothing. */
  | { status: 'not_linked' }
  | { status: 'error'; message: string };

/**
 * 8 seconds. Long enough for a cross-service call on a slow link, short enough
 * that a hung Lead Gen does not hold a CRM request open for the 15s the write
 * path allows itself -- a queued write can afford to wait, a page cannot.
 */
const TIMEOUT_MS = 8_000;

/**
 * Deliberately NOT retried. Lead Gen's own client retries its contact CREATE
 * because a lost write has to be recovered; this is a read whose worst outcome
 * is an empty panel the user can refresh. Retrying would multiply the latency
 * of the exact failure the timeout exists to bound.
 */
export async function fetchAccountIntelligence(
  tenantId: string,
  companyDomain: string,
  options: { since?: string; limit?: number } = {},
): Promise<AccountIntelligenceResult> {
  const domain = companyDomain?.trim();
  // No domain means Lead Gen would return the whole workspace feed, which is
  // not what any caller of this function wants. Treated as "nothing to show".
  if (!domain) return { status: 'ok', signals: [] };

  const link = await leadGenLink(tenantId);
  if (!link || !link.apiKey) return { status: 'not_linked' };

  const url = new URL(`${link.baseUrl}/api/v1/account-intelligence`);
  url.searchParams.set('company_domain', domain);
  if (options.since) url.searchParams.set('since', options.since);
  if (options.limit) url.searchParams.set('limit', String(options.limit));
  // Only when the link recorded one: an unmatched value is a 403, so sending a
  // guess would turn a working read into a failure.
  if (link.remoteWorkspaceId) url.searchParams.set('workspace_id', link.remoteWorkspaceId);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${link.apiKey}`,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      // 401 means the key is wrong or revoked and 403 means it is pointed at
      // the wrong workspace. Neither is something the viewer can fix, and the
      // upstream body can echo detail that does not belong on a CRM page, so
      // the message stays generic and the status goes to the log.
      console.warn(`[lead-gen] account-intelligence responded ${res.status} for ${domain}`);
      return {
        status: 'error',
        message:
          res.status === 401 || res.status === 403
            ? 'The Lead Gen connection for this workspace is not authorised.'
            : "Couldn't load account intelligence right now.",
      };
    }

    const body = (await res.json()) as unknown;
    // The contract says a bare array and the running service sends one. The
    // { signals: [...] } shape is tolerated because Lead Gen's own CRM client
    // extends the same courtesy to this side's deals response.
    const raw = Array.isArray(body)
      ? body
      : Array.isArray((body as { signals?: unknown })?.signals)
        ? ((body as { signals: unknown[] }).signals)
        : null;

    if (!raw) {
      console.warn('[lead-gen] account-intelligence body was not an array');
      return { status: 'error', message: "Couldn't load account intelligence right now." };
    }

    const signals: AccountSignal[] = raw
      .filter((s): s is Record<string, any> => Boolean(s) && typeof s === 'object')
      // A signal with no headline has nothing to render, and id is what the UI
      // keys on -- both must be real rather than coerced from undefined.
      .filter((s) => s.id !== undefined && s.id !== null && typeof s.headline === 'string' && s.headline.trim())
      .map((s) => ({
        id: String(s.id),
        source: s.source ?? null,
        category: s.category ?? null,
        headline: s.headline,
        url: typeof s.url === 'string' && s.url.trim() ? s.url : null,
        published_at: s.published_at ?? null,
      }));

    // Lead Gen already orders newest-first. Sorted again here so this function's
    // contract holds regardless of what the other side does later; nulls last,
    // since a signal with no date is the least useful thing to lead with.
    signals.sort((a, b) => {
      if (!a.published_at && !b.published_at) return 0;
      if (!a.published_at) return 1;
      if (!b.published_at) return -1;
      return b.published_at.localeCompare(a.published_at);
    });

    return { status: 'ok', signals };
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError';
    console.warn(
      `[lead-gen] account-intelligence ${aborted ? `timed out after ${TIMEOUT_MS}ms` : 'request failed'}:`,
      err instanceof Error ? err.message : err,
    );
    return { status: 'error', message: "Couldn't load account intelligence right now." };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Reachability probe, for a future settings screen to call before saving.
 *
 * Uses Lead Gen's unauthenticated /api/v1/health, which exists precisely so the
 * CRM can confirm the endpoint is there before a key is configured. Probing
 * with the real read instead would conflate "wrong URL" with "wrong key".
 */
export async function probeLeadGen(baseUrl: string): Promise<{ ok: boolean; detail: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(new URL(`${baseUrl}/api/v1/health`), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, detail: `responded ${res.status}` };
    const body = (await res.json()) as { module?: string; contract_version?: string };
    if (body?.module !== 'lead_gen') {
      return { ok: false, detail: 'that URL did not identify itself as Lead Gen' };
    }
    return { ok: true, detail: `contract ${body.contract_version ?? 'unknown'}` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : 'probe failed' };
  } finally {
    clearTimeout(timer);
  }
}

export { LEAD_GEN_MODULE };
