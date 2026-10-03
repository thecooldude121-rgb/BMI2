import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KpiCard from './KpiCard';

describe('KpiCard — comingSoon', () => {
  it('renders a dash and the reason instead of the value, and is not clickable', async () => {
    const onClick = vi.fn();
    render(<KpiCard title="SLA Breached" value={42} onClick={onClick} comingSoon="Moving to the server." />);
    expect(screen.queryByText('42')).toBeNull();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.getByText('Moving to the server.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    await userEvent.click(screen.getByText('SLA Breached'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
