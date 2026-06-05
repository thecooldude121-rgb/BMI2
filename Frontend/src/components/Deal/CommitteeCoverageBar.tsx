/**
 * CommitteeCoverageBar — compact buying-committee indicator for Kanban cards.
 *
 * Shows 4 role dots (Decision Maker, Champion, Economic Buyer, Legal/Proc)
 * plus a blocker badge and coverage fraction.  Fits in a single row below
 * Zone 4 without adding visual weight when the deal is clean.
 *
 * Dot states:
 *   filled  = role is covered (colored per role)
 *   dashed  = role is missing (gray ring — draw attention without alarming)
 *   [Blk]   = blocker present — always shown in red as a warning
 */

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { getContactRole } from '../../config/contactRoles';
import {
  computeCommitteeCoverage,
  REQUIRED_ROLE_IDS,
  type CommitteeCoverage,
} from '../../utils/dealCommittee';
import type { StakeholderContact } from '../../config/contactRoles';

// ── Color map — dot fill colors keyed by ContactRole chipColor ────────────────

const CHIP_COLOR_HEX: Record<string, string> = {
  green:  '#10b981', // emerald-500  — decision-maker, economic-buyer
  blue:   '#3b82f6', // blue-500     — champion
  amber:  '#f59e0b', // amber-500    — legal-procurement, technical-evaluator
  purple: '#8b5cf6', // violet-500   — influencer
  gray:   '#9ca3af', // gray-400     — user
  red:    '#ef4444', // red-500      — blocker-detractor
};

// ── Sub-components ────────────────────────────────────────────────────────────

/** Single role dot with tooltip. */
const RoleDot: React.FC<{
  roleId: string;
  covered: boolean;
  people: StakeholderContact[];
}> = ({ roleId, covered, people }) => {
  const role  = getContactRole(roleId);
  const color = CHIP_COLOR_HEX[role.chipColor] ?? '#9ca3af';
  const names = people.map(p => p.name).join(', ');
  const tip   = covered
    ? `${role.label}: ${names}`
    : `${role.label}: not yet covered`;

  return (
    <span
      title={tip}
      aria-label={tip}
      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-opacity
        ${covered ? '' : 'border border-dashed border-gray-300'}`}
      style={covered ? { backgroundColor: color } : {}}
    />
  );
};

// ── Main component ────────────────────────────────────────────────────────────

interface CommitteeCoverageBarProps {
  stakeholders: StakeholderContact[] | undefined;
}

const CommitteeCoverageBar: React.FC<CommitteeCoverageBarProps> = ({ stakeholders }) => {
  const cov: CommitteeCoverage = computeCommitteeCoverage(stakeholders);

  // Don't render when there are no stakeholders at all — the card already
  // shows "single-threaded" via the health driver amber dot.
  if (cov.all.length === 0) return null;

  const coveredCount = REQUIRED_ROLE_IDS.filter(id => cov.coveredRoleIds.has(id)).length;

  return (
    <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-50">
      {/* Role dots */}
      <div className="flex items-center space-x-1.5">
        {REQUIRED_ROLE_IDS.map(roleId => {
          const people  = cov.all.filter(s => s.role === roleId);
          return (
            <RoleDot
              key={roleId}
              roleId={roleId}
              covered={cov.coveredRoleIds.has(roleId)}
              people={people}
            />
          );
        })}

        {/* Coverage fraction */}
        <span className="text-[10px] text-gray-400 ml-0.5 tabular-nums">
          {coveredCount}/{REQUIRED_ROLE_IDS.length}
        </span>
      </div>

      {/* Blocker badge — only shown when a blocker exists */}
      {cov.blockers.length > 0 && (
        <span
          className="flex items-center space-x-0.5 px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[9px] font-semibold flex-shrink-0"
          title={`Blocker: ${cov.blockers.map(b => b.name).join(', ')}`}
        >
          <ShieldAlert className="h-2.5 w-2.5" />
          <span>Blk</span>
        </span>
      )}

      {/* Missing DM warning — shown only when no blocker (avoid double warning) */}
      {!cov.hasDecisionMaker && cov.blockers.length === 0 && cov.all.length > 1 && (
        <span
          className="text-[9px] text-amber-600 font-medium flex-shrink-0"
          title="No decision maker linked to this deal"
        >
          No DM
        </span>
      )}
    </div>
  );
};

export default CommitteeCoverageBar;
