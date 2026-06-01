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
  Clock
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import StatCard from '../components/Dashboard/StatCard';
import RecentActivity from '../components/Dashboard/RecentActivity';
import SalesFunnel from '../components/Dashboard/SalesFunnel';
import TaskOverview from '../components/Dashboard/TaskOverview';
import LeadScoreChart from '../components/Dashboard/LeadScoreChart';

const Dashboard: React.FC = () => {
  const { leads, deals, tasks } = useData();
  const navigate = useNavigate();

  const stats = {
    totalLeads: leads.length,
    qualifiedLeads: leads.filter(lead => lead.stage === 'qualified' || lead.stage === 'proposal').length,
    totalDeals: deals.reduce((sum, deal) => sum + deal.value, 0),
    wonDeals: deals.filter(deal => deal.stage === 'closed-won').length,
    pendingTasks: tasks.filter(task => task.status === 'pending').length,
    overdueTasks: tasks.filter(task => new Date(task.dueDate) < new Date() && task.status !== 'completed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Add Lead
          </button>
          <button 
            onClick={() => navigate('/crm/deals/create')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Create Deal
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads.toString()}
          icon={Users}
          change="+12%"
          changeType="positive"
          color="blue"
        />
        <StatCard
          title="Qualified Leads"
          value={stats.qualifiedLeads.toString()}
          icon={Target}
          change="+8%"
          changeType="positive"
          color="green"
        />
        <StatCard
          title="Pipeline Value"
          value={`$${(stats.totalDeals / 1000).toFixed(0)}K`}
          icon={DollarSign}
          change="+15%"
          changeType="positive"
          color="yellow"
        />
        <StatCard
          title="Won Deals"
          value={stats.wonDeals.toString()}
          icon={TrendingUp}
          change="+5%"
          changeType="positive"
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Funnel */}
        <div className="lg:col-span-2">
          <SalesFunnel />
        </div>

        {/* Task Overview */}
        <div>
          <TaskOverview />
        </div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Score Distribution */}
        <LeadScoreChart />

        {/* Recent Activity */}
        <RecentActivity />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <Users className="h-5 w-5 text-blue-600 mr-3" />
            <span className="text-sm font-medium">Import Leads</span>
          </button>
          <button className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <Calendar className="h-5 w-5 text-green-600 mr-3" />
            <span className="text-sm font-medium">Schedule Meeting</span>
          </button>
          <button className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <CheckSquare className="h-5 w-5 text-purple-600 mr-3" />
            <span className="text-sm font-medium">Create Task</span>
          </button>
          <button className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <TrendingUp className="h-5 w-5 text-orange-600 mr-3" />
            <span className="text-sm font-medium">View Reports</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {stats.overdueTasks > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              You have {stats.overdueTasks} overdue task{stats.overdueTasks > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;