import { describe, it, expect } from 'vitest';
import { activityTimestamp, sortActivitiesNewestFirst } from './activitiesApi';

/**
 * The contact timeline replaced a hardcoded block of JSX. These cover the
 * ordering rules that block never had to obey, because it was four fixed
 * entries written in the order someone wanted them shown.
 */

type Stamps = { completed_at: string | null; scheduled_at: string | null; created_at: string };
const a = (over: Partial<Stamps> & { id?: string } = {}): Stamps & { id: string } => ({
  id: over.id ?? 'x',
  completed_at: over.completed_at ?? null,
  scheduled_at: over.scheduled_at ?? null,
  created_at: over.created_at ?? '2026-01-01T00:00:00Z',
});

describe('activityTimestamp', () => {
  it('uses completed_at for something that happened', () => {
    expect(activityTimestamp(a({ completed_at: '2026-03-01T10:00:00Z' })))
      .toBe('2026-03-01T10:00:00Z');
  });

  it('uses scheduled_at for something planned', () => {
    // A planned activity has no completed_at. Reading completed_at alone gave
    // undefined -> Invalid Date -> the epoch.
    expect(activityTimestamp(a({ scheduled_at: '2026-09-01T14:00:00Z' })))
      .toBe('2026-09-01T14:00:00Z');
  });

  it('prefers completed_at when both are present', () => {
    // The API should never send both, but a rescheduled-then-completed row
    // must still read as completed.
    expect(activityTimestamp(a({
      completed_at: '2026-03-02T10:00:00Z',
      scheduled_at: '2026-03-01T10:00:00Z',
    }))).toBe('2026-03-02T10:00:00Z');
  });

  it('falls back to created_at when neither is set', () => {
    expect(activityTimestamp(a({ created_at: '2026-02-02T00:00:00Z' })))
      .toBe('2026-02-02T00:00:00Z');
  });
});

describe('sortActivitiesNewestFirst', () => {
  it('orders newest first', () => {
    const rows = [
      a({ id: 'old', completed_at: '2026-01-05T00:00:00Z' }),
      a({ id: 'new', completed_at: '2026-06-05T00:00:00Z' }),
      a({ id: 'mid', completed_at: '2026-03-05T00:00:00Z' }),
    ];
    expect(sortActivitiesNewestFirst(rows).map(r => r.id)).toEqual(['new', 'mid', 'old']);
  });

  it('places a future planned activity above a past completed one', () => {
    // This is the case that fails if you sort on completed_at alone: the
    // planned meeting sinks to the bottom instead of leading the timeline.
    const rows = [
      a({ id: 'done',    completed_at: '2026-01-01T00:00:00Z' }),
      a({ id: 'planned', scheduled_at: '2026-12-01T00:00:00Z' }),
    ];
    expect(sortActivitiesNewestFirst(rows).map(r => r.id)).toEqual(['planned', 'done']);
  });

  it('mixes completed, planned and bare rows on one axis', () => {
    const rows = [
      a({ id: 'bare',      created_at:   '2026-05-01T00:00:00Z' }),
      a({ id: 'completed', completed_at: '2026-07-01T00:00:00Z' }),
      a({ id: 'planned',   scheduled_at: '2026-06-01T00:00:00Z' }),
    ];
    expect(sortActivitiesNewestFirst(rows).map(r => r.id))
      .toEqual(['completed', 'planned', 'bare']);
  });

  it('does not mutate the array it was given', () => {
    // The caller holds this array in React state.
    const rows = [
      a({ id: 'a', completed_at: '2026-01-01T00:00:00Z' }),
      a({ id: 'b', completed_at: '2026-02-01T00:00:00Z' }),
    ];
    sortActivitiesNewestFirst(rows);
    expect(rows.map(r => r.id)).toEqual(['a', 'b']);
  });

  it('returns an empty array unchanged', () => {
    expect(sortActivitiesNewestFirst([])).toEqual([]);
  });
});

// ── Payload building ────────────────────────────────────────────────────────

import { buildActivityPayload } from './activitiesApi';
import type { ActivityDraft } from './activitiesApi';

const NOW = new Date('2026-08-26T12:00:00Z');
const draft = (over: Partial<ActivityDraft> = {}): ActivityDraft => ({
  subject: 'Discovery call',
  type: 'call',
  when: 'now',
  ...over,
});

describe('buildActivityPayload', () => {
  it('marks an activity that already happened as completed, with a completed_at', () => {
    const p = buildActivityPayload(draft({ when: 'now' }), NOW);
    expect(p.status).toBe('completed');
    expect(p.completed_at).toBe('2026-08-26T12:00:00.000Z');
    expect(p.scheduled_at).toBeUndefined();
  });

  it('marks a future activity as planned, with a scheduled_at and no completed_at', () => {
    // Setting both would make it undecidable whether it has happened.
    const p = buildActivityPayload(draft({ when: 'later', scheduledAt: '2026-09-01T14:30' }), NOW);
    expect(p.status).toBe('planned');
    expect(p.scheduled_at).toBe(new Date('2026-09-01T14:30').toISOString());
    expect(p.completed_at).toBeUndefined();
  });

  it('omits duration when the field was left blank', () => {
    // Number('') is 0. Sending it records a zero-minute call, which reads as
    // "we called and they did not pick up" rather than "we did not time it".
    const p = buildActivityPayload(draft({ duration: '' }), NOW);
    expect('duration' in p).toBe(false);
  });

  it('keeps a genuine zero duration', () => {
    const p = buildActivityPayload(draft({ duration: '0' }), NOW);
    expect(p.duration).toBe(0);
  });

  it('sends a numeric duration', () => {
    expect(buildActivityPayload(draft({ duration: '25' }), NOW).duration).toBe(25);
  });

  it('omits a non-numeric duration rather than sending NaN', () => {
    const p = buildActivityPayload(draft({ duration: 'twenty' }), NOW);
    expect('duration' in p).toBe(false);
  });

  it('treats whitespace-only text as absent', () => {
    // Otherwise the timeline renders an empty paragraph that looks like data.
    const p = buildActivityPayload(draft({ description: '   ', outcome: '\n\t' }), NOW);
    expect('description' in p).toBe(false);
    expect('outcome' in p).toBe(false);
  });

  it('trims text it does send', () => {
    const p = buildActivityPayload(draft({ subject: '  Intro call  ', description: ' notes ' }), NOW);
    expect(p.subject).toBe('Intro call');
    expect(p.description).toBe('notes');
  });

  it('omits direction for a type that has none', () => {
    const p = buildActivityPayload(draft({ type: 'note' }), NOW);
    expect('direction' in p).toBe(false);
  });

  it('never sends a parent — that is the caller\'s, and exactly one is allowed', () => {
    const p = buildActivityPayload(draft(), NOW);
    expect('contact_id' in p).toBe(false);
    expect('deal_id' in p).toBe(false);
  });
});
