import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import {
  AlertCircle, AlertTriangle, ArrowDown, ArrowUp, Check, Plus, RotateCcw, Trash2, X,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  fetchPipelines, fetchPalette, createStage, updateStage, reorderStages, deleteStage,
  defaultPipeline, type ApiPipeline, type ApiStage, type PaletteColor,
} from '../../../utils/pipelinesApi';

/**
 * Deal stages — the screen that makes pipeline stages configurable.
 *
 * WHAT WAS HERE. 349 lines over a hardcoded `useState` of five stages
 * ("PROSPECTING 10%, 7 avg days", …) with Save, Add Stage and reorder buttons
 * that changed local state and nothing else. It also had an `avgDays` column
 * that has no column anywhere in the database — an invented number presented
 * beside two real ones.
 *
 * Everything here now goes to `/api/v1/pipelines/:id/stages`, which is admin-
 * only server-side (design Q5). Phase A made stages real rows and Phase B taught
 * every screen to read them; this is the piece that lets a workspace change
 * them, which is the feature as originally scoped.
 *
 * FOUR THINGS THIS SCREEN IS DELIBERATE ABOUT:
 *
 *  - RENAMING NEVER MOVES THE SLUG. The slug is what `deals.stage` holds and
 *    what saved views filter on, so a rename that changed it would silently
 *    empty every view referencing the stage. The slug is shown, read-only, so
 *    an admin can see that renaming is safe rather than having to trust it.
 *  - THE PALETTE IS FETCHED, NOT HARDCODED (design Q4). Green and red mean won
 *    and lost; the server refuses them on an open stage and this screen does not
 *    offer them there. A second copy of the list here could only drift.
 *  - RETIRE IS THE PROMINENT ACTION AND DELETE IS NOT. Retiring keeps the deals
 *    where they are and stops new ones arriving; deleting is for a stage created
 *    by mistake and blocks while deals are in it.
 *  - EVERY REFUSAL IS SHOWN IN THE SERVER'S OWN WORDS. "A pipeline must keep at
 *    least one won stage" and "3 deals are still in Proposal" are both
 *    actionable; "Save failed" is not.
 */

const TYPE_LABEL: Record<ApiStage['stage_type'], string> = {
  open: 'Open', won: 'Won', lost: 'Lost',
};

