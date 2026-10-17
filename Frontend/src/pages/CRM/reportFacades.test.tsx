import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * H2 (2026-10-14): the Custom Report Builder announces no save or schedule
 * that did not happen; every such action is "Coming soon" until step f.
 * (Report Detail is real since step e — see ReportDetailView.test.tsx.)
 */
vi.mock('../../components/CRM/CRMNavigation', () => ({ default: () => null }));
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import CustomReportBuilder from './CustomReportBuilder';

it('Custom Report Builder: Save as Draft and Save & Run are disabled; nothing claims a save', () => {
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  const { container } = render(<MemoryRouter><CustomReportBuilder /></MemoryRouter>);
  for (const b of screen.getAllByRole('button', { name: /Save as Draft · Coming soon|Save & Run · Coming soon|Draft · Soon|Run · Soon/ })) {
    expect(b).toBeDisabled();
  }
  expect(screen.getAllByRole('button', { name: /Coming soon|Soon/ }).length).toBeGreaterThanOrEqual(4);
  expect(container.textContent).not.toMatch(/saved as draft|Analyzing \\d+ records/i);
  expect(alertSpy).not.toHaveBeenCalled();
});
