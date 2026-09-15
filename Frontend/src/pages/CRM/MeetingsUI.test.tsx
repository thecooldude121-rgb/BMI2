import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MeetingsPage from './MeetingsPage';
import MeetingDetailPage from './MeetingDetailPage';

/**
 * MEETING AGENT — the UI, against a mocked server envelope only.
 *
 * WHAT THESE PIN, in order of how badly each would hurt:
 *  1. NOTHING IS INFERRED FROM NOTE TEXT. The "log an activity" subject starts
 *     EMPTY even when the note is full of obvious action-item phrasing, and no
 *     suggestion list is rendered anywhere. This is the property the backend
 *     also asserts, kept on the client where the temptation actually lives —
 *     a pre-filled field is accepted far more often than it is read.
 *  2. A failed load is not an empty list, and an unlinked meeting is not a
 *     meeting with no activities. Four different absences, kept apart.
 *  3. The push action writes through PUT /:id/relation, not the general PATCH,
 *     and a server rejection is shown verbatim.
 *  4. Real rows render; nothing is invented when the server sends nothing.
 */

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
let fetchMock: Mock<FetchFn>;

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body } as Response);
const fail = (status: number, message: string) =>
  ({ ok: false, status, json: async () => ({ success: false, message }) } as Response);

const MEETING = {
  id: 'MTG001',
  title: 'Pricing call',
  date: '2026-09-10T10:00:00.000Z',
  duration: 30,
  attendees: 'Priya, Sam',
  type: 'sales-call',
  related_to_type: 'deal',
  related_to_id: 'D001',
  summary: null,
  /* Deliberately stuffed with action-item phrasing: if anything ever starts
     parsing notes, these are the strings it would latch onto. */
  notes: 'ACTION: send the revised quote. TODO: book a security review. Next steps: call procurement Friday.',
  action_items: null,
  owner_id: 3,
  owner_name: 'Priya Nair',
  created_at: '2026-09-10T10:00:00.000Z',
  updated_at: null,
};

const DETAIL = {
  ...MEETING,
  tasks: [{ id: 'T001', title: 'Prepare the quote', status: 'pending', priority: 'high', due_date: '2026-09-20', assigned_to: 'Sam' }],
  activities: [{ id: 'A1', subject: 'Send revised quote', type: 'task', status: 'planned', completed_at: null, created_at: '2026-09-11T09:00:00.000Z', created_by: 'Priya Nair' }],
};

function server(over: {
  list?: unknown[] | 'fail';
  detail?: Record<string, unknown> | 'fail';
  onPut?: () => Response;
  onPost?: (url: string, body: unknown) => Response;
} = {}) {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url);
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(init.body as string) : undefined;

    if (method === 'PUT') return over.onPut ? over.onPut() : ok({ success: true, data: MEETING });
    if (method === 'POST' && u.includes('/activities')) {
      return over.onPost ? over.onPost(u, body) : ok({ success: true, data: { id: 'A2', subject: body.subject } });
    }
    if (method === 'PATCH') return ok({ success: true, data: { ...MEETING, notes: body.notes } });

    if (/\/meetings\/[^/?]+$/.test(u)) {
      if (over.detail === 'fail') return fail(500, 'boom');
      return ok({ success: true, data: over.detail ?? DETAIL });
    }
    if (u.includes('/meetings')) {
      if (over.list === 'fail') return fail(500, 'upstream down');
      return ok({ success: true, data: over.list ?? [MEETING] });
    }
    if (u.includes('/deals')) return ok({ success: true, data: [{ id: 'D009', name: 'Acme renewal' }] });
    if (u.includes('/companies') || u.includes('/accounts')) return ok({ success: true, data: [] });
    return ok({ success: true, data: [] });
  });
  vi.stubGlobal('fetch', fetchMock);
}

const renderDetail = () => render(
  <MemoryRouter initialEntries={['/crm/meetings/MTG001']}>
    <Routes><Route path="/crm/meetings/:id" element={<MeetingDetailPage />} /></Routes>
  </MemoryRouter>,
);

beforeEach(() => { localStorage.setItem('authToken', 't'); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); });

describe('nothing is inferred from note text', () => {
  it('the activity subject starts EMPTY, with a note full of ACTION/TODO phrasing', async () => {
    server();
    const user = userEvent.setup();
    renderDetail();

    await waitFor(() => expect(screen.getByText('Pricing call')).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Log an activity/i }));

    const subject = await screen.findByLabelText(/What is the follow-up/i);
    // THE ASSERTION THAT MATTERS. The note says "ACTION: send the revised
    // quote" three lines up; the field is still blank.
    expect(subject).toHaveValue('');
  });

  it('renders NO suggestion or "detected items" affordance anywhere', async () => {
    server();
    renderDetail();
    await waitFor(() => expect(screen.getByText('Pricing call')).toBeInTheDocument());

    for (const pattern of [/detected/i, /suggest/i, /we found/i, /action items found/i]) {
      expect(screen.queryByText(pattern)).not.toBeInTheDocument();
    }
    // ...and it says so, so the absence is legible rather than looking unfinished.
    expect(screen.getByText(/nothing is read out of this note automatically/i)).toBeInTheDocument();
  });

  it('sends exactly the subject the user typed', async () => {
    server();
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => expect(screen.getByText('Pricing call')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Log an activity/i }));
    await user.type(await screen.findByLabelText(/What is the follow-up/i), 'Chase legal');
    await user.click(screen.getByRole('button', { name: /^Log activity$/i }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(
        ([u, i]) => String(u).includes('/activities') && i?.method === 'POST');
      expect(post).toBeTruthy();
      expect(JSON.parse(post![1]!.body as string).subject).toBe('Chase legal');
    });
  });
});

