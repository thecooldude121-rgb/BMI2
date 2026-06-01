import React from 'react';
import { Eye } from 'lucide-react';
import { formatCurrency, convertToBaseCurrency } from '../../../utils/currencyUtils';
import { BASE_CURRENCY_CODE } from '../../../config/currencies';
import { getPipeline, getPipelineStage } from '../../../config/pipelines';
import { getDealType } from '../../../config/dealTypes';
import { getContactRole, roleChipClasses, StakeholderContact } from '../../../config/contactRoles';
import { Competitor } from '../../../config/competitors';
import { Swords } from 'lucide-react';

interface DealPreviewPanelProps {
  formData: any;
}

export const DealPreviewPanel: React.FC<DealPreviewPanelProps> = ({ formData }) => {
  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const currency = formData.currency || BASE_CURRENCY_CODE;
  const rawAmount = parseFloat((formData.dealValue || '0').toString().replace(/,/g, ''));
  const amount = isNaN(rawAmount) ? 0 : rawAmount;
  const baseAmount = convertToBaseCurrency(amount, currency);

  // Resolve pipeline, stage, and deal type from config
  const pipeline = getPipeline(formData.pipelineId || '');
  const dealTypeObj = getDealType(formData.dealType || '');
  const stageObj = getPipelineStage(pipeline.id, formData.stage);
  const stageIndex = pipeline.stages.findIndex(s => s.id === formData.stage);
  const stagePosition = stageIndex >= 0 ? stageIndex + 1 : 1;

  const stageColorDot: Record<string, string> = {
    gray: '🔵', blue: '🔵', amber: '🟠', purple: '🟣', green: '🟢', red: '🔴',
  };
  const stageEmoji = stageObj ? (stageColorDot[stageObj.color] ?? '📊') : '📊';
  const stageName = stageObj?.name ?? 'Unknown';

  const getDaysAway = (closeDate: string) => {
    if (!closeDate) return '-- days away';
    const today = new Date();
    const target = new Date(closeDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days away`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Eye className="h-5 w-5 text-gray-500" />
        <h2 className="text-base font-semibold text-gray-900">Deal Preview</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">How this deal will appear:</p>

      <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
        <div className="flex items-start space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
            {getInitials(formData.accountName || formData.dealName)}
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 mb-1">
              {formData.dealName || 'Deal Name'}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(amount, currency)}
            </div>
            {currency !== BASE_CURRENCY_CODE && amount > 0 && (
              <div className="text-xs text-gray-400 mt-0.5">
                ≈ {formatCurrency(baseAmount, BASE_CURRENCY_CODE)} {BASE_CURRENCY_CODE}
              </div>
            )}
          </div>

          {/* Pipeline + stage */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{stageEmoji}</span>
              <span className="font-medium text-gray-900">
                {stageName}
                <span className="text-xs text-gray-400 font-normal ml-1">
                  (Stage {stagePosition} of {pipeline.stages.length})
                </span>
              </span>
            </div>
            <div className="text-xs text-gray-400 pl-7">
              {pipeline.name} pipeline
            </div>
          </div>

          {/* Deal Type badge */}
          {formData.dealType && (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                {dealTypeObj.label}
              </span>
              <span className="text-xs text-gray-400">{dealTypeObj.description}</span>
            </div>
          )}

          <div>
            <div className="text-sm text-gray-600">Close: {formData.closeDate || 'Not set'}</div>
            <div className="text-sm text-gray-600">{getDaysAway(formData.closeDate)}</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">🤖 {formData.probability}% Win Probability</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${formData.probability}%` }}
              ></div>
            </div>
          </div>

          {/* Stakeholder role chips */}
          {formData.primaryContactName && (() => {
            const additional: StakeholderContact[] = formData.additionalContacts ?? [];
            const all = [
              { name: formData.primaryContactName, role: formData.contactRole, isPrimary: true },
              ...additional.filter(c => c.name.trim()),
            ];
            return (
              <div className="space-y-1.5">
                {all.map((s, i) => {
                  const roleObj = getContactRole(s.role);
                  return (
                    <div key={i} className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleChipClasses(roleObj.chipColor)}`}>
                        {roleObj.label}
                      </span>
                      <span className="text-sm text-gray-700 truncate">
                        {s.name}
                        {s.isPrimary && <span className="ml-1 text-xs text-gray-400">(primary)</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <div className="text-sm text-gray-700">
            Owner: {formData.owner === 'current-user' ? 'Alex Rodriguez' : 'Owner'}
          </div>

          {formData.sourceJourney && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-blue-700">🔗</span>
                <span className="text-blue-900 font-medium">
                  Created from {formData.sourceJourney.type === 'lead' ? 'Lead' : formData.sourceJourney.type === 'contact' ? 'Contact' : 'Account'}: {formData.sourceJourney.name}
                </span>
              </div>
            </div>
          )}

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Competitor chips */}
          {((formData.competitors ?? []) as Competitor[]).length > 0 && (
            <div className="mt-2">
              <div className="flex items-center space-x-1 mb-1.5">
                <Swords className="h-3.5 w-3.5 text-red-400" />
                <span className="text-xs text-gray-400">Competing against</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {((formData.competitors ?? []) as Competitor[]).map((c) => (
                  <span
                    key={c.id}
                    className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 text-xs font-medium rounded-full"
                  >
                    {c.isCustom && <span className="text-red-400 mr-0.5">*</span>}
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-3 italic">
        This is how the deal will appear in the pipeline (Kanban/List/Grid views)
      </p>
    </div>
  );
};
