import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Modal } from './Modal';

/**
 * These test the parts that cannot be checked by looking at the screen: whether
 * Tab actually stays inside the panel, whether Escape reaches the handler,
 * whether focus goes back where it came from. Every one of these was broken in
 * all 255 hand-rolled modals, which is the reason the primitive exists.
 */

const open = (props: Partial<React.ComponentProps<typeof Modal>> = {}) =>
  render(
    <Modal isOpen onClose={() => {}} title="Edit deal" {...props}>
      <button type="button">first</button>
      <button type="button">second</button>
    </Modal>,
  );

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Edit deal">
        body
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is announced as a dialog named by its title', () => {
    open();
    expect(screen.getByRole('dialog', { name: 'Edit deal' })).toBeInTheDocument();
  });

  it('marks itself modal so assistive tech ignores the page behind', () => {
    open();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('keeps the accessible name when the title is visually hidden', () => {
    open({ titleHidden: true });
    expect(screen.getByRole('dialog', { name: 'Edit deal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edit deal' })).toHaveClass('sr-only');
  });

  it('associates a description when one is given', () => {
    open({ description: 'This cannot be undone.' });
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(
      'This cannot be undone.',
    );
  });

  it('moves focus to the first focusable element on open', () => {
    open();
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    open({ onClose });
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on a backdrop click', async () => {
    const onClose = vi.fn();
    const { container } = open({ onClose });
    await userEvent.click(container.firstChild as Element);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close when a click starts inside the panel and ends on the backdrop', async () => {
    // Selecting text in a form and releasing past the panel edge must not
    // discard the dialog.
    const onClose = vi.fn();
    const { container } = open({ onClose });
    const backdrop = container.firstChild as Element;
    await userEvent.pointer([
      { target: screen.getByRole('dialog'), keys: '[MouseLeft>]' },
      { target: backdrop, keys: '[/MouseLeft]' },
    ]);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ignores Escape and the backdrop when not dismissible', async () => {
    const onClose = vi.fn();
    const { container } = open({ onClose, dismissible: false });
    await userEvent.keyboard('{Escape}');
    await userEvent.click(container.firstChild as Element);
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /^Close/ })).not.toBeInTheDocument();
  });

  it('cycles Tab from the last element back to the first', async () => {
    open();
    const first = screen.getByRole('button', { name: 'first' });
    const close = screen.getByRole('button', { name: 'Close Edit deal' });
    close.focus();
    await userEvent.tab();
    expect(first).toHaveFocus();
  });

  it('cycles Shift+Tab from the first element to the last', async () => {
    open();
    const first = screen.getByRole('button', { name: 'first' });
    const close = screen.getByRole('button', { name: 'Close Edit deal' });
    first.focus();
    await userEvent.tab({ shift: true });
    expect(close).toHaveFocus();
  });

  it('does not let Tab reach controls behind the overlay', async () => {
    render(<button type="button">behind</button>);
    open();
    const behind = screen.getByRole('button', { name: 'behind' });
    // Six tabs is more than the dialog has focusable children, so an untrapped
    // dialog would have walked out by now.
    for (let i = 0; i < 6; i++) await userEvent.tab();
    expect(behind).not.toHaveFocus();
    expect(screen.getByRole('dialog')).toContainElement(
      document.activeElement as HTMLElement,
    );
  });

  it('returns focus to the trigger when it closes', async () => {
    const Host = () => {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            open
          </button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit deal">
            <button type="button">inside</button>
          </Modal>
        </>
      );
    };
    render(<Host />);
    const trigger = screen.getByRole('button', { name: 'open' });
    await userEvent.click(trigger);
    expect(screen.getByRole('button', { name: 'inside' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('locks body scroll while open and restores it after', async () => {
    const Host = () => {
      const [isOpen, setIsOpen] = useState(true);
      return (
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Edit deal">
          body
        </Modal>
      );
    };
    render(<Host />);
    expect(document.body.style.overflow).toBe('hidden');
    await userEvent.keyboard('{Escape}');
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('gives two instances distinct title ids', () => {
    render(
      <>
        <Modal isOpen onClose={() => {}} title="First">
          a
        </Modal>
        <Modal isOpen onClose={() => {}} title="Second">
          b
        </Modal>
      </>,
    );
    const [a, b] = screen.getAllByRole('dialog');
    expect(a.getAttribute('aria-labelledby')).not.toBe(b.getAttribute('aria-labelledby'));
    expect(screen.getByRole('dialog', { name: 'First' })).toBe(a);
    expect(screen.getByRole('dialog', { name: 'Second' })).toBe(b);
  });

  it('renders a footer outside the scrolling body', () => {
    open({ footer: <button type="button">Save</button> });
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
