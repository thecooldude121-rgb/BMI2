import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar, { navGroups } from './Sidebar';
import TopBar, { initialsOf } from './TopBar';
import PageHeader from './PageHeader';

/**
 * The Figma app shell (phase 1, decided 2026-10-05). These pin the DECISIONS,
 * not the pixels: which destinations the nav offers, and that the controls the
 * frames draw for unbuilt features say so instead of pretending to work.
 */

let mockUser: Record<string, unknown> | null = { id: 5, name: 'David Kumar', role: 'Admin', email: 'd@example.test' };
const ws = vi.hoisted(() => ({
  fetchWorkspace: vi.fn(async () => ({ name: 'Test Workspace' })),
  fetchDataHealth: vi.fn(async () => ({ deals: 0, deals_seed: 0, deals_without_account: 0, deals_test_hidden: 0, accounts: 0, accounts_seed: 0, leads: 0, leads_seed: 0, leads_unassigned: 0, contacts: 0, contacts_seed: 0 })),
}));
vi.mock('../../utils/workspaceApi', () => ws);
// The connection line is covered by ConnectionStatus.test; here the health
// check never answers, so the shell must show NO connection claim at all.
vi.mock('../../utils/healthApi', () => ({ checkConnection: () => new Promise(() => {}) }));
// The bell's feed is covered by Notifications.test; here it never answers.
vi.mock('../../utils/notificationsApi', async () => ({
  ...(await vi.importActual<object>('../../utils/notificationsApi')),
  fetchNotifications: () => new Promise(() => {}), fetchDueFollowUps: () => new Promise(() => {}),
}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: vi.fn() }),
}));

const renderAt = (ui: React.ReactElement, path = '/crm/leads') =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

