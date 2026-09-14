import React, { useCallback, useEffect, useState } from 'react';
import { Link2, Copy, Check, AlertCircle, RefreshCw, Unlink, Clock } from 'lucide-react';
import {
  fetchModuleLinkStatus, createLeadGenSetupCode, disconnectLeadGen,
  type ModuleLinkStatus, type SetupCode,
} from '../../../utils/moduleLinksApi';
import { formatDisplayDate } from '../../../utils/dateUtils';

/**
 * Connected Modules — today, Lead Gen.
 *
 * DELIBERATELY NOT PART OF Settings > Integrations. That screen is a grid of
 * hardcoded sample connections (Slack, Stripe, SendGrid) with no API behind it.
 * Putting a real, working link next to fabricated ones would make it impossible
 * for an admin to tell which of the two they were looking at.
 *
 * THE HANDSHAKE, from this side: generate a code, paste it into Lead Gen, and
 * Lead Gen calls back with its credential. The key is never typed in here,
 * because it is issued over there — asking an admin to copy a secret out of one
 * console and into another is an extra place for it to be captured.
 *
 * The code is shown ONCE. Only its hash is stored, so this screen genuinely
 * cannot show it again, and says so rather than implying it could be recovered.
 */
const ConnectedModules: React.FC = () => {
  const [status, setStatus] = useState<ModuleLinkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [issued, setIssued] = useState<SetupCode | null>(null);
  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await fetchModuleLinkStatus());
      setError(null);
    } catch (e: any) {
      // Surfaced, never swallowed into a "not connected" state — see the note
      // in moduleLinksApi.
      setError(e?.message ?? 'Could not load module links');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const generate = async () => {
    setWorking(true);
    setActionError(null);
    try {
      setIssued(await createLeadGenSetupCode());
      setCopied(false);
      await load();
    } catch (e: any) {
      setActionError(e?.message ?? 'Could not create a setup code');
    } finally {
      setWorking(false);
    }
  };

  const disconnect = async () => {
    setWorking(true);
    setActionError(null);
    try {
      await disconnectLeadGen();
      setIssued(null);
      setConfirmingDisconnect(false);
      await load();
    } catch (e: any) {
      setActionError(e?.message ?? 'Could not disconnect');
    } finally {
      setWorking(false);
    }
  };

  const copy = async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.setup_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the code is on screen to select by hand.
      setActionError('Could not copy automatically — select the code and copy it.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-4" />
        <div className="h-24 bg-gray-50 rounded animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Could not load connected modules</p>
            <p className="mt-1">{error}</p>
            <button onClick={() => void load()} className="mt-2 text-red-800 underline">Try again</button>
          </div>
        </div>
      </div>
    );
  }

  const connected = Boolean(status?.connected);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Link2 className="h-5 w-5 text-indigo-600" />
          Connected Modules
        </h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Sibling platforms this workspace exchanges data with over HTTP. Each keeps
        its own database; nothing is shared directly.
      </p>

      <div className="border border-gray-200 rounded-lg p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-semibold text-gray-900">Lead Gen</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Account intelligence — hiring, funding, tech changes, exec moves and
              news — shown on account pages.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              connected ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
            {connected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        {connected && (
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Connected since</dt>
              <dd className="text-gray-900">
                {status?.connected_since ? formatDisplayDate(status.connected_since) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Lead Gen URL</dt>
              <dd className="text-gray-900 break-all">{status?.base_url ?? '—'}</dd>
            </div>
            {status?.linked_by_name && (
              <div>
                <dt className="text-gray-500">Connected by</dt>
                <dd className="text-gray-900">{status.linked_by_name}</dd>
              </div>
            )}
            {status?.last_verify_error && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Last error</dt>
                <dd className="text-red-700">{status.last_verify_error}</dd>
              </div>
            )}
          </dl>
        )}

        {actionError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {/* The code, shown once. */}
        {issued && (
          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm font-medium text-indigo-900">
              Paste this setup code into Lead Gen
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <code className="flex-1 min-w-0 bg-white border border-indigo-200 rounded px-3 py-2 text-sm font-mono text-gray-900 break-all">
                {issued.setup_code}
              </code>
              <button
                onClick={() => void copy()}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-2 text-xs text-indigo-800 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Expires in {issued.expires_in_minutes} minutes, and works once.
            </p>
            {/* Honest about what this screen can and cannot do afterwards. */}
            <p className="mt-1 text-xs text-indigo-700">
              Only a hash of this code is stored, so it cannot be shown again.
              Generate a new one if you lose it — that revokes this one.
            </p>
            <p className="mt-2 text-xs text-indigo-700 break-all">
              Lead Gen should send it to <span className="font-mono">{issued.redeem_url}</span>
            </p>
          </div>
        )}

        {/* An outstanding code from an earlier visit. The code itself is gone. */}
        {!issued && status?.pending_setup_code && !connected && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
            A setup code is outstanding, expiring{' '}
            {formatDisplayDate(status.pending_setup_code.expires_at)}. It was shown
            once and cannot be displayed again — generate a new one if you no
            longer have it.
          </div>
        )}

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <button
            onClick={() => void generate()}
            disabled={working}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${working ? 'animate-spin' : ''}`} />
            {status?.pending_setup_code || issued ? 'Generate a new setup code' : 'Generate setup code'}
          </button>

          {connected && !confirmingDisconnect && (
            <button
              onClick={() => setConfirmingDisconnect(true)}
              disabled={working}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <Unlink className="h-4 w-4" />
              Disconnect
            </button>
          )}

          {confirmingDisconnect && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-700">
                Disconnect Lead Gen? Account intelligence stops showing on account pages.
              </span>
              <button
                onClick={() => void disconnect()}
                disabled={working}
                className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Disconnect
              </button>
              <button
                onClick={() => setConfirmingDisconnect(false)}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectedModules;
