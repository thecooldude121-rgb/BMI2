import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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



/**
 * Gate every authenticated route behind a real session.
 *
 * There was no guard at all before, because AuthProvider initialised `user` to a
 * hardcoded object — the app was always "signed in" and /login was unreachable
 * in normal use. With `user` correctly starting null, a guard is mandatory
 * rather than nice to have: 27 call sites read `user.id` without optional
 * chaining and would throw on a signed-out render.
 *
 * `loading` is respected so an existing token gets validated before we decide.
 * Without that, a refresh would bounce a signed-in user to /login for a frame.
 */
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Checking your session…</p>
      </div>
    );
  }
  // `state` carries the attempted URL so login can return the user to it.
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
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
                  <Route path="/" element={<RequireAuth><Layout><Navigate to="/dashboard" replace /></Layout></RequireAuth>} />
                  <Route path="/dashboard" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
                  <Route path="/crm/*" element={<RequireAuth><Layout><CRMModule /></Layout></RequireAuth>} />
                  <Route path="/accounts/*" element={<RequireAuth><Layout><AccountsModule /></Layout></RequireAuth>} />
                  <Route path="/hrms/*" element={<RequireAuth><Layout><HRMSModule /></Layout></RequireAuth>} />
                  <Route path="/analytics" element={<RequireAuth><Layout><Analytics /></Layout></RequireAuth>} />
                  <Route path="/calendar" element={<RequireAuth><Layout><Calendar /></Layout></RequireAuth>} />
                  <Route path="/lead-generation/*" element={<RequireAuth><Layout><LeadGenerationModule /></Layout></RequireAuth>} />
                  <Route path="/demo/disqualification" element={<RequireAuth><Layout><DisqualificationDemo /></Layout></RequireAuth>} />
                  <Route path="/demo/rate-limit" element={<RequireAuth><Layout><RateLimitDemo /></Layout></RequireAuth>} />
                  <Route path="/demo/invalid-api-key" element={<RequireAuth><Layout><InvalidAPIKeyDemo /></Layout></RequireAuth>} />
                  <Route path="/demo/network-error" element={<RequireAuth><Layout><NetworkConnectionErrorDemo /></Layout></RequireAuth>} />
                  <Route path="/demo/partial-enrichment" element={<RequireAuth><Layout><PartialEnrichmentDemo /></Layout></RequireAuth>} />
                  <Route path="/demo/data-conflict" element={<RequireAuth><Layout><DataConflictDemo /></Layout></RequireAuth>} />
                  <Route path="/demo/real-time-progress" element={<RequireAuth><Layout><RealTimeProgressDemo /></Layout></RequireAuth>} />
                  <Route path="/demo/field-level-actions" element={<RequireAuth><Layout><FieldLevelActionsDemo /></Layout></RequireAuth>} />
                  <Route path="/demo/campaign-wizard-step1" element={<RequireAuth><Layout><CampaignWizardStep1Demo /></Layout></RequireAuth>} />
                  <Route path="/demo/campaign-wizard-step2" element={<RequireAuth><Layout><CampaignWizardStep2Demo /></Layout></RequireAuth>} />
                  <Route path="/demo/campaign-wizard-step3" element={<RequireAuth><Layout><CampaignWizardStep3Demo /></Layout></RequireAuth>} />
                  <Route path="/sequences" element={<RequireAuth><Layout><SequencesAutomationPage /></Layout></RequireAuth>} />
                  <Route path="/integrations" element={<RequireAuth><Layout><IntegrationsHub /></Layout></RequireAuth>} />
                  <Route path="/team" element={<RequireAuth><Layout><TeamPerformancePage /></Layout></RequireAuth>} />
                  <Route path="/team/:id" element={<RequireAuth><Layout><TeamMemberDetailPage /></Layout></RequireAuth>} />
                  <Route path="/settings" element={<RequireAuth><Layout><SettingsPage /></Layout></RequireAuth>} />
                  <Route path="/settings/integrations" element={<RequireAuth><Layout><IntegrationsPage /></Layout></RequireAuth>} />
                  <Route path="/settings/workflows" element={<RequireAuth><Layout><WorkflowAutomationPage /></Layout></RequireAuth>} />
                  <Route path="/settings/notifications" element={<RequireAuth><Layout><NotificationsManagementPage /></Layout></RequireAuth>} />
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