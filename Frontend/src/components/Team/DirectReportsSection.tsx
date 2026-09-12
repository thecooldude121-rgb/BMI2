import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, Mail } from 'lucide-react';
import { MemberPerformance } from '../../hooks/useTeamPerformance';

/**
 * Direct reports, resolved from `users.manager_id` (migration 041).
 *
 * WHAT THIS REPLACES, and why it was the most severe thing left on these two
 * pages after cd667e2.
 *
 * The old prop contract was a 24-field `DirectReport` fixture: phone numbers,
 * `memberSince`, `lastActivity`, `performanceLabel`, `quota`/`quotaValue`/
 * `quotaAttainment`, and a `coachingStatus` carrying `last1on1`, `next1on1`
 * and a `performanceTrend`. None of those had a column anywhere.
 *
 * cd667e2 blanked the NUMBERS to "—" but left `getCoachingAlert()` computing
 * from them, and rendering its verdict. So the section still displayed
 *
 *     "🔴 Urgent coaching needed — <real employee's name>"
 *
 * derived from `r.winRate < 55` and `r.pipelineValue / r.quotaValue < 0.80`
 * against invented inputs. A blanked number is a gap; a NAMED PERSON flagged
 * for urgent coaching is an accusation, and it was screenshottable into a
 * performance review. That is the reasoning CLAUDE.md applies to a fabricated
 * credential — the blast radius leaves the app — so the judgement is deleted
 * rather than labelled, along with the inputs it read.
 *
 * It is not replaced by a "real" coaching alert. Thresholds on win rate and
 * quota coverage are a product decision about how to appraise people, not a
 * calculation to reintroduce because the inputs finally exist.
 */

interface DirectReportsSectionProps {
  /** Real rollups, one per report. The parent resolves them by manager_id. */
  reports: MemberPerformance[];
  onViewTeam: () => void;
  onEmail?: (email: string) => void;
  /** The quota period the quota column is measured against, e.g. "Q3 2026". */
  period: string;
}

const money = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `$${Math.round(n / 1_000)}K`
  : `$${n}`;

export const DirectReportsSection: React.FC<DirectReportsSectionProps> = ({
  reports, onViewTeam, onEmail, period,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          Direct Reports ({reports.length})
        </h2>
        <button
          onClick={onViewTeam}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
        >
          View whole team <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/*
        A real EmptyState that says WHY. `manager_id` exists and is currently
        NULL for every user in the workspace, so "nobody reports to this person"
        is the true answer — and it is a different statement from "we cannot
        tell", which is what a blank section implies.
      */}
      {reports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-700">Nobody reports to this person</p>
          <p className="text-sm text-slate-500 mt-1">
            Reporting lines are set per person in Settings → Team, under “Reports to”.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Report', 'Role', 'Open', 'Pipeline', 'Won', 'Win %', `Quota (${period})`, ''].map((h, i) => (
                  <th key={h || i} className={`px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider ${
                    i >= 2 && i <= 6 ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reports.map((r) => {
                const m = r.member;
                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 bg-gradient-to-br ${m.avatarColor} rounded-lg flex items-center justify-center text-white font-semibold text-xs`}>
                          {m.initials}
                        </div>
                        <div>
                          <button
                            onClick={() => navigate(`/team/${m.id}`)}
                            className="font-semibold text-slate-800 hover:text-blue-600 transition-colors text-left"
                          >
                            {m.name || m.email}
                          </button>
                          <div className="text-xs text-slate-500">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{m.role}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">{r.openCount}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      {r.openValue > 0 ? money(r.openValue) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      {r.wonCount > 0 ? `${r.wonCount} · ${money(r.wonValue)}` : <span className="text-slate-400">0</span>}
                    </td>
                    {/* Null win rate is "nothing closed", not 0%. */}
                    <td className="px-4 py-3 text-right text-sm">
                      {r.winRate == null
                        ? <span className="text-slate-400" title="No closed deals yet">—</span>
                        : <span className="text-slate-700">{r.winRate}%</span>}
                    </td>
                    {/* Null quota is "not entered", not $0 / 0%. */}
                    <td className="px-4 py-3 text-right text-sm">
                      {r.quota == null
                        ? <span className="text-slate-400 italic" title={`No quota entered for ${period}`}>Not set</span>
                        : <span className="text-slate-700">
                            {money(r.quota)}
                            {r.attainment != null && (
                              <span className={`ml-2 text-xs font-semibold ${
                                r.attainment >= 100 ? 'text-green-600' : 'text-slate-500'}`}>
                                {r.attainment}%
                              </span>
                            )}
                          </span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {onEmail && (
                        <button
                          onClick={() => onEmail(m.email)}
                          title={`Email ${m.name || m.email}`}
                          aria-label={`Email ${m.name || m.email}`}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
