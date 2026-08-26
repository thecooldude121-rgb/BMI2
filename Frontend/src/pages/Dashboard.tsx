import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Target,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckSquare,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import StatCard from '../components/Dashboard/StatCard';
import RecentActivity from '../components/Dashboard/RecentActivity';
import SalesFunnel from '../components/Dashboard/SalesFunnel';
import TaskOverview from '../components/Dashboard/TaskOverview';
import LeadScoreChart from '../components/Dashboard/LeadScoreChart';
import { useDashboardData, dealValue, isClosedWon, isOpen } from '../hooks/useDashboardData';

/**
 * Reads the database instead of DataContext.
 *
 * This page and all four of its widgets used useData(), which seeds React state
 * from generateSampleData() and never touches the network. So the first screen
 * a customer saw after logging in was entirely invented, and the four trend
 * badges ("+12%", "+8%", "+15%", "+5%" from last month) were literals in the
 * JSX — there is no endpoint that could produce a period-over-period figure, so
 * they are gone rather than replaced.
 *
 * Data is fetched once here and passed down. Each widget used to reach into the
 * context for itself; making them take props keeps that to one round trip and
 * makes them testable without a provider.
 */

const Dashboard: React.FC = () => {
  const { leads, deals, tasks, activities, loading, error, truncated, reload } =
    useDashboardData();
  const navigate = useNavigate();

  const now = Date.now();

  const qualifiedLeads = leads.filter(
    (l) => l.status === 'qualified' || l.status === 'proposal',
  ).length;

  // Open pipeline only. The old sum included closed-won AND closed-lost, so
  // "Pipeline Value" counted deals that were already decided — lost revenue
  // inflating a forward-looking number.
  const openPipeline = deals.filter(isOpen).reduce((sum, d) => sum + dealValue(d), 0);
  const wonDeals = deals.filter(isClosedWon).length;

  const overdueTasks = tasks.filter((t) => {
    if (t.status === 'completed' || !t.due_date) return false;
    const due = new Date(t.due_date).getTime();
    return !Number.isNaN(due) && due < now;
  }).length;

  const quickActions = [
    { label: 'Import Leads', icon: Users, tone: 'text-blue-600', to: '/crm/leads/import' },
    { label: 'Schedule Meeting', icon: Calendar, tone: 'text-green-600', to: '/crm/meetings' },
    { label: 'Create Task', icon: CheckSquare, tone: 'text-purple-600', to: '/crm/tasks' },
    { label: 'View Reports', icon: TrendingUp, tone: 'text-orange-600', to: '/analytics' },
  ];

  if (loading) {
    return (
      <div className="pt-4 lg:pt-6">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4 lg:pt-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <Button className="rounded-md" onClick={() => navigate('/crm/leads/new')}>
            Add Lead
          </Button>
          <button
            type="button"
            onClick={() => navigate('/crm/deals/create')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Create Deal
          </button>
        </div>
      </div>

      {/* A partial load says which part is missing, so a blank tile is never
          mistaken for a zero. */}
      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">{error}</p>
          </div>
          <button
            type="button"
            onClick={reload}
            className="text-sm font-medium text-amber-900 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {truncated && (
        <p className="text-xs text-gray-500">
          Showing the most recent records only — totals below are minimums, not
          full-table figures.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={leads.length.toString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Qualified Leads"
          value={qualifiedLeads.toString()}
          icon={Target}
          color="green"
          caption="Qualified or at proposal"
        />
        <StatCard
          title="Open Pipeline"
          value={`$${Math.round(openPipeline / 1000).toLocaleString()}K`}
          icon={DollarSign}
          color="yellow"
          caption="Excludes closed deals"
        />
        <StatCard
          title="Won Deals"
          value={wonDeals.toString()}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesFunnel leads={leads} />
        </div>
        <div>
          <TaskOverview tasks={tasks} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadScoreChart leads={leads} />
        <RecentActivity
          activities={activities}
          failed={!!error && error.includes('activity')}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* All four of these were buttons with no onClick. The destinations
              existed the whole time; nothing was wired to them. */}
          {quickActions.map(({ label, icon: Icon, tone, to }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(to)}
              className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Icon className={`h-5 w-5 ${tone} mr-3`} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {overdueTasks > 0 && (
        <button
          type="button"
          onClick={() => navigate('/crm/tasks')}
          className="w-full bg-red-50 border border-red-200 rounded-md p-4 text-left hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              You have {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}
            </span>
          </div>
        </button>
      )}
    </div>
  );
};

export default Dashboard;
