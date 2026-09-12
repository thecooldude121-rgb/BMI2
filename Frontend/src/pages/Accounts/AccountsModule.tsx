import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AccountsProvider } from '../../contexts/AccountsContext';
import EnhancedAccountDetailView from './EnhancedAccountDetailView';

/**
 * `/accounts` redirects to the real list at `/crm/accounts`.
 *
 * It used to render a placeholder card reading "For the full CRM Accounts
 * experience, navigate to CRM → Accounts" — advice a user could not follow,
 * because there IS no "CRM → Accounts" entry in the sidebar. The sidebar's
 * "Accounts" link pointed HERE, at the placeholder, so the only nav path to
 * accounts led to a page telling the user to go somewhere that does not exist.
 * The sidebar now points at /crm/accounts directly; this redirect catches the
 * inbound links that still use the bare /accounts path
 * (RecentActivity.tsx, ContactDetailView.tsx, ReportDetailView.tsx).
 */
const AccountsListRedirect: React.FC = () => <Navigate to="/crm/accounts" replace />;

/*
 * AccountDetailRouter is gone, and so is what it routed to.
 *
 * It special-cased ONE hardcoded id — `accountId === 'ACC-2024-0089'` —
 * and rendered TechStartDetailView, a 1,102-line second account detail page
 * with ZERO data-fetching calls of any kind: no fetch(), no API client, no
 * context. A complete, finished-looking account page backed by nothing,
 * publicly routed, for an account id that does not exist in this database
 * (real ids are C001..C015). That is the third whole feature in this repo
 * backed entirely by literals, after the six-widget dashboard and the second
 * Deals implementation. Logged in FABRICATED_DATA_AUDIT.md and deleted.
 */

const AccountsModule: React.FC = () => {
  return (
    <AccountsProvider>
      <Routes>
        <Route path="/" element={<AccountsListRedirect />} />
        {/* Declared before the id route so the create form is reachable at the
            URL the "+ New" menu used to point at. The form itself lives under
            /crm, which is where every other create flow lives, so this is a
            redirect rather than a second mount of the same page. */}
        <Route path="/new" element={<Navigate to="/crm/accounts/new" replace />} />
        <Route path="/:accountId" element={<EnhancedAccountDetailView />} />
      </Routes>
    </AccountsProvider>
  );
};

export default AccountsModule;
