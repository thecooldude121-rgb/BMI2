/**
 * Workspace members API client — the real one.
 *
 * Backs Settings → Team Management against `Backend/src/routes/users.ts` and
 * `routes/invites.ts`. Every request is workspace-scoped by the server from the
 * token; nothing here sends a workspace id.
 *
 * WHAT THE SERVER ACTUALLY RETURNS, and why this file is short:
 * `GET /users` selects NINE columns — id, first_name, last_name, email, role,
 * department, is_active, last_login_at, created_at. The page this replaces was
 * driven by a 44-field fabricated model (`teamManagementMockData.ts`, 958
 * lines) whose other 35 fields had no column anywhere: employee ids, job
 * titles, phone numbers, office locations, reporting lines, permission sets,
 * login-frequency analytics. Those are not mapped here and are not invented —
 * the UI labels their absence instead.
 *
 * `initials` and `avatarColor` ARE derived here, and that is a different thing
 * from fabricating: both are computed from real values (the name and the id),
 * so they carry no information that is not already true. A stock photo or an
 * invented job title would carry information; a first letter does not.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * An Error that keeps the HTTP status, because one caller has to tell a 409
 * apart from everything else: the last-admin guard on a role change is a real,
 * actionable answer ("promote someone else first"), not a failure to report as
 * "something went wrong". `message` is still the server's own wording.
 */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.message || `Request failed (${res.status})`, res.status);
  return (json.data ?? json) as T;
}

/**
 * ── PRE-EXISTING EXPORTS, kept ────────────────────────────────────────────────
 *
 * `WorkspaceUser` / `fetchUsers` back the task assignee picker and predate the
 * Settings work. They stay because that picker wants ACTIVE users only and a
 * display name, not the fuller member shape the Settings roster needs.
 *
 * NOTE ON THE SHAPE TASKS NEED: `tasks.assigned_to` is a VARCHAR(100) holding a
 * DISPLAY NAME, not a user id — see the open decision in HANDOFF about
 * migrating it to a real owner_id. So a task assignee picker stores
 * `displayName`, not `id`, and that is deliberate rather than an oversight.
 */
export interface WorkspaceUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
  department: string | null;
  /** "First Last" — what tasks.assigned_to stores. */
  displayName: string;
}

export async function fetchUsers(): Promise<WorkspaceUser[]> {
  const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `GET /users failed (HTTP ${res.status})`);
  return (json.data ?? []).map((u: Omit<WorkspaceUser, 'displayName'>) => ({
    ...u,
    // Must match resolveActorName() in tasksController, which writes
    // `${first_name} ${last_name}`.trim() into assigned_to when a task is
    // created. If these two ever disagree, the "Mine" filter silently matches
    // nothing — the failure is invisible, so keep them identical.
    displayName: `${u.first_name} ${u.last_name}`.trim(),
  }));
}

/** The nine columns GET /users returns, plus the server's per-row role verdict. */
export interface UserRow {
  id: number | string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  department: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  /** Server-decided: may the CALLER change this person's role? */
  can_change_role?: boolean;
  /** Migration 041. Server-decided, same rule as can_change_role. */
  can_change_manager?: boolean;
  manager_id?: number | null;
  /** Resolved by the server through a tenant-matched join. */
  manager_name?: string | null;
}

/** What the UI renders: the nine real fields, plus two derived for display. */
export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  /** Derived from is_active. The API has no third state. */
  status: 'active' | 'inactive';
  isActive: boolean;
  /** null when this member has never signed in — not backfilled with a date. */
  lastLoginAt: string | null;
  createdAt: string;
  /** Derived from the name. */
  initials: string;
  /** Derived from the id, so a member's colour is stable across reloads. */
  avatarColor: string;
  /**
   * Whether THIS caller may change THIS member's role — decided by the server
   * (`can_change_role` on the row), never re-derived here. False both for a
   * caller who cannot change roles at all and for a member who outranks them.
   *
   * A false value means render NO control, not a disabled one. A disabled
   * control advertises an action that does not exist for you and invites a
   * support question; absence says the same thing without the tease.
   */
  canChangeRole: boolean;
  /**
   * Whether THIS caller may change who this person reports to. Served by the
   * same `canActOn` the endpoint enforces with — see canChangeRole above.
   */
  canChangeManager: boolean;
  /** null when nobody is recorded above them, which is a real state. */
  managerId: string | null;
  /**
   * The manager's display name, resolved SERVER-SIDE through a tenant-matched
   * join, never by the client. Null when there is no manager — and also null
   * when the stored manager_id points outside this workspace, because the join
   * refuses to resolve it. Resolving this from the roster client-side would
   * bypass that predicate and leak a cross-workspace name.
   */
  managerName: string | null;
}

/** Tailwind gradients, picked by id hash — stable, and carries no data. */
const AVATAR_COLORS = [
  'from-blue-500 to-blue-600', 'from-purple-500 to-purple-600',
  'from-emerald-500 to-emerald-600', 'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600', 'from-cyan-500 to-cyan-600',
];

