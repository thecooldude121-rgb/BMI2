import React, { useState } from 'react';
import PreviewBanner from '../../components/common/PreviewBanner';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Download, Share2, Star, Filter, RefreshCw, TrendingUp, TrendingDown, DollarSign, Users, Target, Activity, Home, ChevronRight, BarChart3, PieChart, LineChart, Table, Eye, Info, CheckCircle } from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';

const ReportDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { reportSlug } = useParams<{ reportSlug: string }>();
  const [selectedDateRange, setSelectedDateRange] = useState('month');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Convert slug to report name
  const reportName = reportSlug?.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') || 'Report';

  const handleBack = () => {
    navigate('/crm/reports');
  };












  const handleRefresh = () => {
    console.log('Refreshing report data');
  };

  const handleDrillDown = (dataPoint: string) => {
    console.log('Drilling down into:', dataPoint);
  };

  const handleRowClick = (type: string, id: string, name: string) => {
    console.log(`Navigating to ${type} detail:`, id);

    // Navigate to appropriate detail page based on type
    switch (type) {
      case 'deal':
        navigate(`/crm/deals/${id}`);
        break;
      case 'contact':
        navigate(`/crm/contacts/${id}`);
        break;
      case 'account':
        navigate(`/accounts/${id}`);
        break;
      case 'lead':
        navigate(`/crm/leads/${id}`);
        break;
      default:
        console.log('Unknown type:', type);
    }
  };

  // Mock data for the report
  const reportData = getReportData(reportName);

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="p-8">
        {/*
          * PREVIEW. Every figure below comes from getReportData(), which
          * branches on the URL SLUG and returns hardcoded chart series,
          * pipeline splits and table rows. Nothing on this page is read from
          * the workspace. The real build is P3 in the facade-page audit and
          * depends on CustomReportBuilder gaining a backend first — there is
          * no saved-report definition for this page to render.
          */}
        <PreviewBanner
          detail={<>
            <strong>Every number on this page is sample content.</strong> The charts,
            the pipeline breakdown and the table rows are fixed examples chosen by
            the report name in the URL — none of it is read from your workspace,
            and export and scheduling are not built.
          </>}
          insteadTry="The Reports page states which of its cards compute from real data and which cannot yet, with the reason."
        />
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center text-sm text-gray-600">
          <Home className="w-4 h-4 mr-2" />
          <button onClick={() => navigate('/')} className="hover:text-blue-600">
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <button onClick={handleBack} className="hover:text-blue-600">
            Reports
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">{reportName}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{reportName}</h1>
              </div>
            </div>

            {/* Every action here is unbuilt (saved reports live on an unmerged branch —
                see the reports inventory). They were: a Favorite toggle that reset on
                reload, exports that raised alert(), "Email Report" and "Refresh" that only
                logged to the console, a Schedule that reported its own failure in a
                green success toast, and a Share that announced "Report shared with N
                people" while sending nothing (H2, 2026-10-14). */}
            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: 'Favorite', Icon: Star },
                { label: 'Export', Icon: Download },
                { label: 'Share', Icon: Share2 },
                { label: 'Schedule', Icon: Calendar },
              ].map(({ label, Icon }) => (
                <button key={label} type="button" disabled title={`${label} is coming soon`}
                  className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 text-gray-400 cursor-not-allowed">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label} · Coming soon
                </button>
              ))}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range:</label>
              <select aria-label="Date Range:"
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="last30">Last 30 Days</option>
                <option value="last90">Last 90 Days</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Owner:</label>
              <select aria-label="Owner:"
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Team</option>
                <option value="me">Me Only</option>
                <option value="alex">Alex Rodriguez</option>
                <option value="sarah">Sarah Chen</option>
                <option value="mike">Mike Johnson</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Metric:</label>
              <select aria-label="Metric:"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Metrics</option>
                <option value="revenue">Revenue</option>
                <option value="deals">Deals</option>
                <option value="pipeline">Pipeline</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                More Filters
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Additional Filters Panel */}
        {showFilterPanel && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Filters</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stage:</label>
                <select aria-label="Stage:" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>All Stages</option>
                  <option>Qualification</option>
                  <option>Proposal</option>
                  <option>Negotiation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry:</label>
                <select aria-label="Industry:" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>All Industries</option>
                  <option>SaaS</option>
                  <option>Enterprise</option>
                  <option>Healthcare</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deal Size:</label>
                <select aria-label="Deal Size:" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>All Sizes</option>
                  <option>Small ($0-25K)</option>
                  <option>Medium ($25K-100K)</option>
                  <option>Large ($100K+)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <MetricCard
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            label="Total Revenue"
            value="$847,000"
            change="+12.5%"
            trend="up"
            bgColor="bg-green-50"
          />
          <MetricCard
            icon={<Target className="w-6 h-6 text-blue-600" />}
            label="Deals Won"
            value="23"
            change="+8 deals"
            trend="up"
            bgColor="bg-blue-50"
          />
          <MetricCard
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            label="Pipeline Value"
            value="$2.4M"
            change="+8.2%"
            trend="up"
            bgColor="bg-purple-50"
          />
          <MetricCard
            icon={<Users className="w-6 h-6 text-orange-600" />}
            label="Win Rate"
            value="68%"
            change="+5 points"
            trend="up"
            bgColor="bg-orange-50"
          />
        </div>

        {/* Main Charts Section */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded">
                  <BarChart3 className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded">
                  <LineChart className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {reportData.chartData.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleDrillDown(item.label)}
                  className="flex-1 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity group"
                >
                  <div className="relative w-full bg-blue-100 rounded-t hover:bg-blue-200 transition-colors cursor-pointer" style={{ height: `${item.value}%` }}>
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      ${item.amount}K
                    </div>
                  </div>
                  <span className="text-xs text-gray-600">{item.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>Click any bar to drill down into specific records</span>
            </div>
          </div>

          {/* Pipeline Distribution Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pipeline by Stage</h3>
              <button className="p-2 hover:bg-gray-100 rounded">
                <PieChart className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="space-y-3">
              {reportData.pipelineData.map((stage, index) => (
                <button
                  key={index}
                  onClick={() => handleDrillDown(stage.name)}
                  className="w-full text-left hover:bg-gray-50 p-3 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{stage.name}</span>
                    <span className="text-sm text-gray-600">${stage.value}K ({stage.deals} deals)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${stage.color}`}
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Info className="w-4 h-4" />
              <span>Click any stage to view deals in that stage</span>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detailed Records</h3>
                <p className="text-sm text-gray-600 mt-1">Click any row to view full details</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  View All
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.tableData.map((row, index) => (
                  <tr
                    key={index}
                    onClick={() => handleRowClick(row.type, row.id, row.name)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{row.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {row.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${row.value}K
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {row.stage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {row.owner}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.status === 'Won' ? 'bg-green-100 text-green-800' :
                        row.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {row.status === 'Won' && <CheckCircle className="w-3 h-3" />}
                        {row.status === 'In Progress' && <Activity className="w-3 h-3" />}
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(row.type, row.id, row.name);
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Showing 1-10 of 156 records</span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white">
                  Previous
                </button>
                <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Helper Components
interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  bgColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, change, trend, bgColor }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
      <div className={`flex items-center gap-1 text-sm font-medium ${
        trend === 'up' ? 'text-green-600' : 'text-red-600'
      }`}>
        {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {change}
      </div>
    </div>
  );
};

// Mock data generator
function getReportData(reportName: string) {
  // Generate different data based on report name
  const reportLower = reportName.toLowerCase();

  /*
   * A BRANCH FOR HRMS REPORTS WAS REMOVED HERE, and not only because it was
   * fabricated like everything else in this function.
   *
   * It returned rows such as "HRMS: Global Tech" and a pipeline split of
   * "HRMS Generated Leads: 412 / Traditional Sources: 435". HRMS is a SEPARATE
   * PRODUCT reached over the SSO/API boundary (CLAUDE.md): this CRM has no
   * access to its tables and must never join to them. So the sample data
   * encoded a cross-module read that would be a design error if it were ever
   * made real — and sample data is exactly how that gets made real, by someone
   * wiring up what looks like an existing feature.
   *
   * A report slug mentioning HRMS now falls through to the generic branches
   * below, which are sample content and labelled as such.
   */
  // Account Reports
  if (reportLower.includes('account') || reportLower.includes('top accounts')) {
    return {
      chartData: [
        { label: 'Enterprise', value: 85, amount: 45 },
        { label: 'Mid-Market', value: 70, amount: 78 },
        { label: 'SMB', value: 55, amount: 156 },
        { label: 'Startup', value: 40, amount: 89 },
      ],
      pipelineData: [
        { name: 'High Value (>$100K)', value: 15, deals: 0, percentage: 35, color: 'bg-green-500' },
        { name: 'Medium ($25K-100K)', value: 48, deals: 0, percentage: 40, color: 'bg-blue-500' },
        { name: 'Small (<$25K)', value: 92, deals: 0, percentage: 25, color: 'bg-gray-500' },
      ],
      tableData: [
        { id: '1', name: 'GlobalCorp Industries', type: 'account', value: 450, stage: 'Active', owner: 'Alex Rodriguez', status: 'Active' },
        { id: '2', name: 'TechVision Solutions', type: 'account', value: 325, stage: 'Active', owner: 'Sarah Chen', status: 'Active' },
        { id: '3', name: 'InnovateNow Inc', type: 'account', value: 285, stage: 'Active', owner: 'Mike Johnson', status: 'Active' },
        { id: '4', name: 'DataStream Corp', type: 'account', value: 210, stage: 'Active', owner: 'Emily Davis', status: 'Active' },
        { id: '5', name: 'CloudFirst Ltd', type: 'account', value: 195, stage: 'Active', owner: 'Alex Rodriguez', status: 'Active' },
      ],
    };
  }

  // Revenue Reports
  if (reportLower.includes('revenue') || reportLower.includes('forecast')) {
    return {
      chartData: [
        { label: 'Q1', value: 65, amount: 425 },
        { label: 'Q2', value: 75, amount: 520 },
        { label: 'Q3', value: 85, amount: 620 },
        { label: 'Q4', value: 95, amount: 735 },
      ],
      pipelineData: [
        { name: 'Product Sales', value: 1200, deals: 0, percentage: 52, color: 'bg-blue-500' },
        { name: 'Services', value: 650, deals: 0, percentage: 28, color: 'bg-green-500' },
        { name: 'Subscriptions', value: 380, deals: 0, percentage: 16, color: 'bg-purple-500' },
        { name: 'Other', value: 70, deals: 0, percentage: 4, color: 'bg-gray-500' },
      ],
      tableData: [
        { id: '1', name: 'Q4 Enterprise Deals', type: 'deal', value: 285, stage: 'Closed Won', owner: 'Alex Rodriguez', status: 'Won' },
        { id: '2', name: 'Annual Subscriptions', type: 'deal', value: 195, stage: 'Closed Won', owner: 'Sarah Chen', status: 'Won' },
        { id: '3', name: 'Professional Services', type: 'deal', value: 145, stage: 'Closed Won', owner: 'Mike Johnson', status: 'Won' },
        { id: '4', name: 'Product Licenses', type: 'deal', value: 110, stage: 'Closed Won', owner: 'Emily Davis', status: 'Won' },
        { id: '5', name: 'Support Contracts', type: 'deal', value: 82, stage: 'Closed Won', owner: 'Alex Rodriguez', status: 'Won' },
      ],
    };
  }

  // Lead Reports
  if (reportLower.includes('lead') || reportLower.includes('conversion') || reportLower.includes('contact') || reportLower.includes('response time')) {
    return {
      chartData: [
        { label: 'Jan', value: 50, amount: 42 },
        { label: 'Feb', value: 60, amount: 51 },
        { label: 'Mar', value: 70, amount: 58 },
        { label: 'Apr', value: 65, amount: 55 },
        { label: 'May', value: 75, amount: 63 },
        { label: 'Jun', value: 80, amount: 68 },
        { label: 'Jul', value: 85, amount: 72 },
        { label: 'Aug', value: 78, amount: 66 },
        { label: 'Sep', value: 88, amount: 75 },
        { label: 'Oct', value: 92, amount: 78 },
        { label: 'Nov', value: 95, amount: 81 },
        { label: 'Dec', value: 100, amount: 85 },
      ],
      pipelineData: [
        { name: 'New Leads', value: 156, deals: 0, percentage: 40, color: 'bg-blue-500' },
        { name: 'Contacted', value: 98, deals: 0, percentage: 25, color: 'bg-indigo-500' },
        { name: 'Qualified', value: 67, deals: 0, percentage: 17, color: 'bg-purple-500' },
        { name: 'Converted', value: 45, deals: 0, percentage: 11, color: 'bg-green-500' },
        { name: 'Lost', value: 28, deals: 0, percentage: 7, color: 'bg-red-500' },
      ],
      tableData: [
        { id: '1', name: 'Sarah Williams', type: 'lead', value: 0, stage: 'Qualified', owner: 'Alex Rodriguez', status: 'In Progress' },
        { id: '2', name: 'Michael Brown', type: 'lead', value: 0, stage: 'Contacted', owner: 'Sarah Chen', status: 'In Progress' },
        { id: '3', name: 'Jennifer Davis', type: 'lead', value: 0, stage: 'Converted', owner: 'Mike Johnson', status: 'Won' },
        { id: '4', name: 'Robert Wilson', type: 'lead', value: 0, stage: 'New', owner: 'Emily Davis', status: 'In Progress' },
        { id: '5', name: 'Lisa Anderson', type: 'lead', value: 0, stage: 'Qualified', owner: 'Alex Rodriguez', status: 'In Progress' },
      ],
    };
  }

  // Activity Reports
  if (reportLower.includes('activity') || reportLower.includes('meeting') || reportLower.includes('response')) {
    return {
      chartData: [
        { label: 'Mon', value: 75, amount: 42 },
        { label: 'Tue', value: 85, amount: 48 },
        { label: 'Wed', value: 90, amount: 52 },
        { label: 'Thu', value: 95, amount: 55 },
        { label: 'Fri', value: 88, amount: 50 },
        { label: 'Sat', value: 30, amount: 15 },
        { label: 'Sun', value: 20, amount: 10 },
      ],
      pipelineData: [
        { name: 'Calls', value: 78, deals: 0, percentage: 32, color: 'bg-blue-500' },
        { name: 'Emails', value: 89, deals: 0, percentage: 36, color: 'bg-green-500' },
        { name: 'Meetings', value: 45, deals: 0, percentage: 18, color: 'bg-purple-500' },
        { name: 'Tasks', value: 35, deals: 0, percentage: 14, color: 'bg-orange-500' },
      ],
      tableData: [
        { id: '1', name: 'Call with TechStart', type: 'activity', value: 0, stage: 'Completed', owner: 'Alex Rodriguez', status: 'Completed' },
        { id: '2', name: 'Meeting - Q4 Planning', type: 'activity', value: 0, stage: 'Scheduled', owner: 'Sarah Chen', status: 'In Progress' },
        { id: '3', name: 'Email - Proposal Sent', type: 'activity', value: 0, stage: 'Completed', owner: 'Mike Johnson', status: 'Completed' },
        { id: '4', name: 'Task - Follow up', type: 'activity', value: 0, stage: 'Pending', owner: 'Emily Davis', status: 'In Progress' },
        { id: '5', name: 'Call - Discovery', type: 'activity', value: 0, stage: 'Completed', owner: 'Alex Rodriguez', status: 'Completed' },
      ],
    };
  }

  // Pipeline Reports
  if (reportLower.includes('pipeline') || reportLower.includes('aging') || reportLower.includes('trend')) {
    return {
      chartData: [
        { label: 'Jan', value: 60, amount: 200 },
        { label: 'Feb', value: 65, amount: 215 },
        { label: 'Mar', value: 70, amount: 240 },
        { label: 'Apr', value: 75, amount: 260 },
        { label: 'May', value: 72, amount: 255 },
        { label: 'Jun', value: 78, amount: 270 },
        { label: 'Jul', value: 82, amount: 290 },
        { label: 'Aug', value: 88, amount: 310 },
        { label: 'Sep', value: 85, amount: 305 },
        { label: 'Oct', value: 90, amount: 325 },
        { label: 'Nov', value: 92, amount: 335 },
        { label: 'Dec', value: 95, amount: 350 },
      ],
      pipelineData: [
        { name: 'Prospecting', value: 450, deals: 18, percentage: 20, color: 'bg-blue-500' },
        { name: 'Qualification', value: 720, deals: 16, percentage: 32, color: 'bg-indigo-500' },
        { name: 'Proposal', value: 650, deals: 11, percentage: 29, color: 'bg-purple-500' },
        { name: 'Negotiation', value: 380, deals: 7, percentage: 17, color: 'bg-orange-500' },
        { name: 'Closed Won', value: 50, deals: 2, percentage: 2, color: 'bg-green-500' },
      ],
      tableData: [
        { id: '1', name: 'CloudFlow Enterprise', type: 'deal', value: 120, stage: 'Qualification', owner: 'Sarah Chen', status: 'In Progress' },
        { id: '2', name: 'TechCorp Platform', type: 'deal', value: 95, stage: 'Proposal', owner: 'Alex Rodriguez', status: 'In Progress' },
        { id: '3', name: 'DataSync Solution', type: 'deal', value: 88, stage: 'Negotiation', owner: 'Mike Johnson', status: 'In Progress' },
        { id: '4', name: 'SecureNet Deal', type: 'deal', value: 76, stage: 'Qualification', owner: 'Emily Davis', status: 'In Progress' },
        { id: '5', name: 'AutoScale Package', type: 'deal', value: 65, stage: 'Proposal', owner: 'Sarah Chen', status: 'In Progress' },
      ],
    };
  }

  // Sales Reports (checked last as it's most general)
  if (reportLower.includes('sales') || reportLower.includes('win') || reportLower.includes('quota')) {
    return {
      chartData: [
        { label: 'Jan', value: 45, amount: 120 },
        { label: 'Feb', value: 55, amount: 145 },
        { label: 'Mar', value: 65, amount: 175 },
        { label: 'Apr', value: 70, amount: 190 },
        { label: 'May', value: 60, amount: 165 },
        { label: 'Jun', value: 75, amount: 205 },
        { label: 'Jul', value: 85, amount: 235 },
        { label: 'Aug', value: 80, amount: 220 },
        { label: 'Sep', value: 90, amount: 250 },
        { label: 'Oct', value: 95, amount: 265 },
        { label: 'Nov', value: 88, amount: 245 },
        { label: 'Dec', value: 100, amount: 280 },
      ],
      pipelineData: [
        { name: 'Qualification', value: 620, deals: 15, percentage: 25, color: 'bg-blue-500' },
        { name: 'Proposal', value: 890, deals: 12, percentage: 37, color: 'bg-purple-500' },
        { name: 'Negotiation', value: 690, deals: 8, percentage: 29, color: 'bg-orange-500' },
        { name: 'Closed Won', value: 200, deals: 5, percentage: 9, color: 'bg-green-500' },
      ],
      tableData: [
        { id: '1', name: 'Enterprise Solution Deal', type: 'deal', value: 95, stage: 'Negotiation', owner: 'Alex Rodriguez', status: 'In Progress' },
        { id: '2', name: 'DataFlow Inc Expansion', type: 'deal', value: 75, stage: 'Proposal', owner: 'Sarah Chen', status: 'In Progress' },
        { id: '3', name: 'HealthPlus Integration', type: 'deal', value: 62, stage: 'Qualification', owner: 'Mike Johnson', status: 'In Progress' },
        { id: '4', name: 'TechStart Platform', type: 'deal', value: 50, stage: 'Closed Won', owner: 'Alex Rodriguez', status: 'Won' },
        { id: '5', name: 'Acme Corp Upgrade', type: 'deal', value: 45, stage: 'Negotiation', owner: 'Emily Davis', status: 'In Progress' },
      ],
    };
  }

  // Default data for any other report
  return {
    chartData: [
      { label: 'Jan', value: 45, amount: 120 },
      { label: 'Feb', value: 55, amount: 145 },
      { label: 'Mar', value: 65, amount: 175 },
      { label: 'Apr', value: 70, amount: 190 },
      { label: 'May', value: 60, amount: 165 },
      { label: 'Jun', value: 75, amount: 205 },
      { label: 'Jul', value: 85, amount: 235 },
      { label: 'Aug', value: 80, amount: 220 },
      { label: 'Sep', value: 90, amount: 250 },
      { label: 'Oct', value: 95, amount: 265 },
      { label: 'Nov', value: 88, amount: 245 },
      { label: 'Dec', value: 100, amount: 280 },
    ],
    pipelineData: [
      { name: 'Category A', value: 620, deals: 15, percentage: 25, color: 'bg-blue-500' },
      { name: 'Category B', value: 890, deals: 12, percentage: 37, color: 'bg-purple-500' },
      { name: 'Category C', value: 690, deals: 8, percentage: 29, color: 'bg-orange-500' },
      { name: 'Category D', value: 200, deals: 5, percentage: 9, color: 'bg-green-500' },
    ],
    tableData: [
      { id: '1', name: 'Sample Record 1', type: 'deal', value: 95, stage: 'Active', owner: 'Alex Rodriguez', status: 'In Progress' },
      { id: '2', name: 'Sample Record 2', type: 'deal', value: 75, stage: 'Active', owner: 'Sarah Chen', status: 'In Progress' },
      { id: '3', name: 'Sample Record 3', type: 'deal', value: 62, stage: 'Active', owner: 'Mike Johnson', status: 'In Progress' },
      { id: '4', name: 'Sample Record 4', type: 'deal', value: 50, stage: 'Completed', owner: 'Alex Rodriguez', status: 'Won' },
      { id: '5', name: 'Sample Record 5', type: 'deal', value: 45, stage: 'Active', owner: 'Emily Davis', status: 'In Progress' },
    ],
  };
}

export default ReportDetailView;
