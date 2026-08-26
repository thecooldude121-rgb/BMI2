import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SalesFunnel from './SalesFunnel';
import TaskOverview from './TaskOverview';
import LeadScoreChart from './LeadScoreChart';
import RecentActivity from './RecentActivity';
import StatCard from './StatCard';
import { Users } from 'lucide-react';
import { dealValue, isOpen, isClosedWon } from '../../hooks/useDashboardData';
import type { Lead } from '../../types/lead';
import type { TaskRecord, ActivityRecord } from '../../utils/activitiesApi';

/**
 * Covers the specific things that were wrong when these widgets read sample
 * data, so a regression to any of them fails here rather than on a customer's
 * dashboard.
 */

const lead = (over: Partial<Lead>): Lead =>
  ({
    id: '1',
    first_name: 'A',
    last_name: 'B',
    score: 0,
    status: 'new',
    source: 'manual',
    owner_id: '',
    tags: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    created_by: '',
    ...over,
  }) as Lead;

const task = (over: Partial<TaskRecord>): TaskRecord =>
  ({
    id: 'T1',
    title: 'Task',
    description: null,
    type: null,
    priority: null,
    status: 'pending',
    assigned_to: null,
    related_to_type: null,
    related_to_id: null,
    due_date: null,
    completed_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: null,
    ...over,
  }) as TaskRecord;

const activity = (over: Partial<ActivityRecord>): ActivityRecord =>
  ({
    id: 'A1',
    subject: 'Call',
    type: 'call',
    direction: null,
    status: null,
    priority: null,
    description: null,
    outcome: null,
    duration: null,
    scheduled_at: null,
    completed_at: null,
    created_by: null,
    assigned_to: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: null,
    lead_id: null,
    deal_id: null,
    contact_id: null,
    company_id: null,
    ...over,
  }) as ActivityRecord;

const routed = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('deal helpers', () => {
  it('parses the numeric string pg returns for NUMERIC columns', () => {
    // node-postgres hands back NUMERIC as a string; a bare sum would concatenate.
    expect(dealValue({ id: 'D1', value: '1500.50' })).toBe(1500.5);
  });

  it('treats a missing or unparseable value as zero rather than NaN', () => {
    expect(dealValue({ id: 'D1', value: null })).toBe(0);
    expect(dealValue({ id: 'D1', value: 'n/a' })).toBe(0);
  });

  it('counts a stage outside the pipeline list as open', () => {
    // deals.stage has no CHECK constraint and the live table holds
    // 'partner-evaluation' and 'renewal-quoted'. Matching a known set would
    // drop these from the pipeline total.
    expect(isOpen({ id: 'D1', stage: 'partner-evaluation' })).toBe(true);
    expect(isOpen({ id: 'D2', stage: 'renewal-quoted' })).toBe(true);
  });

  it('excludes both closed stages from open pipeline', () => {
    expect(isOpen({ id: 'D1', stage: 'closed-won' })).toBe(false);
    expect(isOpen({ id: 'D2', stage: 'closed-lost' })).toBe(false);
    expect(isClosedWon({ id: 'D1', stage: 'closed-won' })).toBe(true);
  });
});

