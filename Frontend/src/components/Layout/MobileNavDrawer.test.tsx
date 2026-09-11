import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MobileNavDrawer from './MobileNavDrawer';
import { navGroups } from './Sidebar';

/**
 * The gap this covers was total: below 1024px the sidebar is `hidden`, nothing
 * replaced it, and a real 390px render of the app had ZERO visible links and no
 * reachable sign-out. So these tests are about reachability, not styling.
 *
 * They deliberately do NOT assert on the `lg:hidden` class. A class assertion
 * would pass on a drawer that renders nothing useful; every test below drives
 * the component the way a user on a phone does.
 */

const logout = vi.fn();
const navigateSpy = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 5, name: 'David Kumar' }, logout }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateSpy };
});

const renderDrawer = (onClose = vi.fn()) => {
  const utils = render(
    <MemoryRouter initialEntries={['/crm/dashboard']}>
      <MobileNavDrawer open onClose={onClose} />
    </MemoryRouter>,
  );
  return { ...utils, onClose };
};

beforeEach(() => {
  logout.mockClear();
  navigateSpy.mockClear();
  document.body.style.overflow = '';
});

describe('MobileNavDrawer', () => {
  it('renders nothing at all when closed', () => {
    render(
      <MemoryRouter>
        <MobileNavDrawer open={false} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('surfaces EVERY top-level destination the sidebar has', async () => {
    const user = userEvent.setup();
    renderDrawer();

    // Collapsible groups are closed except Activities, so expand the rest
    // first — "reachable" means reachable by a user, not present in the DOM.
    for (const group of navGroups) {
      for (const item of group.items) {
        if (!item.children) continue;
        const toggle = screen.getByRole('button', { name: new RegExp(`^${item.name}`, 'i') });
        if (toggle.getAttribute('aria-expanded') === 'false') await user.click(toggle);
      }
    }

    const expected: string[] = [];
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.children) expected.push(...item.children.map(c => c.name));
        else expected.push(item.name);
      }
    }

    const dialog = screen.getByRole('dialog');
    for (const name of expected) {
      expect(
        within(dialog).getByRole('link', { name: new RegExp(`^${name}$`, 'i') }),
        `"${name}" is in the sidebar but not reachable from the mobile drawer`,
      ).toBeInTheDocument();
    }
    // Settings is pinned below the groups rather than inside one.
    expect(within(dialog).getByRole('link', { name: /^settings$/i })).toHaveAttribute('href', '/crm/settings');
  });

  it('signs the user out and sends them to /login', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer();

    await user.click(screen.getByRole('button', { name: /sign out/i }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith('/login');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when a destination is chosen', async () => {
    const user = userEvent.setup();
    const { onClose } = renderDrawer();

    await user.click(screen.getByRole('link', { name: /^contacts$/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape and on a scrim click', async () => {
    const user = userEvent.setup();
    const { onClose, unmount } = renderDrawer();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTestId('mobile-nav-scrim'));
    expect(onClose).toHaveBeenCalledTimes(2);
    unmount();
  });

  it('is a modal dialog, moves focus into itself, and locks page scroll', () => {
    renderDrawer();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /close navigation menu/i }));
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores page scroll when it unmounts', () => {
    const { unmount } = renderDrawer();
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});
