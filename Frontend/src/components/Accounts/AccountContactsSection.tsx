import React, { useState } from 'react';
import { Users, Mail, Phone, Plus, Linkedin, AlertCircle, Check, Loader2 } from 'lucide-react';
import { CONTACT_ROLES, findContactRole } from '../../config/contactRoles';
import type { Contact } from '../../types/contact';

/**
 * The account team — Phase-1 item 3, "account team (champion / decision-maker /
 * influencer / blocker)".
 *
 * REPLACES `EnhancedContactsSection`, whose props required an
 * `engagementScore`, a `lastContactDate` and a `totalInteractions` per contact.
 * None of those has a column: the page satisfied the types with
 * `engagementScore: idx === 0 ? 95 : idx === 1 ? 90 : 75` — index-based
 * fabrication sitting two lines below a comment explaining that the adjacent
 * index-based `role` had been removed for being exactly that.
 *
 * THE ROLE IS NOW REAL, AND SETTABLE HERE.
 * contacts.buying_role (migration 026) is nullable with no default and was
 * backfilled with nothing, because nothing could honestly populate it —
 * contacts.position holds a job title, and a VP Sales can be the champion on
 * one deal and the blocker on another. So every contact starts unassigned and
 * this control is how it stops being unassigned. A column with no way to set
 * it would stay NULL forever, which is why the editor ships with the column.
 *
 * An unset role renders as "Set role", not as a role. Note this uses
 * findContactRole, which returns undefined for an unknown id, and NOT
 * getContactRole, which falls back to CONTACT_ROLES[0] — Champion.
 */

interface Props {
  contacts: Contact[];
  loading?: boolean;
  error?: string | null;
  /** Persists the change; the parent owns the API call and the refresh. */
  onSetBuyingRole: (contactId: string, role: string | null) => Promise<void>;
  onContactClick: (contactId: string) => void;
  onAddContact: () => void;
}

const CHIP: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  green:  'bg-green-50 text-green-700 border-green-200',
  amber:  'bg-amber-50 text-amber-700 border-amber-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray:   'bg-gray-50 text-gray-600 border-gray-200',
  red:    'bg-red-50 text-red-700 border-red-200',
};

const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() || '?';

const AccountContactsSection: React.FC<Props> = ({
  contacts, loading, error, onSetBuyingRole, onContactClick, onAddContact,
}) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const commit = async (contactId: string, role: string | null) => {
    setSaving(contactId);
    setSaveError(null);
    try {
      await onSetBuyingRole(contactId, role);
      setEditing(null);
    } catch (e: any) {
      // Surfaced, never swallowed. A role that silently failed to save is a
      // success toast over an unchanged database.
      setSaveError(e?.message ?? 'Could not save the role');
    } finally {
      setSaving(null);
    }
  };

  // Coverage is computed from stored roles only. An unassigned contact counts
  // towards neither side — "we do not know" is not "we have no champion".
  const covered = new Set(
    contacts.map(c => c.buyingRole).filter((r): r is string => Boolean(r)),
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          Account team
          {!loading && <span className="text-sm font-normal text-gray-400">{contacts.length}</span>}
        </h2>
        <button
          onClick={onAddContact}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
        >
          <Plus className="h-4 w-4" /> Add contact
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          Could not load contacts for this account: {error}
        </div>
      )}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="h-14 bg-gray-50 rounded animate-pulse" />)}
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No contacts belong to this account yet.</p>
          <p className="text-xs text-gray-500 mt-1">
            A contact joins an account by having its company set on the contact record.
          </p>
          <button
            onClick={onAddContact}
            className="mt-3 text-xs bg-indigo-600 text-white rounded px-3 py-1.5 hover:bg-indigo-700 font-medium"
          >
            Add the first contact
          </button>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-gray-100">
            {contacts.map(c => {
              const cfg = findContactRole(c.buyingRole);
              const isEditing = editing === c.id;
              const isSaving = saving === c.id;
              return (
                <li key={c.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onContactClick(c.id)}
                      className="h-9 w-9 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-semibold text-indigo-700 flex-shrink-0 hover:bg-indigo-100"
                    >
                      {initialsOf(c.name)}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => onContactClick(c.id)}
                          className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                        >
                          {c.name}
                        </button>
                        {c.isPrimary && (
                          <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">Primary</span>
                        )}
                        {isSaving ? (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" /> Saving
                          </span>
                        ) : cfg ? (
                          <button
                            onClick={() => setEditing(isEditing ? null : c.id)}
                            className={`text-xs px-1.5 py-0.5 rounded border font-medium ${CHIP[cfg.chipColor] ?? CHIP.gray}`}
                            title={cfg.description}
                          >
                            {cfg.label}
                          </button>
                        ) : (
                          /* Unassigned. Reads as an action, not as a role. */
                          <button
                            onClick={() => setEditing(isEditing ? null : c.id)}
                            className="text-xs px-1.5 py-0.5 rounded border border-dashed border-gray-300 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 font-medium"
                          >
                            + Set role
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                        {c.position && <span>{c.position}</span>}
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-indigo-600">
                            <Mail className="h-3 w-3" />{c.email}
                          </a>
                        )}
                        {c.phone && (
                          <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>
                        )}
                        {c.linkedinUrl && (
                          <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-1 hover:text-indigo-600">
                            <Linkedin className="h-3 w-3" />LinkedIn
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-2 ml-12 flex flex-wrap gap-1.5 items-center">
                      {CONTACT_ROLES.map(r => (
                        <button
                          key={r.id}
                          onClick={() => commit(c.id, r.id)}
                          title={r.description}
                          className={`text-xs px-2 py-1 rounded border font-medium transition-colors ${
                            c.buyingRole === r.id
                              ? CHIP[r.chipColor] ?? CHIP.gray
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {c.buyingRole === r.id && <Check className="h-3 w-3 inline mr-1" />}
                          {r.label}
                        </button>
                      ))}
                      {c.buyingRole && (
                        <button
                          onClick={() => commit(c.id, null)}
                          className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Coverage advisory — only over roles someone has actually set. */}
          {contacts.some(c => !c.buyingRole) && (
            <p className="text-xs text-gray-500 mt-4 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
              {contacts.filter(c => !c.buyingRole).length} of {contacts.length} contacts have
              no buying role set. Roles are not inferred from job titles — set them here.
            </p>
          )}
          {contacts.length > 0 && !covered.has('decision-maker') && !covered.has('economic-buyer') && (
            <p className="text-xs text-amber-700 mt-1.5 flex items-start gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-px" />
              No contact on this account is marked a decision maker or economic buyer.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AccountContactsSection;
