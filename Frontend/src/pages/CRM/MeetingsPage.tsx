import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Link2, AlertCircle, Search } from 'lucide-react';
import CRMNavigation from '../../components/CRM/CRMNavigation';
import { Button } from '../../components/ui/Button';
import NewMeetingModal from '../../components/Meeting/NewMeetingModal';
import {
  fetchMeetings, MEETING_TYPES, RELATED_TYPE_LABEL,
  type Meeting, type MeetingType,
} from '../../utils/meetingsApi';
import { formatDisplayDate } from '../../utils/dateUtils';

/**
 * MEETINGS — the real list. Meeting Agent, migration 049.
 *
 * ─── WHAT THIS REPLACED ────────────────────────────────────────────────────
 *
 * 1,230 lines fed entirely by `utils/sampleMeetingsData`: a six-tile stat bar
 * (47 total meetings, 12 upcoming, 35 recorded, 1 live now, 42 "AI processed"),
 * an "AI Insights" strip ("3 meetings this week need follow-up — Acme Corp
 * ($50K), TechStart ($42K), BigCo ($75K)"), and a list of invented meetings.
 * None of it came from anywhere; there was no meetings endpoint to come from.
 *
 * ─── WHAT THE STATS ARE NOW, AND WHAT THEY ARE NOT ─────────────────────────
 *
 * Two counts, both derived from the rows actually fetched: how many meetings
 * there are, and how many are not yet linked to a record. There is deliberately
 * no "recorded", no "live now" and no "AI processed" tile — recording and
 * transcription are explicitly out of scope for this module, so a tile counting
 * them would be counting a feature that does not exist. A tile that always
 * reads 0 is not honest either; it implies the thing is being measured.
 *
 * NOTHING HERE READS A NOTE AND SUGGESTS ANYTHING. No "action items detected",
 * no follow-up prompts, no priority ordering by inferred urgency. That is the
 * same rule the backend keeps, kept on this side too: the only way a note
 * becomes an activity is a person deciding it should, on the detail page.
 */

const TYPE_LABEL: Record<MeetingType, string> = {
  'sales-call': 'Sales call',
  internal: 'Internal',
  'client-meeting': 'Client meeting',
};

type Filter = 'all' | 'unlinked' | MeetingType;

const MeetingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);

  const load = useCallback(() => {
    setError(null);
    fetchMeetings()
      .then(setMeetings)
      // A failed load is NOT an empty list. An empty list says "no meetings
      // yet", which is a claim this page cannot make when the request failed.
      .catch((e: Error) => { setMeetings(null); setError(e.message); });
  }, []);

  useEffect(load, [load]);

  const visible = useMemo(() => {
    if (!meetings) return [];
    const q = search.trim().toLowerCase();
    return meetings.filter(m => {
      if (filter === 'unlinked' && m.related_to_type !== null) return false;
      if (filter !== 'all' && filter !== 'unlinked' && m.type !== filter) return false;
      if (!q) return true;
      return m.title.toLowerCase().includes(q)
        || (m.notes ?? '').toLowerCase().includes(q)
        || (m.attendees ?? '').toLowerCase().includes(q);
    });
  }, [meetings, filter, search]);

  const unlinkedCount = useMemo(
    () => (meetings ?? []).filter(m => m.related_to_type === null).length,
    [meetings],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMNavigation />

      <div className="p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[24px] font-semibold text-gray-900">Meetings</h1>
            <p className="text-[13px] text-gray-500 mt-1">
              Notes from your meetings, and the deals and accounts they belong to.
            </p>
          </div>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
            New meeting note
          </Button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-[12px] text-red-800">
              Couldn&rsquo;t load meetings, so none are shown &mdash; this is not an empty list.
              <span className="block text-red-600 mt-0.5">{error}</span>
              <button onClick={load} className="mt-1 underline hover:no-underline">Try again</button>
            </p>
          </div>
        )}

        {/*
          * Two counts, both from the fetched rows. "Needs linking" earns its
          * place because it is the one number that points at an action a user
          * can take — an unlinked note cannot carry an activity to a deal.
          */}
        {meetings !== null && meetings.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
              <p className="text-[11px] text-gray-500">Meetings</p>
              <p className="text-[20px] font-semibold text-gray-900 tabular-nums">{meetings.length}</p>
            </div>
            <button
              onClick={() => setFilter(filter === 'unlinked' ? 'all' : 'unlinked')}
              className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                filter === 'unlinked'
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <p className="text-[11px] text-gray-500">Not linked to a record</p>
              <p className="text-[20px] font-semibold text-gray-900 tabular-nums">{unlinkedCount}</p>
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search titles, notes and attendees"
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['all', ...MEETING_TYPES] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  filter === f
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? 'All' : TYPE_LABEL[f as MeetingType]}
              </button>
            ))}
          </div>
        </div>

        {meetings === null && !error && (
          <p className="text-[12px] text-gray-400">Loading meetings&hellip;</p>
        )}

        {meetings !== null && meetings.length === 0 && (
          /* A real EmptyState that says why it is empty and offers the action. */
          <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
            <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-3" aria-hidden="true" />
            <p className="text-[15px] font-medium text-gray-900">No meeting notes yet</p>
            <p className="text-[13px] text-gray-500 mt-1 max-w-md mx-auto">
              Write up a meeting, then push it to the deal or account it was about so the
              follow-ups land on that record&rsquo;s own activity feed.
            </p>
            <Button className="mt-4" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              New meeting note
            </Button>
          </div>
        )}

        {meetings !== null && meetings.length > 0 && visible.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-[13px] text-gray-600">
              None of your {meetings.length} meetings match this filter.
            </p>
          </div>
        )}

        {visible.length > 0 && (
          <ul className="space-y-2">
            {visible.map(m => (
              <li key={m.id}>
                <button
                  onClick={() => navigate(`/crm/meetings/${m.id}`)}
                  className="w-full text-left rounded-lg border border-gray-200 bg-white px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold text-gray-900">{m.title}</span>
                    {m.type && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                        {TYPE_LABEL[m.type]}
                      </span>
                    )}
                    {m.related_to_type ? (
                      <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                        <Link2 className="h-3 w-3" aria-hidden="true" />
                        {RELATED_TYPE_LABEL[m.related_to_type]} {m.related_to_id}
                      </span>
                    ) : (
                      /* Stated, not hidden: an unlinked note cannot push an
                         activity anywhere, and that is worth seeing in the list. */
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        Not linked
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[12px] text-gray-500">
                    {m.date && <span>{formatDisplayDate(m.date)}</span>}
                    {m.duration !== null && <span>{m.duration} min</span>}
                    {m.owner_name && <span>Logged by {m.owner_name}</span>}
                  </div>
                  {m.notes && (
                    <p className="mt-1.5 text-[12px] text-gray-600 line-clamp-2">{m.notes}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <NewMeetingModal
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        onCreated={meeting => { setShowNew(false); navigate(`/crm/meetings/${meeting.id}`); }}
      />
    </div>
  );
};

export default MeetingsPage;
