import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { Button } from '../../components/ui/Button';

/**
 * MEETING TRANSCRIPT — NOT BUILT, and not being built in this module.
 *
 * ─── WHAT THIS FILE USED TO BE ─────────────────────────────────────────────
 *
 * 795 lines rendering `utils/meetingTranscriptMockData` (767 more): a
 * speaker-by-speaker transcript with timestamps, sentiment, "AI detected"
 * highlights, talk-time percentages and action items, for meetings that did not
 * happen. It had four modals of its own (share, download, detail, selection
 * menu), all operating on the same invented text.
 *
 * ─── WHY IT IS A STUB RATHER THAN A DELETION ───────────────────────────────
 *
 * Recording and transcription are explicitly OUT OF SCOPE for the Meeting
 * Agent (Venkat, 2026-09-15: notes, tasks and activities only) and are a
 * separate multi-week item if they are ever wanted. So there is nothing to
 * render and no endpoint to render it from.
 *
 * The route is kept because the meetings list used to link here and bookmarks
 * may exist; landing on an explanation beats landing on a 404 or, worse, on a
 * convincing transcript of a conversation nobody had. Deleting the route is a
 * one-line change whenever that is preferred.
 */
export default function MeetingTranscriptViewer() {
  const navigate = useNavigate();
  const { meetingId } = useParams<{ meetingId: string }>();

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />
      <div className="p-8 max-w-2xl">
        <button
          onClick={() => navigate(meetingId ? `/crm/meetings/${meetingId}` : '/crm/meetings')}
          className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to the meeting
        </button>

        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <FileText className="h-5 w-5 text-gray-400" aria-hidden="true" />
            <h1 className="text-[20px] font-semibold text-gray-900">Transcripts are not recorded</h1>
          </div>

          <p className="text-[13px] leading-relaxed text-gray-600">
            This CRM does not record or transcribe meetings. The Meeting Agent covers
            written notes, the tasks on the record a meeting is about, and turning a
            follow-up into a real activity &mdash; nothing is captured from a call.
          </p>

          <p className="text-[13px] leading-relaxed text-gray-600 mt-3">
            This page previously showed a full transcript with speakers, timestamps and
            talk-time percentages. <strong>None of those meetings happened</strong> &mdash; it
            was sample text, so it was removed rather than labelled.
          </p>

          <div className="mt-6">
            <Button onClick={() => navigate(meetingId ? `/crm/meetings/${meetingId}` : '/crm/meetings')}>
              Open the meeting note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
