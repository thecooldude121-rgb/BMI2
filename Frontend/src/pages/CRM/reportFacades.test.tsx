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

it('Report Detail: Favorite / Export / Share / Schedule are disabled; no "Last updated 5 minutes ago"', () => {
  const { container } = render(
    <MemoryRouter initialEntries={['/crm/reports/sales-overview']}>
      <Routes><Route path="/crm/reports/:reportSlug" element={<ReportDetailView />} /></Routes>
    </MemoryRouter>,
  );
  for (const label of ['Favorite', 'Export', 'Share', 'Schedule']) {
    expect(screen.getByRole('button', { name: `${label} · Coming soon` })).toBeDisabled();
  }
  expect(container.textContent).not.toMatch(/minutes ago|shared with/i);
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