describe('Sidebar — the Figma Settings-frame list plus "More"', () => {
  it('offers exactly the Settings frame list, in order, then Forecast / Tasks / Calendar / Documents', () => {
    renderAt(<Sidebar />);
    const names = screen.getAllByRole('link').map(a => a.textContent?.replace('Preview', '').trim());
    expect(names).toEqual([
      'Dashboard', 'Leads', 'Deals', 'Accounts', 'Contacts', 'Activities', 'Meetings',
      'AI Copilot', 'Team', 'Integrations', 'Reports', 'Settings',
      'Forecast', 'Tasks', 'Calendar', 'Documents',
    ]);
    // AA: Figma's muted grey is 4.17:1 on the sidebar; ink-secondary passes.
    expect(screen.getByText('More')).toHaveClass('text-ink-secondary');
  });

  it('marks AI Copilot "Preview" — it is not built, and says so before the click', () => {
    renderAt(<Sidebar />);
    const copilot = screen.getByRole('link', { name: /ai copilot/i });
    expect(within(copilot).getByText('Preview')).toBeInTheDocument();
    // No other destination carries a badge.
    expect(screen.getAllByText('Preview')).toHaveLength(1);
  });

  it('no longer offers the "Pinned Views" links, whose filter parameters nothing read', () => {
    renderAt(<Sidebar />);
    for (const a of screen.getAllByRole('link')) {
      expect(a.getAttribute('href')).not.toMatch(/\?(owner|closeDate|stalled)=/);
    }
    expect(screen.queryByText(/pinned views/i)).toBeNull();
  });

  it('highlights the current page', () => {
    renderAt(<Sidebar />, '/crm/deals');
    expect(screen.getByRole('link', { name: 'Deals' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Leads' })).not.toHaveAttribute('aria-current');
  });

  it('the caption is the REAL workspace name and the integrity card shows REAL counts (Group B item 13)', async () => {
    ws.fetchWorkspace.mockResolvedValue({ name: 'Default Organization' });
    ws.fetchDataHealth.mockResolvedValue({
      deals: 21, deals_seed: 15, deals_without_account: 3, deals_test_hidden: 3,
      accounts: 15, accounts_seed: 15, leads: 38, leads_seed: 38, leads_unassigned: 38, contacts: 21, contacts_seed: 20,
    });
    renderAt(<Sidebar />);
    expect(await screen.findByTestId('workspace-caption')).toHaveTextContent('Default Organization');
    const card = await screen.findByTestId('data-integrity');
    expect(await within(card).findByText('Demo data: 15 of 21 deals, 15 of 15 accounts, 38 of 38 leads, 20 of 21 contacts.')).toBeInTheDocument();
    expect(within(card).getByText('3 of 21 deals have no account.')).toBeInTheDocument();
    expect(within(card).getByText('38 of 38 leads have no owner.')).toBeInTheDocument();
    expect(within(card).getByText('3 test deals hidden from views.')).toBeInTheDocument();
    // Never the mockup's text, and no "connected" claim before /health has answered.
    expect(screen.queryByText(/northstar|labelled at source/i)).toBeNull();
    expect(screen.queryByText(/workspace connected/i)).toBeNull();
  });

  it('a failed data check says so; a failed name lookup shows no caption rather than a guess', async () => {
    ws.fetchWorkspace.mockRejectedValue(new Error('500'));
    ws.fetchDataHealth.mockRejectedValue(new Error('500'));
    renderAt(<Sidebar />);
    expect(await screen.findByText('The data checks could not load.')).toBeInTheDocument();
    expect(screen.queryByTestId('workspace-caption')).toBeNull();
  });

  it('every destination is a real path (no blanks, no duplicates)', () => {
    const hrefs = navGroups.flatMap(g => g.items.map(i => i.href));
    expect(hrefs.every(h => h.startsWith('/'))).toBe(true);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe('TopBar — unbuilt controls are labelled, not live', () => {
  it('global search is a real search box now (Group B item 10), not a disabled one', () => {
    renderAt(<TopBar />);
    const search = screen.getByRole('combobox', { name: /search leads, contacts, accounts and deals/i });
    expect(search).toBeEnabled();
    expect(screen.getByText('Ctrl K')).toHaveAttribute('data-tone', 'neutral');
  });

  it('the inbox is a real button now (Group A item 5) and carries no invented "unread" dot', () => {
    renderAt(<TopBar />);
    const inbox = screen.getByRole('button', { name: /^inbox$/i });
    expect(inbox).toBeEnabled();
    expect(inbox.querySelector('span')).toBeNull();
    // No badge on the bell before the server has answered.
    expect(screen.queryByTestId('unread-badge')).toBeNull();
  });

  it('a user with no avatar gets their initials — never a stock photo of somebody else', () => {
    mockUser = { id: 5, name: 'David Kumar', role: 'Admin' };
    const { container } = renderAt(<TopBar />);
    expect(screen.getByTestId('topbar-initials')).toHaveTextContent('DK');
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows the current section beside the brand', () => {
    renderAt(<TopBar />, '/crm/meetings/MTG001');
    expect(screen.getByTestId('topbar-section')).toHaveTextContent('Meetings');
  });

  it('initialsOf handles one name, many names and none', () => {
    expect(initialsOf('Madonna')).toBe('M');
    expect(initialsOf('  ana  de la cruz ')).toBe('AC');
    expect(initialsOf('')).toBe('?');
    expect(initialsOf(undefined)).toBe('?');
  });
});

describe('PageHeader', () => {
  it('renders the title as the page heading, and no eyebrow unless one is given', () => {
    const { rerender } = render(<PageHeader title="Leads" description="Manage and qualify incoming leads." />);
    expect(screen.getByRole('heading', { level: 1, name: 'Leads' })).toBeInTheDocument();
    expect(screen.getByText('Manage and qualify incoming leads.')).toBeInTheDocument();
    expect(screen.queryByText(/india & mea/i)).toBeNull();
    rerender(<PageHeader title="Leads" eyebrow="Pipeline intake" actions={<button>Import</button>} />);
    expect(screen.getByText('Pipeline intake')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import' })).toBeInTheDocument();
  });
});
