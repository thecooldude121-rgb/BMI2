import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Plus, X, Check, Circle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import PageHeader from '../../components/Layout/PageHeader';
import ProvenancePanel from '../../components/Reports/ProvenancePanel';
import {
  fetchRegistry, fetchReport, createReport, updateReport, runDefinition,
  aggregationLabel, operatorLabel, operatorAppliesTo, isReportId,
  DEFINITION_VERSION, MAX_ROWS, NAME_MAX, CATEGORY_MAX, ReportsApiError,
  type ReportDefinition, type ReportRun, type SavedReport, type ReportStatus,
  type RegistryModule, type RegistryField, type AggregationSpec, type OperatorSpec, type Aggregation, type Operator,
} from '../../utils/reportsApi';

/**
 * CUSTOM REPORT BUILDER — reports replay step f (P3 Phase 4, rebuilt on main's
 * shell and tokens, laid out on the Figma "Custom report builder" frame 75:13300).
 *
 * ─── EVERYTHING IT OFFERS IS SERVED ───────────────────────────────────────
 * Modules, fields, aggregations and operators come from GET /reports. The page
 * keeps no vocabulary of its own: the old one offered "Revenue" (not a module),
 * "Deal Health" (no such column) and an "HRMS Connection" grouping (another
 * product). A registry that fails to load offers nothing, never a guessed list.
 *
 * ─── THE DEFINITION IS THE STATE ──────────────────────────────────────────
 * The editor mutates a `ReportDefinition` directly — what you see is what is
 * previewed and what is saved. Any edit clears the shown preview: a stale table
 * under a changed definition would be a figure for a report nobody asked for.
 *
 * ─── DRAFTS (migration 072, decided by Venkat 2026-10-17) ─────────────────
 * "Save draft" stores a draft — private to you, not shareable. "Save" stores a
 * saved report (a draft becomes saved; a saved report never goes back). Each
 * confirmation — "Saved as draft" / "Saved" — appears only after the server's
 * 2xx; a refusal keeps your input and shows the server's reason.
 *
 * ─── WHAT THE FRAME DRAWS THAT IS NOT BUILT ───────────────────────────────
 * Report types other than Table, custom formulas, schedules and preset layouts
 * are disabled "Coming soon" (presets are canned reports: step g). Sharing is
 * real, on the report's own page once saved.
 */

const CATEGORIES = [
  'Sales Performance', 'Pipeline Reports', 'Activity Reports',
  'Revenue Reports', 'Lead & Contact Reports', 'Account Reports',
];

const emptyDefinition = (base: string): ReportDefinition => ({
  v: DEFINITION_VERSION, base, joins: [], dimensions: [], metrics: [{ agg: 'count' }], filters: [], sort: [],
});

/** dim_0..n then metric_0..n, indexed within each list — not by position. */
const rowKeysFor = (columns: ReportRun['columns']): string[] => {
  let dims = 0, metrics = 0;
  return columns.map(c => (c.kind === 'dimension' ? `dim_${dims++}` : `metric_${metrics++}`));
};

const inputCls = 'w-full rounded-ctrl border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-600';
const labelCls = 'mb-1 block text-xs font-semibold text-ink';

const Section: React.FC<{ n: string; title: string; aside?: React.ReactNode; children: React.ReactNode; muted?: boolean }> = ({
  n, title, aside, children, muted = false,
}) => (
  <section
    aria-labelledby={`sec-${n}`}
    className={`flex flex-col gap-3 rounded-card border border-line p-4 ${muted ? 'bg-surface-subtle' : 'bg-surface-panel'}`}
  >
    <div className="flex items-baseline justify-between gap-2">
      <h2 id={`sec-${n}`} className="flex items-baseline gap-3 text-base font-semibold text-ink-heading">
        <span className="text-sm text-brand-600 tabular-nums">{n}</span>{title}
      </h2>
      {aside && <span className="text-xs text-ink-muted">{aside}</span>}
    </div>
    {children}
  </section>
);

