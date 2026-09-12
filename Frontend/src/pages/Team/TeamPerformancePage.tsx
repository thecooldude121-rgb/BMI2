import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Target, Trophy, Search, Download, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTeamPerformance, MemberPerformance } from '../../hooks/useTeamPerformance';

/**
 * Team Performance — now computed from the workspace, not from a fixture.
 *
 * WHAT THIS REPLACES. Until now the page held `TEAM_MEMBERS`, five invented
 * members carrying invented emails (`@bmi.com`, where the real workspace is
 * `@bmicrm.com`), invented job titles, and an invented reporting line in which
 * "Sarah Chen" managed two people and reported to "John Smith" — a name that
 * was never a user in this workspace at all. cd667e2 blanked the NUMBERS to
 * "—" but left that roster and its relationships rendering, so the page still
 * asserted an org chart that did not exist.
 *
 * The roster, the reporting line and every figure now come from
 * `useTeamPerformance`, which reads GET /users, GET /deals and GET /quotas.
 * There is no fixture in this file and no fallback literal: where a number is
 * unknown the UI says so in words.
 *
 * ALSO DELETED, and worth naming because neither was a number:
 *   - The "View as: CEO / VP / Manager / Rep / Admin / Analyst / Support"
 *     switcher, with `ROLE_SCOPES` and `getVisibleMembers()`. It SIMULATED
 *     access control that does not exist — its Manager branch filtered on the
 *     hardcoded string 'Sarah Chen', and its Support branch rendered an
 *     "Access Restricted" page. A fake permission boundary is worse than none:
 *     it invites the reader to believe scoping has been thought about. Real
 *     RBAC is enforced at the API, and this page shows what the API returns.
 *   - `handleExport`'s `alert('Exporting team performance report...')`. A dead
 *     button beside real data is worse than beside blanks, so it now exports
 *     the rows actually on screen.
 */
