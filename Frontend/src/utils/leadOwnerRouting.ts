export interface OwnerSuggestion {
  label: string;
  id: string;
}

export const ROUTING_TABLE: Record<string, OwnerSuggestion> = {
  'Website':  { label: 'SDR Team',        id: 'sdr_team' },
  'Lead Gen': { label: 'SDR Team',        id: 'sdr_team' },
  'HRMS':     { label: 'HR Partner',      id: 'hr_partner' },
  'Referral': { label: 'Account Manager', id: 'account_manager' },
};

// evaluateAssignmentRules is injected at startup to break the circular dep
// (evaluationEngine → leadOwnerRouting → evaluationEngine would be circular)
type EvalFn = (lead: { source?: string }, opts?: { peek?: boolean }) => { matched: boolean; assignedUserId: string | null; assignedUserLabel: string | null };
let _evaluate: EvalFn | null = null;
export function setEvaluator(fn: EvalFn): void { _evaluate = fn; }

export function suggestOwner(source: string): OwnerSuggestion | null {
  if (_evaluate) {
    const result = _evaluate({ source }, { peek: true });
    if (result.matched && result.assignedUserId) {
      return { id: result.assignedUserId, label: result.assignedUserLabel ?? result.assignedUserId };
    }
  }
  return ROUTING_TABLE[source] ?? null;
}

/**
 * NOT THE WORKSPACE ROSTER. Three invented people (John Smith, Sarah Johnson,
 * Mike Chen, ids user1-3) were removed 2026-10-03. The remaining entries are
 * placeholder queues with no backing users table rows. Replacing this with
 * GET /users is tracked in CLAUDE.md — it needs the lead-owner model decided
 * first (leads.assigned_to is free-text, not a user reference).
 */
export const TEAM_MEMBERS: { id: string; label: string }[] = [
  { id: 'sdr_team',          label: 'SDR Team' },
  { id: 'hr_partner',        label: 'HR Partner' },
  { id: 'account_manager',   label: 'Account Manager' },
];
