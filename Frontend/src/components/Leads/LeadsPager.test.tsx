import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LeadsPager, { pageWindow } from './LeadsPager';
import BulkActionBar from './BulkActionBar';

describe('pageWindow', () => {
  it('lists every page when there are seven or fewer', () => {
    expect(pageWindow(1, 4)).toEqual([1, 2, 3, 4]);
  });
  it('keeps first, last and the neighbours, with gaps marked', () => {
    expect(pageWindow(6, 12)).toEqual([1, 'gap', 5, 6, 7, 'gap', 12]);
    expect(pageWindow(1, 12)).toEqual([1, 2, 'gap', 12]);
    expect(pageWindow(12, 12)).toEqual([1, 'gap', 11, 12]);
  });
});

describe('LeadsPager', () => {
  it('reports the real range on the last, short page and marks the current page', () => {
    render(<LeadsPager page={3} pageCount={3} total={60} pageSize={25} shown={10} onPage={vi.fn()} />);
    expect(screen.getByTestId('leads-showing')).toHaveTextContent('Showing 51–60 of 60 leads');
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });
  it('an empty result reads 0–0, with no page buttons', () => {
    render(<LeadsPager page={1} pageCount={1} total={0} pageSize={25} shown={0} onPage={vi.fn()} />);
    expect(screen.getByTestId('leads-showing')).toHaveTextContent('Showing 0–0 of 0 leads');
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
  });
});

describe('BulkActionBar — follow-up is "coming soon", never a fake success', () => {
  it('the follow-up control is disabled and labelled', () => {
    render(
      <BulkActionBar
        selectedIds={['1']} selectedLeads={[]} totalFiltered={1} isPageFullySelected areAllFiltered={false}
        onSelectAllFiltered={vi.fn()} onClearSelection={vi.fn()} onChangeStatus={vi.fn()} onSetFollowUp={vi.fn()}
        onExport={vi.fn()} onConvert={vi.fn()} onArchive={vi.fn()} onDisqualify={vi.fn()} onOpenTerminalModal={vi.fn()}
        onDelete={vi.fn()} onToast={vi.fn()} canConvert canDelete
      />,
    );
    expect(screen.getByRole('button', { name: 'Set follow-up (coming soon)' })).toBeDisabled();
  });
});
