import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { LeadProvider } from './contexts/LeadContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { IntegrationsProvider } from './contexts/IntegrationsContext';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Dashboard from './pages/Dashboard';
import CRMModule from './pages/CRM/CRMModule';
import AccountsModule from './pages/Accounts';
import HRMSModule from './pages/HRMS/HRMSModule';
import Analytics from './pages/Analytics/Analytics';
import Calendar from './pages/Calendar/Calendar';
import LeadGenerationModule from './pages/LeadGeneration/LeadGenerationModule';
import DisqualificationDemo from './pages/LeadGeneration/DisqualificationDemo';
import RateLimitDemo from './pages/LeadGeneration/RateLimitDemo';
import InvalidAPIKeyDemo from './pages/LeadGeneration/InvalidAPIKeyDemo';
import NetworkConnectionErrorDemo from './pages/LeadGeneration/NetworkConnectionErrorDemo';
import PartialEnrichmentDemo from './pages/LeadGeneration/PartialEnrichmentDemo';
import DataConflictDemo from './pages/LeadGeneration/DataConflictDemo';
import { RealTimeProgressDemo } from './pages/LeadGeneration/RealTimeProgressDemo';
import FieldLevelActionsDemo from './pages/LeadGeneration/FieldLevelActionsDemo';
import SettingsPage from './pages/Settings/SettingsPage';
import Login from './pages/Auth/Login';
import LoginWireframe from './pages/Auth/LoginWireframe';
import SequencesAutomationPage from './pages/Sequences';
import IntegrationsPage from './pages/Settings/IntegrationsPage';
import WorkflowAutomationPage from './pages/Settings/WorkflowAutomationPage';
import NotificationsManagementPage from './pages/Settings/NotificationsManagementPage';
import { IntegrationsHub } from './pages/Integrations';
import { TeamPerformancePage, TeamMemberDetailPage } from './pages/Team';
import { CampaignWizardStep1Demo } from './pages/LeadGeneration/CampaignWizardStep1Demo';
import CampaignWizardStep2Demo from './pages/LeadGeneration/CampaignWizardStep2Demo';
import CampaignWizardStep3Demo from './pages/LeadGeneration/CampaignWizardStep3Demo';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};


const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <LeadProvider>
            <SettingsProvider>
              <IntegrationsProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/login/wireframe" element={<LoginWireframe />} />
                  <Route path="/" element={<Layout><Navigate to="/dashboard" replace /></Layout>} />
                  <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                  <Route path="/crm/*" element={<Layout><CRMModule /></Layout>} />
                  <Route path="/accounts/*" element={<Layout><AccountsModule /></Layout>} />
                  <Route path="/hrms/*" element={<Layout><HRMSModule /></Layout>} />
                  <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
                  <Route path="/calendar" element={<Layout><Calendar /></Layout>} />
                  <Route path="/lead-generation/*" element={<Layout><LeadGenerationModule /></Layout>} />
                  <Route path="/demo/disqualification" element={<Layout><DisqualificationDemo /></Layout>} />
                  <Route path="/demo/rate-limit" element={<Layout><RateLimitDemo /></Layout>} />
                  <Route path="/demo/invalid-api-key" element={<Layout><InvalidAPIKeyDemo /></Layout>} />
                  <Route path="/demo/network-error" element={<Layout><NetworkConnectionErrorDemo /></Layout>} />
                  <Route path="/demo/partial-enrichment" element={<Layout><PartialEnrichmentDemo /></Layout>} />
                  <Route path="/demo/data-conflict" element={<Layout><DataConflictDemo /></Layout>} />
                  <Route path="/demo/real-time-progress" element={<Layout><RealTimeProgressDemo /></Layout>} />
                  <Route path="/demo/field-level-actions" element={<Layout><FieldLevelActionsDemo /></Layout>} />
                  <Route path="/demo/campaign-wizard-step1" element={<Layout><CampaignWizardStep1Demo /></Layout>} />
                  <Route path="/demo/campaign-wizard-step2" element={<Layout><CampaignWizardStep2Demo /></Layout>} />
                  <Route path="/demo/campaign-wizard-step3" element={<Layout><CampaignWizardStep3Demo /></Layout>} />
                  <Route path="/sequences" element={<Layout><SequencesAutomationPage /></Layout>} />
                  <Route path="/integrations" element={<Layout><IntegrationsHub /></Layout>} />
                  <Route path="/team" element={<Layout><TeamPerformancePage /></Layout>} />
                  <Route path="/team/:id" element={<Layout><TeamMemberDetailPage /></Layout>} />
                  <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
                  <Route path="/settings/integrations" element={<Layout><IntegrationsPage /></Layout>} />
                  <Route path="/settings/workflows" element={<Layout><WorkflowAutomationPage /></Layout>} />
                  <Route path="/settings/notifications" element={<Layout><NotificationsManagementPage /></Layout>} />
                </Routes>
              </IntegrationsProvider>
            </SettingsProvider>
          </LeadProvider>
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;