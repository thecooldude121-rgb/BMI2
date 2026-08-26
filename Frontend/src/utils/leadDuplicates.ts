// Note: types/duplicateDetection.ts contains a more complete type system intended for
// backend-integrated merge audit/rollback. Use those types when backend integration is ready.

import type { Lead } from '../types/lead';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SignalType = 'email' | 'phone' | 'domain' | 'name_company';
export type SignalStrength = 'exact' | 'high' | 'medium';
export type DuplicateRisk = 'low' | 'medium' | 'high';

export interface DuplicateSignal {
  type:     SignalType;
  strength: SignalStrength;
  reason:   string;
}

export interface DuplicateCandidate {
  leadId:    string;
  signals:   DuplicateSignal[];
  risk:      DuplicateRisk;
}

/**
 * The minimum a record needs for duplicate detection. Everything below operates
 * on this, not on `Lead`.
 *
 * WHY: the four signals only ever read an id, an email, a phone, a company and
 * a name. Leads were simply the first entity to need them. Contacts have the
 * same duplicate problem and had a "detector" that compared the email against
 * the literal string 'john@acme.com', so it fired for exactly one address and
 * silently passed everything else. Rather than write a second engine, the real
 * one is now shared — this is the same machinery, with the same tests behind it.
 */
export interface DuplicateSubject {
  id:         string;
  email?:     string;
  phone?:     string;
  company?:   string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
}

/** A candidate keyed by plain `id`, for entities that are not leads. */
export interface DuplicateMatch {
  id:      string;
  signals: DuplicateSignal[];
  risk:    DuplicateRisk;
}

// ── Levenshtein distance (inline, no external library) ─────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function nameSimilarity(a: string, b: string): SignalStrength | null {
  const na = a.toLowerCase().trim();
  const nb = b.toLowerCase().trim();
  if (!na || !nb) return null;
  if (na === nb) return 'exact';
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  const ratio = 1 - dist / maxLen;
  if (ratio >= 0.85) return 'high';
  if (ratio >= 0.70) return 'medium';
  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normPhone(p: string | undefined): string {
  return (p ?? '').replace(/\D/g, '');
}

/**
 * Canonical email-domain extraction. Exported because leadFilterEngine and
 * leadSorting both need it — leadSorting was hand-rolling
 * `email?.split('@')[1]`, which differs on case and on an email with no '@'.
 */
export function emailDomain(email: string | undefined): string {
  if (!email) return '';
  const at = email.indexOf('@');
  return at >= 0 ? email.slice(at + 1).toLowerCase() : '';
}

function subjectFullName(s: DuplicateSubject): string {
  return (
    s.full_name?.trim() ||
    [s.first_name, s.last_name].filter(Boolean).join(' ').trim()
  );
}

// ── Core detection ─────────────────────────────────────────────────────────

function detectSignals(lead: DuplicateSubject, candidate: DuplicateSubject): DuplicateSignal[] {
  const signals: DuplicateSignal[] = [];

  // Signal 1 — exact email
  const email1 = lead.email?.toLowerCase().trim();
  const email2 = candidate.email?.toLowerCase().trim();
  if (email1 && email2 && email1 === email2) {
    signals.push({ type: 'email', strength: 'exact', reason: `Same email: ${email1}` });
    return signals; // email exact match dominates — no need for further signals
  }

  // Signal 2 — exact phone
  const phone1 = normPhone(lead.phone);
  const phone2 = normPhone(candidate.phone);
  if (phone1.length >= 7 && phone2.length >= 7 && phone1 === phone2) {
    signals.push({ type: 'phone', strength: 'exact', reason: `Same phone: ${lead.phone}` });
  }

  // Signal 3 — email domain match
  const dom1 = emailDomain(lead.email);
  const dom2 = emailDomain(candidate.email);
  const GENERIC_DOMAINS = new Set(['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','protonmail.com','aol.com']);
  if (dom1 && dom2 && dom1 === dom2 && !GENERIC_DOMAINS.has(dom1)) {
    signals.push({ type: 'domain', strength: 'medium', reason: `Same company domain: @${dom1}` });
  }

  // Signal 4 — name + company similarity
  const name1 = subjectFullName(lead);
  const name2 = subjectFullName(candidate);
  const co1   = (lead.company ?? '').toLowerCase().trim();
  const co2   = (candidate.company ?? '').toLowerCase().trim();

  const nameStr = nameSimilarity(name1, name2);
  const coStr   = co1 && co2 ? nameSimilarity(co1, co2) : null;

  if (nameStr) {
    if (coStr) {
      const combined: SignalStrength =
        nameStr === 'exact' && coStr === 'exact' ? 'exact' :
        nameStr !== 'medium' && coStr !== 'medium' ? 'high' : 'medium';
      signals.push({
        type:     'name_company',
        strength: combined,
        reason:   `Similar name (${nameStr}) + company (${coStr ?? 'unknown'})`,
      });
    } else {
      signals.push({
        type:     'name_company',
        strength: nameStr === 'exact' ? 'high' : 'medium',
        reason:   `Similar name (${nameStr}), no company to compare`,
      });
    }
  }

  return signals;
}

