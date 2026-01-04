import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { LeadProvider } from './contexts/LeadContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { IntegrationsProvider } from './contexts/IntegrationsContext';
import Header from './components/Layout/Header';
import Dashboard from './pages/Dashboard';
import CRMModule from './pages/CRM/CRMModule';
import AccountsModule from './pages/Accounts';
import HRMSModule from './pages/HRMS/HRMSModule';
import Analytics from './pages/Analytics/Analytics';
import Calendar from './pages/Calendar/Calendar';
import LeadGenerationModule from './pages/LeadGeneration/LeadGenerationModule';
import SettingsPage from './pages/Settings/SettingsPage';
import Login from './pages/Auth/Login';
import LoginWireframe from './pages/Auth/LoginWireframe';
import SequencesAutomationPage from './pages/Sequences';
import IntegrationsPage from './pages/Settings/IntegrationsPage';
import WorkflowAutomationPage from './pages/Settings/WorkflowAutomationPage';
import NotificationsManagementPage from './pages/Settings/NotificationsManagementPage';
import { IntegrationsHub } from './pages/Integrations';
import { TeamPerformancePage, TeamMemberDetailPage } from './pages/Team';

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-2">
        {children}
      </main>
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
                <Route path="/*" element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/crm/*" element={<CRMModule />} />
                      <Route path="/accounts/*" element={<AccountsModule />} />
                      <Route path="/hrms/*" element={<HRMSModule />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/lead-generation/*" element={<LeadGenerationModule />} />
                      <Route path="/sequences" element={<SequencesAutomationPage />} />
                      <Route path="/integrations" element={<IntegrationsHub />} />
                      <Route path="/team" element={<TeamPerformancePage />} />
                      <Route path="/team/:id" element={<TeamMemberDetailPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/settings/integrations" element={<IntegrationsPage />} />
                      <Route path="/settings/workflows" element={<WorkflowAutomationPage />} />
                      <Route path="/settings/notifications" element={<NotificationsManagementPage />} />
                    </Routes>
                  </Layout>
                } />
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