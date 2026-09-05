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
