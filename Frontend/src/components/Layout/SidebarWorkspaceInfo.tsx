import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { fetchWorkspace, fetchDataHealth } from '../../utils/workspaceApi';
import type { DataHealth } from '../../utils/workspaceApi';

/**
 * The sidebar's workspace caption and "Data integrity" card — REAL as of Group
 * B item 13 (approved 2026-10-05). Both were suppressed in Phase 1 because
 * nothing backed them:
 *   - the caption now shows the workspace's NAME only (v1 — the frame's region,
 *     "INDIA & MEA", has no field and is not invented);
 *   - the card replaced a fixed sentence claiming every screen labels its data
 *     with COUNTS from GET /workspace/data-health — demo rows, test rows hidden,
 *     deals with no account, leads with no owner. Each line is a number from
 *     the database; a line with nothing to say is left out, and a failed load
 *     says so instead of implying all is well.
 */

export const CaptionSlot: React.FC<{ name: string | null }> = ({ name }) =>
  name ? <p className="truncate px-2.5 pb-3 text-xs font-semibold uppercase leading-[18px] text-ink-secondary" data-testid="workspace-caption">{name}</p> : null;

export function integrityLines(h: DataHealth): string[] {
  const lines: string[] = [];
  const demo = [
    h.deals_seed ? `${h.deals_seed} of ${h.deals} deals` : null,
    h.accounts_seed ? `${h.accounts_seed} of ${h.accounts} accounts` : null,
    h.leads_seed ? `${h.leads_seed} of ${h.leads} leads` : null,
    h.contacts_seed ? `${h.contacts_seed} of ${h.contacts} contacts` : null,
  ].filter(Boolean);
  if (demo.length) lines.push(`Demo data: ${demo.join(', ')}.`);
  if (h.deals_without_account) lines.push(`${h.deals_without_account} of ${h.deals} deals have no account.`);
  if (h.leads_unassigned) lines.push(`${h.leads_unassigned} of ${h.leads} leads have no owner.`);
  if (h.deals_test_hidden) lines.push(`${h.deals_test_hidden} test deal${h.deals_test_hidden === 1 ? '' : 's'} hidden from views.`);
  if (!lines.length) lines.push('No demo data, every deal has an account and every lead has an owner.');
  return lines;
}

const SidebarWorkspaceInfo: React.FC<{ part: 'caption' | 'card' }> = ({ part }) => {
  const [name, setName] = useState<string | null>(null);
  const [health, setHealth] = useState<DataHealth | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    if (part === 'caption') {
      fetchWorkspace().then(w => { if (live) setName(w.name || null); }).catch(() => { /* no caption rather than a guessed one */ });
    } else {
      fetchDataHealth().then(h => { if (live) setHealth(h); }).catch(() => { if (live) setFailed(true); });
    }
    return () => { live = false; };
  }, [part]);

  if (part === 'caption') return <CaptionSlot name={name} />;

  return (
    <section aria-label="Data integrity" className="flex flex-col gap-1.5 rounded-card border border-line bg-surface-panel p-3" data-testid="data-integrity">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" /> Data integrity
      </h2>
      {failed && <p className="text-xs leading-[18px] text-danger-700">The data checks could not load.</p>}
      {!failed && !health && <p className="text-xs leading-[18px] text-ink-muted" role="status">Checking…</p>}
      {health && (
        <ul className="flex flex-col gap-1">
          {integrityLines(health).map(l => <li key={l} className="text-xs leading-[18px] text-ink-muted">{l}</li>)}
        </ul>
      )}
    </section>
  );
};

export default SidebarWorkspaceInfo;
