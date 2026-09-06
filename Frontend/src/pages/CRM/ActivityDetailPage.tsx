import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Phone, Mail, Video, FileText, CheckCircle, Clock, Trash2,
  CalendarClock, User, Building2, Briefcase, UserCircle, AlertTriangle,
} from 'lucide-react';
import {
  fetchActivityById,
  updateActivity,
  deleteActivity,
  ACTIVITY_STATUSES,
  type ActivityRecord,
  type ActivityStatus,
} from '../../utils/activitiesApi';

/**
 * Activity detail.
 *
 * PHASE 2 REBUILD. The previous version was ~3,700 lines built entirely around
 * five hardcoded fixtures. It read 47 distinct fields off `activity` —
 * aiInsights, aiStrategy, aiTiming, emailTracking, recording, attendees,
 * checklist, engagementScore, riskAlert, crmAutoUpdates, referencedMaterials
 * and the rest — and almost none of them has a column, an API, or any data
 * source at all. `getMockActivity` also fell back to a fixture for ANY unknown
 * id, so once the timeline was wired to the API every click opened somebody
 * else's fabricated meeting.
 *
 * This is the same page rebuilt around what the database actually stores. It is
 * far smaller, and everything on it is either real or absent. The actions work:
 * activities support PUT and DELETE, so completing, rescheduling, reassigning
 * and deleting all persist.
 *
 * When call recordings, email tracking or AI summaries gain real storage, add
 * them here — one panel per real table, not one panel per imagined feature.
 */

const TYPE_ICON: Record<string, React.ReactNode> = {
  call:     <Phone className="h-5 w-5" />,
  email:    <Mail className="h-5 w-5" />,
  meeting:  <Video className="h-5 w-5" />,
  demo:     <Video className="h-5 w-5" />,
  visit:    <Building2 className="h-5 w-5" />,
  task:     <CheckCircle className="h-5 w-5" />,
};

const STATUS_STYLE: Record<string, string> = {
  completed:   'bg-green-100 text-green-800 border-green-200',
  planned:     'bg-blue-100 text-blue-800 border-blue-200',
  cancelled:   'bg-gray-100 text-gray-700 border-gray-200',
  no_show:     'bg-orange-100 text-orange-800 border-orange-200',
  rescheduled: 'bg-purple-100 text-purple-800 border-purple-200',
};

const PRIORITY_STYLE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800',
  high:   'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low:    'bg-gray-100 text-gray-700',
};

const formatStamp = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short',
    day: 'numeric', hour: 'numeric', minute: '2-digit',
  }) : '—';

/** The one record this activity hangs off, with a route to it. */
function parentOf(a: ActivityRecord): { label: string; name: string; to: string; icon: React.ReactNode } | null {
  if (a.deal_id)    return { label: 'Deal',    name: a.deal_name    || a.deal_id,           to: `/crm/deals/${a.deal_id}`,       icon: <Briefcase className="h-4 w-4" /> };
  if (a.contact_id) return { label: 'Contact', name: a.contact_name?.trim() || a.contact_id, to: `/crm/contacts/${a.contact_id}`, icon: <UserCircle className="h-4 w-4" /> };
  if (a.company_id) return { label: 'Account', name: a.company_name || a.company_id,        to: `/crm/accounts/${a.company_id}`, icon: <Building2 className="h-4 w-4" /> };
  if (a.lead_id)    return { label: 'Lead',    name: a.lead_name    || String(a.lead_id),   to: `/crm/leads/${a.lead_id}`,       icon: <User className="h-4 w-4" /> };
  return null;
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900">{children}</dd>
  </div>
);

const ActivityDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [activity, setActivity] = useState<ActivityRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    try {
      setActivity(await fetchActivityById(id));
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load this activity');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const patch = async (updates: Partial<ActivityRecord>, message: string) => {
    if (!activity) return;
    setSaving(true);
    try {
      setActivity(await updateActivity(activity.id, updates));
      setNotice(message);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not save the change');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activity) return;
    if (!window.confirm(`Delete "${activity.subject}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteActivity(activity.id);
      navigate('/crm/activities');
    } catch (e: any) {
      setError(e?.message ?? 'Could not delete the activity');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading activity…</p>
      </div>
    );
  }

  if (error && !activity) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-lg text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-semibold text-gray-900">Could not load this activity</h1>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Button onClick={() => navigate('/crm/activities')} className="mt-6">
            Back to Activities
          </Button>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-lg font-semibold text-gray-900">Activity not found</h1>
          <p className="mt-2 text-sm text-gray-600">It may have been deleted.</p>
          <Button onClick={() => navigate('/crm/activities')} className="mt-6">
            Back to Activities
          </Button>
        </div>
      </div>
    );
  }

  const parent = parentOf(activity);
  const isOverdue =
    activity.status === 'planned' && !!activity.scheduled_at && new Date(activity.scheduled_at) < new Date();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <button onClick={() => navigate('/crm/activities')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Activities
        </button>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}
        {notice && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
                {TYPE_ICON[activity.type ?? ''] ?? <FileText className="h-5 w-5" />}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{activity.subject}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700">
                    {activity.type ?? 'note'}
                  </span>
                  {activity.direction && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-700">
                      {activity.direction}
                    </span>
                  )}
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[activity.status ?? ''] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {(activity.status ?? 'planned').replace('_', ' ')}
                  </span>
                  {activity.priority && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLE[activity.priority] ?? 'bg-gray-100 text-gray-700'}`}>
                      {activity.priority}
                    </span>
                  )}
                  {isOverdue && (
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Overdue</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {activity.status !== 'completed' && (
                <button
                  onClick={() => void patch({ status: 'completed' }, 'Marked as completed')}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" /> Mark complete
                </button>
              )}
              <button
                onClick={() => void handleDelete()}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Details</h2>
              <dl className="grid gap-5 sm:grid-cols-2">
                <Field label="Scheduled">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-4 w-4 text-gray-400" />
                    {formatStamp(activity.scheduled_at)}
                  </span>
                </Field>
                <Field label="Completed">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                    {formatStamp(activity.completed_at)}
                  </span>
                </Field>
                <Field label="Duration">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {activity.duration != null ? `${activity.duration} minutes` : '—'}
                  </span>
                </Field>
                <Field label="Owner">{activity.assigned_to || 'Unassigned'}</Field>
              </dl>

              <div className="mt-6 space-y-5 border-t border-gray-100 pt-5">
                <Field label="Description">
                  {activity.description
                    ? <p className="whitespace-pre-wrap">{activity.description}</p>
                    : <span className="text-gray-400">No description recorded</span>}
                </Field>
                <Field label="Outcome">
                  {activity.outcome
                    ? <p className="whitespace-pre-wrap">{activity.outcome}</p>
                    : <span className="text-gray-400">No outcome recorded</span>}
                </Field>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Related to</h2>
              {parent ? (
                <button
                  onClick={() => navigate(parent.to)}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50"
                >
                  <span className="text-gray-400">{parent.icon}</span>
                  <span>
                    <span className="block text-xs uppercase tracking-wide text-gray-500">{parent.label}</span>
                    <span className="block text-sm font-medium text-gray-900">{parent.name}</span>
                  </span>
                </button>
              ) : (
                // The API rejects parentless activities, so this only appears for
                // rows created before that rule existed.
                <p className="text-sm text-gray-400">Not linked to a record</p>
              )}
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Status</h2>
              <label htmlFor="activity-status" className="sr-only">Activity status</label>
              <select
                id="activity-status"
                value={activity.status ?? 'planned'}
                disabled={saving}
                onChange={e => void patch({ status: e.target.value as ActivityStatus }, `Status set to ${e.target.value.replace('_', ' ')}`)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {ACTIVITY_STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Record</h2>
              <dl className="space-y-4">
                <Field label="Created by">{activity.created_by || '—'}</Field>
                <Field label="Created">{formatStamp(activity.created_at)}</Field>
                <Field label="Last updated">{formatStamp(activity.updated_at)}</Field>
              </dl>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailPage;
