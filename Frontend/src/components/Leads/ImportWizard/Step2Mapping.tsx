import React from 'react';
import { CheckCircle, HelpCircle } from 'lucide-react';
import { CRM_FIELD_LABELS, CRM_FIELDS_ORDERED, getSampleValues, autoDetectField } from './columnMapper';
import type { ColumnMapping, ParsedCSV, CRMField } from './types';

type Props = {
  parsed: ParsedCSV;
  mappings: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
};

function setMapping(mappings: ColumnMapping[], header: string, field: CRMField): ColumnMapping[] {
  return mappings.map(m => m.csvHeader === header ? { ...m, crmField: field, autoDetected: false } : m);
}

export default function Step2Mapping({ parsed, mappings, onMappingsChange }: Props) {
  const autoDetectedCount = mappings.filter(m => m.autoDetected && m.crmField !== 'skip').length;
  const mappedCount = mappings.filter(m => m.crmField !== 'skip').length;

  function handleReAutoDetect() {
    onMappingsChange(
      mappings.map(m => {
        const detected = autoDetectField(m.csvHeader);
        return { ...m, crmField: detected ?? 'skip', autoDetected: detected !== null };
      }),
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Map CSV columns to CRM fields</h2>
          <p className="text-sm text-gray-500 mt-1">
            {autoDetectedCount} of {mappings.length} columns auto-detected.{' '}
            {mappedCount} total mapped.
          </p>
        </div>
        <button
          onClick={handleReAutoDetect}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
        >
          Re-run auto-detect
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div className="col-span-3">CSV Column</div>
          <div className="col-span-4">Sample Values</div>
          <div className="col-span-4">Map to CRM Field</div>
          <div className="col-span-1" />
        </div>

        {mappings.map((mapping) => {
          const samples = getSampleValues(parsed, mapping.csvHeader);
          const isSkipped = mapping.crmField === 'skip';

          return (
            <div
              key={mapping.csvHeader}
              className={`grid grid-cols-12 gap-3 px-4 py-3 border-b border-gray-50 last:border-0 items-center ${isSkipped ? 'opacity-50' : ''}`}
            >
              {/* CSV header */}
              <div className="col-span-3">
                <span className="text-sm font-medium text-gray-900 font-mono">{mapping.csvHeader}</span>
              </div>

              {/* Sample values */}
              <div className="col-span-4 flex flex-wrap gap-1">
                {samples.length > 0 ? samples.map((s, i) => (
                  <span key={i} className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded max-w-[120px] truncate" title={s}>
                    {s}
                  </span>
                )) : (
                  <span className="text-xs text-gray-400 italic">no data</span>
                )}
              </div>

              {/* CRM field select */}
              <div className="col-span-4">
                <select
                  value={mapping.crmField}
                  onChange={e => onMappingsChange(setMapping(mappings, mapping.csvHeader, e.target.value as CRMField))}
                  className={`w-full px-2.5 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isSkipped ? 'border-gray-200 text-gray-400 bg-gray-50' : 'border-gray-300 text-gray-900'
                  }`}
                >
                  {CRM_FIELDS_ORDERED.map(f => (
                    <option key={f} value={f}>{CRM_FIELD_LABELS[f]}</option>
                  ))}
                </select>
              </div>

              {/* Auto-detected badge */}
              <div className="col-span-1 flex justify-center">
                {mapping.autoDetected && !isSkipped ? (
                  <span title="Auto-detected">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </span>
                ) : isSkipped ? (
                  <span title="This column will be skipped">
                    <HelpCircle className="h-4 w-4 text-gray-300" />
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mapping tips */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-xs text-blue-700">
          <strong>Tip:</strong> Columns set to "Skip this column" will not be imported.
          Duplicate CRM field assignments (e.g., two columns mapped to Email) keep the first value found.
          You can always re-import with corrected mappings.
        </p>
      </div>
    </div>
  );
}
