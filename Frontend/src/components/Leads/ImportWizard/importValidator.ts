import type { ParsedRow, RowValidation, RowIssue, ColumnMapping, ParsedCSV } from './types';
import { applyMappings } from './columnMapper';
import type { Lead } from '../../../types/lead';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getLeadName(lead: Lead): string {
  return lead.full_name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';
}

function detectDuplicate(
  mapped: Partial<Record<string, string>>,
  contextLeads: Lead[],
): { isDuplicate: boolean; duplicateMatch?: { id: string; name: string; email?: string } } {
  const email = (mapped.email ?? '').toLowerCase().trim();
  const phone = (mapped.phone ?? '').replace(/\D/g, '').trim();
  const company = (mapped.company ?? '').toLowerCase().trim();
  const lastName = (mapped.last_name ?? '').toLowerCase().trim();

  for (const lead of contextLeads) {
    // Email match (strongest signal)
    if (email && lead.email?.toLowerCase() === email) {
      return { isDuplicate: true, duplicateMatch: { id: lead.id, name: getLeadName(lead), email: lead.email } };
    }
    // Phone match (strong)
    if (phone.length >= 7 && lead.phone?.replace(/\D/g, '') === phone) {
      return { isDuplicate: true, duplicateMatch: { id: lead.id, name: getLeadName(lead), email: lead.email } };
    }
    // Company + last name fallback
    if (company && lastName && lead.company?.toLowerCase() === company && lead.last_name?.toLowerCase() === lastName) {
      return { isDuplicate: true, duplicateMatch: { id: lead.id, name: getLeadName(lead), email: lead.email } };
    }
  }

  return { isDuplicate: false };
}

function validateMapped(mapped: Partial<Record<string, string>>): RowValidation {
  const issues: RowIssue[] = [];

  const hasName = !!(mapped.first_name || mapped.last_name || mapped.full_name);
  const hasCompany = !!(mapped.company);

  // Errors
  if (!hasName && !hasCompany) {
    issues.push({ field: 'name/company', message: 'Row has neither a name nor a company', tier: 'error' });
  }
  if (mapped.email && !isValidEmail(mapped.email)) {
    issues.push({ field: 'email', message: `Invalid email: ${mapped.email}`, tier: 'error' });
  }

  // Warnings
  if (!mapped.email && !mapped.phone) {
    issues.push({ field: 'contact', message: 'No email or phone — lead will be hard to contact', tier: 'warning' });
  }
  if (!mapped.phone && mapped.email) {
    issues.push({ field: 'phone', message: 'No phone number', tier: 'warning' });
  }
  if (mapped.first_name && mapped.first_name.length > 100) {
    issues.push({ field: 'first_name', message: 'Name is unusually long (>100 chars)', tier: 'warning' });
  }
  if (mapped.company && mapped.company.length > 200) {
    issues.push({ field: 'company', message: 'Company name is unusually long (>200 chars)', tier: 'warning' });
  }

  const hasErrors = issues.some(i => i.tier === 'error');
  const hasWarnings = issues.some(i => i.tier === 'warning');

  const tier = hasErrors ? 'error' : hasWarnings ? 'warning' : 'ok';
  return { tier, issues };
}

export function buildValidatedRows(
  parsed: ParsedCSV,
  mappings: ColumnMapping[],
  contextLeads: Lead[],
): ParsedRow[] {
  return parsed.rows.map((raw, index) => {
    const mapped = applyMappings(raw, mappings);
    const validation = validateMapped(mapped);
    const { isDuplicate, duplicateMatch } = detectDuplicate(mapped, contextLeads);
    return { index, raw, mapped, validation, isDuplicate, duplicateMatch };
  });
}

/**
 * Mark rows the SERVER matched to an existing lead (POST /leads/duplicate-check,
 * slice 6b). `matches[k]` belongs to `rows[k]`; null = no match. Rows keep any
 * flag they already carry.
 */
export function applyServerDuplicates(
  rows: ParsedRow[],
  matches: ({ id: number | string; first_name: string | null; last_name: string | null; email: string | null } | null)[],
): ParsedRow[] {
  return rows.map((r, k) => {
    const m = matches[k];
    if (!m) return r;
    const name = [m.first_name, m.last_name].filter(Boolean).join(' ') || m.email || String(m.id);
    return { ...r, isDuplicate: true, duplicateMatch: { id: String(m.id), name, email: m.email ?? undefined } };
  });
}
