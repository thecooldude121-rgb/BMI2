import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lead } from '../types/lead';
import { fetchLeadsPage } from '../utils/leadsApi';
import type { LeadListQuery } from '../utils/leadsApi';

/**
 * Kanban lanes, each fetched from the SERVER with its own real total (step 5).
 *
 * The board used to split one client-side array — at most the API's default 50
 * leads — into lanes, so a lane's count was "how many of the first 50 are in
 * this stage", not how many leads are. Each lane now asks for its own stages
 * with the page's filters and shows "N of TOTAL", loading more on demand.
 */
export interface LaneDef { id: string; statuses: readonly string[] }
export interface LaneData { leads: Lead[]; total: number; loading: boolean; error: string | null }

const LANE_PAGE = 25;

export function useKanbanLanes(
  lanes: readonly LaneDef[],
  query: Omit<LeadListQuery, 'limit' | 'offset'>,
  enabled: boolean,
  refreshKey: number,
): { lanes: Record<string, LaneData>; loadMoreLane: (laneId: string) => void } {
  const [data, setData] = useState<Record<string, LaneData>>({});
  const seq = useRef(0);
  const key = JSON.stringify(query);

  useEffect(() => {
    if (!enabled) return;
    const mine = ++seq.current;
    setData(prev => Object.fromEntries(lanes.map(l => [l.id, { leads: prev[l.id]?.leads ?? [], total: prev[l.id]?.total ?? 0, loading: true, error: null }])));
    for (const lane of lanes) {
      fetchLeadsPage({ ...query, stages: [...lane.statuses], limit: LANE_PAGE, offset: 0 })
        .then(page => {
          if (mine !== seq.current) return;
          setData(prev => ({ ...prev, [lane.id]: { leads: page.leads, total: page.total, loading: false, error: null } }));
        })
        .catch(e => {
          if (mine !== seq.current) return;
          setData(prev => ({ ...prev, [lane.id]: { leads: [], total: 0, loading: false, error: e instanceof Error ? e.message : 'Could not load this lane.' } }));
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key, refreshKey]);

  const loadMoreLane = useCallback((laneId: string) => {
    const lane = lanes.find(l => l.id === laneId);
    const cur = data[laneId];
    if (!lane || !cur || cur.leads.length >= cur.total) return;
    const mine = seq.current;
    setData(prev => ({ ...prev, [laneId]: { ...prev[laneId], loading: true } }));
    fetchLeadsPage({ ...query, stages: [...lane.statuses], limit: LANE_PAGE, offset: cur.leads.length })
      .then(page => {
        if (mine !== seq.current) return;
        setData(prev => {
          const have = new Set(prev[laneId].leads.map(l => l.id));
          return { ...prev, [laneId]: { leads: [...prev[laneId].leads, ...page.leads.filter(l => !have.has(l.id))], total: page.total, loading: false, error: null } };
        });
      })
      .catch(e => {
        if (mine !== seq.current) return;
        setData(prev => ({ ...prev, [laneId]: { ...prev[laneId], loading: false, error: e instanceof Error ? e.message : 'Could not load more.' } }));
      });
  }, [lanes, data, query]);

  return { lanes: data, loadMoreLane };
}
