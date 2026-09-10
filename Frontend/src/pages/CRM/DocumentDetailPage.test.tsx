import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DocumentDetailPage from './DocumentDetailPage';

/**
 * The detail page's share picker, tested AT THE PAGE.
 *
 * WHY HERE AND NOT ONLY ON THE MODAL. `ShareDocumentModal` already has tests
 * asserting it filters nobody — and they all passed while this page was
 * dropping the signed-in user, because the page decides WHICH members the
 * modal receives. Reintroducing the exact bug left 564 tests green, which is
 * how it reached live testing in the first place.
 *
 * The defect: while consolidating three hardcoded colleague lists onto one
 * fetch, a self-filter was added to THIS page only — on an invented rule
 * ("never offer to share with yourself") applied to one of three surfaces. The
 * signed-in admin was missing here and present in the library and the upload
 * modal, so the same workspace showed a different team depending on the
 * screen. Consistency across the three is the property; the rule was never a
 * decision anyone made.
 */

const showToast = vi.fn();
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ showToast }) }));
vi.mock('react-router-dom', () => ({
  useParams: () => ({ documentId: 'doc-1' }),
  useNavigate: () => vi.fn(),
}));

/** The signed-in user IS a member of the roster below — that is the point. */
const CURRENT_USER = { id: '5', name: 'David Kumar', email: 'david@bmicrm.com', role: 'Admin' };
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: '5', name: 'David Kumar', email: 'david@bmicrm.com', role: 'Admin' } }),
}));

vi.mock('../../hooks/useWorkspaceMembers', async () => {
  const actual = await vi.importActual<typeof import('../../hooks/useWorkspaceMembers')>(
    '../../hooks/useWorkspaceMembers',
  );
  return {
    // The real mapper, so the shape the modal receives is not faked.
    toShareTarget: actual.toShareTarget,
    useWorkspaceMembers: () => ({
      members: [
        { id: '1', name: 'Alex Rodriguez', email: 'alex@bmicrm.com', role: 'sales',
          department: null, status: 'active', isActive: true, lastLoginAt: null,
          createdAt: '2026-01-01T00:00:00.000Z', initials: 'AR',
          avatarColor: 'from-blue-500 to-blue-600', canChangeRole: false },
        { id: '5', name: 'David Kumar', email: 'david@bmicrm.com', role: 'admin',
          department: null, status: 'active', isActive: true, lastLoginAt: null,
          createdAt: '2026-01-01T00:00:00.000Z', initials: 'DK',
          avatarColor: 'from-blue-500 to-blue-600', canChangeRole: false },
      ],
      loading: false,
      error: null,
    }),
  };
});

vi.mock('../../utils/documentsApi', () => ({
  downloadDocument: vi.fn(),
  // The real contract: { ok, document } | { ok: false, notFound, message }.
  fetchDocument: vi.fn(async () => ({
    ok: true,
    document: {
      id: 'doc-1', name: 'Proposal.pdf', file_type: 'pdf', file_size: 1234,
      category: 'Proposal', description: null, module: null, record_id: null,
      version: 1, tags: [], uploaded_by: 'David Kumar',
      created_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-09-01T00:00:00.000Z',
    },
  })),
}));

beforeEach(() => {
  showToast.mockReset();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k === 'authToken' ? 'test-token' : null),
    setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
  } as unknown as Storage);
});
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('DocumentDetailPage — the share picker', () => {
  it('OFFERS THE SIGNED-IN USER, matching the other two share surfaces', async () => {
    const user = userEvent.setup();
    render(<DocumentDetailPage />);
    await screen.findAllByText('Proposal.pdf');

    // Open the share modal from the page's own control.
    const shareButtons = await screen.findAllByRole('button', { name: /share/i });
    await user.click(shareButtons[0]);

    const picker = await screen.findByLabelText('Share with Team Member');
    // David Kumar is the signed-in admin AND a member of the roster. He was
    // filtered out here and nowhere else.
    expect(within(picker).getByRole('option', { name: /David Kumar/ })).toBeInTheDocument();
    expect(within(picker).getByRole('option', { name: /Alex Rodriguez/ })).toBeInTheDocument();
  });

  it('passes the roster through WHOLE — the page filters nobody', async () => {
    const user = userEvent.setup();
    render(<DocumentDetailPage />);
    await screen.findAllByText('Proposal.pdf');

    const shareButtons = await screen.findAllByRole('button', { name: /share/i });
    await user.click(shareButtons[0]);

    const picker = await screen.findByLabelText('Share with Team Member');
    // Two members + the placeholder. Scoped to this select because the modal
    // also renders a visibility select, and an unscoped count measures both.
    await waitFor(() => expect(within(picker).getAllByRole('option')).toHaveLength(3));
  });

  it('renders the signed-in user as the actor, not a hardcoded name', async () => {
    // The same page hardcoded "Alex Rodriguez" as `currentUser` before this
    // branch; the identity now comes from the session.
    render(<DocumentDetailPage />);
    await screen.findAllByText('Proposal.pdf');
    expect(document.body.textContent ?? '').not.toContain('alex.rodriguez@bmi.com');
    expect(CURRENT_USER.name).toBe('David Kumar');
  });
});
