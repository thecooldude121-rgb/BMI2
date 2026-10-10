import type { DealCard } from '../components/Deal/DealKanbanCard';
import { normalizeDateField } from './dateUtils';

/**
 * One API deal row -> a board card. Lifted out of the fetch effect so the
 * per-column pages and "load more" (Group A item 4, slices 2a/2b — the board and the list) map rows the
 * same way. `aiScore` and `probabilityRaw` both come from `probability`.
 */
export function mapApiDeal(d: any, stageSlug: string): DealCard {
  return {
            id: d.id,
            companyName: d.company_name || '',
            dealName: d.name || d.title || 'Untitled',
            accountName: d.company_name || '',
            amount: parseFloat(d.value) || 0,
            currency: d.currency || 'USD',
            // UNKNOWN stays unknown (migration 066): falling back to the native
            // value showed an INR deal as "≈ $125K". Consumers fall back to their
            // labelled client-side estimate when this is absent.
            baseAmountUsd: d.base_amount_usd != null && d.base_amount_usd !== '' ? parseFloat(d.base_amount_usd) : undefined,
            closeDate: normalizeDateField(d.expected_close_date),
            stage: stageSlug,
            aiScore: d.probability || 0,
            // NULL kept, unlike aiScore above — see DealCard.probabilityRaw.
            probabilityRaw: d.probability ?? null,
            contactName: d.contact_name || '',
            contactTitle: d.contact_title || '',
            owner: d.assigned_to || 'Unassigned',
            // Store raw ISO; formatRelativeTime() from dateUtils renders it human-readable on card
            lastActivity: d.updated_at || d.created_at || '',
            daysSinceContact: d.days_since_contact ?? 0,
            priority: (['high', 'medium', 'low'].includes(d.priority?.toLowerCase())
              ? d.priority.toLowerCase()
              : 'medium') as 'high' | 'medium' | 'low',
            health: (['healthy', 'at-risk', 'stalled'].includes(d.health)
              ? d.health
              : 'healthy') as 'healthy' | 'at-risk' | 'stalled',
            hasAccount: !!(d.company_name?.trim()),
            source: d.source || 'manual',
            nextStep: d.next_step || '',
            nextStepDueDate: normalizeDateField(d.next_step_due_date),
            nextStepOwner: d.next_step_owner || '',
            nextStepStatus: (['pending', 'done', 'overdue'].includes(d.next_step_status)
              ? d.next_step_status : 'pending') as 'pending' | 'done' | 'overdue',
            stakeholders: (() => {
              try {
                const s = typeof d.stakeholders === 'string'
                  ? JSON.parse(d.stakeholders) : (d.stakeholders ?? []);
                return Array.isArray(s) ? s : [];
              } catch { return []; }
            })(),
            contactCount: (() => {
              try {
                const s = typeof d.stakeholders === 'string'
                  ? JSON.parse(d.stakeholders) : (d.stakeholders ?? []);
                return (d.contact_name ? 1 : 0) + (Array.isArray(s) ? s.length : 0);
              } catch { return d.contact_name ? 1 : 0; }
            })(),
            competitorCount: (() => {
              try {
                const c = typeof d.competitors === 'string'
                  ? JSON.parse(d.competitors) : (d.competitors ?? []);
                return Array.isArray(c)
                  ? c.filter((x: any) => x && (typeof x === 'string' ? x.trim() : true)).length
                  : 0;
              } catch { return 0; }
            })(),
            createdAt: d.created_at || '',
            // PHASE 0: four blocks of fabricated fields were removed from here.
            // They derived values from `id.charCodeAt()` sums and spliced them
            // onto real database rows, so every downstream feature — relationship
            // risk, competitive intel, the data-quality drawer, the currency
            // selector — was scoring invented data while looking live:
            //
            //   1. stakeholderCount / hasChampion / lastMeetingDaysAgo
            //      → needs a deal_stakeholders table + activity join
            //   2. primaryCompetitor / secondaryCompetitors
            //      → needs a deal_competitors join table
            //   3. a block that blanked owner/closeDate/contactName on ~20% of
            //      REAL rows, labelled "for pipeline hygiene demo purposes".
            //      This overwrote correct data and made the DQ drawer flag
            //      healthy deals. Deleted outright — it has no replacement.
            //   4. currency/amount/baseAmountUsd at hardcoded FX rates
            //      → deals.currency and base_amount_usd already exist; read
            //        those instead of inventing a rate.
            //
            // All four fields are optional in the Deal type and every consumer
            // guards with `??` / truthiness, so these now render as "no data",
            // which is the truth. Do not reintroduce placeholder values here:
            // populate them from the API or leave them absent.
  };
}
