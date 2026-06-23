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

export const TEAM_MEMBERS: { id: string; label: string }[] = [
  { id: 'sdr_team',          label: 'SDR Team' },
  { id: 'hr_partner',        label: 'HR Partner' },
  { id: 'account_manager',   label: 'Account Manager' },
  { id: 'user1',             label: 'John Smith' },
  { id: 'user2',             label: 'Sarah Johnson' },
  { id: 'user3',             label: 'Mike Chen' },
];
