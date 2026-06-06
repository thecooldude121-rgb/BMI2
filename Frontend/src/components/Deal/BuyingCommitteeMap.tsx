import React, { useState } from 'react';
import { Sparkles, Users, Plus } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMITTEE_ROLES = [
  'Economic Buyer',
  'Decision Maker',
  'Champion',
  'Technical Evaluator',
  'Executive Sponsor',
] as const;
type CommitteeRole = typeof COMMITTEE_ROLES[number];

// Node centers as % of container (SVG viewBox 0–100 maps to these same values)
const NODE_POSITIONS: Record<CommitteeRole, { x: number; y: number }> = {
  'Economic Buyer':     { x: 20, y: 8  },
  'Executive Sponsor':  { x: 80, y: 8  },
  'Decision Maker':     { x: 28, y: 47 },
  'Technical Evaluator':{ x: 72, y: 47 },
  'Champion':           { x: 50, y: 80 },
};

// Influence hierarchy flows top → bottom
const INFLUENCE_LINES: [CommitteeRole, CommitteeRole][] = [
  ['Economic Buyer',     'Decision Maker'],
  ['Executive Sponsor',  'Decision Maker'],
  ['Decision Maker',     'Champion'],
  ['Technical Evaluator','Champion'],
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommitteeContact {
  id: string;
  name: string;
  role: string;
  daysAgo?: number;
  lastContact?: string;
  status?: 'active' | 'pending';
}

interface BuyingCommitteeMapProps {
  contacts: CommitteeContact[];
  onAddContact?: (role?: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isPlaceholder = (name: string) =>
  !name || /\bTBD\b|\bUnknown\b/i.test(name.trim());

type NodeColor = 'green' | 'amber' | 'red';

function getNodeColor(contact: CommitteeContact | null): NodeColor {
  if (!contact || contact.status === 'pending' || contact.daysAgo == null) return 'red';
  if (contact.daysAgo <= 7)  return 'green';
  if (contact.daysAgo <= 21) return 'amber';
  return 'red';
}

const RING_CLASS: Record<NodeColor, string> = {
  green: 'ring-2 ring-green-400 ring-offset-1',
  amber: 'ring-2 ring-amber-400 ring-offset-1',
  red:   'ring-2 ring-red-400   ring-offset-1',
};

const DOT_CLASS: Record<NodeColor, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-400',
  red:   'bg-red-400',
};

const LAST_CONTACT_TEXT_CLASS: Record<NodeColor, string> = {
  green: 'text-green-700',
  amber: 'text-amber-700',
  red:   'text-red-600',
};

function getCoverageTheme(count: number) {
  if (count <= 2) return {
    label: 'Low Coverage',
    dotClass:   'bg-red-500',
    badgeClass: 'bg-red-50 text-red-800 border border-red-200',
  };
  if (count === 3) return {
    label: 'Medium Coverage',
    dotClass:   'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
  };
  return {
    label: 'Strong Coverage',
    dotClass:   'bg-green-500',
    badgeClass: 'bg-green-50 text-green-800 border border-green-200',
  };
}


// ─── Component ────────────────────────────────────────────────────────────────

export const BuyingCommitteeMap: React.FC<BuyingCommitteeMapProps> = ({
  contacts,
  onAddContact,
}) => {
  const [view, setView] = useState<'map' | 'list'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'map',
  );

  // Build one slot per committee role
  const slots = COMMITTEE_ROLES.map(role => ({
    role,
    contact: contacts.find(c => c.role === role && !isPlaceholder(c.name)) ?? null,
  }));

  const engaged  = slots.filter(s => s.contact !== null).length;
  const coverage = getCoverageTheme(engaged);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Buying Committee Map</h2>
        </div>
        <div className="flex">
          <button
            onClick={() => setView('map')}
            className={`px-3 py-1.5 text-sm font-medium rounded-l-lg border transition-colors ${
              view === 'map'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Map View
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-sm font-medium rounded-r-lg border-t border-b border-r transition-colors ${
              view === 'list'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* ── Coverage badge ── */}
      <div className="mb-5">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${coverage.badgeClass}`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${coverage.dotClass}`} />
          Buying Coverage: {engaged}/{COMMITTEE_ROLES.length} roles engaged · {coverage.label}
        </span>
      </div>

      {/* ── Map View ── */}
      {view === 'map' && (
        <div className="relative w-full h-[400px] select-none overflow-visible">

          {/* SVG influence lines — z below nodes */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {INFLUENCE_LINES.map(([from, to]) => {
              const a = NODE_POSITIONS[from];
              const b = NODE_POSITIONS[to];
              const fromContact = slots.find(s => s.role === from)?.contact ?? null;
              const toContact   = slots.find(s => s.role === to)?.contact   ?? null;
              const isDashed    = !fromContact || !toContact;
              return (
                <line
                  key={`${from}→${to}`}
                  x1={a.x} y1={a.y}
                  x2={b.x} y2={b.y}
                  stroke="#D1D5DB"
                  strokeWidth="0.8"
                  strokeOpacity="0.6"
                  strokeDasharray={isDashed ? '2 1.5' : undefined}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {slots.map(({ role, contact }) => {
            const pos      = NODE_POSITIONS[role as CommitteeRole];
            const color    = getNodeColor(contact);
            const initials = contact
              ? contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)
              : '';
            const tooltipText = contact
              ? `${contact.name} · Last contact: ${contact.daysAgo != null ? `${contact.daysAgo}d ago` : 'Never'}`
              : `Add ${role}`;

            return (
              <div
                key={role}
                /* hover:z-50 lifts the whole stacking context so the tooltip clears sibling nodes */
                className="absolute z-10 hover:z-50 flex flex-col items-center group"
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                {/* Hover tooltip */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none invisible group-hover:visible absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-[10px] rounded-md whitespace-nowrap z-20"
                >
                  {tooltipText}
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
                </div>

                {/* Avatar circle — real contact */}
                {contact ? (
                  <div
                    className={`w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-base font-bold flex-shrink-0 ${RING_CLASS[color]}`}
                  >
                    {initials}
                  </div>
                ) : (
                  /* Placeholder node — TBD */
                  <button
                    type="button"
                    onClick={() => onAddContact?.(role)}
                    className="w-14 h-14 rounded-full border-2 border-dashed border-red-400 bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:border-red-500 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                )}

                {/* Name + role label */}
                <div className="mt-1.5 flex flex-col items-center" style={{ width: 90, maxWidth: 90 }}>
                  {contact ? (
                    <>
                      <div
                        className="text-[11px] font-bold text-center text-gray-900 w-full"
                        style={{ whiteSpace: 'normal', lineHeight: 1.3 }}
                      >
                        {contact.name.split(' ')[0]}
                      </div>
                      <div
                        className="text-[10px] text-center text-gray-500 w-full"
                        style={{ whiteSpace: 'normal', lineHeight: 1.3 }}
                      >
                        {role}
                      </div>
                    </>
                  ) : (
                    <div
                      className="text-[11px] text-center text-gray-600 w-full"
                      style={{ whiteSpace: 'normal', lineHeight: 1.3 }}
                    >
                      {role}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-1 right-0 flex items-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400" />≤7 days
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />7–21 days
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400" />21d+ / none
            </span>
          </div>
        </div>
      )}

      {/* ── List View — compact role-coverage table ── */}
      {view === 'list' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4">Assigned To</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4 hidden sm:table-cell">Last Contact</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-2">Status</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {slots.map(({ role, contact }) => {
                const color = getNodeColor(contact);
                return (
                  <tr key={role}>
                    <td className="py-3 pr-4 font-medium text-gray-900 whitespace-nowrap">{role}</td>
                    <td className="py-3 pr-4">
                      {contact ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <span className="text-gray-900">{contact.name}</span>
                        </div>
                      ) : (
                        <span className="text-red-500">Not assigned</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      {contact?.lastContact ? (
                        <span className={LAST_CONTACT_TEXT_CLASS[color]}>
                          {contact.daysAgo}d ago
                        </span>
                      ) : (
                        <span className="text-red-500">Never</span>
                      )}
                    </td>
                    <td className="py-3 pr-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${DOT_CLASS[color]}`} />
                    </td>
                    <td className="py-3 text-right">
                      {!contact && (
                        <button
                          type="button"
                          onClick={() => onAddContact?.(role)}
                          className="px-2.5 py-1 text-xs font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
                        >
                          + Add
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── AI Insight ── */}
      <div className="mt-5 flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
        <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-purple-900">
          <span className="font-semibold">AI Insight:</span> Decision Maker and Economic Buyer not yet aligned — deals with both engaged close{' '}
          <span className="font-semibold">2.4× faster</span>
        </p>
      </div>
    </div>
  );
};
