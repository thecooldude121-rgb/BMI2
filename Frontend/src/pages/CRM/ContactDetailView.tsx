import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Calendar, DollarSign, Edit, MoreVertical, ExternalLink,
  Building2, AlertTriangle, Users, Trash2, Download, Plus, MapPin, Linkedin, Clock,
  Check, Loader2, AlertCircle,
} from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { NotAvailable, NotAvailableBadge } from '../../components/common/NotAvailable';
import LogActivityModal from '../../components/CRM/LogActivityModal';
import { useToast } from '../../contexts/ToastContext';
import { deleteContactViaAPI, fetchContactById, fetchContacts, updateContactViaAPI } from '../../utils/contactsApi';
import { fetchAccountById } from '../../utils/accountsApi';
import { fetchDealsForContact } from '../../utils/dealsApi';
import type { RelatedDeal } from '../../utils/dealsApi';
import { fetchActivities, sortActivitiesNewestFirst, activityTimestamp } from '../../utils/activitiesApi';
import type { ActivityRecord, ActivityType } from '../../utils/activitiesApi';
import { findDuplicateMatches, computeRisk } from '../../utils/leadDuplicates';
import type { DuplicateMatch } from '../../utils/leadDuplicates';
import { toCsv } from '../../utils/csv';
import { CONTACT_ROLES, findContactRole, roleChipClasses } from '../../config/contactRoles';
import type { Contact, ContactSource, ContactStatus } from '../../types/contact';
import type { EnhancedAccount } from '../../types/accounts';

/**
 * Contact detail.
 *
 * REBUILT. The previous version loaded the real contact for its header and then
 * rendered a 90-line `mockData` object for everything else, so EVERY contact in
 * the database displayed:
 *
 *   - the same deal, "Acme Corp - Enterprise Plan", $50,000, closing March 15
 *   - the same "AI Deal Health: 78/100" and "Win Probability: 67%"
 *   - the same "Engagement Score: 87/100", "3 meetings in last 30 days",
 *     "Email response rate: 92% (Industry avg: 35%)", "sentiment 85% Positive"
 *   - the same Contact Score of 87, hardcoded as literals in the JSX
 *   - the same "Churn Risk: Low (8%)" and "+$25,000 upsell opportunity"
 *   - the same two Similar Contacts, Sarah Lee at 89% and Mike Chen at 82%
 *   - a hardcoded activity timeline: a Product Demo "Today (Nov 15)" with an AI
 *     summary claiming "Budget confirmed at $50K", "Competitor mentioned:
 *     Salesforce", and "Deal stage: Qualified → Proposal, 3 tasks created
 *     automatically"
 *   - "Data Sources: Apollo.io ✓ LinkedIn ✓ Clearbit ✓ · Last enriched 2 hours
 *     ago · Accuracy: 94%" — no integration exists
 *   - "⚠️ No recruitment data for Acme Corp", with the company name hardcoded
 *     regardless of whose record you were looking at
 *
 * A contact created ten seconds ago showed a $50K deal in Proposal. That is not
 * an unfinished feature, it is a fabricated customer record, and it is worse
 * than a blank page because it is indistinguishable from real data.
 *
 * WHAT IS REAL NOW: the contact's own fields (including everything migration 020
 * added, which no page displayed), its account via companies.id, its activities
 * via activities.contact_id, its deals via deals.contact_email, and possible
 * duplicates via the shared detection engine. Activities can be logged, which is
 * what gives the timeline something to show — see LogActivityModal for why it
 * was empty.
 *
 * ALSO FIXED: three navigation handlers passed the CONTACT's id to another
 * entity's route — `/crm/deals/${id}`, `/crm/accounts/${id}` and
 * `/crm/leads/${id}` — so "View Deal" and "View Account" opened whatever
 * happened to share that id, or nothing.
 */

