import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Download,
  Share2,
  Star,
  Clock,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Activity,
  Building2,
  Home,
  ChevronRight,
  ChevronDown,
  Mail,
  Printer,
  FileSpreadsheet,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  Eye,
  ExternalLink,
  Info,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';

const ReportDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { reportSlug } = useParams<{ reportSlug: string }>();
  const [selectedDateRange, setSelectedDateRange] = useState('month');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [isFavorited, setIsFavorited] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastMessage, setSuccessToastMessage] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Schedule modal state
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleRecipients, setScheduleRecipients] = useState({
    alex: true,
    sarah: true,
    mike: false,
  });
  const [scheduleFormat, setScheduleFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  // Share modal state
  const [shareSearch, setShareSearch] = useState('');
  const [shareRecipients, setShareRecipients] = useState({
    sarah: true,
    mike: true,
    emily: false,
  });
  const [shareMessage, setShareMessage] = useState('');
  const [allowEdit, setAllowEdit] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  // Convert slug to report name
  const reportName = reportSlug?.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ') || 'Report';

  const handleBack = () => {
    navigate('/crm/reports');
  };

  const handleExportPDF = () => {
    console.log('Exporting report as PDF');
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    console.log('Exporting report as CSV');
    setShowExportMenu(false);
  };

  const handleExportExcel = () => {
    console.log('Exporting report as Excel');
    setShowExportMenu(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSchedule = () => {
    setShowScheduleModal(true);
  };

  const handleScheduleConfirm = () => {
    console.log('Scheduling report:', {
      frequency: scheduleFrequency,
      time: scheduleTime,
      recipients: scheduleRecipients,
      format: scheduleFormat,
    });
    setShowScheduleModal(false);
    setSuccessToastMessage('Report scheduled successfully!');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const toggleRecipient = (recipient: 'alex' | 'sarah' | 'mike') => {
    setScheduleRecipients(prev => ({
      ...prev,
      [recipient]: !prev[recipient],
    }));
  };

  const toggleShareRecipient = (recipient: 'sarah' | 'mike' | 'emily') => {
    setShareRecipients(prev => ({
      ...prev,
      [recipient]: !prev[recipient],
    }));
  };

  const handleShareConfirm = () => {
    const sharedCount = Object.values(shareRecipients).filter(Boolean).length;
    console.log('Sharing report:', {
      recipients: shareRecipients,
      message: shareMessage,
      allowEdit,
      notifyEmail,
    });
    setShowShareModal(false);
    setSuccessToastMessage(`Report shared with ${sharedCount} ${sharedCount === 1 ? 'person' : 'people'}`);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleEmailReport = () => {
    console.log('Opening email modal');
    setShowExportMenu(false);
    // TODO: Implement email modal
  };

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
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
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Last updated: 5 minutes ago</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleFavorite}
                className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-all ${
                  isFavorited
                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Star className={`w-4 h-4 ${isFavorited ? 'fill-yellow-400' : ''}`} />
                {isFavorited ? 'Favorited' : 'Favorite'}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export as PDF
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export as CSV
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export as Excel
                    </button>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button
                      onClick={handleEmailReport}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email Report
                    </button>
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        setShowScheduleModal(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Schedule Delivery
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowShareModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>

              <button
                onClick={handleSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range:</label>
              <select
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
              <select
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
              <select
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
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>All Stages</option>
                  <option>Qualification</option>
                  <option>Proposal</option>
                  <option>Negotiation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Industry:</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>All Industries</option>
                  <option>SaaS</option>
                  <option>Enterprise</option>
                  <option>Healthcare</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deal Size:</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
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

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Schedule Report Delivery</h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <div className="text-sm text-gray-600">
                  Report: <span className="font-medium text-gray-900">{reportName}</span>
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Frequency: <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="frequency"
                        checked={scheduleFrequency === 'daily'}
                        onChange={() => setScheduleFrequency('daily')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-900">Daily</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="frequency"
                        checked={scheduleFrequency === 'weekly'}
                        onChange={() => setScheduleFrequency('weekly')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-900">Weekly (Every Monday)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="frequency"
                        checked={scheduleFrequency === 'monthly'}
                        onChange={() => setScheduleFrequency('monthly')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-900">Monthly (1st of month)</span>
                    </label>
                  </div>
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time:</label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="00:00">12:00 AM</option>
                    <option value="01:00">1:00 AM</option>
                    <option value="02:00">2:00 AM</option>
                    <option value="03:00">3:00 AM</option>
                    <option value="04:00">4:00 AM</option>
                    <option value="05:00">5:00 AM</option>
                    <option value="06:00">6:00 AM</option>
                    <option value="07:00">7:00 AM</option>
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                    <option value="21:00">9:00 PM</option>
                    <option value="22:00">10:00 PM</option>
                    <option value="23:00">11:00 PM</option>
                  </select>
                </div>

                {/* Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Recipients: <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 space-y-2">
                    <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleRecipients.alex}
                        onChange={() => toggleRecipient('alex')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-900">Alex Rodriguez (me)</span>
                    </label>
                    <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleRecipients.sarah}
                        onChange={() => toggleRecipient('sarah')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-900">Sarah Chen</span>
                    </label>
                    <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleRecipients.mike}
                        onChange={() => toggleRecipient('mike')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-900">Mike Johnson</span>
                    </label>
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Format:</label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        checked={scheduleFormat === 'pdf'}
                        onChange={() => setScheduleFormat('pdf')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-900">PDF</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        checked={scheduleFormat === 'excel'}
                        onChange={() => setScheduleFormat('excel')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-900">Excel</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        checked={scheduleFormat === 'csv'}
                        onChange={() => setScheduleFormat('csv')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-900">CSV</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleConfirm}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Share Report</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <div className="text-sm text-gray-600">
                  Report: <span className="font-medium text-gray-900">{reportName}</span>
                </div>

                {/* Search and Recipients */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Share with:
                  </label>
                  <input
                    type="text"
                    placeholder="Search team members..."
                    value={shareSearch}
                    onChange={(e) => setShareSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                  />
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareRecipients.sarah}
                        onChange={() => toggleShareRecipient('sarah')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-900">Sarah Chen</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareRecipients.mike}
                        onChange={() => toggleShareRecipient('mike')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-900">Mike Johnson</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareRecipients.emily}
                        onChange={() => toggleShareRecipient('emily')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-900">Emily Davis</span>
                    </label>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (optional):
                  </label>
                  <textarea
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    placeholder="Add a message..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowEdit}
                      onChange={(e) => setAllowEdit(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-900">Allow them to edit this report</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-900">Notify via email</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleShareConfirm}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
            <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">{successToastMessage}</span>
            </div>
          </div>
        )}
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

  // HRMS Reports (check first - most specific)
  if (reportLower.includes('hrms') || reportLower.includes('recruitment')) {
    return {
      chartData: [
        { label: 'Jan', value: 40, amount: 85 },
        { label: 'Feb', value: 55, amount: 112 },
        { label: 'Mar', value: 68, amount: 145 },
        { label: 'Apr', value: 75, amount: 168 },
        { label: 'May', value: 82, amount: 192 },
        { label: 'Jun', value: 88, amount: 215 },
        { label: 'Jul', value: 90, amount: 228 },
        { label: 'Aug', value: 85, amount: 210 },
        { label: 'Sep', value: 92, amount: 240 },
        { label: 'Oct', value: 95, amount: 255 },
        { label: 'Nov', value: 98, amount: 268 },
        { label: 'Dec', value: 100, amount: 285 },
      ],
      pipelineData: [
        { name: 'HRMS Generated Leads', value: 412, deals: 0, percentage: 49, color: 'bg-blue-500' },
        { name: 'Traditional Sources', value: 435, deals: 0, percentage: 51, color: 'bg-gray-500' },
      ],
      tableData: [
        { id: '1', name: 'HRMS: Global Tech', type: 'lead', value: 125, stage: 'Converted', owner: 'Alex Rodriguez', status: 'Won' },
        { id: '2', name: 'HRMS: FinanceFlow', type: 'lead', value: 98, stage: 'Qualified', owner: 'Sarah Chen', status: 'In Progress' },
        { id: '3', name: 'HRMS: HealthPlus', type: 'lead', value: 87, stage: 'Proposal', owner: 'Mike Johnson', status: 'In Progress' },
        { id: '4', name: 'HRMS: RetailMax', type: 'lead', value: 76, stage: 'Qualified', owner: 'Emily Davis', status: 'In Progress' },
        { id: '5', name: 'HRMS: EduTech', type: 'lead', value: 65, stage: 'Converted', owner: 'Alex Rodriguez', status: 'Won' },
      ],
    };
  }

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