const ChipButton: React.FC<{ pressed: boolean; onClick?: () => void; disabled?: boolean; children: React.ReactNode; title?: string }> = ({
  pressed, onClick, disabled, children, title,
}) => (
  <button
    type="button"
    aria-pressed={pressed}
    disabled={disabled}
    title={title}
    onClick={onClick}
    className={`rounded-ctrl border px-3 py-1.5 text-sm ${
      pressed ? 'border-brand-600 bg-brand-100 font-semibold text-brand-700'
        : disabled ? 'cursor-not-allowed border-line bg-surface-sunken text-ink-muted'
          : 'border-line bg-white text-ink hover:bg-surface-sunken'
    }`}
  >
    {children}
  </button>
);

type ValidationCheck = { label: string; ok: boolean; detail: string };

const CustomReportBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const rawId = params.get('id');
  const editingId = isReportId(rawId ?? undefined) ? rawId : null;

  const [modules, setModules] = useState<RegistryModule[]>([]);
  const [fields, setFields] = useState<RegistryField[]>([]);
  const [aggregations, setAggregations] = useState<AggregationSpec[]>([]);
  const [operators, setOperators] = useState<OperatorSpec[]>([]);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [registryLoaded, setRegistryLoaded] = useState(false);

  const [loaded, setLoaded] = useState<SavedReport | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'missing' | 'forbidden' | 'error'>(editingId ? 'loading' : 'ok');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [definition, setDefinition] = useState<ReportDefinition | null>(null);
  /** The last version the server confirmed, to tell whether anything is unsaved. */
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  const [run, setRun] = useState<ReportRun | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const [saving, setSaving] = useState<ReportStatus | null>(null);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; text: string; id?: string } | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  /** The id we just created: its address change must not reload what we already hold. */
  const justCreated = useRef<string | null>(null);

  const snapshotOf = (n: string, d: string, c: string, def: ReportDefinition | null) =>
    JSON.stringify({ n: n.trim(), d: d.trim(), c, def });

  // ── Registry, and the report being edited ──────────────────────────────
  useEffect(() => {
    if (justCreated.current && justCreated.current === editingId) return;
    let cancelled = false;
    fetchRegistry()
      .then(r => {
        if (cancelled) return;
        setModules(r.modules);
        setFields(r.fields);
        setAggregations(r.aggregations);
        setOperators(r.operators);
        setRegistryLoaded(true);
        if (!editingId && r.modules[0]) {
          // A fresh builder's starting point is its "saved" baseline, so nothing reads as unsaved until you change it.
          const start = emptyDefinition(r.modules[0].key);
          setDefinition(d => d ?? start);
          setSavedSnapshot(s => s ?? snapshotOf('', '', '', start));
        }
      })
      .catch((e: Error) => { if (!cancelled) setRegistryError(e.message); });
    return () => { cancelled = true; };
  }, [editingId]);

  useEffect(() => {
    if (!editingId || justCreated.current === editingId) return;
    let cancelled = false;
    fetchReport(editingId)
      .then(r => {
        if (cancelled) return;
        if (!r.abilities.can_edit) { setLoaded(r); setLoadState('forbidden'); return; }
        setLoaded(r);
        setName(r.name);
        setDescription(r.description ?? '');
        setCategory(r.category ?? '');
        setDefinition(r.definition);
        setSavedSnapshot(snapshotOf(r.name, r.description ?? '', r.category ?? '', r.definition));
        setLoadState('ok');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setLoadState((e as ReportsApiError)?.status === 404 ? 'missing' : 'error');
      });
    return () => { cancelled = true; };
  }, [editingId]);

  const baseModule = definition?.base ?? '';
  const activeModules = useMemo(() => [baseModule, ...(definition?.joins ?? [])].filter(Boolean), [baseModule, definition?.joins]);
  const availableFields = useMemo(() => fields.filter(f => activeModules.includes(f.module)), [fields, activeModules]);
  const joinable = useMemo(() => modules.find(m => m.key === baseModule)?.joins ?? [], [modules, baseModule]);
  const fieldLabel = (key: string) => fields.find(f => f.key === key)?.label ?? key;
  const moduleLabel = (key: string) => modules.find(m => m.key === key)?.label ?? key;

  const patch = useCallback((over: Partial<ReportDefinition>) => {
    setDefinition(d => (d ? { ...d, ...over } : d));
    setRun(null);
    setRunError(null);
    setSaveResult(null);
  }, []);

  const dirty = definition !== null && snapshotOf(name, description, category, definition) !== savedSnapshot;
  const status: ReportStatus | null = loaded?.status ?? null;

  // ── Validation: what the server will check, said before it does ────────
  const checks: ValidationCheck[] = useMemo(() => {
    if (!definition) return [];
    const metrics = definition.metrics ?? [];
    const filters = definition.filters ?? [];
    const metricMissingField = metrics.some(m => aggregations.find(a => a.id === m.agg)?.needs_field && !m.field);
    const filterMissingValue = filters.some(f => {
      const op = operators.find(o => o.id === f.op);
      if (!op || op.arity === 0) return false;
      if (op.arity === 2) return !Array.isArray(f.value) || f.value.length !== 2;
      if (op.arity === 'many') return !Array.isArray(f.value) || f.value.length === 0;
      return f.value === undefined || String(f.value).trim() === '';
    });
    return [
      { label: 'Report name', ok: !!name.trim() && name.trim().length <= NAME_MAX,
        detail: !name.trim() ? 'Required' : name.trim().length > NAME_MAX ? `At most ${NAME_MAX} characters` : `${name.trim().length} / ${NAME_MAX}` },
      { label: 'Data source', ok: !!definition.base, detail: definition.base ? moduleLabel(definition.base) : 'Required' },
      { label: 'Measures', ok: metrics.length > 0 && !metricMissingField,
        detail: metrics.length === 0 ? 'Add at least one' : metricMissingField ? 'Choose a field for each measure' : String(metrics.length) },
      { label: 'Filters', ok: !filterMissingValue, detail: filterMissingValue ? 'A filter is missing its value' : String(filters.length) },
    ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition, name, aggregations, operators, modules]);
  const valid = checks.length > 0 && checks.every(c => c.ok);

  const doRun = async () => {
    if (!definition) return;
    setRunning(true);
    setRunError(null);
    try {
      setRun(await runDefinition(definition));
    } catch (e) {
      setRun(null);
      setRunError((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  const doSave = async (as: ReportStatus) => {
    if (!definition || !valid) return;
    setSaving(as);
    setSaveResult(null);
    try {
      const body = { name: name.trim(), description: description.trim() || null, category: category || null, definition, status: as };
      const saved = editingId ? await updateReport(editingId, body) : await createReport(body);
      setLoaded(saved);
      setSavedSnapshot(snapshotOf(saved.name, saved.description ?? '', saved.category ?? '', saved.definition));
      setSaveResult({ ok: true, text: saved.status === 'draft' ? 'Saved as draft' : 'Saved', id: saved.id });
      if (!editingId) {
        justCreated.current = saved.id;
        navigate(`/crm/custom-report-builder?id=${saved.id}`, { replace: true });
      }
    } catch (e) {
      setSaveResult({ ok: false, text: (e as Error).message });
    } finally {
      setSaving(null);
    }
  };

  const leave = () => navigate(editingId ? `/crm/reports/${editingId}` : '/crm/reports');

  const crumbs = (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
      <Link to="/crm/dashboard" className="font-semibold text-brand-600 hover:text-brand-700">Dashboard</Link>
      <span className="text-ink-muted" aria-hidden="true">/</span>
      <Link to="/crm/reports" className="font-semibold text-brand-600 hover:text-brand-700">Reports</Link>
      <span className="text-ink-muted" aria-hidden="true">/</span>
      <span className="text-ink-muted" aria-current="page">{editingId ? (loaded?.name ?? 'Edit report') : 'Custom report builder'}</span>
    </nav>
  );

  if (rawId && !editingId) {
    return (
      <div className="flex flex-col gap-4">
        {crumbs}
        <PageHeader eyebrow="Report builder" title="This address is out of date" />
        <EmptyState title="There is no report to edit at this address"
          reason="Open a saved report from the Reports list and choose Edit."
          action={<Button variant="secondary" onClick={() => navigate('/crm/reports')}>Go to Reports</Button>} />
      </div>
    );
  }
  if (loadState === 'missing') {
    return (
      <div className="flex flex-col gap-4" data-testid="builder-not-found">
        {crumbs}
        <PageHeader eyebrow="Report builder" title="Report not found" />
        <EmptyState title="This report doesn't exist, or it isn't shared with you"
          reason="Saved reports are private unless their owner shares them."
          action={<Button variant="secondary" onClick={() => navigate('/crm/reports')}>Go to Reports</Button>} />
      </div>
    );
  }
  if (loadState === 'forbidden') {
    return (
      <div className="flex flex-col gap-4" data-testid="builder-view-only">
        {crumbs}
        <PageHeader eyebrow="Report builder" title={loaded?.name ?? 'Report'} />
        <EmptyState title="You can view this report but not edit it"
          reason="It is shared with you to view. Ask its owner for edit access."
          action={<Button variant="secondary" onClick={() => navigate(`/crm/reports/${editingId}`)}>Open the report</Button>} />
      </div>
    );
  }
  if (registryError || loadState === 'error') {
    return (
      <div className="flex flex-col gap-4" data-testid="builder-load-error">
        {crumbs}
        <PageHeader eyebrow="Report builder" title="Couldn't open the report builder" />
        <EmptyState tone="error" title="What you can report on couldn't be loaded"
          reason={`${registryError ?? 'The report could not be loaded.'} Nothing is offered rather than a guessed list.`}
          action={<Button variant="secondary" onClick={() => window.location.reload()}>Try again</Button>} />
      </div>
    );
  }
  if (registryLoaded && modules.length === 0) {
    // Served, and empty: say so. Never a local list of modules to fall back on.
    return (
      <div className="flex flex-col gap-4" data-testid="builder-no-modules">
        {crumbs}
        <PageHeader eyebrow="Report builder" title="Custom report builder" />
        <EmptyState title="There is nothing to report on" reason="The server offered no data sources, so the builder has nothing to show." />
      </div>
    );
  }
  if (!definition || loadState === 'loading') {
    return <div className="flex flex-col gap-4">{crumbs}<p className="text-sm text-ink-muted" role="status">Loading the report builder…</p></div>;
  }

  const metrics = definition.metrics ?? [];
  const dims = definition.dimensions ?? [];
  const filters = definition.filters ?? [];
  const sort = definition.sort?.[0];
  const sortOptions = [
    ...dims.map(d => ({ value: d.field, label: fieldLabel(d.field) })),
    ...metrics.map((m, i) => ({ value: `metric:${i}`, label: `${aggregationLabel(m.agg)}${m.field ? ` of ${fieldLabel(m.field)}` : ''}` })),
  ];
  const rowKeys = run ? rowKeysFor(run.columns) : [];

  return (
    <div className="flex flex-col gap-4" data-testid="report-builder">
      {crumbs}
      <PageHeader
        eyebrow={status === 'draft' ? 'Report builder · Draft' : 'Report builder'}
        title={editingId ? 'Edit report' : 'Custom report builder'}
        description="Choose what to report on; preview real results from your workspace; save it as a draft or as a report."
        actions={(
          <>
            <Button variant="secondary" onClick={leave}>Cancel</Button>
            {status !== 'saved' && (
              <Button variant="secondary" onClick={() => void doSave('draft')} disabled={!valid || saving !== null}>
                {saving === 'draft' ? 'Saving…' : 'Save draft'}
              </Button>
            )}
            <Button onClick={() => void doSave('saved')} disabled={!valid || saving !== null}>
              {saving === 'saved' ? 'Saving…' : status === 'draft' ? 'Save report' : 'Save'}
            </Button>
          </>
        )}
      />

      {saveResult && (
        <div data-testid="save-result">
          {saveResult.ok ? (
            <Alert tone="success" title={saveResult.text}
              action={saveResult.id ? <Link to={`/crm/reports/${saveResult.id}`} className="text-sm font-semibold text-brand-600">Open report</Link> : undefined}>
              {saveResult.text === 'Saved as draft'
                ? 'Only you can see it. Save it as a report when you want to share it.'
                : 'It is in your saved reports, and you can share it from its page.'}
            </Alert>
          ) : (
            <Alert tone="danger" title="Not saved">{saveResult.text} Your changes are still here.</Alert>
          )}
        </div>
      )}
      {status === 'draft' && !saveResult && (
        <p className="text-xs text-ink-muted"><Badge tone="warning">Draft</Badge> Only you can see this report until you save it as a report.</p>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section n="01" title="Basic information" aside="Name required">
            <div>
              <label htmlFor="rpt-name" className={labelCls}>Report name *</label>
              <input id="rpt-name" className={inputCls} value={name} maxLength={NAME_MAX + 50}
                onChange={e => { setName(e.target.value); setSaveResult(null); }} />
              <p className="mt-1 text-xs text-ink-muted">{name.trim().length} / {NAME_MAX} characters</p>
            </div>
            <div>
              <label htmlFor="rpt-desc" className={labelCls}>Description</label>
              <textarea id="rpt-desc" rows={2} className={inputCls} value={description}
                onChange={e => { setDescription(e.target.value); setSaveResult(null); }} />
            </div>
            <div>
              <label htmlFor="rpt-cat" className={labelCls}>Category</label>
              <select id="rpt-cat" className={inputCls} value={category} onChange={e => { setCategory(e.target.value.slice(0, CATEGORY_MAX)); setSaveResult(null); }}>
                <option value="">Uncategorised</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </Section>

          <Section n="02" title="Data source" aside="Required · one source">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Data source">
              {modules.map(m => (
                <ChipButton key={m.key} pressed={definition.base === m.key}
                  onClick={() => { if (definition.base !== m.key) { setDefinition(emptyDefinition(m.key)); setRun(null); setRunError(null); setSaveResult(null); } }}>
                  {m.label}
                </ChipButton>
              ))}
            </div>
            {joinable.length > 0 && (
              <div>
                <span className={labelCls}>Also include linked</span>
                <div className="flex flex-wrap gap-3">
                  {joinable.map(j => {
                    const on = (definition.joins ?? []).includes(j);
                    return (
                      <label key={j} className="flex items-center gap-2 text-sm text-ink">
                        <input type="checkbox" checked={on} onChange={() => patch({
                          joins: on ? (definition.joins ?? []).filter(x => x !== j) : [...(definition.joins ?? []), j],
                          // Dropping a join can orphan a chosen field; the server would refuse it.
                          ...(on ? {
                            dimensions: dims.filter(d => fields.find(f => f.key === d.field)?.module !== j),
                            metrics: metrics.filter(m => !m.field || fields.find(f => f.key === m.field)?.module !== j),
                            filters: filters.filter(f => fields.find(x => x.key === f.field)?.module !== j),
                            sort: [],
                          } : {}),
                        })} />
                        {moduleLabel(j)}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>

          <Section n="03" title="Report type" aside="Table only, for now">
            <div className="flex flex-wrap gap-2">
              <ChipButton pressed>Table</ChipButton>
              {['Chart + table', 'Matrix'].map(t => (
                <ChipButton key={t} pressed={false} disabled title={`${t} reports are not built yet`}>{t} · Coming soon</ChipButton>
              ))}
            </div>
          </Section>

          <Section n="04" title="Columns & measures" aside={`${dims.length} ${dims.length === 1 ? 'breakdown' : 'breakdowns'} · ${metrics.length} ${metrics.length === 1 ? 'measure' : 'measures'}`}>
            <div className="flex flex-col gap-2">
              <span className={labelCls}>Break down by</span>
              {dims.length === 0 && <p className="text-xs text-ink-muted">No breakdown: the report is one row of totals.</p>}
              {dims.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select className={inputCls} value={d.field} aria-label={`Breakdown ${i + 1}`}
                    onChange={e => { const next = [...dims]; next[i] = { field: e.target.value }; patch({ dimensions: next, sort: [] }); }}>
                    {availableFields.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                  <Button variant="ghost" size="sm" iconOnly leadingIcon={<X className="h-4 w-4" />} aria-label={`Remove breakdown ${i + 1}`}
                    onClick={() => patch({ dimensions: dims.filter((_, n) => n !== i), sort: [] })} />
                </div>
              ))}
              <div><Button variant="ghost" size="sm" disabled={!availableFields.length}
                onClick={() => patch({ dimensions: [...dims, { field: availableFields[0].key }] })}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add breakdown
              </Button></div>
            </div>
            <div className="flex flex-col gap-2">
              <span className={labelCls}>Measures</span>
              {metrics.map((m, i) => {
                const needs = aggregations.find(a => a.id === m.agg)?.needs_field;
                return (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <select className={`${inputCls} min-w-[140px] flex-1`} value={m.agg} aria-label={`Measure ${i + 1} calculation`}
                      onChange={e => {
                        const agg = e.target.value as Aggregation;
                        const next = [...metrics];
                        next[i] = { agg, field: aggregations.find(a => a.id === agg)?.needs_field ? m.field : undefined };
                        patch({ metrics: next, sort: [] });
                      }}>
                      {aggregations.map(a => <option key={a.id} value={a.id}>{aggregationLabel(a.id)}</option>)}
                    </select>
                    {needs && (
                      <select className={`${inputCls} min-w-[160px] flex-1`} value={m.field ?? ''} aria-label={`Measure ${i + 1} field`}
                        onChange={e => { const next = [...metrics]; next[i] = { ...next[i], field: e.target.value || undefined }; patch({ metrics: next }); }}>
                        <option value="">Choose a field…</option>
                        {/* sum / avg only over fields the registry marks aggregatable. */}
                        {availableFields.filter(f => (['sum', 'avg'].includes(m.agg) ? f.aggregatable : true))
                          .map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                      </select>
                    )}
                    {metrics.length > 1 && (
                      <Button variant="ghost" size="sm" iconOnly leadingIcon={<X className="h-4 w-4" />} aria-label={`Remove measure ${i + 1}`}
                        onClick={() => patch({ metrics: metrics.filter((_, n) => n !== i), sort: [] })} />
                    )}
                  </div>
                );
              })}
              <div><Button variant="ghost" size="sm" onClick={() => patch({ metrics: [...metrics, { agg: 'count' }] })}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add measure
              </Button></div>
            </div>
          </Section>

          <Section n="05" title="Filters" aside={`${filters.length} ${filters.length === 1 ? 'filter' : 'filters'}`}>
            {filters.length === 0 && <p className="text-xs text-ink-muted">No filters: every record counts (test records are always left out).</p>}
            {filters.map((f, i) => {
              const op = operators.find(o => o.id === f.op);
              const fieldType = availableFields.find(af => af.key === f.field)?.type;
              // Operators are filtered to the field's type: the server refuses `contains` on non-text fields.
              const usable = fieldType ? operators.filter(o => operatorAppliesTo(o, fieldType)) : operators;
              return (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <select className={`${inputCls} min-w-[140px] flex-1`} value={f.field} aria-label={`Filter ${i + 1} field`}
                    onChange={e => {
                      const nextType = availableFields.find(af => af.key === e.target.value)?.type;
                      const keepOp = op && nextType ? operatorAppliesTo(op, nextType) : true;
                      const next = [...filters];
                      next[i] = { ...next[i], field: e.target.value, op: keepOp ? next[i].op : 'eq' };
                      patch({ filters: next });
                    }}>
                    {availableFields.map(af => <option key={af.key} value={af.key}>{af.label}</option>)}
                  </select>
                  <select className={`${inputCls} min-w-[120px] flex-1`} value={f.op} aria-label={`Filter ${i + 1} operator`}
                    onChange={e => {
                      const nextOp = operators.find(o => o.id === e.target.value);
                      const next = [...filters];
                      next[i] = { ...next[i], op: e.target.value as Operator,
                        value: nextOp?.arity === 0 ? undefined : nextOp?.arity === 2 || nextOp?.arity === 'many' ? [] : '' };
                      patch({ filters: next });
                    }}>
                    {usable.map(o => <option key={o.id} value={o.id}>{operatorLabel(o.id)}</option>)}
                  </select>
                  {op && op.arity !== 0 && (
                    <input className={`${inputCls} min-w-[140px] flex-1`} aria-label={`Filter ${i + 1} value`}
                      value={Array.isArray(f.value) ? f.value.join(', ') : String(f.value ?? '')}
                      placeholder={op.arity === 2 ? 'from, to' : op.arity === 'many' ? 'a, b, c' : 'value'}
                      onChange={e => {
                        const raw = e.target.value;
                        const next = [...filters];
                        next[i] = { ...next[i], value: op.arity === 2 || op.arity === 'many' ? raw.split(',').map(s => s.trim()).filter(Boolean) : raw };
                        patch({ filters: next });
                      }} />
                  )}
                  <Button variant="ghost" size="sm" iconOnly leadingIcon={<X className="h-4 w-4" />} aria-label={`Remove filter ${i + 1}`}
                    onClick={() => patch({ filters: filters.filter((_, n) => n !== i) })} />
                </div>
              );
            })}
            <div><Button variant="ghost" size="sm" disabled={!availableFields.length}
              onClick={() => patch({ filters: [...filters, { field: availableFields[0].key, op: 'eq', value: '' }] })}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add filter
            </Button></div>
          </Section>

          <Section n="06" title="Sorting & row limit" aside="Optional">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="rpt-sort" className={labelCls}>Sort by</label>
                <select id="rpt-sort" className={inputCls} value={sort?.by ?? ''}
                  onChange={e => patch({ sort: e.target.value ? [{ by: e.target.value, dir: sort?.dir ?? 'desc' }] : [] })}>
                  <option value="">No sorting</option>
                  {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="rpt-dir" className={labelCls}>Direction</label>
                <select id="rpt-dir" className={inputCls} value={sort?.dir ?? 'desc'} disabled={!sort}
                  onChange={e => sort && patch({ sort: [{ by: sort.by, dir: e.target.value as 'asc' | 'desc' }] })}>
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
              <div>
                <label htmlFor="rpt-limit" className={labelCls}>Row limit</label>
                <input id="rpt-limit" type="number" min={1} max={MAX_ROWS} className={inputCls}
                  value={definition.limit ?? ''} placeholder={`${MAX_ROWS.toLocaleString()} (the maximum)`}
                  onChange={e => {
                    const v = e.target.value === '' ? undefined : Math.min(MAX_ROWS, Math.max(1, Math.floor(Number(e.target.value))));
                    patch({ limit: Number.isFinite(v as number) ? v : undefined });
                  }} />
              </div>
            </div>
            <p className="text-xs text-ink-muted">You can sort by a breakdown or a measure. A result longer than the limit is cut off, and the preview says so.</p>
          </Section>

          <Section n="07" title="Calculations" aside="Coming soon" muted>
            <p className="text-sm text-ink-muted">Custom formulas are not built yet. Use the measures above.</p>
          </Section>

          <Section n="08" title="Schedule & sharing" muted>
            <p className="text-sm text-ink-muted">
              <strong className="text-ink">Sharing</strong> is on the report&rsquo;s own page once it is saved as a report — a draft is private to you.
              {' '}<strong className="text-ink">Scheduled delivery</strong> is not built yet.
            </p>
          </Section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="preview-h" className="flex flex-col gap-3 rounded-card border border-line bg-surface-panel p-4" data-testid="builder-preview">
            <div className="flex items-center justify-between gap-2">
              <h2 id="preview-h" className="text-base font-semibold text-ink-heading">Preview</h2>
              <Button size="sm" onClick={() => void doRun()} disabled={running || !checks.slice(1).every(c => c.ok)}>
                <Play className="h-4 w-4" aria-hidden="true" /> {running ? 'Running…' : 'Run preview'}
              </Button>
            </div>
            {!run && !runError && (
              <p className="text-sm text-ink-muted">Run the preview to see real results from your workspace. There are no sample rows here.</p>
            )}
            {runError && <Alert tone="danger" title="Couldn't run this report">{runError}</Alert>}
            {run && (
              <>
                <ProvenancePanel provenance={run.provenance} />
                {run.rows.length === 0 ? (
                  <p className="text-sm text-ink-muted">No rows matched. That is a result, not a failure.</p>
                ) : (
                  <div className="overflow-x-auto rounded-card border border-line">
                    <table className="w-full text-sm" data-testid="preview-results">
                      <thead className="bg-surface-sunken">
                        <tr>{run.columns.map(c => (
                          <th key={c.key} scope="col" className={`px-2 py-1.5 text-xs font-semibold text-ink-muted ${c.kind === 'metric' ? 'text-right' : 'text-left'}`}>{c.label}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {run.rows.slice(0, 50).map((r, i) => (
                          <tr key={i} className="border-t border-line">
                            {run.columns.map((c, n) => (
                              <td key={c.key} className={`px-2 py-1.5 text-ink ${c.kind === 'metric' ? 'text-right tabular-nums' : ''}`}>
                                {r[rowKeys[n]] === null || r[rowKeys[n]] === undefined ? '—' : String(r[rowKeys[n]])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {run.rows.length > 50 && (
                      <p className="border-t border-line px-2 py-1.5 text-xs text-ink-muted">Showing the first 50 of {run.rows.length} rows here; the saved report shows them all.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </section>

          <section aria-labelledby="validation-h" className="flex flex-col gap-2 rounded-card border border-line bg-surface-panel p-4" data-testid="builder-validation">
            <h2 id="validation-h" className="text-base font-semibold text-ink-heading">Validation</h2>
            <ul className="flex flex-col gap-1.5">
              {checks.map(c => (
                <li key={c.label} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1.5 text-ink">
                    {c.ok ? <Check className="h-4 w-4 text-success-700" aria-hidden="true" /> : <Circle className="h-4 w-4 text-warning-700" aria-hidden="true" />}
                    {c.label}
                  </span>
                  <span className={`text-xs font-semibold ${c.ok ? 'text-success-700' : 'text-warning-700'}`}>{c.detail}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-ink-muted">The server checks the definition again when you preview or save, and its answer is final.</p>
          </section>

          <section aria-labelledby="presets-h" className="flex flex-col gap-1 rounded-card border border-line bg-surface-subtle p-4">
            <h2 id="presets-h" className="text-base font-semibold text-ink-heading">Preset layouts</h2>
            <p className="text-sm text-ink-muted">Coming soon — ready-made reports arrive with the built-in report catalogue.</p>
          </section>

          {dirty && (
            <section aria-labelledby="discard-h" className="flex flex-col gap-2 rounded-card border border-danger-300 bg-danger-50 p-4">
              <h2 id="discard-h" className="text-base font-semibold text-danger-700">Discard changes?</h2>
              <p className="text-sm text-danger-800">
                {editingId ? 'Your unsaved changes will be lost; the stored report is not affected.' : 'Nothing has been saved yet; this clears the builder.'}
              </p>
              {confirmDiscard ? (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setConfirmDiscard(false)}>Keep editing</Button>
                  <Button variant="danger" onClick={() => { setConfirmDiscard(false); leave(); }}>Discard changes</Button>
                </div>
              ) : (
                <div><Button variant="secondary" onClick={() => setConfirmDiscard(true)}>Discard changes…</Button></div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomReportBuilder;
