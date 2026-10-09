import React from 'react';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import type { ConnectionState } from '../../utils/healthApi';

/**
 * The sidebar's "Workspace connected" line (Figma "Connection status", under
 * the Data integrity card) — REAL as of Group A item 2. It reflects the last
 * answer from GET /health, which round-trips to Postgres. Nothing renders
 * before the first answer: "connected" is never assumed.
 */
const COPY: Record<ConnectionState, { dot: string; text: string }> = {
  connected:   { dot: 'bg-success-600', text: 'Workspace connected' },
  degraded:    { dot: 'bg-warning-600', text: 'Database not responding — retrying' },
  unreachable: { dot: 'bg-danger-600',  text: 'Cannot reach the server — retrying' },
};

export const ConnectionStatusLine: React.FC<{ state: ConnectionState | null }> = ({ state }) => {
  if (!state) return null;
  const c = COPY[state];
  return (
    <p role="status" aria-live="polite" className="flex items-center gap-2 px-1 py-2 text-xs text-ink-secondary" data-testid="connection-status" data-state={state}>
      <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${c.dot}`} aria-hidden="true" />
      {c.text}
    </p>
  );
};

const ConnectionStatus: React.FC = () => <ConnectionStatusLine state={useConnectionStatus()} />;

export default ConnectionStatus;
