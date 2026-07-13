import { useCallback } from 'react';
import type { Lead } from '../types/lead';
import type { FeedbackType } from '../utils/leadScoring/scoreFeedback';
import { appendAuditEvent } from '../utils/auditLog';
import { useCurrentUser } from '../contexts/CurrentUserContext';

// ── Hook ──────────────────────────────────────────────────────────────────────

// updateLead signature matches the one provided by useLeads() context
export type UpdateLeadFn = (id: string, updates: Partial<Lead>) => Promise<void> | void;

export interface LeadActions {
  changeStatus:   (lead: Lead, toStatus: Lead['status'])                   => Promise<void>;
  changeOwner:    (lead: Lead, toOwnerId: string, toOwnerName?: string)    => Promise<void>;
  convert:        (lead: Lead, targetType: 'contact' | 'deal' | 'both', targetId?: string) => void;
  merge:          (lead: Lead, absorbedLeadId: string, absorbedLeadName: string) => void;
  disqualify:     (lead: Lead, reason: string, notes?: string)             => Promise<void>;
  markLost:       (lead: Lead, reason: string, notes?: string)             => Promise<void>;
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
    appendAuditEvent({
      leadId: lead.id,
      ...actor(),
      type: 'status_changed',
      meta: { type: 'status_changed', fromStatus: lead.status, toStatus },
    });
    await updateLead(lead.id, { status: toStatus });
  }, [actor, updateLead]);

  const changeOwner = useCallback(async (lead: Lead, toOwnerId: string, toOwnerName?: string) => {
    appendAuditEvent({
      leadId: lead.id,
      ...actor(),
      type: 'owner_changed',
      meta: { type: 'owner_changed', fromOwnerId: lead.owner_id ?? null, toOwnerId, toOwnerName },
    });
    await updateLead(lead.id, { owner_id: toOwnerId });
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
    appendAuditEvent({
      leadId: lead.id,
      ...actor(),
      type: 'disqualified',
      meta: { type: 'disqualified', reason, notes },
    });
    await updateLead(lead.id, {
      status: 'disqualified',
      disqualified_reason: reason,
      ...(notes ? { disqualified_reason_notes: notes } : {}),
    } as Partial<Lead>);
  }, [actor, updateLead]);

  const markLost = useCallback(async (lead: Lead, reason: string, notes?: string) => {
    appendAuditEvent({
      leadId: lead.id,
      ...actor(),
      type: 'lost',
      meta: { type: 'lost', reason, notes },
    });
    await updateLead(lead.id, {
      status: 'lost',
      lost_reason: reason,
      ...(notes ? { lost_reason_notes: notes } : {}),
    } as Partial<Lead>);
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
