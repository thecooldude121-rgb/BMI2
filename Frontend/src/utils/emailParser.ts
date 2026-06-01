// ─────────────────────────────────────────────────────────────────────────────
// Email-to-Deal parser interface + mock implementation
//
// Architecture note: EmailParser is a pure interface so any future
// implementation (Claude API, OpenAI, custom NLP) can be dropped in
// without touching the UI layer. The active instance is exported as
// `emailParser` — swap that single export to change backends.
// ─────────────────────────────────────────────────────────────────────────────

export interface Suggestion<T> {
  value: T;
  confidence: 'high' | 'medium' | 'low';
  evidence: string; // the snippet that produced this extraction
}

export interface ParsedEmailExtraction {
  account?: Suggestion<string>;
  contactName?: Suggestion<string>;
  contactEmail?: Suggestion<string>;
  dealName?: Suggestion<string>;
  dealValue?: Suggestion<number>;
  product?: Suggestion<string>;
  nextSteps?: Suggestion<string>;
  closeDate?: Suggestion<string>; // always ISO YYYY-MM-DD
}

export type ExtractionField = keyof ParsedEmailExtraction;

export interface EmailParser {
  parse(text: string): ParsedEmailExtraction;
}

// ─── Mock implementation using deterministic regex patterns ──────────────────

const MONTHS =
  'January|February|March|April|May|June|July|August|September|October|November|December';

const PERSONAL_DOMAINS = new Set([
  'gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'aol', 'proton', 'me',
]);

class MockEmailParser implements EmailParser {
  parse(text: string): ParsedEmailExtraction {
    const t = text.replace(/\r\n/g, '\n').trim();
    const result: ParsedEmailExtraction = {};

    result.account = this.extractAccount(t);
    result.contactName = this.extractContactName(t);
    result.contactEmail = this.extractContactEmail(t);
    result.dealValue = this.extractDealValue(t);
    result.closeDate = this.extractCloseDate(t);
    result.product = this.extractProduct(t);
    result.nextSteps = this.extractNextSteps(t);
    result.dealName = this.synthesizeDealName(result);

    // Remove undefined keys so callers can iterate cleanly
    (Object.keys(result) as ExtractionField[]).forEach(k => {
      if (result[k] === undefined) delete result[k];
    });

    return result;
  }

  // ── Account / Company ──────────────────────────────────────────────────────

