import React, { useState } from 'react';
import { CheckCircle2, X, AlertTriangle, ChevronDown, ChevronUp, Swords } from 'lucide-react';
import { ParsedEmailExtraction, ExtractionField, Suggestion } from '../../../utils/emailParser';
import { Competitor } from '../../../config/competitors';

// Maps parser field keys → form field names + display labels
const FIELD_CONFIG: Record<
  ExtractionField,
  { formField: string; label: string; format?: (v: any) => string }
> = {
  account:      { formField: 'accountName',        label: 'Account / Company' },
  contactName:  { formField: 'primaryContactName', label: 'Primary Contact' },
  contactEmail: { formField: '__contactEmail__',   label: 'Contact Email' }, // display-only
  dealName:     { formField: 'dealName',           label: 'Deal Name' },
  dealValue:    {
    formField: 'dealValue',
    label: 'Deal Value',
    format: (v: number) =>
      '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  },
  product:      { formField: 'product',    label: 'Product / Package' },
  nextSteps:    { formField: 'nextSteps',  label: 'Next Steps' },
  competitors:  { formField: 'competitors', label: 'Competing Against' },
  closeDate:    {
    formField: 'closeDate',
    label: 'Close Date',
    format: (v: string) =>
      new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  },
};

const CONFIDENCE_STYLES: Record<string, { pill: string; label: string }> = {
  high:   { pill: 'bg-green-100 text-green-700',   label: 'High confidence' },
  medium: { pill: 'bg-yellow-100 text-yellow-700', label: 'Medium confidence' },
  low:    { pill: 'bg-gray-100 text-gray-500',     label: 'Low confidence' },
};

interface Props {
  extraction: ParsedEmailExtraction;
  formData: Record<string, any>;
  onApply: (formField: string, value: any) => void;
  onDismiss: () => void;
}

export const EmailExtractionReview: React.FC<Props> = ({
  extraction,
  formData,
  onApply,
  onDismiss,
}) => {
  const fields = Object.keys(extraction) as ExtractionField[];
  const [accepted, setAccepted] = useState<Set<ExtractionField>>(new Set());
  const [skipped, setSkipped] = useState<Set<ExtractionField>>(new Set());
  const [evidenceOpen, setEvidenceOpen] = useState<Set<ExtractionField>>(new Set());

  const isDisplayOnly = (field: ExtractionField) =>
    FIELD_CONFIG[field]?.formField === '__contactEmail__';

  const applyField = (field: ExtractionField, suggestion: Suggestion<any>) => {
    const cfg = FIELD_CONFIG[field];
    if (!cfg || isDisplayOnly(field)) return;

    if (field === 'competitors') {
      // Merge incoming competitors with any already selected — never replace
      const incoming = suggestion.value as Competitor[];
      const existing: Competitor[] = formData['competitors'] ?? [];
      const existingIds = new Set(existing.map((c: Competitor) => c.id));
      const merged = [...existing, ...incoming.filter((c: Competitor) => !existingIds.has(c.id))];
      onApply('competitors', merged);
    } else {
      const value = field === 'dealValue' ? String(suggestion.value) : suggestion.value;
      onApply(cfg.formField, value);
    }

    setAccepted(prev => new Set(prev).add(field));
    setSkipped(prev => { const s = new Set(prev); s.delete(field); return s; });
  };

  const skipField = (field: ExtractionField) => {
    setSkipped(prev => new Set(prev).add(field));
    setAccepted(prev => { const s = new Set(prev); s.delete(field); return s; });
  };

  const acceptAll = () => {
    fields.forEach(field => {
      if (isDisplayOnly(field)) return;
      const suggestion = extraction[field] as Suggestion<any>;
      if (!suggestion || suggestion.confidence === 'low') return;
      applyField(field, suggestion);
    });
  };

  const actionableCount = fields.filter(
    f => !isDisplayOnly(f) && !accepted.has(f) && !skipped.has(f),
  ).length;

  const highMediumCount = fields.filter(
    f => !isDisplayOnly(f) && (extraction[f] as Suggestion<any>)?.confidence !== 'low',
  ).length;

  const toggleEvidence = (field: ExtractionField) => {
    setEvidenceOpen(prev => {
      const s = new Set(prev);
      s.has(field) ? s.delete(field) : s.add(field);
      return s;
    });
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-semibold text-gray-800">
            {fields.length} field{fields.length !== 1 ? 's' : ''} extracted
          </span>
          <span className="ml-2 text-xs text-gray-500">
            — review and apply below
          </span>
        </div>
        {highMediumCount > 0 && actionableCount > 0 && (
          <button
            onClick={acceptAll}
            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Accept high/medium ({highMediumCount})
          </button>
        )}
      </div>

      <div className="space-y-2">
        {fields.map(field => {
          const suggestion = extraction[field] as Suggestion<any>;
          const cfg = FIELD_CONFIG[field];
          if (!cfg || !suggestion) return null;

          const isAccepted = accepted.has(field);
          const isSkipped = skipped.has(field);

          // ── Competitors: chip-based card ──────────────────────────────────
          if (field === 'competitors') {
            const competitorList = suggestion.value as Competitor[];
            const showEvidence = evidenceOpen.has(field);
            return (
              <div
                key={field}
                className={`rounded-xl border p-3 transition-all ${
                  isAccepted
                    ? 'border-green-200 bg-green-50'
                    : isSkipped
                    ? 'border-gray-100 bg-gray-50 opacity-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Swords className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Competing Against
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CONFIDENCE_STYLES.medium.pill}`}>
                        medium
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {competitorList.map(c => (
                        <span
                          key={c.id}
                          className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-medium rounded border border-red-200"
                        >
                          {c.name}
                        </span>
                      ))}
                    </div>
                    {isAccepted && (
                      <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Applied to form
                      </p>
                    )}
                  </div>
                  {!isAccepted && !isSkipped && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => applyField(field, suggestion)}
                        className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => skipField(field)}
                        className="px-2.5 py-1 border border-gray-200 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                  {isAccepted && (
                    <button
                      onClick={() => skipField(field)}
                      className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
                      aria-label="Undo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => toggleEvidence(field)}
                  className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showEvidence ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showEvidence ? 'Hide source' : 'Show source'}
                </button>
                {showEvidence && (
                  <p className="mt-1 text-xs text-gray-400 italic bg-gray-50 rounded px-2 py-1 border border-gray-100 line-clamp-3">
                    "{suggestion.evidence}"
                  </p>
                )}
              </div>
            );
          }
          const displayOnly = isDisplayOnly(field);
          const confStyle = CONFIDENCE_STYLES[suggestion.confidence];
          const existingValue = formData[cfg.formField];
          const hasConflict = !displayOnly && existingValue && existingValue !== suggestion.value;
          const displayValue = cfg.format ? cfg.format(suggestion.value) : suggestion.value;
          const showEvidence = evidenceOpen.has(field);

          return (
            <div
              key={field}
              className={`rounded-xl border p-3 transition-all ${
                isAccepted
                  ? 'border-green-200 bg-green-50'
                  : isSkipped
                  ? 'border-gray-100 bg-gray-50 opacity-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {cfg.label}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${confStyle.pill}`}>
                      {suggestion.confidence}
                    </span>
                    {hasConflict && !isAccepted && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3" />
                        overwrites existing
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{displayValue}</p>
                  {hasConflict && !isAccepted && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Current: <span className="italic">{existingValue}</span>
                    </p>
                  )}
                  {isAccepted && (
                    <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Applied to form
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                {!displayOnly && !isAccepted && !isSkipped && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => applyField(field, suggestion)}
                      className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => skipField(field)}
                      className="px-2.5 py-1 border border-gray-200 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      Skip
                    </button>
                  </div>
                )}
                {isAccepted && (
                  <button
                    onClick={() => skipField(field)}
                    className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
                    aria-label="Undo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Evidence toggle */}
              <button
                onClick={() => toggleEvidence(field)}
                className="mt-1.5 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showEvidence ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showEvidence ? 'Hide source' : 'Show source'}
              </button>
              {showEvidence && (
                <p className="mt-1 text-xs text-gray-400 italic bg-gray-50 rounded px-2 py-1 border border-gray-100 line-clamp-3">
                  "{suggestion.evidence}"
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-center">
        <button
          onClick={onDismiss}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline-offset-2 hover:underline"
        >
          Dismiss suggestions
        </button>
      </div>
    </div>
  );
};
