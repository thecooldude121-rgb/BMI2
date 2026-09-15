import { pool } from '../../config/database';
import { decryptSecret, secretsConfigured } from '../../utils/secretBox';

/**
 * The stored link from one workspace to its Lead Gen workspace
 * (module_links, migration 047).
 */

export const LEAD_GEN_MODULE = 'lead-gen';

export interface ModuleLink {
  baseUrl: string;
  apiKey: string | null;
  remoteWorkspaceId: string | null;
}

/**
 * Validates a base URL that will be fetched SERVER-SIDE.
 *
 * An unvalidated scheme here is an SSRF foothold: file://, or a URL pointing at
 * an instance metadata endpoint, would be fetched by this process with its own
 * network position. Plain http is allowed only for localhost so a dev setup
 * works without opening a hole in a deployed one. Mirrors normalizeBaseUrl on
 * Lead Gen's side of the same link.
 */
export function normalizeBaseUrl(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('base_url is required');
  }
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error('base_url is not a valid URL');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('base_url must be http or https');
  }
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol === 'http:' && !isLocal) {
    throw new Error('base_url must use https except for localhost');
  }
  // Trailing slash removed so callers can concatenate a path without doubling it.
  return url.toString().replace(/\/+$/, '');
}

/**
 * Returns the active link for a workspace, or null when there is none.
 *
 * null means "not linked" and is a normal state, not an error -- no workspace
 * is linked today. Callers are expected to render an absence, not a failure.
 */
export async function leadGenLink(tenantId: string): Promise<ModuleLink | null> {
  const { rows } = await pool.query(
    `SELECT base_url, api_key_encrypted, remote_workspace_id
       FROM module_links
      WHERE tenant_id = $1 AND module = $2 AND is_active = TRUE`,
    [tenantId, LEAD_GEN_MODULE],
  );
  const row = rows[0];
  if (!row) return null;

  let apiKey: string | null = null;
  if (row.api_key_encrypted) {
    // A stored key that cannot be decrypted (missing or rotated encryption key)
    // is reported as "no key" rather than thrown: the caller's job is to say
    // the feed is unavailable, and a decryption failure is not something an end
    // user can act on. The condition is distinguishable in logs.
    if (!secretsConfigured()) {
      console.warn('[lead-gen] module link has a stored key but MODULE_LINK_ENCRYPTION_KEY is not set');
    } else {
      try {
        apiKey = decryptSecret(row.api_key_encrypted);
      } catch (err) {
        console.warn('[lead-gen] stored API key could not be decrypted:', err instanceof Error ? err.message : err);
      }
    }
  }

  return {
    baseUrl: row.base_url,
    apiKey,
    remoteWorkspaceId: row.remote_workspace_id ?? null,
  };
}
