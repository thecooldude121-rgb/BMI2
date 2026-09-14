import {
  SIGNAL_CATEGORIES, type AccountIntelligenceProvider, type AccountIntelligenceResult,
  type AccountSignal,
} from './types';

/**
 * THE MOCK PROVIDER — sample content, and it says so in every layer.
 *
 * This exists because Capability 5's panel was wanted before Lead Gen exists to
 * supply it. It is PLACEHOLDER DEBT, tracked in CLAUDE.md, and it must come out
 * before a real customer sees this screen.
 *
 * ─── WHAT THIS DOES NOT DO, AND WHY ────────────────────────────────────────
 *
 * The project rule is that a panel which is not yet functional may be labelled
 * `PREVIEW · SAMPLE CONTENT` rather than deleted — but the thing being labelled
 * is normally a NUMBER. News is different in kind: an invented headline with a
 * source and a date is not a misleading metric, it is a fabricated news story
 * with a citation, and it would be indistinguishable from a real one the moment
 * anybody screenshots or pastes it. So:
 *
 *   - NO SOURCE NAME. `source` is null. Not "TechCrunch", not "Industry Wire",
 *     not an invented-but-plausible outlet.
 *   - NO URL. `url` is null. A link is the strongest possible claim that an
 *     item is real, and a dead one is worse than none.
 *   - NO TIMESTAMP. `published_at` is null. A date turns a generic sentence
 *     into a specific event that did not happen.
 *   - The text names itself. Every headline begins with "Sample:" so the string
 *     is still self-identifying if it is copied out of the UI, away from the
 *     PREVIEW badge that would otherwise be its only marker.
 *
 * That is the same reasoning the fabricated-credential rule uses: the blast
 * radius of this content extends past the app, so labelling the container is
 * not enough — each item has to carry its own label.
 *
 * ─── DETERMINISTIC, BUT NOT PRETENDING TO BE DATA ──────────────────────────
 *
 * The items are keyed off the domain only so the panel does not reshuffle on
 * every render. It is a stable presentation, NOT a lookup: no domain has
 * "its own" signals here, and two different companies get the same three
 * sentences with their own domain in them.
 */

/** Three shapes, chosen to exercise the panel's category rendering. */
const TEMPLATES: ReadonlyArray<{ category: AccountSignal['category']; headline: string; summary: string }> = [
  {
    category: 'news',
    headline: 'Sample: company announces a regional expansion',
    summary:
      'Placeholder text standing in for a news signal about this account. When Lead Gen supplies '
      + 'this panel, an item here will carry a real headline, source and date.',
  },
  {
    category: 'hiring',
    headline: 'Sample: several open engineering roles posted',
    summary:
      'Placeholder text standing in for a hiring signal. Hiring activity is one of the categories '
      + 'the integration will report; nothing about this account produced this line.',
  },
  {
    category: 'funding',
    headline: 'Sample: funding round reported',
    summary:
      'Placeholder text standing in for a funding signal. No funding event has been observed for '
      + 'this or any account — this is sample content.',
  },
];

export const PREVIEW_NOTE =
  'PREVIEW · SAMPLE CONTENT — these items are placeholders, not real news about this account. '
  + 'Nothing here is calculated from your data or retrieved from any news source.';

export class MockAccountIntelligenceProvider implements AccountIntelligenceProvider {
  readonly name = 'mock';
  readonly isPreview = true;

  async fetchSignals(companyDomain: string): Promise<AccountIntelligenceResult> {
    const domain = (companyDomain ?? '').trim();
    if (!domain) {
      // The caller is expected to have checked, but a provider that invents
      // signals for an account with no domain would be inventing the KEY too.
      return { status: 'error', detail: 'No company domain was supplied.' };
    }

    const signals: AccountSignal[] = TEMPLATES.map(t => ({
      category: t.category,
      headline: t.headline,
      summary: `${t.summary} (Account key: ${domain}.)`,
      // See the header: all three stay null in the mock, deliberately.
      source: null,
      url: null,
      published_at: null,
    }));

    return { status: 'ok', signals, preview: true, preview_note: PREVIEW_NOTE };
  }
}

/** Re-exported so a consumer importing the provider gets the vocabulary too. */
export { SIGNAL_CATEGORIES };
