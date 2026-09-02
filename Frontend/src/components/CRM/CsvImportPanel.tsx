import React, { useRef, useState } from 'react';
import { Upload, Download, FileText, AlertTriangle, CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { parseCsv, readFileAsText, MAX_ROWS } from '../../utils/csvParse';
import { toCsv } from '../../utils/csv';
import {
  matchColumns, mapRows, buildTemplate, type FieldSpec, type ColumnMatch,
} from '../../utils/csvImportSpec';
import {
  MAX_IMPORT_ROWS, mergeSummaries, type ImportSummary, type RowResult,
} from '../../utils/importApi';

/**
 * CSV import, shared by Contacts and Accounts.
 *
 * ONE COMPONENT FOR BOTH, deliberately. Two import surfaces implemented
 * separately drift: one grows a duplicate warning the other lacks, one reports
 * per-row reasons and the other a count. Everything entity-specific arrives as
 * props — the field spec, the labels, and the two API calls — and the flow,
 * the reporting and the honesty rules live here once.
 *
 * THE RULE THIS COMPONENT EXISTS TO ENFORCE
 * No fabricated success. A partial import renders as a partial import: the
 * heading, the icon and the colour all say "some rows did not import", and
 * every rejected row is listed individually with its reason. There is no state
 * in which a green tick appears over rows that were not written. CLAUDE.md is
 * explicit that a fake confirmation is worse than an unfinished feature,
 * because it destroys trust in the data the product does store.
 *
 * WHY A DRY RUN
 * The preview posts the same rows to the same endpoint with dry_run, which
 * runs the real inserts and rolls them back. So the preview is not a parallel
 * estimate that can disagree with the committing path — it IS the committing
 * path, stopped short of COMMIT. It matters most for accounts: `companies` has
 * no unique constraint on name, so nothing in the database prevents a mistaken
 * import duplicating an account list, and the preview is the only place that
 * becomes visible before it happens.
 */

type Stage = 'choose' | 'previewing' | 'preview' | 'importing' | 'done';

interface CsvImportPanelProps {
  /** Plural, lower case: "contacts", "accounts". Used in prose. */
  entityPlural: string;
  fields: FieldSpec[];
  templateFilename: string;
  /** Contacts fold a single "Name" column into first/last; accounts do not. */
  transformRows?: (rows: Record<string, unknown>[]) => Record<string, unknown>[];
  onImport: (rows: Record<string, unknown>[], dryRun: boolean) => Promise<ImportSummary>;
  /** Called after a commit that created at least one row, so the list can refetch. */
  onImported?: () => void;
}

/** Send in chunks so a large file does not exceed the server's per-request cap. */
async function runChunked(
  rows: Record<string, unknown>[],
  dryRun: boolean,
  onImport: CsvImportPanelProps['onImport'],
  onProgress: (done: number) => void,
): Promise<ImportSummary> {
  const parts: ImportSummary[] = [];
  for (let i = 0; i < rows.length; i += MAX_IMPORT_ROWS) {
    parts.push(await onImport(rows.slice(i, i + MAX_IMPORT_ROWS), dryRun));
    onProgress(Math.min(i + MAX_IMPORT_ROWS, rows.length));
  }
  return mergeSummaries(parts, MAX_IMPORT_ROWS);
}

export const CsvImportPanel: React.FC<CsvImportPanelProps> = ({
  entityPlural, fields, templateFilename, transformRows, onImport, onImported,
}) => {
  const fileInput = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>('choose');
  const [fileName, setFileName] = useState('');
  const [matches, setMatches] = useState<ColumnMatch[]>([]);
  const [payload, setPayload] = useState<Record<string, unknown>[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setStage('choose'); setFileName(''); setMatches([]); setPayload([]);
    setSummary(null); setError(null); setProgress(0);
    if (fileInput.current) fileInput.current.value = '';
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([buildTemplate(fields)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = templateFilename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    try {
      const parsed = parseCsv(await readFileAsText(file));

      if (parsed.headers.length === 0) {
        setError('That file has no header row, so there is no way to tell what its columns mean.');
        setStage('choose');
        return;
      }
      if (parsed.rows.length === 0) {
        setError('That file has a header row but no data rows.');
        setStage('choose');
        return;
      }
      if (parsed.rows.length > MAX_ROWS) {
        setError(
          `That file has ${parsed.rows.length.toLocaleString()} rows. The limit is ` +
          `${MAX_ROWS.toLocaleString()} per import — split it and import in batches.`,
        );
        setStage('choose');
        return;
      }

      const cols = matchColumns(parsed.headers, fields);
      const required = fields.filter(f => f.required);
      const recognised = new Set(cols.map(c => c.field?.key).filter(Boolean));
      // 'full_name' satisfies first/last, so a file with only a Name column is
      // not rejected here — the server decides once the split has run.
      const missing = required.filter(
        f => !recognised.has(f.key) && !(recognised.has('full_name') && (f.key === 'first_name' || f.key === 'last_name')),
      );
      if (missing.length) {
        setError(
          `No column matched ${missing.map(f => `"${f.label}"`).join(' or ')}, which ` +
          `${missing.length > 1 ? 'are' : 'is'} required. Download the template below to see the ` +
          `column names this import understands.`,
        );
        setMatches(cols);
        setStage('choose');
        return;
      }

      const mapped = transformRows ? transformRows(mapRows(parsed.rows, cols)) : mapRows(parsed.rows, cols);
      setMatches(cols);
      setPayload(mapped);
      setStage('previewing');

      const result = await runChunked(mapped, true, onImport, setProgress);
      setSummary(result);
      setStage('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That file could not be read.');
      setStage('choose');
    }
  };

  const commit = async () => {
    setStage('importing');
    setError(null);
    setProgress(0);
    try {
      const result = await runChunked(payload, false, onImport, setProgress);
      setSummary(result);
      setStage('done');
      if (result.created > 0) onImported?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The import failed.');
      // Back to the preview, not to 'done': nothing may be reported as imported
      // when the request itself did not return a result.
      setStage('preview');
    }
  };

  const downloadReport = () => {
    if (!summary) return;
    const csv = toCsv(
      ['CSV row', 'Result', 'Reason', 'Warnings', 'Created id'],
      summary.rows.map(r => [
        // +2: one for the header row, one because CSV rows are 1-indexed to a
        // human looking at the file in a spreadsheet.
        r.index + 2,
        r.status,
        r.reason ?? '',
        (r.warnings ?? []).join('; '),
        r.id ?? '',
      ]),
    );
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `import_report_${entityPlural}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const recognised = matches.filter(m => m.field);
  const ignored = matches.filter(m => !m.field);
  const problems = summary ? summary.rows.filter(r => r.status !== 'created') : [];
  const warned = summary ? summary.rows.filter(r => r.status === 'created' && r.warnings?.length) : [];

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4">
          <XCircle className="h-5 w-5 shrink-0 text-danger-600" aria-hidden="true" />
          <p className="text-sm text-danger-800">{error}</p>
        </div>
      )}

      {/* ── Choose a file ─────────────────────────────────────────────── */}
      {stage === 'choose' && (
        <>
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-gray-900">Choose a CSV file</p>
            <p className="mt-1 text-xs text-gray-500">
              Up to {MAX_ROWS.toLocaleString()} rows. Nothing is saved until you review what it contains.
            </p>
            <input
              ref={fileInput} type="file" accept=".csv,text/csv" className="sr-only"
              id={`csv-input-${entityPlural}`}
              onChange={e => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
            />
            <label
              htmlFor={`csv-input-${entityPlural}`}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus-within:ring-2 focus-within:ring-brand-600"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              Select file
            </label>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-600">
              Not sure about the columns? The template lists every one this import understands.
            </p>
            <Button variant="secondary" size="sm" onClick={downloadTemplate}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Template
            </Button>
          </div>

          {/* Shown after a rejected file so the user can see what WAS understood. */}
          {matches.length > 0 && <ColumnSummary recognised={recognised} ignored={ignored} />}
        </>
      )}

      {/* ── Working ───────────────────────────────────────────────────── */}
      {(stage === 'previewing' || stage === 'importing') && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-6">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {stage === 'previewing' ? 'Checking your file…' : `Importing ${entityPlural}…`}
            </p>
            <p className="text-xs text-gray-500">
              {progress > 0
                ? `${progress.toLocaleString()} of ${payload.length.toLocaleString()} rows`
                : `${payload.length.toLocaleString()} rows`}
              {stage === 'previewing' && ' · nothing is being saved yet'}
            </p>
          </div>
        </div>
      )}

      {/* ── Preview and final report ──────────────────────────────────── */}
      {(stage === 'preview' || stage === 'done') && summary && (
        <>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium text-gray-700">{fileName}</span>
            <span>·</span>
            <span>{summary.total.toLocaleString()} data rows</span>
          </div>

          <ColumnSummary recognised={recognised} ignored={ignored} />

          <Outcome summary={summary} stage={stage} entityPlural={entityPlural} />

          {(problems.length > 0 || warned.length > 0) && (
            <RowReport problems={problems} warned={warned} stage={stage} />
          )}

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            {summary.rows.length > 0 && (
              <Button variant="secondary" onClick={downloadReport}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Download report
              </Button>
            )}
            {stage === 'preview' ? (
              <>
                <Button variant="ghost" onClick={reset}>Choose a different file</Button>
                <Button onClick={commit} disabled={summary.created === 0}>
                  {summary.created === 0
                    ? 'Nothing to import'
                    : `Import ${summary.created.toLocaleString()} ${summary.created === 1 ? entityPlural.replace(/s$/, '') : entityPlural}`}
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={reset}>Import another file</Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/** Which of the user's columns were understood, and which were not. */
const ColumnSummary: React.FC<{ recognised: ColumnMatch[]; ignored: ColumnMatch[] }> = ({
  recognised, ignored,
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Columns</p>
    <div className="mt-2 flex flex-wrap gap-1.5">
      {recognised.map(m => (
        <span key={m.header} className="rounded bg-success-50 px-2 py-1 text-xs text-success-800 border border-success-200">
          {m.header} → {m.field!.label}
        </span>
      ))}
      {ignored.map(m => (
        <span key={m.header} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 border border-gray-200 line-through">
          {m.header}
        </span>
      ))}
    </div>
    {ignored.length > 0 && (
      <p className="mt-2 text-xs text-gray-500">
        {ignored.length} column{ignored.length === 1 ? '' : 's'} will be ignored — nothing in this
        import reads {ignored.length === 1 ? 'it' : 'them'}. The rest of each row still imports.
      </p>
    )}
  </div>
);

/**
 * The headline.
 *
 * Three states, and the distinction is the whole point: everything succeeded,
 * some rows did not, or nothing did. Only the first is green. A partial result
 * showing a success tick is the fabricated-confirmation defect this project has
 * spent several sessions removing.
 */
const Outcome: React.FC<{ summary: ImportSummary; stage: Stage; entityPlural: string }> = ({
  summary, stage, entityPlural,
}) => {
  const rejected = summary.skipped + summary.failed;
  const preview = stage === 'preview';
  const allGood = rejected === 0 && summary.created > 0;
  const nothing = summary.created === 0;

  const tone = allGood
    ? { box: 'border-success-200 bg-success-50', text: 'text-success-800', Icon: CheckCircle2, icon: 'text-success-600' }
    : nothing
      ? { box: 'border-danger-200 bg-danger-50', text: 'text-danger-800', Icon: XCircle, icon: 'text-danger-600' }
      : { box: 'border-warning-200 bg-warning-50', text: 'text-warning-800', Icon: AlertTriangle, icon: 'text-warning-600' };

  const headline = preview
    ? nothing
      ? `No rows can be imported`
      : rejected === 0
        ? `All ${summary.created.toLocaleString()} rows are ready to import`
        : `${summary.created.toLocaleString()} of ${summary.total.toLocaleString()} rows can be imported`
    : nothing
      ? `Nothing was imported`
      : rejected === 0
        ? `${summary.created.toLocaleString()} ${entityPlural} imported`
        : `${summary.created.toLocaleString()} of ${summary.total.toLocaleString()} rows imported`;

  return (
    <div className={`rounded-lg border p-4 ${tone.box}`}>
      <div className="flex items-start gap-3">
        <tone.Icon className={`h-5 w-5 shrink-0 ${tone.icon}`} aria-hidden="true" />
        <div>
          <p className={`text-sm font-semibold ${tone.text}`}>{headline}</p>
          <p className={`mt-1 text-xs ${tone.text}`}>
            {preview
              ? 'Nothing has been saved yet. '
              : rejected > 0
                ? `${rejected.toLocaleString()} row${rejected === 1 ? ' was' : 's were'} not imported and ${rejected === 1 ? 'is' : 'are'} listed below. `
                : ''}
            {summary.skipped > 0 && `${summary.skipped.toLocaleString()} duplicate${summary.skipped === 1 ? '' : 's'}. `}
            {summary.failed > 0 && `${summary.failed.toLocaleString()} with errors. `}
            {preview && rejected > 0 && 'Fix them in your file and re-import, or continue and import the rest.'}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Every rejected row, individually, with its reason.
 *
 * This is the requirement in CLAUDE.md restated as a component: a row with a
 * bad email, a missing field or a duplicate is reported on its own line — not
 * silently dropped, and not collapsed into one generic failure message.
 */
const RowReport: React.FC<{ problems: RowResult[]; warned: RowResult[]; stage: Stage }> = ({
  problems, warned, stage,
}) => (
  <div className="overflow-hidden rounded-lg border border-gray-200">
    <div className="max-h-72 overflow-y-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="sticky top-0 bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Row</th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Result</th>
            <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {problems.map(r => (
            <tr key={`p${r.index}`}>
              {/* +2 so the number matches the line the user sees in a spreadsheet:
                  one for the header row, one because spreadsheets are 1-indexed. */}
              <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-500">{r.index + 2}</td>
              <td className="whitespace-nowrap px-4 py-2">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                  r.status === 'skipped'
                    ? 'bg-warning-50 text-warning-800 border border-warning-200'
                    : 'bg-danger-50 text-danger-800 border border-danger-200'
                }`}>
                  {r.status === 'skipped' ? (stage === 'preview' ? 'Will skip' : 'Skipped') : (stage === 'preview' ? 'Will fail' : 'Failed')}
                </span>
              </td>
              <td className="px-4 py-2 text-gray-700">{r.reason}</td>
            </tr>
          ))}
          {warned.map(r => (
            <tr key={`w${r.index}`}>
              <td className="whitespace-nowrap px-4 py-2 tabular-nums text-gray-500">{r.index + 2}</td>
              <td className="whitespace-nowrap px-4 py-2">
                <span className="rounded border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                  {stage === 'preview' ? 'Will import' : 'Imported'}
                </span>
              </td>
              <td className="px-4 py-2 text-gray-600">
                <span className="inline-flex items-start gap-1.5">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
                  <span>{r.warnings!.join(' · ')}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default CsvImportPanel;
