import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Slice 6: the task form links a record found by SERVER search — leads
 * included. Choosing "Lead" used to offer an empty list, and only the first 200
 * contacts / accounts / deals could ever be linked.
 */
const m = vi.hoisted(() => ({ createTask: vi.fn(), fetchLeadsPage: vi.fn() }));
vi.mock('../../utils/activitiesApi', async () => ({ ...(await vi.importActual<object>('../../utils/activitiesApi')), createTask: m.createTask }));
vi.mock('../../utils/usersApi', () => ({ fetchUsers: vi.fn().mockResolvedValue([]) }));
vi.mock('../../utils/leadsApi', async () => ({ ...(await vi.importActual<object>('../../utils/leadsApi')), fetchLeadsPage: m.fetchLeadsPage }));
import TaskFormModal from './TaskFormModal';

it('links a LEAD found by search, and posts its type and id', async () => {
  m.fetchLeadsPage.mockResolvedValue({ leads: [{ id: 501, first_name: 'Meera', last_name: 'Iyer', company: 'Kora', email: 'm@k.example' }], total: 1 });
  m.createTask.mockImplementation(async (p: unknown) => ({ id: 'T1', ...(p as object) }));
  const user = userEvent.setup();
  render(<TaskFormModal isOpen onClose={() => {}} onSaved={() => {}} />);
  await user.type(screen.getByLabelText(/Title/), 'Call Meera');
  await user.click(screen.getByRole('radio', { name: 'Lead' }));
  await user.type(screen.getByRole('combobox', { name: 'Search for the related record' }), 'Meera');
  await user.click(await screen.findByRole('option', { name: /Meera Iyer/ }));
  await user.click(screen.getByRole('button', { name: 'Create task' }));
  expect(m.fetchLeadsPage).toHaveBeenCalledWith(expect.objectContaining({ search: 'Meera', limit: 10 }));
  expect(m.createTask).toHaveBeenCalledWith(expect.objectContaining({ related_to_type: 'lead', related_to_id: '501' }));
});

it('no related record is a valid task (both fields absent)', async () => {
  m.createTask.mockImplementation(async (p: unknown) => ({ id: 'T2', ...(p as object) }));
  const user = userEvent.setup();
  render(<TaskFormModal isOpen onClose={() => {}} onSaved={() => {}} />);
  await user.type(screen.getByLabelText(/Title/), 'Plan the week');
  await user.click(screen.getByRole('button', { name: 'Create task' }));
  const p = m.createTask.mock.calls[m.createTask.mock.calls.length - 1][0];
  expect(p.related_to_type).toBeUndefined();
  expect(p.related_to_id).toBeUndefined();
});
