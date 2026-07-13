// Storage: localStorage key bmi_audit_events, capped at 500 events
// and 90 days. When backend is ready: POST /api/audit/events for sync.

import type { FeedbackType } from './leadScoring/scoreFeedback';

// ── Event model ───────────────────────────────────────────────────────────────

export type AuditEventType =
  | 'status_changed'
  | 'owner_changed'
  | 'converted'
  | 'merged'
  | 'disqualified'
  | 'lost'
  | 'score_feedback';

export type AuditEventMeta =
  | { type: 'status_changed';  fromStatus: string;         toStatus: string }
  | { type: 'owner_changed';   fromOwnerId: string | null; toOwnerId: string; toOwnerName?: string }
  | { type: 'converted';       targetType: 'contact' | 'deal' | 'both'; targetId?: string }
  | { type: 'merged';          absorbedLeadId: string;     absorbedLeadName: string }
  | { type: 'disqualified';    reason: string;             notes?: string }
  | { type: 'lost';            reason: string;             notes?: string }
  | { type: 'score_feedback';  feedback: FeedbackType; score: number };

export interface AuditEvent {
  id:        string;
  leadId:    string;
  actorId:   string;
  actorName: string;
  actorRole: string;
  type:      AuditEventType;
  timestamp: string;
  meta:      AuditEventMeta;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'bmi_audit_events';
const MAX_EVENTS  = 500;
const MAX_AGE_MS  = 90 * 24 * 60 * 60 * 1000; // 90 days

function readAll(): AuditEvent[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as AuditEvent[];
  } catch {
    return [];
  }
}

function writeAll(events: AuditEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch { /* quota exceeded — silently ignore */ }
}

function purge(events: AuditEvent[]): AuditEvent[] {
  const cutoff = Date.now() - MAX_AGE_MS;
  const fresh  = events.filter(e => new Date(e.timestamp).getTime() > cutoff);
  return fresh.length > MAX_EVENTS ? fresh.slice(fresh.length - MAX_EVENTS) : fresh;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function appendAuditEvent(partial: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
  const event: AuditEvent = {
    ...partial,
    id:        `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  writeAll(purge([...readAll(), event]));
  return event;
}

export function getAuditEventsForLead(leadId: string): AuditEvent[] {
  return readAll()
    .filter(e => e.leadId === leadId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getAllAuditEvents(): AuditEvent[] {
  return readAll().sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
