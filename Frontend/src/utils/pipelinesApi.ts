/**
 * Pipelines and their stages, as the workspace has configured them.
 *
 * PHASE B OF PIPELINE_STAGES_DESIGN.md. Phase A made stages real per-tenant rows
 * (migration 037); this is the client that lets the UI stop hardcoding them.
 *
 * WHAT IT REPLACES. Stage knowledge was written into the frontend in three
 * disagreeing places: `config/pipelines.ts` (3 pipelines, 16 stages), six
 * hardcoded `['prospecting','qualified',…]` literals, and a six-element column
 * array inside the Kanban board itself. None of them could know about a stage a
 * workspace added, and the board's array silently DROPPED any deal whose stage
 * was not one of its six — two live deals were invisible on the pipeline board
 * for exactly that reason.
 *
 * `dealsApi.getPipelines()` already existed and returned `any[]`, called by
 * nothing. This is the typed replacement; the untyped one is removed in the same
 * change so there is one way to ask.
 */

const API_BASE = 'http://localhost:5001/api/v1';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** A stage exactly as `pipeline_stages` stores it. */
export interface ApiStage {
  id: string;
  pipeline_id: string;
  /**
   * The stable machine key. This — not `name` and not `id` — is what
   * `deals.stage` holds and what every stage API takes, so it survives a rename.
   */
  slug: string;
  name: string;
  /** null when the workspace has not set one. NOT 0: zero would be a claim. */
  probability: number | null;
  position: number;
  /** Hex, e.g. '#3B82F6'. Stored per stage so a renamed stage keeps its colour. */
  color: string | null;
  stage_type: 'open' | 'won' | 'lost';
  /** Non-null means retired: it still holds its deals, but nothing new enters. */
  archived_at: string | null;
}

export interface ApiPipeline {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  /** Ordered by `position`, ascending — the server sorts, the client does not. */
  stages: ApiStage[];
}

/**
 * GET /pipelines.
 *
 * Retired stages are excluded by default. Pass `includeArchived` for a board
 * that must still render a retired column because deals are sitting in it —
 * which is the whole point of retiring rather than deleting.
 *
 * Throws on failure rather than returning []. An empty list is a claim about the
 * workspace; a failed request is a claim about the request, and the two must not
 * look alike. `dealsApi.getPipelines` used to `return []` on error, so a broken
 * board and a workspace with no pipelines were indistinguishable.
 */
