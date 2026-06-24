import type { Lead } from '../types/lead';
import { computeNBA } from './leadNBA/engine';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionId =
  | 'call_now'
  | 'contact_now'
  | 'follow_up_now'
  | 'contact'
  | 'follow_up'
  | 'check_in'
  | 'revive'
  | 'send_first_outreach'
  | 'book_discovery'
  | 'convert_to_contact'
  | 'convert_to_deal'
  | 'complete_qualification'
  | 'create_deal'
  | 'view_deal'
  | 'view_details'
  | 'edit_lead'
  | 'assign_owner'
  | 'add_tag'
  | 'enrich'
  | 'reenrich'
  | 'mark_nurture'
  | 'mark_disqualified'
  | 'merge_duplicate'
  | 'archive'
  | 'delete';

export type ActionVariant =
  | 'urgent'   // red filled — SLA breach, overdue+untouched
  | 'warn'     // amber border — overdue
  | 'ready'    // green filled — conversion ready
  | 'active'   // blue border — in-progress actions
  | 'teal'     // teal border — view deal / navigation
  | 'default'  // gray border — standard
  | 'muted'    // light gray — low-priority / stubs
  | 'danger';  // red text — destructive

export type LeadAction = {
  id:      ActionId;
  label:   string;
  variant: ActionVariant;
};

export type ActionGroup = {
  id:    string;
  items: LeadAction[];
};

export type LeadSignals = {
  isDuplicateRisk: boolean;
  isOverdue:       boolean;
  isUntouched:     boolean;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns the single most urgent call-to-action for a lead row.
 * Delegates to computeNBA for multi-factor prioritisation.
 */
export function getPrimaryAction(lead: Lead, signals: LeadSignals): LeadAction {
  return computeNBA(lead, signals).action;
}

/**
 * Returns grouped secondary actions for the ⋯ overflow menu.
 * Groups: nav → workflow → data → danger
 * Primary action is omitted from secondary to avoid duplication.
 */
export function getSecondaryActions(lead: Lead, signals: LeadSignals): ActionGroup[] {
  const primary = getPrimaryAction(lead, signals);
  const score   = lead.ai_score ?? lead.score ?? 0;

  // ── Group 1: Navigation ────────────────────────────────────────────────────
  const navItems: LeadAction[] = [
    { id: 'view_details', label: 'View Details', variant: 'default' },
    { id: 'edit_lead',    label: 'Edit Lead',    variant: 'default' },
  ];

  // ── Group 2: Workflow / pipeline ───────────────────────────────────────────
  const workflowItems: LeadAction[] = [];

  const CONTACT_CTA_IDS: ActionId[] = ['call_now', 'contact_now', 'follow_up_now', 'contact', 'follow_up', 'check_in'];

  // Contact entry-points (only when not already the primary)
  if (lead.status === 'new' && !CONTACT_CTA_IDS.includes(primary.id)) {
    workflowItems.push({ id: 'contact', label: 'Contact', variant: 'default' });
  }
  if (
    (lead.status === 'attempting_contact' || lead.status === 'engaged' || lead.status === 'nurture') &&
    primary.id !== 'follow_up' &&
    primary.id !== 'follow_up_now' &&
    primary.id !== 'check_in'
  ) {
    workflowItems.push({ id: 'follow_up', label: 'Follow up', variant: 'default' });
  }

  // Conversion actions
  if (lead.status === 'qualified') {
    if (primary.id !== 'convert_to_deal' && score >= 60) {
      workflowItems.push({ id: 'convert_to_deal', label: 'Convert to Deal', variant: 'ready' });
    }
    if (primary.id !== 'complete_qualification' && score < 60) {
      workflowItems.push({ id: 'complete_qualification', label: 'Complete Qualification', variant: 'active' });
    }
  }

  // Post-conversion deal linking (converted_at set but no deal linked yet)
  if (lead.converted_at && !lead.converted_to_deal_id) {
    workflowItems.push({ id: 'create_deal', label: 'Create Deal', variant: 'ready' });
  }

  // Navigate to linked deal
  if (lead.converted_to_deal_id && primary.id !== 'view_deal') {
    workflowItems.push({ id: 'view_deal', label: 'View Deal', variant: 'teal' });
  }

  // Status transitions
  const canNurture = !['nurture', 'converted', 'disqualified', 'lost'].includes(lead.status);
  const canDisqualify = !['disqualified', 'converted', 'lost'].includes(lead.status);
  if (canNurture) {
    workflowItems.push({ id: 'mark_nurture', label: 'Mark Nurturing', variant: 'muted' });
  }
  if (canDisqualify) {
    workflowItems.push({ id: 'mark_disqualified', label: 'Mark Disqualified', variant: 'muted' });
  }

  // ── Group 3: Data quality ──────────────────────────────────────────────────
  const dataItems: LeadAction[] = [
    { id: 'assign_owner', label: 'Assign Owner', variant: 'default' },
    { id: 'add_tag',      label: 'Add Tag',      variant: 'default' },
    lead.enriched_at
      ? { id: 'reenrich', label: 'Re-enrich', variant: 'muted' }
      : { id: 'enrich',   label: 'Enrich',    variant: 'default' },
  ];
  if (signals.isDuplicateRisk) {
    dataItems.push({ id: 'merge_duplicate', label: 'Merge Duplicate', variant: 'default' });
  }

  // ── Group 4: Danger ────────────────────────────────────────────────────────
  const dangerItems: LeadAction[] = [
    { id: 'archive', label: 'Archive', variant: 'muted' },
    { id: 'delete',  label: 'Delete',  variant: 'danger' },
  ];

  // Build final groups (omit empty workflow group)
  const groups: ActionGroup[] = [{ id: 'nav', items: navItems }];
  if (workflowItems.length > 0) groups.push({ id: 'workflow', items: workflowItems });
  groups.push({ id: 'data', items: dataItems });
  groups.push({ id: 'danger', items: dangerItems });

  return groups;
}
