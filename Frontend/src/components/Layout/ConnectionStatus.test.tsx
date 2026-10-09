import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

/**
 * Group A item 2 — "Workspace connected" is shown ONLY when GET /health says
 * the database answered; any other answer, or none, never reads as connected.
 */
const fetchMock = vi.fn();
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

const json = (status: number, body: unknown) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

import { checkConnection } from '../../utils/healthApi';
import ConnectionStatus from './ConnectionStatus';

describe('checkConnection', () => {
  it('200 with database.ok -> connected', async () => {
    fetchMock.mockReturnValue(json(200, { status: 'ok', database: { ok: true } }));
    expect(await checkConnection()).toBe('connected');
  });
  it('a 200 WITHOUT a database answer is not connected (an old server, a proxy page)', async () => {
    fetchMock.mockReturnValue(json(200, { status: 'ok' }));
    expect(await checkConnection()).toBe('degraded');
  });
  it('503 -> degraded', async () => {
    fetchMock.mockReturnValue(json(503, { status: 'degraded', database: { ok: false } }));
    expect(await checkConnection()).toBe('degraded');
  });
  it('network failure -> unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    expect(await checkConnection()).toBe('unreachable');
  });
});

describe('ConnectionStatus', () => {
  it('renders nothing before the first answer, then "Workspace connected"', async () => {
    let resolve!: (v: unknown) => void;
    fetchMock.mockReturnValue(new Promise(r => { resolve = r; }));
    render(<ConnectionStatus />);
    expect(screen.queryByTestId('connection-status')).toBeNull();
    await act(async () => { resolve(await json(200, { database: { ok: true } })); });
    expect(await screen.findByText('Workspace connected')).toBeInTheDocument();
  });

  it('a database outage says so and is never labelled connected', async () => {
    fetchMock.mockReturnValue(json(503, { database: { ok: false } }));
    render(<ConnectionStatus />);
    expect(await screen.findByText(/database not responding/i)).toBeInTheDocument();
    expect(screen.queryByText(/workspace connected/i)).toBeNull();
  });

  it('polls: a later failure replaces "connected" (it is not sticky)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fetchMock.mockReturnValueOnce(json(200, { database: { ok: true } }))
             .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    render(<ConnectionStatus />);
    expect(await screen.findByText('Workspace connected')).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(await screen.findByText(/cannot reach the server/i)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
