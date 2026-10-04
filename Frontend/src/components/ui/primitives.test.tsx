import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Badge from './Badge';
import Alert from './Alert';
import Card, { SectionHeading } from './Card';
import Field, { inputClass } from './Field';
import EmptyState from './EmptyState';
import ConfirmationModal from '../common/ConfirmationModal';

/**
 * Figma phase 2 shared primitives. These pin behaviour and the accessibility
 * contracts, not pixels.
 */

describe('Badge', () => {
  it.each([
    ['neutral', 'text-ink-secondary'],   // NOT ink-muted: 4.27:1 on sunken fails AA
    ['brand', 'text-brand-600'],
    ['success', 'text-success-700'],
    ['warning', 'text-warning-700'],
    ['danger', 'text-danger-700'],
  ] as const)('%s uses its AA-passing text colour', (tone, cls) => {
    render(<Badge tone={tone}>Label</Badge>);
    expect(screen.getByText('Label')).toHaveClass(cls);
  });
});

describe('Alert', () => {
  it('a danger alert is announced assertively; others politely', () => {
    const { rerender } = render(<Alert tone="danger" title="Email is already in use">No changes were saved.</Alert>);
    expect(screen.getByRole('alert')).toHaveTextContent('Email is already in use');
    expect(screen.getByRole('alert')).toHaveTextContent('No changes were saved.');
    rerender(<Alert tone="success" title="Profile saved" />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('Profile saved');
  });
});

describe('Card and SectionHeading', () => {
  it('SectionHeading is an h2 (the page title is the h1)', () => {
    render(<Card><SectionHeading title="Personal details" description="Only supported fields are editable." /></Card>);
    expect(screen.getByRole('heading', { level: 2, name: 'Personal details' })).toBeInTheDocument();
  });
});

describe('Field', () => {
  it('binds the label to the control, so clicking the label focuses it', async () => {
    render(<Field label="First name"><input className={inputClass()} /></Field>);
    await userEvent.click(screen.getByText('First name'));
    expect(screen.getByRole('textbox', { name: 'First name' })).toHaveFocus();
  });

  it('announces help and error text through aria-describedby, and marks the control invalid', () => {
    render(
      <Field label="Email" help="Changing email changes your sign-in." error="A member already uses this email.">
        <input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('A member already uses this email. Changing email changes your sign-in.');
  });

  it('a field without an error is not marked invalid, and keeps a caller-supplied id', () => {
    render(<Field label="Last name"><input id="last" /></Field>);
    const input = screen.getByRole('textbox', { name: 'Last name' });
    expect(input).toHaveAttribute('id', 'last');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('marks a required field required for assistive tech, not only with an asterisk', () => {
    render(<Field label="Company" required><input /></Field>);
    expect(screen.getByRole('textbox', { name: /company/i })).toBeRequired();
  });
});

describe('EmptyState', () => {
  it('says why it is empty and offers the primary action', () => {
    render(
      <EmptyState title="No contacts yet" reason="Nobody has been added to this workspace." action={<button>Add contact</button>} />,
    );
    expect(screen.getByText('Nobody has been added to this workspace.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add contact' })).toBeInTheDocument();
  });

  it('a failed load is an alert, never a quiet empty list', () => {
    render(<EmptyState tone="error" title="Contacts could not load" reason="The server did not answer." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Contacts could not load');
  });
});

describe('ConfirmationModal — now a real dialog', () => {
  const setup = (type?: 'danger' | 'warning' | 'info') => {
    const onConfirm = vi.fn(); const onCancel = vi.fn();
    render(
      <ConfirmationModal isOpen title="Delete task?" message="This cannot be undone." confirmLabel="Delete"
        type={type} onConfirm={onConfirm} onCancel={onCancel} />,
    );
    return { onConfirm, onCancel };
  };

  it('is announced as a modal dialog by its title', () => {
    setup();
    const dialog = screen.getByRole('dialog', { name: 'Delete task?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('Escape cancels, and the close button has an accessible name', async () => {
    const { onCancel, onConfirm } = setup();
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Close Delete task?' }));
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirm fires onConfirm; a danger confirmation uses the danger button', async () => {
    const { onConfirm } = setup('danger');
    const confirm = screen.getByRole('button', { name: 'Delete' });
    expect(confirm.className).toContain('bg-danger-700');
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders outside the page, so a spacing wrapper cannot offset the backdrop', () => {
    const { container } = render(
      <div className="space-y-6">
        <p>page content</p>
        <ConfirmationModal isOpen title="Delete task?" message="Gone." onConfirm={vi.fn()} onCancel={vi.fn()} />
      </div>,
    );
    // The dialog is in the document but NOT inside the page's wrapper.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders nothing when closed', () => {
    render(<ConfirmationModal isOpen={false} title="X" message="Y" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
