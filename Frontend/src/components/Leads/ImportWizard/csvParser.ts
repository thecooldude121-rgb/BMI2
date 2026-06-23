import type { ParsedCSV } from './types';

export const MAX_ROWS = 1000;

function parseRow(line: string): string[] {
  const fields: string[] = [];
  let i = 0;

  while (i <= line.length) {
    if (i === line.length) { fields.push(''); break; }

    if (line[i] === '"') {
      let field = '';
      i++;
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++;
          break;
        } else {
          field += line[i++];
        }
      }
      while (i < line.length && line[i] !== ',') i++;
      if (i < line.length) i++;
      fields.push(field.trim());
    } else {
      const start = i;
      while (i < line.length && line[i] !== ',') i++;
      fields.push(line.slice(start, i).trim());
      if (i < line.length) i++;
    }
  }

  return fields;
}

export function parseCSV(text: string): ParsedCSV {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  // Drop trailing empty lines
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseRow(lines[0]).map(h => h.trim()).filter(Boolean);
  if (headers.length === 0) return { headers: [], rows: [] };

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? '').trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve((e.target?.result as string) ?? '');
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'UTF-8');
  });
}

export function generateSampleCSV(): string {
  const header = 'First Name,Last Name,Email,Phone,Company,Job Title,Industry,LinkedIn URL,Tags,Notes';
  const rows = [
    'Jane,Smith,jane@acme.com,+1 555 100 2000,Acme Corp,VP of Engineering,Technology,https://linkedin.com/in/janesmith,"enterprise, hot-lead",Met at SaaStr',
    'Bob,Jones,bob@globex.com,,Globex Inc,Sales Director,Manufacturing,,,Follow up Q3',
  ];
  return [header, ...rows].join('\n');
}