  private extractAccount(t: string): Suggestion<string> | undefined {
    // From: header with corporate domain
    const fromHeader = t.match(/^From:\s*.+?<?\S+@([a-zA-Z0-9-]+\.[a-zA-Z]{2,})>?/m);
    if (fromHeader) {
      const domainBase = fromHeader[1].split('.')[0].toLowerCase();
      if (!PERSONAL_DOMAINS.has(domainBase)) {
        const company = this.prettifyDomain(domainBase);
        return { value: company, confidence: 'high', evidence: fromHeader[0].trim() };
      }
    }

    // "at / from / with / representing [Company]"
    const prepositionMatch = t.match(
      /\b(?:at|from|with|representing|joining)\s+([A-Z][A-Za-z0-9\s&'.,\-]{1,35}?)(?=\s*[,.\n(]|$)/m,
    );
    if (prepositionMatch) {
      const candidate = prepositionMatch[1].trim().replace(/[.,]$/, '');
      if (this.looksLikeCompany(candidate)) {
        return { value: candidate, confidence: 'medium', evidence: prepositionMatch[0].trim() };
      }
    }

    // Signature block: short capitalized line after closing salutation
    const sigBlock = t.match(
      /(?:Best regards?|Regards?|Thanks?|Sincerely|Cheers|Warm regards?),?\s*\n\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\s*\n\s*([A-Z][A-Za-z0-9\s&'.,\-]{2,35}?)\s*\n/i,
    );
    if (sigBlock) {
      const candidate = sigBlock[1].trim();
      if (this.looksLikeCompany(candidate)) {
        return { value: candidate, confidence: 'medium', evidence: sigBlock[0].trim() };
      }
    }

    // Organization: / Company: label
    const labelMatch = t.match(/^(?:Organization|Company|Org|Firm):?\s*(.+)$/im);
    if (labelMatch) {
      return { value: labelMatch[1].trim(), confidence: 'high', evidence: labelMatch[0].trim() };
    }

    return undefined;
  }

  // ── Contact Name ───────────────────────────────────────────────────────────

  private extractContactName(t: string): Suggestion<string> | undefined {
    // From: header — "First Last <email>"
    const fromName = t.match(/^From:\s*([A-Z][a-zA-Z'\-]+(?:\s+[A-Z][a-zA-Z'\-]+)+)\s*</m);
    if (fromName) {
      return { value: fromName[1].trim(), confidence: 'high', evidence: fromName[0].trim() };
    }

    // Signature: after closing salutation, first line = name
    const sigName = t.match(
      /(?:Best regards?|Regards?|Thanks?|Sincerely|Cheers|Warm regards?),?\s*\n\s*([A-Z][a-zA-Z'\-]+(?:\s+[A-Z][a-zA-Z'\-]+)+)/i,
    );
    if (sigName) {
      return { value: sigName[1].trim(), confidence: 'high', evidence: sigName[0].trim() };
    }

    // Greeting: "Hi / Hello / Dear [Name]"
    const greeting = t.match(/^(?:Hi|Hello|Dear|Hey),?\s+([A-Z][a-zA-Z'\-]+(?:\s+[A-Z][a-zA-Z'\-]+)?)/m);
    if (greeting) {
      return { value: greeting[1].trim(), confidence: 'medium', evidence: greeting[0].trim() };
    }

    // "spoke / met / talked with [Name]"
    const interacted = t.match(
      /\b(?:spoke|met|talked|spoke|called|chatted)\s+with\s+([A-Z][a-zA-Z'\-]+(?:\s+[A-Z][a-zA-Z'\-]+)?)/i,
    );
    if (interacted) {
      return { value: interacted[1].trim(), confidence: 'low', evidence: interacted[0].trim() };
    }

    return undefined;
  }

  // ── Contact Email ──────────────────────────────────────────────────────────

  private extractContactEmail(t: string): Suggestion<string> | undefined {
    const match = t.match(/\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b/);
    if (match) {
      return { value: match[1], confidence: 'high', evidence: match[0] };
    }
    return undefined;
  }

  // ── Deal Value ─────────────────────────────────────────────────────────────

  private extractDealValue(t: string): Suggestion<number> | undefined {
    // $X,XXX[.XX][K/M]
    const dollar = t.match(/\$\s*([\d,]+(?:\.\d{1,2})?)\s*([KkMm])?/);
    if (dollar) {
      const raw = parseFloat(dollar[1].replace(/,/g, ''));
      const value = this.applyMultiplier(raw, dollar[2]);
      return { value, confidence: 'high', evidence: dollar[0].trim() };
    }

    // "budget of [~] $?X [thousand/million/K/M]"
    const budget = t.match(
      /budget\s+(?:of\s+)?(?:around\s+|approximately\s+|roughly\s+)?\$?\s*([\d,]+)\s*(thousand|million|k|m)?/i,
    );
    if (budget) {
      const raw = parseFloat(budget[1].replace(/,/g, ''));
      const value = this.applyMultiplier(raw, budget[2]);
      return { value, confidence: 'medium', evidence: budget[0].trim() };
    }

    // "worth [~] X [thousand/million]"
    const worth = t.match(
      /worth\s+(?:around\s+|approximately\s+|roughly\s+)?\$?\s*([\d,]+)\s*(thousand|million|k|m)?/i,
    );
    if (worth) {
      const raw = parseFloat(worth[1].replace(/,/g, ''));
      const value = this.applyMultiplier(raw, worth[2]);
      return { value, confidence: 'medium', evidence: worth[0].trim() };
    }

    // "contract value / deal size of X"
    const contract = t.match(
      /(?:contract value|deal size|annual value|ACV|TCV)\s+(?:of\s+)?\$?\s*([\d,]+)\s*(thousand|million|k|m)?/i,
    );
    if (contract) {
      const raw = parseFloat(contract[1].replace(/,/g, ''));
      const value = this.applyMultiplier(raw, contract[2]);
      return { value, confidence: 'medium', evidence: contract[0].trim() };
    }

    return undefined;
  }

