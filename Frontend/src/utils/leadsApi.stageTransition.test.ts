import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateLeadViaAPI, transitionLeadStageViaAPI, LeadStageError } from './leadsApi';

/**
 * Step 5 — what actually goes on the wire when a lead's stage changes.
 *
 * The bug this replaces: updateLeadViaAPI renamed `status` to `stage` and PUT
 * it, so the conversion wizard's `{status:'converted', …}` became an accepted
 * stage write and a fake success screen. Now a stage change is a POST to the
 * transition endpoint, and only the other fields are PUT.
 */
const row = (extra: Record<string, unknown> = {}) => ({
  id: 7, first_name: 'A', last_name: 'B', email: 'a@b.co', stage: 'engaged', ...extra,
});

let fetchMock: ReturnType<typeof vi.fn>;
const calls = () => fetchMock.mock.calls.map(c => ({
  url: String(c[0]), method: (c[1] as RequestInit)?.method ?? 'GET',
  body: (c[1] as RequestInit)?.body ? JSON.parse((c[1] as RequestInit).body as string) : undefined,
}));

beforeEach(() => {
  fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const body = init?.body ? JSON.parse(init.body as string) : {};
    const stage = url.endsWith('/stage-transition') ? body.to_stage : 'engaged';
    return { ok: true, status: 200, json: async () => ({ success: true, data: row({ stage, ...body }) }) } as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
});

describe('updateLeadViaAPI — stage changes go to the transition endpoint', () => {
  it('a status-only update is ONE POST to /stage-transition and no PUT', async () => {
    const lead = await updateLeadViaAPI('7', { status: 'nurture' });
    expect(calls()).toEqual([
      { url: expect.stringMatching(/\/leads\/7\/stage-transition$/), method: 'POST', body: { to_stage: 'nurture' } },
    ]);
    expect(lead.status).toBe('nurture');
  });

  it('status plus other fields: transition first, then a PUT WITHOUT stage', async () => {
    await updateLeadViaAPI('7', { status: 'nurture', company: 'Contoso' });
    const [first, second] = calls();
    expect(first.url).toMatch(/stage-transition$/);
    expect(second.method).toBe('PUT');
    expect(second.body).toEqual({ company: 'Contoso' });
    expect(second.body).not.toHaveProperty('stage');
  });

  it('a disqualify reason becomes the transition reason instead of an unknown column', async () => {
    await updateLeadViaAPI('7', {
      status: 'disqualified', disqualified_reason: 'bad_fit', disqualified_reason_notes: 'too small',
    } as any);
    expect(calls()).toEqual([
      expect.objectContaining({ method: 'POST', body: { to_stage: 'disqualified', reason: 'bad_fit — too small' } }),
    ]);
  });

  it('an update with no status is a plain PUT, as before', async () => {
    await updateLeadViaAPI('7', { company: 'Fabrikam' });
    expect(calls()).toEqual([expect.objectContaining({ method: 'PUT', body: { company: 'Fabrikam' } })]);
  });
});

describe('transitionLeadStageViaAPI', () => {
  it('a 409 throws LeadStageError carrying the server\'s unmet criteria and can_override', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false, status: 409,
      json: async () => ({
        success: false, code: 'QUALIFICATION_CRITERIA_UNMET',
        message: 'This lead does not meet the qualification criteria: has a company.',
        unmet_criteria: [{ id: 'company', label: 'Has a company', met: false }],
        can_override: false,
      }),
    } as Response);

    const err = await transitionLeadStageViaAPI('7', 'qualified').catch(e => e);
    expect(err).toBeInstanceOf(LeadStageError);
    expect(err.status).toBe(409);
    expect(err.code).toBe('QUALIFICATION_CRITERIA_UNMET');
    expect(err.unmetCriteria.map((c: { id: string }) => c.id)).toEqual(['company']);
    expect(err.canOverride).toBe(false);
    expect(err.message).toMatch(/has a company/);
  });

  it('sends override and reason when given', async () => {
    await transitionLeadStageViaAPI('7', 'qualified', { override: true, reason: 'Met at expo' });
    expect(calls()[0].body).toEqual({ to_stage: 'qualified', override: true, reason: 'Met at expo' });
  });
});