describe('the four absences stay apart', () => {
  it('a failed list renders an error, NOT an empty list', async () => {
    server({ list: 'fail' });
    render(<MemoryRouter><MeetingsPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/this is not an empty list/i)).toBeInTheDocument());
    expect(screen.getByText(/upstream down/)).toBeInTheDocument();
    expect(screen.queryByText(/No meeting notes yet/i)).not.toBeInTheDocument();
  });

  it('a genuinely empty list says so and offers the action', async () => {
    server({ list: [] });
    render(<MemoryRouter><MeetingsPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/No meeting notes yet/i)).toBeInTheDocument());
    expect(screen.queryByText(/this is not an empty list/i)).not.toBeInTheDocument();
  });

  it('an UNLINKED meeting explains why there are no activities, rather than showing none', async () => {
    server({ detail: { ...DETAIL, related_to_type: null, related_to_id: null, tasks: [], activities: [] } });
    renderDetail();

    await waitFor(() => expect(screen.getByText(/Not linked to a record yet/i)).toBeInTheDocument());
    expect(screen.getByText(/an activity needs somewhere to land/i)).toBeInTheDocument();
    // The action is disabled rather than failing on click.
    expect(screen.getByRole('button', { name: /Log an activity/i })).toBeDisabled();
  });

  it('a linked meeting with nothing logged says THAT instead', async () => {
    server({ detail: { ...DETAIL, activities: [] } });
    renderDetail();
    await waitFor(() => expect(screen.getByText(/Nothing logged on Deal D001 yet/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Log an activity/i })).toBeEnabled();
  });
});

describe('real rows render', () => {
  it('lists meetings from the server, with their link state', async () => {
    server({ list: [MEETING, { ...MEETING, id: 'MTG002', title: 'Internal sync', related_to_type: null, related_to_id: null }] });
    render(<MemoryRouter><MeetingsPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('Pricing call')).toBeInTheDocument());
    expect(screen.getByText('Internal sync')).toBeInTheDocument();
    expect(screen.getByText('Not linked')).toBeInTheDocument();
    expect(screen.getByText(/Deal D001/)).toBeInTheDocument();
  });

  it('shows the real tasks and activities of the linked record', async () => {
    server();
    renderDetail();
    await waitFor(() => expect(screen.getByText('Prepare the quote')).toBeInTheDocument());
    expect(screen.getByText('Send revised quote')).toBeInTheDocument();
    // The name appears twice on purpose — once for the meeting's owner, once
    // on the activity row — so this asserts presence, not uniqueness.
    expect(screen.getAllByText(/Logged by Priya Nair/).length).toBeGreaterThan(0);
  });

  it('counts only what it fetched — no invented stat tiles', async () => {
    server({ list: [MEETING] });
    render(<MemoryRouter><MeetingsPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText('Pricing call')).toBeInTheDocument());

    // The old page advertised 47 meetings, 35 recorded, 1 live now and 42 "AI
    // processed" from a fixture. None of those tiles may return.
    for (const gone of [/recorded/i, /live now/i, /ai processed/i]) {
      expect(screen.queryByText(gone)).not.toBeInTheDocument();
    }
    // 'Meetings' is also the nav label, so target the tile by its own text.
    const tileLabel = screen.getByText('Meetings', { selector: 'p' });
    expect(within(tileLabel.closest('div')!).getByText('1')).toBeInTheDocument();
  });
});

describe('the push action', () => {
  it('writes through PUT /:id/relation, never the general PATCH', async () => {
    server();
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => expect(screen.getByText('Pricing call')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Change linked record/i }));
    // The picker is a real select fed by the deals list, so this chooses an
    // option rather than typing an id.
    await user.selectOptions(await screen.findByLabelText(/^Deal$/i), 'D009');
    await user.click(screen.getByRole('button', { name: /^Link$/i }));

    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([, i]) => i?.method === 'PUT');
      expect(put).toBeTruthy();
      expect(String(put![0])).toContain('/meetings/MTG001/relation');
      expect(JSON.parse(put![1]!.body as string)).toEqual({
        related_to_type: 'deal', related_to_id: 'D009',
      });
    });
  });

  it('shows the server\'s rejection verbatim — it names the field and discloses nothing', async () => {
    server({
      onPut: () => fail(400, 'related_to_id does not name a deal in this workspace'),
    });
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => expect(screen.getByText('Pricing call')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Change linked record/i }));
    await user.selectOptions(await screen.findByLabelText(/^Deal$/i), 'D009');
    await user.click(screen.getByRole('button', { name: /^Link$/i }));

    await waitFor(() => expect(
      screen.getByText('related_to_id does not name a deal in this workspace'),
    ).toBeInTheDocument());
  });
});
