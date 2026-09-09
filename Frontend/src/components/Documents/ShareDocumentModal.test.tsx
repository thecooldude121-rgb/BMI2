import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ShareDocumentModal from './ShareDocumentModal';
import { toShareTarget } from '../../hooks/useWorkspaceMembers';
import type { WorkspaceMember } from '../../utils/usersApi';

/**
 * The share picker, rendered for real.
 *
 * WHY THIS FILE EXISTS RATHER THAN A BROWSER CHECK: the picker only opens for
 * a document, `documents` holds zero rows, and the session needed to sign in
 * was not available. So the property is pinned here instead — and permanently,
 * which a screenshot would not have been.
 *
 * WHAT IT PINS. Three separate hardcoded colleague lists used to feed this
 * component, and they did not agree with each other:
 *
 *   DocumentsLibrary    'Sarah Chen (Sales Team)', 'Mike Johnson (Manager)',
 *                       'Emily Davis (Sales Rep)'  — two pre-checked
 *   DocumentDetailPage  'Emily Davis', 'David Wilson', 'Lisa Brown'
 *   this component      the same three again, as `defaultTeamMembers`
 *
 * The third was the dangerous one: it was reached via
 * `teamMembers.length > 0 ? teamMembers : defaultTeamMembers`, so a caller
 * passing a REAL but empty roster silently got invented people — a fallback
 * that fires exactly when the truth is "nobody".
 *
 * Between them they invented two users who do not exist (David Wilson, Lisa
 * Brown), used the wrong email domain, and gave real people roles the server
 * contradicts. So the assertions below are as much about ABSENCE as presence.
 */

/** Shaped exactly as `usersApi.toMember` produces, for the real 5-user workspace. */
const member = (
  id: string, name: string, email: string, role: string,
): WorkspaceMember => ({
  id, name, email, role,
  department: null,
  status: 'active',
  isActive: true,
  lastLoginAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  initials: name.split(' ').map(w => w[0]).join(''),
  avatarColor: 'from-blue-500 to-blue-600',
  /*
   * `canChangeRole` is the last field on `WorkspaceMember` on this branch.
   * `canChangeManager` / `managerId` / `managerName` arrive with migration 041
   * on the schema branch and are deliberately NOT set here — a fixture that
   * over-specifies a type is a fixture that fails to compile on whichever
   * branch it meets first.
   */
  canChangeRole: false,
});

const REAL_ROSTER = [
  member('1', 'Alex Rodriguez', 'alex@bmicrm.com', 'sales'),
  member('3', 'Mike Johnson', 'mike@bmicrm.com', 'sales'),
  member('5', 'David Kumar', 'david@bmicrm.com', 'admin'),
];

const props = {
  isOpen: true,
  onClose: vi.fn(),
  onShare: vi.fn(),
  documentName: 'Proposal.pdf',
};

describe('ShareDocumentModal — the picker offers real people', () => {
  it('lists the members it was given, with the role the SERVER reports', () => {
    render(<ShareDocumentModal {...props} teamMembers={REAL_ROSTER.map(toShareTarget)} />);

    // Roles come through unprettified, matching Settings → Team and Team
    // Performance. A third vocabulary for the same field is how
    // "Mike Johnson (Manager)" happened.
    expect(screen.getByRole('option', { name: /Mike Johnson — sales \(mike@bmicrm\.com\)/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /David Kumar — admin \(david@bmicrm\.com\)/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Alex Rodriguez — sales/ })).toBeInTheDocument();
  });

  it('never invents a colleague, and never claims Mike is a Manager', () => {
    render(<ShareDocumentModal {...props} teamMembers={REAL_ROSTER.map(toShareTarget)} />);
    const text = document.body.textContent ?? '';
    // The two people who do not exist in this workspace at all.
    expect(text).not.toContain('David Wilson');
    expect(text).not.toContain('Lisa Brown');
    // The wrong domain.
    expect(text).not.toContain('@bmi.com');
    // The invented titles.
    expect(text).not.toContain('(Manager)');
    expect(text).not.toContain('Sales Rep');
    expect(text).not.toContain('Sales Team');
  });

  it('AN EMPTY ROSTER STAYS EMPTY — no fabricated fallback', () => {
    /*
     * The regression that matters most. `defaultTeamMembers` used to render
     * here precisely because the real list was empty, so the honest answer
     * ("nobody else is in this workspace") was the one case that produced
     * invented people.
     */
    render(<ShareDocumentModal {...props} teamMembers={[]} />);
    const text = document.body.textContent ?? '';
    expect(text).not.toContain('David Wilson');
    expect(text).not.toContain('Lisa Brown');
    expect(text).not.toContain('Emily Davis');
    expect(screen.getByText(/No other members in this workspace/)).toBeInTheDocument();
    expect(screen.getByText(/Invite colleagues from Settings/)).toBeInTheDocument();
  });

  it('says LOADING and FAILED apart from "nobody to share with"', () => {
    // Three states that used to look identical, one of which showed invented
    // people. An empty picker because a fetch failed is not the same fact as an
    // empty picker because you work alone.
    const { unmount } = render(
      <ShareDocumentModal {...props} teamMembers={[]} membersLoading />,
    );
    expect(screen.getByRole('option', { name: /Loading members/ })).toBeInTheDocument();
    expect(screen.queryByText(/No other members/)).not.toBeInTheDocument();
    unmount();

    render(
      <ShareDocumentModal
        {...props}
        teamMembers={[]}
        membersError="Could not load workspace members."
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load workspace members.');
    expect(screen.queryByText(/No other members/)).not.toBeInTheDocument();
  });

  it('cannot share until a real member is picked', () => {
    // Nothing is preselected: DocumentsLibrary's list arrived with the first
    // two colleagues already checked, which proposes a recipient the user
    // never chose.
    render(<ShareDocumentModal {...props} teamMembers={REAL_ROSTER.map(toShareTarget)} />);
    expect(screen.getByRole('button', { name: /Share Doc/ })).toBeDisabled();
    expect((screen.getByLabelText('Share with Team Member') as HTMLSelectElement).value).toBe('');
  });
});

describe('toShareTarget', () => {
  it('maps a real member without inventing anything', () => {
    expect(toShareTarget(member('5', 'David Kumar', 'david@bmicrm.com', 'admin'))).toEqual({
      user_id: '5',
      user_name: 'David Kumar',
      user_avatar: 'DK',
      user_email: 'david@bmicrm.com',
      user_role: 'admin',
    });
  });

  it('falls back to the email when a member has no name, rather than a placeholder', () => {
    const nameless = { ...member('9', '', 'nobody@bmicrm.com', 'sales'), initials: 'N' };
    expect(toShareTarget(nameless).user_name).toBe('nobody@bmicrm.com');
  });
});
