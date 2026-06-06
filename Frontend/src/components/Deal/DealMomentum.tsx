import React, { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import type { MomentumResult, SignalStatus } from '../../utils/dealMomentum';

interface DealMomentumProps {
  result: MomentumResult;
}

const LEVEL_CONFIG = {
  accelerating: {
    badge: 'bg-green-100 text-green-800 border-green-200',
    icon: <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />,
    label: 'Accelerating',
    pulse: false,
  },
  stable: {
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <Minus className="h-3.5 w-3.5 flex-shrink-0" />,
    label: 'Stable',
    pulse: false,
  },
  decelerating: {
    badge: 'bg-red-100 text-red-700 border-red-200',
    icon: <TrendingDown className="h-3.5 w-3.5 flex-shrink-0" />,
    label: 'Decelerating',
    pulse: true,
  },
};

function signalIcon(status: SignalStatus, dataAvailable: boolean): React.ReactElement {
  if (!dataAvailable) return <MinusCircle className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />;
  if (status === 'positive') return <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />;
  if (status === 'negative') return <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />;
  return <MinusCircle className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />;
}

function signalDetailCx(status: SignalStatus, dataAvailable: boolean): string {
  if (!dataAvailable) return 'text-gray-400';
  if (status === 'positive') return 'text-green-700';
  if (status === 'negative') return 'text-red-600';
  return 'text-gray-500';
}

export const DealMomentum: React.FC<DealMomentumProps> = ({ result }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = LEVEL_CONFIG[result.level];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-opacity hover:opacity-75 ${cfg.badge} ${cfg.pulse ? 'animate-pulse' : ''}`}
      >
        {cfg.icon}
        <span>{cfg.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900">Deal Momentum</span>
            <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
              {cfg.icon}
              {cfg.label}
            </span>
          </div>
          <p className="px-4 pt-2 pb-0 text-xs text-gray-400">
            Score: {result.score > 0 ? '+' : ''}{result.score} / 5
          </p>

          {/* Signal rows */}
          <div className="py-2">
            {result.signals.map(signal => (
              <div key={signal.id} className="flex items-start gap-2.5 px-4 py-2 hover:bg-gray-50">
                {signalIcon(signal.status, signal.dataAvailable)}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-700 leading-none">{signal.label}</p>
                  <p className={`text-[11px] mt-0.5 leading-snug ${signalDetailCx(signal.status, signal.dataAvailable)}`}>
                    {signal.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
