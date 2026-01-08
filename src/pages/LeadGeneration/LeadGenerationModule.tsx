import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LeadGenNavigation from '../../components/LeadGeneration/LeadGenNavigation';
import LeadGenerationDashboard from './LeadGenerationDashboard';
import LeadsListPage from './LeadsListPage';
import LeadDetailPage from './LeadDetailPage';
import SalesIntelligenceFeed from './SalesIntelligenceFeed';
import IntelligenceDetailView from './IntelligenceDetailView';
import CampaignsPage from './CampaignsPage';
import ProspectDiscovery from './ProspectDiscovery';
import ProspectsDiscovery from './ProspectsDiscovery';
import ProspectsPage from './ProspectsPage';
import CompaniesPage from './CompaniesPage';
import DealsPage from '../CRM/DealsPage';
import ListsPage from './ListsPage';
import DataEnrichmentPage from './DataEnrichmentPage';
import SequencesPage from './SequencesPage';
import EmailsPage from './EmailsPage';
import MeetingsPage from './MeetingsPage';
import TasksPage from './TasksPage';
import AnalyticsPage from './AnalyticsPage';
import SettingsPage from './SettingsPage';
import ProspectDetailPage from './ProspectDetailPage';
import CompanyDetailPage from './CompanyDetailPage';
import DealDetailPage from './DealDetailPage';
import SavedSearchesPage from '../Discovery/SavedSearchesPage';
import AddImportLeadsPage from './AddImportLeadsPage';
import LeadEnrichmentPage from './LeadEnrichmentPage';
import JohnSmithEnrichmentPage from './JohnSmithEnrichmentPage';
import MichaelTorresEnrichmentPage from './MichaelTorresEnrichmentPage';
import EmilyChenEnrichmentPage from './EmilyChenEnrichmentPage';
import RobertChangEnrichmentPage from './RobertChangEnrichmentPage';
import LeadQualificationPage from './LeadQualificationPage';
import LeadQualificationSuccessPage from './LeadQualificationSuccessPage';

const LeadGenerationModule: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <LeadGenNavigation />
      <Routes>
        <Route path="/" element={<Navigate to="/lead-generation/dashboard" replace />} />
        <Route path="/dashboard" element={<LeadGenerationDashboard />} />
        <Route path="/leads" element={<LeadsListPage />} />
        <Route path="/leads/add-import" element={<AddImportLeadsPage />} />
        <Route path="/leads/:id" element={<LeadDetailPage />} />
        <Route path="/qualify/:id" element={<LeadQualificationPage />} />
        <Route path="/leads/:id/qualification-success" element={<LeadQualificationSuccessPage />} />
        <Route path="/leads/lead_002/enrichment" element={<JohnSmithEnrichmentPage />} />
        <Route path="/leads/lead_003/enrichment" element={<MichaelTorresEnrichmentPage />} />
        <Route path="/leads/lead_004/enrichment" element={<EmilyChenEnrichmentPage />} />
        <Route path="/leads/lead_005/enrichment" element={<RobertChangEnrichmentPage />} />
        <Route path="/leads/:id/enrichment" element={<LeadEnrichmentPage />} />
        <Route path="/intelligence" element={<SalesIntelligenceFeed />} />
        <Route path="/intelligence/:id" element={<IntelligenceDetailView />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/campaigns/:id" element={<SequencesPage />} />
        <Route path="/discovery" element={<ProspectDiscovery />} />
        <Route path="/discovery/saved-searches" element={<SavedSearchesPage />} />
        <Route path="/ai-discovery" element={<ProspectsDiscovery />} />
        <Route path="/prospects" element={<ProspectsPage />} />
        <Route path="/prospects/:id" element={<ProspectDetailPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/companies/:id" element={<CompanyDetailPage />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/deals/:id" element={<DealDetailPage />} />
        <Route path="/lists" element={<ListsPage />} />
        <Route path="/enrichment" element={<DataEnrichmentPage />} />
        <Route path="/sequences" element={<SequencesPage />} />
        <Route path="/emails" element={<EmailsPage />} />
        <Route path="/meetings" element={<MeetingsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
};

export default LeadGenerationModule;