function signalRisk(signals: DuplicateSignal[]): DuplicateRisk {
  for (const s of signals) {
    // Exact email or exact phone → always high
    if ((s.type === 'email' || s.type === 'phone') && s.strength === 'exact') return 'high';
    // Exact name+company → high
    if (s.type === 'name_company' && s.strength === 'exact') return 'high';
    // High-confidence name+company → high
    if (s.type === 'name_company' && s.strength === 'high') return 'high';
  }

  const mediumOrHighCount = signals.filter(
    s => s.strength === 'exact' || s.strength === 'high' || s.strength === 'medium',
  ).length;

  // domain + any other signal → medium
  const hasDomain = signals.some(s => s.type === 'domain');
  const hasOther  = signals.some(s => s.type !== 'domain');
  if (hasDomain && hasOther) return 'medium';

  // 2+ medium signals → medium
  if (mediumOrHighCount >= 2) return 'medium';

  // 1 medium signal → low
  if (mediumOrHighCount >= 1) return 'low';

  return 'low';
}

// ── Public API ────────────────────────────────────────────────────────────────

const RISK_ORDER: Record<DuplicateRisk, number> = { high: 0, medium: 1, low: 2 };

/**
 * Find every record in `pool` that is a potential duplicate of `subject`.
 * Excludes `subject` itself (by id). Highest risk first.
 *
 * Entity-agnostic — see DuplicateSubject. `findDuplicates` below is the Lead
 * flavour and keeps its own return shape; nothing about lead behaviour changed.
 *
 * COST: O(pool) comparisons, each running Levenshtein over the name pair. That
 * is fine for the few hundred records a form has loaded and is NOT fine to call
 * per-keystroke over ten thousand — debounce it, as the callers do.
 */
export function findDuplicateMatches(
  subject: DuplicateSubject,
  pool: DuplicateSubject[],
): DuplicateMatch[] {
  const results: DuplicateMatch[] = [];
  for (const candidate of pool) {
    if (candidate.id === subject.id) continue;
    const signals = detectSignals(subject, candidate);
    if (signals.length === 0) continue;
    results.push({ id: candidate.id, signals, risk: signalRisk(signals) });
  }
  return results.sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);
}

/** Find all leads in `pool` that are potential duplicates of `lead`. Excludes `lead` itself. */
export function findDuplicates(lead: Lead, pool: Lead[]): DuplicateCandidate[] {
  // Disqualified and merged leads are not duplicate candidates — a lead already
  // ruled out must not keep resurfacing. That rule is lead-specific, which is
  // why it lives here and not in findDuplicateMatches.
  const live = pool.filter(
    c => c.status !== 'disqualified' && c.status !== ('merged' as string),
  );
  return findDuplicateMatches(lead, live).map(m => ({
    leadId:  m.id,
    signals: m.signals,
    risk:    m.risk,
  }));
}

/** Collapse a candidate list to the overall worst risk level for a single record. */
export function computeRisk(candidates: { risk: DuplicateRisk }[]): DuplicateRisk {
  if (candidates.some(c => c.risk === 'high'))   return 'high';
  if (candidates.some(c => c.risk === 'medium')) return 'medium';
  if (candidates.length > 0)                     return 'low';
  return 'low';
}

/** Build a domain-level duplicate set — backward-compat replacement for the old
 *  `duplicateEmailDomainSet` that was computed inside useLeadsPageState. */
export function buildDomainSet(leads: Lead[]): Set<string> {
  const GENERIC_DOMAINS = new Set(['gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com','protonmail.com','aol.com']);
  const counts: Record<string, number> = {};
  for (const l of leads) {
    const d = emailDomain(l.email);
    if (d && !GENERIC_DOMAINS.has(d)) counts[d] = (counts[d] ?? 0) + 1;
  }
  return new Set(Object.entries(counts).filter(([, n]) => n > 1).map(([d]) => d));
}
