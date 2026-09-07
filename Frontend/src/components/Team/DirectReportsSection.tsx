import React from 'react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, Mail, Phone, Calendar, TrendingUp, DollarSign, Target, Clock } from 'lucide-react';
import { NotAvailable } from '../common/NotAvailable';

interface DirectReport {
  id: string;
  name: string;
  initials: string;
  role: string;
  email: string;
  phone: string;
  photoColor: string;
  status: 'active' | 'inactive';
  memberSince: string;
  reportsTo: string;
  reportsToId: string;
  activeDeals: number;
  pipeline: string;
  pipelineValue: number;
  winRate: number;
  quota: string;
  quotaValue: number;
  quotaAttainment: number;
  performanceLabel: string;
  lastActivityType: string;
  lastActivity: string;
  lastActivityDate: string;
  activityStatus: string;
  coachingStatus: {
    needsAttention: boolean;
    last1on1: string;
    next1on1: string;
    performanceTrend: string;
  };
}

interface DirectReportsSectionProps {
  reports: DirectReport[];
  onViewTeam: () => void;
  onViewProfile: (reportId: string) => void;
  onEmail?: (email: string) => void;
  onScheduleCall?: (reportId: string) => void;
  onSchedule1on1?: (reportId: string) => void;
}

export const DirectReportsSection: React.FC<DirectReportsSectionProps> = ({
  reports,
  onViewTeam,
  onViewProfile,
  onEmail,
  onScheduleCall,
  onSchedule1on1
}) => {
  const navigate = useNavigate();

  // teamStats aggregated the invented per-report figures, and carried three
  // literals of its own — pipelineChange '+8%', activityHealth 'Excellent' and
  // avgResponseTime '2.1 hours'. Nothing renders them any more, so the whole
  // object goes rather than sitting unused: an aggregate over fabricated inputs
  // is not a number worth keeping warm.

  // Calculate coaching alerts based on thresholds
  const getCoachingAlert = () => {
    const needsAttention = reports.filter(r =>
      r.winRate < 65 ||
      (r.pipelineValue / r.quotaValue) < 0.90 ||
      r.coachingStatus.needsAttention
    );

    const atRisk = reports.filter(r =>
      r.winRate < 55 ||
      (r.pipelineValue / r.quotaValue) < 0.80
    );

    if (atRisk.length > 0) {
      return {
        level: 'red',
        icon: '🔴',
        title: 'Urgent coaching needed',
        members: atRisk.map(r => r.name).join(', '),
        count: atRisk.length
      };
    }

    if (needsAttention.length > 0) {
      return {
        level: 'yellow',
        icon: '⚠️',
        title: 'Consider coaching intervention',
        members: needsAttention.map(r => r.name).join(', '),
        count: needsAttention.length
      };
    }

    return {
      level: 'green',
      icon: '✅',
      title: 'Team performing well',
      members: null,
      count: 0
    };
  };

  const coachingAlert = getCoachingAlert();


  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="text-green-600">✅ Active</span>;
    }
    return <span className="text-slate-400">⚪ Inactive</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">
            Direct Reports ({reports.length})
          </h2>
        </div>
        <button
          onClick={onViewTeam}
          className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
        >
          View Team
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4 mb-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: report.photoColor }}
                >
                  {report.initials}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{report.name}</h3>
                  <p className="text-sm text-slate-600">{report.role}</p>
                  <p className="text-xs text-slate-500">{report.email} | {report.phone}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  onClick={() => onViewProfile(report.id)}
                >
                  View Profile
                </Button>
                {report.coachingStatus.performanceTrend && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {report.coachingStatus.performanceTrend}
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mb-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Performance:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-slate-600">Active Deals:</span>
                  <span className="text-sm text-slate-300">—</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-slate-600">Pipeline:</span>
                  <span className="text-sm text-slate-300">—</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span className="text-sm text-slate-600">Win Rate:</span>
                  <span className="text-sm text-slate-300">—</span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-orange-600 mt-0.5" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">Last Activity:</span>
                      <span className="text-sm font-semibold text-slate-900">{report.lastActivity}</span>
                    </div>
                    <span className="text-xs text-slate-500">{report.lastActivityType}</span>
                    <span className="text-xs text-slate-400">{report.lastActivityDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {report.coachingStatus && (
              <div className="border-t border-slate-200 pt-3 mb-3">
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Coaching Schedule:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-600">Last 1-on-1:</span>
                    <span className="font-medium text-slate-900 ml-1">{report.coachingStatus.last1on1}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Next 1-on-1:</span>
                    <span className="font-medium text-slate-900 ml-1">{report.coachingStatus.next1on1}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm mb-4">
              <div className="flex items-center gap-4">
                <span className="text-slate-600">
                  Status: {getStatusBadge(report.status)}
                </span>
                <span className="text-slate-600">
                  Member since: <span className="font-medium text-slate-900">{report.memberSince}</span>
                </span>
              </div>
            </div>

            {(onEmail || onScheduleCall || onSchedule1on1) && (
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                <span className="text-sm font-medium text-slate-600">Quick Actions:</span>
                {onEmail && (
                  <button
                    onClick={() => onEmail(report.email)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                )}
                {onScheduleCall && (
                  <button
                    onClick={() => onScheduleCall(report.id)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    Schedule Call
                  </button>
                )}
                {onSchedule1on1 && (
                  <button
                    onClick={() => onSchedule1on1(report.id)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    1-on-1
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl border border-blue-200 p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">TEAM ROLLUP STATS</h3>
        </div>

        <p className="text-sm font-semibold text-slate-700 mb-4">Team Performance Summary:</p>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-2xl mb-1">💼</div>
            <div className="text-sm text-slate-600 mb-1">Total Deals</div>
            <div className="text-2xl font-bold text-slate-300">—</div>
            <div className="text-xs text-slate-400 mt-1">Not connected</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-sm text-slate-600 mb-1">Total Pipeline</div>
            <div className="text-2xl font-bold text-slate-300">—</div>
            <div className="text-xs text-slate-400 mt-1">Not connected</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-sm text-slate-600 mb-1">Avg Win Rate</div>
            <div className="text-2xl font-bold text-slate-300">—</div>
            <div className="text-xs text-slate-400 mt-1">Not connected</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-2xl mb-1">📅</div>
            <div className="text-sm text-slate-600 mb-1">Team Activity</div>
            <div className="text-2xl font-bold text-slate-300">—</div>
            <div className="text-xs text-slate-400 mt-1">Not connected</div>
          </div>
        </div>

        {/*
          STOPGAP — two blocks here rendered a team quota attainment percentage,
          a per-person quota breakdown ("Sarah: 108%"), a "Team Activity Health"
          rating, an average response time, and a count of "Members Exceeding
          Expectations" — all from hardcoded literals in TEAM_MEMBER_DATA.

          Replaced rather than blanked to "—", because unlike a stat card these
          rows ARE the claim: a line reading "Members Exceeding Expectations: —"
          still asserts the product measures that about named people. None of it
          is computable today — `quotas` is empty and keys on `rep_name`, there
          are no `activities` rows, and `users` has no manager relationship to
          define a team by.
        */}
        <NotAvailable
          feature="Team quota and activity rollups"
          detail="Quota attainment, activity health, response times and performance standing are not measured yet. Quota records, activity history and a manager relationship between users all need to exist first."
        />
      </div>

      <div className={`rounded-lg p-4 ${
        coachingAlert.level === 'green' ? 'bg-green-50 border border-green-200' :
        coachingAlert.level === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
        'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{coachingAlert.icon}</span>
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">Coaching Attention Needed:</h4>
            {coachingAlert.level === 'green' ? (
              <p className="text-sm text-slate-700">
                None at this time - team performing well
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-slate-700">
                  {coachingAlert.count} {coachingAlert.count === 1 ? 'member' : 'members'} {coachingAlert.title.toLowerCase()}
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {coachingAlert.members}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
