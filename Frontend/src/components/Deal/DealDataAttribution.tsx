import React, { useState } from 'react';
import { Database, Target, CheckCircle2, RefreshCw, ChevronDown } from 'lucide-react';
import { DataVerificationModal } from './DealActivityModals';
import { useToast } from '../../contexts/ToastContext';

const LS_KEY = 'bmi2_data_attribution_expanded';

interface DealDataAttributionProps {
  dataSources: {
    createdFrom: string[];
    enrichedFrom: string[];
    lastEnriched: string;
    accuracy: number;
  };
}

export const DealDataAttribution: React.FC<DealDataAttributionProps> = ({ dataSources }) => {
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(LS_KEY) === 'true'; }
    catch { return false; }
  });
  const [isEnriching, setIsEnriching]       = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    try { localStorage.setItem(LS_KEY, String(next)); } catch {}
  };

  const handleReEnrich = () => {
    setIsEnriching(true);
    showToast('Refreshing deal data from all sources...', 'info');
    setTimeout(() => {
      setIsEnriching(false);
      showToast('Deal data refreshed successfully!', 'success');
    }, 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── Header — always visible ── */}
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-gray-500" />
          <span className="text-base font-semibold text-gray-700">Data & Attribution</span>
          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded tracking-wide">
            ATTRIBUTION
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ── Collapsible body ── */}
      {isOpen && (
        <div className="px-6 pb-6 pt-4 border-t border-gray-100 space-y-4">

          {/* Created from */}
          <div>
            <div className="text-sm font-semibold text-gray-700 mb-2">Deal created from:</div>
            <div className="space-y-1">
              {dataSources.createdFrom.map((source, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-gray-900">{source}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Enriched from */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-2">Enriched from:</div>
            <div className="space-y-1">
              {dataSources.enrichedFrom.map((source, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-900">{source}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Last enriched + accuracy + action buttons */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-1">
              Last enriched:{' '}
              <span className="font-medium text-gray-900">{dataSources.lastEnriched}</span>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              Accuracy:{' '}
              <span className="font-medium text-green-600">{dataSources.accuracy}%</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReEnrich}
                disabled={isEnriching}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <RefreshCw className={`h-4 w-4 ${isEnriching ? 'animate-spin' : ''}`} />
                {isEnriching ? 'Enriching...' : 'Re-enrich Now'}
              </button>
              <button
                onClick={() => setShowVerifyModal(true)}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Verify Data
              </button>
            </div>
          </div>
        </div>
      )}

      <DataVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onVerify={() => showToast('Data verified and updated!', 'success')}
        fieldsToVerify={[
          { field: 'Company Name',  currentValue: 'Acme Corp',      needsVerification: false },
          { field: 'Deal Amount',   currentValue: '$50,000',        needsVerification: false },
          { field: 'Close Date',    currentValue: 'March 15, 2026', needsVerification: true  },
          { field: 'Contact Email', currentValue: 'john@acme.com',  needsVerification: false },
          { field: 'Company Size',  currentValue: '75 employees',   needsVerification: true  },
          { field: 'Industry',      currentValue: 'SaaS',           needsVerification: false },
        ]}
      />
    </div>
  );
};
