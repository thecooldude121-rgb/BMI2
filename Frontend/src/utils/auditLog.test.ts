import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { appendAuditEvent, getAuditEventsForLead, getAllAuditEvents } from './auditLog';

// ── localStorage mock ──────────────────────────────────────────────────────────

let store: Record<string, string> = {};

const localStorageMock = {
  getItem:    (k: string) => store[k] ?? null,
  setItem:    (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear:      () => { store = {}; },
};

beforeEach(() => {
  store = {};
  vi.stubGlobal('localStorage', localStorageMock);
  vi.useRealTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// ── Fixtures ───────────────────────────────────────────────────────────────────

const BASE_PARTIAL = {
  leadId:    'lead-1',
  actorId:   'user-1',
  actorName: 'Alice',
  actorRole: 'admin',
  type:      'status_changed' as const,
  meta:      { type: 'status_changed' as const, fromStatus: 'new', toStatus: 'qualified' },
};

// ── appendAuditEvent ───────────────────────────────────────────────────────────

describe('appendAuditEvent', () => {
  it('returns event with generated id and timestamp', () => {
    const event = appendAuditEvent(BASE_PARTIAL);
    expect(event.id).toMatch(/^audit_/);
    expect(new Date(event.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('persists event to localStorage', () => {
    appendAuditEvent(BASE_PARTIAL);
    const raw = JSON.parse(store['bmi_audit_events'] ?? '[]') as unknown[];
    expect(raw).toHaveLength(1);
    expect((raw[0] as { leadId: string }).leadId).toBe('lead-1');
  });

  it('accumulates multiple events', () => {
    appendAuditEvent(BASE_PARTIAL);
    appendAuditEvent({ ...BASE_PARTIAL, leadId: 'lead-2' });
    const raw = JSON.parse(store['bmi_audit_events'] ?? '[]') as unknown[];
    expect(raw).toHaveLength(2);
  });

  it('caps storage at 500 events (oldest trimmed)', () => {
    const now = Date.now();
    const many = Array.from({ length: 500 }, (_, i) => ({
      id: `audit_old_${i}`,
      leadId: 'lead-x',
      actorId: 'u',
      actorName: 'U',
      actorRole: 'admin',
      type: 'status_changed' as const,
      timestamp: new Date(now - 1000 * (500 - i)).toISOString(),
      meta: { type: 'status_changed' as const, fromStatus: 'new', toStatus: 'qualified' },
    }));
    store['bmi_audit_events'] = JSON.stringify(many);

    appendAuditEvent(BASE_PARTIAL); // 501st event triggers purge
    const raw = JSON.parse(store['bmi_audit_events'] ?? '[]') as unknown[];
    expect(raw.length).toBeLessThanOrEqual(500);
  });

  it('survives corrupt localStorage gracefully', () => {
    store['bmi_audit_events'] = '{invalid json}';
    expect(() => appendAuditEvent(BASE_PARTIAL)).not.toThrow();
    const raw = JSON.parse(store['bmi_audit_events'] ?? '[]') as unknown[];
    expect(raw).toHaveLength(1);
  });
});

// ── getAuditEventsForLead ──────────────────────────────────────────────────────

describe('getAuditEventsForLead', () => {
  it('returns empty array when no events', () => {
    expect(getAuditEventsForLead('lead-1')).toEqual([]);
  });

  it('filters to only the requested leadId', () => {
    appendAuditEvent({ ...BASE_PARTIAL, leadId: 'lead-1' });
    appendAuditEvent({ ...BASE_PARTIAL, leadId: 'lead-2' });
    const result = getAuditEventsForLead('lead-1');
    expect(result).toHaveLength(1);
    expect(result[0].leadId).toBe('lead-1');
  });

  it('returns events sorted newest first', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    appendAuditEvent({ ...BASE_PARTIAL, meta: { type: 'status_changed', fromStatus: 'new', toStatus: 'qualified' } });
    vi.setSystemTime(new Date('2026-01-01T01:00:00.000Z'));
    appendAuditEvent({ ...BASE_PARTIAL, meta: { type: 'status_changed', fromStatus: 'qualified', toStatus: 'engaged' } });
    const result = getAuditEventsForLead('lead-1');
    expect(result).toHaveLength(2);
    expect(result[0].timestamp > result[1].timestamp).toBe(true);
  });
});

// ── getAllAuditEvents ──────────────────────────────────────────────────────────

describe('getAllAuditEvents', () => {
  it('returns all events across all leads, sorted newest first', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    appendAuditEvent({ ...BASE_PARTIAL, leadId: 'lead-1' });
    vi.setSystemTime(new Date('2026-01-01T01:00:00.000Z'));
    appendAuditEvent({ ...BASE_PARTIAL, leadId: 'lead-2' });
    const result = getAllAuditEvents();
    expect(result).toHaveLength(2);
    expect(new Set(result.map(e => e.leadId)).size).toBe(2);
    expect(result[0].timestamp >= result[1].timestamp).toBe(true);
  });

  it('purges events older than 90 days', () => {
    vi.useFakeTimers();

    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    appendAuditEvent(BASE_PARTIAL);

    // Advance 91 days, add new event to trigger purge
    vi.setSystemTime(new Date('2026-04-02T00:00:00.000Z'));
    appendAuditEvent({ ...BASE_PARTIAL, leadId: 'lead-new' });

    const result = getAllAuditEvents();
    // Old event should be purged; only the new one remains
    expect(result.every(e => e.leadId === 'lead-new')).toBe(true);
  });
});
