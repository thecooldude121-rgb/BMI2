import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { fetchReports, type SavedReport } from '../../utils/reportsApi';

/**
 * THE WORKSPACE'S REAL SAVED REPORTS, linked BY ID to Report Detail
 * (reports replay step e).
 *
 * The built-in report cards below this section keep their View controls
 * "coming soon" until step g gives each of their numbers ONE implementation;
 * this list is the only way into Report Detail. Without it the new route would
 * be reachable only by a typed URL (lesson 5).
 *
 * A failed load is an error, never an empty list: "you have none" and "we could
 * not ask" are different facts.
 */
const whose = (r: SavedReport): { label: string; tone: 'brand' | 'neutral' | 'warning' } => {
  if (r.ownerless) return { label: r.owner_id === null ? 'No owner' : 'Owner deactivated', tone: 'warning' };
  if (r.abilities.can_share) return { label: 'Yours', tone: 'brand' };
  return { label: r.abilities.can_edit ? 'Shared with you · can edit' : 'Shared with you', tone: 'neutral' };
};

const SavedReportsSection: React.FC<{ onBuild?: () => void }> = ({ onBuild }) => {
  const [reports, setReports] = useState<SavedReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchReports()
      .then(list => { if (!cancelled) setReports(list); })
      .catch((e: Error) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="mb-8 flex flex-col gap-3" aria-labelledby="saved-reports-heading" data-testid="saved-reports">
      <h2 id="saved-reports-heading" className="text-xl font-semibold leading-7 text-ink-heading">Saved reports</h2>

      {error && (
        <EmptyState tone="error" title="Couldn't load your saved reports" reason={error} />
      )}

      {!error && reports === null && <p className="text-sm text-ink-muted" role="status">Loading saved reports…</p>}

      {!error && reports?.length === 0 && (
        <EmptyState
          title="No saved reports yet"
          reason="Reports you build and save, and reports others share with you, appear here."
          action={onBuild ? <Button onClick={onBuild}>Build a report</Button> : undefined}
        />
      )}

      {!error && reports && reports.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {reports.map(r => {
            const w = whose(r);
            return (
              <li key={r.id}>
                <Link
                  to={`/crm/reports/${encodeURIComponent(r.id)}`}
                  className="flex h-full flex-col gap-1 rounded-card border border-line bg-surface-panel p-4 hover:border-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 text-base font-semibold text-ink">{r.name}</span>
                    <span className="flex shrink-0 gap-1">
                      {r.status === 'draft' && <Badge tone="warning">Draft</Badge>}
                      <Badge tone={w.tone}>{w.label}</Badge>
                    </span>
                  </span>
                  {r.description && <span className="line-clamp-2 text-xs text-ink-muted">{r.description}</span>}
                  <span className="text-xs text-ink-muted">
                    {r.category ?? 'Uncategorised'}
                    {r.owner_name && !r.abilities.can_share ? ` · Owner: ${r.owner_name}` : ''}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default SavedReportsSection;
