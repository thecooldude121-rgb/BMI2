// ─── Deal Health Score ────────────────────────────────────────────────────────
// Pure function — no React, no side-effects, fully unit-testable.
// Scores deal record quality (completeness + richness), not win likelihood.
// Win probability lives in calculateWinProbability(); these are distinct metrics.

import { hasSeniorBuyer, StakeholderContact } from '../config/contactRoles';

export type HealthTier = 'red' | 'yellow' | 'green';
export type ItemStatus = 'earned' | 'partial' | 'missing';

export interface HealthScoreItem {
  id: string;
  label: string;
  earned: number;   // points earned
  max: number;      // max available
  status: ItemStatus;
  tip: string;      // what to do to earn missing/partial points
}

export interface DealHealthResult {
  score: number;          // 0–100
  tier: HealthTier;
  label: string;          // motivational tier label
  items: HealthScoreItem[];
}

// ─── Tier thresholds ──────────────────────────────────────────────────────────
const getTier = (score: number): { tier: HealthTier; label: string } => {
  if (score >= 90) return { tier: 'green',  label: 'Deal-Ready ✓'    };
  if (score >= 70) return { tier: 'green',  label: 'Almost Deal-Ready' };
  if (score >= 40) return { tier: 'yellow', label: 'Getting There'    };
  if (score >= 20) return { tier: 'red',    label: 'Needs Work'       };
  return               { tier: 'red',    label: "Let's Get Started" };
};

// ─── Main scorer ──────────────────────────────────────────────────────────────
export const calculateDealHealthScore = (formData: any): DealHealthResult => {
  const additionalContacts: StakeholderContact[] = formData.additionalContacts ?? [];
  const items: HealthScoreItem[] = [];

  // ── 1. Deal name (10 pts) ───────────────────────────────────────────────────
  const hasName = !!formData.dealName?.trim();
  items.push({
    id: 'deal-name',
    label: 'Deal name',
    earned: hasName ? 10 : 0,
    max: 10,
    status: hasName ? 'earned' : 'missing',
    tip: 'Enter a descriptive deal name',
  });

  // ── 2. Deal value (15 pts) ──────────────────────────────────────────────────
  const rawValue = parseFloat((formData.dealValue ?? '').toString().replace(/,/g, ''));
  const hasValue = !isNaN(rawValue) && rawValue > 0;
  items.push({
    id: 'deal-value',
    label: 'Deal value entered',
    earned: hasValue ? 15 : 0,
    max: 15,
    status: hasValue ? 'earned' : 'missing',
    tip: 'Enter the expected deal amount for forecasting',
  });

  // ── 3. Close date (10 pts) ──────────────────────────────────────────────────
  const hasDate = !!formData.closeDate;
  items.push({
    id: 'close-date',
    label: 'Close date set',
    earned: hasDate ? 10 : 0,
    max: 10,
    status: hasDate ? 'earned' : 'missing',
    tip: 'Set a target close date to enable pipeline forecasting',
  });

  // ── 4. Account + primary contact (15 pts) ──────────────────────────────────
  const hasAccount = !!formData.accountName?.trim();
  const hasContact = !!formData.primaryContactName?.trim();
  const accountContactEarned = (hasAccount ? 10 : 0) + (hasContact ? 5 : 0);
  const accountContactStatus: ItemStatus =
    accountContactEarned === 15 ? 'earned' :
    accountContactEarned > 0   ? 'partial' : 'missing';
  items.push({
    id: 'account-contact',
    label: 'Account + contact linked',
    earned: accountContactEarned,
    max: 15,
    status: accountContactStatus,
    tip: !hasAccount
      ? 'Link an account to this deal'
      : 'Add a primary contact to the deal',
  });

  // ── 5. Senior buyer coverage (15 pts) ──────────────────────────────────────
  const hasBuyer = hasSeniorBuyer(formData.contactRole, additionalContacts);
  items.push({
    id: 'senior-buyer',
    label: 'Decision maker / buyer attached',
    earned: hasBuyer ? 15 : 0,
    max: 15,
    status: hasBuyer ? 'earned' : 'missing',
    tip: 'Add a stakeholder with a Decision Maker or Economic Buyer role',
  });

  // ── 6. Next steps (10 pts) ──────────────────────────────────────────────────
  const nextStepsLen = (formData.nextSteps ?? '').trim().length;
  const nextStepsEarned = nextStepsLen > 20 ? 10 : nextStepsLen > 0 ? 5 : 0;
  const nextStepsStatus: ItemStatus =
    nextStepsEarned === 10 ? 'earned' :
    nextStepsEarned > 0    ? 'partial' : 'missing';
  items.push({
    id: 'next-steps',
    label: 'Next steps defined',
    earned: nextStepsEarned,
    max: 10,
    status: nextStepsStatus,
    tip: nextStepsLen === 0
      ? 'Describe what happens next to move the deal forward'
      : 'Expand next steps with more detail (20+ characters)',
  });

  // ── 7. Product selected (5 pts) ────────────────────────────────────────────
  const hasProduct = !!formData.product?.trim();
  items.push({
    id: 'product',
    label: 'Product / package selected',
    earned: hasProduct ? 5 : 0,
    max: 5,
    status: hasProduct ? 'earned' : 'missing',
    tip: 'Select the product or package being sold',
  });

  // ── 8. Source set (5 pts) ──────────────────────────────────────────────────
  const hasSource = !!formData.source?.trim();
  items.push({
    id: 'source',
    label: 'Deal source set',
    earned: hasSource ? 5 : 0,
    max: 5,
    status: hasSource ? 'earned' : 'missing',
    tip: 'Set the lead source for attribution reporting',
  });

  // ── 9. Description quality (10 pts) ────────────────────────────────────────
  const descLen = (formData.description ?? '').trim().length;
  const descEarned = descLen > 50 ? 10 : descLen > 0 ? 5 : 0;
  const descStatus: ItemStatus =
    descEarned === 10 ? 'earned' :
    descEarned > 0    ? 'partial' : 'missing';
  items.push({
    id: 'description',
    label: 'Description quality',
    earned: descEarned,
    max: 10,
    status: descStatus,
    tip: descLen === 0
      ? 'Add a description with context about this deal'
      : 'Expand description with more context (50+ characters)',
  });

  // ── 10. Deal type set (5 pts) ──────────────────────────────────────────────
  const hasDealType = !!formData.dealType?.trim();
  items.push({
    id: 'deal-type',
    label: 'Deal type classified',
    earned: hasDealType ? 5 : 0,
    max: 5,
    status: hasDealType ? 'earned' : 'missing',
    tip: 'Classify as New Business, Renewal, Upsell, etc.',
  });

  const score = Math.min(100, items.reduce((sum, i) => sum + i.earned, 0));
  return { score, ...getTier(score), items };
};
