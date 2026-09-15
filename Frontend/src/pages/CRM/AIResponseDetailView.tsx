import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

/**
 * AI RESPONSE DETAIL — PREVIEW. The fabricated strategy content is GONE.
 *
 * ─── WHAT THIS FILE USED TO BE ─────────────────────────────────────────────
 *
 * ~1,100 lines of invented sales strategy presented as analysis of real
 * accounts. A sample of what it asserted, all of it hardcoded:
 *
 *   - "If you execute the recommended actions, you have an 87% probability of
 *      closing at least 2 of these 3 deals before month-end."
 *   - "Competitor activity detected (LinkedIn mentions of Salesforce eval)"
 *   - "Call scheduled -> +10% close probability"
 *   - pre-filled ROI figures for a named company, rendered in an alert()
 *
 * It was reachable only from the AI Copilot's canned answers, which have also
 * been removed. Nothing links here now; the route is kept so an old bookmark
 * lands on this explanation rather than on a blank screen.
 *
 * ─── WHY DELETED RATHER THAN LABELLED ──────────────────────────────────────
 *
 * The house convention is a PREVIEW / SAMPLE CONTENT badge, and for a fake
 * METRIC that is enough. This was not a metric. "Competitor activity detected"
 * and "87% probability" are claims about a customer, and a probability attached
 * to a real account is the kind of thing that gets repeated in a forecast call.
 * The badge stays on the screen; the sentence does not. Same reasoning as the
 * fabricated-credential rule, and the same call made for DocumentDetailPage's
 * "12 views".
 *
 * The real build is P4 in the facade-page audit, behind CLAUDE.md's Phase-2
 * line on AI features.
 */
export default function AIResponseDetailView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <button
          onClick={() => navigate('/crm/ai-copilot')}
          className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to AI Copilot
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-8 py-12">
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Sparkles className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <h1 className="text-[20px] font-semibold text-gray-900">
              Strategy detail is not built
            </h1>
            <span className="rounded-full bg-gray-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Preview
            </span>
          </div>

          <p className="text-[13px] leading-relaxed text-gray-600">
            This page previously showed a detailed sales strategy &mdash; close
            probabilities, competitor activity and recommended next steps for
            named accounts. <strong>None of it was calculated from your data.</strong>{' '}
            It was fixed example text, so it has been removed rather than
            labelled: a close probability attached to a real account is the kind
            of figure that gets repeated in a forecast conversation, where a
            badge on this screen would not follow it.
          </p>

          <p className="text-[13px] leading-relaxed text-gray-600 mt-3">
            Figures that <em>are</em> computed from your own deals and quotas live
            on the dashboard&rsquo;s Sales Intelligence Guide and in Reports.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/crm/dashboard')}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-indigo-700"
            >
              Go to the dashboard
            </button>
            <button
              onClick={() => navigate('/crm/reports')}
              className="rounded-lg border border-gray-300 px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Open Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
