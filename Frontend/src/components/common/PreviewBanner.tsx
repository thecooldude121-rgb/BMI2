import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * PREVIEW · SAMPLE CONTENT — the house convention, in ONE place.
 *
 * The convention predates this component: `CRMDashboard`'s old AI Insights
 * block and `SalesIntelligenceGuide` both spell it out inline. It is extracted
 * here because it now has several consumers, and a banner whose wording drifts
 * per page is a banner people stop reading.
 *
 * WHAT THIS IS FOR, AND WHAT IT IS NOT FOR. It marks a panel whose FIGURES are
 * not computed from the workspace's data. It is NOT sufficient for content that
 * makes claims about a customer — invented contact history, competitor
 * activity, a close probability on a named account — because the badge does not
 * travel with the sentence once somebody copies it. That class gets deleted
 * instead; see AICopilotPage and AIResponseDetailView, and the
 * fabricated-credential rule in CLAUDE.md, which draws the same line.
 *
 * `detail` is required, not optional. A bare badge tells a reader something is
 * wrong without telling them what, and every use of this convention in the
 * codebase so far has said specifically which figures are unbacked.
 */
export const PreviewBanner: React.FC<{
  /** What is not real, specifically. Required. */
  detail: React.ReactNode;
  /** Optional: what the reader should look at instead. */
  insteadTry?: React.ReactNode;
}> = ({ detail, insteadTry }) => (
  <div
    className="mb-6 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 px-5 py-3.5"
    role="note"
    data-preview="sample-content"
  >
    <div className="flex flex-wrap items-center gap-3">
      <AlertTriangle className="h-4 w-4 text-amber-700 flex-shrink-0" aria-hidden="true" />
      <span className="rounded-full bg-amber-700 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        Preview · sample content
      </span>
    </div>
    <p className="mt-2 text-[12px] leading-relaxed text-amber-900">{detail}</p>
    {insteadTry && (
      <p className="mt-1.5 text-[12px] leading-relaxed text-amber-800">{insteadTry}</p>
    )}
  </div>
);

export default PreviewBanner;
