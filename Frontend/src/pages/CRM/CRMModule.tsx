import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AccountsProvider } from '../../contexts/AccountsContext';
import CRMDashboard from './CRMDashboard';
import LeadsPage from './LeadsPage';
import ContactsPage from './ContactsPage';
import ContactDetailView from './ContactDetailView';
import AddEditContactPage from './AddEditContactPage';
import CompaniesPage from './CompaniesPage';
import DealsKanbanPage from './DealsKanbanPage';
import ForecastPage from './ForecastPage';
import ActivitiesPage from './ActivitiesPage';
import TasksPage from './TasksPage';
import AddLeadPage from './AddLeadPage';
import LeadDetailPage from './LeadDetailPage';
import GamificationPage from './GamificationPage';
import GamificationLeaderboard from './GamificationLeaderboard';
import DealDetailPage from '../../components/Deal/DealDetailPage';
import ComprehensiveDealDetailPage from '../Deal/ComprehensiveDealDetailPage';
import ComprehensiveDealFormPage from '../Deal/ComprehensiveDealFormPage';
import { ComprehensiveActivityFeed } from '../Activity';
import ImportLeadsPage from './ImportLeadsPage';
import IntegrationsPage from './IntegrationsPage';
import { IntegrationsHub } from '../Integrations/IntegrationsHub';
import AccountsPage from './AccountsPage';
import EnhancedAccountDetailView from '../Accounts/EnhancedAccountDetailView';
import AccountImportExport from '../Accounts/AccountImportExport';
import AccountFormPage from '../Accounts/AccountFormPage';
import AccountMergePage from '../Accounts/AccountMergePage';
import ActivityDetailPage from './ActivityDetailPage';
import ReportsPage from './ReportsPage';
import ReportDetailView from './ReportDetailView';
import CustomReportBuilder from './CustomReportBuilder';
import DocumentsLibrary from './DocumentsLibrary';
import DocumentsContextDemo from './DocumentsContextDemo';
import DocumentDetailPage from './DocumentDetailPage';
import CRMSettings from './CRMSettings';
import AICopilotPage from './AICopilotPage';
import AIResponseDetailView from './AIResponseDetailView';
import MeetingsPage from './MeetingsPage';
import MeetingDetailPage from './MeetingDetailPage';
import MeetingTranscriptViewer from './MeetingTranscriptViewer';
import { TeamPerformancePage } from '../Team';

const CRMModule = () => {
  return (
    <AccountsProvider>
      <div className="min-h-full bg-gray-50">
        <Routes>
          <Route path="/" element={<CRMDashboard />} />
          <Route path="/dashboard" element={<CRMDashboard />} />
          <Route path="/gamification" element={<GamificationPage />} />
          <Route path="/gamification/leaderboard" element={<GamificationLeaderboard />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/new" element={<AddLeadPage />} />
          <Route path="/leads/import" element={<ImportLeadsPage />} />
          <Route path="/leads/integrations" element={<IntegrationsPage />} />
          <Route path="/integrations" element={<IntegrationsHub />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/new" element={<AddEditContactPage />} />
          <Route path="/contacts/:id/edit" element={<AddEditContactPage />} />
          <Route path="/contacts/:id" element={<ContactDetailView />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/accounts/add" element={<AccountFormPage />} />
          <Route path="/accounts/:accountId" element={<EnhancedAccountDetailView />} />
          <Route path="/accounts/:accountId/edit" element={<AccountFormPage />} />
          <Route path="/accounts/:accountId/merge" element={<AccountMergePage />} />
          <Route path="/accounts/import-export" element={<AccountImportExport />} />
          <Route path="/deals" element={<DealsKanbanPage />} />
          <Route path="/deals/add" element={<ComprehensiveDealFormPage />} />
          <Route path="/deals/create" element={<ComprehensiveDealFormPage />} />
          <Route path="/deals/:id/edit" element={<ComprehensiveDealFormPage />} />
          <Route path="/deals/:id" element={<ComprehensiveDealDetailPage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/pipeline" element={<Navigate to="/crm/forecast" replace />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/activities/all" element={<ComprehensiveActivityFeed />} />
          <Route path="/activities/:id" element={<ActivityDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/custom-report-builder" element={<CustomReportBuilder />} />
          <Route path="/reports/:reportSlug" element={<ReportDetailView />} />
          <Route path="/documents-demo" element={<DocumentsContextDemo />} />
          <Route path="/documents" element={<DocumentsLibrary />} />
          <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
          <Route path="/ai-copilot" element={<AICopilotPage />} />
          <Route path="/ai-copilot/response/:responseId" element={<AIResponseDetailView />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
          <Route path="/meetings/:meetingId/transcript" element={<MeetingTranscriptViewer />} />
          <Route path="/team" element={<TeamPerformancePage />} />
          <Route path="/team/:memberId" element={<TeamPerformancePage />} />
          <Route path="/settings" element={<CRMSettings />} />
        </Routes>
      </div>
    </AccountsProvider>
  );
};

export default CRMModule;