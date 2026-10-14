import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

/**
 * H2 (2026-10-14): Report Detail and the Custom Report Builder announce no
 * share, save or schedule that did not happen. The saved-reports API exists
 * only on an unmerged branch; until it lands every such action is "Coming soon".
 */
vi.mock('../../components/CRM/CRMNavigation', () => ({ default: () => null }));
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import ReportDetailView from './ReportDetailView';
import CustomReportBuilder from './CustomReportBuilder';

it('Report Detail is an honest "coming soon" state: no sample figures, and the URL is never shown as a report name', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/crm/reports/quarterly-fraud-totals']}>
      <Routes><Route path="/crm/reports/:reportSlug" element={<ReportDetailView />} /></Routes>
    </MemoryRouter>,
  );
  expect(screen.getByText('Detailed report views are coming soon')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Back to Reports' })).toBeEnabled();
  expect(container.textContent).not.toMatch(/quarterly|fraud/i);
  expect(container.textContent).not.toMatch(/\$\d|minutes ago|shared with|PREVIEW/i);
});

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
