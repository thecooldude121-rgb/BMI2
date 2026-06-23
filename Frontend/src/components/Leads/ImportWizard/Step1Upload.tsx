import React, { useCallback, useRef, useState } from 'react';
import { Upload, AlertCircle, Download, FileText } from 'lucide-react';
import { parseCSV, readFileAsText, MAX_ROWS, generateSampleCSV } from './csvParser';
import type { ParsedCSV } from './types';

type Props = {
  onAccept: (file: File, parsed: ParsedCSV) => void;
};

export default function Step1Upload({ onAccept }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    setError(null);
    setLoading(true);
    try {
      if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        setError('XLSX is not yet supported. Please export your spreadsheet as CSV and try again.');
        return;
      }
      if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
        setError('Only CSV files are supported. Please upload a .csv file.');
        return;
      }
      const text = await readFileAsText(file);
      const parsed = parseCSV(text);

      if (parsed.headers.length === 0) {
        setError('The file appears to be empty or has no headers. Please check and try again.');
        return;
      }
      if (parsed.rows.length === 0) {
        setError('The file has headers but no data rows.');
        return;
      }
      if (parsed.rows.length > MAX_ROWS) {
        setError(
          `This file has ${parsed.rows.length.toLocaleString()} rows. Maximum import size is ${MAX_ROWS.toLocaleString()} rows. Please split your file and import in batches.`,
        );
        return;
      }
      onAccept(file, parsed);
    } catch {
      setError('Failed to read file. Please make sure it is a valid CSV.');
    } finally {
      setLoading(false);
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function downloadSample() {
    const csv = generateSampleCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_leads_import.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Upload your CSV file</h2>
        <p className="text-sm text-gray-500 mt-1">
          Supports CSV format. Max {MAX_ROWS.toLocaleString()} rows per import.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
          dragging
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
        } ${loading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleChange} className="hidden" />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-600">Parsing file…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center ${dragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Upload className={`h-7 w-7 ${dragging ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {dragging ? 'Drop it here' : 'Drag and drop your CSV, or click to browse'}
              </p>
              <p className="text-xs text-gray-500 mt-1">.csv files only • up to 1,000 rows</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Sample download */}
      <div className="flex items-center gap-6 pt-2">
        <button onClick={downloadSample} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <Download className="h-4 w-4" />
          Download sample template
        </button>
        <span className="text-xs text-gray-400">
          <FileText className="h-3.5 w-3.5 inline mr-1" />
          Supports LinkedIn, HubSpot, Salesforce exports
        </span>
      </div>
    </div>
  );
}