const STATUS_STYLES: Record<ContactStatus, string> = {
  'active':         'bg-green-100 text-green-800 border-green-300',
  'inactive':       'bg-gray-100 text-gray-700 border-gray-300',
  'do-not-contact': 'bg-red-100 text-red-800 border-red-300',
};
const STATUS_LABELS: Record<ContactStatus, string> = {
  'active': 'Active', 'inactive': 'Inactive', 'do-not-contact': 'Do not contact',
};
const SOURCE_LABELS: Record<ContactSource, string> = {
  'lead-gen': 'Lead generation tool', 'hrms': 'HRMS (recruitment)',
  'converted': 'Converted from a lead', 'manual': 'Manual entry',
  'website': 'Website form', 'referral': 'Referral', 'event': 'Event / conference',
  'import': 'Imported from a file',
};

const ACTIVITY_ICONS: Partial<Record<ActivityType, string>> = {
  call: '📞', email: '📧', meeting: '🎤', note: '📝', task: '✅',
  sms: '💬', whatsapp: '💬', linkedin: '🔗', demo: '🖥️',
  proposal: '📄', document: '📎', visit: '🚶',
};

/** Format a NUMERIC column, which pg returns as a string. */
function money(v: number | string | null | undefined): string {
  if (v == null || v === '') return '—';
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? `$${n.toLocaleString()}` : '—';
}

