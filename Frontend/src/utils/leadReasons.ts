// TODO: sync with settingsService win_loss_reasons table when backend integration is ready.
// Currently taxonomy is defined locally.

export type TerminalAction = 'disqualified' | 'lost';

export interface ReasonOption {
  value: string;
  label: string;
}

export const DISQUALIFIED_REASONS: ReasonOption[] = [
  { value: 'not_icp',            label: 'Not ICP' },
  { value: 'wrong_persona',      label: 'Wrong Persona' },
  { value: 'duplicate',          label: 'Duplicate' },
  { value: 'bad_data',           label: 'Bad Data' },
  { value: 'student_job_vendor', label: 'Student / Job / Vendor' },
  { value: 'nurture_later',      label: 'Nurture Later' },
  { value: 'other',              label: 'Other' },
];

export const LOST_REASONS: ReasonOption[] = [
  { value: 'no_budget',      label: 'No Budget' },
  { value: 'competitor',     label: 'Competitor' },
  { value: 'no_response',    label: 'No Response' },
  { value: 'timing',         label: 'Timing' },
  { value: 'champion_left',  label: 'Champion Left' },
  { value: 'product_gap',    label: 'Product Gap' },
  { value: 'deal_cancelled', label: 'Deal Cancelled' },
  { value: 'other',          label: 'Other' },
];

export function getReasonsForAction(action: TerminalAction): ReasonOption[] {
  return action === 'disqualified' ? DISQUALIFIED_REASONS : LOST_REASONS;
}

export function getReasonLabel(action: TerminalAction, value: string): string {
  return getReasonsForAction(action).find(r => r.value === value)?.label ?? value;
}
