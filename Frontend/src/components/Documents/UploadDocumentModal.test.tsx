import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UploadDocumentModal from './UploadDocumentModal';

/**
 * The upload modal's "Related record" picker and share list.
 *
 * These cover the two live-check items that do not need a browser:
 *
 *   3. picking a second record REPLACES the first (it used to silently
 *      discard whichever the else-if chain did not reach)
 *   4. the picker lists REAL records, and the share list REAL members with
 *      their server roles
 *
 * Items 1 and 2 — the actual upload succeeding or failing — are pinned in
 * `Backend/src/__tests__/roundTrip.documents.test.ts` against the real API,
 * which is the boundary the bug lived at.
 */

const showToast = vi.fn();
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ showToast }) }));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: '5', name: 'David Kumar', email: 'david@bmicrm.com', role: 'Admin' } }),
}));

/** The real workspace roster, as `useWorkspaceMembers` returns it. */
vi.mock('../../hooks/useWorkspaceMembers', () => ({
  useWorkspaceMembers: () => ({
    members: [
      { id: '1', name: 'Alex Rodriguez', email: 'alex@bmicrm.com', role: 'sales', initials: 'AR' },
      { id: '3', name: 'Mike Johnson', email: 'mike@bmicrm.com', role: 'sales', initials: 'MJ' },
    ],
    loading: false,
    error: null,
  }),
  toShareTarget: (m: { id: string; name: string; email: string; role: string; initials: string }) => ({
    user_id: m.id, user_name: m.name, user_avatar: m.initials,
    user_email: m.email, user_role: m.role,
  }),
}));

/** Real record ids from this workspace — D042 / C002 / CT001, never deal_acme_001. */
vi.mock('../../hooks/useRelatedRecordOptions', () => ({
  MODULE_LABEL: { lead: 'Lead', deal: 'Deal', contact: 'Contact', account: 'Account', activity: 'Activity' },
  useRelatedRecordOptions: () => ({
    options: [
      { module: 'deal',    id: 'D042',  name: 'Moving Walls – DOOH', detail: 'Moving Walls' },
      { module: 'account', id: 'C002',  name: 'Acme Corp',           detail: 'Technology' },
      { module: 'contact', id: 'CT001', name: 'Nancy Wilson',        detail: 'FinSolve Ltd' },
    ],
    loading: false,
    failed: [],
  }),
}));

vi.mock('../../services/documentsService', () => ({
  documentsService: { uploadDocument: vi.fn(), createDocumentRecord: vi.fn() },
}));

const props = { isOpen: true, onClose: vi.fn(), onUpload: vi.fn(), onUploadComplete: vi.fn() };

beforeEach(() => {
  showToast.mockReset();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k === 'authToken' ? 'test-token' : null),
    setItem: () => {}, removeItem: () => {}, clear: () => {}, key: () => null, length: 0,
  } as unknown as Storage);
});
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

/**
 * The picker input, found by PLACEHOLDER rather than label.
 *
 * `getByLabelText(/Related record/i)` also matches the chip's remove control,
 * whose aria-label is "Remove related record" — so an assertion written that
 * way reports the wrong element and can pass or fail for the wrong reason.
 */
const PICKER = /Search deals, accounts, contacts or activities/i;

const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  const input = screen.getByPlaceholderText(PICKER);
  await user.click(input);
  return input;
};