export async function fetchPipelines(includeArchived = false): Promise<ApiPipeline[]> {
  const qs = includeArchived ? '?include_archived=true' : '';
  const res = await fetch(`${API_BASE}/pipelines${qs}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.message || `Failed to load pipelines (HTTP ${res.status})`);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to load pipelines');
  return json.data as ApiPipeline[];
}

/**
 * The pipeline a board should open on: the workspace's default, else the first.
 *
 * Returns null for an empty list rather than inventing one. A workspace with no
 * pipeline cannot hold a deal at all (see CLAUDE.md), so a board that finds none
 * should say so, not render an empty six-column skeleton that looks like an
 * empty pipeline.
 */
export function defaultPipeline(pipelines: ApiPipeline[]): ApiPipeline | null {
  if (!pipelines.length) return null;
  return pipelines.find(p => p.is_default) ?? pipelines[0];
}

/**
 * A Tailwind background class for a stage column header.
 *
 * The stored colour is a hex string, but the board's columns want a light tinted
 * background, and interpolating arbitrary hex into a Tailwind class does not
 * work — Tailwind compiles the classes it can see at build time. Mapping the
 * known palette to real classes keeps the design system's rule intact (no active
 * stage uses green or red; those are reserved for terminal outcomes) and falls
 * back to a neutral tint for a colour the palette does not know, rather than
 * rendering no background at all.
 *
 * Open question 4 in the design proposes offering a fixed palette in the admin
 * UI for exactly this reason. Until that is settled this map is the seam.
 */
const HEX_TO_TINT: Record<string, string> = {
  '#6B7280': 'bg-slate-50',
  '#3B82F6': 'bg-sky-50',
  '#F59E0B': 'bg-amber-50',
  '#8B5CF6': 'bg-violet-50',
  '#10B981': 'bg-emerald-50',
  '#EF4444': 'bg-red-50',
  '#6366F1': 'bg-indigo-50',
};

export function stageTint(stage: Pick<ApiStage, 'color' | 'stage_type'>): string {
  const byHex = stage.color ? HEX_TO_TINT[stage.color.toUpperCase()] : undefined;
  if (byHex) return byHex;
  // Terminal stages keep their semantic colour even when the hex is unknown,
  // because won/lost carry meaning the palette must not lose.
  if (stage.stage_type === 'won') return 'bg-emerald-50';
  if (stage.stage_type === 'lost') return 'bg-red-50';
  return 'bg-slate-50';
}

/** The pipeline a deal belongs to, by slug. Null when it is not in the list. */
export function findPipeline(pipelines: ApiPipeline[], slug: string | null | undefined): ApiPipeline | null {
  if (!slug) return null;
  return pipelines.find(p => p.slug === slug) ?? null;
}

/**
 * The pipeline's terminal stage of a given kind.
 *
 * REPLACES A REAL BUG, not just a hardcoded constant. The deal detail page's
 * "Mark as Won" wrote the literal `'closed-won'` regardless of pipeline, so a
 * Renewals deal — whose won stage is `renewal-won` — was sent a stage that does
 * not exist in its pipeline. Before Phase A that wrote an invalid stage silently;
 * after it, the server refuses with a 400 and the user sees "Failed to update
 * deal stage" with no explanation. Neither is acceptable, and neither is fixable
 * without asking the pipeline which stage means "won".
 *
 * Archived stages are skipped: retiring an outcome stage should stop new deals
 * reaching it. Returns null when the pipeline has none, which the caller must
 * handle rather than falling back to a guess — migration 037 reports pipelines
 * in that state precisely because deals in them cannot be closed.
 */
export function terminalStage(
  pipeline: ApiPipeline | null,
  kind: 'won' | 'lost',
): ApiStage | null {
  if (!pipeline) return null;
  return pipeline.stages.find(s => s.stage_type === kind && !s.archived_at) ?? null;
}

/**
 * Where a stage sits in its pipeline, 1-based, for "Stage 3 of 6".
 *
 * Derived from the ORDER OF THE STAGE LIST rather than from `position`, because
 * position values need not be contiguous — a stage retired and excluded from the
 * response leaves a gap, and "Stage 4 of 5" with no third stage visible is worse
 * than renumbering what is actually shown.
 */
export function stageIndex(pipeline: ApiPipeline | null, slug: string | null | undefined): number | null {
  if (!pipeline || !slug) return null;
  const i = pipeline.stages.findIndex(s => s.slug === slug);
  return i < 0 ? null : i + 1;
}

/** The stored hex, or a semantic fallback so an outcome never loses its meaning. */
export function stageHex(stage: Pick<ApiStage, 'color' | 'stage_type'> | null | undefined): string {
  if (stage?.color) return stage.color;
  if (stage?.stage_type === 'won') return '#10B981';
  if (stage?.stage_type === 'lost') return '#EF4444';
  return '#6B7280';
}

/**
 * What a read-only surface needs to know about a stage.
 *
 * PHASE B SLICE 3. Sorting, grouping, colouring and health scoring all need
 * stage facts, and every one of them had invented its own copy — a stage-order
 * array, a substring test for "won", a hardcoded colour map. None could be right
 * for a pipeline the workspace configured itself.
 */
export interface StageMeta {
  slug: string;
  name: string;
  stage_type: 'open' | 'won' | 'lost';
  /** 1-based position among its pipeline's stages, for "Stage 3 of 6". */
  index: number;
  /** How many stages that pipeline has. */
  total: number;
  /** 1-based position among the OPEN stages only, or null for a terminal one. */
  openIndex: number | null;
  /**
   * The stage's default win probability, or NULL when the workspace has not set
   * one. NULL is not 0 — see `weightedProbability` below.
   */
  probability: number | null;
  /** How many open stages the pipeline has — the denominator for progress. */
  openTotal: number;
  color: string | null;
  archived: boolean;
}

/**
 * Resolve a stage by (pipeline, slug).
 *
 * THE PIPELINE ARGUMENT MATTERS. Stage slugs are unique per pipeline, not per
 * workspace — `UNIQUE (tenant_id, pipeline_id, slug)` — so two pipelines may
 * both have a `qualified`, and they may sit at different positions with
 * different colours. A lookup keyed on the slug alone would silently answer with
 * whichever pipeline happened to be first.
 *
 * When the pipeline is unknown the slug is matched across all of them, but ONLY
 * if exactly one pipeline has it. An ambiguous slug returns null rather than a
 * guess: "I do not know which stage you mean" is a better answer than a
 * confident wrong one, and every caller here degrades honestly on null.
 */
export type StageLookup = (stageSlug: string | null | undefined, pipelineSlug?: string | null) => StageMeta | null;

export function buildStageLookup(pipelines: ApiPipeline[]): StageLookup {
  const byPipeline = new Map<string, Map<string, StageMeta>>();
  /** slug -> every StageMeta with that slug, for the pipeline-less case. */
  const bySlug = new Map<string, StageMeta[]>();

  for (const p of pipelines) {
    const openStages = p.stages.filter(s => s.stage_type === 'open');
    const inner = new Map<string, StageMeta>();
    p.stages.forEach((s, i) => {
      const meta: StageMeta = {
        slug: s.slug,
        name: s.name,
        stage_type: s.stage_type,
        index: i + 1,
        total: p.stages.length,
        openIndex: s.stage_type === 'open' ? openStages.findIndex(o => o.slug === s.slug) + 1 : null,
        probability: s.probability,
        openTotal: openStages.length,
        color: s.color,
        archived: Boolean(s.archived_at),
      };
      inner.set(s.slug, meta);
      bySlug.set(s.slug, [...(bySlug.get(s.slug) ?? []), meta]);
    });
    byPipeline.set(p.slug, inner);
  }

  return (stageSlug, pipelineSlug) => {
    if (!stageSlug) return null;
    if (pipelineSlug) {
      const hit = byPipeline.get(pipelineSlug)?.get(stageSlug);
      if (hit) return hit;
    }
    const candidates = bySlug.get(stageSlug) ?? [];
    return candidates.length === 1 ? candidates[0] : null;
  };
}

/** A lookup that knows nothing — the honest state before pipelines load. */
export const EMPTY_STAGE_LOOKUP: StageLookup = () => null;

// ─── Stage configuration (admin only) ────────────────────────────────────────
// PIPELINE_STAGES_DESIGN.md §5. Every call here is admin-gated server-side; the
// UI hides the controls too, but the server is what enforces it.

async function write<T>(url: string, init: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: getAuthHeaders(), ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    // The server's own words — "A pipeline must keep at least one won stage",
    // "green and red are reserved for won and lost stages", "3 deals are still
    // in this stage". Every one of them is actionable, and a generic "Save
    // failed" would throw that away.
    const err = new Error(json?.message || `Request failed (${res.status})`) as Error & { status?: number; body?: any };
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json as T;
}

export interface StageDraft {
  name?: string;
  stage_type?: 'open' | 'won' | 'lost';
  probability?: number | null;
  color?: string;
  position?: number;
}

export const createStage = (pipelineId: string, draft: StageDraft) =>
  write<{ data: ApiStage }>(`${API_BASE}/pipelines/${pipelineId}/stages`, {
    method: 'POST', body: JSON.stringify(draft),
  }).then(r => r.data);

/** Rename, recolour, retype, retire. NEVER slug — the server refuses it. */
export const updateStage = (pipelineId: string, stageId: string, patch: StageDraft & { archived?: boolean }) =>
  write<{ data: ApiStage }>(`${API_BASE}/pipelines/${pipelineId}/stages/${stageId}`, {
    method: 'PATCH', body: JSON.stringify(patch),
  }).then(r => r.data);

/** Takes the COMPLETE order. A partial list is refused by the server. */
export const reorderStages = (pipelineId: string, stageIds: string[]) =>
  write<{ data: ApiStage[] }>(`${API_BASE}/pipelines/${pipelineId}/stages/order`, {
    method: 'PUT', body: JSON.stringify({ stage_ids: stageIds }),
  }).then(r => r.data);

/** Blocks with 409 when deals are still in the stage, unless reassignTo is given. */
export const deleteStage = (pipelineId: string, stageId: string, reassignTo?: string) =>
  write<{ deals_reassigned: number; message: string }>(
    `${API_BASE}/pipelines/${pipelineId}/stages/${stageId}${reassignTo ? `?reassign_to=${encodeURIComponent(reassignTo)}` : ''}`,
    { method: 'DELETE' },
  );

export interface PaletteColor { name: string; hex: string; outcome_only: boolean }

/**
 * The colours an admin may choose from — FETCHED, not hardcoded here.
 *
 * Design open question 4, settled with this screen: a free colour picker cannot
 * coexist with "no active stage uses green or red, those are reserved for
 * terminal outcomes", because an admin picking green for an open stage does not
 * see a rule being broken. The server owns the list and rejects anything else,
 * so a second copy in the client could only ever drift out of agreement with it.
 */
export const fetchPalette = () =>
  write<{ data: PaletteColor[] }>(`${API_BASE}/pipelines/palette`, { method: 'GET' }).then(r => r.data);

/**
 * A deal, as far as outcome classification is concerned.
 *
 * The predicates below are GENERIC over this rather than taking it directly,
 * and both alternatives were tried and rejected against the real call sites:
 *
 *  - Taking `StagedDeal` plainly rejects test fixtures written as object
 *    literals, because excess-property checking fires on a fresh literal.
 *  - Adding an index signature fixes that and breaks the opposite direction:
 *    `deals.filter(isOpenWith(lookup))` over a `DashboardDeal[]` then fails,
 *    because an exact interface is not assignable to one with an index
 *    signature.
 *
 * A generic parameter infers the caller's own type and satisfies both.
 */
export interface StagedDeal {
  stage?: string | null;
  pipeline_id?: string | null;
  pipelineId?: string | null;
}

/**
 * "Is this deal won / lost / still open", asked of the workspace's own
 * configuration.
 *
 * THE SHAPE IS DELIBERATE: the lookup comes FIRST and a predicate comes back.
 * The obvious alternative — `isClosedWon(deal, meta?)` — is a trap, because
 * these are used as `deals.filter(isClosedWon)` and `Array.prototype.filter`
 * passes (element, INDEX, array). The optional second parameter would silently
 * receive a number, `meta.stage_type` would be undefined, and every deal would
 * classify as open with no error anywhere. Currying makes the call sites fail to
 * compile instead, which is the direction this codebase wants.
 *
 * An unresolvable stage is NOT closed. Same default the literal comparisons had,
 * so a failed pipelines fetch degrades to the old behaviour rather than a new
 * wrong one — and counting a deal as open understates a win rate rather than
 * inflating it.
 */
export const outcomeOf = (lookup: StageLookup) => <T extends StagedDeal>(d: T): 'open' | 'won' | 'lost' =>
  lookup(d.stage, d.pipeline_id ?? d.pipelineId ?? null)?.stage_type ?? 'open';

export const isWonWith  = (lookup: StageLookup) => <T extends StagedDeal>(d: T) => outcomeOf(lookup)(d) === 'won';
export const isLostWith = (lookup: StageLookup) => <T extends StagedDeal>(d: T) => outcomeOf(lookup)(d) === 'lost';
export const isOpenWith = (lookup: StageLookup) => <T extends StagedDeal>(d: T) => outcomeOf(lookup)(d) === 'open';


/**
 * The probability to weight a deal by — or NULL, meaning "do not weight it".
 *
 * DESIGN QUESTION 3, SETTLED: a deal whose probability is not set is EXCLUDED
 * from a weighted forecast, not counted as zero.
 *
 * Zero is a claim. It says "this deal will not close", which is a forecast, and
 * a forecast nobody made. Summing it in drags the total down by exactly the
 * amount of every deal nobody has assessed yet, and does so invisibly — the
 * number simply looks smaller. Excluding it means the total is the weighted
 * value of the deals that HAVE been assessed, which is a statement that can be
 * defended, provided the count of exclusions is shown alongside it.
 *
 * The deal's OWN probability wins when set, because a rep may have overridden
 * the stage default deliberately and that judgement outranks the configuration.
 * A deal with no probability of its own falls back to its stage's. Only when
 * neither exists is the answer NULL.
 *
 * Note `?? `, not `||`: a probability of 0 IS a set value — a deal explicitly
 * assessed as dead — and `||` would treat it as unset and silently exclude the
 * one case where zero is a real answer.
 */
export function weightedProbability<T extends StagedDeal & { probability?: number | null }>(
  deal: T,
  lookup: StageLookup,
): number | null {
  if (typeof deal.probability === 'number') return deal.probability;
  return lookup(deal.stage, deal.pipeline_id ?? deal.pipelineId ?? null)?.probability ?? null;
}
