import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Phone,
  Mail,
  Calendar,
  FileText,
  StickyNote,
} from 'lucide-react';
import type { ActivityRecord } from '../../utils/activitiesApi';

/**
 * Reads the activities table instead of fabricating a feed.
 *
 * The previous version did not show recent activity at all. It took the first
 * three leads, first two deals, first two tasks and first two meetings from
 * sample data, invented a caption for each ("New lead: …", "Deal updated: …")
 * regardless of what had actually happened to the record, and then ordered the
 * result with:
 *
 *     .sort(() => Math.random() - 0.5)
 *
 * So the list was neither recent nor stable — it reshuffled on every render,
 * and "Deal updated" appeared for deals nobody had touched.
 *
 * There is a real activities table with a real endpoint, which records what was
 * actually done and when. This renders that, newest first. It is currently
 * empty in the live database, and an empty feed is the correct output for a
 * database with no logged activity.
 */

interface RecentActivityProps {
  activities: ActivityRecord[];
  /** Set when the activities request failed, so empty is not read as "nothing happened". */
  failed?: boolean;
}

/** Icons keyed to the activities_type_check vocabulary. */
const TYPE_ICON: Record<string, typeof Users> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: FileText,
  note: StickyNote,
  sms: Mail,
  whatsapp: Mail,
  linkedin: Users,
  demo: Calendar,
  proposal: FileText,
  document: FileText,
  visit: Building2,
};

const RecentActivity: React.FC<RecentActivityProps> = ({ activities, failed = false }) => {
  const navigate = useNavigate();

  // Newest first, by when it happened rather than when the row was written.
  const ordered = [...activities].sort((a, b) => {
    const ta = new Date(a.completed_at ?? a.scheduled_at ?? a.created_at).getTime();
    const tb = new Date(b.completed_at ?? b.scheduled_at ?? b.created_at).getTime();
    return tb - ta;
  });

  /** Only navigates to a parent the row actually has. */
  const openParent = (a: ActivityRecord) => {
    if (a.lead_id) navigate(`/crm/leads/${a.lead_id}`);
    else if (a.deal_id) navigate(`/crm/deals/${a.deal_id}`);
    else if (a.contact_id) navigate(`/crm/contacts/${a.contact_id}`);
    else if (a.company_id) navigate(`/accounts/${a.company_id}`);
  };

  const subtitle = (a: ActivityRecord): string => {
    const parent =
      a.lead_name ?? a.deal_name ?? a.contact_name ?? a.company_name ?? null;
    const parts = [a.type, parent].filter(Boolean);
    return parts.join(' · ');
  };

  const when = (a: ActivityRecord): string => {
    const raw = a.completed_at ?? a.scheduled_at ?? a.created_at;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>

      {failed ? (
        <p className="text-sm text-red-600 py-8 text-center">
          Activity could not be loaded.
        </p>
      ) : ordered.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          No activity logged yet. Calls, emails and meetings appear here once
          they are recorded against a lead, deal, contact or account.
        </p>
      ) : (
        <div className="space-y-4">
          {ordered.map((a) => {
            const Icon = TYPE_ICON[a.type ?? ''] ?? StickyNote;
            const hasParent = !!(a.lead_id || a.deal_id || a.contact_id || a.company_id);

            return (
              <div
                key={a.id}
                className={`flex items-start space-x-3 p-3 rounded-md transition-colors ${
                  hasParent ? 'hover:bg-gray-50 cursor-pointer' : ''
                }`}
                {...(hasParent
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      onClick: () => openParent(a),
                      // onKeyDown, not the deprecated onKeyPress the old version
                      // used, and Space activates a button as well as Enter.
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openParent(a);
                        }
                      },
                    }
                  : {})}
              >
                <div className="flex-shrink-0 p-2 rounded-full bg-gray-100">
                  <Icon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.subject}</p>
                  <p className="text-sm text-gray-500 truncate">{subtitle(a)}</p>
                  <p className="text-xs text-gray-400 mt-1">{when(a)}</p>
                </div>
                {a.status && (
                  <span className="flex-shrink-0 text-xs text-gray-500">{a.status}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => navigate('/crm/activities')}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Activity
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;