describe('UploadDocumentModal — the related-record picker', () => {
  it('lists REAL records from all four types, each labelled with its type', async () => {
    const user = userEvent.setup();
    render(<UploadDocumentModal {...props} />);
    await openPicker(user);

    // "Acme Corp" alone does not say whether it is an account or a deal, which
    // is why the type is on every row.
    expect(await screen.findByRole('button', { name: /Deal.*Moving Walls/s })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Account.*Acme Corp/s })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contact.*Nancy Wilson/s })).toBeInTheDocument();
  });

  it('offers none of the four fabricated id sets', async () => {
    const user = userEvent.setup();
    render(<UploadDocumentModal {...props} />);
    await openPicker(user);
    const text = document.body.textContent ?? '';
    for (const fake of ['deal_acme_001', 'account_acme', 'contact_john_smith', 'act_bigco_001']) {
      expect(text).not.toContain(fake);
    }
  });

  it('A SECOND RECORD CANNOT BE ADDED WHILE ONE IS ATTACHED', async () => {
    /*
     * The silent-discard bug, and the mechanism that prevents it.
     *
     * Four independent `selectedX` states used to feed an `else if`, so
     * choosing a Deal AND a Contact sent the Deal and DROPPED the Contact with
     * nothing on screen to say so.
     *
     * The guarantee is stronger than "the second pick replaces the first":
     * once a record is attached the search input is REPLACED by the chip, so
     * there is no second pick to make until the user explicitly removes it.
     * Asserted that way round because that is what the component does — an
     * earlier version of this test removed the chip first and therefore never
     * exercised the property at all.
     */
    const user = userEvent.setup();
    render(<UploadDocumentModal {...props} />);

    await openPicker(user);
    await user.click(await screen.findByRole('button', { name: /Deal.*Moving Walls/s }));
    expect(screen.getByText('Moving Walls – DOOH')).toBeInTheDocument();

    // No search input, and no options, while something is attached.
    expect(screen.queryByPlaceholderText(PICKER)).not.toBeInTheDocument();
    expect(screen.queryByText('Nancy Wilson')).not.toBeInTheDocument();
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
  });

  it('and after removing it, a DIFFERENT type can be attached instead', async () => {
    const user = userEvent.setup();
    render(<UploadDocumentModal {...props} />);

    await openPicker(user);
    await user.click(await screen.findByRole('button', { name: /Deal.*Moving Walls/s }));
    await user.click(screen.getByRole('button', { name: /Remove related record/i }));

    await openPicker(user);
    await user.click(await screen.findByRole('button', { name: /Contact.*Nancy Wilson/s }));

    // The Contact is attached and the Deal is gone — never both.
    expect(screen.getByText('Nancy Wilson')).toBeInTheDocument();
    expect(screen.queryByText('Moving Walls – DOOH')).not.toBeInTheDocument();
  });

  it('shows only one attached record at a time, with a way to remove it', async () => {
    const user = userEvent.setup();
    render(<UploadDocumentModal {...props} />);
    await openPicker(user);
    await user.click(await screen.findByRole('button', { name: /Account.*Acme Corp/s }));

    // One chip, one remove control — the UI cannot express two relations,
    // matching what `documents.module` / `record_id` can store.
    expect(screen.getAllByRole('button', { name: /Remove related record/i })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: /Remove related record/i }));
    await waitFor(() => expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument());
  });
});

describe('UploadDocumentModal — the share list', () => {
  it('lists REAL members with their server roles, and none pre-checked', async () => {
    render(<UploadDocumentModal {...props} />);

    // Visibility defaults to 'team', so the list renders.
    expect(await screen.findByText(/Alex Rodriguez/)).toBeInTheDocument();
    expect(screen.getByText(/Mike Johnson/)).toBeInTheDocument();

    const boxes = screen.getAllByRole('checkbox');
    // It defaulted to ['user_sarah_chen','user_mike'] — two fabricated ids,
    // pre-checked, proposing recipients the user never chose.
    expect(boxes.some(b => (b as HTMLInputElement).checked)).toBe(false);
  });

  it('never shows the fabricated colleague list or its wrong roles', async () => {
    render(<UploadDocumentModal {...props} />);
    await screen.findByText(/Alex Rodriguez/);
    const text = document.body.textContent ?? '';
    expect(text).not.toContain('Sarah Chen');
    expect(text).not.toContain('Emily Davis');
    expect(text).not.toContain('(Manager)');
    expect(text).not.toContain('@bmi.com');
    // The server's role, unprettified.
    expect(text).toContain('sales');
  });
});
