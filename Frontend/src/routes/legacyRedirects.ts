/**
 * Routes that REDIRECT to their real equivalents (slice 5d, decided by Venkat
 * 2026-10-13). /dashboard and /analytics were duplicates of /crm/dashboard and
 * /crm/reports that computed their figures in the browser from capped lists;
 * they are redirected, not rebuilt. "/" used to send every sign-in to the
 * unlinked /dashboard. App.tsx renders exactly this list, so the test of this
 * list is a test of the app's routes.
 */
export const LEGACY_REDIRECTS: ReadonlyArray<{ from: string; to: string }> = [
  { from: '/', to: '/crm/dashboard' },
  { from: '/dashboard', to: '/crm/dashboard' },
  { from: '/analytics', to: '/crm/reports' },
];
