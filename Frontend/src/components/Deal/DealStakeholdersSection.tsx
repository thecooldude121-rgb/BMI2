import React from 'react';
import { Building2, Mail, Phone, Plus, ExternalLink, UserPlus } from 'lucide-react';
import { findContactRole } from '../../config/contactRoles';

/**
 * The People tab: the account this deal belongs to, and the buying committee
 * recorded on the deal.
 *
 * REPLACES `DealAccountContacts`, which could not be fed real data. Its props
 * required an account with `revenue`, `fundingRound`, `growthRate`,
 * `hiringTrend`, `techStack` and `competitors`, and contacts with a required
 * `role` from a closed union plus `engagement: '92% response rate'`,
 * `engagementDots` and a seven-field `engagementBreakdown`. None of those has a
 * column, a provider, or a phase — the component's shape was derived from the
 * fabricated literal it was written against, so adapting real data to it would
 * have meant inventing the same fields again to satisfy the types.
 *
 * WHAT IS REAL HERE
 *   - The account: companies row joined on deals.company_id (migration 027).
 *   - The stakeholders: deals.stakeholders jsonb, written by the deal form.
 *
 * WHAT IS DELIBERATELY ABSENT
 *   - Engagement scores, response rates and "last contacted" — this product
 *     has no email or call tracking, so every one of those was invented.
 *   - Company enrichment (revenue, funding, growth, tech stack). No provider
 *     is configured and enrichment is out of phase.
 */

export interface DealStakeholder {
  id: string;
  name: string;
  title: string;
  email: string;
  /** Stored role id, or null when the deal form saved no role. */
  role: string | null;
  isPrimary: boolean;
}

export interface DealAccountSummary {
  id: string;
  /** True when deals.company_id resolves to a company in this workspace. */
  linked: boolean;
  name: string;
  industry: string;
  website: string;
  domain: string;
  size: string;
  location: string;
}

interface Props {
  account: DealAccountSummary;
  stakeholders: DealStakeholder[];
  onViewAccount: () => void;
  onAddStakeholder: () => void;
  onEmail: (to: string, subject: string, body: string) => void;
}

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?';

const CHIP: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  green:  'bg-green-50 text-green-700 border-green-200',
  amber:  'bg-amber-50 text-amber-700 border-amber-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray:   'bg-gray-50 text-gray-600 border-gray-200',
  red:    'bg-red-50 text-red-700 border-red-200',
};

const RoleChip: React.FC<{ role: string | null }> = ({ role }) => {
  // findContactRole, not getContactRole: the latter falls back to Champion for
  // an unknown id, which would label an unassigned stakeholder as the deal's
  // champion. An unset role is a real state and is shown as one.
  const cfg = findContactRole(role);
  if (!cfg) {
    return (
      <span className="text-xs px-1.5 py-0.5 rounded border border-dashed border-gray-300 text-gray-400 font-medium">
        No role set
      </span>
    );
  }
  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded border font-medium ${CHIP[cfg.chipColor] ?? CHIP.gray}`}
      title={cfg.description}
    >
      {cfg.label}
    </span>
  );
};

const DealStakeholdersSection: React.FC<Props> = ({
  account, stakeholders, onViewAccount, onAddStakeholder, onEmail,
}) => (
  <div className="space-y-6">

    {/* ── Account ─────────────────────────────────────────────────────────── */}
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Account</h2>

      {account.linked ? (
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">{account.name}</span>
              {account.industry && (
                <span className="text-xs text-gray-500">{account.industry}</span>
              )}
            </div>
            <dl className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-xs">
              {account.size && (
                <div><dt className="text-gray-400">Size</dt><dd className="text-gray-700">{account.size}</dd></div>
              )}
              {account.location && (
                <div><dt className="text-gray-400">Location</dt><dd className="text-gray-700">{account.location}</dd></div>
              )}
              {account.website && (
                <div>
                  <dt className="text-gray-400">Website</dt>
                  <dd>
                    <a href={account.website} target="_blank" rel="noopener noreferrer"
                       className="text-indigo-600 hover:text-indigo-700">
                      {account.website.replace(/^https?:\/\//, '')}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
          <button
            onClick={onViewAccount}
            className="text-xs border border-gray-300 text-gray-700 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center gap-1 flex-shrink-0"
          >
            View account <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      ) : (
        /* Not an error and not an empty database — the deal simply is not
           linked to an account yet. deals.company_id is new (migration 027) and
           22 of 25 deals carry no link, so this is the common case. The
           free-text company name is shown because for an unlinked deal it is
           the only record of who the deal is with, and labelled so it cannot be
           mistaken for a resolved account. */
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="text-sm text-gray-700">
            {account.name
              ? <>This deal is not linked to an account. It records the company name{' '}
                  <span className="font-medium text-gray-900">&ldquo;{account.name}&rdquo;</span> as free text.</>
              : <>This deal is not linked to an account, and records no company name.</>}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Linking it to an account is done from the deal edit form. Until then
            it will not appear under any account&rsquo;s related deals.
          </p>
        </div>
      )}
    </section>

    {/* ── Buying committee ────────────────────────────────────────────────── */}
    <section className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">
          Stakeholders
          {stakeholders.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-400">{stakeholders.length}</span>
          )}
        </h2>
        <button
          onClick={onAddStakeholder}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          <Plus className="h-3.5 w-3.5" /> Add stakeholder
        </button>
      </div>

      {stakeholders.length === 0 ? (
        <div className="text-center py-8">
          <UserPlus className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No stakeholders recorded on this deal.</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Stakeholders and their buying roles are saved on the deal edit form.
            Recording who the champion and the decision maker are is what drives
            the committee coverage below.
          </p>
          <button
            onClick={onAddStakeholder}
            className="mt-3 text-xs bg-indigo-600 text-white rounded px-3 py-1.5 hover:bg-indigo-700 font-medium"
          >
            Add the first stakeholder
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {stakeholders.map(s => (
            <li key={s.id} className="py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                {initialsOf(s.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{s.name || 'Unnamed'}</span>
                  {s.isPrimary && (
                    <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">Primary</span>
                  )}
                  <RoleChip role={s.role} />
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                  {s.title && <span>{s.title}</span>}
                  {s.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />{s.email}
                    </span>
                  )}
                </div>
              </div>
              {s.email && (
                <button
                  onClick={() => onEmail(s.email, '', '')}
                  className="text-xs border border-gray-300 text-gray-700 rounded px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1 flex-shrink-0"
                >
                  <Mail className="h-3 w-3" /> Email
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* No phone action: stakeholders carry a name, a title, an email and a
          role, and nothing else. A Call button with no number behind it is a
          dead control. */}
      {stakeholders.some(s => !s.email) && (
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <Phone className="h-3 w-3" />
          Some stakeholders have no email recorded.
        </p>
      )}
    </section>
  </div>
);

export default DealStakeholdersSection;
