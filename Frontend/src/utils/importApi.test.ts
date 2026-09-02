import { describe, it, expect } from 'vitest';
import { mergeSummaries, spliceResults, localOnlySummary, type ImportSummary, type RowResult } from './importApi';

const summary = (rows: RowResult[], dry = false): ImportSummary => ({
  dry_run: dry,
  total: rows.length,
  created: rows.filter(r => r.status === 'created').length,
  skipped: rows.filter(r => r.status === 'skipped').length,
  failed: rows.filter(r => r.status === 'failed').length,
  rows,
});

describe('mergeSummaries', () => {
  // The chunk-boundary case, proven against a real 620-row file: a row at local
  // index 19 of chunk 2 is row 519 of the file, not row 19.
  it('shifts each chunk\'s indices by its offset', () => {
    const a = summary([{ index: 10, status: 'failed', reason: 'bad' }]);
    const b = summary([{ index: 19, status: 'failed', reason: 'bad' }]);
    expect(mergeSummaries([a, b], 500).rows.map(r => r.index)).toEqual([10, 519]);
  });

  it('sums the counts across chunks', () => {
    const a = summary([{ index: 0, status: 'created', id: 'CT1' }]);
    const b = summary([{ index: 0, status: 'skipped', reason: 'dup' },
                       { index: 1, status: 'failed', reason: 'bad' }]);
    const m = mergeSummaries([a, b], 500);
    expect([m.total, m.created, m.skipped, m.failed]).toEqual([3, 1, 1, 1]);
  });

  it('is a dry run only when every chunk was', () => {
    expect(mergeSummaries([summary([], true), summary([], true)], 500).dry_run).toBe(true);
    expect(mergeSummaries([summary([], true), summary([], false)], 500).dry_run).toBe(false);
  });
});

describe('spliceResults', () => {
  // Rows held back locally are not sent, so server indices refer to a subset.
  it('translates server indices back through sentIndices', () => {
    const server = summary([
      { index: 0, status: 'created', id: 'CT1' },
      { index: 1, status: 'created', id: 'CT2' },
    ]);
    const out = spliceResults(server, [0, 2], [
      { index: 1, status: 'skipped', reason: 'dup in file' },
    ]);
    expect(out.rows.map(r => r.index)).toEqual([0, 1, 2]);
    expect(out.rows[1].reason).toBe('dup in file');
    expect(out.rows[2].id).toBe('CT2');
  });

  it('recomputes totals over both sources', () => {
    const server = summary([{ index: 0, status: 'created', id: 'CT1' }]);
    const out = spliceResults(server, [0], [{ index: 1, status: 'skipped', reason: 'dup' }]);
    expect([out.total, out.created, out.skipped, out.failed]).toEqual([2, 1, 1, 0]);
  });

  it('restores the file\'s row order regardless of input order', () => {
    const server = summary([{ index: 0, status: 'created', id: 'CT1' }]);
    const out = spliceResults(server, [5], [
      { index: 9, status: 'skipped', reason: 'd' },
      { index: 1, status: 'skipped', reason: 'd' },
    ]);
    expect(out.rows.map(r => r.index)).toEqual([1, 5, 9]);
  });

  // The 620-row shape end to end: one held-back duplicate at file row 549
  // (index 549), everything else sent across two chunks.
  it('keeps indices correct when splicing into a chunk-merged summary', () => {
    const sent: number[] = [];
    for (let i = 0; i < 620; i++) if (i !== 549) sent.push(i);

    // Server saw 619 rows; the bad one at file index 519 is payload index 519
    // (nothing was removed before it).
    const merged = summary([{ index: 519, status: 'failed', reason: 'bad email' }]);
    const out = spliceResults(merged, sent, [
      { index: 549, status: 'skipped', reason: 'dup in file' },
    ]);
    expect(out.rows.map(r => r.index)).toEqual([519, 549]);
  });

  it('shifts indices after a removed row, not before it', () => {
    // Held back index 1, so payload index 1 is file index 2.
    const server = summary([
      { index: 0, status: 'created', id: 'A' },
      { index: 1, status: 'created', id: 'B' },
    ]);
    const out = spliceResults(server, [0, 2], [{ index: 1, status: 'skipped', reason: 'd' }]);
    expect(out.rows.find(r => r.id === 'B')!.index).toBe(2);
  });
});

describe('localOnlySummary', () => {
  it('reports a file resolved entirely without the server', () => {
    const out = localOnlySummary(true, [
      { index: 1, status: 'skipped', reason: 'd' },
      { index: 0, status: 'skipped', reason: 'd' },
    ]);
    expect(out.rows.map(r => r.index)).toEqual([0, 1]);
    expect([out.total, out.created, out.skipped]).toEqual([2, 0, 2]);
    expect(out.dry_run).toBe(true);
  });
});
