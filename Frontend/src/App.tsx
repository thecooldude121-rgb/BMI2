import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { CurrentUserProvider } from './contexts/CurrentUserContext';
import RoleSwitcher from './components/Dev/RoleSwitcher';
import { DataProvider } from './contexts/DataContext';
import { LeadProvider } from './contexts/LeadContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { IntegrationsProvider } from './contexts/IntegrationsContext';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Login from './pages/Auth/Login';


/**
 * Route components are code-split.
 *
 * The build was one 5.6 MB JavaScript chunk (1.13 MB gzipped) — every route,
 * every module, all ~213k lines of component code, downloaded and parsed before
 * the first screen could paint. Vite warns about it on every build.
 *
 * Providers, the layout chrome and Login stay EAGER on purpose: they are needed
 * for the first paint either way, and a spinner in front of the login form is
 * worse than shipping it in the initial chunk.
 */
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CRMModule = lazy(() => import('./pages/CRM/CRMModule'));
const AccountsModule = lazy(() => import('./pages/Accounts'));
const HRMSModule = lazy(() => import('./pages/HRMS/HRMSModule'));
const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const Calendar = lazy(() => import('./pages/Calendar/Calendar'));
const LeadGenerationModule = lazy(() => import('./pages/LeadGeneration/LeadGenerationModule'));
const DisqualificationDemo = lazy(() => import('./pages/LeadGeneration/DisqualificationDemo'));
const RateLimitDemo = lazy(() => import('./pages/LeadGeneration/RateLimitDemo'));
const InvalidAPIKeyDemo = lazy(() => import('./pages/LeadGeneration/InvalidAPIKeyDemo'));
const NetworkConnectionErrorDemo = lazy(() => import('./pages/LeadGeneration/NetworkConnectionErrorDemo'));
const PartialEnrichmentDemo = lazy(() => import('./pages/LeadGeneration/PartialEnrichmentDemo'));
const DataConflictDemo = lazy(() => import('./pages/LeadGeneration/DataConflictDemo'));
const FieldLevelActionsDemo = lazy(() => import('./pages/LeadGeneration/FieldLevelActionsDemo'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));
const LoginWireframe = lazy(() => import('./pages/Auth/LoginWireframe'));
const SequencesAutomationPage = lazy(() => import('./pages/Sequences'));
const IntegrationsPage = lazy(() => import('./pages/Settings/IntegrationsPage'));
const WorkflowAutomationPage = lazy(() => import('./pages/Settings/WorkflowAutomationPage'));
const NotificationsManagementPage = lazy(() => import('./pages/Settings/NotificationsManagementPage'));
const CampaignWizardStep2Demo = lazy(() => import('./pages/LeadGeneration/CampaignWizardStep2Demo'));
const CampaignWizardStep3Demo = lazy(() => import('./pages/LeadGeneration/CampaignWizardStep3Demo'));

// These modules export their page as a NAMED export, so it has to be remapped
// to `default` — React.lazy only accepts a module whose default is a component.
const RealTimeProgressDemo = lazy(() => import('./pages/LeadGeneration/RealTimeProgressDemo').then(m => ({ default: m.RealTimeProgressDemo })));
const IntegrationsHub = lazy(() => import('./pages/Integrations').then(m => ({ default: m.IntegrationsHub })));
const TeamPerformancePage = lazy(() => import('./pages/Team').then(m => ({ default: m.TeamPerformancePage })));
const TeamMemberDetailPage = lazy(() => import('./pages/Team').then(m => ({ default: m.TeamMemberDetailPage })));
const CampaignWizardStep1Demo = lazy(() => import('./pages/LeadGeneration/CampaignWizardStep1Demo').then(m => ({ default: m.CampaignWizardStep1Demo })));


/** Shown while a route's chunk downloads. Deliberately quiet — a full-page
 *  spinner on every navigation reads as slower than it is. */
const RouteFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="flex items-center gap-3 text-sm text-gray-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      Loading…
    </div>
  </div>
);

/**
 * Wraps every route: the boundary contains a render error to the page that threw
 * instead of blanking the app, and Suspense covers the chunk download. Keyed on
 * pathname so navigating away clears a previous failure.
 */
const RouteShell = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname} label={pathname}>
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 pb-4 lg:px-6 lg:pb-6">
          {/* Inside Layout on purpose: a page-level error must not take the
              sidebar and top bar down with it — the user needs to navigate away. */}
          <RouteShell>{children}</RouteShell>
        </main>
      </div>
    </div>
  );
};


const App = () => {
  return (
    <CurrentUserProvider>
      <ToastProvider>
        <AuthProvider>
          <DataProvider>
            <LeadProvider>
              <SettingsProvider>
                <IntegrationsProvider>
                  <Routes>
                  <Route path="/login" element={<RouteShell><Login /></RouteShell>} />
                  <Route path="/login/wireframe" element={<RouteShell><LoginWireframe /></RouteShell>} />
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
      {import.meta.env.DEV && <RoleSwitcher />}
    </CurrentUserProvider>
  );
};

export default App;