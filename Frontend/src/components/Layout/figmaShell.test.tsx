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
    expect(screen.getByText('More')).toBeInTheDocument();
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

  it('renders none of the mockup chrome nothing backs (workspace caption, integrity card, connection status)', () => {
    renderAt(<Sidebar />);
    expect(screen.queryByText(/northstar/i)).toBeNull();
    expect(screen.queryByText(/data integrity/i)).toBeNull();
    expect(screen.queryByText(/workspace connected/i)).toBeNull();
  });

  it('every destination is a real path (no blanks, no duplicates)', () => {
    const hrefs = navGroups.flatMap(g => g.items.map(i => i.href));
    expect(hrefs.every(h => h.startsWith('/'))).toBe(true);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});

describe('TopBar — unbuilt controls are labelled, not live', () => {
  it('global search is disabled and says it is coming soon (it searched nothing)', () => {
    renderAt(<TopBar />);
    const search = screen.getByRole('textbox', { name: /global search \(coming soon\)/i });
    expect(search).toBeDisabled();
    expect(screen.queryByText(/ctrl k/i)).toBeNull();
  });

  it('the inbox is disabled and carries no "unread" dot (it had no handler)', () => {
    renderAt(<TopBar />);
    const inbox = screen.getByRole('button', { name: /inbox \(coming soon\)/i });
    expect(inbox).toBeDisabled();
    expect(inbox.querySelector('span')).toBeNull();
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
