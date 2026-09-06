import { useCallback } from 'react';
import type { Lead } from '../types/lead';
import type { FeedbackType } from '../utils/leadScoring/scoreFeedback';
import { appendAuditEvent } from '../utils/auditLog';
import { useCurrentUser } from '../contexts/CurrentUserContext';

// ── Hook ──────────────────────────────────────────────────────────────────────

// updateLead signature matches the one provided by useLeads() context
/**
 * LeadContext.updateLead returns Promise<boolean> — true when the API accepted
 * the write.
 *
 * Every action below now WAITS for that flag and only writes its audit event if
 * the write was accepted. It used to append the audit event first and ignore the
 * result, which produced two lies from one rejected request: the optimistic UI
 * showed the new value, and the audit trail recorded a change that never
 * happened. Observed live — picking "Assigned" from the status dropdown returned
 * HTTP 400 ("stage must be one of: new, contacted, qualified, proposal, won,
 * lost"), left `stage = new` in Postgres, and still rendered "Assigned".
 *
 * Order matters: write, then record. Not the reverse.
 */
export type UpdateLeadFn = (id: string, updates: Partial<Lead>) => Promise<boolean | void> | boolean | void;

export interface LeadActions {
  /** Resolves false when the server rejected the write — nothing was saved. */
  changeStatus:   (lead: Lead, toStatus: Lead['status'])                   => Promise<boolean>;
  changeOwner:    (lead: Lead, toOwnerId: string, toOwnerName?: string)    => Promise<boolean>;
  convert:        (lead: Lead, targetType: 'contact' | 'deal' | 'both', targetId?: string) => void;
  merge:          (lead: Lead, absorbedLeadId: string, absorbedLeadName: string) => void;
  disqualify:     (lead: Lead, reason: string, notes?: string)             => Promise<boolean>;
  markLost:       (lead: Lead, reason: string, notes?: string)             => Promise<boolean>;
  recordFeedback: (lead: Lead, feedback: FeedbackType, score: number)      => void;
}

export function useLeadActions(updateLead: UpdateLeadFn): LeadActions {
  const { currentUser } = useCurrentUser();

  const actor = useCallback(() => ({
    actorId:   currentUser.id,
    actorName: currentUser.name,
    actorRole: currentUser.role,
  }), [currentUser.id, currentUser.name, currentUser.role]);

  const changeStatus = useCallback(async (lead: Lead, toStatus: Lead['status']) => {
    const ok = (await updateLead(lead.id, { status: toStatus })) !== false;
    if (!ok) return false;
    appendAuditEvent({
      leadId: lead.id,
      ...actor(),
      type: 'status_changed',
      meta: { type: 'status_changed', fromStatus: lead.status, toStatus },
    });
    return true;
  }, [actor, updateLead]);

  const changeOwner = useCallback(async (lead: Lead, toOwnerId: string, toOwnerName?: string) => {
    const APPEND_OWNER = () => appendAuditEvent({
      leadId: lead.id,
      ...actor(),
      type: 'owner_changed',
      meta: { type: 'owner_changed', fromOwnerId: lead.owner_id ?? null, toOwnerId, toOwnerName },
    });
    const ok = (await updateLead(lead.id, { owner_id: toOwnerId })) !== false;
    if (!ok) return false;
    APPEND_OWNER();
    return true;
  }, [actor, updateLead]);

  const convert = useCallback((
    lead: Lead,
    targetType: 'contact' | 'deal' | 'both',
    targetId?: string,
  ) => {
    appendAuditEvent({
      leadId: lead.id,
      ...actor(),
      type: 'converted',
      meta: { type: 'converted', targetType, targetId },
    });
    // Actual lead update is handled by LeadConversionWizard; this is audit-only.
  }, [actor]);

  const merge = useCallback((
    lead: Lead,
    absorbedLeadId: string,
    absorbedLeadName: string,
  ) => {
    appendAuditEvent({
      leadId: lead.id,
      ...actor(),
      type: 'merged',
      meta: { type: 'merged', absorbedLeadId, absorbedLeadName },
    });
    // Actual lead updates handled by MergeReviewModal; this is audit-only.
  }, [actor]);

  const disqualify = useCallback(async (lead: Lead, reason: string, notes?: string) => {
    const APPEND_DISQ = () => appendAuditEvent({
      leadId: lead.id,
      ...actor(),
      type: 'disqualified',
      meta: { type: 'disqualified', reason, notes },
    });
    const ok = (await updateLead(lead.id, {
      status: 'disqualified',
      disqualified_reason: reason,
      ...(notes ? { disqualified_reason_notes: notes } : {}),
    } as Partial<Lead>)) !== false;
    if (!ok) return false;
    APPEND_DISQ();
    return true;
  }, [actor, updateLead]);

  const markLost = useCallback(async (lead: Lead, reason: string, notes?: string) => {
    const APPEND_LOST = () => appendAuditEvent({
      leadId: lead.id,
      ...actor(),
      type: 'lost',
      meta: { type: 'lost', reason, notes },
    });
    const ok = (await updateLead(lead.id, {
      status: 'lost',
      lost_reason: reason,
      ...(notes ? { lost_reason_notes: notes } : {}),
    } as Partial<Lead>)) !== false;
    if (!ok) return false;
    APPEND_LOST();
    return true;
  }, [actor, updateLead]);

  const recordFeedback = useCallback((lead: Lead, feedback: FeedbackType, score: number) => {
    appendAuditEvent({
      leadId: lead.id,
      ...actor(),
      type: 'score_feedback',
      meta: { type: 'score_feedback', feedback, score },
    });
    // submitFeedback() to scoring store is called separately at the callsite.
  }, [actor]);

  return { changeStatus, changeOwner, convert, merge, disqualify, markLost, recordFeedback };
}
