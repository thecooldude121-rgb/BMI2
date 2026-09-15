import React from 'react';
import {
  Radar, ExternalLink, AlertCircle, Briefcase, TrendingUp, Cpu, UserCheck, Newspaper,
} from 'lucide-react';
import type { AccountIntelligence, AccountSignal } from '../../utils/accountIntelligenceApi';
import { formatDisplayDate } from '../../utils/dateUtils';

/**
 * Account intelligence from Lead Gen — Capability 5 of the AI Agent
 * Intelligence Layer.
 *
 * EVERY ROW HERE COMES FROM LEAD GEN OVER HTTP. Nothing is derived, scored or
 * inferred, and there are no defaults in this component's signature — the
 * reason being the history documented at the top of EnhancedAccountDetailView:
 * this page previously rendered invented health scores, engagement percentages
 * and a fabricated activity timeline, some of it supplied by component defaults
 * rather than by the call site, which is a fabrication you cannot see from the
 * page. If Lead Gen sends nothing, this renders nothing.
 *
 * THE FOUR EMPTY STATES ARE NOT THE SAME EMPTY STATE. "Not connected", "no
 * domain on this account", "the request failed" and "connected, asked, nothing
 * recorded" are four different facts, and only the last one means the account
 * has no signals. Rendering one blank list for all four is how an absence
 * becomes a false statement.
 */

interface Props {
  data: AccountIntelligence | null;
  loading: boolean;
  /** Transport failure from the caller, distinct from data.status === 'error'. */
  error: string | null;
}

const CATEGORY_META: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  hiring:      { label: 'Hiring',      icon: Briefcase,  className: 'bg-blue-50 text-blue-700 border-blue-200' },
  funding:     { label: 'Funding',     icon: TrendingUp, className: 'bg-green-50 text-green-700 border-green-200' },
  tech_change: { label: 'Tech change', icon: Cpu,        className: 'bg-purple-50 text-purple-700 border-purple-200' },
  exec_move:   { label: 'Exec move',   icon: UserCheck,  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  news:        { label: 'News',        icon: Newspaper,  className: 'bg-gray-50 text-gray-700 border-gray-200' },
};

/**
 * An unrecognised category still renders, labelled with whatever Lead Gen sent.
 * Lead Gen owns that vocabulary and can add to it without this page shipping
 * first; dropping the row, or mislabelling it as News, would be worse than
 * showing an unfamiliar word.
 */
function categoryMeta(category: string | null) {
  if (category && CATEGORY_META[category]) return CATEGORY_META[category];
  return {
    label: category ?? 'Signal',
    icon: Newspaper,
    className: 'bg-gray-50 text-gray-700 border-gray-200',
  };
}

const SignalRow: React.FC<{ signal: AccountSignal }> = ({ signal }) => {
  const meta = categoryMeta(signal.category);
  const Icon = meta.icon;

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium flex-shrink-0 ${meta.className}`}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-900">{signal.headline}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
            {/* Only rendered when there is a date. No "recently" placeholder. */}
            {signal.published_at && <span>{formatDisplayDate(signal.published_at)}</span>}
            {signal.source && <span className="text-gray-400">via {signal.source}</span>}
            {signal.url && (
              <a
                href={signal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Source <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </li>
  );
};

const Shell: React.FC<{ children: React.ReactNode; count?: number }> = ({ children, count }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
      <Radar className="h-5 w-5 text-indigo-600" />
      Account Intelligence
      {count !== undefined && <span className="text-sm font-normal text-gray-400">{count}</span>}
    </h2>
    {children}
  </div>
);

const AccountIntelligencePanel: React.FC<Props> = ({ data, loading, error }) => {
  if (loading) {
    return (
      <Shell>
        <div className="space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />)}
        </div>
      </Shell>
    );
  }

  // Transport failure, or an upstream failure Lead Gen reported.
  if (error || data?.status === 'error') {
    const message = error ?? (data?.status === 'error' ? data.message : null);
    return (
      <Shell>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Couldn't load account intelligence right now.</p>
            {message && <p className="mt-1">{message}</p>}
            <p className="mt-1 text-red-600">
              This does not mean there are no signals — the request did not complete.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  if (!data || data.status === 'not_linked') {
    return (
      <Shell>
        <div className="text-center py-8">
          <Radar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Lead Gen is not connected to this workspace.</p>
          <p className="text-xs text-gray-500 mt-1">
            Connect it under Settings &rsaquo; Connected Modules to see hiring,
            funding, tech changes, exec moves and news for this account here.
          </p>
        </div>
      </Shell>
    );
  }

  if (data.status === 'no_domain') {
    return (
      <Shell>
        <div className="text-center py-8">
          <Radar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">This account has no website domain recorded.</p>
          <p className="text-xs text-gray-500 mt-1">
            Account intelligence is matched on the company's domain. Add one on
            the account to see signals here.
          </p>
        </div>
      </Shell>
    );
  }

  if (data.signals.length === 0) {
    return (
      <Shell count={0}>
        <div className="text-center py-8">
          <Radar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">
            Lead Gen has no signals recorded for{' '}
            {data.company_domain ? <span className="font-medium">{data.company_domain}</span> : 'this account'}.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Hiring, funding, tech changes, exec moves and news appear here as
            Lead Gen records them.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell count={data.signals.length}>
      {/* Newest first, as Lead Gen and the client both already order them. */}
      <ul className="divide-y divide-gray-100">
        {data.signals.map(signal => <SignalRow key={signal.id} signal={signal} />)}
      </ul>
      {data.company_domain && (
        <p className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
          From Lead Gen, matched on {data.company_domain}.
        </p>
      )}
    </Shell>
  );
};

export default AccountIntelligencePanel;
