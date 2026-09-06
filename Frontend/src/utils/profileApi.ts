/**
 * Your own account: read it, edit it, change its password.
 *
 * Backs the Account half of Settings against `Backend/src/routes/auth.ts`.
 * Three endpoints, and NONE of them takes a user id — the row acted on is the
 * one the token names, so none of these can be pointed at a colleague. That is
 * the whole reason they are separate from `usersApi.ts`, which is the admin
 * roster and does take ids.
 *
 * WHAT THE SERVER ACTUALLY STORES on `users`: email, first_name, last_name,
 * role, department, avatar_url, is_active, created_at, last_login_at,
 * token_version. That is all. Phone, job title, location, per-user timezone and
 * language have no column — the profile page invented values for every one of
 * them — and `PATCH /auth/me` ignores body fields it does not recognise, so
 * sending them would report success and save nothing. They are not sent from
 * here and are not rendered.
 *
 * WRITABLE: first_name, last_name, email. Nothing else. `role` in particular is
 * refused server-side — a user cannot promote themselves by editing their own
 * profile — and `department` is not offered because no endpoint lets anyone set
 * it yet, here or in the admin roster.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Exactly what GET /auth/me returns. Nullable columns come back as null. */
export interface MyProfile {
  id: number | string;
  email: string;
  /** NOT NULL on users, so never null — a blank one is refused server-side. */
  first_name: string;
  last_name: string;
  role: string;
  /** Null when unset. There is no endpoint to set it, so it is read-only. */
  department: string | null;
  /** Null when the user has no avatar. No stock photo stands in for it. */
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  /** Null until the account has signed in at least once. */
  last_login_at: string | null;
  workspace_id: string;
}

/** The three writable fields. Omit one to leave it unchanged. */
export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
}

/**
 * The server's message is thrown verbatim, so the user reads the real reason —
 * "Someone in this workspace already uses that email address", "first_name
 * cannot be blank" — rather than a generic failure. That is the point of the
 * backend returning clean 400s and 409s instead of masked 500s.
 */
async function unwrap<T>(res: Response, pick: (json: any) => T): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || `Request failed (${res.status})`);
  }
  return pick(json);
}

/** GET /auth/me — the signed-in user's own row. */
export async function fetchMyProfile(): Promise<MyProfile> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
  // getMe answers under `user`; updateMe answers under `data`. Both are read so
  // this client does not depend on which one it happened to call.
  return unwrap<MyProfile>(res, j => (j.user ?? j.data) as MyProfile);
}

/** PATCH /auth/me — returns the row as stored, which is what should be rendered. */
export async function updateMyProfile(updates: ProfileUpdate): Promise<MyProfile> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  return unwrap<MyProfile>(res, j => (j.data ?? j.user) as MyProfile);
}

export interface ChangePasswordResult {
  /**
   * A REISSUED SESSION TOKEN, and using it is not optional.
   *
   * The server bumps `users.token_version` when the password changes
   * (migration 036), which invalidates every token minted before the call —
   * INCLUDING the one this request was made with. So the caller must replace
   * its stored token with this one or the very next request 401s and the user
   * is thrown back to the login screen moments after being careful.
   */
  token: string;
  /** True: other sessions really are dead, not a disclaimer. */
  other_sessions_signed_out: boolean;
  message?: string;
}

/**
 * POST /auth/change-password.
 *
 * Rate limited per account server-side (5 failed attempts / 15 minutes), so a
 * wrong current password eventually returns 429 rather than another 400. The
 * server's message is surfaced either way.
 *
 * The caller is responsible for storing `token`. `applyReissuedToken` in
 * AuthContext is the one place that should do it.
 */
export async function changeMyPassword(
  current_password: string,
  new_password: string,
): Promise<ChangePasswordResult> {
  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ current_password, new_password }),
  });
  return unwrap<ChangePasswordResult>(res, j => j as ChangePasswordResult);
}

/**
 * The password rule the SERVER actually enforces, and nothing more.
 *
 * `authController.changePassword` requires: at least 8 characters, and
 * different from the current one. It does not require an uppercase letter, a
 * digit or a symbol. The old form listed all four as "Password Requirements",
 * which stated a policy this product does not have — a user who satisfied it
 * would have been told requirements were met by a check that meant nothing, and
 * a user who did not would have been blocked by a rule the server would have
 * accepted.
 */
export const MIN_PASSWORD_LENGTH = 8;
