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
import Register from './pages/Auth/Register';


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
// NO SettingsPage IMPORT. /settings redirects to /crm/settings (see the route
// below), so the dead tree's hub is no longer routed. The file still exists as
// UI reference and still compiles — `pages/Settings/rolesPagesLabelling.test.tsx`
// imports it, which is deliberate: it keeps the kept-for-reference pages from
// rotting into something that no longer builds while they wait for a decision.
const SequencesAutomationPage = lazy(() => import('./pages/Sequences'));
const IntegrationsPage = lazy(() => import('./pages/Settings/IntegrationsPage'));
const WorkflowAutomationPage = lazy(() => import('./pages/Settings/WorkflowAutomationPage'));
const NotificationsManagementPage = lazy(() => import('./pages/Settings/NotificationsManagementPage'));

// These modules export their page as a NAMED export, so it has to be remapped
// to `default` — React.lazy only accepts a module whose default is a component.
const IntegrationsHub = lazy(() => import('./pages/Integrations').then(m => ({ default: m.IntegrationsHub })));
const TeamPerformancePage = lazy(() => import('./pages/Team').then(m => ({ default: m.TeamPerformancePage })));
const TeamMemberDetailPage = lazy(() => import('./pages/Team').then(m => ({ default: m.TeamMemberDetailPage })));


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
    <ToastProvider>
      <AuthProvider>
        {/* Inside AuthProvider: CurrentUserContext derives the signed-in user
            from it, so it cannot be mounted above the provider it reads. */}
        <CurrentUserProvider>
          <DataProvider>
            <LeadProvider>
              <SettingsProvider>
                <IntegrationsProvider>
                  <Routes>
                  <Route path="/login" element={<RouteShell><Login /></RouteShell>} />
                  {/* Open, like /login: you cannot be signed in to create an account. */}
                  <Route path="/register" element={<RouteShell><Register /></RouteShell>} />
                  <Route path="/" element={<RequireAuth><Layout><Navigate to="/dashboard" replace /></Layout></RequireAuth>} />
                  <Route path="/dashboard" element={<RequireAuth><Layout><Dashboard /></Layout></RequireAuth>} />
                  <Route path="/crm/*" element={<RequireAuth><Layout><CRMModule /></Layout></RequireAuth>} />
                  <Route path="/accounts/*" element={<RequireAuth><Layout><AccountsModule /></Layout></RequireAuth>} />
                  <Route path="/hrms/*" element={<RequireAuth><Layout><HRMSModule /></Layout></RequireAuth>} />
                  <Route path="/analytics" element={<RequireAuth><Layout><Analytics /></Layout></RequireAuth>} />
                  <Route path="/calendar" element={<RequireAuth><Layout><Calendar /></Layout></RequireAuth>} />
                  <Route path="/sequences" element={<RequireAuth><Layout><SequencesAutomationPage /></Layout></RequireAuth>} />
                  <Route path="/integrations" element={<RequireAuth><Layout><IntegrationsHub /></Layout></RequireAuth>} />
                  <Route path="/team" element={<RequireAuth><Layout><TeamPerformancePage /></Layout></RequireAuth>} />
                  <Route path="/team/:id" element={<RequireAuth><Layout><TeamMemberDetailPage /></Layout></RequireAuth>} />
                  {/*
                    * /settings REDIRECTS to the real Settings module.
                    *
                    * It used to render SettingsPage — the hub of the dead Supabase
                    * tree. Nothing on it works: SettingsContext's reads go to a
                    * service this product does not use, so `roles` is permanently
                    * empty, and the roles / permission-matrix / permission-sets /
                    * SSO / API-token features it models have no tables in this
                    * product's Postgres to build against. Its four headline
                    * security figures were hardcoded literals and were deleted in
                    * ef74b34.
                    *
                    * Leaving it reachable by direct URL or an old bookmark would
                    * leave a second, mostly-inert Settings page that looks like the
                    * real one — so the route resolves to the real one instead.
                    * `replace` keeps it out of history, so Back does not bounce the
                    * user through the redirect again.
                    *
                    * THE PAGE FILES ARE DELIBERATELY NOT DELETED. SettingsPage,
                    * RolesManagement and PermissionMatrix stay as UI reference for
                    * whenever a real roles backend is designed, consistent with
                    * keeping the Settings scaffolding rather than deleting it. They
                    * are simply no longer routed. Their deletion is tracked in
                    * CLAUDE.md's Supabase-removal checklist alongside
                    * SettingsContext, which is what still imports them.
                    */}
                  <Route path="/settings" element={<Navigate to="/crm/settings" replace />} />
                  {/*
                    * These three are NOT redirected, deliberately. They are not part
                    * of the roles hub above and nothing links to them — grep finds
                    * no <Link>, <NavLink> or navigate() for any of the three, so they
                    * are direct-URL-only today. Left alone rather than swept up in a
                    * change that was scoped to the bare /settings route; they need
                    * their own decision about whether they belong under /crm.
                    */}
                  <Route path="/settings/integrations" element={<RequireAuth><Layout><IntegrationsPage /></Layout></RequireAuth>} />
                  <Route path="/settings/workflows" element={<RequireAuth><Layout><WorkflowAutomationPage /></Layout></RequireAuth>} />
                  <Route path="/settings/notifications" element={<RequireAuth><Layout><NotificationsManagementPage /></Layout></RequireAuth>} />
                </Routes>
                </IntegrationsProvider>
              </SettingsProvider>
            </LeadProvider>
          </DataProvider>
          {/* Dev-only role switcher. Inside CurrentUserProvider because it
              drives that context, and behind import.meta.env.DEV so the
              bundler drops it from a production build entirely. */}
          {import.meta.env.DEV && <RoleSwitcher />}
        </CurrentUserProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;