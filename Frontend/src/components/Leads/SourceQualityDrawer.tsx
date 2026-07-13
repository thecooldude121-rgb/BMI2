import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, TrendingUp, Globe, Users, Zap, UserCheck, Linkedin, Mail,
  ChevronUp, ChevronDown,
} from 'lucide-react';
import type { SourceStats } from '../../utils/leadSourceAnalytics';

// ── Types ─────────────────────────────────────────────────────────────────────

type Scope    = 'all' | 'month' | 'week';
type SortCol  = keyof SourceStats;
type SortDir  = 'asc' | 'desc';

// ── Source icon ───────────────────────────────────────────────────────────────

function SourceIcon({ source }: { source: string }) {
  const s = source.toLowerCase();
  if (s === 'website')                       return <Globe     size={12} />;
  if (s === 'hrms' || s === 'recruitment')   return <Users     size={12} />;
  if (s === 'lead gen' || s === 'apollo')    return <Zap       size={12} />;
  if (s === 'referral' || s === 'manual')    return <UserCheck size={12} />;
  if (s === 'linkedin')                      return <Linkedin  size={12} />;
  if (s === 'cold email')                    return <Mail      size={12} />;
  return <TrendingUp size={12} />;
}

// ── Per-cell color ────────────────────────────────────────────────────────────

function cellColor(col: SortCol, value: number): string {
  switch (col) {
    case 'qualifiedRate':
      return value >= 30 ? 'text-green-700' : value >= 10 ? 'text-amber-600' : 'text-red-600';
    case 'conversionReadyRate':
      return value >= 20 ? 'text-green-700' : value >= 5 ? 'text-amber-600' : 'text-red-600';
    case 'staleRate':
      return value <= 10 ? 'text-green-700' : value <= 25 ? 'text-amber-600' : 'text-red-600';
    case 'duplicateRate':
      return value <= 5 ? 'text-green-700' : value <= 15 ? 'text-amber-600' : 'text-red-600';
    case 'disqualifiedRate':
      return value <= 10 ? 'text-green-700' : value <= 30 ? 'text-amber-600' : 'text-red-600';
    case 'slaBreachRate':
      return value <= 10 ? 'text-green-700' : value <= 25 ? 'text-amber-600' : 'text-red-600';
    case 'avgScore':
      return value >= 65 ? 'text-green-700' : value >= 40 ? 'text-amber-600' : 'text-red-600';
    default:
      return 'text-gray-700';
  }
}

// ── Column config ─────────────────────────────────────────────────────────────

const COLS: Array<{ key: SortCol; label: string; abbr: string; isRate: boolean }> = [
  { key: 'total',               label: 'Total leads',       abbr: 'Total',  isRate: false },
  { key: 'qualifiedRate',       label: 'Qualified rate',    abbr: 'Qual%',  isRate: true  },
  { key: 'conversionReadyRate', label: 'Conversion ready',  abbr: 'Ready%', isRate: true  },
  { key: 'slaBreachRate',       label: 'SLA breach rate',   abbr: 'SLA%',   isRate: true  },
  { key: 'duplicateRate',       label: 'Duplicate rate',    abbr: 'Dup%',   isRate: true  },
  { key: 'disqualifiedRate',    label: 'Disqualified rate', abbr: 'Disq%',  isRate: true  },
  { key: 'avgScore',            label: 'Average score',     abbr: 'Score',  isRate: false },
];

const SCOPE_LABELS: Record<Scope, string> = {
  all:   'All time',
  month: 'This month',
  week:  'This week',
};

// ── Drawer panel ──────────────────────────────────────────────────────────────

interface DrawerPanelProps {
  data:            { all: SourceStats[]; week: SourceStats[]; month: SourceStats[] };
  onClose:         () => void;
  onFilterSource:  (source: string) => void;
}

function DrawerPanel({ data, onClose, onFilterSource }: DrawerPanelProps) {
  const [visible,  setVisible]  = useState(false);
  const [scope,    setScope]    = useState<Scope>('all');
  const [sortCol,  setSortCol]  = useState<SortCol>('total');
  const [sortDir,  setSortDir]  = useState<SortDir>('desc');

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rows = data[scope];
  const sorted = [...rows].sort((a, b) => {
    const va = a[sortCol] as number;
    const vb = b[sortCol] as number;
    return sortDir === 'desc' ? vb - va : va - vb;
  });

  const totalLeads = rows.reduce((s, r) => s + r.total, 0);

  const handleColClick = (col: SortCol) => {
    if (col === sortCol) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 bg-black/25 z-40 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-[640px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-sm font-bold text-gray-900 whitespace-nowrap">Source Quality</h2>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden text-xs shrink-0">
              {(['all', 'month', 'week'] as Scope[]).map((s, i) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={`px-2.5 py-1 font-medium transition-colors ${i < 2 ? 'border-r border-gray-200' : ''} ${
                    scope === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto">
          {sorted.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm text-gray-400">
              No leads in this period
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest w-[150px]">
                    Source
                  </th>
                  {COLS.map(col => (
                    <th
                      key={col.key}
                      title={col.label}
                      className="px-2 py-3 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer select-none hover:bg-gray-100 transition-colors whitespace-nowrap"
                      onClick={() => handleColClick(col.key)}
                    >
                      <span className="inline-flex items-center justify-end gap-0.5">
                        {col.abbr}
                        {sortCol === col.key ? (
                          sortDir === 'desc'
                            ? <ChevronDown size={10} className="text-blue-500" />
                            : <ChevronUp   size={10} className="text-blue-500" />
                        ) : (
                          <span className="w-[10px] inline-block" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map(row => (
                  <tr
                    key={row.source}
                    className="hover:bg-blue-50 cursor-pointer transition-colors group"
                    onClick={() => { onFilterSource(row.source); onClose(); }}
                    title={`Filter to ${row.source}`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 font-medium text-gray-800">
                        <span className="text-gray-400 shrink-0">
                          <SourceIcon source={row.source} />
                        </span>
                        <span className="truncate">{row.source}</span>
                      </div>
                    </td>
                    {COLS.map(col => {
                      const val = row[col.key] as number;
                      const colorCls = col.key === 'total'
                        ? 'text-gray-700 font-semibold'
                        : `font-medium ${cellColor(col.key, val)}`;
                      return (
                        <td key={col.key} className="px-2 py-2.5 text-right tabular-nums">
                          <span className={colorCls}>
                            {col.isRate ? `${val}%` : val}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-[10px] text-gray-400 shrink-0">
          <span>{sorted.length} source{sorted.length !== 1 ? 's' : ''} · {totalLeads.toLocaleString()} lead{totalLeads !== 1 ? 's' : ''}</span>
          <span>Click a row to filter the leads list by source</span>
        </div>
      </div>
    </>
  );
}

// ── Portal wrapper ────────────────────────────────────────────────────────────

export interface SourceQualityDrawerProps {
  open:            boolean;
  data:            { all: SourceStats[]; week: SourceStats[]; month: SourceStats[] };
  onClose:         () => void;
  onFilterSource:  (source: string) => void;
}

export default function SourceQualityDrawer({ open, ...rest }: SourceQualityDrawerProps) {
  if (!open) return null;
  return createPortal(<DrawerPanel {...rest} />, document.body);
}
