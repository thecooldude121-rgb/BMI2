// Structural subset of Deal used for detection + merge display.
// All fields here exist on the DealsListView Deal interface —
// TypeScript's structural typing means Deal satisfies DuplicatableDeal automatically.
export interface DuplicatableDeal {
  id: string;
  dealName: string;
  companyName: string;
  accountName?: string;
  amount: number;
  closeDate?: string;
  stage: string;
  owner?: string;
  contactName?: string;
  nextStep?: string;
  source?: string;
  priority?: string;
}

export type DuplicateSignal = 'dealNameSimilar' | 'valueSimilar' | 'closeDateClose';
export type DuplicateConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface DuplicatePair {
  dealA: DuplicatableDeal;
  dealB: DuplicatableDeal;
  confidence: DuplicateConfidence;
  signals: DuplicateSignal[];
  accountSimilarity: number;
  pairKey: string;
}

// ── String similarity ─────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  'inc', 'llc', 'ltd', 'corp', 'corporation', 'co',
  'the', 'and', 'of', 'for', 'a', 'an',
]);

function tokenize(str: string): Set<string> {
  return new Set(
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 0 && !STOP_WORDS.has(t)),
  );
}

export function jaccardSimilarity(a: string, b: string): number {
  const tokA = tokenize(a);
  const tokB = tokenize(b);
  if (tokA.size === 0 || tokB.size === 0) return 0;
  let intersectionSize = 0;
  tokA.forEach(t => { if (tokB.has(t)) intersectionSize++; });
  const unionSize = tokA.size + tokB.size - intersectionSize;
  return intersectionSize / unionSize;
}

export function isAccountMatch(a: string, b: string): boolean {
  const normA = a.toLowerCase().trim();
  const normB = b.toLowerCase().trim();
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  return jaccardSimilarity(a, b) >= 0.75;
}

// ── Closed-stage detection ────────────────────────────────────────────────────

const CLOSED_FRAGMENTS = ['closed-won', 'closed-lost', 'closed won', 'closed lost'];

function isDealClosed(deal: DuplicatableDeal): boolean {
  return CLOSED_FRAGMENTS.some(f => deal.stage?.toLowerCase().includes(f));
}

// ── Core scoring ──────────────────────────────────────────────────────────────

export function scoreDuplicatePair(
  dealA: DuplicatableDeal,
  dealB: DuplicatableDeal,
): DuplicatePair | null {
  // Gate 1 — skip closed deals
  if (isDealClosed(dealA) || isDealClosed(dealB)) return null;

  // Gate 2 — accounts must match at ≥ 75% token similarity
  const accountA = (dealA.companyName?.trim() || dealA.accountName?.trim() || '');
  const accountB = (dealB.companyName?.trim() || dealB.accountName?.trim() || '');
  const accSim = jaccardSimilarity(accountA, accountB);
  if (!isAccountMatch(accountA, accountB)) return null;

  // Secondary signals
  const signals: DuplicateSignal[] = [];

  // Signal 1 — deal name similarity ≥ 65%
  const nameSim = jaccardSimilarity(dealA.dealName ?? '', dealB.dealName ?? '');
  if (nameSim >= 0.65) signals.push('dealNameSimilar');

  // Signal 2 — value within 20%
  const valA = Number(dealA.amount ?? 0);
  const valB = Number(dealB.amount ?? 0);
  if (valA > 0 && valB > 0) {
    const ratio = Math.min(valA, valB) / Math.max(valA, valB);
    if (ratio >= 0.80) signals.push('valueSimilar');
  }

  // Signal 3 — close date within 45 days
  if (dealA.closeDate && dealB.closeDate) {
    const diffDays =
      Math.abs(
        new Date(dealA.closeDate).getTime() - new Date(dealB.closeDate).getTime(),
      ) / 86_400_000;
    if (diffDays <= 45) signals.push('closeDateClose');
  }

  // Require MEDIUM threshold (≥ 2 signals)
  if (signals.length < 2) return null;

  const confidence: DuplicateConfidence = signals.length === 3 ? 'HIGH' : 'MEDIUM';
  const ids = [dealA.id, dealB.id].sort();

  return {
    dealA,
    dealB,
    confidence,
    signals,
    accountSimilarity: accSim,
    pairKey: `${ids[0]}:${ids[1]}`,
  };
}

// ── Pair finder ───────────────────────────────────────────────────────────────

export function findDuplicatePairs(deals: DuplicatableDeal[]): DuplicatePair[] {
  const pairs: DuplicatePair[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < deals.length; i++) {
    for (let j = i + 1; j < deals.length; j++) {
      const result = scoreDuplicatePair(deals[i], deals[j]);
      if (result && !seen.has(result.pairKey)) {
        seen.add(result.pairKey);
        pairs.push(result);
      }
    }
  }

  // HIGH confidence first
  return pairs.sort((a, b) =>
    a.confidence === 'HIGH' && b.confidence !== 'HIGH' ? -1
    : b.confidence === 'HIGH' && a.confidence !== 'HIGH' ? 1
    : 0,
  );
}
