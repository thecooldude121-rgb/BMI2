import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Upload, Search, Target, Users, Star, TrendingUp,
  ChevronDown, MoreVertical, CheckCircle, Mail, Phone, Eye,
  UserPlus, Archive, RotateCcw, Bot, Link as LinkIcon
} from 'lucide-react';
import { useLeads } from '../../contexts/LeadContext';
import CRMNavigation from '../../components/CRM/CRMNavigation';

interface Lead {
  id: string;
  name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  source: string;
  sourceIcon: string;
  sourceDetail?: string;
  aiScore: number;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  aiInsight?: string;
  addedDate: string;
  lastContact: string;
  nextAction?: string;
  lostReason?: string;
  lostDate?: string;
}

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { leads: contextLeads } = useLeads();

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score-high');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showScoreDropdown, setShowScoreDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkAssignDropdown, setShowBulkAssignDropdown] = useState(false);
  const [showBulkStatusDropdown, setShowBulkStatusDropdown] = useState(false);
  const [selectedLeadForAction, setSelectedLeadForAction] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'kanban'>('list');
  const [pageLimit, setPageLimit] = useState(20);
  const [displayedLeadsCount, setDisplayedLeadsCount] = useState(20);

  // Mock data for demonstration - 45 total leads
  const mockLeads: Lead[] = [
    {
      id: '1',
      name: 'John Smith',
      company: 'Acme Corp',
      position: 'VP Sales',
      email: 'john@acme.com',
      phone: '+1 555-0123',
      source: '🎯 Lead Gen',
      sourceIcon: '🎯',
      sourceDetail: 'Apollo.io',
      aiScore: 85,
      status: 'new',
      aiInsight: '🤖 High potential - Similar to past wins',
      addedDate: 'Nov 15, 2025',
      lastContact: 'Never'
    },
    {
      id: '2',
      name: 'Sarah Lee',
      company: 'TechStart Inc',
      position: 'CFO',
      email: 'sarah@techstart.com',
      phone: '+1 555-0456',
      source: '🏢 HRMS',
      sourceIcon: '🏢',
      sourceDetail: 'Recruitment',
      aiScore: 92,
      status: 'new',
      aiInsight: '🤖 Excellent fit - Recruited from this company',
      addedDate: 'Nov 14, 2025',
      lastContact: 'Never'
    },
    {
      id: '3',
      name: 'Mike Chen',
      company: 'BigCo Enterprise',
      position: 'Director',
      email: 'mike@bigco.com',
      phone: '+1 555-0789',
      source: '✍️ Manual',
      sourceIcon: '✍️',
      sourceDetail: 'Trade Show',
      aiScore: 67,
      status: 'contacted',
      lastContact: 'Nov 14 (Email sent)',
      nextAction: 'Follow up call (Due: Nov 16)',
      addedDate: 'Nov 12, 2025'
    },
    {
      id: '4',
      name: 'Lisa Wong',
      company: 'StartCo',
      position: 'CEO',
      email: 'lisa@startco.com',
      phone: '+1 555-0321',
      source: '🌐 Website',
      sourceIcon: '🌐',
      sourceDetail: 'Contact Form',
      aiScore: 74,
      status: 'qualified',
      aiInsight: '🤖 Ready to convert - High engagement',
      lastContact: 'Nov 13 (Called, 20 mins)',
      nextAction: 'Send proposal (Due: Nov 15)',
      addedDate: 'Nov 10, 2025'
    },
    {
      id: '5',
      name: 'David Kumar',
      company: 'InnovateLabs',
      position: 'CTO',
      email: 'david@innovatelabs.com',
      phone: '+1 555-0654',
      source: '🎯 Lead Gen',
      sourceIcon: '🎯',
      sourceDetail: 'Apollo.io',
      aiScore: 58,
      status: 'lost',
      lostReason: 'Budget constraints',
      lostDate: 'Nov 10, 2025',
      addedDate: 'Nov 5, 2025',
      lastContact: 'Nov 8 (Call)'
    },
    // Additional leads to reach 45 total (12 new today, 8 hot leads 80+, 25 imported this week)
    { id: '6', name: 'Amanda Rodriguez', company: 'CloudTech Solutions', position: 'CTO', email: 'amanda@cloudtech.com', phone: '+1 555-1001', source: '🎯 Lead Gen', sourceIcon: '🎯', sourceDetail: 'Apollo.io', aiScore: 88, status: 'new', aiInsight: '🤖 Strong technical fit - Cloud infrastructure expert', addedDate: 'Nov 15, 2025', lastContact: 'Never' },
    { id: '7', name: 'Robert Chang', company: 'FinanceHub', position: 'CFO', email: 'robert@financehub.com', phone: '+1 555-1002', source: '🏢 HRMS', sourceIcon: '🏢', sourceDetail: 'Recruitment', aiScore: 91, status: 'new', aiInsight: '🤖 Perfect match - Financial services background', addedDate: 'Nov 15, 2025', lastContact: 'Never' },
    { id: '8', name: 'Jennifer Liu', company: 'DataCorp', position: 'VP Engineering', email: 'jennifer@datacorp.com', phone: '+1 555-1003', source: '🎯 Lead Gen', sourceIcon: '🎯', sourceDetail: 'Apollo.io', aiScore: 83, status: 'new', aiInsight: '🤖 High potential - Data analytics focus', addedDate: 'Nov 15, 2025', lastContact: 'Never' },
    { id: '9', name: 'Michael Torres', company: 'RetailMax', position: 'Director of IT', email: 'michael@retailmax.com', phone: '+1 555-1004', source: '🌐 Website', sourceIcon: '🌐', sourceDetail: 'Contact Form', aiScore: 79, status: 'new', addedDate: 'Nov 15, 2025', lastContact: 'Never' },
    { id: '10', name: 'Patricia Kim', company: 'HealthPlus', position: 'COO', email: 'patricia@healthplus.com', phone: '+1 555-1005', source: '🏢 HRMS', sourceIcon: '🏢', sourceDetail: 'Recruitment', aiScore: 86, status: 'new', aiInsight: '🤖 Healthcare vertical leader', addedDate: 'Nov 15, 2025', lastContact: 'Never' },
    { id: '11', name: 'James Wilson', company: 'TechVentures', position: 'CEO', email: 'james@techventures.com', phone: '+1 555-1006', source: '✍️ Manual', sourceIcon: '✍️', sourceDetail: 'Conference', aiScore: 72, status: 'new', addedDate: 'Nov 15, 2025', lastContact: 'Never' },
    { id: '12', name: 'Linda Martinez', company: 'SmartSystems', position: 'VP Sales', email: 'linda@smartsystems.com', phone: '+1 555-1007', source: '🎯 Lead Gen', sourceIcon: '🎯', sourceDetail: 'Apollo.io', aiScore: 81, status: 'new', aiInsight: '🤖 Enterprise sales expert', addedDate: 'Nov 15, 2025', lastContact: 'Never' },
    { id: '13', name: 'Thomas Anderson', company: 'GlobalTech', position: 'CIO', email: 'thomas@globaltech.com', phone: '+1 555-1008', source: '🌐 Website', sourceIcon: '🌐', sourceDetail: 'Contact Form', aiScore: 77, status: 'new', addedDate: 'Nov 15, 2025', lastContact: 'Never' },
    { id: '14', name: 'Susan Davis', company: 'InnovateCo', position: 'Director Product', email: 'susan@innovateco.com', phone: '+1 555-1009', source: '🏢 HRMS', sourceIcon: '🏢', sourceDetail: 'Recruitment', aiScore: 84, status: 'new', addedDate: 'Nov 15, 2025', lastContact: 'Never' },
    { id: '15', name: 'Daniel Brown', company: 'FutureSoft', position: 'VP Technology', email: 'daniel@futuresoft.com', phone: '+1 555-1010', source: '🎯 Lead Gen', sourceIcon: '🎯', sourceDetail: 'Apollo.io', aiScore: 68, status: 'new', addedDate: 'Nov 15, 2025', lastContact: 'Never' },
    { id: '16', name: 'Maria Garcia', company: 'EcoSolutions', position: 'CEO', email: 'maria@ecosolutions.com', phone: '+1 555-1011', source: '🌐 Website', sourceIcon: '🌐', sourceDetail: 'Contact Form', aiScore: 75, status: 'new', addedDate: 'Nov 15, 2025', lastContact: 'Never' },
    { id: '17', name: 'Kevin Johnson', company: 'AutomationX', position: 'CTO', email: 'kevin@automationx.com', phone: '+1 555-1012', source: '✍️ Manual', sourceIcon: '✍️', sourceDetail: 'Trade Show', aiScore: 70, status: 'new', addedDate: 'Nov 15, 2025', lastContact: 'Never' },
    { id: '18', name: 'Nancy White', company: 'SecurityFirst', position: 'VP Security', email: 'nancy@securityfirst.com', phone: '+1 555-1013', source: '🎯 Lead Gen', sourceIcon: '🎯', sourceDetail: 'Apollo.io', aiScore: 82, status: 'contacted', lastContact: 'Nov 14 (Email)', nextAction: 'Demo call (Due: Nov 18)', addedDate: 'Nov 13, 2025' },
    { id: '19', name: 'Christopher Lee', company: 'MediaGroup', position: 'Director Digital', email: 'chris@mediagroup.com', phone: '+1 555-1014', source: '🏢 HRMS', sourceIcon: '🏢', sourceDetail: 'Recruitment', aiScore: 65, status: 'contacted', lastContact: 'Nov 13 (Called)', nextAction: 'Follow up (Due: Nov 17)', addedDate: 'Nov 12, 2025' },
    { id: '20', name: 'Barbara Taylor', company: 'LogiTrans', position: 'COO', email: 'barbara@logitrans.com', phone: '+1 555-1015', source: '🌐 Website', sourceIcon: '🌐', sourceDetail: 'Contact Form', aiScore: 71, status: 'contacted', lastContact: 'Nov 12 (Email)', nextAction: 'Schedule meeting (Due: Nov 16)', addedDate: 'Nov 11, 2025' },
    { id: '21', name: 'Matthew Harris', company: 'BioMed Research', position: 'CEO', email: 'matthew@biomed.com', phone: '+1 555-1016', source: '🎯 Lead Gen', sourceIcon: '🎯', sourceDetail: 'Apollo.io', aiScore: 73, status: 'qualified', aiInsight: '🤖 Ready for proposal', lastContact: 'Nov 11 (Meeting, 45 mins)', nextAction: 'Send contract (Due: Nov 16)', addedDate: 'Nov 10, 2025' },
    { id: '22', name: 'Elizabeth Clark', company: 'ManufacturingPro', position: 'VP Operations', email: 'elizabeth@mfgpro.com', phone: '+1 555-1017', source: '✍️ Manual', sourceIcon: '✍️', sourceDetail: 'Referral', aiScore: 76, status: 'qualified', lastContact: 'Nov 10 (Called)', nextAction: 'Final review (Due: Nov 15)', addedDate: 'Nov 9, 2025' },
    { id: '23', name: 'Joseph Walker', company: 'EduTech Solutions', position: 'CTO', email: 'joseph@edutech.com', phone: '+1 555-1018', source: '🏢 HRMS', sourceIcon: '🏢', sourceDetail: 'Recruitment', aiScore: 69, status: 'contacted', lastContact: 'Nov 14 (Email)', addedDate: 'Nov 13, 2025' },
    { id: '24', name: 'Margaret Hall', company: 'ConsultPro', position: 'Managing Partner', email: 'margaret@consultpro.com', phone: '+1 555-1019', source: '🌐 Website', sourceIcon: '🌐', sourceDetail: 'Contact Form', aiScore: 78, status: 'qualified', lastContact: 'Nov 12 (Meeting)', nextAction: 'Proposal review (Due: Nov 16)', addedDate: 'Nov 11, 2025' },
    { id: '25', name: 'Steven Young', company: 'NetworkSys', position: 'Director Infrastructure', email: 'steven@networksys.com', phone: '+1 555-1020', source: '🎯 Lead Gen', sourceIcon: '🎯', sourceDetail: 'Apollo.io', aiScore: 64, status: 'contacted', lastContact: 'Nov 13 (Called)', addedDate: 'Nov 12, 2025' },
    { id: '26', name: 'Dorothy King', company: 'PaymentHub', position: 'CFO', email: 'dorothy@paymenthub.com', phone: '+1 555-1021', source: '🏢 HRMS', sourceIcon: '🏢', sourceDetail: 'Recruitment', aiScore: 80, status: 'qualified', lastContact: 'Nov 11 (Meeting)', addedDate: 'Nov 10, 2025' },
    { id: '27', name: 'Paul Wright', company: 'DevOps Inc', position: 'VP Engineering', email: 'paul@devops.com', phone: '+1 555-1022', source: '✍️ Manual', sourceIcon: '✍️', sourceDetail: 'Conference', aiScore: 72, status: 'contacted', lastContact: 'Nov 12 (Email)', addedDate: 'Nov 11, 2025' },
    { id: '28', name: 'Carol Green', company: 'MarketingMax', position: 'CMO', email: 'carol@marketingmax.com', phone: '+1 555-1023', source: '🌐 Website', sourceIcon: '🌐', sourceDetail: 'Contact Form', aiScore: 66, status: 'contacted', lastContact: 'Nov 13 (Email)', addedDate: 'Nov 12, 2025' },
    { id: '29', name: 'George Adams', company: 'SupplyChain Solutions', position: 'COO', email: 'george@supplysolutions.com', phone: '+1 555-1024', source: '🎯 Lead Gen', sourceIcon: '🎯', sourceDetail: 'Apollo.io', aiScore: 75, status: 'contacted', lastContact: 'Nov 14 (Called)', addedDate: 'Nov 13, 2025' },
    { id: '30', name: 'Sandra Baker', company: 'AnalyticsPro', position: 'Director BI', email: 'sandra@analyticspro.com', phone: '+1 555-1025', source: '🏢 HRMS', sourceIcon: '🏢', sourceDetail: 'Recruitment', aiScore: 68, status: 'contacted', lastContact: 'Nov 12 (Email)', addedDate: 'Nov 11, 2025' },
    { id: '31', name: 'Kenneth Nelson', company: 'EnterpriseTech', position: 'CEO', email: 'kenneth@enterprisetech.com', phone: '+1 555-1026', source: '🌐 Website', sourceIcon: '🌐', sourceDetail: 'Contact Form', aiScore: 71, status: 'contacted', lastContact: 'Nov 13 (Called)', addedDate: 'Nov 12, 2025' },
    { id: '32', name: 'Helen Carter', company: 'CloudStorage Inc', position: 'CTO', email: 'helen@cloudstorage.com', phone: '+1 555-1027', source: '🎯 Lead Gen', sourceIcon: '🎯', sourceDetail: 'Apollo.io', aiScore: 73, status: 'contacted', lastContact: 'Nov 14 (Email)', addedDate: 'Nov 13, 2025' },
    { id: '33', name: 'Brian Mitchell', company: 'SaaSVentures', position: 'VP Product', email: 'brian@saasventures.com', phone: '+1 555-1028', source: '✍️ Manual', sourceIcon: '✍️', sourceDetail: 'Referral', aiScore: 67, status: 'contacted', lastContact: 'Nov 13 (Called)', addedDate: 'Nov 12, 2025' },
    { id: '34', name: 'Lisa Roberts', company: 'MobileTech', position: 'Director Mobile', email: 'lisa.r@mobiletech.com', phone: '+1 555-1029', source: '🏢 HRMS', sourceIcon: '🏢', sourceDetail: 'Recruitment', aiScore: 70, status: 'contacted', lastContact: 'Nov 12 (Email)', addedDate: 'Nov 11, 2025' },
    { id: '35', name: 'Edward Turner', company: 'APIServices', position: 'CTO', email: 'edward@apiservices.com', phone: '+1 555-1030', source: '🌐 Website', sourceIcon: '🌐', sourceDetail: 'Contact Form', aiScore: 74, status: 'contacted', lastContact: 'Nov 13 (Called)', addedDate: 'Nov 12, 2025' },
    { id: '36', name: 'Michelle Phillips', company: 'DataWarehouse Co', position: 'VP Data', email: 'michelle@datawarehouse.com', phone: '+1 555-1031', source: '🎯 Lead Gen', sourceIcon: '🎯', sourceDetail: 'Apollo.io', aiScore: 69, status: 'contacted', lastContact: 'Nov 14 (Email)', addedDate: 'Nov 13, 2025' },
    { id: '37', name: 'Donald Campbell', company: 'AILabs', position: 'CEO', email: 'donald@ailabs.com', phone: '+1 555-1032', source: '✍️ Manual', sourceIcon: '✍️', sourceDetail: 'Conference', aiScore: 72, status: 'contacted', lastContact: 'Nov 12 (Email)', addedDate: 'Nov 11, 2025' },
    { id: '38', name: 'Ashley Parker', company: 'CyberDefense', position: 'CISO', email: 'ashley@cyberdefense.com', phone: '+1 555-1033', source: '🏢 HRMS', sourceIcon: '🏢', sourceDetail: 'Recruitment', aiScore: 76, status: 'contacted', lastContact: 'Nov 13 (Called)', addedDate: 'Nov 12, 2025' },
    { id: '39', name: 'Joshua Evans', company: 'BlockchainCo', position: 'CTO', email: 'joshua@blockchainco.com', phone: '+1 555-1034', source: '🌐 Website', sourceIcon: '🌐', sourceDetail: 'Contact Form', aiScore: 68, status: 'contacted', lastContact: 'Nov 12 (Email)', addedDate: 'Nov 11, 2025' },
    { id: '40', name: 'Kimberly Edwards', company: 'MLSystems', position: 'VP Research', email: 'kimberly@mlsystems.com', phone: '+1 555-1035', source: '🎯 Lead Gen', sourceIcon: '🎯', sourceDetail: 'Apollo.io', aiScore: 71, status: 'contacted', lastContact: 'Nov 13 (Email)', addedDate: 'Nov 12, 2025' },
    { id: '41', name: 'Ryan Collins', company: 'IoTSolutions', position: 'Director IoT', email: 'ryan@iotsolutions.com', phone: '+1 555-1036', source: '✍️ Manual', sourceIcon: '✍️', sourceDetail: 'Trade Show', aiScore: 65, status: 'lost', lostReason: 'Chose competitor', lostDate: 'Nov 12, 2025', addedDate: 'Nov 1, 2025', lastContact: 'Nov 10 (Call)' },
    { id: '42', name: 'Stephanie Stewart', company: 'GreenEnergy Tech', position: 'CEO', email: 'stephanie@greenenergy.com', phone: '+1 555-1037', source: '🏢 HRMS', sourceIcon: '🏢', sourceDetail: 'Recruitment', aiScore: 63, status: 'lost', lostReason: 'Not interested', lostDate: 'Nov 11, 2025', addedDate: 'Oct 28, 2025', lastContact: 'Nov 9 (Email)' },
    { id: '43', name: 'Jason Morris', company: 'RoboticsSys', position: 'CTO', email: 'jason@roboticssys.com', phone: '+1 555-1038', source: '🌐 Website', sourceIcon: '🌐', sourceDetail: 'Contact Form', aiScore: 61, status: 'lost', lostReason: 'Timeline too long', lostDate: 'Nov 9, 2025', addedDate: 'Oct 25, 2025', lastContact: 'Nov 7 (Call)' },
    { id: '44', name: 'Angela Rogers', company: 'VRExperience', position: 'VP Product', email: 'angela@vrexperience.com', phone: '+1 555-1039', source: '🎯 Lead Gen', sourceIcon: '🎯', sourceDetail: 'Apollo.io', aiScore: 59, status: 'lost', lostReason: 'Budget constraints', lostDate: 'Nov 8, 2025', addedDate: 'Oct 22, 2025', lastContact: 'Nov 5 (Email)' },
    { id: '45', name: 'Nicholas Reed', company: 'ARTech Inc', position: 'Director Innovation', email: 'nicholas@artech.com', phone: '+1 555-1040', source: '✍️ Manual', sourceIcon: '✍️', sourceDetail: 'Referral', aiScore: 60, status: 'lost', lostReason: 'Internal solution chosen', lostDate: 'Nov 7, 2025', addedDate: 'Oct 20, 2025', lastContact: 'Nov 4 (Call)' }
  ];

  const [leads, setLeads] = useState<Lead[]>(mockLeads);

  // Stats calculations
  const stats = {
    total: leads.length,
    newToday: leads.filter(l => l.addedDate.includes('Nov 15')).length,
    hot: leads.filter(l => l.aiScore >= 80).length,
    importedThisWeek: leads.filter(l =>
      new Date(l.addedDate).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length
  };

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.source.includes(sourceFilter);
    const matchesScore =
      scoreFilter === 'all' ||
      (scoreFilter === '80-100' && lead.aiScore >= 80) ||
      (scoreFilter === '60-79' && lead.aiScore >= 60 && lead.aiScore < 80) ||
      (scoreFilter === 'below-60' && lead.aiScore < 60);
    const matchesSearch = searchQuery === '' ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSource && matchesScore && matchesSearch;
  });

  // Sort leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === 'score-high') return b.aiScore - a.aiScore;
    if (sortBy === 'score-low') return a.aiScore - b.aiScore;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'date-new') return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
    return 0;
  });

  const handleSelectAll = () => {
    if (selectedLeads.length === sortedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(sortedLeads.map(l => l.id));
    }
  };

  const handleSelectLead = (id: string) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
    );
  };

  const getStarRating = (score: number) => {
    const stars = Math.round((score / 100) * 5);
    return '⭐'.repeat(stars);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-800 bg-green-100 border-green-200';
    if (score >= 60) return 'text-green-700 bg-green-50 border-green-200';
    return 'text-orange-700 bg-orange-50 border-orange-200';
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      new: 'bg-blue-500 text-white',
      contacted: 'bg-orange-500 text-white',
      qualified: 'bg-green-500 text-white',
      lost: 'bg-red-500 text-white'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('Lead Gen')) return { icon: '🎯', color: 'text-blue-600 bg-blue-50' };
    if (source.includes('HRMS')) return { icon: '🏢', color: 'text-yellow-600 bg-yellow-50' };
    if (source.includes('Manual')) return { icon: '✍️', color: 'text-gray-600 bg-gray-50' };
    if (source.includes('Website')) return { icon: '🌐', color: 'text-green-600 bg-green-50' };
    return { icon: '📋', color: 'text-gray-600 bg-gray-50' };
  };

  // Handler functions for interactions
  const handleContactLead = (lead: Lead) => {
    setSelectedLeadForAction(lead);
    setShowContactModal(true);
  };

  const handleConvertToContact = (lead: Lead) => {
    setSelectedLeadForAction(lead);
    setShowConvertModal(true);
  };

  const confirmConvert = () => {
    if (selectedLeadForAction) {
      setShowConvertModal(false);
      navigate('/crm/contacts/new', { state: { fromLead: selectedLeadForAction } });
    }
  };

  const handleArchiveLead = (leadId: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'lost' as const } : l));
    alert('Lead archived');
  };

  const handleReactivateLead = (leadId: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'new' as const } : l));
    alert('Lead reactivated');
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedLeads.length} leads?`)) {
      setLeads(prev => prev.filter(l => !selectedLeads.includes(l.id)));
      setSelectedLeads([]);
      setShowDeleteModal(false);
    }
  };

  const handleBulkAssign = (teamMember: string) => {
    alert(`Assigned ${selectedLeads.length} leads to ${teamMember}`);
    setShowBulkAssignDropdown(false);
    setSelectedLeads([]);
  };

  const handleBulkStatusChange = (newStatus: string) => {
    setLeads(prev => prev.map(l =>
      selectedLeads.includes(l.id) ? { ...l, status: newStatus as any } : l
    ));
    setShowBulkStatusDropdown(false);
    setSelectedLeads([]);
    alert(`Changed status for ${selectedLeads.length} leads to ${newStatus}`);
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Company', 'Email', 'Phone', 'Status', 'Score'],
      ...leads.filter(l => selectedLeads.includes(l.id)).map(l => [
        l.name, l.company, l.email, l.phone, l.status, l.aiScore.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-export.csv';
    a.click();
    setSelectedLeads([]);
  };

  const handleLoadMore = () => {
    setDisplayedLeadsCount(prev => Math.min(prev + 20, sortedLeads.length));
  };

  const handleViewLeadDetail = (leadId: string) => {
    navigate(`/crm/leads/${leadId}`);
  };

  const teamMembers = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams'];

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <span>🎯</span>
              <span>Leads</span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">Manage and qualify incoming leads</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/crm/leads/new')}
              className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </button>
            <button
              onClick={() => navigate('/crm/leads/integrations')}
              className="flex items-center px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Integrations
            </button>
            <button
              onClick={() => navigate('/crm/leads/import')}
              className="flex items-center px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600 font-medium mt-1">Total Leads</div>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl font-bold text-gray-900">{stats.newToday}</div>
            <div className="text-sm text-gray-600 font-medium mt-1">New Today</div>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl font-bold text-gray-900">{stats.hot}</div>
            <div className="text-sm text-gray-600 font-medium mt-1">Hot Leads</div>
          </div>
          <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="text-4xl font-bold text-gray-900">{stats.importedThisWeek}</div>
            <div className="text-sm text-gray-600 font-medium mt-1">Imported This Wk</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="space-y-4">
          {/* Filter Chips */}
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <div className="flex items-center space-x-2">
              {['all', 'new', 'contacted', 'qualified', 'lost'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Source:</span>
            <div className="flex items-center space-x-2">
              {['all', 'Lead Gen', 'HRMS', 'Manual', 'Website'].map(source => (
                <button
                  key={source}
                  onClick={() => setSourceFilter(source === 'all' ? 'all' : source)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sourceFilter === (source === 'all' ? 'all' : source)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {source}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Score:</span>
            <div className="flex items-center space-x-2">
              {[
                { value: 'all', label: 'All' },
                { value: '80-100', label: '80-100' },
                { value: '60-79', label: '60-79' },
                { value: 'below-60', label: 'Below 60' }
              ].map(score => (
                <button
                  key={score.value}
                  onClick={() => setScoreFilter(score.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    scoreFilter === score.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {score.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4 flex-1">
              <span className="text-sm font-medium text-gray-700">Search:</span>
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, company, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  <span>Sort: Score (High to Low)</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {[
                      { value: 'score-high', label: 'Score (High to Low)' },
                      { value: 'score-low', label: 'Score (Low to High)' },
                      { value: 'name', label: 'Name (A-Z)' },
                      { value: 'date-new', label: 'Date (Newest)' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 border border-gray-300 rounded-lg p-1 bg-gray-50">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'list' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  📋 List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  🔲 Grid
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    viewMode === 'kanban' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  📊 Kanban
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === sortedLeads.length && sortedLeads.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Name/Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  AI Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedLeads.slice(0, displayedLeadsCount).map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => handleSelectLead(lead.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-5">
                    <div className="space-y-1">
                      <div className="font-bold text-base text-gray-900">{lead.name}</div>
                      <div className="text-sm text-gray-700 font-medium">{lead.company}</div>
                      <div className="text-xs text-gray-600">{lead.position}</div>
                      <div className="text-xs text-gray-600">{lead.email}</div>
                      <div className="text-xs text-gray-600">{lead.phone}</div>
                      {lead.aiInsight && (
                        <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded mt-2 inline-block border border-purple-200">
                          {lead.aiInsight}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Added: {lead.addedDate} | Last contact: {lead.lastContact}
                      </div>
                      {lead.nextAction && (
                        <div className="text-xs text-gray-500">Next: {lead.nextAction}</div>
                      )}
                      {lead.lostReason && (
                        <div className="text-xs text-red-600 mt-2 bg-red-50 px-2 py-1 rounded inline-block">
                          Lost reason: {lead.lostReason}
                          <br />
                          Lost date: {lead.lostDate}
                        </div>
                      )}
                      <div className="flex items-center space-x-2 mt-3">
                        {lead.status === 'new' && (
                          <>
                            <button
                              onClick={() => handleContactLead(lead)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium"
                            >
                              Contact
                            </button>
                            <button
                              onClick={() => handleConvertToContact(lead)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium"
                            >
                              Convert to Contact
                            </button>
                            <button
                              onClick={() => handleViewLeadDetail(lead.id)}
                              className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 font-medium"
                            >
                              View
                            </button>
                          </>
                        )}
                        {lead.status === 'contacted' && (
                          <>
                            <button
                              onClick={() => handleContactLead(lead)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium"
                            >
                              Follow Up
                            </button>
                            <button
                              onClick={() => handleConvertToContact(lead)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium"
                            >
                              Convert to Contact
                            </button>
                            <button
                              onClick={() => handleViewLeadDetail(lead.id)}
                              className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 font-medium"
                            >
                              View
                            </button>
                          </>
                        )}
                        {lead.status === 'qualified' && (
                          <>
                            <button
                              onClick={() => handleConvertToContact(lead)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 font-medium"
                            >
                              Convert to Contact
                            </button>
                            <button
                              onClick={() => handleViewLeadDetail(lead.id)}
                              className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 font-medium"
                            >
                              View
                            </button>
                          </>
                        )}
                        {lead.status === 'lost' && (
                          <>
                            <button
                              onClick={() => handleArchiveLead(lead.id)}
                              className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 font-medium"
                            >
                              Archive
                            </button>
                            <button
                              onClick={() => handleReactivateLead(lead.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium"
                            >
                              Reactivate
                            </button>
                            <button
                              onClick={() => handleViewLeadDetail(lead.id)}
                              className="px-3 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 font-medium"
                            >
                              View
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${getSourceIcon(lead.source).color}`}>
                        <span className="text-lg">{getSourceIcon(lead.source).icon}</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{lead.source}</div>
                        {lead.sourceDetail && (
                          <div className="text-xs text-gray-500">{lead.sourceDetail}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col items-center space-y-1">
                      <div className={`text-3xl font-bold px-3 py-1 rounded-lg border-2 ${getScoreColor(lead.aiScore)}`}>
                        {lead.aiScore}
                      </div>
                      <div className="text-base">{getStarRating(lead.aiScore)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className={`inline-flex px-4 py-2 rounded-lg text-xs font-bold ${getStatusBadge(lead.status)}`}>
                      {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setShowActionsMenu(showActionsMenu === lead.id ? null : lead.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>
                      {showActionsMenu === lead.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => navigate(`/crm/leads/${lead.id}`)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </button>
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </button>
                          <button
                            onClick={() => navigate('/crm/contacts/new')}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Convert to Contact
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Load More / Pagination */}
        <div className="mt-6 text-center">
          <div className="text-sm text-gray-600 mb-4">
            Showing {Math.min(displayedLeadsCount, sortedLeads.length)} of {sortedLeads.length} leads
          </div>
          {displayedLeadsCount < sortedLeads.length && (
            <button
              onClick={handleLoadMore}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Load More...
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 px-6 py-4 z-50">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-gray-900">
              {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
            </span>

            {/* Assign Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBulkAssignDropdown(!showBulkAssignDropdown)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Assign to...
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>
              {showBulkAssignDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {teamMembers.map(member => (
                    <button
                      key={member}
                      onClick={() => handleBulkAssign(member)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {member}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Change Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBulkStatusDropdown(!showBulkStatusDropdown)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                Change Status
                <ChevronDown className="h-4 w-4 ml-2" />
              </button>
              {showBulkStatusDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {['new', 'contacted', 'qualified', 'lost'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleBulkStatusChange(status)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleExport}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Export
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && selectedLeadForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact {selectedLeadForAction.name}</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                <Mail className="h-5 w-5 mr-3 text-blue-600" />
                <div>
                  <div className="font-medium">Send Email</div>
                  <div className="text-sm text-gray-600">{selectedLeadForAction.email}</div>
                </div>
              </button>
              <button className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                <Phone className="h-5 w-5 mr-3 text-green-600" />
                <div>
                  <div className="font-medium">Call</div>
                  <div className="text-sm text-gray-600">{selectedLeadForAction.phone}</div>
                </div>
              </button>
              <button className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                <Users className="h-5 w-5 mr-3 text-purple-600" />
                <div>
                  <div className="font-medium">Schedule Meeting</div>
                  <div className="text-sm text-gray-600">Open calendar</div>
                </div>
              </button>
            </div>
            <button
              onClick={() => setShowContactModal(false)}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Convert to Contact Modal */}
      {showConvertModal && selectedLeadForAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Convert to Contact</h3>
            <p className="text-gray-600 mb-6">
              Convert <strong>{selectedLeadForAction.name}</strong> from {selectedLeadForAction.company} to a contact?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmConvert}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Convert
              </button>
              <button
                onClick={() => setShowConvertModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
