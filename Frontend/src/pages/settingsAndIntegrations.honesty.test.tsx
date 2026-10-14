import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * H2 (2026-10-14): browser-only settings say so, and nothing claims an
 * integration or a routing rule that does not exist.
 */
vi.mock('../contexts/ToastContext', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import SLAConfigPage from './CRM/SLAConfigPage';
import AssignmentRulesPage from './CRM/AssignmentRulesPage';
import { IntegrationsHub } from './Integrations/IntegrationsHub';
import { IntegrationsProvider } from '../contexts/IntegrationsContext';

it('SLA settings are labelled browser-only and make no all-rows / KPI claim', () => {
  const { container } = render(<MemoryRouter><SLAConfigPage /></MemoryRouter>);
  expect(container.textContent).toMatch(/stored in this browser only/);
  expect(container.textContent).not.toMatch(/immediately for all lead rows|KPI cards|API call to persist/);
});

it('Assignment rules say they are not applied to any lead', () => {
  const { container } = render(<MemoryRouter><AssignmentRulesPage /></MemoryRouter>);
  expect(container.textContent).toMatch(/NOT applied to any lead/);
  expect(container.textContent).not.toMatch(/Automatically route incoming leads/);
});

it('Integrations Hub is labelled and "Add Custom" is disabled', () => {
  render(<MemoryRouter><IntegrationsProvider><IntegrationsHub /></IntegrationsProvider></MemoryRouter>);
  expect(screen.getByText(/No integration is connected in this CRM yet/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Add Custom · Coming soon/ })).toBeDisabled();
});
