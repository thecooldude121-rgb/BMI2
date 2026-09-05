import { useEffect, useMemo, useState } from 'react';
import {
  fetchPipelines, buildStageLookup, EMPTY_STAGE_LOOKUP,
  type ApiPipeline, type StageLookup,
} from '../utils/pipelinesApi';

/**
 * The workspace's stage configuration, for any surface that needs to know what a
 * deal's stage MEANS rather than just what it is called.
 *
 * PHASE C1. Twenty-nine sites across thirteen files decided "is this deal won"
 * by comparing the slug to the literal `'closed-won'`. That is correct only for
 * the default pipeline: a Renewals deal wins at `renewal-won` and a Partnerships
 * deal at `partner-active`, so every one of those sites counted a won deal as
 * open — in win rates, in forecasts, in dashboard tiles and in analytics.
 *
 * One hook rather than a fetch per page, so a page adds two lines instead of an
 * effect, a state, an error path and a race.
 */
export function useStageLookup(): { lookup: StageLookup; ready: boolean } {
  const [pipelines, setPipelines] = useState<ApiPipeline[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPipelines()
      .then(list => { if (!cancelled) setPipelines(list); })
      // A failed load leaves the lookup empty, and every consumer below treats
      // "unknown" as "not closed" — the same default the literal comparisons
      // had. It degrades to the old behaviour rather than to a wrong one.
      .catch(() => { if (!cancelled) setPipelines([]); });
    return () => { cancelled = true; };
  }, []);

  const lookup = useMemo(
    () => (pipelines ? buildStageLookup(pipelines) : EMPTY_STAGE_LOOKUP),
    [pipelines],
  );

  return { lookup, ready: pipelines !== null };
}
