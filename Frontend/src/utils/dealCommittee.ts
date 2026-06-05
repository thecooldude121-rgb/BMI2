/**
 * dealCommittee.ts — buying-committee coverage model.
 *
 * Pure function — no React, no side-effects, fully unit-testable.
 * Takes the stakeholders array stored on a deal and returns a structured
 * CommitteeCoverage object consumed by the card indicator, the slideout
 * panel, and the health driver model.
 *
 * Critical roles (shown on card): decision-maker, champion, economic-buyer,
 *   legal-procurement — these are coverage gaps when missing.
 * Informational roles (slideout only): influencer, technical-evaluator, user.
 * Blocker role: blocker-detractor — presence is a risk, not a gap.
 */

import {
  CONTACT_ROLES,
  getContactRole,
  type ContactRole,
  type StakeholderContact,
} from '../config/contactRoles';

// ── Role groupings ────────────────────────────────────────────────────────────

/**
 * Roles that represent coverage gaps when nobody holds them.
 * Ordered by importance for the card dot display.
 */
export const REQUIRED_ROLE_IDS: readonly string[] = [
  'decision-maker',
  'champion',
  'economic-buyer',
  'legal-procurement',
] as const;

/** Roles shown in the full slideout list but not flagged as coverage gaps. */
export const INFORMATIONAL_ROLE_IDS: readonly string[] = [
  'influencer',
  'technical-evaluator',
  'user',
] as const;

export const BLOCKER_ROLE_ID = 'blocker-detractor';

// ── Public types ──────────────────────────────────────────────────────────────

export interface CommitteeCoverage {
  /** All stakeholders on this deal (primary + additional). */
  all: StakeholderContact[];

  /** Set of role IDs that have at least one person. */
  coveredRoleIds: Set<string>;

  /** Required roles with nobody assigned — each needs a person. */
  missingRequired: ContactRole[];

  /** Stakeholders with the blocker-detractor role. */
  blockers: StakeholderContact[];

  /** Stakeholders with the champion role. */
  champions: StakeholderContact[];

  /** Stakeholders with the decision-maker role. */
  decisionMakers: StakeholderContact[];

  /** Stakeholders with the economic-buyer role. */
  economicBuyers: StakeholderContact[];

  /** Stakeholders with the legal-procurement role. */
  legalProcurement: StakeholderContact[];

  /** True when the total contact count is ≤ 1. */
  isSingleThreaded: boolean;

  hasDecisionMaker: boolean;
  hasChampion: boolean;
  hasEconomicBuyer: boolean;

  /**
   * High-risk combination: a blocker exists but nobody is advocating
   * internally as a champion.
   */
  hasBlockerWithoutChampion: boolean;

  /**
   * 0–100 — percentage of required roles covered.
   * Denominator is REQUIRED_ROLE_IDS.length (4).
   */
  coverageScore: number;

  /** Human-readable tier for the slideout badge. */
  coverageLabel: 'Strong' | 'Moderate' | 'Weak';
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Compute buying-committee coverage from a stakeholder list.
 * Safe to call with an empty or undefined array.
 */
export function computeCommitteeCoverage(
  stakeholders: StakeholderContact[] | undefined | null,
): CommitteeCoverage {
  const all: StakeholderContact[] = stakeholders ?? [];

  const coveredRoleIds = new Set(all.map(s => s.role));

  const byRole = (roleId: string) => all.filter(s => s.role === roleId);

  const blockers       = byRole(BLOCKER_ROLE_ID);
  const champions      = byRole('champion');
  const decisionMakers = byRole('decision-maker');
  const economicBuyers = byRole('economic-buyer');
  const legalProcurement = byRole('legal-procurement');

  const missingRequired = REQUIRED_ROLE_IDS
    .filter(id => !coveredRoleIds.has(id))
    .map(id => getContactRole(id));

  const coveredCount  = REQUIRED_ROLE_IDS.filter(id => coveredRoleIds.has(id)).length;
  const coverageScore = Math.round((coveredCount / REQUIRED_ROLE_IDS.length) * 100);

  const coverageLabel: CommitteeCoverage['coverageLabel'] =
    coverageScore >= 75 ? 'Strong' :
    coverageScore >= 50 ? 'Moderate' : 'Weak';

  return {
    all,
    coveredRoleIds,
    missingRequired,
    blockers,
    champions,
    decisionMakers,
    economicBuyers,
    legalProcurement,
    isSingleThreaded:          all.length <= 1,
    hasDecisionMaker:          decisionMakers.length > 0,
    hasChampion:               champions.length > 0,
    hasEconomicBuyer:          economicBuyers.length > 0,
    hasBlockerWithoutChampion: blockers.length > 0 && champions.length === 0,
    coverageScore,
    coverageLabel,
  };
}
