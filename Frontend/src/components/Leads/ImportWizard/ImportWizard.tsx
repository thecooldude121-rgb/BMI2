import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useLeads } from '../../../contexts/LeadContext';
import { buildInitialMappings } from './columnMapper';
import { buildValidatedRows } from './importValidator';
import Step1Upload from './Step1Upload';
import Step2Mapping from './Step2Mapping';
import Step3Validation from './Step3Validation';
import Step4Rules from './Step4Rules';
import Step5Confirm from './Step5Confirm';
import Step6Results from './Step6Results';
import type {
  ImportStep, ParsedCSV, ColumnMapping, ParsedRow,
  ImportRules, ImportProgress, ImportResult, DEFAULT_RULES,
} from './types';
import { DEFAULT_RULES as DEFAULT_RULES_VALUE } from './types';

// ── Step metadata ─────────────────────────────────────────────────────────────

const STEPS: { id: ImportStep; label: string }[] = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Map Columns' },
  { id: 3, label: 'Validate' },
  { id: 4, label: 'Rules' },
  { id: 5, label: 'Confirm' },
  { id: 6, label: 'Results' },
];

type Props = {
  onClose: () => void;
};

// ── Wizard ────────────────────────────────────────────────────────────────────

export default function ImportWizard({ onClose }: Props) {
  const { leads: contextLeads, createLead } = useLeads();

  const [step, setStep] = useState<ImportStep>(1);
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [validatedRows, setValidatedRows] = useState<ParsedRow[]>([]);
  const [skipErrors, setSkipErrors] = useState(true);
  const [rules, setRules] = useState<ImportRules>(DEFAULT_RULES_VALUE);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Escape key — only on steps 1-5 (not during import)
  useEffect(() => {
    if (step === 6) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') confirmClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [step]);

  function confirmClose() {
    if (step <= 1 || step === 6) { onClose(); return; }
    if (window.confirm('Cancel import? Your progress will be lost.')) onClose();
  }

  // Step 1 → 2
  function handleFileAccepted(file: File, data: ParsedCSV) {
    setParsed(data);
    setMappings(buildInitialMappings(data));
    setStep(2);
  }

  // Step 2 → 3: build validated rows
  function handleMappingNext() {
    if (!parsed) return;
    const rows = buildValidatedRows(parsed, mappings, contextLeads ?? []);
    setValidatedRows(rows);
    setStep(3);
  }

  // Step 5 → 6: run the real import loop
  async function runImport() {
    setStep(6);
    setImportProgress({ processed: 0, total: 0 });

    const rowsToProcess = validatedRows.filter(row => {
      if (skipErrors && row.validation.tier === 'error') return false;
      return true;
    });

    const errorRowsSkipped = validatedRows.length - rowsToProcess.length;
    const total = rowsToProcess.length;
    setImportProgress({ processed: 0, total });

    let imported = 0;
    let failed = 0;
    let duplicatesSkipped = 0;
    let duplicatesMergeQueued = 0;
    let duplicatesCreated = 0;
    let warnings = 0;

    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];

      // Handle duplicate per rule
      if (row.isDuplicate && rules.duplicateAction === 'skip') {
        duplicatesSkipped++;
        setImportProgress({ processed: i + 1, total });
        continue;
      }

      try {
        const m = row.mapped;

        // Resolve name
        const firstName = m.first_name || (m.full_name ? m.full_name.split(/\s+/).slice(0, -1).join(' ') || m.full_name : '');
        const lastName = m.last_name || (m.full_name && m.full_name.includes(' ') ? m.full_name.split(/\s+/).slice(-1)[0] : '');

        // Build tags
        const csvTags = m.tags ? m.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const allTags = [...new Set([...csvTags, ...rules.tags])];
        if (row.isDuplicate && rules.duplicateAction === 'merge_review') {
          allTags.push('merge-candidate');
        }

        const result = await createLead({
          first_name:    firstName.trim() || 'Unknown',
          last_name:     lastName.trim(),
          full_name:     m.full_name || [firstName, lastName].filter(Boolean).join(' ').trim() || 'Unknown',
          email:         m.email?.trim() || undefined,
          phone:         m.phone?.trim() || undefined,
          company:       m.company?.trim() || undefined,
          position:      m.position?.trim() || undefined,
          industry:      m.industry?.trim() || undefined,
          department:    m.department?.trim() || undefined,
          company_size:  m.company_size?.trim() || undefined,
          website:       m.website?.trim() || undefined,
          linkedin_url:  m.linkedin_url?.trim() || undefined,
          city:          m.city?.trim() || undefined,
          country:       m.country?.trim() || undefined,
          source:        rules.sourceOverride || m.source?.trim() || 'Import',
          source_detail: m.source_detail?.trim() || undefined,
          utm_source:    m.utm_source?.trim() || undefined,
          utm_medium:    m.utm_medium?.trim() || undefined,
          utm_campaign:  m.utm_campaign?.trim() || undefined,
          quick_notes:   m.notes?.trim() || undefined,
          owner_id:      rules.defaultOwnerId || 'unassigned',
          status:        rules.defaultStatus,
          score:         50,
          tags:          allTags,
          email_opt_in:  true,
          call_opt_in:   true,
        });

        if (result) {
          imported++;
          if (row.isDuplicate && rules.duplicateAction === 'merge_review') duplicatesMergeQueued++;
          if (row.isDuplicate && rules.duplicateAction === 'create_new') duplicatesCreated++;
          if (row.validation.tier === 'warning') warnings++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }

      setImportProgress({ processed: i + 1, total });
    }

    setImportResult({
      imported,
      failed,
      duplicatesSkipped,
      duplicatesMergeQueued,
      duplicatesCreated,
      warnings,
      errorRowsSkipped,
      enrichmentQueued: rules.triggerEnrichment ? imported : 0,
    });
  }

  function handleImportAnother() {
    setParsed(null);
    setMappings([]);
    setValidatedRows([]);
    setSkipErrors(true);
    setRules(DEFAULT_RULES_VALUE);
    setImportProgress(null);
    setImportResult(null);
    setStep(1);
  }

  function canGoNext(): boolean {
    if (step === 2 && mappings.filter(m => m.crmField !== 'skip').length === 0) return false;
    return true;
  }

  function goNext() {
    if (step === 2) { handleMappingNext(); return; }
    if (step === 5) { runImport(); return; }
    if (step < 5) setStep((step + 1) as ImportStep);
  }

  function goBack() {
    if (step > 1 && step < 6) setStep((step - 1) as ImportStep);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Import Leads</span>
            <span className="text-xs text-gray-400">Step {step} of {STEPS.length}</span>
          </div>
          {step !== 6 && (
            <button
              onClick={confirmClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close import wizard"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center px-6 pb-3 gap-0">
          {STEPS.map((s, idx) => {
            const isComplete = step > s.id;
            const isActive = step === s.id;
            const isFuture = step < s.id;

            return (
              <React.Fragment key={s.id}>
                {idx > 0 && (
                  <div className={`flex-1 h-px mx-1 ${isComplete ? 'bg-blue-500' : 'bg-gray-200'}`} />
                )}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isComplete ? 'bg-blue-500 text-white'
                    : isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : s.id}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    isActive ? 'text-blue-600' : isFuture ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {s.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {step === 1 && (
            <Step1Upload onAccept={handleFileAccepted} />
          )}
          {step === 2 && parsed && (
            <Step2Mapping
              parsed={parsed}
              mappings={mappings}
              onMappingsChange={setMappings}
            />
          )}
          {step === 3 && (
            <Step3Validation
              validatedRows={validatedRows}
              skipErrors={skipErrors}
              onSkipErrorsChange={setSkipErrors}
            />
          )}
          {step === 4 && (
            <Step4Rules rules={rules} onRulesChange={setRules} />
          )}
          {step === 5 && (
            <Step5Confirm
              validatedRows={validatedRows}
              skipErrors={skipErrors}
              rules={rules}
              onConfirm={runImport}
            />
          )}
          {step === 6 && (
            <Step6Results
              progress={importProgress}
              result={importResult}
              onClose={() => { onClose(); }}
              onImportAnother={handleImportAnother}
            />
          )}
        </div>
      </div>

      {/* Bottom nav (steps 2-4 only; step 1 advances via file pick; step 5 has its own button; step 6 has its own) */}
      {step >= 2 && step <= 4 && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={goNext}
              disabled={!canGoNext()}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {step === 5 && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center">
            <button
              onClick={goBack}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
