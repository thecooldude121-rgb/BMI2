/**
 * The internal notifications feed (Group A item 5). Every function THROWS the
 * server's message on a non-2xx, so a panel can say it failed instead of
 * showing an empty feed that reads as "nothing happened".
 */
const API_BASE = 'http://localhost:5001/api/v1';

function headers(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function call<T>(path: string, method = 'GET'): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method, headers: headers() });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Request failed (HTTP ${res.status})`);
  return json as T;
}

export type NotificationType = 'lead_assigned' | 'deal_assigned' | 'deal_stage_changed' | 'lead_converted';

export interface NotificationRow {
  id: string;
  type: NotificationType;
  entity_type: 'lead' | 'deal';
  entity_id: string;
  entity_name: string | null;
  detail: { from_stage?: string | null; to_stage?: string | null; deal_id?: string };
  actor_name: string | null;
  created_at: string;
  read_at: string | null;
}

export interface NotificationPage { data: NotificationRow[]; total: number; unread_count: number; limit: number; offset: number }

export interface DueItem { lead_id: number; lead_name: string | null; company: string | null; due: string; task_id: string; overdue: boolean }
export interface DueFollowUps { overdue_count: number; today_count: number; items: DueItem[] }

export const fetchNotifications = (opts: { limit?: number; offset?: number; unread?: boolean } = {}) => {
  const q = new URLSearchParams();
  if (opts.limit) q.set('limit', String(opts.limit));
  if (opts.offset) q.set('offset', String(opts.offset));
  if (opts.unread) q.set('unread', 'true');
  return call<NotificationPage & { success: boolean }>(`/notifications?${q}`);
};

export const fetchDueFollowUps = async () => (await call<{ data: DueFollowUps }>('/notifications/due')).data;

export const markNotificationRead = (id: string) => call<{ data: { id: string; read_at: string } }>(`/notifications/${id}/read`, 'POST');

export const markAllNotificationsRead = async () => (await call<{ data: { updated: number } }>('/notifications/read-all', 'POST')).data;

/** What happened, in one sentence, from the stored facts only. */
export function describeNotification(n: NotificationRow): string {
  const who = n.actor_name || 'Someone';
  const what = n.entity_name || (n.entity_type === 'lead' ? 'a lead' : 'a deal');
  switch (n.type) {
    case 'lead_assigned': return `${who} assigned you the lead ${what}`;
    case 'deal_assigned': return `${who} assigned you the deal ${what}`;
    case 'lead_converted': return `${who} converted your lead ${what}`;
    case 'deal_stage_changed': {
      const { from_stage, to_stage } = n.detail ?? {};
      if (from_stage && to_stage) return `${who} moved ${what} from ${from_stage} to ${to_stage}`;
      return `${who} moved ${what}${to_stage ? ` to ${to_stage}` : ' to another stage'}`;
    }
  }
}

/** Where the row leads. A converted lead with a deal opens the deal it became. */
export function notificationHref(n: NotificationRow): string {
  if (n.type === 'lead_converted' && n.detail?.deal_id) return `/crm/deals/${n.detail.deal_id}`;
  return n.entity_type === 'lead' ? `/crm/leads/${n.entity_id}` : `/crm/deals/${n.entity_id}`;
}