describe('SalesFunnel', () => {
  it('buckets by Lead.status, which is where the DB stage column lands', () => {
    // The old version read lead.stage, which mapRowToLead never sets — so every
    // bucket was zero against real data.
    routed(
      <SalesFunnel
        leads={[
          lead({ id: '1', status: 'contacted' }),
          lead({ id: '2', status: 'contacted' }),
          lead({ id: '3', status: 'qualified' }),
        ]}
      />,
    );
    expect(screen.getByText('Contacted').parentElement).toHaveTextContent('2 leads');
    expect(screen.getByText('Qualified').parentElement).toHaveTextContent('1 lead');
  });

  it('shows the lost stage rather than hiding it', () => {
    routed(<SalesFunnel leads={[lead({ status: 'lost' })]} />);
    expect(screen.getByText('Lost')).toBeInTheDocument();
  });

  it('computes conversion over decided leads only', () => {
    // 1 won, 1 lost, 2 still open => 50%, not 25%.
    routed(
      <SalesFunnel
        leads={[
          lead({ id: '1', status: 'won' }),
          lead({ id: '2', status: 'lost' }),
          lead({ id: '3', status: 'new' }),
          lead({ id: '4', status: 'qualified' }),
        ]}
      />,
    );
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('reports no rate rather than 0% when nothing is decided', () => {
    routed(<SalesFunnel leads={[lead({ status: 'new' })]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('No decided leads')).toBeInTheDocument();
  });

  it('says so when there are no leads', () => {
    routed(<SalesFunnel leads={[]} />);
    expect(screen.getByText('No leads yet.')).toBeInTheDocument();
  });
});

describe('TaskOverview', () => {
  it('counts an overdue task using due_date', () => {
    // The old code read task.dueDate, which is undefined on a real row, so
    // new Date(undefined) gave Invalid Date and the NaN comparison was always
    // false — overdue silently read 0 no matter what.
    render(<TaskOverview tasks={[task({ due_date: '2020-01-01', status: 'pending' })]} />);
    const overdue = screen.getByText('Overdue').previousElementSibling;
    expect(overdue).toHaveTextContent('1');
  });

  it('never counts a completed task as overdue', () => {
    render(<TaskOverview tasks={[task({ due_date: '2020-01-01', status: 'completed' })]} />);
    expect(screen.getByText('Overdue').previousElementSibling).toHaveTextContent('0');
  });

  it('does not treat a task with no due date as overdue', () => {
    render(<TaskOverview tasks={[task({ due_date: null })]} />);
    expect(screen.getByText('Overdue').previousElementSibling).toHaveTextContent('0');
    expect(screen.getByText('No due date')).toBeInTheDocument();
  });

  it('sorts undated tasks last, not first', () => {
    render(
      <TaskOverview
        tasks={[
          task({ id: 'T1', title: 'undated', due_date: null }),
          task({ id: 'T2', title: 'dated', due_date: '2030-01-01' }),
        ]}
      />,
    );
    const titles = screen.getAllByText(/^(undated|dated)$/).map((n) => n.textContent);
    expect(titles).toEqual(['dated', 'undated']);
  });

  it('says so when there are no open tasks', () => {
    render(<TaskOverview tasks={[task({ status: 'completed' })]} />);
    expect(screen.getByText('No open tasks.')).toBeInTheDocument();
  });
});

describe('LeadScoreChart', () => {
  it('distinguishes unscored leads from badly scored ones', () => {
    // All-zero scores are absence of scoring, not a distribution with a 0 average.
    routed(<LeadScoreChart leads={[lead({ score: 0 }), lead({ id: '2', score: 0 })]} />);
    expect(screen.getByText('No leads have been scored yet.')).toBeInTheDocument();
  });

  it('renders the average once any lead is scored', () => {
    routed(
      <LeadScoreChart leads={[lead({ id: '1', score: 80 }), lead({ id: '2', score: 60 })]} />,
    );
    expect(screen.getByText('70')).toBeInTheDocument();
  });
});

describe('RecentActivity', () => {
  it('orders newest first and stably', () => {
    // The old version ended with .sort(() => Math.random() - 0.5), so the feed
    // reshuffled on every render and was never chronological.
    const items = [
      activity({ id: 'A1', subject: 'older', completed_at: '2026-01-01T00:00:00Z' }),
      activity({ id: 'A2', subject: 'newest', completed_at: '2026-06-01T00:00:00Z' }),
      activity({ id: 'A3', subject: 'middle', completed_at: '2026-03-01T00:00:00Z' }),
    ];
    const first = () =>
      routed(<RecentActivity activities={items} />)
        .container.querySelectorAll('p.font-medium');

    const order = Array.from(first()).map((n) => n.textContent);
    expect(order).toEqual(['newest', 'middle', 'older']);
  });

  it('distinguishes an empty feed from a failed one', () => {
    const { unmount } = routed(<RecentActivity activities={[]} />);
    expect(screen.getByText(/No activity logged yet/)).toBeInTheDocument();
    unmount();

    routed(<RecentActivity activities={[]} failed />);
    expect(screen.getByText('Activity could not be loaded.')).toBeInTheDocument();
  });

  it('only makes a row clickable when it has a parent record to open', () => {
    routed(<RecentActivity activities={[activity({ id: 'A1', lead_id: null })]} />);
    // The "View All Activity" button is the only button when no row is clickable.
    expect(screen.getAllByRole('button')).toHaveLength(1);

    routed(<RecentActivity activities={[activity({ id: 'A2', deal_id: 'D1' })]} />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(1);
  });
});

describe('StatCard', () => {
  it('omits the comparison row when no change is supplied', () => {
    // The dashboard used to hardcode "+12%" under a fixed "from last month".
    render(<StatCard title="Total Leads" value="38" icon={Users} color="blue" />);
    expect(screen.queryByText(/from last month/)).not.toBeInTheDocument();
  });

  it('shows a caption instead, when given one', () => {
    render(
      <StatCard
        title="Open Pipeline"
        value="$120K"
        icon={Users}
        color="yellow"
        caption="Excludes closed deals"
      />,
    );
    expect(screen.getByText('Excludes closed deals')).toBeInTheDocument();
  });
});
