import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import {
  fetchTargets, saveQuota, saveProfile, quarterLabelFor, shiftQuarter,
  activityLabel, seniorityLabel,
  type TargetRow, type TargetsRoster, type SalesProfile,
} from '../../../utils/targetsApi';
import { updateWorkspace, CURRENCY_OPTIONS } from '../../../utils/workspaceApi';

/**
 * Settings → Sales Targets (migration 044).
 *
 * Per person, per calendar quarter: revenue quota and its currency, weekly
 * activity targets; and per person: seniority, ramp start, territory, product
 * line. Every rule is SERVED with the roster — who may edit whom (`can_edit`),
 * which seniority levels and activity targets exist, whether people may set
 * their own, and whether THIS viewer may change that. The page renders them;
 * it decides none of them.
 *
 * Role is shown but NOT editable here. It has its own guarded endpoint (four
 * guards, PATCH /users/:id/role) and its own screen in Team Management; a
 * second place to change it would be a second place for the guards to be
 * missing.
 *
 * The pipeline projection computed from these targets (GET /targets/projection)
 * has no screen yet — that is the Sales Intelligence Guide, later work — and
 * this page does not preview it.
 */

const ROLE_LABELS: Record<string, string> = { sales: 'Sales', manager: 'Manager', admin: 'Admin' };
const roleLabel = (r: string) => ROLE_LABELS[(r ?? '').toLowerCase()] ?? r;