function initialsOf(first: string, last: string, email: string): string {
  const a = (first || '').trim();
  const b = (last || '').trim();
  if (a || b) return `${a.charAt(0)}${b.charAt(0)}`.toUpperCase() || '?';
  // No name at all: fall back to the email's first character rather than a
  // placeholder that looks like a name.
  return (email.charAt(0) || '?').toUpperCase();
}

export function toMember(row: UserRow): WorkspaceMember {
  const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  const idStr = String(row.id);
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) hash = (hash * 31 + idStr.charCodeAt(i)) >>> 0;

  return {
    id: idStr,
    // An account with no name shows its email, not "Unknown User".
    name: name || row.email,
    email: row.email,
    role: row.role,
    department: row.department,
    status: row.is_active ? 'active' : 'inactive',
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    initials: initialsOf(row.first_name, row.last_name, row.email),
    avatarColor: AVATAR_COLORS[hash % AVATAR_COLORS.length],
    // Absent means false. An older server that does not send the field must
    // not be read as "everything is permitted".
    canChangeRole: row.can_change_role === true,
    // Migration 041. Absent means false / null, for the same reason: an older
    // server that does not send these must not be read as permitting anything,
    // nor as having no manager on record when it simply did not say.
    canChangeManager: row.can_change_manager === true,
    managerId: row.manager_id === null || row.manager_id === undefined ? null : String(row.manager_id),
    managerName: row.manager_name ?? null,
  };
}

/**
 * The workspace's members.
 *
 * `includeInactive` defaults TRUE here, unlike the API, whose default is active
 * -only for the assignment pickers that use it. A screen for managing
 * deactivation cannot be the screen that hides deactivated people.
 */
export interface Roster {
  members: WorkspaceMember[];
  /**
   * The roles THIS caller may assign, straight from the server's
   * `rolesAssignableBy` — the same function `PATCH /users/:id/role` enforces
   * with. The role picker is populated from this and from nothing else, so a
   * manager is never shown `admin` as an option rather than being shown it and
   * refused. Empty for a caller who may not change roles at all.
   */
  assignableRoles: string[];
  /**
   * Whether this caller may set anyone's manager at all (migration 041). The
   * per-row `canChangeManager` says WHICH people; this says whether the control
   * is rendered anywhere.
   *
   * There is deliberately no separate list of candidate managers — everyone in
   * the workspace is one, so the picker filters the roster it already has. What
   * it cannot work out for itself is which candidates would close a reporting
   * loop, since that needs the whole line: the server answers 409 and the
   * picker renders that refusal rather than trying to predict it.
   */
  canManageManagers: boolean;
}

