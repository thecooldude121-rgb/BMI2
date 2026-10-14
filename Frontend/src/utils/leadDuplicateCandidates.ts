import { fetchLeadsPage, checkLeadDuplicates, type LeadDuplicateMatch } from './leadsApi';
import type { Lead } from '../types/lead';

/**
 * Candidate leads for the duplicate ENGINE (utils/leadDuplicates), from the
 * SERVER — slice 6b. Quick Add, Lead detail and the conversion wizard scored a
 * lead against LeadContext's 50 preloaded leads; lead #51 was never compared.
 *
 * Candidates: the leads whose name / email / company match the subject's email,
 * last name or company (the list search), plus the exact email / phone-digits /
 * company+last-name match from POST /leads/duplicate-check (the search cannot
 * match phone digits). The caller scores them with findDuplicates, unchanged.
 * THROWS if a query fails.
 */
const PER_QUERY = 25;

export const matchToLead = (m: LeadDuplicateMatch): Lead => ({
  id: String(m.id), first_name: m.first_name ?? '', last_name: m.last_name ?? '', email: m.email ?? undefined,
  phone: m.phone ?? undefined, company: m.company ?? undefined, status: (m.stage ?? 'new') as Lead['status'],
} as unknown as Lead);

export async function findLeadDuplicateCandidates(subject: Partial<Lead> & { id?: string }): Promise<Lead[]> {
  const email = subject.email?.trim();
  const lastName = subject.last_name?.trim();
  const company = subject.company?.trim();
  const searches = [email && email.includes('@') ? email : null, lastName && lastName.length >= 2 ? lastName : null, company && company.length >= 2 ? company : null]
    .filter((q): q is string => !!q);
  const [pages, exact] = await Promise.all([
    Promise.all(searches.map(search => fetchLeadsPage({ search, limit: PER_QUERY, offset: 0 }))),
    email || subject.phone || (company && lastName)
      ? checkLeadDuplicates([{ email, phone: subject.phone, company, last_name: lastName }], subject.id)
      : Promise.resolve([] as (LeadDuplicateMatch | null)[]),
  ]);
  const byId = new Map<string, Lead>();
  for (const p of pages) for (const l of p.leads) byId.set(String(l.id), l);
  for (const m of exact) if (m && !byId.has(String(m.id))) byId.set(String(m.id), matchToLead(m));
  if (subject.id) byId.delete(String(subject.id));
  return [...byId.values()];
}
