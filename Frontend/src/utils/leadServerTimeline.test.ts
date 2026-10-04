import { describe, it, expect } from 'vitest';
import { buildServerTimeline, stageLabel } from './leadServerTimeline';
import type { LeadStageHistoryRow } from './leadsApi';

const row = (o: Partial<LeadStageHistoryRow>): LeadStageHistoryRow => ({
  id: 'h', lead_id: 1, from_stage: 'new', to_stage: 'engaged', qualification_override: false,
  unmet_criteria: null, reason: null, changed_by_user_id: null, changed_by_name: null,
  changed_at: '2026-10-02T00:00:00Z', ...o,
});

describe('buildServerTimeline', () => {
  it('uses the history creation row instead of a second "Lead created" entry', () => {
    const items = buildServerTimeline({ created_at: '2026-10-01T00:00:00Z', source: 'Website' },
      [row({ id: 'c', from_stage: null, to_stage: 'new', changed_at: '2026-10-01T00:00:00Z' })], []);
    expect(items.filter(i => i.kind === 'created')).toHaveLength(1);
    expect(items[0].title).toBe('Lead created as New');
  });

  it('falls back to created_at for a lead that predates stage history', () => {
    const items = buildServerTimeline({ created_at: '2026-10-01T00:00:00Z', source: 'Manual' }, [], []);
    expect(items).toEqual([expect.objectContaining({ kind: 'created', title: 'Lead created', detail: 'Source: Manual' })]);
  });

  it('orders newest first across sources, and skips an activity with no time at all', () => {
    const items = buildServerTimeline({ created_at: '2026-09-01T00:00:00Z', source: '' },
      [row({ id: 's', changed_at: '2026-10-02T00:00:00Z' })],
      [{ id: 'a', type: 'call', subject: 'Call', completed_at: '2026-10-03T00:00:00Z' }, { id: 'b', type: 'note', subject: 'x' }]);
    expect(items.map(i => i.id)).toEqual(['activity-a', 'stage-s', 'created']);
  });

  it('marks an override and names the unmet criteria', () => {
    const [item] = buildServerTimeline({ created_at: '', source: '' },
      [row({ qualification_override: true, unmet_criteria: ['company'], to_stage: 'qualified', reason: 'r' })], []);
    expect(item.override).toBe(true);
    expect(item.detail).toBe('Qualification gate overridden (unmet: company) · Reason: r');
  });

  it('stageLabel shows DB "contacted" as the UI\'s "Attempting contact"', () => {
    expect(stageLabel('contacted')).toBe('Attempting contact');
    expect(stageLabel('sales_accepted')).toBe('Sales accepted');
    expect(stageLabel(null)).toBe('—');
  });
});