function formatDate(v: string | null | undefined): string {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(v: string | null | undefined): string {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const ContactDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Each related section tracks its own error. One failing request must not
  // blank the page, and a section that could not load must not read as empty —
  // "no deals" and "we could not find out" are different facts.
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [deals, setDeals] = useState<RelatedDeal[]>([]);
  const [dealsError, setDealsError] = useState<string | null>(null);
  const [account, setAccount] = useState<EnhancedAccount | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [duplicatePool, setDuplicatePool] = useState<Contact[]>([]);

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [logType, setLogType] = useState<ActivityType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingRole, setEditingRole] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  // ── The contact itself ────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetchContactById(id)
      .then(c => { if (!cancelled) setContact(c); })
      .catch(e => { if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Could not load contact'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  // ── Everything hanging off it ─────────────────────────────────────────────

  const loadActivities = useCallback(() => {
    if (!id) return;
    fetchActivities({ contact_id: id, limit: 100 })
      .then(rows => { setActivities(rows); setActivitiesError(null); })
      .catch(e => setActivitiesError(e instanceof Error ? e.message : 'Could not load activity'));
  }, [id]);

  useEffect(loadActivities, [loadActivities]);

  useEffect(() => {
    if (!contact?.email) return;
    let cancelled = false;
    fetchDealsForContact(contact.email)
      .then(rows => { if (!cancelled) { setDeals(rows); setDealsError(null); } })
      .catch(e => { if (!cancelled) setDealsError(e instanceof Error ? e.message : 'Could not load deals'); });
    return () => { cancelled = true; };
  }, [contact?.email]);

  useEffect(() => {
    // No companyId means the contact genuinely has no account linked, which is
    // not an error and must not be reported as one.
    if (!contact?.companyId) { setAccount(null); setAccountError(null); return; }
    let cancelled = false;
    fetchAccountById(contact.companyId)
      .then(a => { if (!cancelled) { setAccount(a); setAccountError(null); } })
      .catch(e => { if (!cancelled) setAccountError(e instanceof Error ? e.message : 'Could not load the account'); });
    return () => { cancelled = true; };
  }, [contact?.companyId]);

  useEffect(() => {
    let cancelled = false;
    fetchContacts({ limit: 500 })
      .then(rows => { if (!cancelled) setDuplicatePool(rows); })
      // A failed pool means no duplicate check ran. The panel says so rather
      // than reporting a clean result it never computed.
      .catch(() => { if (!cancelled) setDuplicatePool([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!contact || duplicatePool.length === 0) { setDuplicates([]); return; }
    setDuplicates(findDuplicateMatches(
      {
        id: contact.id, email: contact.email, phone: contact.phone,
        company: contact.company, full_name: contact.name,
      },
      duplicatePool.map(c => ({
        id: c.id, email: c.email, phone: c.phone, company: c.company, full_name: c.name,
      })),
    ));
  }, [contact, duplicatePool]);

  /**
   * A shared corporate email domain, on its own, describes COLLEAGUES — not the
   * same person entered twice. That is not hypothetical on this data: run the
   * real 20 contacts through the engine and it returns 14 matches across 9
   * contacts, of which 12 are a same-domain signal and nothing else. Eight
   * contact pages had no other kind of match at all, so they listed only
   * colleagues: Ryan Patel's page offered Alice Johnson and Tom Richards, three
   * different people at TechCorp. A panel whose entries are mostly wrong
   * teaches a user to ignore the ones that are right.
   *
   * So a domain match must now be CORROBORATED by another signal to be shown
   * here. The filter lives in this consumer rather than in the engine on
   * purpose: for LEADS a shared domain is a genuine hint — the same person
   * arriving twice from one company is the common case there — and
   * leadDuplicates has tests asserting exactly that behaviour. Narrowing the
   * engine would change the Leads page silently.
   */
  const corroborated = useMemo(
    () => duplicates.filter(m => m.signals.some(s => s.type !== 'domain')),
    [duplicates],
  );
  const domainOnlyCount = duplicates.length - corroborated.length;

  const duplicateRisk = useMemo(
    () => (corroborated.length ? computeRisk(corroborated) : null),
    [corroborated],
  );
  const poolById = useMemo(() => new Map(duplicatePool.map(c => [c.id, c])), [duplicatePool]);

  const timeline = useMemo(() => sortActivitiesNewestFirst(activities), [activities]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!contact) return;
    setShowMoreOptions(false);
    if (!window.confirm(`Delete ${contact.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteContactViaAPI(contact.id);
      addToast(`${contact.name} deleted`, 'success');
      navigate('/crm/contacts');
    } catch (e) {
      // A contact named by a quote comes back as a 409 explaining why.
      addToast(e instanceof Error ? e.message : 'Could not delete this contact', 'error');
    } finally {
      setDeleting(false);
    }
  };

  /**
   * The buying role — the same `contacts.buying_role` column the account team
   * editor writes (components/Accounts/AccountContactsSection.tsx), through the
   * same endpoint and the same vocabulary from config/contactRoles.ts. It is
   * deliberately not a second implementation: a role set here shows up there
   * and vice versa, and the server validates the value against
   * contacts_buying_role_check either way.
   *
   * Writes, then RE-READS the row. Optimistic local state would paint the role
   * as saved before the server accepted it, which is the
   * success-toast-over-an-unchanged-database pattern this project keeps
   * hitting. An empty string clears back to unassigned (mapContactToPayload
   * turns it into an explicit null), which is a different operation from
   * omitting the field.
   */
  const handleSetBuyingRole = async (role: string | null) => {
    if (!contact) return;
    setSavingRole(true);
    setRoleError(null);
    try {
      await updateContactViaAPI(contact.id, { buyingRole: role ?? '' });
      const fresh = await fetchContactById(contact.id);
      if (fresh) setContact(fresh);
      setEditingRole(false);
    } catch (e) {
      // Surfaced, never swallowed.
      setRoleError(e instanceof Error ? e.message : 'Could not save the buying role');
    } finally {
      setSavingRole(false);
    }
  };

  const handleExport = () => {
    if (!contact) return;
    setShowMoreOptions(false);
    const csv = toCsv(
      ['Name','Email','Phone','Mobile','Position','Department','Company','Street','City','State','Postal code','Country','Timezone','Source','Status','Owner','Tags','Notes','Created'],
      [[
        contact.name, contact.email, contact.phone, contact.mobile, contact.position,
        contact.department, contact.company, contact.street, contact.city, contact.state,
        contact.postalCode, contact.country, contact.timezone,
        contact.source ? SOURCE_LABELS[contact.source] : '', STATUS_LABELS[contact.status],
        contact.ownerName, contact.tags.join('; '), contact.notes, contact.createdAt,
      ]],
    );
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `contact_${contact.id}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    addToast('Contact exported to CSV', 'success');
  };

  // ── Gates ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading contact…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
        <p className="text-lg font-semibold text-gray-900">Could not load this contact</p>
        <p className="max-w-md text-center text-sm text-gray-600">{loadError}</p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()}>Try again</Button>
          <Button variant="secondary" onClick={() => navigate('/crm/contacts')}>Back to contacts</Button>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-4">
        <p className="text-lg font-semibold text-gray-900">Contact not found</p>
        <p className="max-w-md text-center text-sm text-gray-600">
          There is no contact with the id <code className="font-mono">{id}</code> in your account.
          It may have been deleted.
        </p>
        <Button onClick={() => navigate('/crm/contacts')}>Back to contacts</Button>
      </div>
    );
  }

  const roleCfg = findContactRole(contact.buyingRole);
  const address = [contact.street, contact.city, contact.state, contact.postalCode, contact.country]
    .filter(Boolean).join(', ');
  const initials = contact.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2);

  const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600 shrink-0">{label}</span>
      <span className="text-gray-900 text-right">{children}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <button
          onClick={() => navigate('/crm/contacts')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /><span className="text-sm">Contacts</span>
        </button>
      </div>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start space-x-6">
            <div className="h-20 w-20 bg-brand-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {initials}
            </div>
            <div className="space-y-3">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{contact.name}</h1>
                <p className="text-lg text-gray-600 mt-1">
                  {contact.position || 'No job title recorded'}
                  {contact.company && <> at {contact.company}</>}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 text-xs rounded-full font-semibold border ${STATUS_STYLES[contact.status]}`}>
                  {STATUS_LABELS[contact.status]}
                </span>

                {/* Buying role. findContactRole, NOT getContactRole — the
                    latter falls back to CONTACT_ROLES[0] and would label all
                    20 unassigned contacts a Champion. */}
                {savingRole ? (
                  <span className="px-3 py-1 text-xs rounded-full font-semibold border border-gray-300 text-gray-500 flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />Saving
                  </span>
                ) : roleCfg ? (
                  <button
                    type="button"
                    onClick={() => setEditingRole(!editingRole)}
                    title={roleCfg.description}
                    aria-expanded={editingRole}
                    className={`px-3 py-1 text-xs rounded-full font-semibold border ${roleChipClasses(roleCfg.chipColor)}`}
                  >
                    {roleCfg.label}
                  </button>
                ) : (
                  /* Unassigned reads as an action, not as a role. */
                  <button
                    type="button"
                    onClick={() => setEditingRole(!editingRole)}
                    aria-expanded={editingRole}
                    className="px-3 py-1 text-xs rounded-full font-semibold border border-dashed border-gray-300 text-gray-500 hover:text-brand-600 hover:border-brand-300"
                  >
                    + Set buying role
                  </button>
                )}

                {contact.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 text-xs rounded-full font-semibold border bg-gray-100 text-gray-800 border-gray-300">
                    {tag}
                  </span>
                ))}
              </div>

              {roleError && (
                <p className="text-sm text-red-700" role="alert">{roleError}</p>
              )}

              {editingRole && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {CONTACT_ROLES.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSetBuyingRole(r.id)}
                      disabled={savingRole}
                      title={r.description}
                      className={`text-xs px-2 py-1 rounded border font-medium disabled:opacity-50 ${
                        contact.buyingRole === r.id
                          ? roleChipClasses(r.chipColor)
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {contact.buyingRole === r.id && <Check className="h-3 w-3 inline mr-1" aria-hidden="true" />}
                      {r.label}
                    </button>
                  ))}
                  {contact.buyingRole && (
                    <button
                      type="button"
                      onClick={() => handleSetBuyingRole(null)}
                      disabled={savingRole}
                      className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 disabled:opacity-50"
                    >
                      Clear
                    </button>
                  )}
                  {/* Same advisory as the account team: a job title is not a
                      buying role. contacts.position holds "VP Sales"; the same
                      person can be the champion on one deal and the blocker on
                      another, which is why migration 026 shipped with no
                      backfill and nothing infers this. */}
                  <p className="w-full text-xs text-gray-500 flex items-start gap-1.5 mt-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-px" aria-hidden="true" />
                    Roles are not inferred from job titles. This is the same role the account
                    team on {contact.company || 'this account'} shows.
                  </p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  <a href={`mailto:${contact.email}`} className="text-brand-600 hover:underline">{contact.email}</a>
                </div>
                {contact.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-green-600" aria-hidden="true" />
                    <a href={`tel:${contact.phone}`} className="text-gray-700 hover:underline">{contact.phone}</a>
                  </div>
                )}
                {contact.mobile && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-green-600" aria-hidden="true" />
                    <a href={`tel:${contact.mobile}`} className="text-gray-700 hover:underline">{contact.mobile} (mobile)</a>
                  </div>
                )}
                {contact.linkedinUrl && (
                  <div className="flex items-center space-x-2">
                    <Linkedin className="h-4 w-4 text-blue-700" aria-hidden="true" />
                    <a
                      href={contact.linkedinUrl.startsWith('http') ? contact.linkedinUrl : `https://${contact.linkedinUrl}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Button variant="ghost" size="md" aria-label="Edit contact" onClick={() => navigate(`/crm/contacts/${contact.id}/edit`)}>
              <Edit className="h-5 w-5" aria-hidden="true" />
            </Button>
            <div className="relative">
              <Button
                variant="ghost" size="md" aria-label="More options"
                aria-haspopup="menu" aria-expanded={showMoreOptions}
                onClick={() => setShowMoreOptions(!showMoreOptions)}
              >
                <MoreVertical className="h-5 w-5" aria-hidden="true" />
              </Button>
              {showMoreOptions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <button onClick={handleExport} className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center gap-2">
                    <Download className="h-4 w-4" aria-hidden="true" />Export as CSV
                  </button>
                  {/* Merging needs a field-level review UI and a rule for what
                      happens to the losing record's activities. */}
                  <button
                    type="button" disabled
                    title="Merging contacts is not available yet"
                    className="w-full px-4 py-2 text-left text-sm text-gray-400 cursor-not-allowed flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" aria-hidden="true" />Merge contact
                    <NotAvailableBadge label="Soon" className="ml-auto" />
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={handleDelete} disabled={deleting}
                    className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {deleting ? 'Deleting…' : 'Delete contact'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email and Call are real: they hand off to the user's mail and phone
            apps. Log activity records what happened. Nothing here claims to
            send or dial by itself. */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={() => { window.location.href = `mailto:${contact.email}`; }}>
            <Mail className="h-4 w-4" aria-hidden="true" /><span>Email</span>
          </Button>
          {(contact.phone || contact.mobile) && (
            <Button variant="secondary" onClick={() => { window.location.href = `tel:${contact.phone || contact.mobile}`; }}>
              <Phone className="h-4 w-4" aria-hidden="true" /><span>Call</span>
            </Button>
          )}
          <Button variant="secondary" onClick={() => setLogType('call')}>
            <Plus className="h-4 w-4" aria-hidden="true" /><span>Log activity</span>
          </Button>
          <Button variant="secondary" onClick={() => setLogType('meeting')}>
            <Calendar className="h-4 w-4" aria-hidden="true" /><span>Schedule meeting</span>
          </Button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* ── Deals ───────────────────────────────────────────────── */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <span>Deals</span>
              </h2>

              {dealsError && <p className="text-sm text-red-700" role="alert">{dealsError}</p>}

              {!dealsError && deals.length === 0 && (
                <div className="text-sm text-gray-600 space-y-2">
                  <p>No deals are linked to this contact.</p>
                  {/* Being specific about HOW the link is made matters: a user
                      who knows a deal exists needs to know why it is not here. */}
                  <p className="text-xs text-gray-500">
                    Deals are matched to a contact by the email address stored on the deal
                    ({contact.email}). A deal created without that address will not appear here.
                  </p>
                </div>
              )}

              {!dealsError && deals.length > 0 && (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    Matched by email address on the deal, not a stored relationship.
                  </p>
                  <ul className="space-y-3">
                    {deals.map(d => (
                      <li key={d.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-gray-900">{d.name}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {money(d.value)}
                              {d.stage && <> · {d.stage}</>}
                              {d.probability != null && <> · {d.probability}% probability</>}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Expected close {formatDate(d.expected_close_date)}
                              {d.assigned_to && <> · {d.assigned_to}</>}
                            </p>
                          </div>
                          {/* The deal's OWN id. The old handler navigated to
                              /crm/deals/${contactId}. */}
                          <Button variant="secondary" size="sm" onClick={() => navigate(`/crm/deals/${d.id}`)}>
                            <span>View</span>
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            {/* ── Activity timeline ───────────────────────────────────── */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-brand-600" aria-hidden="true" />
                  <span>Activity</span>
                </h2>
                <Button variant="secondary" size="sm" onClick={() => setLogType('call')}>
                  <Plus className="h-4 w-4" aria-hidden="true" /><span>Log activity</span>
                </Button>
              </div>

              {activitiesError && (
                <p className="text-sm text-red-700" role="alert">
                  {activitiesError} — this contact's history could not be loaded, so treat it as
                  unknown rather than empty.
                </p>
              )}

              {!activitiesError && timeline.length === 0 && (
                <p className="text-sm text-gray-600">
                  Nothing has been logged for this contact yet. Use <strong>Log activity</strong> to
                  record a call, email, meeting or note.
                </p>
              )}

              {!activitiesError && timeline.length > 0 && (
                <ol className="space-y-4">
                  {timeline.map(a => (
                    <li key={a.id} className="border-l-4 border-brand-600 pl-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <p className="font-semibold text-gray-900">
                          <span aria-hidden="true">{a.type ? ACTIVITY_ICONS[a.type] ?? '•' : '•'}</span>{' '}
                          {a.subject}
                        </p>
                        <span className="text-xs text-gray-500 shrink-0">
                          {formatDateTime(activityTimestamp(a))}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.type}
                        {a.status && <> · {a.status === 'planned' ? 'planned' : a.status}</>}
                        {a.direction && <> · {a.direction === 'outbound' ? 'we contacted them' : 'they contacted us'}</>}
                        {a.duration != null && <> · {a.duration} min</>}
                        {a.created_by && <> · logged by {a.created_by}</>}
                      </p>
                      {a.description && <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{a.description}</p>}
                      {a.outcome && (
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">Outcome:</span> {a.outcome}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* ── The contact's own record ────────────────────────────── */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <span>Details</span>
              </h2>
              {/* These columns arrived with migration 020 and NO page displayed
                  them, so a note or an address typed into the form was saved and
                  then invisible. */}
              <div className="text-sm">
                <Row label="Department">{contact.department || '—'}</Row>
                <Row label="Address">{address || '—'}</Row>
                <Row label="Timezone">{contact.timezone || '—'}</Row>
                <Row label="Source">{contact.source ? SOURCE_LABELS[contact.source] : 'Not recorded'}</Row>
                <Row label="Owner">{contact.ownerName || 'Unassigned'}</Row>
                <Row label="Added">{formatDate(contact.createdAt)}</Row>
                <Row label="Last updated">{formatDate(contact.updatedAt)}</Row>
                <Row label="Reports to">
                  <NotAvailableBadge />
                </Row>
              </div>
              {contact.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
                </div>
              )}
            </section>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Account */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-700" aria-hidden="true" />
                  <span>Account</span>
                </h3>
                {account && (
                  <button
                    // The COMPANY's id. The old handler used the contact's.
                    onClick={() => navigate(`/accounts/${account.id}`)}
                    className="text-sm text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <span>View</span><ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </button>
                )}
              </div>

              {!contact.companyId && (
                <p className="text-sm text-gray-600">
                  This contact is not linked to an account. Link one by editing the contact and
                  picking a company from the search.
                </p>
              )}
              {accountError && <p className="text-sm text-red-700" role="alert">{accountError}</p>}
              {contact.companyId && !account && !accountError && (
                <p className="text-sm text-gray-600">Loading account…</p>
              )}
              {account && (
                <div className="text-sm">
                  <Row label="Name">{account.name}</Row>
                  <Row label="Industry">{account.industry || '—'}</Row>
                  {/* accountSize is the banded `companies.size` column.
                      employeeCount is deliberately absent in mapRowToAccount —
                      there is no exact-headcount column, and defaulting one
                      would invent a number. */}
                  <Row label="Size">{account.accountSize || '—'}</Row>
                  <Row label="Revenue">{money(account.annualRevenue)}</Row>
                  <Row label="Location">
                    {[account.billingAddress?.city, account.billingAddress?.country]
                      .filter(Boolean).join(', ') || '—'}
                  </Row>
                  {account.website && (
                    <Row label="Website">
                      <a
                        href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-brand-600 hover:underline"
                      >
                        {account.website}
                      </a>
                    </Row>
                  )}
                </div>
              )}
            </section>

            {/* Possible duplicates — the real engine, shared with leads */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" aria-hidden="true" />
                <span>Possible duplicates</span>
              </h3>
              {/* Replaces a "Similar Contacts" panel that listed the same two
                  invented people, with invented similarity percentages, on every
                  contact in the database. */}
              {duplicatePool.length === 0 ? (
                <p className="text-sm text-gray-600">
                  Could not check for duplicates, so this is unknown rather than clear.
                </p>
              ) : corroborated.length === 0 ? (
                <div className="text-sm text-gray-600 space-y-2">
                  <p>No likely duplicates among {duplicatePool.length} contacts.</p>
                  {/* Say what was excluded and why, so a user who can see three
                      colleagues in the list does not read this as a miss. */}
                  {domainOnlyCount > 0 && (
                    <p className="text-xs text-gray-500">
                      {domainOnlyCount} other contact{domainOnlyCount === 1 ? '' : 's'} share this
                      email domain. That alone means they are colleagues, not the same person, so
                      it is not counted here on its own.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    {corroborated.length} possible duplicate{corroborated.length === 1 ? '' : 's'} · {duplicateRisk} risk
                  </p>
                  <ul className="space-y-2">
                    {corroborated.slice(0, 5).map(m => {
                      const c = poolById.get(m.id);
                      return (
                        <li key={m.id} className="text-xs">
                          <button
                            onClick={() => navigate(`/crm/contacts/${m.id}`)}
                            className="font-semibold text-brand-600 hover:underline"
                          >
                            {c?.name ?? m.id}
                          </button>
                          {c?.company && <span className="text-gray-600"> · {c.company}</span>}
                          {/* Each signal carries its own reason from the engine. */}
                          <ul className="mt-0.5 list-disc list-inside text-gray-600">
                            {m.signals.map((s, i) => <li key={i}>{s.reason}</li>)}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                  {domainOnlyCount > 0 && (
                    <p className="text-xs text-gray-500 mt-3">
                      {domainOnlyCount} further contact{domainOnlyCount === 1 ? '' : 's'} share
                      only this email domain and are treated as colleagues, not duplicates.
                    </p>
                  )}
                </div>
              )}
            </section>

            <NotAvailable
              feature="Relationship intelligence"
              detail="Engagement scores, sentiment, response rates, churn risk and next-best-contact timing need email and calendar integration, none of which is connected. The activity log above is the real history."
            />
          </div>
        </div>
      </div>

      {logType && (
        <LogActivityModal
          isOpen
          onClose={() => setLogType(null)}
          parent={{ contact_id: contact.id }}
          parentLabel={contact.name}
          initialType={logType}
          onLogged={a => {
            // Prepend rather than refetch: the row is already authoritative,
            // it came back from the server.
            setActivities(prev => [a, ...prev]);
            addToast(`${a.subject} logged`, 'success');
          }}
        />
      )}
    </div>
  );
};

export default ContactDetailView;
