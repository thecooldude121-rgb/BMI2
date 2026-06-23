import React, { useState } from 'react';
import type { LeadSLAResult, SLASeverity, SLATrack } from '../../utils/leadSla';

interface Props {
  result: LeadSLAResult;
}

// ── Track display helpers ─────────────────────────────────────────────────────

function fmtHours(h: number | null): string {
  if (h === null) return '—';
  if (Math.abs(h) < 1) return `${Math.round(Math.abs(h) * 60)}m`;
  return `${Math.abs(h).toFixed(1)}h`;
}

function fmtDays(h: number | null): string {
  if (h === null) return '—';
  const d = Math.abs(h) / 24;
  if (d < 1) return `${fmtHours(h)}`;
  return `${Math.floor(d)}d`;
}

function severityIcon(s: SLASeverity): string {
  switch (s) {
    case 'healthy':  return '✓';
    case 'at_risk':  return '⚠';
    case 'breached': return '✕';
    case 'na':       return '—';
  }
}

function severityText(s: SLASeverity): string {
  switch (s) {
    case 'healthy':  return 'Healthy';
    case 'at_risk':  return 'At Risk';
    case 'breached': return 'Breached';
    case 'na':       return 'N/A';
  }
}

const TRACK_CLS: Record<SLASeverity, string> = {
  healthy:  'text-green-600',
  at_risk:  'text-amber-600',
  breached: 'text-red-600',
  na:       'text-gray-400',
};

function TrackRow({ label, track, isStale }: { label: string; track: SLATrack; isStale?: boolean }) {
  const cls = TRACK_CLS[track.severity];
  const ageStr = isStale ? fmtDays(track.ageHours) : fmtHours(track.ageHours);
  const limitStr = isStale ? fmtDays(track.limitHours) : fmtHours(track.limitHours);

  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-1.5">
        <span className={`text-xs font-bold w-3 ${cls}`}>{severityIcon(track.severity)}</span>
        <span className="text-xs text-gray-700 font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 text-right">
        <span className={`text-xs font-semibold ${cls}`}>{severityText(track.severity)}</span>
        {track.resolvedAt ? (
          <span className="text-[10px] text-gray-400">resolved</span>
        ) : track.ageHours !== null && track.severity !== 'na' && (
          <span className="text-[10px] text-gray-400">
            {ageStr}{limitStr !== '—' ? ` / ${limitStr}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Compact pill ──────────────────────────────────────────────────────────────

const PILL_CLS: Partial<Record<SLASeverity, string>> = {
  at_risk:  'bg-amber-50 text-amber-700 border-amber-200',
  breached: 'bg-red-50 text-red-700 border-red-200',
};

const PILL_LABEL: Partial<Record<SLASeverity, string>> = {
  at_risk:  'SLA Risk',
  breached: 'SLA Breach',
};

export default function SLABadge({ result }: Props) {
  const [hovered, setHovered] = useState(false);

  const { overall, firstResponse, followUp, stale, escalate } = result;

  if (overall === 'healthy' || overall === 'na') return null;

  const pillCls = PILL_CLS[overall];
  const pillLabel = PILL_LABEL[overall] ?? overall;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Compact pill */}
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-semibold cursor-default select-none ${pillCls}`}>
        {overall === 'at_risk' ? '⚠' : '●'} {pillLabel}
        {escalate && <span className="ml-0.5 text-orange-500 font-bold" title="Escalation required">🔥</span>}
      </span>

      {/* Hover tooltip */}
      {hovered && (
        <div className="absolute bottom-full left-0 mb-1.5 z-50 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-700">SLA Status</span>
            {escalate && (
              <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-semibold">
                🔥 Escalation Required
              </span>
            )}
          </div>
          <TrackRow label="First Response" track={firstResponse} />
          <TrackRow label="Follow-Up" track={followUp} />
          <TrackRow label="Stale" track={stale} isStale />
        </div>
      )}
    </div>
  );
}

// ── Escalation flame for Identity cell ───────────────────────────────────────

export function EscalationMarker() {
  return (
    <span
      title="Manager escalation required — SLA exceeded threshold"
      className="text-orange-500 text-[11px] leading-none select-none cursor-default"
      aria-label="Escalation required"
    >
      🔥
    </span>
  );
}
