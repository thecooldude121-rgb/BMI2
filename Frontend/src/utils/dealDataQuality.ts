/**
 * dealDataQuality.ts — Pipeline hygiene / data quality engine.
 *
 * Detects missing or invalid fields on active deals and returns a prioritised
 * list of issues with severity (error | warning) and the field to fix.
 *
 * Pure function — no React, no API calls, fully unit-testable.
 * Closed-Lost deals are always skipped — they're done.
 */

import type { StageMeta } from './pipelinesApi';

export type DQSeverity = 'error' | 'warning';

export type DQIssueType =
  | 'missing_owner'
  | 'missing_close_date'
  | 'overdue_ghost'
  | 'closed_won_no_close_date'
  | 'missing_contact'
  | 'stage_requires_contact'
  | 'missing_next_step'
  | 'stage_requires_next_step';

export interface DataQualityIssue {
  type: DQIssueType;
  severity: DQSeverity;
  message: string;
  fixField?: string;   // field key for inline edit; 'contact' means navigate to detail
  canAutoFix?: boolean; // only true for missing_owner (assign-to-self)
}

export interface DealDQResult {
  issues: DataQualityIssue[];
  hasErrors: boolean;
  hasWarnings: boolean;
  isClean: boolean;
}

// Minimum shape required — matches the Deal interface in DealsListView.tsx.
export interface DealForDQ {
  stage?: string;
  owner?: string;
  closeDate?: string;
  contactName?: string;
  nextStep?: string;
}

// ── Stage helpers ─────────────────────────────────────────────────────────────

function stageLower(deal: DealForDQ): string {
  return (deal.stage ?? '').toLowerCase();
}

/*
 * OUTCOME DETECTION BY stage_type, NOT BY SUBSTRING.
 *
 * These three functions tested `stage.includes('won')`, `.includes('lost')` and
 * `.includes('closed')`. That is the same suffix heuristic migration 037
 * refused, and it was ALREADY WRONG on this product's own shipped stages:
 * the Partnerships pipeline ends at `partner-active` (won) and
 * `partner-inactive` (lost), and neither string contains "won", "lost" or
 * "closed". So a won partnerships deal was treated as open and flagged for a
 * missing next step, a missing close date and everything else this engine
 * checks on live deals.
 *
 * It fails the other way too: a workspace stage called "Won Back" — an ordinary
 * re-engagement stage — would have been classified as a closed win.
 *
 * With no metadata the answer is "not closed", which is the same default as
 * before and errs toward showing a data-quality warning rather than hiding one.
 */
function isClosedLost(_deal: DealForDQ, meta?: StageMeta | null): boolean {
  return meta?.stage_type === 'lost';
}

function isClosedWon(_deal: DealForDQ, meta?: StageMeta | null): boolean {
  return meta?.stage_type === 'won';
}

function isClosedStage(_deal: DealForDQ, meta?: StageMeta | null): boolean {
  return meta ? meta.stage_type !== 'open' : false;
}

// ── Main function ─────────────────────────────────────────────────────────────

export function getDealDataQuality(deal: DealForDQ, stageMeta?: StageMeta | null): DealDQResult {
  // Closed-lost deals are done — no DQ checks apply
  if (isClosedLost(deal, stageMeta)) {
    return { issues: [], hasErrors: false, hasWarnings: false, isClean: true };
  }

  const issues: DataQualityIssue[] = [];
  const sl = stageLower(deal);
  const isClosed = isClosedStage(deal, stageMeta);

  // ── ERRORS ────────────────────────────────────────────────────────────────

  // Missing or placeholder owner
  const hasOwner = !!(deal.owner?.trim()) && deal.owner.trim().toLowerCase() !== 'unassigned';
  if (!hasOwner) {
    issues.push({
      type: 'missing_owner',
      severity: 'error',
      message: 'No owner assigned — deal is not accountable in forecast',
      fixField: 'owner',
      canAutoFix: true,
    });
  }

  // Close date checks
  const hasCloseDate = !!(deal.closeDate?.trim());
  if (isClosedWon(deal, stageMeta) && !hasCloseDate) {
    // Closed-Won with no close date is a reporting blocker
    issues.push({
      type: 'closed_won_no_close_date',
      severity: 'error',
      message: 'Closed-Won deal has no close date — required for reporting',
      fixField: 'closeDate',
    });
  } else if (!isClosed && !hasCloseDate) {
    // Active deal with no close date can't be forecast
    issues.push({
      type: 'missing_close_date',
      severity: 'error',
      message: 'No close date set — deal cannot be included in pipeline forecast',
      fixField: 'closeDate',
    });
  } else if (!isClosed && hasCloseDate) {
    // Active deal whose close date has already passed
    const daysOver = Math.ceil((Date.now() - new Date(deal.closeDate!).getTime()) / 86_400_000);
    if (daysOver > 0) {
      issues.push({
        type: 'overdue_ghost',
        severity: 'error',
        message: `Close date passed ${daysOver} day${daysOver !== 1 ? 's' : ''} ago — mark won, lost, or reschedule`,
        fixField: 'closeDate',
      });
    }
  }

  // ── WARNINGS ──────────────────────────────────────────────────────────────

  // Missing primary contact
  const hasContact = !!(deal.contactName?.trim());
  const stageRequiresContact = ['proposal', 'negotiation'].some(s => sl.includes(s));
  if (!hasContact) {
    const stageName = (deal.stage ?? '').replace('-', ' ');
    const capitalised = stageName.charAt(0).toUpperCase() + stageName.slice(1);
    issues.push({
      type: stageRequiresContact ? 'stage_requires_contact' : 'missing_contact',
      severity: 'warning',
      message: stageRequiresContact
        ? `${capitalised} stage requires a primary contact — add one now`
        : 'No primary contact linked — add one to track engagement',
      fixField: 'contact',
    });
  }

  // Missing next step (skipped for early stages and closed deals)
  // Position, not name. `['prospecting','qualified'].some(s => sl.includes(s))`
  // named two new-business stages, so in any other pipeline EVERY open stage was
  // "late" and demanded a next step. First half of the open stages is "early" —
  // a rule that means the same thing in a four-stage pipeline and a nine-stage
  // one. Falls back to the old behaviour of "not early" when unresolvable, which
  // shows a warning rather than hiding one.
  const isEarlyStage = stageMeta?.openIndex
    ? stageMeta.openIndex <= Math.ceil(stageMeta.openTotal / 2)
    : false;
  // The last open stage before the outcome is where a next step matters most.
  const stageRequiresNextStep = Boolean(
    stageMeta?.openIndex && stageMeta.openIndex === stageMeta.openTotal,
  );
  const hasNextStep = !!(deal.nextStep?.trim());
  if (!isClosed && !isEarlyStage && !hasNextStep) {
    issues.push({
      type: stageRequiresNextStep ? 'stage_requires_next_step' : 'missing_next_step',
      severity: 'warning',
      message: stageRequiresNextStep
        ? 'Negotiation stage requires a defined next step'
        : 'No next step defined — set one to keep this deal moving',
      fixField: 'nextStep',
    });
  }

  const hasErrors = issues.some(i => i.severity === 'error');
  const hasWarnings = issues.some(i => i.severity === 'warning');

  return { issues, hasErrors, hasWarnings, isClean: issues.length === 0 };
}
