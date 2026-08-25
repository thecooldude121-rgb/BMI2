import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Catches render errors so one broken component does not blank the entire app.
 *
 * There was no boundary anywhere in this codebase. A single thrown error in any
 * render — a null dereference on an unexpected API shape, say — unmounted the
 * whole tree and left a blank white page with the real cause visible only in the
 * console. Given how much of this app was recently rewired from fixtures to real
 * data, that is exactly the failure mode to expect.
 *
 * Error boundaries only catch errors thrown during RENDER, lifecycle methods and
 * constructors. They do NOT catch errors in event handlers, async callbacks or
 * promise rejections — those need their own try/catch, which is why the API
 * clients throw and the pages catch rather than relying on this.
 */

interface Props {
  children: React.ReactNode;
  /** Shown instead of the default panel. Receives a reset callback. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** Changing this resets the boundary — pass the route key so navigating away recovers. */
  resetKey?: string;
  /** Where the failure happened, for the log line. */
  label?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // The component stack is the useful part — it names the component that threw,
    // which the message alone usually does not.
    console.error(
      `[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`,
      error,
      info.componentStack,
    );
  }

  componentDidUpdate(prev: Props): void {
    // Recover on navigation: without this, a route that threw once stays broken
    // until a full reload even after the user navigates elsewhere.
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  private reset = (): void => this.setState({ error: null });

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
        <div className="max-w-lg text-center">
          <AlertTriangle className="mx-auto h-9 w-9 text-red-500" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-semibold text-gray-900">Something went wrong on this page</h1>
          <p className="mt-2 text-sm text-gray-600">
            The rest of the app is still working — you can go back or try again. Nothing you
            were doing has been saved.
          </p>

          {/* The message is shown in development only: it can carry internal
              detail, and in production it is not actionable for the user. */}
          {import.meta.env.DEV && (
            <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-gray-900 p-3 text-left text-xs text-gray-100">
              {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={this.reset}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
            <button
              onClick={() => window.history.back()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