const money = (amount: number, currency: string) =>
  `${currency} ${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

interface Draft {
  quota_amount: string;
  currency: string;
  activity: Record<string, string>;
  seniority: string;
  ramp_start_date: string;
  territory: string;
  product_line: string;
}

function draftFor(row: TargetRow, keys: string[], fallbackCurrency: string): Draft {
  const activity: Record<string, string> = {};
  for (const k of keys) {
    const v = row.quota?.activity_targets?.[k];
    activity[k] = v === undefined || v === null ? '' : String(v);
  }
  return {
    quota_amount: row.quota ? String(row.quota.quota_amount) : '',
    currency: row.quota?.currency ?? fallbackCurrency,
    activity,
    seniority: row.profile?.seniority ?? '',
    ramp_start_date: row.profile?.ramp_start_date ?? '',
    territory: row.profile?.territory ?? '',
    product_line: row.profile?.product_line ?? '',
  };
}

const inputClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const TargetsSettings: React.FC = () => {
  const [period, setPeriod] = useState(() => quarterLabelFor(new Date()));
  const [roster, setRoster] = useState<TargetsRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedFor, setSavedFor] = useState<number | null>(null);

  const [toggleSaving, setToggleSaving] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const load = useCallback(async (p: string) => {
    setLoading(true);
    setLoadError(null);
    try {
      setRoster(await fetchTargets(p));
    } catch (e) {
      setRoster(null);
      setLoadError(e instanceof Error ? e.message : 'Could not load targets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(period); }, [load, period]);

  const editRow = roster?.rows.find(r => r.user_id === editing) ?? null;
  // A new quota starts in the currency the rest of this row already uses, or
  // USD — the same fallback the server applies when the workspace has none.
  const original = editRow && roster ? draftFor(editRow, roster.activityTargetKeys, 'USD') : null;

  const startEdit = (row: TargetRow) => {
    if (!roster) return;
    setEditing(row.user_id);
    setDraft(draftFor(row, roster.activityTargetKeys, 'USD'));
    setSaveError(null);
    setSavedFor(null);
  };
  const cancelEdit = () => { setEditing(null); setDraft(null); setSaveError(null); };

  const quotaChanged = !!(draft && original) && (
    draft.quota_amount !== original.quota_amount
    || (draft.quota_amount !== '' && draft.currency !== original.currency)
    || Object.keys(draft.activity).some(k => draft.activity[k] !== original.activity[k])
  );
  const profileFields = (['seniority', 'ramp_start_date', 'territory', 'product_line'] as const)
    .filter(f => draft && original && draft[f] !== original[f]);
  const dirty = quotaChanged || profileFields.length > 0;

  const handleSave = async () => {
    if (!draft || !editRow || !roster) return;
    setSaveError(null);

    const activityChanged = Object.keys(draft.activity).some(k => draft.activity[k] !== original?.activity[k]);
    if (quotaChanged && draft.quota_amount.trim() === '') {
      // Not a permission rule — a shape one. Activity targets are stored ON the
      // quarter's quota row, so there is no row to hold them without an amount.
      setSaveError(editRow.quota
        ? 'A quota cannot be removed from here. Enter an amount (0 is allowed).'
        : `Activity targets are stored with the quota for ${roster.periodLabel}. Enter a quota amount (0 is allowed) to save them.`);
      return;
    }

    setSaving(true);
    try {
      if (quotaChanged) {
        const activity_targets: Record<string, number | null> = {};
        for (const k of roster.activityTargetKeys) {
          const v = draft.activity[k].trim();
          // Blank CLEARS the target (null), rather than storing a zero that
          // would read as "the target is zero calls".
          activity_targets[k] = v === '' ? null : Number(v);
        }
        await saveQuota({
          user_id: editRow.user_id,
          period_label: roster.periodLabel,
          quota_amount: Number(draft.quota_amount),
          currency: draft.currency,
          ...(activityChanged ? { activity_targets } : {}),
        });
      }
      if (profileFields.length) {
        const fields: Partial<Record<keyof SalesProfile, string | null>> = {};
        for (const f of profileFields) fields[f] = draft[f].trim() === '' ? null : draft[f].trim();
        await saveProfile(editRow.user_id, fields);
      }
      // Render what the SERVER now holds, not what was typed: a normalised or
      // refused value must be visible, never silently diverge.
      const saved = editRow.user_id;
      await load(period);
      setEditing(null);
      setDraft(null);
      setSavedFor(saved);
    } catch (e) {
      // The server's words verbatim — "You can set targets only for people who
      // report directly to you.", "ramp_start_date must fall between…".
      setSaveError(e instanceof Error ? e.message : 'Could not save targets');
      // A quota may have saved before a profile write failed; reload so the
      // table shows what actually stuck.
      await load(period).catch(() => {});
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (on: boolean) => {
    setToggleSaving(true);
    setToggleError(null);
    try {
      await updateWorkspace({ reps_set_own_targets: on });
      await load(period);   // can_edit flags change with it
    } catch (e) {
      setToggleError(e instanceof Error ? e.message : 'Could not change the setting');
    } finally {
      setToggleSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Sales Targets</h2>
        <p className="text-sm text-gray-600 mt-1">
          Quotas and weekly activity targets by quarter, and each person&apos;s sales profile.
          Managers set targets for their direct reports; admins for anyone.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-6" role="group" aria-label="Quarter">
        <button
          type="button"
          onClick={() => setPeriod(p => shiftQuarter(p, -1))}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Previous quarter"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="min-w-[6rem] text-center text-sm font-semibold text-gray-900" aria-live="polite">{period}</span>
        <button
          type="button"
          onClick={() => setPeriod(p => shiftQuarter(p, 1))}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Next quarter"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {loading && <p className="text-sm text-gray-600" role="status">Loading targets…</p>}

      {loadError && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-red-800">{loadError}</p>
        </div>
      )}

      {!loading && roster && (
        <>
          <div className="mb-6 rounded-lg border border-gray-200 p-4">
            {roster.canChangeSelfService ? (
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={roster.repsSetOwnTargets}
                  disabled={toggleSaving}
                  onChange={(e) => void handleToggle(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">Let people set their own targets</span>
                  <span className="block text-xs text-gray-500">
                    Off by default. When on, anyone can set their own quota, activity targets and
                    profile — including managers, for themselves.
                  </span>
                </span>
              </label>
            ) : (
              <p className="text-sm text-gray-700">
                People {roster.repsSetOwnTargets ? 'can' : 'cannot'} set their own targets in this
                workspace. A manager or admin can change that.
              </p>
            )}
            {toggleError && <p role="alert" className="mt-2 text-sm text-red-700">{toggleError}</p>}
          </div>

          {roster.rows.length === 0 ? (
            <p className="text-sm text-gray-600">This workspace has no active people.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Person</th>
                    <th scope="col" className="px-4 py-3">Reports to</th>
                    <th scope="col" className="px-4 py-3">Profile</th>
                    <th scope="col" className="px-4 py-3">Quota · {roster.periodLabel}</th>
                    <th scope="col" className="px-4 py-3">Activity targets</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {roster.rows.map(row => {
                    const targets = Object.entries(row.quota?.activity_targets ?? {});
                    return (
                      <React.Fragment key={row.user_id}>
                        <tr data-testid={`target-row-${row.user_id}`}>
                          <td className="px-4 py-3 align-top">
                            <div className="font-medium text-gray-900">{row.name}</div>
                            <div className="text-xs text-gray-500">{roleLabel(row.role)} · {row.email}</div>
                          </td>
                          <td className="px-4 py-3 align-top text-gray-700">
                            {row.manager_name ?? <span className="italic text-gray-400">No manager recorded</span>}
                          </td>
                          <td className="px-4 py-3 align-top text-gray-700">
                            {row.profile ? (
                              <dl className="space-y-0.5 text-xs">
                                <div>{row.profile.seniority ? seniorityLabel(row.profile.seniority) : <span className="italic text-gray-400">Seniority not set</span>}</div>
                                <div>{row.profile.ramp_start_date ? `Ramp from ${row.profile.ramp_start_date}` : <span className="italic text-gray-400">No ramp date</span>}</div>
                                <div>{row.profile.territory ?? <span className="italic text-gray-400">No territory</span>}</div>
                                <div>{row.profile.product_line ?? <span className="italic text-gray-400">No product line</span>}</div>
                              </dl>
                            ) : <span className="italic text-gray-400">Not recorded</span>}
                          </td>
                          <td className="px-4 py-3 align-top text-gray-900">
                            {row.quota
                              ? money(row.quota.quota_amount, row.quota.currency)
                              : <span className="italic text-gray-400">Not set</span>}
                          </td>
                          <td className="px-4 py-3 align-top text-xs text-gray-700">
                            {targets.length
                              ? targets.map(([k, v]) => <div key={k}>{activityLabel(k)}: {v}</div>)
                              : <span className="italic text-gray-400">None set</span>}
                          </td>
                          <td className="px-4 py-3 align-top text-right">
                            {/* No control at all where the server said no — a
                                disabled one advertises an action that does
                                not exist for this viewer. */}
                            {row.can_edit && editing !== row.user_id && (
                              <button
                                type="button"
                                onClick={() => startEdit(row)}
                                className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label={`Edit targets for ${row.name}`}
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                              </button>
                            )}
                            {savedFor === row.user_id && editing === null && (
                              <span role="status" className="inline-flex items-center gap-1 text-xs text-success-700">
                                <Check className="h-3.5 w-3.5" aria-hidden="true" /> Saved
                              </span>
                            )}
                          </td>
                        </tr>

                        {editing === row.user_id && draft && (
                          <tr>
                            <td colSpan={6} className="bg-gray-50 px-4 py-4">
                              <form
                                aria-label={`Targets for ${row.name}`}
                                onSubmit={(e) => { e.preventDefault(); void handleSave(); }}
                                className="grid grid-cols-1 gap-4 md:grid-cols-3"
                              >
                                <div>
                                  <label htmlFor="t-quota" className="block text-xs font-medium text-gray-700 mb-1">
                                    Quota for {roster.periodLabel}
                                  </label>
                                  <input id="t-quota" type="number" min={0} step="any" inputMode="decimal"
                                    value={draft.quota_amount}
                                    onChange={(e) => setDraft({ ...draft, quota_amount: e.target.value })}
                                    className={inputClass} placeholder="Not set" />
                                </div>
                                <div>
                                  <label htmlFor="t-currency" className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                                  <select id="t-currency" value={draft.currency}
                                    onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                                    className={inputClass}>
                                    {CURRENCY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                    {!CURRENCY_OPTIONS.some(c => c.code === draft.currency) && (
                                      <option value={draft.currency}>{draft.currency}</option>
                                    )}
                                  </select>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Only deals in this currency count toward it. Nothing is converted.
                                  </p>
                                </div>
                                <div />

                                {roster.activityTargetKeys.map(k => (
                                  <div key={k}>
                                    <label htmlFor={`t-act-${k}`} className="block text-xs font-medium text-gray-700 mb-1">
                                      {activityLabel(k)}
                                    </label>
                                    <input id={`t-act-${k}`} type="number" min={0} step={1}
                                      max={roster.activityTargetMax ?? undefined}
                                      value={draft.activity[k]}
                                      onChange={(e) => setDraft({ ...draft, activity: { ...draft.activity, [k]: e.target.value } })}
                                      className={inputClass} placeholder="Not set" />
                                  </div>
                                ))}

                                <div>
                                  <label htmlFor="t-seniority" className="block text-xs font-medium text-gray-700 mb-1">Seniority</label>
                                  <select id="t-seniority" value={draft.seniority}
                                    onChange={(e) => setDraft({ ...draft, seniority: e.target.value })}
                                    className={inputClass}>
                                    <option value="">Not set</option>
                                    {roster.seniorityLevels.map(l => <option key={l} value={l}>{seniorityLabel(l)}</option>)}
                                  </select>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Experience, not permissions. Role is changed in Team Management.
                                  </p>
                                </div>
                                <div>
                                  <label htmlFor="t-ramp" className="block text-xs font-medium text-gray-700 mb-1">Ramp start date</label>
                                  <input id="t-ramp" type="date" min="2000-01-01" max="2100-12-31"
                                    value={draft.ramp_start_date}
                                    onChange={(e) => setDraft({ ...draft, ramp_start_date: e.target.value })}
                                    className={inputClass} />
                                </div>
                                <div />
                                <div>
                                  <label htmlFor="t-territory" className="block text-xs font-medium text-gray-700 mb-1">Territory / vertical</label>
                                  <input id="t-territory" type="text" maxLength={100}
                                    value={draft.territory}
                                    onChange={(e) => setDraft({ ...draft, territory: e.target.value })}
                                    className={inputClass} placeholder="Not recorded" />
                                </div>
                                <div>
                                  <label htmlFor="t-product" className="block text-xs font-medium text-gray-700 mb-1">Product line</label>
                                  <input id="t-product" type="text" maxLength={100}
                                    value={draft.product_line}
                                    onChange={(e) => setDraft({ ...draft, product_line: e.target.value })}
                                    className={inputClass} placeholder="Not recorded" />
                                </div>

                                <div className="md:col-span-3 flex flex-wrap items-center gap-3">
                                  <Button type="submit" disabled={saving || !dirty}>
                                    {saving ? 'Saving…' : 'Save targets'}
                                  </Button>
                                  <button type="button" onClick={cancelEdit}
                                    className="inline-flex items-center gap-1 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <X className="h-4 w-4" aria-hidden="true" /> Cancel
                                  </button>
                                  {saveError && (
                                    <p role="alert" className="text-sm text-red-700">{saveError}</p>
                                  )}
                                </div>
                              </form>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TargetsSettings;
