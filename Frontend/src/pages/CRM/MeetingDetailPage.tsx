import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Link2, AlertCircle, CheckSquare, Activity as ActivityIcon, Plus, Save,
} from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { Button } from '../../components/ui/Button';
import PushToRecordModal from '../../components/Meeting/PushToRecordModal';
import LogActivityModal from '../../components/Meeting/LogActivityModal';
import {
  fetchMeeting, updateMeeting, RELATED_TYPE_LABEL,
  type MeetingDetail,
} from '../../utils/meetingsApi';
import { formatDisplayDate } from '../../utils/dateUtils';

/**
 * MEETING DETAIL — the note, the record it belongs to, and what came out of it.
 *
 * ─── WHAT THIS REPLACED ────────────────────────────────────────────────────
 *
 * 2,810 lines reading `sampleMeetings`: an invented transcript summary, an
 * "AI Insights" rail, engagement percentages, sentiment and a list of action
 * items nobody had entered. It is rewritten rather than rewired because almost
 * none of it had a column behind it.
 *
 * ─── THE ONE RULE THIS PAGE EXISTS TO KEEP ─────────────────────────────────
 *
 * NOTHING READS THE NOTE AND SUGGESTS ANYTHING. There is no "action items
 * detected", no highlighted sentences, no "3 follow-ups found". The only way a
 * line of the note becomes an activity is a person opening "Log an activity"
 * and typing what it is — the subject is theirs, not something the UI guessed
 * at and pre-filled for them to accept. That mirrors the backend, which has no
 * parser either, and it is the difference between a tool and a Phase-2 feature
 * this project has not agreed to build.
 *
 * Tasks and activities shown here are REAL rows from the related record, not a
 * parallel concept invented for meetings. They are empty when the meeting has
 * no related record, which is a different fact from "this meeting produced
 * nothing" — stated as such below.
 */
const MeetingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [noteStatus, setNoteStatus] = useState<string | null>(null);
  const [showPush, setShowPush] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setError(null);
    fetchMeeting(id)
      .then(m => { setMeeting(m); setNotes(m.notes ?? ''); })
      .catch((e: Error) => { setMeeting(null); setError(e.message); });
  }, [id]);

  useEffect(load, [load]);

  const saveNotes = async () => {
    if (!id) return;
    setSavingNotes(true);
    setNoteStatus(null);
    try {
      await updateMeeting(id, { notes: notes.trim() || null });
      // Re-read rather than trusting the response: the whole page's other
      // panels derive from the stored row, and a toast over an unverified
      // write is this project's signature failure.
      const fresh = await fetchMeeting(id);
      setMeeting(fresh);
      setNotes(fresh.notes ?? '');
      setNoteStatus('Saved.');
    } catch (e) {
      setNoteStatus(e instanceof Error ? e.message : 'Could not save the note.');
    } finally {
      setSavingNotes(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMNavigation />
        <div className="p-8 max-w-2xl">
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[12px] text-red-800">
              Couldn&rsquo;t load this meeting.
              <span className="block text-red-600 mt-0.5">{error}</span>
            </p>
          </div>
          <Button className="mt-4" variant="secondary" onClick={() => navigate('/crm/meetings')}>
            Back to meetings
          </Button>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CRMNavigation />
        <div className="p-8"><p className="text-[12px] text-gray-400">Loading&hellip;</p></div>
      </div>
    );
  }

  const linked = meeting.related_to_type !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="p-8 max-w-4xl">
        <button
          onClick={() => navigate('/crm/meetings')}
          className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Meetings
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-1">
          <h1 className="text-[22px] font-semibold text-gray-900">{meeting.title}</h1>
          <Button variant="secondary" onClick={() => setShowPush(true)}>
            <Link2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {linked ? 'Change linked record' : 'Push to a deal or account'}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-500 mb-6">
          {meeting.date && <span>{formatDisplayDate(meeting.date)}</span>}
          {meeting.duration !== null && <span>{meeting.duration} min</span>}
          {meeting.owner_name && <span>Logged by {meeting.owner_name}</span>}
          {meeting.attendees && <span>Attendees: {meeting.attendees}</span>}
        </div>

        {/* ── The link ────────────────────────────────────────────────────── */}
        <div className={`rounded-lg border px-4 py-3 mb-6 ${
          linked ? 'border-indigo-200 bg-indigo-50' : 'border-amber-200 bg-amber-50'
        }`}>
          {linked ? (
            <p className="text-[12px] text-indigo-900">
              Linked to <strong>{RELATED_TYPE_LABEL[meeting.related_to_type!]} {meeting.related_to_id}</strong>.
              Activities logged from this note land on that record&rsquo;s own feed.
            </p>
          ) : (
            <p className="text-[12px] text-amber-900">
              <strong>Not linked to a record yet.</strong> Push this note to the deal or account
              it was about &mdash; until then there is nowhere for an activity from it to go, and
              the tasks below cannot be looked up.
            </p>
          )}
        </div>

        {/* ── The note ────────────────────────────────────────────────────── */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15px] font-semibold text-gray-900">Notes</h2>
            <div className="flex items-center gap-2">
              {noteStatus && <span className="text-[11px] text-gray-500">{noteStatus}</span>}
              <Button
                onClick={saveNotes}
                disabled={savingNotes || notes === (meeting.notes ?? '')}
              >
                <Save className="h-4 w-4 mr-1.5" aria-hidden="true" />
                {savingNotes ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
          <textarea
            rows={12}
            value={notes}
            onChange={e => { setNotes(e.target.value); setNoteStatus(null); }}
            placeholder="What was discussed, what was agreed, what happens next."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {/*
            * No "detected action items" strip under this box, and that absence
            * is deliberate — see the note at the top of this file.
            */}
          <p className="text-[11px] text-gray-400 mt-2">
            To turn something here into a follow-up on the linked record, use
            &ldquo;Log an activity&rdquo; below and say what it is. Nothing is read out of this
            note automatically.
          </p>
        </section>

        {/* ── Activities that came out of it ──────────────────────────────── */}
        <section className="rounded-lg border border-gray-200 bg-white p-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              Activities on the linked record
            </h2>
            <Button variant="secondary" onClick={() => setShowLog(true)} disabled={!linked}>
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Log an activity
            </Button>
          </div>

          {!linked ? (
            <p className="text-[12px] text-gray-500">
              Link this meeting to a record first &mdash; an activity needs somewhere to land.
            </p>
          ) : meeting.activities.length === 0 ? (
            <p className="text-[12px] text-gray-500">
              Nothing logged on {RELATED_TYPE_LABEL[meeting.related_to_type!]} {meeting.related_to_id} yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {meeting.activities.map(a => (
                <li key={a.id} className="py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                      {a.type}
                    </span>
                    <span className="text-[13px] text-gray-900">{a.subject}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {a.created_by && <>Logged by {a.created_by} · </>}
                    {formatDisplayDate(a.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {linked && (
            <p className="text-[11px] text-gray-400 mt-3">
              This is the record&rsquo;s whole activity feed, not only items from this meeting &mdash;
              activities carry their origin in their description rather than a meeting reference.
            </p>
          )}
        </section>

        {/* ── Tasks on the record ─────────────────────────────────────────── */}
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <CheckSquare className="h-4 w-4 text-gray-400" aria-hidden="true" />
            Open work on the linked record
          </h2>
          {!linked ? (
            <p className="text-[12px] text-gray-500">Link this meeting to a record to see its tasks.</p>
          ) : meeting.tasks.length === 0 ? (
            <p className="text-[12px] text-gray-500">
              No tasks on {RELATED_TYPE_LABEL[meeting.related_to_type!]} {meeting.related_to_id}.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {meeting.tasks.map(t => (
                <li key={t.id} className="py-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-gray-900">{t.title}</span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                    {t.status}
                  </span>
                  {t.due_date && <span className="text-[11px] text-gray-400">due {t.due_date}</span>}
                  {t.assigned_to && <span className="text-[11px] text-gray-400">· {t.assigned_to}</span>}
                </li>
              ))}
            </ul>
          )}
          {/*
            * These are the EXISTING task concept, surfaced by the record this
            * meeting is about. No meeting-specific task type was invented, and
            * `tasks` has no 'meeting' related type to add one to — that would
            * be a schema change belonging to tasks, not here.
            */}
        </section>
      </div>

      <PushToRecordModal
        isOpen={showPush}
        meeting={meeting}
        onClose={() => setShowPush(false)}
        onPushed={() => { setShowPush(false); load(); }}
      />

      <LogActivityModal
        isOpen={showLog}
        meeting={meeting}
        onClose={() => setShowLog(false)}
        onLogged={() => { setShowLog(false); load(); }}
      />
    </div>
  );
};

export default MeetingDetailPage;