  // ── Close Date ─────────────────────────────────────────────────────────────

  private extractCloseDate(t: string): Suggestion<string> | undefined {
    // ISO date
    const iso = t.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (iso) {
      return { value: iso[1], confidence: 'high', evidence: iso[0] };
    }

    // "Month DD, YYYY" or "Month DD YYYY"
    const longDate = t.match(
      new RegExp(`\\b(${MONTHS})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'i'),
    );
    if (longDate) {
      const d = new Date(`${longDate[1]} ${longDate[2]}, ${longDate[3]}`);
      if (!isNaN(d.getTime())) {
        return { value: this.toISO(d), confidence: 'high', evidence: longDate[0] };
      }
    }

    // "by [Month] [YYYY]?" → end of that month
    const byMonth = t.match(new RegExp(`\\bby\\s+(${MONTHS})(?:\\s+(\\d{4}))?`, 'i'));
    if (byMonth) {
      const year = byMonth[2] || String(new Date().getFullYear());
      const d = this.endOfMonth(byMonth[1], year);
      return { value: this.toISO(d), confidence: 'medium', evidence: byMonth[0] };
    }

    // "end of [Month] [YYYY]?"
    const endOfMonth = t.match(new RegExp(`\\bend\\s+of\\s+(${MONTHS})(?:\\s+(\\d{4}))?`, 'i'));
    if (endOfMonth) {
      const year = endOfMonth[2] || String(new Date().getFullYear());
      const d = this.endOfMonth(endOfMonth[1], year);
      return { value: this.toISO(d), confidence: 'medium', evidence: endOfMonth[0] };
    }

    // "Q[1-4] YYYY"
    const quarter = t.match(/\bQ([1-4])\s+(\d{4})\b/i);
    if (quarter) {
      const endMonth = parseInt(quarter[1]) * 3;
      const d = new Date(parseInt(quarter[2]), endMonth, 0);
      return { value: this.toISO(d), confidence: 'medium', evidence: quarter[0] };
    }

    // "end of year" / "end of this year"
    if (/\bend\s+of\s+(?:the\s+)?year\b/i.test(t)) {
      return {
        value: `${new Date().getFullYear()}-12-31`,
        confidence: 'low',
        evidence: 'end of year',
      };
    }

    // "in/within/next N days/weeks/months"
    const relative = t.match(/\b(?:in|within|next)\s+(\d+)\s+(days?|weeks?|months?)\b/i);
    if (relative) {
      const n = parseInt(relative[1]);
      const unit = relative[2].toLowerCase();
      const d = new Date();
      if (unit.startsWith('day')) d.setDate(d.getDate() + n);
      else if (unit.startsWith('week')) d.setDate(d.getDate() + n * 7);
      else d.setMonth(d.getMonth() + n);
      return { value: this.toISO(d), confidence: 'low', evidence: relative[0] };
    }

    return undefined;
  }

  // ── Product ────────────────────────────────────────────────────────────────

  private extractProduct(t: string): Suggestion<string> | undefined {
    // "interested in / looking for / evaluating / demo of [product]"
    const intent = t.match(
      /\b(?:interested in|looking for|evaluating|demo of|trial of|piloting|need|purchase)\s+(?:your\s+|the\s+)?([A-Za-z0-9][A-Za-z0-9\s\-]{1,40}?)(?:\s+(?:solution|platform|software|module|package|plan|tier|product|tool|suite))?\b/i,
    );
    if (intent) {
      const candidate = intent[1].trim().replace(/[.,]$/, '');
      // filter noise words
      if (candidate.length > 2 && !/^(?:a|an|the|your|our|their|some|more|help|this|that)$/i.test(candidate)) {
        return { value: candidate, confidence: 'medium', evidence: intent[0].trim() };
      }
    }

    // Known keyword scan — ordered by specificity
    const keywords = [
      'HRMS', 'HCM', 'ERP', 'CRM', 'ATS', 'LMS', 'ITSM', 'WFM',
      'payroll', 'analytics', 'reporting', 'automation', 'integration',
      'enterprise plan', 'professional plan', 'starter plan', 'growth plan',
      'enterprise', 'professional', 'premium', 'starter', 'growth',
    ];
    for (const kw of keywords) {
      const re = new RegExp(`\\b(${kw}(?:\\s+(?:plan|package|module|suite|platform))?)\\b`, 'i');
      const m = t.match(re);
      if (m) {
        return { value: m[1].trim(), confidence: 'low', evidence: m[0] };
      }
    }

    return undefined;
  }

  // ── Next Steps ─────────────────────────────────────────────────────────────

  private extractNextSteps(t: string): Suggestion<string> | undefined {
    // "Next Steps:" / "Action Items:" label block
    const label = t.match(/(?:next steps?|action items?|to[\s-]do):?\s*\n?\s*(.{10,120}?)(?:\n\n|\n-|\n•|$)/i);
    if (label) {
      return { value: label[1].trim(), confidence: 'high', evidence: label[0].trim() };
    }

    // "I'll / I will [verb phrase]."
    const iWill = t.match(/\bI(?:'ll| will)\s+([a-z][^.!?\n]{8,80})[.!?]/i);
    if (iWill) {
      return { value: iWill[0].trim(), confidence: 'medium', evidence: iWill[0].trim() };
    }

    // "Let's / We should / Please [verb phrase]."
    const lets = t.match(/\b(?:Let's|We should|Please)\s+([a-z][^.!?\n]{8,80})[.!?]/i);
    if (lets) {
      return { value: lets[0].trim(), confidence: 'medium', evidence: lets[0].trim() };
    }

    // "follow up [on/with...]"
    const followUp = t.match(/\bfollow(?:\s+|-)?up\b[^.!?\n]{0,60}[.!?]/i);
    if (followUp) {
      return { value: followUp[0].trim(), confidence: 'low', evidence: followUp[0].trim() };
    }

    return undefined;
  }

  // ── Deal Name synthesis ────────────────────────────────────────────────────

  private synthesizeDealName(e: ParsedEmailExtraction): Suggestion<string> | undefined {
    const company = e.account?.value;
    if (!company) return undefined;

    const product = e.product?.value;
    const monthYear = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const confidence = e.account!.confidence === 'high' ? 'medium' : 'low';

    const name = product ? `${company} — ${product} — ${monthYear}` : `${company} — ${monthYear}`;
    return {
      value: name,
      confidence,
      evidence: `Synthesized from: company "${company}"${product ? ` + product "${product}"` : ''}`,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private applyMultiplier(raw: number, suffix?: string): number {
    const s = suffix?.toLowerCase();
    if (s === 'k') return raw * 1000;
    if (s === 'm' || s === 'million') return raw * 1_000_000;
    if (s === 'thousand') return raw * 1000;
    return raw;
  }

  private prettifyDomain(domain: string): string {
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  private looksLikeCompany(s: string): boolean {
    // Must be 2–5 words, not all stopwords
    const words = s.trim().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'in', 'of', 'for', 'to', 'our', 'your']);
    if (words.length < 1 || words.length > 5) return false;
    return !words.every(w => stopWords.has(w.toLowerCase()));
  }

  private endOfMonth(month: string, year: string): Date {
    const d = new Date(`${month} 1, ${year}`);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d;
  }

  private toISO(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}

// ── Active parser instance — swap this to change the backend ──────────────────
export const emailParser: EmailParser = new MockEmailParser();
