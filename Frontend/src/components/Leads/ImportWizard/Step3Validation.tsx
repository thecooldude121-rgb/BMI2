import React from 'react';
import { AlertTriangle, XCircle, CheckCircle, GitMerge, ToggleLeft, ToggleRight } from 'lucide-react';
import type { ParsedRow } from './types';

type Props = {
  validatedRows: ParsedRow[];
  skipErrors: boolean;
  onSkipErrorsChange: (skip: boolean) => void;
};

const PREVIEW_LIMIT = 10;

function RowStatusBadge({ row }: { row: ParsedRow }) {
  if (row.isDuplicate) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
        <GitMerge className="h-3 w-3" />
        Duplicate
      </span>
    );
  }
  if (row.validation.tier === 'error') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <XCircle className="h-3 w-3" />
        Error
      </span>
    );
  }
  if (row.validation.tier === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <AlertTriangle className="h-3 w-3" />
        Warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="h-3 w-3" />
      OK
    </span>
  );
}

export default function Step3Validation({ validatedRows, skipErrors, onSkipErrorsChange }: Props) {
  const total = validatedRows.length;
  const errorCount = validatedRows.filter(r => r.validation.tier === 'error').length;
  const warningCount = validatedRows.filter(r => r.validation.tier === 'warning' && !r.isDuplicate).length;
  const duplicateCount = validatedRows.filter(r => r.isDuplicate).length;
  const okCount = validatedRows.filter(r => r.validation.tier === 'ok' && !r.isDuplicate).length;

  const preview = validatedRows.slice(0, PREVIEW_LIMIT);
  const remaining = total - preview.length;

  function rowBg(row: ParsedRow) {
    if (row.isDuplicate) return 'bg-purple-50';
    if (row.validation.tier === 'error') return 'bg-red-50';
    if (row.validation.tier === 'warning') return 'bg-amber-50/40';
    return '';
  }

  function displayName(row: ParsedRow): string {
    const m = row.mapped;
    return m.full_name || [m.first_name, m.last_name].filter(Boolean).join(' ') || `Row ${row.index + 2}`;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Validation preview</h2>
        <p className="text-sm text-gray-500 mt-1">
          Showing {Math.min(PREVIEW_LIMIT, total)} of {total.toLocaleString()} rows.
        </p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{okCount}</div>
          <div className="text-xs text-green-600 mt-0.5">Clean</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-amber-700">{warningCount}</div>
          <div className="text-xs text-amber-600 mt-0.5">Warnings</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-700">{errorCount}</div>
          <div className="text-xs text-red-600 mt-0.5">Errors</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-700">{duplicateCount}</div>
          <div className="text-xs text-purple-600 mt-0.5">Duplicates</div>
        </div>
      </div>

      {/* Skip errors toggle */}
      {errorCount > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Skip rows with errors</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {skipErrors
                ? `${errorCount} error row${errorCount !== 1 ? 's' : ''} will be excluded from the import`
                : `${errorCount} error row${errorCount !== 1 ? 's' : ''} will be attempted (may fail at save time)`}
            </p>
          </div>
          <button
            onClick={() => onSkipErrorsChange(!skipErrors)}
            className="ml-4 focus:outline-none"
            aria-pressed={skipErrors}
            aria-label="Toggle skip rows with errors"
          >
            {skipErrors
              ? <ToggleRight className="h-7 w-7 text-blue-600" />
              : <ToggleLeft className="h-7 w-7 text-gray-400" />}
          </button>
        </div>
      )}

      {/* Preview table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Company</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Issues</div>
        </div>

        {preview.map(row => (
          <div
            key={row.index}
            className={`grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-gray-50 last:border-0 items-center text-sm ${rowBg(row)}`}
          >
            <div className="col-span-1 text-xs text-gray-400">{row.index + 2}</div>
            <div className="col-span-3 font-medium text-gray-900 truncate" title={displayName(row)}>
              {displayName(row)}
            </div>
            <div className="col-span-3 text-gray-600 truncate text-xs" title={row.mapped.email}>
              {row.mapped.email || <span className="text-gray-300 italic">—</span>}
            </div>
            <div className="col-span-2 text-gray-600 truncate text-xs" title={row.mapped.company}>
              {row.mapped.company || <span className="text-gray-300 italic">—</span>}
            </div>
            <div className="col-span-2">
              <RowStatusBadge row={row} />
            </div>
            <div className="col-span-1">
              {row.validation.issues.length > 0 && (
                <span
                  title={row.validation.issues.map(i => i.message).join('\n')}
                  className="text-xs text-gray-400 cursor-help underline decoration-dotted"
                >
                  {row.validation.issues.length}
                </span>
              )}
              {row.isDuplicate && row.duplicateMatch && (
                <span
                  title={`Matches: ${row.duplicateMatch.name}${row.duplicateMatch.email ? ` (${row.duplicateMatch.email})` : ''}`}
                  className="text-xs text-purple-500 cursor-help"
                >
                  dup
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {remaining > 0 && (
        <p className="text-xs text-gray-500 text-center">
          …and <strong>{remaining.toLocaleString()}</strong> more row{remaining !== 1 ? 's' : ''} will be processed
        </p>
      )}
    </div>
  );
}
