import React, { useEffect, useState } from 'react';
import { Radar, AlertCircle, Briefcase, TrendingUp, Cpu, UserCheck, Newspaper } from 'lucide-react';
import {
  fetchAccountIntelligence, type AccountIntelligence, type AccountSignal, type SignalCategory,
} from '../../utils/accountIntelligenceApi';

/**
 * ACCOUNT INTELLIGENCE PANEL — Capability 5, against the MOCK provider.
 *
 * ─── THIS IS PLACEHOLDER DEBT, AND IT MUST COME OUT ────────────────────────
 *
 * Every item this renders today is sample content from
 * `services/accountIntelligence/mockProvider.ts`. Lead Gen, which will supply
 * the real signals, DOES NOT EXIST AS A RUNNING SERVICE (Venkat, 2026-09-14) —
 * a comment on `feature/lead-gen-account-intelligence` says otherwise and
 * overstates what was verified. A second, more complete implementation lives on
 * that branch; the two are to be reconciled. See CLAUDE.md.
 *
 * ─── WHY THE LABEL IS ON EVERY ROW AND NOT JUST THE PANEL ──────────────────
 *
 * The house convention for an unbuilt panel is a `PREVIEW · SAMPLE CONTENT`
 * badge, and that is here. But news is not a metric: a fake number misleads
 * inside the app, while a fake headline gets screenshotted, pasted into Slack
 * and repeated — the badge does not travel with it. So the placeholder-ness is
 * defended in four places that fail independently: the badge, the explanatory
 * note, the word "Sample" inside each headline (server-side), and the absent
 * source/date/link that would otherwise make an item look sourced.
 *
 * ─── FOUR EMPTY STATES, NOT ONE ────────────────────────────────────────────
 *
 * "Loading", "this account has no domain to look up", "the request failed" and
 * "we asked and there is nothing recorded" are four different facts. Only the
 * last means the account has no signals. Rendering one blank list for all four
 * is how an absence becomes a false statement — the same reasoning as
 * ForecastPage's "Not visible" vs "Not set".
 */

const CATEGORY_META: Record<SignalCategory, { label: string; Icon: typeof Radar }> = {
  news: { label: 'News', Icon: Newspaper },
  hiring: { label: 'Hiring', Icon: Briefcase },
  funding: { label: 'Funding', Icon: TrendingUp },
  tech_change: { label: 'Tech change', Icon: Cpu },
  exec_move: { label: 'Exec move', Icon: UserCheck },
};

interface Props {
  /** The company whose signals to show. No default: a defaulted id is a lookup nobody asked for. */
  companyId: string;
}

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <section
    className="bg-white rounded-lg border border-gray-200 p-5"
    aria-label="Account intelligence"
    data-testid="account-intelligence-panel"
  >
    <div className="flex items-center gap-2 mb-3">
      <Radar className="h-4 w-4 text-gray-400" aria-hidden="true" />
      <h3 className="text-[15px] font-semibold text-gray-900">Account intelligence</h3>
    </div>
    {children}
  </section>
);

const Muted: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[12px] text-gray-500">{children}</p>
);

export const AccountIntelligencePanel: React.FC<Props> = ({ companyId }) => {
  const [data, setData] = useState<AccountIntelligence | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAccountIntelligence(companyId).then(r => {
      if (cancelled) return;
      if (r.ok) { setData(r.data); setFailure(null); }
      // A transport failure is NOT an empty result, so it never sets `data`.
      else { setData(null); setFailure(r.detail); }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [companyId]);

  if (loading) return <Shell><Muted>Loading…</Muted></Shell>;

  if (failure || data?.status === 'error') {
    return (
      <Shell>
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-[12px] text-amber-900">
            Couldn&rsquo;t load signals for this account right now.
            <span className="block text-amber-700 mt-0.5">
              {failure ?? (data as AccountIntelligence).detail ?? 'The provider did not answer.'}
            </span>
          </p>
        </div>
      </Shell>
    );
  }

  if (!data) return <Shell><Muted>Nothing to show.</Muted></Shell>;

  if (data.status === 'no_domain') {
    return (
      <Shell>
        <Muted>
          {data.detail ?? 'This account has no website domain recorded, so there is nothing to look up.'}
          {' '}Add a domain on the account to enable this panel.
        </Muted>
      </Shell>
    );
  }

  if (data.signals.length === 0) {
    // The ONLY state that means "this account has no signals".
    return (
      <Shell>
        <Muted>No signals are recorded for {data.company_domain ?? 'this account'}.</Muted>
      </Shell>
    );
  }

  return (
    <Shell>
      {data.preview && (
        <div className="mb-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2">
          <span className="inline-block rounded-full bg-gray-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Preview · sample content
          </span>
          <p className="mt-1.5 text-[11px] leading-relaxed text-gray-600">
            {data.preview_note}
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {data.signals.map((s: AccountSignal, i: number) => {
          const meta = CATEGORY_META[s.category] ?? { label: s.category, Icon: Radar };
          const { Icon } = meta;
          return (
            <li key={`${s.category}-${i}`} className="flex items-start gap-2.5">
              <Icon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                    {meta.label}
                  </span>
                  <span className="text-[13px] font-medium text-gray-900">{s.headline}</span>
                </div>
                <p className="text-[12px] text-gray-600 mt-0.5">{s.summary}</p>
                {/*
                  * Source, date and link render ONLY when the provider supplied
                  * them. The mock supplies none, so nothing here appears — an
                  * item with an outlet and a date would read as sourced
                  * reporting, which is exactly what sample content must not do.
                  */}
                {(s.source || s.published_at) && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {[s.source, s.published_at].filter(Boolean).join(' · ')}
                  </p>
                )}
                {s.url && (
                  <a
                    href={s.url} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] text-indigo-600 hover:text-indigo-700"
                  >
                    Read more
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
};

export default AccountIntelligencePanel;
