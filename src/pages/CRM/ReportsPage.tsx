import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Target,
  Activity,
  Phone,
  Mail,
  FileText,
  Download,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  Clock,
  Award,
  Building2,
  UserCheck,
  PhoneCall,
  AlertCircle,
  Eye,
  Share2,
  Settings,
  MoreVertical,
  Plus,
  Search,
  Filter,
  RefreshCw,
  PieChart,
  TrendingDown,
  Zap,
  CheckCircle,
  Home,
  Sparkles,
  Edit,
} from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [selectedOwner, setSelectedOwner] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown states
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState<string | null>(null);

  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [failedReports, setFailedReports] = useState<string[]>([]);

  // Success states
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successAction, setSuccessAction] = useState<React.ReactNode>(null);

  // Mobile filter menu
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Keyboard navigation
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [expandedSections, setExpandedSections] = useState({
    sales: true,
    pipeline: true,
    activity: true,
    leads: true,
    revenue: true,
    accounts: true,
    hrms: true,
    custom: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Navigation handlers
  const handleNavigateToDashboard = () => {
    navigate('/');
  };

  const handleNavigateToCustomReportBuilder = () => {
    navigate('/crm/custom-report-builder');
  };

  const handleViewReport = (reportName: string) => {
    // Navigate to report detail view
    const reportSlug = reportName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/crm/reports/${reportSlug}`);
  };

  const handleExportPDF = (reportName: string) => {
    console.log(`Exporting ${reportName} as PDF`);
    setSuccessMessage('Report exported successfully');
    setSuccessAction(
      <button className="text-sm underline hover:no-underline">View File</button>
    );
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleExportCSV = (reportName: string) => {
    console.log(`Exporting ${reportName} as CSV`);
    setSuccessMessage('Report exported successfully');
    setSuccessAction(
      <button className="text-sm underline hover:no-underline">View File</button>
    );
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleExportExcel = (reportName: string) => {
    console.log(`Exporting ${reportName} as Excel`);
    setSuccessMessage('Report exported successfully');
    setSuccessAction(
      <button className="text-sm underline hover:no-underline">View File</button>
    );
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleEmailReport = (reportName: string) => {
    setSelectedReport(reportName);
    setShowEmailModal(true);
  };

  const handleScheduleReport = (reportName: string) => {
    setSelectedReport(reportName);
    setShowScheduleModal(true);
  };

  const handleShareReport = (reportName: string) => {
    setSelectedReport(reportName);
    setShowShareModal(true);
  };

  const handleDeleteReport = (reportName: string) => {
    setSelectedReport(reportName);
    setShowDeleteModal(true);
  };

  const handleRenameReport = (reportName: string) => {
    setSelectedReport(reportName);
    setShowRenameModal(true);
  };

  const handleEditReport = (reportName: string) => {
    const reportSlug = reportName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/crm/custom-report-builder?edit=${reportSlug}`);
  };

  const handleRefreshReport = (reportName: string) => {
    console.log(`Refreshing ${reportName}`);
    // Implementation would refresh report data
  };

  const handleRefreshAll = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const handleRetry = () => {
    setHasError(false);
    setHasNetworkError(false);
    setFailedReports([]);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  // Empty state handlers
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleViewAllCategories = () => {
    setSelectedCategory('all');
  };

  // Initial loading simulation
  React.useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close modals with Esc
      if (e.key === 'Escape') {
        setShowScheduleModal(false);
        setShowShareModal(false);
        setShowDeleteModal(false);
        setShowRenameModal(false);
        setShowEmailModal(false);
        setShowMobileFilters(false);
        return;
      }

      // Focus search with /
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Create custom report with C
      if (e.key === 'c' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleNavigateToCustomReportBuilder();
        return;
      }

      // Refresh with R
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        handleRefreshAll();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check if there are any custom reports
  const hasCustomReports = true; // TODO: Replace with actual check from data

  // Check if search has results
  const hasSearchResults = searchQuery === '' || true; // TODO: Implement actual search logic

  // Check if category has reports
  const hasCategoryReports = true; // TODO: Implement category filtering logic

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="p-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center text-sm text-gray-600">
          <Home className="w-4 h-4 mr-2" />
          <button onClick={handleNavigateToDashboard} className="hover:text-blue-600 cursor-pointer">
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Reports</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>Last updated: 5 minutes ago</span>
                  {isRefreshing && (
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleNavigateToCustomReportBuilder}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Custom Report</span>
              </button>
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <MoreVertical className="w-4 h-4" />
                  More
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Schedule Report Delivery
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      Export All Reports (PDF)
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Report Settings
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Manage Favorites
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Archived Reports
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Network Error Banner */}
        {hasNetworkError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900">No internet connection</h3>
                <p className="text-sm text-red-700 mt-1">Some reports may not be up to date</p>
              </div>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Filters Bar - Desktop */}
        <div className="hidden md:block bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range:</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="last30">Last 30 Days</option>
                  <option value="last90">Last 90 Days</option>
                  <option value="custom">Custom Date Range...</option>
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
                  <option value="me">Me Only (Alex Rodriguez)</option>
                  <option value="sales">Sales Team</option>
                  <option value="sarah">Sarah Chen</option>
                  <option value="mike">Mike Johnson</option>
                  <option value="emily">Emily Davis</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Reports</option>
                  <option value="sales">Sales Performance</option>
                  <option value="pipeline">Pipeline Reports</option>
                  <option value="activity">Activity Reports</option>
                  <option value="leads">Lead & Contact Reports</option>
                  <option value="revenue">Revenue Reports</option>
                  <option value="accounts">Account Reports</option>
                  <option value="hrms">🏢 HRMS Performance</option>
                  <option value="custom">My Custom Reports</option>
                  <option value="favorites">Favorites Only</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search:</label>
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reports..."
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filters Toggle */}
        <div className="md:hidden mb-6">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Filters</span>
            </div>
            {showMobileFilters ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showMobileFilters && (
            <div className="mt-2 bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range:</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="last30">Last 30 Days</option>
                  <option value="last90">Last 90 Days</option>
                  <option value="custom">Custom Date Range...</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Owner:</label>
                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Team Members</option>
                  <option value="me">My Reports</option>
                  <option value="alex">Alex Thompson</option>
                  <option value="sarah">Sarah Chen</option>
                  <option value="mike">Mike Johnson</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Reports</option>
                  <option value="sales">Sales Performance</option>
                  <option value="pipeline">Pipeline Reports</option>
                  <option value="activity">Activity Reports</option>
                  <option value="leads">Lead & Contact Reports</option>
                  <option value="revenue">Revenue Reports</option>
                  <option value="accounts">Account Reports</option>
                  <option value="hrms">HRMS Performance</option>
                  <option value="custom">My Custom Reports</option>
                  <option value="favorites">Favorites Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reports..."
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <QuickStatCard
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            label="REVENUE"
            value="$847,000"
            change="+12% vs last month ⬆️"
            sparkline="━━━▁▃▄▃▅▆▇▄▆▅"
            changeColor="text-green-600"
            bgColor="bg-green-50"
            reportName="Sales Overview"
            onView={handleViewReport}
          />
          <QuickStatCard
            icon={<Target className="w-6 h-6 text-blue-600" />}
            label="DEALS WON"
            value="23 Deals"
            change="89% of quota ✅ On track"
            sparkline="▂▂▃▃▅▅▆▆▆█"
            changeColor="text-green-600"
            bgColor="bg-blue-50"
            reportName="Quota Attainment"
            onView={handleViewReport}
          />
          <QuickStatCard
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            label="PIPELINE"
            value="$2.4M"
            change="+8% growth ⬆️"
            sparkline="▁▁▃▃▄▄▆▆▆▇▇█"
            changeColor="text-green-600"
            bgColor="bg-purple-50"
            reportName="Pipeline Health"
            onView={handleViewReport}
          />
          <QuickStatCard
            icon={<Award className="w-6 h-6 text-orange-600" />}
            label="WIN RATE"
            value="68%"
            change="+5 points ⬆️"
            sparkline="▃▃▅▅▆▆▆▆▇▇"
            changeColor="text-green-600"
            bgColor="bg-orange-50"
            reportName="Win/Loss Analysis"
            onView={handleViewReport}
          />
          </div>
        )}

        {/* Empty States */}
        {!hasSearchResults && searchQuery && (
          <div className="mb-6">
            <NoResultsEmptyState query={searchQuery} onClear={handleClearSearch} />
          </div>
        )}

        {!hasCategoryReports && selectedCategory !== 'all' && hasSearchResults && (
          <div className="mb-6">
            <NoCategoryReportsEmptyState onViewAll={handleViewAllCategories} />
          </div>
        )}

        {/* Sales Performance Section */}
        {(hasSearchResults || !searchQuery) && (hasCategoryReports || selectedCategory === 'all') && (
        <>
        <div className="mb-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('sales')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-700" />
                <span className="text-lg font-semibold text-gray-900">💰 SALES PERFORMANCE</span>
                <span className="text-sm text-gray-700">(6 reports)</span>
              </div>
              {expandedSections.sales ? (
                <ChevronUp className="w-5 h-5 text-green-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-green-700" />
              )}
            </button>
          </div>
          {expandedSections.sales && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <ReportCard
                  title="Sales Overview"
                  icon="📊"
                  metrics={[
                    { label: '$847K Revenue', value: '+12% ⬆️' },
                    { label: 'Progress bar', value: '████████░░' },
                    { label: '89% to quota', value: '' },
                  ]}
                  updated="5m"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Sales Overview"}
                  showMoreMenu={showReportMenu === "Sales Overview"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Sales by Rep"
                  icon="👥"
                  metrics={[
                    { label: 'Alex: $342K #1', value: '' },
                    { label: 'Sarah: $298K #2', value: '' },
                    { label: 'Mike: $207K #3', value: '' },
                  ]}
                  updated="5m"
                  sparkline="▇▇▇▆▅▄▃"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Sales by Rep"}
                  showMoreMenu={showReportMenu === "Sales by Rep"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Sales by Team"
                  icon="👔"
                  metrics={[
                    { label: 'Sales Team: $847K', value: '' },
                    { label: '89% of quota ✅', value: '' },
                    { label: 'Team progress', value: '███████████░' },
                  ]}
                  updated="5m"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Sales by Team"}
                  showMoreMenu={showReportMenu === "Sales by Team"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard
                  title="Sales Forecast"
                  icon="📈"
                  metrics={[
                    { label: 'Predicted: $1.2M', value: '' },
                    { label: 'Confidence: 85%', value: '' },
                    { label: 'Forecast trend', value: '' },
                  ]}
                  updated="10m"
                  sparkline="▁▃▅▆▇█▇▅"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Sales Forecast"}
                  showMoreMenu={showReportMenu === "Sales Forecast"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Win/Loss Analysis"
                  icon="📉"
                  metrics={[
                    { label: 'Won: 23 (68%)', value: '' },
                    { label: 'Lost: 11 (32%)', value: '' },
                    { label: 'Win vs Loss', value: '████ vs ██' },
                  ]}
                  updated="1h"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Win/Loss Analysis"}
                  showMoreMenu={showReportMenu === "Win/Loss Analysis"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Quota Attainment"
                  icon="🎯"
                  metrics={[
                    { label: 'Team: 89% ✅', value: '' },
                    { label: 'Alex: 98% ✅', value: '' },
                    { label: 'Sarah: 95% ✅', value: '' },
                    { label: 'Mike: 76% ⚠️', value: '' },
                  ]}
                  updated="5m"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Quota Attainment"}
                  showMoreMenu={showReportMenu === "Quota Attainment"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
              </div>
            </div>
          )}
        </div>

        {/* Pipeline Reports Section */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('pipeline')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-purple-700" />
                <span className="text-lg font-semibold text-gray-900">📊 PIPELINE REPORTS</span>
                <span className="text-sm text-gray-700">(4 reports)</span>
              </div>
              {expandedSections.pipeline ? (
                <ChevronUp className="w-5 h-5 text-purple-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-purple-700" />
              )}
            </button>
          </div>
          {expandedSections.pipeline && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <ReportCard
                  title="Pipeline Health"
                  icon="🏥"
                  metrics={[
                    { label: 'Total: $2.4M', value: '' },
                    { label: 'Qualified: $620K', value: '' },
                    { label: 'Proposal: $890K', value: '' },
                    { label: 'Negotiation: $890K', value: '' },
                  ]}
                  updated="2m"
                  sparkline="▇▇▇▆▅"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Pipeline Health"}
                  showMoreMenu={showReportMenu === "Pipeline Health"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Pipeline by Owner"
                  icon="👤"
                  metrics={[
                    { label: 'Alex: $892K', value: '' },
                    { label: 'Sarah: $745K', value: '' },
                    { label: 'Mike: $563K', value: '' },
                    { label: 'Emily: $200K', value: '' },
                  ]}
                  updated="5m"
                  sparkline="████▇▆▃"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Pipeline by Owner"}
                  showMoreMenu={showReportMenu === "Pipeline by Owner"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Aging Pipeline"
                  icon="⏳"
                  metrics={[
                    { label: '30-60 days: 8', value: '' },
                    { label: '60-90 days: 5', value: '' },
                    { label: '90+ days: 3 ⚠️', value: '' },
                  ]}
                  updated="15m"
                  sparkline="▅▅▄▄▃"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Aging Pipeline"}
                  showMoreMenu={showReportMenu === "Aging Pipeline"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard
                  title="Pipeline Trends"
                  icon="📈"
                  metrics={[
                    { label: 'Nov: $2.1M', value: '' },
                    { label: 'Dec: $2.4M +14%', value: '' },
                    { label: '6-month trend', value: '' },
                  ]}
                  updated="1h"
                  sparkline="▂▃▅▆▇█"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Pipeline Trends"}
                  showMoreMenu={showReportMenu === "Pipeline Trends"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
              </div>
            </div>
          )}
        </div>

        {/* Activity Reports Section */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('activity')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-orange-700" />
                <span className="text-lg font-semibold text-gray-900">📞 ACTIVITY REPORTS</span>
                <span className="text-sm text-gray-700">(4 reports)</span>
              </div>
              {expandedSections.activity ? (
                <ChevronUp className="w-5 h-5 text-orange-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-orange-700" />
              )}
            </button>
          </div>
          {expandedSections.activity && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <ReportCard
                  title="Activity Summary"
                  icon="📊"
                  metrics={[
                    { label: 'Total: 247', value: '' },
                    { label: 'Calls: 78', value: '' },
                    { label: 'Emails: 89', value: '' },
                    { label: 'Meetings: 45', value: '' },
                    { label: 'Tasks: 35', value: '' },
                  ]}
                  updated="1m"
                  sparkline="████▆▅▃"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Activity Summary"}
                  showMoreMenu={showReportMenu === "Activity Summary"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Activity vs Revenue"
                  icon="💰"
                  metrics={[
                    { label: 'High activity =', value: '' },
                    { label: 'High revenue ✅', value: '' },
                    { label: 'Correlation: 87%', value: '' },
                  ]}
                  updated="30m"
                  sparkline="▅█▆▇█"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Activity vs Revenue"}
                  showMoreMenu={showReportMenu === "Activity vs Revenue"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Response Rates"
                  icon="📧"
                  metrics={[
                    { label: 'Email Open: 42%', value: '' },
                    { label: 'Call Connect: 68%', value: '' },
                    { label: 'Meeting Show: 92%', value: '' },
                    { label: 'Industry avg:', value: '' },
                    { label: '38%, 55%, 85%', value: '' },
                  ]}
                  updated="1h"
                  sparkline="▅▇█"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Response Rates"}
                  showMoreMenu={showReportMenu === "Response Rates"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard
                  title="Meeting Analytics"
                  icon="🎤"
                  metrics={[
                    { label: 'Total: 45', value: '' },
                    { label: 'Completed: 42', value: '' },
                    { label: 'No-shows: 3 (7%)', value: '' },
                    { label: 'Avg duration: 28 min', value: '' },
                    { label: '🤖 AI recorded: 38 (84%)', value: '' },
                  ]}
                  updated="15m"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Meeting Analytics"}
                  showMoreMenu={showReportMenu === "Meeting Analytics"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
              </div>
            </div>
          )}
        </div>

        {/* Lead & Contact Reports */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('leads')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-700" />
                <span className="text-lg font-semibold text-gray-900">🎯 LEAD & CONTACT REPORTS</span>
                <span className="text-sm text-gray-700">(4 reports)</span>
              </div>
              {expandedSections.leads ? (
                <ChevronUp className="w-5 h-5 text-blue-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-blue-700" />
              )}
            </button>
          </div>
          {expandedSections.leads && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <ReportCard
                  title="Lead Conversion Funnel"
                  icon="🔄"
                  metrics={[
                    { label: 'Leads: 156', value: '' },
                    { label: 'Contacts: 147', value: '' },
                    { label: 'Deals: 78', value: '' },
                    { label: 'Won: 23', value: '' },
                    { label: 'Conversion: 15%', value: '' },
                  ]}
                  updated="10m"
                  sparkline="████▇▅▂"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Lead Conversion Funnel"}
                  showMoreMenu={showReportMenu === "Lead Conversion Funnel"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Lead Source ROI"
                  icon="📊"
                  metrics={[
                    { label: '🏢 HRMS: 42%', value: '($412K revenue)' },
                    { label: '🎯 Lead Gen: 35%', value: '($298K revenue)' },
                    { label: '🌐 Website: 18%', value: '($89K revenue)' },
                    { label: '✍️ Manual: 5%', value: '($48K revenue)' },
                  ]}
                  updated="30m"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Lead Source ROI"}
                  showMoreMenu={showReportMenu === "Lead Source ROI"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Contact Engagement"
                  icon="💬"
                  metrics={[
                    { label: 'High: 78 (53%)', value: '' },
                    { label: 'Medium: 48 (33%)', value: '' },
                    { label: 'Low: 21 (14%)', value: '' },
                    { label: '⚠️ 21 contacts need re-engage', value: '' },
                  ]}
                  updated="1h"
                  sparkline="████▆▃"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Contact Engagement"}
                  showMoreMenu={showReportMenu === "Contact Engagement"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard
                  title="Lead Response Time"
                  icon="⏱️"
                  metrics={[
                    { label: 'Avg: 2.3 hours', value: '' },
                    { label: 'Best: 12 mins', value: '' },
                    { label: 'Target: <1 hour', value: '' },
                    { label: '<1hr: 85 leads', value: '' },
                    { label: '1-4hr: 42 leads', value: '' },
                    { label: '4+hr: 29 leads ⚠️', value: '' },
                    { label: '💡 Faster = 34% higher conversion', value: '' },
                  ]}
                  updated="20m"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Lead Response Time"}
                  showMoreMenu={showReportMenu === "Lead Response Time"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
              </div>
            </div>
          )}
        </div>

        {/* Revenue Reports */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('revenue')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-teal-700" />
                <span className="text-lg font-semibold text-gray-900">💵 REVENUE REPORTS</span>
                <span className="text-sm text-gray-700">(4 reports)</span>
              </div>
              {expandedSections.revenue ? (
                <ChevronUp className="w-5 h-5 text-teal-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-teal-700" />
              )}
            </button>
          </div>
          {expandedSections.revenue && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <ReportCard
                  title="Revenue by Period"
                  icon="📅"
                  metrics={[
                    { label: 'This Month: $847K', value: '' },
                    { label: 'Last Month: $756K (+12%)', value: '' },
                    { label: 'This Quarter: $2.1M', value: '' },
                  ]}
                  updated="5m"
                  sparkline="▂▃▅▆▇█"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Revenue by Period"}
                  showMoreMenu={showReportMenu === "Revenue by Period"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Revenue by Source"
                  icon="📊"
                  metrics={[
                    { label: '🏢 HRMS: $412K (49%) ⭐', value: '' },
                    { label: '🎯 Lead Gen: $298K (35%)', value: '' },
                    { label: '🌐 Website: $89K (11%)', value: '' },
                    { label: '✍️ Manual: $48K (5%)', value: '' },
                  ]}
                  updated="10m"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Revenue by Source"}
                  showMoreMenu={showReportMenu === "Revenue by Source"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Revenue by Industry"
                  icon="🏭"
                  metrics={[
                    { label: 'SaaS: $342K (40%)', value: '' },
                    { label: 'Enterprise: $298K', value: '' },
                    { label: 'Healthcare: $142K', value: '' },
                    { label: 'Finance: $65K', value: '' },
                    { label: '💡 SaaS highest growth: +28%', value: '' },
                  ]}
                  updated="30m"
                  sparkline="█████▇▅▃"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Revenue by Industry"}
                  showMoreMenu={showReportMenu === "Revenue by Industry"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard
                  title="Revenue Forecast vs Actual"
                  icon="🎯"
                  metrics={[
                    { label: 'Forecast: $950K', value: '' },
                    { label: 'Actual: $847K', value: '' },
                    { label: 'Accuracy: 89%', value: '' },
                    { label: '💡 Forecast improving (+5%)', value: '' },
                  ]}
                  updated="1h"
                  sparkline="▅█ vs ▅▇"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Revenue Forecast vs Actual"}
                  showMoreMenu={showReportMenu === "Revenue Forecast vs Actual"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
              </div>
            </div>
          )}
        </div>

        {/* Account Reports */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('accounts')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-indigo-700" />
                <span className="text-lg font-semibold text-gray-900">🏢 ACCOUNT REPORTS</span>
                <span className="text-sm text-gray-700">(3 reports)</span>
              </div>
              {expandedSections.accounts ? (
                <ChevronUp className="w-5 h-5 text-indigo-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-indigo-700" />
              )}
            </button>
          </div>
          {expandedSections.accounts && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard
                  title="Account Health Score"
                  icon="🏥"
                  metrics={[
                    { label: 'Healthy: 45 (71%)', value: '' },
                    { label: 'At Risk: 12 (19%)', value: '' },
                    { label: 'Critical: 6 (10%)', value: '' },
                    { label: '⚠️ 6 accounts need immediate attention', value: '' },
                  ]}
                  updated="15m"
                  sparkline="██████▃▂"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Account Health Score"}
                  showMoreMenu={showReportMenu === "Account Health Score"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Top Accounts"
                  icon="🌟"
                  metrics={[
                    { label: '1. DataFlow Inc - $95K', value: '' },
                    { label: '2. BigCo Ent - $75K', value: '' },
                    { label: '3. HealthPlus - $62K', value: '' },
                    { label: '4. Acme Corp - $50K', value: '' },
                    { label: '5. TechStart - $42K', value: '' },
                  ]}
                  updated="5m"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Top Accounts"}
                  showMoreMenu={showReportMenu === "Top Accounts"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Account Growth Opportunities"
                  icon="📈"
                  metrics={[
                    { label: 'Expansion: 12', value: '' },
                    { label: 'Upsell: 8', value: '' },
                    { label: 'Cross-sell: 15', value: '' },
                    { label: 'Total potential: $428K', value: '' },
                    { label: '💡 12 accounts ready for expansion NOW', value: '' },
                  ]}
                  updated="1h"
                  sparkline="▇▆▅"
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Account Growth Opportunities"}
                  showMoreMenu={showReportMenu === "Account Growth Opportunities"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
              </div>
            </div>
          )}
        </div>

        {/* HRMS Performance Section - UNIQUE */}
        <div className="mb-6">
          <div className="bg-[#fff3cd] border-2 border-[#ff9800] rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('hrms')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#ff9800]" />
                <span className="text-lg font-semibold text-gray-900">🏢 HRMS PERFORMANCE ⭐ UNIQUE</span>
                <span className="text-sm text-gray-700">(3 reports)</span>
              </div>
              {expandedSections.hrms ? (
                <ChevronUp className="w-5 h-5 text-[#ff9800]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#ff9800]" />
              )}
            </button>
          </div>
          {expandedSections.hrms && (
            <div className="bg-white border-2 border-t-0 border-[#ff9800] rounded-b-lg p-6">
              <div className="bg-[#fff3cd] border border-[#ff9800] rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-gray-900">
                  <Sparkles className="w-5 h-5 text-[#ff9800]" />
                  <span className="font-bold">⭐ EXCLUSIVE TO BMI CRM - Track recruitment impact on sales</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ReportCard
                  title="HRMS Lead Performance"
                  icon="🏢"
                  metrics={[
                    { label: 'HRMS Conversion: 42% ⭐', value: '' },
                    { label: 'vs Non-HRMS: 28% (33% lower)', value: '' },
                    { label: 'Avg Deal Size:', value: '' },
                    { label: 'HRMS: $48K ⭐', value: '' },
                    { label: 'Non-HRMS: $36K', value: '' },
                    { label: 'Sales Cycle:', value: '' },
                    { label: 'HRMS: 38 days ⭐', value: '' },
                    { label: 'Non-HRMS: 67 days (43% faster!)', value: '' },
                  ]}
                  updated="10m"
                  sparkline="▇█ vs ▅▆"
                  highlight
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "HRMS Lead Performance"}
                  showMoreMenu={showReportMenu === "HRMS Lead Performance"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="HRMS ROI Analysis"
                  icon="💰"
                  metrics={[
                    { label: 'HRMS Revenue: $412K (49%) ⭐', value: '' },
                    { label: 'Win Rate: HRMS: 78% ⭐', value: '' },
                    { label: 'Non-HRMS: 58% (+20 points!)', value: '' },
                    { label: 'Response Time:', value: '' },
                    { label: 'HRMS: 2 hours ⭐', value: '' },
                    { label: 'Non-HRMS: 2 days (24x faster!)', value: '' },
                    { label: '🎯 ROI: 387% for HRMS leads', value: '' },
                  ]}
                  updated="15m"
                  progress="████████░"
                  highlight
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "HRMS ROI Analysis"}
                  showMoreMenu={showReportMenu === "HRMS ROI Analysis"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
                <ReportCard
                  title="Recruitment-to-Revenue"
                  icon="🔄"
                  metrics={[
                    { label: 'Total Recruits: 18 placed', value: '' },
                    { label: 'Became CRM Leads: 12 (67%)', value: '' },
                    { label: 'Converted Deals: 8 (67%)', value: '' },
                    { label: 'Total Revenue: $412K from HRMS connections', value: '' },
                    { label: '💡 Jennifer Kim: Top recruiter', value: '' },
                    { label: '6 recruits → $247K revenue', value: '' },
                  ]}
                  updated="30m"
                  sparkline="████▇▆▅▃"
                  highlight
                  onView={handleViewReport}
                  onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                  onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                  showExportMenu={showExportMenu === "Recruitment-to-Revenue"}
                  showMoreMenu={showReportMenu === "Recruitment-to-Revenue"}
                  onSchedule={handleScheduleReport}
                  onShare={handleShareReport}
                  onDelete={handleDeleteReport}
                  onRename={handleRenameReport}
                  onRefresh={handleRefreshReport}
                  onExportPDF={handleExportPDF}
                  onExportCSV={handleExportCSV}
                  onExportExcel={handleExportExcel}
                  onEmail={handleEmailReport}
                />
              </div>
            </div>
          )}
        </div>

        {/* Custom Reports */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-pink-50 to-pink-100 border border-pink-200 rounded-t-lg p-4">
            <button
              onClick={() => toggleSection('custom')}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-pink-700" />
                <span className="text-lg font-semibold text-gray-900">📝 CUSTOM REPORTS (User Created)</span>
              </div>
              {expandedSections.custom ? (
                <ChevronUp className="w-5 h-5 text-pink-700" />
              ) : (
                <ChevronDown className="w-5 h-5 text-pink-700" />
              )}
            </button>
          </div>
          {expandedSections.custom && (
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-6">
              {hasCustomReports ? (
                <>
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <ReportCard
                      title="My Q4 Goals Tracker"
                      icon="⭐"
                      metrics={[
                        { label: 'Created by: Me', value: '' },
                        { label: 'Progress: 78%', value: '' },
                        { label: 'Target: $500K', value: '' },
                        { label: 'Current: $390K', value: '' },
                        { label: '78% complete', value: '' },
                      ]}
                      updated="Last run: 1h ago"
                      progress="████████▇░"
                      editable
                      onView={handleViewReport}
                      onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                      onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                      showExportMenu={showExportMenu === "My Q4 Goals Tracker"}
                      showMoreMenu={showReportMenu === "My Q4 Goals Tracker"}
                      onSchedule={handleScheduleReport}
                      onShare={handleShareReport}
                      onDelete={handleDeleteReport}
                      onRename={handleRenameReport}
                      onRefresh={handleRefreshReport}
                      onExportPDF={handleExportPDF}
                      onExportCSV={handleExportCSV}
                      onExportExcel={handleExportExcel}
                      onEmail={handleEmailReport}
                      onEdit={handleEditReport}
                    />
                    <ReportCard
                      title="SaaS Pipeline Report"
                      icon="📊"
                      metrics={[
                        { label: 'Created by: Me', value: '' },
                        { label: 'SaaS Deals: 15', value: '' },
                        { label: 'Value: $687K', value: '' },
                        { label: 'Avg: $45.8K', value: '' },
                      ]}
                      updated="Last run: 2h ago"
                      sparkline="▅▆▇█▆"
                      editable
                      onView={handleViewReport}
                      onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                      onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                      showExportMenu={showExportMenu === "SaaS Pipeline Report"}
                      showMoreMenu={showReportMenu === "SaaS Pipeline Report"}
                      onSchedule={handleScheduleReport}
                      onShare={handleShareReport}
                      onDelete={handleDeleteReport}
                      onRename={handleRenameReport}
                      onRefresh={handleRefreshReport}
                      onExportPDF={handleExportPDF}
                      onExportCSV={handleExportCSV}
                      onExportExcel={handleExportExcel}
                      onEmail={handleEmailReport}
                      onEdit={handleEditReport}
                    />
                    <ReportCard
                      title="High Priority Deals"
                      icon="🎯"
                      metrics={[
                        { label: 'Created by: Me', value: '' },
                        { label: 'Priority: 18', value: '' },
                        { label: 'Total: $892K', value: '' },
                        { label: 'Close This Week: 5 deals', value: '' },
                      ]}
                      updated="Last run: 30m ago"
                      sparkline="▇▇▅▃"
                      editable
                      onView={handleViewReport}
                      onExport={(title) => setShowExportMenu(showExportMenu === title ? null : title)}
                      onMore={(title) => setShowReportMenu(showReportMenu === title ? null : title)}
                      showExportMenu={showExportMenu === "High Priority Deals"}
                      showMoreMenu={showReportMenu === "High Priority Deals"}
                      onSchedule={handleScheduleReport}
                      onShare={handleShareReport}
                      onDelete={handleDeleteReport}
                      onRename={handleRenameReport}
                      onRefresh={handleRefreshReport}
                      onExportPDF={handleExportPDF}
                      onExportCSV={handleExportCSV}
                      onExportExcel={handleExportExcel}
                      onEmail={handleEmailReport}
                      onEdit={handleEditReport}
                    />
                  </div>
                  <button
                    onClick={handleNavigateToCustomReportBuilder}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center gap-2 text-blue-600 font-medium transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Custom Report
                  </button>
                </>
              ) : (
                <EmptyState
                  icon="📝"
                  title="No Custom Reports Yet"
                  description="Create your first custom report to track metrics that matter to you."
                  actionLabel="Create Custom Report"
                  onAction={handleNavigateToCustomReportBuilder}
                />
              )}
            </div>
          )}
        </div>
        </>
        )}

        {/* Modals */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Report Delivery</h3>
              <p className="text-sm text-gray-600 mb-4">Report: <span className="font-medium">{selectedReport}</span></p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                  <input
                    type="text"
                    placeholder="Enter email addresses..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log(`Scheduling ${selectedReport}`);
                    setShowScheduleModal(false);
                    setSuccessMessage('Report scheduled');
                    setSuccessAction(
                      <div className="text-sm text-green-100">
                        <p>Delivery: Weekly on Mondays at 9:00 AM</p>
                        <button className="underline hover:no-underline mt-1">Manage Schedule</button>
                      </div>
                    );
                    setShowSuccessToast(true);
                    setTimeout(() => setShowSuccessToast(false), 5000);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Report</h3>
              <p className="text-sm text-gray-600 mb-4">Report: <span className="font-medium">{selectedReport}</span></p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Share with</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Entire Team</option>
                    <option>Sales Team</option>
                    <option>Specific Users...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permission</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>View Only</option>
                    <option>Can Edit</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log(`Sharing ${selectedReport}`);
                    setShowShareModal(false);
                    setSuccessMessage('Report shared with 2 people');
                    setSuccessAction(
                      <button className="text-sm underline hover:no-underline">View Details</button>
                    );
                    setShowSuccessToast(true);
                    setTimeout(() => setShowSuccessToast(false), 3000);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Report</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete <span className="font-medium">"{selectedReport}"</span>? This action cannot be undone.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log(`Deleting ${selectedReport}`);
                    setShowDeleteModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {showRenameModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rename Report</h3>
              <p className="text-sm text-gray-600 mb-4">Current name: <span className="font-medium">{selectedReport}</span></p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">New Name</label>
                <input
                  type="text"
                  defaultValue={selectedReport || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRenameModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log(`Renaming ${selectedReport}`);
                    setShowRenameModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        )}

        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Report</h3>
              <p className="text-sm text-gray-600 mb-4">Report: <span className="font-medium">{selectedReport}</span></p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <input
                    type="email"
                    placeholder="Enter email addresses..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Add a message..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log(`Emailing ${selectedReport}`);
                    setShowEmailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
            <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg min-w-[320px]">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{successMessage}</p>
                  {successAction && <div className="mt-2">{successAction}</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Empty State Components
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-6 text-center max-w-md">{description}</p>
      <button
        onClick={onAction}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 transition-all"
      >
        <Plus className="w-5 h-5" />
        {actionLabel}
      </button>
    </div>
  );
};

interface NoResultsEmptyStateProps {
  query: string;
  onClear: () => void;
}

const NoResultsEmptyState: React.FC<NoResultsEmptyStateProps> = ({ query, onClear }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Found</h3>
      <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
        No reports match your search: <span className="font-medium">"{query}"</span>
      </p>
      <button
        onClick={onClear}
        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 transition-all"
      >
        Clear Search
      </button>
    </div>
  );
};

interface NoCategoryReportsEmptyStateProps {
  onViewAll: () => void;
}

const NoCategoryReportsEmptyState: React.FC<NoCategoryReportsEmptyStateProps> = ({ onViewAll }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reports Available</h3>
      <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
        No reports available in this category.
      </p>
      <button
        onClick={onViewAll}
        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 transition-all"
      >
        View All Categories
      </button>
    </div>
  );
};

// Wrapper component to simplify ReportCard usage
interface SimpleReportCardProps {
  title: string;
  icon: string;
  metrics: Array<{ label: string; value: string }>;
  updated: string;
  sparkline?: string;
  progress?: string;
  highlight?: boolean;
  editable?: boolean;
}

const SimpleReportCard: React.FC<SimpleReportCardProps & {
  onView: (title: string) => void;
  onExport: (title: string) => void;
  onSchedule: (title: string) => void;
  onShare: (title: string) => void;
  onDelete?: (title: string) => void;
  onRename?: (title: string) => void;
  onEdit?: (title: string) => void;
  onRefresh: (title: string) => void;
  onExportPDF: (title: string) => void;
  onExportCSV: (title: string) => void;
  onExportExcel: (title: string) => void;
  onEmail: (title: string) => void;
  showReportMenu: string | null;
  showExportMenu: string | null;
  setShowReportMenu: (title: string | null) => void;
  setShowExportMenu: (title: string | null) => void;
}> = (props) => {
  const { title, showReportMenu, showExportMenu, setShowReportMenu, setShowExportMenu, ...rest } = props;

  return (
    <ReportCard
      {...rest}
      title={title}
      showMoreMenu={showReportMenu === title}
      showExportMenu={showExportMenu === title}
      onMore={(t) => setShowReportMenu(showReportMenu === t ? null : t)}
      onExport={(t) => setShowExportMenu(showExportMenu === t ? null : t)}
    />
  );
};

interface QuickStatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  sparkline: string;
  changeColor: string;
  bgColor: string;
  reportName: string;
  onView: (reportName: string) => void;
}

const QuickStatCard: React.FC<QuickStatCardProps> = ({
  icon,
  label,
  value,
  change,
  sparkline,
  changeColor,
  bgColor,
  reportName,
  onView,
}) => {
  return (
    <div
      onClick={() => onView(reportName)}
      className="bg-white rounded-lg border border-gray-200 p-5 h-[140px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          {icon}
        </div>
        <div className="text-sm font-semibold text-gray-600">{label}</div>
      </div>
      <div className="text-[28px] font-bold text-gray-900 leading-none mb-2">{value}</div>
      <div className={`text-sm font-medium mb-2 ${changeColor}`}>{change}</div>
      <div className="text-xs text-gray-400 mb-2 font-mono tracking-wider">{sparkline}</div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onView(reportName);
        }}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
      >
        View Report
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ReportCardProps {
  title: string;
  icon: string;
  metrics: Array<{ label: string; value: string }>;
  updated: string;
  sparkline?: string;
  progress?: string;
  highlight?: boolean;
  editable?: boolean;
  onView: (title: string) => void;
  onExport: (title: string) => void;
  onEdit?: (title: string) => void;
  onMore: (title: string) => void;
  showMoreMenu: boolean;
  showExportMenu: boolean;
  onSchedule: (title: string) => void;
  onShare: (title: string) => void;
  onDelete?: (title: string) => void;
  onRename?: (title: string) => void;
  onRefresh: (title: string) => void;
  onExportPDF: (title: string) => void;
  onExportCSV: (title: string) => void;
  onExportExcel: (title: string) => void;
  onEmail: (title: string) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  icon,
  metrics,
  updated,
  sparkline,
  progress,
  highlight,
  editable,
  onView,
  onExport,
  onEdit,
  onMore,
  showMoreMenu,
  showExportMenu,
  onSchedule,
  onShare,
  onDelete,
  onRename,
  onRefresh,
  onExportPDF,
  onExportCSV,
  onExportExcel,
  onEmail,
}) => {
  return (
    <div
      onClick={() => onView(title)}
      className={`border rounded-lg p-4 min-h-[240px] flex flex-col hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-500 transition-all duration-200 cursor-pointer relative ${
        highlight ? 'border-[#ff9800] bg-[#fff3cd]' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-2xl mb-2">{icon}</div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
        </div>
      </div>
      <div className="space-y-1 mb-3 text-sm overflow-y-auto max-h-[80px] flex-shrink-0">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between text-gray-700">
            <span className={metric.label.startsWith('💡') || metric.label.startsWith('⚠️') ? 'font-medium' : ''}>
              {metric.label}
            </span>
            {metric.value && <span className="text-gray-600">{metric.value}</span>}
          </div>
        ))}
      </div>
      {sparkline && (
        <div className="text-xs text-gray-400 mb-2 font-mono tracking-wider h-[20px] flex-shrink-0">{sparkline}</div>
      )}
      {progress && (
        <div className="text-xs text-blue-600 mb-2 font-mono tracking-wider h-[20px] flex-shrink-0">{progress}</div>
      )}
      <div className="flex-grow"></div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{updated}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(title);
          }}
          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded transition-colors"
        >
          <Eye className="w-4 h-4 inline mr-1" />
          View
        </button>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport(title);
            }}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded transition-colors"
          >
            <Download className="w-4 h-4 inline mr-1" />
            Export
          </button>
          {showExportMenu && (
            <div className="absolute bottom-full mb-2 left-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExportPDF(title);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as PDF
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExportCSV(title);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as CSV
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExportExcel(title);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Export as Excel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEmail(title);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                Email Report
              </button>
            </div>
          )}
        </div>
        {editable && onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(title);
            }}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded transition-colors flex items-center gap-1"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        )}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMore(title);
            }}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>
          {showMoreMenu && (
            <div className="absolute bottom-full mb-2 right-0 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSchedule(title);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Schedule Report
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(title);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share with Team
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh(title);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
              {editable && onRename && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRename(title);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Rename Report
                </button>
              )}
              {editable && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(title);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                >
                  <AlertCircle className="w-4 h-4" />
                  Delete Report
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
