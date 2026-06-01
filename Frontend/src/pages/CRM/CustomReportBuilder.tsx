import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronRight, Save, Play, X, BarChart3, Table2, PieChart,
  LineChart, TrendingUp, Lightbulb, Copy, GripVertical, Plus,
  Sparkles, ChevronDown, AlertTriangle
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface ReportField {
  id: string;
  label: string;
  checked: boolean;
}

interface ReportFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface ReportConfig {
  name: string;
  description: string;
  category: string;
  dataSource: string;
  reportType: string;
  selectedFields: ReportField[];
  filters: ReportFilter[];
  groupBy: string;
  sortBy: string;
  sortDirection: string;
  calculations: string[];
  autoRefresh: string;
  shareWithTeam: boolean;
  allowEdit: boolean;
  emailReport: boolean;
}

const CATEGORIES = [
  'Sales Performance',
  'Pipeline Reports',
  'Activity Reports',
  'Revenue Reports',
  'Lead & Contact Reports',
  'Account Reports',
  'Custom'
];

const DATA_SOURCES = [
  { id: 'deals', label: 'Deals' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'activities', label: 'Activities' },
  { id: 'leads', label: 'Leads' },
  { id: 'revenue', label: 'Revenue' }
];

const REPORT_TYPES = [
  { id: 'table', label: 'Table (List view)', icon: Table2 },
  { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { id: 'line', label: 'Line Chart', icon: LineChart },
  { id: 'pie', label: 'Pie Chart', icon: PieChart },
  { id: 'funnel', label: 'Funnel', icon: TrendingUp },
  { id: 'cards', label: 'Summary Cards', icon: Copy }
];

const DATA_SOURCE_FIELDS: Record<string, ReportField[]> = {
  deals: [
    { id: 'dealName', label: 'Deal Name', checked: true },
    { id: 'account', label: 'Account', checked: true },
    { id: 'value', label: 'Value', checked: true },
    { id: 'stage', label: 'Stage', checked: true },
    { id: 'closeDate', label: 'Close Date', checked: true },
    { id: 'owner', label: 'Owner', checked: true },
    { id: 'contact', label: 'Contact', checked: false },
    { id: 'createdDate', label: 'Created Date', checked: false },
    { id: 'lastActivity', label: 'Last Activity', checked: false },
    { id: 'probability', label: 'Probability', checked: false },
    { id: 'source', label: 'Source', checked: false },
    { id: 'industry', label: 'Industry', checked: false },
    { id: 'hrmsConnection', label: 'HRMS Connection', checked: false },
    { id: 'tags', label: 'Tags', checked: false },
    { id: 'dealHealthScore', label: 'Deal Health Score', checked: false },
    { id: 'daysInStage', label: 'Days in Stage', checked: false },
    { id: 'nextAction', label: 'Next Action', checked: false },
    { id: 'assignedTeam', label: 'Assigned Team', checked: false },
    { id: 'campaign', label: 'Campaign', checked: false },
    { id: 'leadSource', label: 'Lead Source', checked: false },
    { id: 'dealType', label: 'Deal Type', checked: false },
    { id: 'dealAge', label: 'Deal Age (Days)', checked: false },
    { id: 'lastModifiedDate', label: 'Last Modified Date', checked: false },
    { id: 'lastModifiedBy', label: 'Last Modified By', checked: false },
    { id: 'expectedRevenue', label: 'Expected Revenue', checked: false },
    { id: 'actualRevenue', label: 'Actual Revenue', checked: false },
    { id: 'discount', label: 'Discount %', checked: false },
    { id: 'competitors', label: 'Competitors', checked: false },
    { id: 'nextStep', label: 'Next Step', checked: false },
    { id: 'lastContactDate', label: 'Last Contact Date', checked: false },
    { id: 'numberOfContacts', label: 'Number of Contacts', checked: false },
    { id: 'numberOfActivities', label: 'Number of Activities', checked: false },
    { id: 'numberOfNotes', label: 'Number of Notes', checked: false },
    { id: 'numberOfFiles', label: 'Number of Files', checked: false },
    { id: 'fiscalQuarter', label: 'Fiscal Quarter', checked: false },
    { id: 'fiscalYear', label: 'Fiscal Year', checked: false },
    { id: 'accountRegion', label: 'Account Region', checked: false },
    { id: 'accountSize', label: 'Account Size', checked: false },
    { id: 'accountRevenue', label: 'Account Revenue', checked: false },
    { id: 'dealPriority', label: 'Deal Priority', checked: false },
    { id: 'riskLevel', label: 'Risk Level', checked: false },
    { id: 'winLikelihood', label: 'Win Likelihood', checked: false },
    { id: 'forecastCategory', label: 'Forecast Category', checked: false },
    { id: 'decisionMaker', label: 'Decision Maker', checked: false },
    { id: 'budgetConfirmed', label: 'Budget Confirmed', checked: false },
    { id: 'authorityIdentified', label: 'Authority Identified', checked: false },
    { id: 'needIdentified', label: 'Need Identified', checked: false },
    { id: 'timelineEstablished', label: 'Timeline Established', checked: false },
    { id: 'proposalSentDate', label: 'Proposal Sent Date', checked: false },
    { id: 'contractSentDate', label: 'Contract Sent Date', checked: false },
    { id: 'contractSignedDate', label: 'Contract Signed Date', checked: false },
    { id: 'paymentTerms', label: 'Payment Terms', checked: false },
    { id: 'billingFrequency', label: 'Billing Frequency', checked: false },
    { id: 'dealDescription', label: 'Deal Description', checked: false },
    { id: 'lostReason', label: 'Lost Reason', checked: false },
    { id: 'lostReasonDetails', label: 'Lost Reason Details', checked: false },
    { id: 'closedDate', label: 'Closed Date', checked: false },
    { id: 'reopenedDate', label: 'Reopened Date', checked: false },
    { id: 'salesCycle', label: 'Sales Cycle Length', checked: false },
    { id: 'productInterest', label: 'Product Interest', checked: false },
    { id: 'quantity', label: 'Quantity', checked: false },
    { id: 'currency', label: 'Currency', checked: false },
    { id: 'exchangeRate', label: 'Exchange Rate', checked: false }
  ],
  contacts: [
    { id: 'contactName', label: 'Contact Name', checked: true },
    { id: 'account', label: 'Account', checked: true },
    { id: 'email', label: 'Email', checked: true },
    { id: 'phone', label: 'Phone', checked: true },
    { id: 'title', label: 'Title', checked: true },
    { id: 'status', label: 'Status', checked: true },
    { id: 'owner', label: 'Owner', checked: false },
    { id: 'source', label: 'Source', checked: false },
    { id: 'createdDate', label: 'Created Date', checked: false },
    { id: 'lastContact', label: 'Last Contact', checked: false },
    { id: 'engagementScore', label: 'Engagement Score', checked: false },
    { id: 'hrmsConnection', label: 'HRMS Connection', checked: false },
    { id: 'tags', label: 'Tags', checked: false },
    { id: 'department', label: 'Department', checked: false },
    { id: 'location', label: 'Location', checked: false }
  ],
  accounts: [
    { id: 'accountName', label: 'Account Name', checked: true },
    { id: 'industry', label: 'Industry', checked: true },
    { id: 'size', label: 'Size', checked: true },
    { id: 'location', label: 'Location', checked: true },
    { id: 'revenue', label: 'Revenue', checked: true },
    { id: 'owner', label: 'Owner', checked: true },
    { id: 'createdDate', label: 'Created Date', checked: false },
    { id: 'dealCount', label: 'Deal Count', checked: false },
    { id: 'totalValue', label: 'Total Value', checked: false },
    { id: 'hrmsConnection', label: 'HRMS Connection', checked: false },
    { id: 'employees', label: 'Employees', checked: false },
    { id: 'website', label: 'Website', checked: false },
    { id: 'type', label: 'Type', checked: false },
    { id: 'tags', label: 'Tags', checked: false }
  ],
  activities: [
    { id: 'activityType', label: 'Activity Type', checked: true },
    { id: 'title', label: 'Title', checked: true },
    { id: 'date', label: 'Date', checked: true },
    { id: 'owner', label: 'Owner', checked: true },
    { id: 'relatedTo', label: 'Related To (Deal/Contact/Account)', checked: true },
    { id: 'status', label: 'Status', checked: true },
    { id: 'duration', label: 'Duration', checked: false },
    { id: 'outcome', label: 'Outcome', checked: false },
    { id: 'source', label: 'Source', checked: false },
    { id: 'description', label: 'Description', checked: false },
    { id: 'attendees', label: 'Attendees', checked: false },
    { id: 'location', label: 'Location', checked: false },
    { id: 'nextSteps', label: 'Next Steps', checked: false }
  ],
  leads: [
    { id: 'leadName', label: 'Lead Name', checked: true },
    { id: 'company', label: 'Company', checked: true },
    { id: 'email', label: 'Email', checked: true },
    { id: 'phone', label: 'Phone', checked: true },
    { id: 'status', label: 'Status', checked: true },
    { id: 'source', label: 'Source', checked: true },
    { id: 'score', label: 'Score', checked: false },
    { id: 'owner', label: 'Owner', checked: false },
    { id: 'createdDate', label: 'Created Date', checked: false },
    { id: 'responseTime', label: 'Response Time', checked: false },
    { id: 'conversionDate', label: 'Conversion Date', checked: false },
    { id: 'title', label: 'Title', checked: false },
    { id: 'industry', label: 'Industry', checked: false },
    { id: 'tags', label: 'Tags', checked: false }
  ],
  revenue: [
    { id: 'period', label: 'Period', checked: true },
    { id: 'amount', label: 'Amount', checked: true },
    { id: 'source', label: 'Source', checked: true },
    { id: 'deal', label: 'Deal', checked: true },
    { id: 'account', label: 'Account', checked: true },
    { id: 'owner', label: 'Owner', checked: true },
    { id: 'industry', label: 'Industry', checked: false },
    { id: 'type', label: 'Type', checked: false },
    { id: 'quarter', label: 'Quarter', checked: false },
    { id: 'year', label: 'Year', checked: false },
    { id: 'product', label: 'Product', checked: false },
    { id: 'region', label: 'Region', checked: false }
  ]
};

const FILTER_OPERATORS_BY_TYPE: Record<string, string[]> = {
  text: ['equals', 'not equals', 'contains', 'does not contain', 'starts with', 'ends with', 'is empty', 'is not empty'],
  number: ['equals', 'not equals', 'greater than', 'less than', 'greater or equal', 'less or equal', 'between', 'is empty', 'is not empty'],
  date: ['equals', 'before', 'after', 'between', 'last 7 days', 'last 30 days', 'this month', 'this quarter', 'this year', 'is empty', 'is not empty'],
  dropdown: ['equals', 'not equals', 'is any of', 'is none of', 'is empty', 'is not empty']
};

const FIELD_TYPES: Record<string, string> = {
  stage: 'dropdown',
  owner: 'dropdown',
  value: 'number',
  closeDate: 'date',
  dealName: 'text',
  account: 'text',
  contact: 'text',
  createdDate: 'date',
  lastActivity: 'date',
  probability: 'number',
  dealHealthScore: 'number',
  hrmsConnection: 'dropdown'
};

const GROUP_BY_OPTIONS = [
  { value: '', label: 'None (no grouping)' },
  { value: 'stage', label: 'Stage' },
  { value: 'owner', label: 'Owner' },
  { value: 'account', label: 'Account' },
  { value: 'closeDate', label: 'Close Date (Month)' },
  { value: 'source', label: 'Source' },
  { value: 'industry', label: 'Industry' },
  { value: 'hrmsConnection', label: 'HRMS Connection (Yes/No)' },
  { value: 'dealHealth', label: 'Deal Health (Healthy/At Risk/Critical)' }
];

const SORT_BY_OPTIONS = [
  { value: 'dealName', label: 'Deal Name (A-Z)' },
  { value: 'value', label: 'Value' },
  { value: 'closeDate', label: 'Close Date' },
  { value: 'createdDate', label: 'Created Date' },
  { value: 'lastActivity', label: 'Last Activity' },
  { value: 'stage', label: 'Stage (Custom stage order)' }
];

const CALCULATIONS = [
  { id: 'total', label: 'Total (Sum of Value)', preview: '$892K' },
  { id: 'average', label: 'Average Deal Size', preview: '$49.6K' },
  { id: 'count', label: 'Count (Number of Deals)', preview: '18 deals' },
  { id: 'min', label: 'Minimum', preview: '' },
  { id: 'max', label: 'Maximum', preview: '' },
  { id: 'median', label: 'Median', preview: '' },
  { id: 'stddev', label: 'Standard Deviation', preview: '' },
  { id: 'variance', label: 'Variance', preview: '' }
];

const REFRESH_OPTIONS = [
  { value: 'manual', label: 'Manual only' },
  { value: 'onload', label: 'On page load' },
  { value: '5min', label: 'Every 5 minutes' },
  { value: '15min', label: 'Every 15 minutes' },
  { value: '1hour', label: 'Every hour' }
];

const ALL_TEMPLATES = [
  // SALES PERFORMANCE (4)
  {
    id: 'sales-by-rep',
    icon: '📊',
    title: 'Sales by Rep',
    description: 'Track individual performance',
    category: 'Sales Performance',
    config: {
      dataSource: 'deals',
      reportType: 'table',
      groupBy: 'owner',
      sortBy: 'value',
      sortDirection: 'desc',
      fields: ['dealName', 'value', 'stage', 'closeDate'],
      filters: []
    }
  },
  {
    id: 'sales-forecast',
    icon: '📊',
    title: 'Sales Forecast',
    description: 'Predict future revenue',
    category: 'Sales Performance',
    config: {
      dataSource: 'deals',
      reportType: 'bar',
      groupBy: 'closeDate',
      sortBy: 'closeDate',
      sortDirection: 'asc',
      fields: ['closeDate', 'value', 'probability', 'stage'],
      filters: [{ field: 'stage', operator: 'not equals', value: 'Lost' }]
    }
  },
  {
    id: 'win-loss',
    icon: '📊',
    title: 'Win/Loss',
    description: 'Analyze closed deals',
    category: 'Sales Performance',
    config: {
      dataSource: 'deals',
      reportType: 'pie',
      groupBy: 'stage',
      sortBy: 'value',
      sortDirection: 'desc',
      fields: ['stage', 'value', 'dealName', 'closeDate'],
      filters: [{ field: 'stage', operator: 'in', value: 'Won,Lost' }]
    }
  },
  {
    id: 'quota-tracking',
    icon: '📊',
    title: 'Quota Tracking',
    description: 'Monitor quota attainment',
    category: 'Sales Performance',
    config: {
      dataSource: 'deals',
      reportType: 'bar',
      groupBy: 'owner',
      sortBy: 'value',
      sortDirection: 'desc',
      fields: ['owner', 'value', 'stage', 'closeDate'],
      filters: [{ field: 'stage', operator: 'equals', value: 'Won' }]
    }
  },
  // PIPELINE ANALYSIS (3)
  {
    id: 'pipeline-trends',
    icon: '📈',
    title: 'Pipeline Trends',
    description: 'Track pipeline growth',
    category: 'Pipeline Analysis',
    config: {
      dataSource: 'deals',
      reportType: 'line',
      groupBy: 'createdDate',
      sortBy: 'createdDate',
      sortDirection: 'asc',
      fields: ['createdDate', 'value', 'stage'],
      filters: []
    }
  },
  {
    id: 'pipeline-health',
    icon: '📈',
    title: 'Pipeline Health',
    description: 'Assess pipeline quality',
    category: 'Pipeline Analysis',
    config: {
      dataSource: 'deals',
      reportType: 'funnel',
      groupBy: 'stage',
      sortBy: 'stage',
      sortDirection: 'asc',
      fields: ['stage', 'value', 'dealName', 'probability'],
      filters: [{ field: 'stage', operator: 'not in', value: 'Won,Lost' }]
    }
  },
  {
    id: 'aging-pipeline',
    icon: '📈',
    title: 'Aging Pipeline',
    description: 'Find stagnant deals',
    category: 'Pipeline Analysis',
    config: {
      dataSource: 'deals',
      reportType: 'table',
      groupBy: '',
      sortBy: 'daysInStage',
      sortDirection: 'desc',
      fields: ['dealName', 'stage', 'daysInStage', 'value', 'owner'],
      filters: [{ field: 'daysInStage', operator: 'greater than', value: '30' }]
    }
  },
  // ACTIVITY TRACKING (2)
  {
    id: 'activity-summary',
    icon: '📞',
    title: 'Activity Summary',
    description: 'Track team activities',
    category: 'Activity Tracking',
    config: {
      dataSource: 'activities',
      reportType: 'bar',
      groupBy: 'owner',
      sortBy: 'count',
      sortDirection: 'desc',
      fields: ['owner', 'type', 'date', 'relatedTo'],
      filters: []
    }
  },
  {
    id: 'meeting-analytics',
    icon: '📞',
    title: 'Meeting Analytics',
    description: 'Analyze meeting outcomes',
    category: 'Activity Tracking',
    config: {
      dataSource: 'activities',
      reportType: 'table',
      groupBy: 'outcome',
      sortBy: 'date',
      sortDirection: 'desc',
      fields: ['date', 'owner', 'relatedTo', 'outcome', 'duration'],
      filters: [{ field: 'type', operator: 'equals', value: 'Meeting' }]
    }
  },
  // REVENUE ANALYSIS (3)
  {
    id: 'revenue-by-source',
    icon: '💰',
    title: 'Revenue by Source',
    description: 'Compare lead sources',
    category: 'Revenue Analysis',
    config: {
      dataSource: 'revenue',
      reportType: 'pie',
      groupBy: 'source',
      sortBy: 'amount',
      sortDirection: 'desc',
      fields: ['source', 'amount', 'deal'],
      filters: []
    }
  },
  {
    id: 'revenue-trends',
    icon: '💰',
    title: 'Revenue Trends',
    description: 'Track revenue over time',
    category: 'Revenue Analysis',
    config: {
      dataSource: 'revenue',
      reportType: 'line',
      groupBy: 'period',
      sortBy: 'period',
      sortDirection: 'asc',
      fields: ['period', 'amount', 'source', 'owner'],
      filters: []
    }
  },
  {
    id: 'forecast-vs-actual',
    icon: '💰',
    title: 'Forecast vs Actual',
    description: 'Compare projections to reality',
    category: 'Revenue Analysis',
    config: {
      dataSource: 'revenue',
      reportType: 'bar',
      groupBy: 'period',
      sortBy: 'period',
      sortDirection: 'asc',
      fields: ['period', 'forecasted', 'actual', 'variance'],
      filters: []
    }
  },
  // MY ACTIVE DEALS (with filters)
  {
    id: 'my-active-deals',
    icon: '🎯',
    title: 'My Active Deals',
    description: 'Simple deal tracker',
    category: 'Sales Performance',
    config: {
      dataSource: 'deals',
      reportType: 'table',
      groupBy: '',
      sortBy: 'closeDate',
      sortDirection: 'asc',
      fields: ['dealName', 'account', 'value', 'stage', 'closeDate'],
      filters: [
        { field: 'owner', operator: 'equals', value: 'Me' },
        { field: 'stage', operator: 'not in', value: 'Won,Lost' }
      ]
    }
  }
];

const TEMPLATES = ALL_TEMPLATES.slice(0, 4);

const AI_SUGGESTIONS = [
  { label: 'High value deals (>$50K) - Adds filter: Value > 50000', filter: { field: 'value', operator: 'greater than', value: '50000' } },
  { label: 'Closing this quarter - Adds filter: Close Date between Q4 dates', filter: { field: 'closeDate', operator: 'between', value: 'Q4 2024' } },
  { label: 'HRMS-connected deals - Adds filter: HRMS Connection = Yes', filter: { field: 'hrmsConnection', operator: 'equals', value: 'Yes' } },
  { label: 'At risk deals - Adds filter: Deal Health Score < 60', filter: { field: 'dealHealthScore', operator: 'less than', value: '60' } },
  { label: 'Overdue activities - Adds filter: Due Date < Today AND Status ≠ Complete', filter: { field: 'dueDate', operator: 'before', value: 'today' } }
];

export default function CustomReportBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const initialConfig: ReportConfig = {
    name: '',
    description: '',
    category: 'Custom',
    dataSource: 'deals',
    reportType: 'table',
    selectedFields: DATA_SOURCE_FIELDS.deals,
    filters: [],
    groupBy: '',
    sortBy: 'value',
    sortDirection: 'desc',
    calculations: ['total', 'average', 'count'],
    autoRefresh: 'onload',
    shareWithTeam: false,
    allowEdit: false,
    emailReport: false
  };

  const [emailFrequency, setEmailFrequency] = useState('weekly');
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [customFormula, setCustomFormula] = useState('');
  const [formulaError, setFormulaError] = useState('');

  const [config, setConfig] = useState<ReportConfig>(initialConfig);
  const [originalConfig, setOriginalConfig] = useState<ReportConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [draggedField, setDraggedField] = useState<number | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [showDataSourceWarning, setShowDataSourceWarning] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isPreviewUpdating, setIsPreviewUpdating] = useState(false);
  const [, setTimestampTick] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [recordsCount, setRecordsCount] = useState(247);
  const [isEditMode, setIsEditMode] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const hasChanges = () => {
    return JSON.stringify(config) !== JSON.stringify(originalConfig);
  };

  // Real-time preview updates
  useEffect(() => {
    // Trigger preview update animation
    setIsPreviewUpdating(true);

    // Update timestamp
    const timer = setTimeout(() => {
      setLastUpdated(new Date());
      setIsPreviewUpdating(false);
    }, 80); // <100ms for instant feel

    return () => clearTimeout(timer);
  }, [
    config.name,
    config.selectedFields,
    config.filters,
    config.groupBy,
    config.sortBy,
    config.sortDirection,
    config.calculations,
    config.dataSource,
    config.reportType
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifierKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + S - Save as Draft
      if (modifierKey && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }

      // Cmd/Ctrl + Enter - Save & Run Report
      if (modifierKey && e.key === 'Enter') {
        e.preventDefault();
        handleSaveAndRun();
      }

      // Esc - Cancel (with confirmation if changes)
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [config, isSaving, isRunning]); // Re-attach when state changes

  // Update timestamp display periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update timestamp display
      setTimestampTick(prev => prev + 1);
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Check if we're in edit mode and load report data
  useEffect(() => {
    const id = searchParams.get('id');
    const mode = searchParams.get('mode');

    if (id && mode === 'edit') {
      setIsEditMode(true);
      setReportId(id);

      // In a real app, you would load the report from the database here
      // For now, we'll simulate loading with mock data
      // This would be: const report = await fetchReportById(id);

      // Mock: Pre-fill with sample data for demonstration
      const mockReportData: ReportConfig = {
        name: 'Q4 Pipeline Analysis',
        description: 'Comprehensive analysis of Q4 deals by stage and owner',
        category: 'Pipeline Reports',
        dataSource: 'deals',
        reportType: 'table',
        selectedFields: DATA_SOURCE_FIELDS.deals.map(f => ({
          ...f,
          checked: ['dealName', 'account', 'value', 'stage', 'closeDate', 'owner'].includes(f.id)
        })),
        filters: [
          { id: '1', field: 'stage', operator: 'not equals', value: 'Closed Lost' },
          { id: '2', field: 'closeDate', operator: 'between', value: 'Q4 2024' }
        ],
        groupBy: 'stage',
        sortBy: 'value',
        sortDirection: 'desc',
        calculations: ['total', 'average', 'count'],
        autoRefresh: 'onload',
        shareWithTeam: true,
        allowEdit: false,
        emailReport: true
      };

      setConfig(mockReportData);
      setOriginalConfig(mockReportData); // Also set as original for change detection
    }
  }, [searchParams]);

  const validateConfig = (): boolean => {
    const errors: Record<string, string> = {};

    if (!config.name || config.name.trim() === '') {
      errors.name = 'Report name is required';
    } else if (config.name.length > 100) {
      errors.name = 'Report name must be 100 characters or less';
    }

    if (!config.dataSource) {
      errors.dataSource = 'Please select a data source';
    }

    if (!config.reportType) {
      errors.reportType = 'Please select a report type';
    }

    const hasSelectedColumns = config.selectedFields.some(f => f.checked);
    if (!hasSelectedColumns) {
      errors.columns = 'Please select at least one column';
    }

    if (config.description && config.description.length > 500) {
      errors.description = 'Description must be 500 characters or less';
    }

    setValidationErrors(errors);

    // Scroll to first error
    if (Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0];
      const errorElementId = `section-${firstErrorKey}`;
      const element = document.getElementById(errorElementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return Object.keys(errors).length === 0;
  };

  const handleDataSourceChange = (newDataSource: string) => {
    if (config.selectedFields.some(f => f.checked) || config.filters.length > 0) {
      setShowDataSourceWarning(true);
      setTimeout(() => setShowDataSourceWarning(false), 5000);
    }

    setConfig({
      ...config,
      dataSource: newDataSource,
      selectedFields: DATA_SOURCE_FIELDS[newDataSource] || DATA_SOURCE_FIELDS.deals,
      filters: []
    });

    // Clear validation error when data source is selected
    if (validationErrors.dataSource) {
      setValidationErrors({ ...validationErrors, dataSource: '' });
    }
  };

  const getFieldsLabel = () => {
    const labels: Record<string, string> = {
      deals: 'DEAL FIELDS',
      contacts: 'CONTACT FIELDS',
      accounts: 'ACCOUNT FIELDS',
      activities: 'ACTIVITY FIELDS',
      leads: 'LEAD FIELDS',
      revenue: 'REVENUE FIELDS'
    };
    return labels[config.dataSource] || 'FIELDS';
  };

  const handleFieldToggle = (fieldId: string) => {
    const currentlyChecked = config.selectedFields.filter(f => f.checked).length;
    const field = config.selectedFields.find(f => f.id === fieldId);

    if (field && !field.checked && currentlyChecked >= 20) {
      showToast('Maximum 20 columns can be selected', 'error');
      return;
    }

    const updatedFields = config.selectedFields.map(f =>
      f.id === fieldId ? { ...f, checked: !f.checked } : f
    );

    setConfig({
      ...config,
      selectedFields: updatedFields
    });

    // Clear validation error when at least one column is selected
    const hasChecked = updatedFields.some(f => f.checked);
    if (hasChecked && validationErrors.columns) {
      setValidationErrors({ ...validationErrors, columns: '' });
    }
  };

  const handleAddFilter = () => {
    if (config.filters.length >= 10) {
      showToast('Maximum 10 filters allowed', 'error');
      return;
    }

    setConfig({
      ...config,
      filters: [
        ...config.filters,
        { id: Date.now().toString(), field: 'stage', operator: 'equals', value: '' }
      ]
    });
  };

  const handleRemoveFilter = (id: string) => {
    setConfig({
      ...config,
      filters: config.filters.filter(f => f.id !== id)
    });
  };

  const handleUpdateFilter = (id: string, field: keyof ReportFilter, value: string) => {
    setConfig({
      ...config,
      filters: config.filters.map(f =>
        f.id === id ? { ...f, [field]: value } : f
      )
    });
  };

  const handleApplyAISuggestion = (suggestion: typeof AI_SUGGESTIONS[0]) => {
    setConfig({
      ...config,
      filters: [
        ...config.filters,
        {
          id: Date.now().toString(),
          field: suggestion.filter.field,
          operator: suggestion.filter.operator,
          value: suggestion.filter.value
        }
      ]
    });
  };

  const handleCalculationToggle = (calcId: string) => {
    setConfig({
      ...config,
      calculations: config.calculations.includes(calcId)
        ? config.calculations.filter(c => c !== calcId)
        : [...config.calculations, calcId]
    });
  };

  const validateFormula = (formula: string) => {
    if (!formula.trim()) {
      setFormulaError('');
      return true;
    }

    const validFunctions = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'MEDIAN'];
    const hasValidFunction = validFunctions.some(fn => formula.toUpperCase().includes(fn));

    if (!hasValidFunction) {
      setFormulaError('Invalid formula syntax. Use functions like SUM, AVG, COUNT, MIN, MAX, MEDIAN');
      return false;
    }

    setFormulaError('');
    return true;
  };

  const handleCustomFormulaChange = (value: string) => {
    setCustomFormula(value);
    validateFormula(value);
  };

  const toggleRecipient = (recipient: string) => {
    setEmailRecipients(prev =>
      prev.includes(recipient)
        ? prev.filter(r => r !== recipient)
        : [...prev, recipient]
    );
  };

  const getTimeSinceUpdate = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 2) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return lastUpdated.toLocaleTimeString();
  };

  const getOperatorsForField = (fieldId: string): string[] => {
    const fieldType = FIELD_TYPES[fieldId.toLowerCase()] || 'text';
    return FILTER_OPERATORS_BY_TYPE[fieldType] || FILTER_OPERATORS_BY_TYPE.text;
  };

  const handleDragStart = (index: number) => {
    setDraggedField(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedField === null || draggedField === index) return;

    // Work with the filtered list of checked fields
    const checkedFields = config.selectedFields.filter(f => f.checked);
    const uncheckedFields = config.selectedFields.filter(f => !f.checked);

    // Reorder only the checked fields
    const draggedItem = checkedFields[draggedField];
    checkedFields.splice(draggedField, 1);
    checkedFields.splice(index, 0, draggedItem);

    // Combine back: checked fields first (in new order), then unchecked fields
    const newFields = [...checkedFields, ...uncheckedFields];

    setConfig({ ...config, selectedFields: newFields });
    setDraggedField(index);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
  };

  const handleCancel = () => {
    if (hasChanges()) {
      setShowDiscardModal(true);
    } else {
      navigate('/crm/reports');
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    navigate('/crm/reports');
  };

  const handleSaveDraft = async () => {
    if (!validateConfig()) {
      showToast('Please fix errors before saving', 'error');
      return;
    }

    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    showToast('Report saved as draft', 'success');
    navigate('/crm/reports');
  };

  const handleSaveAndRun = async () => {
    if (!validateConfig()) {
      showToast('Please fix errors before saving', 'error');
      return;
    }

    setIsSaving(true);
    setIsRunning(true);
    setLoadingProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    await new Promise(resolve => setTimeout(resolve, 2500));

    setLoadingProgress(100);
    clearInterval(progressInterval);

    setTimeout(() => {
      setIsSaving(false);
      setIsRunning(false);
      setLoadingProgress(0);
      showToast(isEditMode ? 'Report updated successfully' : 'Report created successfully', 'success');
      navigate('/crm/reports');
    }, 300);
  };

  const handleDeleteReport = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteModal(false);

    // In a real app, you would delete from the database here
    // await deleteReport(reportId);

    // Simulate deletion
    await new Promise(resolve => setTimeout(resolve, 500));

    showToast('Report deleted', 'success');
    navigate('/crm/reports');
  };

  const handleLoadTemplate = (template: typeof ALL_TEMPLATES[0]) => {
    const templateConfig = template.config;

    // Get fields for the data source
    const dataSourceFields = DATA_SOURCE_FIELDS[templateConfig.dataSource as keyof typeof DATA_SOURCE_FIELDS] || DATA_SOURCE_FIELDS.deals;

    // Mark specified fields as checked
    const updatedFields = dataSourceFields.map(field => ({
      ...field,
      checked: templateConfig.fields.includes(field.id)
    }));

    // Convert template filters to ReportFilter format with unique IDs
    const templateFilters: ReportFilter[] = templateConfig.filters.map((f, index) => ({
      id: `${Date.now()}-${index}`,
      field: f.field,
      operator: f.operator,
      value: f.value
    }));

    // Update config with template settings
    setConfig({
      ...config,
      name: template.title,
      description: template.description,
      dataSource: templateConfig.dataSource,
      reportType: templateConfig.reportType,
      selectedFields: updatedFields,
      groupBy: templateConfig.groupBy,
      sortBy: templateConfig.sortBy,
      sortDirection: templateConfig.sortDirection,
      filters: templateFilters
    });

    // Close gallery modal if open
    setShowTemplateGallery(false);

    // Show success message
    showToast(`Template loaded: ${template.title}`, 'success');
  };

  const selectedFieldsList = config.selectedFields.filter(f => f.checked);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-3">
        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mb-3">
          <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/dashboard')}>
            Dashboard
          </span>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hover:text-blue-600 cursor-pointer" onClick={() => navigate('/crm/reports')}>
            Reports
          </span>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
          <span className="text-gray-900 font-medium truncate max-w-[200px] md:max-w-none">Custom Report Builder</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {isEditMode ? `Edit Custom Report: ${config.name}` : 'Custom Report Builder'}
              </h1>
            </div>
          </div>

          {/* Desktop Header Actions - Hidden on mobile, shown on medium+ */}
          <div className="hidden md:flex items-center gap-3">
            {isEditMode && (
              <button
                onClick={handleDeleteReport}
                disabled={isSaving || isRunning}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                🗑️ Delete Report
              </button>
            )}
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={isSaving || isRunning}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isSaving && !isRunning ? '⏳ Saving...' : '💾 Save as Draft'}
            </button>
            <button
              onClick={handleSaveAndRun}
              disabled={isSaving || isRunning}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isRunning ? '⏳ Running...' : isEditMode ? '▶️ Update & Run' : '▶️ Save & Run'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col lg:flex-row">
          {/* Left Panel - Configuration */}
          <div className="w-full lg:w-[40%] xl:w-[38%] bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 md:p-6 space-y-6 pb-32">
              <div id="section-name">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-semibold">1️⃣</span>
                  <h2 className="text-lg font-semibold text-gray-900">BASIC INFORMATION</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Name: *
                    </label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) => {
                        setConfig({ ...config, name: e.target.value });
                        if (validationErrors.name) {
                          setValidationErrors({ ...validationErrors, name: '' });
                        }
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter report name..."
                      maxLength={100}
                    />
                    {validationErrors.name && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{validationErrors.name}</span>
                      </div>
                    )}
                    <p className="mt-1 text-xs text-gray-500">{config.name.length}/100 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description: (optional)
                    </label>
                    <textarea
                      value={config.description}
                      onChange={(e) => {
                        setConfig({ ...config, description: e.target.value });
                        if (validationErrors.description) {
                          setValidationErrors({ ...validationErrors, description: '' });
                        }
                      }}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        validationErrors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Describe the purpose of this report..."
                      maxLength={500}
                    />
                    {validationErrors.description && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">{config.description.length}/500 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category:
                    </label>
                    <select
                      value={config.category}
                      onChange={(e) => setConfig({ ...config, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div id="section-dataSource" className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-semibold">2️⃣</span>
                  <h2 className="text-lg font-semibold text-gray-900">DATA SOURCE</h2>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Data Source: *
                  </label>
                  <div className={`space-y-2 ${validationErrors.dataSource ? 'p-3 border-2 border-red-500 rounded-lg bg-red-50' : ''}`}>
                    {DATA_SOURCES.map(source => (
                      <label key={source.id} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="dataSource"
                          value={source.id}
                          checked={config.dataSource === source.id}
                          onChange={(e) => handleDataSourceChange(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-gray-700">{source.label}</span>
                      </label>
                    ))}
                  </div>
                  {validationErrors.dataSource && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{validationErrors.dataSource}</span>
                    </div>
                  )}
                </div>
                {showDataSourceWarning && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Data source changed!</strong> Selected columns and filters have been cleared.
                    </div>
                  </div>
                )}
              </div>

              <div id="section-reportType" className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-semibold">3️⃣</span>
                  <h2 className="text-lg font-semibold text-gray-900">REPORT TYPE</h2>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Choose Visualization: *
                  </label>
                  <div className={`space-y-2 ${validationErrors.reportType ? 'p-3 border-2 border-red-500 rounded-lg bg-red-50' : ''}`}>
                    {REPORT_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <label
                          key={type.id}
                          className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all ${
                            config.reportType === type.id
                              ? 'bg-blue-50 border-2 border-blue-500'
                              : 'border-2 border-transparent hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="reportType"
                            value={type.id}
                            checked={config.reportType === type.id}
                            onChange={(e) => {
                              setConfig({ ...config, reportType: e.target.value });
                              if (validationErrors.reportType) {
                                setValidationErrors({ ...validationErrors, reportType: '' });
                              }
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <Icon className={`w-5 h-5 ${config.reportType === type.id ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`text-gray-700 font-medium ${config.reportType === type.id ? 'text-blue-900' : ''}`}>
                            {type.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {validationErrors.reportType && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{validationErrors.reportType}</span>
                    </div>
                  )}
                  {config.reportType !== 'table' && !validationErrors.reportType && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                      <strong>Note:</strong> Chart visualizations require grouping. Configure in Section 6 below.
                    </div>
                  )}
                </div>
              </div>

              <div id="section-columns" className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-semibold">4️⃣</span>
                  <h2 className="text-lg font-semibold text-gray-900">COLUMNS & METRICS</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Columns to Display: *
                    </label>

                    <div className={`border rounded-lg p-4 mb-4 ${validationErrors.columns ? 'border-red-500 bg-red-50 border-2' : 'border-gray-300'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-gray-700">{getFieldsLabel()}</div>
                        <div className="text-xs text-gray-500">
                          {config.selectedFields.filter(f => f.checked).length}/20 selected
                        </div>
                      </div>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {config.selectedFields
                          .slice(0, showMoreFields ? undefined : 20)
                          .map(field => (
                            <label
                              key={field.id}
                              className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={field.checked}
                                onChange={() => handleFieldToggle(field.id)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span className="text-gray-700 text-sm">{field.label}</span>
                            </label>
                          ))}
                      </div>
                      {config.selectedFields.length > 20 && (
                        <button
                          onClick={() => setShowMoreFields(!showMoreFields)}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                        >
                          {showMoreFields ? 'Show Less Fields' : `Show More Fields (${config.selectedFields.length - 20} more)`}
                          <ChevronDown className={`w-4 h-4 transition-transform ${showMoreFields ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Selected Columns ({selectedFieldsList.length}):
                    </label>
                    {selectedFieldsList.length > 0 ? (
                      <>
                        <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <GripVertical className="w-3 h-3" />
                          Drag to reorder columns
                        </div>
                        <div className="space-y-2">
                          {selectedFieldsList.map((field, index) => (
                            <div
                              key={field.id}
                              draggable
                              onDragStart={() => handleDragStart(index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragEnd={handleDragEnd}
                              className={`flex items-center gap-2 p-3 bg-white rounded-lg border-2 transition-all ${
                                draggedField === index
                                  ? 'border-blue-500 shadow-lg scale-105'
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }`}
                            >
                              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing flex-shrink-0" />
                              <span className="flex-1 text-sm text-gray-900 font-medium">
                                {field.label}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFieldToggle(field.id);
                                }}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                title="Remove column"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500 italic bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                        No columns selected. Check fields above to add columns.
                      </div>
                    )}
                  </div>
                  {validationErrors.columns && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{validationErrors.columns}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-semibold">5️⃣</span>
                  <h2 className="text-lg font-semibold text-gray-900">FILTERS</h2>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Filter Results:
                  </label>

                  {config.filters.map((filter, index) => (
                    <div key={filter.id} className="bg-white border-2 border-gray-300 rounded-lg p-4 space-y-3 hover:border-gray-400 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">Filter {index + 1}</span>
                        <button
                          onClick={() => handleRemoveFilter(filter.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                          title="Remove filter"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={filter.field}
                          onChange={(e) => {
                            handleUpdateFilter(filter.id, 'field', e.target.value);
                            handleUpdateFilter(filter.id, 'operator', 'equals');
                            handleUpdateFilter(filter.id, 'value', '');
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="stage">Stage</option>
                          <option value="owner">Owner</option>
                          <option value="value">Value</option>
                          <option value="closeDate">Close Date</option>
                          <option value="dealName">Deal Name</option>
                          <option value="account">Account</option>
                          <option value="contact">Contact</option>
                          <option value="createdDate">Created Date</option>
                          <option value="lastActivity">Last Activity</option>
                          <option value="probability">Probability</option>
                          <option value="dealHealthScore">Deal Health Score</option>
                          <option value="hrmsConnection">HRMS Connection</option>
                        </select>
                        <select
                          value={filter.operator}
                          onChange={(e) => handleUpdateFilter(filter.id, 'operator', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {getOperatorsForField(filter.field).map(op => (
                            <option key={op} value={op}>{op}</option>
                          ))}
                        </select>
                        {filter.field === 'stage' ? (
                          <select
                            value={filter.value}
                            onChange={(e) => handleUpdateFilter(filter.id, 'value', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select stage...</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Won">Won</option>
                            <option value="Lost">Lost</option>
                          </select>
                        ) : filter.field === 'owner' ? (
                          <select
                            value={filter.value}
                            onChange={(e) => handleUpdateFilter(filter.id, 'value', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select owner...</option>
                            <option value="me">Me (Alex Rodriguez)</option>
                            <option value="sarah">Sarah Johnson</option>
                            <option value="mike">Mike Chen</option>
                            <option value="emma">Emma Wilson</option>
                          </select>
                        ) : filter.field === 'hrmsConnection' ? (
                          <select
                            value={filter.value}
                            onChange={(e) => handleUpdateFilter(filter.id, 'value', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select...</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={filter.value}
                            onChange={(e) => handleUpdateFilter(filter.id, 'value', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter value..."
                          />
                        )}
                      </div>
                    </div>
                  ))}

                  {config.filters.length === 0 && (
                    <div className="text-sm text-gray-500 italic bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      No filters applied. Click "Add Filter" to filter your results.
                    </div>
                  )}

                  <button
                    onClick={handleAddFilter}
                    disabled={config.filters.length >= 10}
                    className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                      config.filters.length >= 10
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                    }`}
                    title={config.filters.length >= 10 ? 'Maximum 10 filters allowed' : 'Add a new filter'}
                  >
                    <Plus className="w-4 h-4" />
                    Add Filter {config.filters.length >= 10 && '(Max 10)'}
                  </button>

                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 mt-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-900">AI Filter Suggestions</span>
                    </div>
                    <div className="space-y-2">
                      {AI_SUGGESTIONS.slice(0, 4).map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 hover:bg-white/50 rounded transition-colors">
                          <span className="text-sm text-purple-800 flex-1 leading-relaxed">
                            {suggestion.label}
                          </span>
                          <button
                            onClick={() => handleApplyAISuggestion(suggestion)}
                            disabled={config.filters.length >= 10}
                            className="text-xs text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium px-3 py-1.5 rounded transition-colors whitespace-nowrap"
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-semibold">6️⃣</span>
                  <h2 className="text-lg font-semibold text-gray-900">GROUPING & SORTING</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group By:
                    </label>
                    <select
                      value={config.groupBy}
                      onChange={(e) => setConfig({ ...config, groupBy: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      {GROUP_BY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {config.groupBy && config.groupBy !== '' && (
                      <div className="mt-2 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2">
                        Preview will show data grouped by {GROUP_BY_OPTIONS.find(o => o.value === config.groupBy)?.label}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Field</label>
                        <select
                          value={config.sortBy}
                          onChange={(e) => setConfig({ ...config, sortBy: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          {SORT_BY_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Order</label>
                        <select
                          value={config.sortDirection}
                          onChange={(e) => setConfig({ ...config, sortDirection: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="asc">Ascending (A-Z, 0-9, oldest first)</option>
                          <option value="desc">Descending (Z-A, 9-0, newest first)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-semibold">7️⃣</span>
                  <h2 className="text-lg font-semibold text-gray-900">CALCULATIONS (Advanced)</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Summary Calculations:
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                      {CALCULATIONS.slice(0, 6).map(calc => (
                        <label key={calc.id} className="flex items-center gap-3 cursor-pointer hover:bg-white p-2 rounded transition-colors group">
                          <input
                            type="checkbox"
                            checked={config.calculations.includes(calc.id)}
                            onChange={() => handleCalculationToggle(calc.id)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900">{calc.label}</span>
                          {config.calculations.includes(calc.id) && calc.preview && (
                            <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                              {calc.preview}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                    {config.calculations.length > 0 && (
                      <div className="mt-2 text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-2">
                        {config.calculations.length} calculation(s) will appear in preview footer
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Formula: <span className="text-gray-500 font-normal text-xs">(Optional - Advanced users)</span>
                    </label>
                    <input
                      type="text"
                      value={customFormula}
                      onChange={(e) => handleCustomFormulaChange(e.target.value)}
                      placeholder="Example: SUM(Value) / COUNT(*)"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 text-sm font-mono ${
                        formulaError
                          ? 'border-red-300 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {formulaError && (
                      <div className="mt-2 flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{formulaError}</span>
                      </div>
                    )}
                    {!formulaError && customFormula && (
                      <div className="mt-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded p-2">
                        ✓ Formula syntax looks valid
                      </div>
                    )}
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-gray-500 font-medium">Example formulas:</div>
                      <div className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">• SUM(Value) / COUNT(*)</div>
                      <div className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">• AVG(Value WHERE Stage='Won')</div>
                      <div className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded">• COUNT(*) / DAYS_SINCE(Created Date)</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-semibold">8️⃣</span>
                  <h2 className="text-lg font-semibold text-gray-900">SCHEDULE & SHARING</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Auto-refresh:
                    </label>
                    <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      {REFRESH_OPTIONS.map(option => (
                        <label
                          key={option.value}
                          className={`flex items-center gap-3 cursor-pointer p-2 rounded transition-colors ${
                            config.autoRefresh === option.value ? 'bg-blue-50' : 'hover:bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="autoRefresh"
                            value={option.value}
                            checked={config.autoRefresh === option.value}
                            onChange={(e) => setConfig({ ...config, autoRefresh: e.target.value })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className={`text-sm ${config.autoRefresh === option.value ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Share with team:
                    </label>
                    <div className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={config.shareWithTeam}
                          onChange={(e) => setConfig({
                            ...config,
                            shareWithTeam: e.target.checked,
                            allowEdit: e.target.checked ? config.allowEdit : false
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700">Make this report visible to team</span>
                      </label>
                      <label className={`flex items-center gap-3 p-2 rounded transition-colors ${
                        config.shareWithTeam ? 'cursor-pointer hover:bg-white' : 'cursor-not-allowed opacity-50'
                      }`}>
                        <input
                          type="checkbox"
                          checked={config.allowEdit}
                          onChange={(e) => setConfig({ ...config, allowEdit: e.target.checked })}
                          disabled={!config.shareWithTeam}
                          className="w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                        />
                        <span className="text-sm text-gray-700">Allow team members to edit</span>
                      </label>
                      {config.shareWithTeam && (
                        <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                          This report will appear in your team's report list
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Schedule delivery:
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={config.emailReport}
                          onChange={(e) => setConfig({ ...config, emailReport: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Email this report</span>
                      </label>

                      {config.emailReport && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Frequency:
                            </label>
                            <select
                              value={emailFrequency}
                              onChange={(e) => setEmailFrequency(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                            >
                              <option value="daily">Daily (every day at 9:00 AM)</option>
                              <option value="weekly">Weekly (every Monday at 9:00 AM)</option>
                              <option value="monthly">Monthly (1st of month at 9:00 AM)</option>
                              <option value="custom">Custom schedule...</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Recipients:
                            </label>
                            <div className="bg-white border border-gray-300 rounded-lg p-3 space-y-2">
                              {['Alex Rodriguez (Me)', 'Sarah Johnson', 'Mike Chen', 'Emma Wilson', 'David Kim', 'Lisa Park'].map(recipient => (
                                <label key={recipient} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={emailRecipients.includes(recipient)}
                                    onChange={() => toggleRecipient(recipient)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                  />
                                  <span className="text-sm text-gray-700">{recipient}</span>
                                </label>
                              ))}
                            </div>
                            {emailRecipients.length > 0 && (
                              <div className="mt-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded p-2">
                                ✓ {emailRecipients.length} recipient{emailRecipients.length !== 1 ? 's' : ''} selected
                              </div>
                            )}
                            {emailRecipients.length === 0 && (
                              <div className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                                ⚠ Please select at least one recipient
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview & Help */}
          <div className="flex-1 bg-gray-50 overflow-y-auto p-4 md:p-6">
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    📊 LIVE PREVIEW
                  </h3>
                  <div className="text-xs text-gray-500">
                    Last updated: {getTimeSinceUpdate()}
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
                  Updates in real-time as you configure settings
                </p>

                <div className={`border border-gray-200 rounded-lg p-4 bg-white shadow transition-all duration-200 ${
                  isPreviewUpdating ? 'animate-shimmer' : ''
                }`}>
                  <h4 className="text-xl font-bold text-gray-900 mb-4">{config.name}</h4>

                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-700 mb-2">Summary:</div>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div>• Total Deals: <span className="font-semibold">18</span></div>
                      <div>• Total Value: <span className="font-semibold">$892K</span></div>
                      <div>• Average: <span className="font-semibold">$49.6K</span></div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div className="bg-blue-600 h-6 rounded-full flex items-center justify-end pr-3" style={{ width: '78%' }}>
                        <span className="text-xs font-semibold text-white">78% of goal</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mb-4">
                    <div className="text-xs md:text-sm font-semibold text-gray-700 mb-3">TABLE PREVIEW:</div>
                    <div className="border border-gray-200 rounded-lg overflow-x-auto">
                      <table className="w-full text-xs md:text-sm min-w-[400px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Deal Name</th>
                            <th className="text-left py-2 px-3 font-medium text-gray-700">Account</th>
                            <th className="text-right py-2 px-3 font-medium text-gray-700">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          <tr className="hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-900">TechStart</td>
                            <td className="py-2 px-3 text-gray-700">Tech Inc</td>
                            <td className="py-2 px-3 text-right font-semibold text-gray-900">$42K</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-900">BigCo Deal</td>
                            <td className="py-2 px-3 text-gray-700">BigCo</td>
                            <td className="py-2 px-3 text-right font-semibold text-gray-900">$75K</td>
                          </tr>
                          <tr className="hover:bg-gray-50">
                            <td className="py-2 px-3 text-gray-900">Acme Prop</td>
                            <td className="py-2 px-3 text-gray-700">Acme</td>
                            <td className="py-2 px-3 text-right font-semibold text-gray-900">$50K</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td colSpan={3} className="py-2 px-3 text-center text-gray-500 italic text-xs">
                              [+ 15 more rows...]
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 rounded-lg p-4 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">💡</span>
                  <div className="text-sm text-blue-900">
                    <strong>Preview Tip:</strong> The preview uses sample data. Click "Run Report" to see actual results.
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  📋 REPORT TEMPLATES
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mb-4">Start from a template:</p>

                <div className="space-y-3">
                  {TEMPLATES.map(template => (
                    <div
                      key={template.id}
                      onClick={() => handleLoadTemplate(template)}
                      className="border border-gray-200 rounded-lg p-3 md:p-4 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-sm md:text-base font-medium text-gray-900 flex items-center gap-2">
                            <span>{template.icon}</span>
                            <span>{template.title}</span>
                          </div>
                          <div className="text-xs md:text-sm text-gray-600 mt-1">{template.description}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadTemplate(template);
                          }}
                          className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 hover:bg-blue-100 rounded transition-colors whitespace-nowrap"
                        >
                          Use Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowTemplateGallery(true)}
                  className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded transition-colors"
                >
                  View All Templates (12)
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 md:p-6 pb-20 md:pb-24">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  ⌨️ KEYBOARD SHORTCUTS
                </h3>
                <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                  <div className="flex items-center justify-between gap-2 py-2 px-2 md:px-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700 text-xs md:text-sm">Save as Draft</span>
                    <kbd className="px-2 md:px-3 py-1 bg-gray-100 border border-gray-300 rounded text-[10px] md:text-xs font-mono text-gray-800 whitespace-nowrap">
                      Ctrl/Cmd + S
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2 px-2 md:px-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700 text-xs md:text-sm">Save & Run</span>
                    <kbd className="px-2 md:px-3 py-1 bg-gray-100 border border-gray-300 rounded text-[10px] md:text-xs font-mono text-gray-800 whitespace-nowrap">
                      Ctrl/Cmd + ↵
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2 px-2 md:px-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700 text-xs md:text-sm">Cancel</span>
                    <kbd className="px-2 md:px-3 py-1 bg-gray-100 border border-gray-300 rounded text-[10px] md:text-xs font-mono text-gray-800 whitespace-nowrap">
                      Esc
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2 px-2 md:px-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700 text-xs md:text-sm">Navigate fields</span>
                    <kbd className="px-2 md:px-3 py-1 bg-gray-100 border border-gray-300 rounded text-[10px] md:text-xs font-mono text-gray-800 whitespace-nowrap">
                      Tab
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2 px-2 md:px-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700 text-xs md:text-sm">Toggle checkbox</span>
                    <kbd className="px-2 md:px-3 py-1 bg-gray-100 border border-gray-300 rounded text-[10px] md:text-xs font-mono text-gray-800 whitespace-nowrap">
                      Space
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2 py-2 px-2 md:px-3 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-700 text-xs md:text-sm">Open dropdown</span>
                    <kbd className="px-2 md:px-3 py-1 bg-gray-100 border border-gray-300 rounded text-[10px] md:text-xs font-mono text-gray-800 whitespace-nowrap">
                      Enter
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar - Mobile Only (visible on md and smaller) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between shadow-lg z-40">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            disabled={isSaving || isRunning}
            title="Cancel (Esc)"
            className="text-sm text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Cancel
          </button>
          {isEditMode && (
            <button
              onClick={handleDeleteReport}
              disabled={isSaving || isRunning}
              title="Delete Report"
              className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              🗑️ Delete
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving || isRunning}
            title="Save as Draft (Ctrl/Cmd + S)"
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSaving && !isRunning ? '⏳' : '💾 Draft'}
          </button>
          <button
            onClick={handleSaveAndRun}
            disabled={isSaving || isRunning}
            title={isEditMode ? 'Update & Run Report (Ctrl/Cmd + Enter)' : 'Save & Run Report (Ctrl/Cmd + Enter)'}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isRunning ? '⏳' : isEditMode ? '▶️ Update' : '▶️ Run'}
          </button>
        </div>
      </div>

      {/* Saving Overlay */}
      {isSaving && !isRunning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 flex flex-col items-center gap-4 w-full max-w-xs md:max-w-sm">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-blue-600"></div>
            <p className="text-base md:text-lg font-medium text-gray-900">Saving report...</p>
          </div>
        </div>
      )}

      {/* Running Report Overlay */}
      {isRunning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 flex flex-col items-center gap-4 w-full max-w-sm md:max-w-md">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-blue-600"></div>
            <p className="text-base md:text-lg font-medium text-gray-900">Running report...</p>
            <p className="text-xs md:text-sm text-gray-600">Analyzing {recordsCount} records...</p>

            {/* Progress Bar */}
            <div className="w-full mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">{loadingProgress}%</p>
            </div>
          </div>
        </div>
      )}

      {showDiscardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 md:p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Discard Changes?</h3>
              <button
                onClick={() => setShowDiscardModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-700 mb-6">
              You have unsaved changes. Are you sure you want to discard?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDiscardModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Stay
              </button>
              <button
                onClick={handleConfirmDiscard}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 md:p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Report?</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-700 mb-2">
              Delete <span className="font-semibold">"{config.name}"</span>?
            </p>
            <p className="text-gray-600 text-sm mb-6">
              This cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showTemplateGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Report Template Gallery</h3>
              <button
                onClick={() => setShowTemplateGallery(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>💰</span>
                    <span>SALES PERFORMANCE (5)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ALL_TEMPLATES.filter(t => t.category === 'Sales Performance').map(template => (
                      <div
                        key={template.id}
                        onClick={() => handleLoadTemplate(template)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <div className="font-medium text-gray-900 flex items-center gap-2 mb-1">
                          <span>{template.icon}</span>
                          <span>{template.title}</span>
                        </div>
                        <div className="text-sm text-gray-600">{template.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📊</span>
                    <span>PIPELINE ANALYSIS (3)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ALL_TEMPLATES.filter(t => t.category === 'Pipeline Analysis').map(template => (
                      <div
                        key={template.id}
                        onClick={() => handleLoadTemplate(template)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <div className="font-medium text-gray-900 flex items-center gap-2 mb-1">
                          <span>{template.icon}</span>
                          <span>{template.title}</span>
                        </div>
                        <div className="text-sm text-gray-600">{template.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📞</span>
                    <span>ACTIVITY TRACKING (2)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ALL_TEMPLATES.filter(t => t.category === 'Activity Tracking').map(template => (
                      <div
                        key={template.id}
                        onClick={() => handleLoadTemplate(template)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <div className="font-medium text-gray-900 flex items-center gap-2 mb-1">
                          <span>{template.icon}</span>
                          <span>{template.title}</span>
                        </div>
                        <div className="text-sm text-gray-600">{template.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>💵</span>
                    <span>REVENUE ANALYSIS (3)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ALL_TEMPLATES.filter(t => t.category === 'Revenue Analysis').map(template => (
                      <div
                        key={template.id}
                        onClick={() => handleLoadTemplate(template)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <div className="font-medium text-gray-900 flex items-center gap-2 mb-1">
                          <span>{template.icon}</span>
                          <span>{template.title}</span>
                        </div>
                        <div className="text-sm text-gray-600">{template.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end">
              <button
                onClick={() => setShowTemplateGallery(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