export async function fetchRoster(includeInactive = true): Promise<Roster> {
  const qs = includeInactive ? '?include_inactive=true' : '';
  const res = await fetch(`${API_BASE}/users${qs}`, { headers: getAuthHeaders() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.message || `Request failed (${res.status})`, res.status);
  return {
    members: ((json.data ?? []) as UserRow[]).map(toMember),
    // Not `?? ALL_ROLES`: an absent field means the server did not grant
    // anything, and defaulting to a full list would offer options it refuses.
    assignableRoles: (json.assignable_roles ?? []) as string[],
    // Same reasoning: absent means not granted.
    canManageManagers: json.can_manage_managers === true,
  };
}

/** @deprecated Use fetchRoster — the roster's role rules travel with it. */
export async function fetchMembers(includeInactive = true): Promise<WorkspaceMember[]> {
  return (await fetchRoster(includeInactive)).members;
}

/**
 * PATCH /users/:id/role.
 *
 * Four server-side guards can refuse this, and the two worth knowing here are
 * the 403 ("you cannot assign that role" / "you cannot change the role of a
 * <role>") and the **409** — the last active admin or manager cannot be demoted
 * out of that set, including by themselves. The 409's message is the actionable
 * one and is shown verbatim rather than replaced by a generic failure, which is
 * why this throws `ApiError` with the status attached.
 *
 * NOTHING IS PRE-CHECKED HERE. The server is the control; duplicating its rules
 * in the client is how the two drift apart. What the client does do is avoid
 * OFFERING a role the server would refuse — a different thing, driven by the
 * server's own `assignable_roles`.
 */
/**
 * PATCH /users/:id/manager. Migration 041.
 *
 * Pass `null` to clear the manager — that is a real operation, since the top of
 * a reporting line has nobody above them. OMITTING the field is a 400 server
 * side, deliberately, so an accidental empty body cannot silently unlink
 * someone; this function always sends the key.
 *
 * THE 409 IS THE ONE TO SURFACE VERBATIM. It means the chosen manager already
 * reports to this person, directly or indirectly, so the edge would close a
 * loop. That is an actionable answer, not a generic failure — and it is
 * deliberately NOT pre-checked here: detecting it needs the whole reporting
 * line, which only the server has. Predicting it client-side is the drift this
 * codebase keeps paying for.
 */
export async function changeMemberManager(
  id: string,
  managerId: string | null,
): Promise<WorkspaceMember> {
  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(id)}/manager`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ manager_id: managerId === null ? null : Number(managerId) }),
  });
  return toMember(await unwrap<UserRow>(res));
}

export async function changeMemberRole(id: string, role: string): Promise<WorkspaceMember> {
  const res = await fetch(`${API_BASE}/users/${id}/role`, {
    method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ role }),
  });
  const row = await unwrap<UserRow>(res);
  return toMember(row);
}

/**
 * Deactivate — SOFT. The row and everything it owns stay; the account simply
 * cannot sign in, and its existing sessions stop working immediately
 * (migration 036). The server refuses two cases with a 409 whose message is
 * shown verbatim: deactivating yourself, and removing the last admin or
 * manager.
 */
export async function deactivateMember(id: string): Promise<WorkspaceMember> {
  const res = await fetch(`${API_BASE}/users/${id}/deactivate`, {
    method: 'POST', headers: getAuthHeaders(),
  });
  const row = await unwrap<UserRow>(res);
  return toMember(row);
}

export async function reactivateMember(id: string): Promise<WorkspaceMember> {
  const res = await fetch(`${API_BASE}/users/${id}/reactivate`, {
    method: 'POST', headers: getAuthHeaders(),
  });
  const row = await unwrap<UserRow>(res);
  return toMember(row);
}

/*
 * `invitableRolesFor()` and `INVITABLE_ROLES` USED TO LIVE HERE, AND ARE GONE.
 *
 * They were a client-side copy of the server's `rolesAssignableBy` — and the
 * copy had drifted: it listed sales/manager/admin and omitted `hr`, which
 * ASSIGNABLE_ROLES has always included, so the invite form silently could not
 * invite an HR user. Nothing failed and nothing was logged; the option simply
 * was not there.
 *
 * Both role pickers now read a served `assignable_roles` — `fetchInvites` above
 * for the invite form, `fetchRoster` for the role picker — so no mirror of this
 * rule remains anywhere in the frontend.
 */

export interface InviteResult {
  invite: { id: string; email: string; role: string; expires_at: string };
  /**
   * FALSE while EMAIL_TRANSPORT is `log`, which renders the message to the
   * server console and delivers nothing. Reported honestly by the server rather
   * than inferred from a 201, so the UI can tell the truth about it.
   */
  email_sent: boolean;
  /** Present only when nothing was emailed, so an admin can pass the link on. */
  accept_url?: string;
  note?: string;
}

export async function inviteMember(email: string, role: string): Promise<InviteResult> {
  const res = await fetch(`${API_BASE}/invites`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ email, role }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`);
  // Not unwrap(): this endpoint's useful payload is the envelope itself —
  // email_sent and accept_url sit alongside `invite`, not inside `data`.
  return json as InviteResult;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

export interface InviteList {
  pending: PendingInvite[];
  /**
   * The roles THIS caller may invite someone as, straight from the server's
   * `rolesAssignableBy` — the same rule `POST /invites` enforces with. The
   * invite form's picker is populated from this and nothing else.
   *
   * This replaced `invitableRolesFor()`, a hand-written copy of the rule that
   * lived here and had ALREADY DRIFTED: it listed sales/manager/admin and
   * omitted `hr`, which the server has always accepted, so the form could not
   * invite an HR user at all. That is the concrete cost of mirroring a rule
   * instead of asking for it.
   */
  assignableRoles: string[];
}

/**
 * Outstanding invites, and the roles this caller may hand out.
 *
 * Admin/manager only — a sales user gets 403, which is not an error worth
 * surfacing on this screen, so the caller treats it as "cannot see invites"
 * rather than "loading failed". Returns null in that case so the UI can
 * distinguish "none outstanding" from "not permitted to know".
 */
export async function fetchInvites(): Promise<InviteList | null> {
  const res = await fetch(`${API_BASE}/invites`, { headers: getAuthHeaders() });
  if (res.status === 403) return null;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json?.message || `Request failed (${res.status})`, res.status);
  const rows = (json.data ?? json.invites ?? []) as PendingInvite[];
  return {
    // Only invites still awaiting acceptance are "pending".
    pending: rows.filter((r) => !(r as unknown as { accepted_at?: string }).accepted_at
      && !(r as unknown as { revoked_at?: string }).revoked_at),
    // Absent means none granted. Defaulting to a full list would offer options
    // the server refuses — the failure this whole change exists to remove.
    assignableRoles: (json.assignable_roles ?? []) as string[],
  };
}

/** "3 Sep 2026, 14:05", or the honest absence of a login. */
export function formatLastLogin(iso: string | null): string {
  if (!iso) return 'Never signed in';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Never signed in';
  return d.toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
