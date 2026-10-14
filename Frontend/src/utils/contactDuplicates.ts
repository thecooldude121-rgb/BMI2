import { fetchContactsPage } from './contactsApi';
import { findDuplicateMatches, type DuplicateMatch } from './leadDuplicates';
import type { Contact } from '../types/contact';

/**
 * Possible duplicate contacts, found by asking the SERVER — slice 6b.
 *
 * Both the contact form and the contact page used to preload 500 contacts and
 * run the engine over them, so contact #501 was never compared; and the FORM
 * also reported a shared email domain on its own as a duplicate, which the PAGE
 * deliberately does not (a shared corporate domain describes colleagues).
 * Decided 2026-10-14: one rule, the contact page's, in one place.
 *
 * Candidates come from four narrow server queries — the email, the last (or
 * full) name, the company, and the phone's digits — then the same engine scores
 * them. A match whose ONLY signal is the email domain is dropped and counted.
 */
export interface ContactDuplicateSubject {
  id?: string;
  email?: string;
  phone?: string;
  company?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

export interface ContactDuplicateResult {
  matches: DuplicateMatch[];
  /** The candidate rows by id, for rendering a match. */
  byId: Map<string, Contact>;
  /** Same-domain colleagues left out, so a page can say it left them out. */
  domainOnly: number;
}

const PER_QUERY = 25;

export async function findContactDuplicates(subject: ContactDuplicateSubject): Promise<ContactDuplicateResult> {
  const email = subject.email?.trim();
  const name = (subject.last_name || subject.full_name || '').trim();
  const company = subject.company?.trim();
  const digits = (subject.phone ?? '').replace(/\D/g, '');

  const queries: Promise<{ contacts: Contact[] }>[] = [];
  if (email && email.includes('@')) queries.push(fetchContactsPage({ search: email, limit: PER_QUERY, offset: 0 }));
  if (name.length >= 2) queries.push(fetchContactsPage({ search: name, limit: PER_QUERY, offset: 0 }));
  if (company && company.length >= 2) queries.push(fetchContactsPage({ search: company, limit: PER_QUERY, offset: 0 }));
  if (digits.length >= 7 && digits.length <= 20) queries.push(fetchContactsPage({ phone_digits: digits, limit: PER_QUERY, offset: 0 }));
  if (queries.length === 0) return { matches: [], byId: new Map(), domainOnly: 0 };

  // A failed query THROWS: "we could not check" must not read as "no duplicates".
  const pages = await Promise.all(queries);
  const byId = new Map<string, Contact>();
  for (const p of pages) for (const c of p.contacts) byId.set(c.id, c);

  const all = findDuplicateMatches(
    { id: subject.id ?? '__new__', email, phone: subject.phone, company, first_name: subject.first_name, last_name: subject.last_name, full_name: subject.full_name },
    [...byId.values()].map(c => ({ id: c.id, email: c.email, phone: c.phone, company: c.company, full_name: c.name })),
  );
  const matches = all.filter(m => m.signals.some(s => s.type !== 'domain'));
  return { matches, byId, domainOnly: all.length - matches.length };
}
