import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CRMSettings from './CRMSettings';

/**
 * THE SETTINGS NAV: every section must offer a way in.
 *
 * ─── THE BUG THIS EXISTS FOR ───────────────────────────────────────────────
 *
 * Connected Modules shipped with `subsections: []`. The nav renders a section's
 * header, then maps over its `subsections` — so an empty array produced a
 * header with NOTHING clickable beneath it, and the screen was unreachable from
 * the UI for every user, admin included. `renderContent` had
 * `case 'connected-modules'` the whole time; nothing ever called
 * `setActiveSection('connected-modules')`.
 *
 * It looked identical in the data to TEAM MANAGEMENT, which also has an empty
 * `subsections` array and works — because the renderer carries a hardcoded
 * `section.id === 'team'` fallback that synthesises a button. One section is
 * special-cased; every other section must list its own entries.
 *
 * So the test is written as the GENERAL property rather than a Connected
 * Modules assertion: whatever sections exist, each one offers at least one
 * clickable item. The next section added with an empty array fails here instead
 * of silently vanishing from the product — which is how this one survived a
 * whole session of being "built".
 *
 * The child screens are stubbed: this is a test about the NAV, and rendering
 * the real panels would pull a dozen fetches in for no benefit.
 */

vi.mock('./CRMSettings/ProfileSettings', () => ({ default: () => <div>Profile panel</div> }));
vi.mock('./CRMSettings/PasswordSettings', () => ({ default: () => <div>Password panel</div> }));
vi.mock('./CRMSettings/Preferences', () => ({ default: () => <div>Preferences panel</div> }));
vi.mock('./CRMSettings/GeneralPreferences', () => ({ default: () => <div>General panel</div> }));
vi.mock('./CRMSettings/DisplayPreferences', () => ({ default: () => <div>Display panel</div> }));
vi.mock('./CRMSettings/IntegrationsOverview', () => ({ default: () => <div>Integrations panel</div> }));
vi.mock('./CRMSettings/EmailAlerts', () => ({ default: () => <div>EmailAlerts panel</div> }));
vi.mock('./CRMSettings/InAppNotifications', () => ({ default: () => <div>InApp panel</div> }));
vi.mock('./CRMSettings/SlackNotifications', () => ({ default: () => <div>Slack panel</div> }));
vi.mock('./CRMSettings/TeamManagement', () => ({ default: () => <div>Team panel</div> }));
vi.mock('./CRMSettings/TargetsSettings', () => ({ default: () => <div>Targets panel</div> }));
vi.mock('./CRMSettings/ConnectedModules', () => ({ default: () => <div>ConnectedModules panel</div> }));
vi.mock('../../components/CRM/CRMNavigation', () => ({ default: () => <div>Nav panel</div> }));

const mockUser = { id: 5, role: 'Admin' as string, name: 'David Kumar' };
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

const renderSettings = () => render(<MemoryRouter><CRMSettings /></MemoryRouter>);

// Each vi.mock factory is written out in full rather than sharing a helper:
// vi.mock is hoisted to the top of the file, above any const it would use.

/** The section headers are <h3>; each one's clickable items follow it. */
const sectionHeadings = () => screen.getAllByRole('heading', { level: 3 });

beforeEach(() => { mockUser.role = 'Admin'; });
afterEach(() => { vi.restoreAllMocks(); });

describe('every Settings section offers a way in', () => {
  it('no section renders a header with nothing clickable under it', () => {
    renderSettings();

    const empty: string[] = [];
    for (const heading of sectionHeadings()) {
      // The header and its items share a wrapper <div>.
      const block = heading.closest('div')?.parentElement;
      if (!block) { empty.push(heading.textContent ?? '?'); continue; }
      if (within(block as HTMLElement).queryAllByRole('button').length === 0) {
        empty.push(heading.textContent ?? '?');
      }
    }

    expect(empty, `sections with no clickable item: ${empty.join(', ')}`).toEqual([]);
  });

  it('CONNECTED MODULES specifically has one, and it opens the screen', async () => {
    const user = userEvent.setup();
    renderSettings();

    const entry = screen.getByRole('button', { name: /Manage Connections/i });
    expect(entry).toBeInTheDocument();

    await user.click(entry);
    // Reaching the panel is the point — the nav entry existed but led nowhere.
    expect(screen.getByText('ConnectedModules panel')).toBeInTheDocument();
  });

  it('TEAM MANAGEMENT still works — its hardcoded fallback is untouched', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: /Team Overview/i }));
    expect(screen.getByText('Team panel')).toBeInTheDocument();
  });
});

describe('the administrativeOnly gate', () => {
  it('shows Connected Modules to an Admin', () => {
    mockUser.role = 'Admin';
    renderSettings();
    expect(screen.getByRole('button', { name: /Manage Connections/i })).toBeInTheDocument();
  });

  it('shows it to a Manager too — the API gates on admin AND manager', () => {
    // DESTRUCTIVE_ACTION_ROLES is ('admin','manager'), so the nav deliberately
    // matches the server rather than being stricter and hiding a screen the
    // manager can actually use.
    mockUser.role = 'Manager';
    renderSettings();
    expect(screen.getByRole('button', { name: /Manage Connections/i })).toBeInTheDocument();
  });

  it('hides it from a Sales user', () => {
    mockUser.role = 'Sales';
    renderSettings();
    expect(screen.queryByRole('button', { name: /Manage Connections/i })).not.toBeInTheDocument();
  });

  it('hides Team Management from a Manager — adminOnly is narrower, and stays so', () => {
    mockUser.role = 'Manager';
    renderSettings();
    expect(screen.queryByRole('button', { name: /Team Overview/i })).not.toBeInTheDocument();
  });
});
