import React from 'react';
import { formatCurrency } from '../../../utils/currencyUtils';
import { daysFromNowLabel } from '../../../utils/dateUtils';
import { getPipelineStage, DEFAULT_PIPELINE } from '../../../config/pipelines';
import { BASE_CURRENCY_CODE } from '../../../config/currencies';
import { getDealType } from '../../../config/dealTypes';

interface MobileDealPreviewProps {
  formData: any;
  winProbOverrideEnabled: boolean;
  winProbOverrideValue: number | '';
}

export const MobileDealPreview: React.FC<MobileDealPreviewProps> = ({
  formData,
  winProbOverrideEnabled,
  winProbOverrideValue,
}) => {
  const hasAnyData = formData.dealName || formData.dealValue || formData.stage;
  if (!hasAnyData) return null;

  const currency = formData.currency || BASE_CURRENCY_CODE;
  const rawAmount = parseFloat((formData.dealValue || '0').toString().replace(/,/g, ''));
  const amount = isNaN(rawAmount) ? 0 : rawAmount;

  const pipelineId = formData.pipelineId || DEFAULT_PIPELINE.id;
  const stageObj = getPipelineStage(pipelineId, formData.stage);
  const dealTypeObj = getDealType(formData.dealType || '');

  const effectiveProb = winProbOverrideEnabled && winProbOverrideValue !== ''
    ? Number(winProbOverrideValue)
    : formData.probability ?? 0;

  const probColor =
    effectiveProb >= 70 ? 'text-emerald-600' :
    effectiveProb >= 40 ? 'text-blue-600'    :
                          'text-amber-600';

  return (
    <div className="block lg:hidden bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Deal Preview</p>
      <div className="space-y-2">
        {formData.dealName && (
          <p className="text-sm font-semibold text-gray-900 truncate">{formData.dealName}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {amount > 0 && (
            <span className="text-base font-bold text-gray-900">
              {formatCurrency(amount, currency)}
            </span>
          )}
          {stageObj && (
            <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
              {stageObj.name}
            </span>
          )}
          {formData.dealType && (
            <span className="text-xs font-medium px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
              {dealTypeObj.label}
            </span>
          )}
          {formData.closeDate && (
            <span className="text-xs text-gray-500">{daysFromNowLabel(formData.closeDate)}</span>
          )}
          {effectiveProb > 0 && (
            <span className={`text-xs font-semibold ${probColor}`}>
              {effectiveProb}% win
              {winProbOverrideEnabled && winProbOverrideValue !== '' && (
                <span className="text-indigo-500 ml-1">(rep)</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