export default function TeamPerformancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    members, totals, unattributed, loading, error, truncated, period, reload,
  } = useTeamPerformance();

  const [searchTerm, setSearchTerm]     = useState('');
  const [roleFilter, setRoleFilter]     = useState('All Roles');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  const money = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000   ? `$${Math.round(n / 1_000)}K`
    : `$${n}`;

  /*
   * Role options come from the roster that is actually loaded, so the filter
   * can never offer a role nobody holds — the old list named four invented
   * titles ("Sales Director") that matched nothing in `users.role`.
   */
  const roleOptions = Array.from(new Set(members.map(r => r.member.role))).sort();

  const filtered = members.filter(({ member }) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q
      || member.name.toLowerCase().includes(q)
      || member.email.toLowerCase().includes(q)
      || member.role.toLowerCase().includes(q);
    const matchesRole   = roleFilter === 'All Roles' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'All Status'
      || member.status === statusFilter.toLowerCase();
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleExport = () => {
    /*
     * Exports exactly what is on screen, including the blanks — an empty cell
     * stays empty in the CSV rather than becoming a 0, so the file cannot
     * assert a quota or a win rate that was never entered.
     */
    const head = ['Member', 'Email', 'Role', 'Reports to', 'Status',
                  'Open deals', 'Open pipeline', 'Won deals', 'Won value',
                  `Quota (${period})`, 'Attainment %', 'Win rate %'];
    const cell = (v: string | number | null) =>
      v == null ? '' : `"${String(v).replace(/"/g, '""')}"`;
    const rows = filtered.map(r => [
      r.member.name, r.member.email, r.member.role, r.member.managerName, r.member.status,
      r.openCount, r.openValue, r.wonCount, r.wonValue,
      r.quota, r.attainment, r.winRate,
    ].map(cell).join(','));

    const blob = new Blob([[head.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `team-performance-${period.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** A stat card. `value` of null renders the reason, never a zero. */
  const Stat = ({ icon, label, value, caption }: {
    icon: React.ReactNode; label: string; value: string | null; caption: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
      </div>
      {value == null
        ? <div className="text-2xl font-bold text-slate-300 mb-1">—</div>
        : <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>}
      <div className="text-xs text-slate-400">{caption}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-8">

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Team Performance</h1>
                <p className="text-slate-600 text-sm">
                  {loading ? 'Loading…' : `${totals.headcount} ${totals.headcount === 1 ? 'person' : 'people'} · quota period ${period}`}
                </p>
              </div>
            </div>
            <button
              onClick={reload}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Backend unreachable is a different fact from an empty workspace. */}
        {error && (
          <div role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error} The figures below are incomplete.
          </div>
        )}

        {/*
          A sum computed from a truncated list is a lower bound, and saying so is
          the whole point of the flag — an understated pipeline next to a real
          person's name is the same class of untruth as an invented one.
        */}
        {truncated && (
          <div role="alert" className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            More deals exist than were loaded, so every total below is a lower bound.
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Stat
            icon={<Users className="w-5 h-5 text-blue-600" />}
            label="Team Size"
            value={loading ? null : String(totals.headcount)}
            caption="From your workspace roster"
          />
          <Stat
            icon={<TrendingUp className="w-5 h-5 text-green-600" />}
            label="Open Deals"
            value={loading ? null : String(totals.openCount)}
            caption="Owned by a named user"
          />
          <Stat
            icon={<Target className="w-5 h-5 text-blue-600" />}
            label="Open Pipeline"
            value={loading ? null : money(totals.openValue)}
            caption="Sum of open deal values"
          />
          <Stat
            icon={<Trophy className="w-5 h-5 text-yellow-600" />}
            label="Team Win Rate"
            value={loading || totals.winRate == null ? null : `${totals.winRate}%`}
            caption={totals.winRate == null ? 'No deals closed yet' : 'Won / closed deals'}
          />
          {/*
            QUOTA IS THE ONE CARD THAT MUST NOT SHOW A ZERO. `quotas` has no
            rows for this period, so the honest answer is that no target has
            been entered — not "$0", which reads as a target of nothing, and not
            "0%", which reads as total failure against one.
          */}
          <Stat
            icon={<Target className="w-5 h-5 text-green-600" />}
            label="Quota Attainment"
            value={loading || totals.attainment == null ? null : `${totals.attainment}%`}
            caption={
              loading ? ''
              : totals.quota == null
                ? 'No quota entered for this period'
                : `${money(totals.wonValue)} won of ${money(totals.quota)} · ${totals.membersWithQuota} of ${totals.headcount} with a quota`
            }
          />
        </div>

        {/*
          DEALS THAT BELONG TO NOBODY, stated rather than quietly dropped.
          Without this the per-person rows would sum to far less than the Deals
          page shows, and nothing on screen would explain the gap. Two pages
          disagreeing with no explanation is the failure this project keeps
          hitting; naming the shortfall is the fix.
        */}
        {!loading && unattributed.count > 0 && (
          <div className="mb-6 rounded-lg border border-slate-300 bg-white p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-sm text-slate-700">
                <span className="font-semibold">
                  {unattributed.count} {unattributed.count === 1 ? 'deal' : 'deals'} worth {money(unattributed.value)} are not attributed to anyone
                </span>
                {' '}and are excluded from every per-person figure above and below.
                {unattributed.names.length > 0 && (
                  <>
                    {' '}They carry the owner {unattributed.names.length === 1 ? 'name' : 'names'}{' '}
                    {unattributed.names.map(n => `"${n}"`).join(', ')}, which
                    {unattributed.names.length === 1 ? ' does' : ' do'} not match a user in this workspace.
                  </>
                )}
                {' '}Assign them on the Deals page to include them here.
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handleExport}
              disabled={loading || filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>

            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  aria-label="Search team members"
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All Roles</option>
                {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Member', 'Role', 'Reports to', 'Open', 'Pipeline', 'Won', 'Win %', `Quota (${period})`, 'Status', ''].map((h, i) => (
                    <th key={h || i} className={`px-6 py-4 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                      i >= 3 && i <= 7 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading && (
                  <tr><td colSpan={10} className="px-6 py-10 text-center text-sm text-slate-500">Loading team…</td></tr>
                )}

                {/*
                  A real EmptyState, per the design system: it says WHY it is
                  empty. Reaching it means the roster came back with nobody in
                  it, which is a different thing from a failed request (handled
                  by the error banner above).
                */}
                {!loading && members.length === 0 && (
                  <tr><td colSpan={10} className="px-6 py-12 text-center">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
                    <p className="text-sm font-semibold text-slate-700">No people in this workspace yet</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Invite colleagues from Settings → Team to see their pipeline and quota here.
                    </p>
                  </td></tr>
                )}

                {!loading && members.length > 0 && filtered.length === 0 && (
                  <tr><td colSpan={10} className="px-6 py-12 text-center text-sm text-slate-500">
                    No member matches your search or filters.
                  </td></tr>
                )}

                {filtered.map((row: MemberPerformance) => {
                  const m = row.member;
                  const isMe = user != null && String(user.id) === String(m.id);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${m.avatarColor} rounded-lg flex items-center justify-center text-white font-semibold text-sm`}>
                            {m.initials}
                          </div>
                          <div>
                            <button
                              onClick={() => navigate(`/team/${m.id}`)}
                              className="font-semibold text-slate-800 hover:text-blue-600 transition-colors text-left"
                            >
                              {m.name || m.email}
                              {/* "(You)" from the session, not a hardcoded name. */}
                              {isMe && <span className="ml-2 text-xs text-slate-500">(You)</span>}
                            </button>
                            <div className="text-sm text-slate-500">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{m.role}</td>

                      {/*
                        The reporting line from `users.manager_id` (041). The
                        column is real but every row is currently NULL, so this
                        renders "Not set" — the honest state, and the one the
                        invented "Sarah Chen" hid. The name is the server's
                        tenant-matched `manager_name`, never resolved here.
                      */}
                      <td className="px-6 py-4 text-sm">
                        {m.managerId && m.managerName ? (
                          <button
                            onClick={() => navigate(`/team/${m.managerId}`)}
                            className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                          >
                            {m.managerName}
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      {/*
                        PLAIN TEXT, NOT A LINK, and deliberately so. The old
                        code linked this to `/deals?member=<name>` — two
                        separate defects: `/deals` is not a route at all (deals
                        live at `/crm/deals`, the same mistake as the
                        `/dashboard` vs `/crm/dashboard` miss in CLAUDE.md
                        lesson 5), and `DealsKanbanPage` reads NO query
                        parameters, so even the correct path would have shown
                        every deal in the workspace while appearing to show this
                        person's. A count that navigates somewhere unfiltered is
                        a link that lies. It becomes a link when the Deals page
                        can filter by owner.
                      */}
                      <td className="px-6 py-4 text-right text-sm text-slate-700">
                        {row.openCount > 0 ? row.openCount : <span className="text-slate-400">0</span>}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-700">
                        {row.openValue > 0 ? money(row.openValue) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-700">
                        {row.wonCount > 0 ? `${row.wonCount} · ${money(row.wonValue)}` : <span className="text-slate-400">0</span>}
                      </td>
                      {/* Null win rate is "nothing closed", not 0%. */}
                      <td className="px-6 py-4 text-right text-sm">
                        {row.winRate == null
                          ? <span className="text-slate-400" title="No closed deals yet">—</span>
                          : <span className="text-slate-700">{row.winRate}%</span>}
                      </td>
                      {/* Null quota is "not entered", not $0 / 0%. */}
                      <td className="px-6 py-4 text-right text-sm">
                        {row.quota == null
                          ? <span className="text-slate-400 italic" title={`No quota entered for ${period}`}>Not set</span>
                          : <span className="text-slate-700">
                              {money(row.quota)}
                              {row.attainment != null && (
                                <span className={`ml-2 text-xs font-semibold ${
                                  row.attainment >= 100 ? 'text-green-600' : 'text-slate-500'}`}>
                                  {row.attainment}%
                                </span>
                              )}
                            </span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {m.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="relative">
                          <button
                            aria-label={`Actions for ${m.name || m.email}`}
                            onClick={() => setActionMenuOpen(actionMenuOpen === m.id ? null : m.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                              <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                            </div>
                          </button>

                          {actionMenuOpen === m.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)}></div>
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-20">
                                {/*
                                  "View Deals", "View Contacts" and "View
                                  Activities" are GONE rather than repointed.
                                  All three navigated to `/deals?member=<name>`
                                  style URLs: routes that do not exist, carrying
                                  a filter no page reads. Restoring them means
                                  owner filtering on the Deals page first.
                                */}
                                <button
                                  onClick={() => { navigate(`/team/${m.id}`); setActionMenuOpen(null); }}
                                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  View Profile
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!loading && members.length > 0 && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Showing {filtered.length} of {members.length} team members
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
