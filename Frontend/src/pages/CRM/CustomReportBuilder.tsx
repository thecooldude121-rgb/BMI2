import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Play, Save, Plus, X, AlertCircle, Table2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import ProvenanceNote from '../../components/Reports/ProvenanceNote';
import {
  fetchReports, fetchReport, createReport, updateReport, runDefinition,
  aggregationLabel, operatorLabel, operatorAppliesTo, DEFINITION_VERSION, ReportsApiError,
  type ReportDefinition, type RegistryField, type RegistryModule,
  type ReportRun, type Aggregation, type Operator,
  type AggregationSpec, type OperatorSpec,
} from '../../utils/reportsApi';

/**
 * CUSTOM REPORT BUILDER — wired to the real registry and the real runner.
 *
 * P3 Phase 4.
 *
 * ─── WHAT THIS REPLACED, AND WHY IT COULD NOT BE PATCHED ──────────────────
 *
 * 2,253 lines with no backend. It was labelled PREVIEW, and the label was doing
 * a lot of work: "Save & Run" ticked a `setInterval` progress bar to 100%,
 * waited 2.5 seconds on a `setTimeout`, and reported success against a database
 * with no reports table; edit mode pre-filled from a `mockReportData` fixture.
 *
 * The pickers were the deeper problem, and the reason this is a rewrite rather
 * than a rewiring. They could not be pointed at the server, because a third of
 * what they offered does not exist:
 *
 *   "Revenue"              — not a module
 *   "HRMS Connection"      — a SEPARATE PRODUCT this CRM must never join to
 *   "Deal Health"          — no such column (the spec claims it; it was never
 *                            deployed)
 *   "Last Activity" sort   — no such column
 *   CALCULATIONS previews  — hardcoded '$892K', '$49.6K', '18 deals'
 *
 * A picker offering a field the server will refuse is the `hr` drift. A picker
 * offering a field that exists nowhere is worse, and one offering an HRMS join
 * is a boundary violation shipped as a dropdown.
 *
 * ─── SO THE REGISTRY IS SERVED, NEVER LOCAL ───────────────────────────────
 *
 * Every module, field, aggregation and operator below comes from
 * `GET /reports`. This file contains no vocabulary of its own — if the server
 * will not accept it, it cannot be chosen.
 *
 * ─── THE DEFINITION *IS* THE STATE ────────────────────────────────────────
 *
 * The old page kept a `ReportConfig` shaped differently from what a backend
 * would want, which would have needed a mapping layer between them — and a
 * mapping layer is a second representation that can disagree with the first.
 * Here the editor mutates a `ReportDefinition` directly, so what you see is
 * literally what is saved and what is run.
 */

const CATEGORIES = [
  'Sales Performance', 'Pipeline Reports', 'Activity Reports',
  'Revenue Reports', 'Lead & Contact Reports', 'Account Reports',
];

const emptyDefinition = (base: string): ReportDefinition => ({
  v: DEFINITION_VERSION,
  base,
  joins: [],
  dimensions: [],
  metrics: [{ agg: 'count' }],
  filters: [],
  sort: [],
});

/**
 * The runner aliases its SELECT list `dim_0..n` then `metric_0..n`, indexed
 * within each list, and returns `columns` as dimensions followed by metrics. So
 * a column's position is NOT its alias index once there is more than one
 * dimension. Derived once here rather than recomputed per cell, because getting
 * it wrong shows the right number under the wrong heading — a mislabelled
 * figure, which is the failure this whole phase exists to avoid.
 */
const rowKeysFor = (columns: ReportRun['columns']): string[] => {
  let dims = 0, metrics = 0;
  return columns.map(c => (c.kind === 'dimension' ? `dim_${dims++}` : `metric_${metrics++}`));
};

const CustomReportBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get('id');

  const [modules, setModules] = useState<RegistryModule[]>([]);
  const [fields, setFields] = useState<RegistryField[]>([]);
  const [aggregations, setAggregations] = useState<AggregationSpec[]>([]);
  const [operators, setOperators] = useState<OperatorSpec[]>([]);
  const [registryError, setRegistryError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [definition, setDefinition] = useState<ReportDefinition | null>(null);

  const [run, setRun] = useState<ReportRun | null>(null);
  const [runError, setRunError] = useState<{ message: string; stale: boolean } | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const rowKeys = useMemo(() => (run ? rowKeysFor(run.columns) : []), [run]);

  // ── Load the registry, and the report being edited ──────────────────────
  useEffect(() => {
    let cancelled = false;
    fetchReports()
      .then(list => {
        if (cancelled) return;
        setModules(list.modules);
        setFields(list.fields);
        setAggregations(list.aggregations);
        setOperators(list.operators);
        setRegistryError(null);
        if (!editingId) setDefinition(emptyDefinition(list.modules[0]?.key ?? 'deals'));
      })
      // A failed registry load leaves the pickers EMPTY and says so. It does not
      // fall back to a local list — that is how the fabricated options got here.
      .catch((e: Error) => { if (!cancelled) setRegistryError(e.message); });
    return () => { cancelled = true; };
  }, [editingId]);

  useEffect(() => {
    if (!editingId) return;
    let cancelled = false;
    fetchReport(editingId)
      .then(r => {
        if (cancelled) return;
        setName(r.name);
        setDescription(r.description ?? '');
        setCategory(r.category ?? '');
        // The STORED definition, not a fixture. mockReportData is gone.
        setDefinition(r.definition);
      })
      .catch((e: Error) => { if (!cancelled) setRegistryError(e.message); });
    return () => { cancelled = true; };
  }, [editingId]);

  const baseModule = definition?.base ?? '';
  const activeModules = useMemo(
    () => [baseModule, ...(definition?.joins ?? [])].filter(Boolean),
    [baseModule, definition?.joins],
  );
  /** Only fields whose module is the base or joined — the server enforces this too. */
  const availableFields = useMemo(
    () => fields.filter(f => activeModules.includes(f.module)),
    [fields, activeModules],
  );
  const joinable = useMemo(
    () => modules.find(m => m.key === baseModule)?.joins ?? [],
    [modules, baseModule],
  );

  const patch = useCallback((over: Partial<ReportDefinition>) => {
    setDefinition(d => (d ? { ...d, ...over } : d));
    // Any edit invalidates the shown result. Leaving a stale table under a
    // changed definition is the "success toast over an unchanged database"
    // failure, one layer along.
    setRun(null);
    setRunError(null);
  }, []);

  const doRun = async () => {
    if (!definition) return;
    setRunning(true);
    setRunError(null);
    try {
      setRun(await runDefinition(definition));
    } catch (e) {
      const err = e as ReportsApiError;
      setRun(null);
      setRunError({ message: err.message, stale: err.status === 409 });
    } finally {
      setRunning(false);
    }
  };

  const doSave = async () => {
    if (!definition) return;
    if (!name.trim()) { setSaveMessage({ text: 'A name is required.', ok: false }); return; }
    setSaving(true);
    setSaveMessage(null);
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || null,
        category: category || null,
        definition,
      };
      const saved = editingId ? await updateReport(editingId, body) : await createReport(body);
      /*
       * The message names what happened and the page STAYS PUT. The old version
       * toasted "Report created successfully" and navigated away, over a
       * database with no reports table — being bounced to a list that does not
       * contain your report reads as a save that worked.
       */
      setSaveMessage({ text: `Saved as “${saved.name}”.`, ok: true });
      if (!editingId) navigate(`/crm/custom-report-builder?id=${saved.id}`, { replace: true });
    } catch (e) {
      setSaveMessage({ text: (e as Error).message, ok: false });
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const label = 'block text-[12px] font-medium text-gray-700 mb-1';

  if (registryError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMNavigation />
        <div className="p-8 max-w-2xl">
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[12px] text-red-800">
              Couldn&rsquo;t load the report builder, so no fields are offered rather than a
              guessed list.
              <span className="block text-red-600 mt-0.5">{registryError}</span>
            </p>
          </div>
          <Button className="mt-4" variant="secondary" onClick={() => navigate('/crm/reports')}>
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  if (!definition) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMNavigation />
        <div className="p-8"><p className="text-[12px] text-gray-400">Loading…</p></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="p-8">
        <button
          onClick={() => navigate('/crm/reports')}
          className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Reports
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[22px] font-semibold text-gray-900">
              {editingId ? 'Edit report' : 'New report'}
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              Choose what to measure and what to break it down by. Every field offered here
              is one the server will accept.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {saveMessage && (
              <span className={`text-[12px] ${saveMessage.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                {saveMessage.text}
              </span>
            )}
            <Button variant="secondary" onClick={doRun} disabled={running}>
              <Play className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {running ? 'Running…' : 'Run'}
            </Button>
            <Button onClick={doSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Definition ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
              <div>
                <label htmlFor="rpt-name" className={label}>
                  Name <span className="text-red-500">*</span>
                </label>
                <input id="rpt-name" className={field} value={name}
                  onChange={e => { setName(e.target.value); setSaveMessage(null); }}
                  placeholder="Won revenue by industry" />
              </div>
              <div>
                <label htmlFor="rpt-category" className={label}>Category</label>
                <select id="rpt-category" className={field} value={category}
                  onChange={e => setCategory(e.target.value)}>
                  <option value="">Uncategorised</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="rpt-desc" className={label}>Description</label>
                <textarea id="rpt-desc" rows={2} className={field} value={description}
                  onChange={e => setDescription(e.target.value)} />
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Data</h2>
              <div>
                <label htmlFor="rpt-base" className={label}>Report on</label>
                <select
                  id="rpt-base" className={field} value={definition.base}
                  onChange={e => setDefinition({ ...emptyDefinition(e.target.value) })}
                >
                  {/* The SERVED module list. No "Revenue", no "HRMS Connection". */}
                  {modules.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
              </div>

              {joinable.length > 0 && (
                <div>
                  <span className={label}>Include</span>
                  <div className="space-y-1.5">
                    {joinable.map(j => {
                      const on = (definition.joins ?? []).includes(j);
                      return (
                        <label key={j} className="flex items-center gap-2 text-[13px] text-gray-700">
                          <input
                            type="checkbox" checked={on}
                            onChange={() => patch({
                              joins: on
                                ? (definition.joins ?? []).filter(x => x !== j)
                                : [...(definition.joins ?? []), j],
                              // Dropping a join can orphan a chosen field, and
                              // the server would refuse the definition. Clear
                              // them rather than save something unrunnable.
                              dimensions: on ? [] : definition.dimensions,
                            })}
                          />
                          {modules.find(m => m.key === j)?.label ?? j}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Measure</h2>
              {(definition.metrics ?? []).map((m, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[130px]">
                    <label className={label} htmlFor={`m-agg-${i}`}>Calculation</label>
                    <select
                      id={`m-agg-${i}`} className={field} value={m.agg}
                      onChange={e => {
                        const agg = e.target.value as Aggregation;
                        const needs = aggregations.find(a => a.id === agg)?.needs_field;
                        const next = [...(definition.metrics ?? [])];
                        next[i] = { agg, field: needs ? m.field : undefined };
                        patch({ metrics: next });
                      }}
                    >
                      {aggregations.map(a => (
                        <option key={a.id} value={a.id}>{aggregationLabel(a.id)}</option>
                      ))}
                    </select>
                  </div>
                  {aggregations.find(a => a.id === m.agg)?.needs_field && (
                    <div className="flex-1 min-w-[150px]">
                      <label className={label} htmlFor={`m-field-${i}`}>of</label>
                      <select
                        id={`m-field-${i}`} className={field} value={m.field ?? ''}
                        onChange={e => {
                          const next = [...(definition.metrics ?? [])];
                          next[i] = { ...next[i], field: e.target.value };
                          patch({ metrics: next });
                        }}
                      >
                        <option value="">Choose a field…</option>
                        {/*
                          * `sum` and `avg` are offered only for fields the
                          * registry marks aggregatable, so the picker cannot
                          * propose summing a name.
                          */}
                        {availableFields
                          .filter(f => (['sum', 'avg'].includes(m.agg) ? f.aggregatable : true))
                          .map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                      </select>
                    </div>
                  )}
                  {(definition.metrics ?? []).length > 1 && (
                    <button
                      onClick={() => patch({ metrics: (definition.metrics ?? []).filter((_, n) => n !== i) })}
                      className="p-2 text-gray-400 hover:text-red-600" aria-label="Remove measure"
                    ><X className="h-4 w-4" /></button>
                  )}
                </div>
              ))}
              <Button variant="ghost" onClick={() => patch({ metrics: [...(definition.metrics ?? []), { agg: 'count' }] })}>
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Add measure
              </Button>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Break down by</h2>
              {(definition.dimensions ?? []).map((d, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <select
                      className={field} value={d.field} aria-label={`Breakdown ${i + 1}`}
                      onChange={e => {
                        const next = [...(definition.dimensions ?? [])];
                        next[i] = { field: e.target.value };
                        patch({ dimensions: next });
                      }}
                    >
                      {availableFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={() => patch({ dimensions: (definition.dimensions ?? []).filter((_, n) => n !== i) })}
                    className="p-2 text-gray-400 hover:text-red-600" aria-label="Remove breakdown"
                  ><X className="h-4 w-4" /></button>
                </div>
              ))}
              <Button
                variant="ghost"
                disabled={!availableFields.length}
                onClick={() => patch({
                  dimensions: [...(definition.dimensions ?? []), { field: availableFields[0].key }],
                })}
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Add breakdown
              </Button>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
              <h2 className="text-[15px] font-semibold text-gray-900">Filters</h2>
              {(definition.filters ?? []).map((f, i) => {
                const op = operators.find(o => o.id === f.op);
                /*
                 * Operators are filtered to the SELECTED FIELD'S TYPE. The
                 * server refuses `contains` on anything but a text field, so
                 * offering it on a currency column would present a choice it
                 * answers 400 for. `deals.source` is the case that proves this
                 * needs serving rather than guessing: it reads like text and
                 * the registry types it `enum`.
                 */
                const fieldType = availableFields.find(af => af.key === f.field)?.type;
                const usable = fieldType
                  ? operators.filter(o => operatorAppliesTo(o, fieldType))
                  : operators;
                return (
                  <div key={i} className="flex flex-wrap items-end gap-2">
                    <select
                      className={`${field} flex-1 min-w-[130px]`} value={f.field} aria-label={`Filter field ${i + 1}`}
                      onChange={e => {
                        const nextField = e.target.value;
                        const nextType = availableFields.find(af => af.key === nextField)?.type;
                        const stillApplies = op && nextType
                          ? operatorAppliesTo(op, nextType) : true;
                        const next = [...(definition.filters ?? [])];
                        // Switching a text field to a number strands `contains`.
                        // Fall back to `eq` rather than keep a pairing the server
                        // will refuse.
                        next[i] = {
                          ...next[i],
                          field: nextField,
                          op: stillApplies ? next[i].op : 'eq',
                        };
                        patch({ filters: next });
                      }}
                    >
                      {availableFields.map(af => <option key={af.key} value={af.key}>{af.label}</option>)}
                    </select>
                    <select
                      className={`${field} flex-1 min-w-[110px]`} value={f.op} aria-label={`Filter operator ${i + 1}`}
                      onChange={e => {
                        const next = [...(definition.filters ?? [])];
                        next[i] = { ...next[i], op: e.target.value as Operator };
                        patch({ filters: next });
                      }}
                    >
                      {usable.map(o => (
                        <option key={o.id} value={o.id}>{operatorLabel(o.id)}</option>
                      ))}
                    </select>
                    {op && op.arity !== 0 && (
                      <input
                        className={`${field} flex-1 min-w-[110px]`} aria-label={`Filter value ${i + 1}`}
                        value={String(f.value ?? '')}
                        placeholder={op.arity === 2 ? 'from, to' : op.arity === 'many' ? 'a, b, c' : 'value'}
                        onChange={e => {
                          const raw = e.target.value;
                          const next = [...(definition.filters ?? [])];
                          next[i] = {
                            ...next[i],
                            value: op.arity === 2 || op.arity === 'many'
                              ? raw.split(',').map(s => s.trim()).filter(Boolean)
                              : raw,
                          };
                          patch({ filters: next });
                        }}
                      />
                    )}
                    <button
                      onClick={() => patch({ filters: (definition.filters ?? []).filter((_, n) => n !== i) })}
                      className="p-2 text-gray-400 hover:text-red-600" aria-label="Remove filter"
                    ><X className="h-4 w-4" /></button>
                  </div>
                );
              })}
              <Button
                variant="ghost"
                disabled={!availableFields.length}
                onClick={() => patch({
                  filters: [...(definition.filters ?? []), { field: availableFields[0].key, op: 'eq', value: '' }],
                })}
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" /> Add filter
              </Button>
            </section>
          </div>

          {/* ── Result ──────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  Result
                </h2>
                {run && <span className="text-[11px] text-gray-400">{run.ms} ms</span>}
              </div>

              {runError && (
                <div className={`rounded-lg border px-4 py-3 mb-3 ${
                  runError.stale ? 'border-amber-300 bg-amber-50' : 'border-red-200 bg-red-50'
                }`}>
                  {/*
                    * A 409 is NOT an input error. The stored definition has
                    * outlived a registry change, so the wording says the report
                    * needs fixing rather than implying the user typed something
                    * wrong — and it points at the editor beside it.
                    */}
                  <p className={`text-[12px] ${runError.stale ? 'text-amber-900' : 'text-red-800'}`}>
                    {runError.stale ? (
                      <>
                        <strong>This saved report can no longer run.</strong> A field or module it
                        refers to is no longer available, so nothing is shown rather than a
                        partial result. Adjust the definition on the left and run it again.
                        <span className="block text-amber-800 mt-1">{runError.message}</span>
                      </>
                    ) : (
                      <>
                        <strong>Couldn&rsquo;t run this report.</strong>
                        <span className="block text-red-700 mt-1">{runError.message}</span>
                      </>
                    )}
                  </p>
                </div>
              )}

              {!run && !runError && (
                <p className="text-[12px] text-gray-500">
                  Press <strong>Run</strong> to see real results. Nothing is shown until then —
                  there are no sample rows here.
                </p>
              )}

              {run && (
                <>
                  {/* Disclosure ABOVE the table, before any figure is read. */}
                  <div className="mb-3">
                    <ProvenanceNote provenance={run.provenance} />
                  </div>

                  {run.rows.length === 0 ? (
                    <p className="text-[12px] text-gray-500">
                      No rows matched. That is a result, not a failure.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="border-b border-gray-200">
                            {run.columns.map(c => (
                              <th key={c.key} className="text-left font-semibold text-gray-600 px-3 py-2">
                                {c.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {run.rows.map((r, i) => (
                            <tr key={i} className="border-b border-gray-100">
                              {run.columns.map((c, n) => {
                                const v = r[rowKeys[n]];
                                return (
                                  <td key={c.key} className="px-3 py-2 text-gray-800 tabular-nums">
                                    {v === null || v === undefined ? <span className="text-gray-300">—</span> : String(v)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomReportBuilder;