const PipelineSettings: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [pipelines, setPipelines] = useState<ApiPipeline[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [palette, setPalette] = useState<PaletteColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; probability: string; color: string }>({
    name: '', probability: '', color: '',
  });
  const [adding, setAdding] = useState(false);
  const [newStage, setNewStage] = useState({ name: '', stage_type: 'open' as ApiStage['stage_type'], probability: '', color: '' });
  const [deleting, setDeleting] = useState<ApiStage | null>(null);
  const [reassignTo, setReassignTo] = useState<string>('');

  const active = useMemo(
    () => pipelines.find(p => p.slug === activeSlug) ?? null,
    [pipelines, activeSlug],
  );
  /** Retired stages are included so an admin can see and un-retire them. */
  const stages = active?.stages ?? [];

  const reload = useCallback(async (keepSlug?: string | null) => {
    const list = await fetchPipelines(true);
    setPipelines(list);
    setActiveSlug(prev => keepSlug ?? prev ?? defaultPipeline(list)?.slug ?? null);
    return list;
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchPipelines(true), fetchPalette()])
      .then(([list, colors]) => {
        if (cancelled) return;
        setPipelines(list);
        setPalette(colors);
        setActiveSlug(defaultPipeline(list)?.slug ?? null);
        setLoadError(null);
      })
      .catch((e: Error) => { if (!cancelled) setLoadError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  /** Every write funnels through here so no path can report a success it did not make. */
  const run = async (fn: () => Promise<unknown>, successMessage: string) => {
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await fn();
      await reload(activeSlug);
      setNotice(successMessage);
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const colorsFor = (type: ApiStage['stage_type']) =>
    palette.filter(c => (type === 'open' ? !c.outcome_only : true));

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Deal Stages</h2>
        <p className="mt-6 text-sm text-gray-500">Loading your pipeline stages…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Deal Stages</h2>
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-medium text-red-900">Could not load your pipeline stages</p>
            <p className="mt-1 text-sm text-red-800">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Deal Stages</h2>
        <p className="mt-1 text-sm text-gray-600">
          The stages deals move through, as this workspace has configured them.
        </p>
      </div>

      {!isAdmin && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
          <p className="text-sm text-gray-700">
            You can see how stages are configured, but only an admin can change them.
          </p>
        </div>
      )}

      {pipelines.length > 1 && (
        <div className="mb-5 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Pipeline</span>
          {pipelines.map(p => (
            <button
              key={p.slug}
              onClick={() => { setActiveSlug(p.slug); setEditingId(null); setAdding(false); setActionError(null); setNotice(null); }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                p.slug === activeSlug ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {actionError && (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          {/* The server's words, verbatim. Every refusal it produces is actionable. */}
          <p className="text-sm text-red-800">{actionError}</p>
        </div>
      )}
      {notice && (
        <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="grid grid-cols-[2.5rem_1fr_7rem_6rem_5rem_auto] items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-medium uppercase text-gray-500">
          <span>#</span><span>Stage</span><span>Type</span><span>Probability</span><span>Colour</span><span />
        </div>

        {stages.map((st, i) => {
          const isEditing = editingId === st.id;
          const retired = Boolean(st.archived_at);
          return (
            <div
              key={st.id}
              className={`grid grid-cols-[2.5rem_1fr_7rem_6rem_5rem_auto] items-center gap-3 border-b border-gray-100 px-4 py-3 ${
                retired ? 'bg-gray-50' : ''
              }`}
            >
              <span className="text-sm text-gray-400">{i + 1}</span>

              <div className="min-w-0">
                {isEditing ? (
                  <input
                    aria-label="Stage name"
                    value={draft.name}
                    maxLength={100}
                    onChange={e => setDraft({ ...draft, name: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={`truncate text-sm font-medium ${retired ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                      {st.name}
                    </span>
                    {retired && (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                        Retired
                      </span>
                    )}
                  </div>
                )}
                {/* THE SLUG IS SHOWN AND IS NEVER EDITABLE. Renaming is safe
                    precisely because this does not move, and an admin should be
                    able to see that rather than take it on trust. */}
                <code className="text-[11px] text-gray-400">{st.slug}</code>
              </div>

              <span className={`text-xs font-medium ${
                st.stage_type === 'won' ? 'text-emerald-700'
                : st.stage_type === 'lost' ? 'text-red-700' : 'text-gray-600'
              }`}>
                {TYPE_LABEL[st.stage_type]}
              </span>

              {isEditing ? (
                <input
                  aria-label="Probability"
                  type="number" min={0} max={100}
                  value={draft.probability}
                  onChange={e => setDraft({ ...draft, probability: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
                  placeholder="Not set"
                />
              ) : (
                // NULL means "not set", never 0 — 0 is a claim about the odds.
                <span className="text-sm text-gray-700">
                  {st.probability === null ? <span className="text-gray-400">Not set</span> : `${st.probability}%`}
                </span>
              )}

              {isEditing ? (
                <div className="flex flex-wrap gap-1">
                  {colorsFor(st.stage_type).map(c => (
                    <button
                      key={c.hex}
                      title={c.name}
                      aria-label={`Colour ${c.name}`}
                      onClick={() => setDraft({ ...draft, color: c.hex })}
                      className={`h-5 w-5 rounded-full ${draft.color === c.hex ? 'ring-2 ring-offset-1 ring-gray-800' : ''}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              ) : (
                <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: st.color ?? '#6B7280' }} />
              )}

              <div className="flex items-center justify-end gap-1">
                {isEditing ? (
                  <>
                    <button
                      title="Save"
                      disabled={busy}
                      onClick={() => run(
                        () => updateStage(active!.id, st.id, {
                          name: draft.name.trim(),
                          probability: draft.probability === '' ? null : Number(draft.probability),
                          color: draft.color || undefined,
                        }),
                        `"${draft.name.trim()}" saved.`,
                      ).then(() => setEditingId(null))}
                      className="rounded p-1.5 text-green-700 hover:bg-green-50 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button title="Cancel" onClick={() => setEditingId(null)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : isAdmin ? (
                  <>
                    <button
                      title="Move up" disabled={busy || i === 0}
                      onClick={() => {
                        const ids = stages.map(s => s.id);
                        [ids[i - 1], ids[i]] = [ids[i], ids[i - 1]];
                        run(() => reorderStages(active!.id, ids), 'Order saved.');
                      }}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      title="Move down" disabled={busy || i === stages.length - 1}
                      onClick={() => {
                        const ids = stages.map(s => s.id);
                        [ids[i], ids[i + 1]] = [ids[i + 1], ids[i]];
                        run(() => reorderStages(active!.id, ids), 'Order saved.');
                      }}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(st.id);
                        setDraft({
                          name: st.name,
                          probability: st.probability === null ? '' : String(st.probability),
                          color: st.color ?? '',
                        });
                      }}
                      className="rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                    >
                      Edit
                    </button>
                    {/* RETIRE IS THE PROMINENT ACTION. It keeps the deals where
                        they are — nothing orphaned, no reference nulled. */}
                    <button
                      disabled={busy}
                      onClick={() => run(
                        () => updateStage(active!.id, st.id, { archived: !retired }),
                        retired ? `"${st.name}" is active again.` : `"${st.name}" retired. Deals already in it stay put.`,
                      )}
                      className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {retired ? <RotateCcw className="h-3.5 w-3.5" /> : 'Retire'}
                    </button>
                    <button
                      title="Delete" disabled={busy}
                      onClick={() => { setDeleting(st); setReassignTo(''); setActionError(null); }}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}

        {adding && (
          <div className="grid grid-cols-[2.5rem_1fr_7rem_6rem_5rem_auto] items-center gap-3 border-b border-gray-100 bg-brand-50/40 px-4 py-3">
            <span className="text-sm text-gray-400">{stages.length + 1}</span>
            <input
              aria-label="New stage name"
              autoFocus
              value={newStage.name}
              maxLength={100}
              placeholder="Stage name"
              onChange={e => setNewStage({ ...newStage, name: e.target.value })}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <select
              aria-label="New stage type"
              value={newStage.stage_type}
              onChange={e => setNewStage({ ...newStage, stage_type: e.target.value as ApiStage['stage_type'], color: '' })}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="open">Open</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <input
              aria-label="New stage probability"
              type="number" min={0} max={100}
              value={newStage.probability}
              placeholder="Not set"
              onChange={e => setNewStage({ ...newStage, probability: e.target.value })}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <div className="flex flex-wrap gap-1">
              {colorsFor(newStage.stage_type).map(c => (
                <button
                  key={c.hex} title={c.name} aria-label={`Colour ${c.name}`}
                  onClick={() => setNewStage({ ...newStage, color: c.hex })}
                  className={`h-5 w-5 rounded-full ${newStage.color === c.hex ? 'ring-2 ring-offset-1 ring-gray-800' : ''}`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-1">
              <button
                disabled={busy || !newStage.name.trim()}
                onClick={() => run(
                  () => createStage(active!.id, {
                    name: newStage.name.trim(),
                    stage_type: newStage.stage_type,
                    probability: newStage.probability === '' ? null : Number(newStage.probability),
                    color: newStage.color || undefined,
                  }),
                  `"${newStage.name.trim()}" added.`,
                ).then(() => { setAdding(false); setNewStage({ name: '', stage_type: 'open', probability: '', color: '' }); })}
                className="rounded p-1.5 text-green-700 hover:bg-green-50 disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => setAdding(false)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isAdmin && !adding && (
        <Button onClick={() => { setAdding(true); setActionError(null); setNotice(null); }} className="mt-4">
          <Plus className="h-4 w-4" />
          Add Stage
        </Button>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Delete “{deleting.name}”?</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Deleting removes the stage for good. If any deals are still in it the server will
                  refuse — <strong>retiring</strong> is usually what you want: it keeps those deals
                  where they are and just stops new ones arriving.
                </p>
              </div>
            </div>

            <label className="mt-4 block text-sm font-medium text-gray-700">
              If deals are in it, move them to
              <select
                aria-label="Reassign deals to"
                value={reassignTo}
                onChange={e => setReassignTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Don’t move anything — refuse if deals are present</option>
                {stages
                  .filter(s => s.id !== deleting.id && !s.archived_at)
                  .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            {actionError && (
              <p role="alert" className="mt-3 text-sm text-red-700">{actionError}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => { setDeleting(null); setActionError(null); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true); setActionError(null);
                  try {
                    const r = await deleteStage(active!.id, deleting.id, reassignTo || undefined);
                    await reload(activeSlug);
                    setDeleting(null);
                    setNotice(r.message);
                  } catch (e) {
                    // Stays open on a 409 so the reassignment can be chosen
                    // without losing the dialog.
                    setActionError((e as Error).message);
                  } finally { setBusy(false); }
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? 'Deleting…' : 'Delete stage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineSettings;
