import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoreOptionsDropdown } from './DealModals';

/** H2 (2026-10-14): Archive / Export as PDF / Share were toasts over nothing. */
it('unbuilt deal actions are disabled "Coming soon" and never reach the handler', async () => {
  const onAction = vi.fn();
  render(<MoreOptionsDropdown isOpen onClose={() => {}} onAction={onAction} />);
  for (const label of ['Archive Deal', 'Export as PDF', 'Share Deal']) {
    const b = screen.getByRole("button", { name: new RegExp(`${label} · Coming soon`) });
    expect(b).toBeDisabled();
    await userEvent.click(b).catch(() => {});
  }
  expect(onAction).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: /Delete Deal/ }));
  expect(onAction).toHaveBeenCalledWith('delete');
});
