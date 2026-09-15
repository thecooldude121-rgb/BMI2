const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Connected Modules — the link between this workspace and a sibling module.
 *
 * Every function throws on failure rather than returning a default, so a broken
 * request can never be rendered as "not connected". Telling an admin they are
 * disconnected when the request simply failed would send them to re-run a
 * handshake that was never needed.
 */

export interface ModuleLinkStatus {
  module: string;
  connected: boolean;
  base_url: string | null;
  remote_workspace_id: string | null;
  connected_since: string | null;
  linked_by_name: string | null;
  last_verified_at: string | null;
  last_verify_error: string | null;
  pending_setup_code: { expires_at: string; created_at: string } | null;
}

export interface SetupCode {
  /** Returned exactly once, at creation. It is stored only as a hash. */
  setup_code: string;
  expires_at: string;
  expires_in_minutes: number;
  redeem_url: string;
}

export async function fetchModuleLinkStatus(): Promise<ModuleLinkStatus> {
  const res = await fetch(`${API_BASE}/module-links`, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Failed to load module links (HTTP ${res.status})`);
  return json.data as ModuleLinkStatus;
}

export async function createLeadGenSetupCode(): Promise<SetupCode> {
  const res = await fetch(`${API_BASE}/module-links/lead-gen/setup-code`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Failed to create setup code (HTTP ${res.status})`);
  return json.data as SetupCode;
}

export async function disconnectLeadGen(): Promise<void> {
  const res = await fetch(`${API_BASE}/module-links/lead-gen`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Failed to disconnect (HTTP ${res.status})`);
}
