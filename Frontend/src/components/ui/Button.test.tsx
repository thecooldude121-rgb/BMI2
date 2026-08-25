import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

/**
 * The first render tests in this repository.
 *
 * There were zero component tests across 487 .tsx files, which is why a
 * design-system codemod across 300+ call sites had no safety net. These pin the
 * behaviour the codemod will depend on — particularly the accessibility
 * properties, which are the easiest thing to silently regress.
 */
describe('Button', () => {
  it('renders its label and defaults to type="button"', () => {
    render(<Button>Save deal</Button>);
    const btn = screen.getByRole('button', { name: 'Save deal' });
    // The native default is 'submit', which submits any enclosing form by
    // accident. Every one of the 326 hand-written buttons relied on remembering
    // to set this.
    expect(btn).toHaveAttribute('type', 'button');
  });

  it('can still submit a form when asked', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('calls onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe('disabled', () => {
    it('sets both disabled and aria-disabled', () => {
      render(<Button disabled>Nope</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      // aria-disabled as well as disabled: `disabled` alone drops the button
      // out of the tab order, so a screen-reader user never finds it.
      expect(btn).toHaveAttribute('aria-disabled', 'true');
    });

    it('does not fire onClick', async () => {
      const onClick = vi.fn();
      render(<Button disabled onClick={onClick}>Nope</Button>);
      await userEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('loading', () => {
    it('marks itself busy and blocks the click', async () => {
      const onClick = vi.fn();
      render(<Button loading onClick={onClick}>Saving</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('aria-busy', 'true');
      expect(btn).toBeDisabled();
      // The point of blocking: a double-submit while a request is in flight is
      // how duplicate deals got created in this app.
      await userEvent.click(btn);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('keeps the label readable while loading', () => {
      render(<Button loading>Saving</Button>);
      expect(screen.getByRole('button', { name: 'Saving' })).toBeInTheDocument();
    });
  });

  describe('accessible naming', () => {
    it('an icon-only button is named by its aria-label', () => {
      render(
        <Button iconOnly aria-label="Delete deal" leadingIcon={<svg data-testid="icon" />} />,
      );
      // Without this the button is announced as just "button" — the state 157
      // aria-labels across 4,320 buttons leaves most of this app in.
      expect(screen.getByRole('button', { name: 'Delete deal' })).toBeInTheDocument();
    });

    it('hides decorative icons from assistive tech', () => {
      render(<Button leadingIcon={<svg data-testid="icon" />}>Add contact</Button>);
      // The label carries the meaning; the icon repeating it is noise.
      expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
      expect(screen.getByRole('button')).toHaveAccessibleName('Add contact');
    });
  });

  describe('styling contract the codemod relies on', () => {
    it('applies the variant and size tokens', () => {
      render(<Button variant="danger" size="lg">Delete</Button>);
      const cls = screen.getByRole('button').className;
      expect(cls).toContain('bg-danger-600');
      expect(cls).toContain('px-6');
    });

    it('fullWidth replaces the flex-1 idiom', () => {
      render(<Button fullWidth>Wide</Button>);
      expect(screen.getByRole('button').className).toContain('w-full');
    });

    it('a call-site className still wins, so migration can be incremental', () => {
      render(<Button className="mt-4 custom-thing">X</Button>);
      const cls = screen.getByRole('button').className;
      expect(cls).toContain('custom-thing');
      // Base classes survive alongside it rather than being replaced.
      expect(cls).toContain('bg-brand-600');
    });

    it('always carries a visible focus ring', () => {
      render(<Button>Focus me</Button>);
      expect(screen.getByRole('button').className).toContain('focus-visible:ring-2');
    });
  });

  it('forwards a ref to the underlying button', () => {
    let node: HTMLButtonElement | null = null;
    render(<Button ref={el => { node = el; }}>Ref</Button>);
    expect(node).toBeInstanceOf(HTMLButtonElement);
  });
});
