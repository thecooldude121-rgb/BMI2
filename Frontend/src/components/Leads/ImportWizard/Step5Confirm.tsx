import React from 'react';
import { CheckCircle, XCircle, GitMerge, AlertTriangle, Zap, UserCheck, Tag } from 'lucide-react';
import { TEAM_MEMBERS } from '../../../utils/leadOwnerRouting';
import type { ParsedRow, ImportRules } from './types';

type Props = {
  validatedRows: ParsedRow[];
  skipErrors: boolean;
  rules: ImportRules;
  onConfirm: () => void;
};

function SummaryRow({ icon, label, count, color }: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
}) {
  if (count === 0) return null;
  return (
    <div className={`flex items-center justify-between p-3.5 rounded-xl border ${color}`}>
      <div className="flex items-center gap-2.5 text-sm font-medium">
        {icon}
        {label}
      </div>
      <span className="text-lg font-bold">{count.toLocaleString()}</span>
    </div>
  );
}

export default function Step5Confirm({ validatedRows, skipErrors, rules, onConfirm }: Props) {
  const errorRows = validatedRows.filter(r => r.validation.tier === 'error');
  const duplicateRows = validatedRows.filter(r => r.isDuplicate);

  const errorSkipped = skipErrors ? errorRows.length : 0;
  const rowsAfterErrors = validatedRows.filter(r => !(skipErrors && r.validation.tier === 'error'));

  const duplicatesSkipped = rules.duplicateAction === 'skip'
    ? duplicateRows.filter(r => !(skipErrors && r.validation.tier === 'error')).length
    : 0;
  const duplicatesMergeQueued = rules.duplicateAction === 'merge_review'
    ? duplicateRows.filter(r => !(skipErrors && r.validation.tier === 'error')).length
    : 0;

  const toImport = rowsAfterErrors.length - duplicatesSkipped;
  const warnings = validatedRows.filter(r => r.validation.tier === 'warning' && !r.isDuplicate).length;

  const ownerLabel = TEAM_MEMBERS.find(m => m.id === rules.defaultOwnerId)?.label;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Ready to import</h2>
        <p className="text-sm text-gray-500 mt-1">Here's what will happen when you start the import.</p>
      </div>

      {/* Import plan */}
      <div className="space-y-2">
        <SummaryRow
          icon={<CheckCircle className="h-4.5 w-4.5 text-green-600" />}
          label="Leads will be imported"
          count={toImport}
          color="bg-green-50 border-green-200 text-green-800"
        />
        {duplicatesSkipped > 0 && (
          <SummaryRow
            icon={<GitMerge className="h-4.5 w-4.5 text-purple-600" />}
            label="Duplicates will be skipped"
            count={duplicatesSkipped}
            color="bg-purple-50 border-purple-200 text-purple-800"
          />
        )}
        {duplicatesMergeQueued > 0 && (
          <SummaryRow
            icon={<GitMerge className="h-4.5 w-4.5 text-purple-600" />}
            label={`Duplicates will be imported + tagged "merge-candidate"`}
            count={duplicatesMergeQueued}
            color="bg-purple-50 border-purple-200 text-purple-800"
          />
        )}
        {rules.duplicateAction === 'create_new' && duplicateRows.length > 0 && (
          <SummaryRow
            icon={<GitMerge className="h-4.5 w-4.5 text-purple-600" />}
            label="Duplicates will be created as new leads"
            count={duplicateRows.filter(r => !(skipErrors && r.validation.tier === 'error')).length}
            color="bg-purple-50 border-purple-200 text-purple-800"
          />
        )}
        <SummaryRow
          icon={<XCircle className="h-4.5 w-4.5 text-red-500" />}
          label="Error rows will be skipped"
          count={errorSkipped}
          color="bg-red-50 border-red-200 text-red-800"
        />
        <SummaryRow
          icon={<AlertTriangle className="h-4.5 w-4.5 text-amber-500" />}
          label="Rows with warnings (will import)"
          count={warnings}
          color="bg-amber-50 border-amber-200 text-amber-800"
        />
      </div>

      {/* Rules summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Applied rules</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <UserCheck className="h-3.5 w-3.5 text-gray-400" />
            Status: <span className="font-medium text-gray-900 capitalize ml-1">{rules.defaultStatus}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <UserCheck className="h-3.5 w-3.5 text-gray-400" />
            Owner: <span className="font-medium text-gray-900 ml-1">{ownerLabel || 'Unassigned'}</span>
          </div>
          {rules.sourceOverride && (
            <div className="flex items-center gap-2 text-gray-600 col-span-2">
              Source: <span className="font-medium text-gray-900 ml-1">{rules.sourceOverride}</span>
            </div>
          )}
          {rules.tags.length > 0 && (
            <div className="flex items-center gap-2 text-gray-600 col-span-2">
              <Tag className="h-3.5 w-3.5 text-gray-400" />
              Tags: <span className="font-medium text-gray-900 ml-1">{rules.tags.join(', ')}</span>
            </div>
          )}
          {rules.triggerEnrichment && (
            <div className="flex items-center gap-2 text-purple-600 col-span-2">
              <Zap className="h-3.5 w-3.5" />
              <span className="font-medium">Enrichment enabled</span>
            </div>
          )}
        </div>
      </div>

      {toImport === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
          No rows will be imported based on the current rules. Go back to adjust your settings or fix the source data.
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={toImport === 0}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        <CheckCircle className="h-5 w-5" />
        Start importing {toImport.toLocaleString()} lead{toImport !== 1 ? 's' : ''}
      </button>
    </div>
  );
}
