import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { AlertCircle, Edit2, Save, User } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  fetchMyProfile,
  updateMyProfile,
  MyProfile,
  ProfileUpdate,
} from '../../../utils/profileApi';
import { formatLastLogin, toMember } from '../../../utils/usersApi';

/**
 * Your account — now the real row, from GET /auth/me.
 *
 * WHAT WAS HERE. A <NotAvailable> banner over a page of placeholder text. The
 * name was "Alex Rodriguez", the phone "+1 (555) 123-4567", the location "San
 * Francisco, CA", the last login "Dec 13, 2024 at 9:45 AM" — none of it this
 * user's, and only the email came from the session. The four write handlers had
 * called `supabase.auth.updateUser()`, a service this product does not use, and
 * were left disabled because no endpoint existed to call instead. Both endpoints
 * exist now (commit c0afb00), so the banner is gone and the page reads and
 * writes the database.
 *
 * FIELD-BY-FIELD DISPOSITION of the twelve the old page displayed:
 *   WIRED, EDITABLE (3): first name, last name, email — the only three
 *     `PATCH /auth/me` accepts.
 *   WIRED, READ-ONLY (4): role, department, member since (created_at), last
 *     login (last_login_at). All real columns; none is settable by any endpoint
 *     this user can reach, so none is offered as a control. Role especially:
 *     the server refuses a role sent to PATCH /auth/me, which is the point.
 *   REMOVED, NO COLUMN (5): phone, job title, location, per-user timezone,
 *     language. TEAM_FIELDS_FOLLOWUP.md records phone and job_title as the two
 *     most likely to be worth adding; until they are, a control for them would
 *     be a save that returns 200 and stores nothing.
 *
 * ALSO REMOVED, and each for its own reason rather than as a batch:
 *   - The "Verified" badge beside the email. There is no email verification in
 *     this product — no confirmation step, no column, no transport (invites
 *     render to the log). Asserting an address is verified was a claim about a
 *     security property that does not exist.
 *   - The Change Email modal, whose text promised "We'll send a verification
 *     link". Nothing would have been sent. Email is edited inline with the rest
 *     of the profile, which is what the endpoint actually does.
 *   - Email visibility (Public / Private radios). No column, no enforcement
 *     anywhere; a privacy control that does not control anything is worse than
 *     its absence.
 *   - The avatar modal. `handleSaveAvatarColor` showed "Avatar color updated"
 *     and persisted nothing — a fake success. There is an `avatar_url` column
 *     but no upload endpoint and no colour column. The initials block stays; it
 *     is derived from the real name and id, the same derivation the team roster
 *     uses, and carries no information that is not already true.
 *   - The CHANGE PASSWORD section. It was a second copy of the form that lives
 *     under Account -> Password, which is the one now wired to
 *     POST /auth/change-password. Two password forms is one too many, and the
 *     duplicate is the one without a home in the nav.
 */

/** Capitalised for display only. The API's value is lowercase and stays so. */
const roleLabel = (role: string) => role.charAt(0).toUpperCase() + role.slice(1);

const memberSince = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const ProfileSettings: React.FC = () => {
  const { adoptUser } = useAuth();

  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  /** Adopt a row the server returned: it is the record, the form is not. */
  const adopt = useCallback((row: MyProfile) => {
    setProfile(row);
    setForm({ first_name: row.first_name, last_name: row.last_name, email: row.email });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMyProfile()
      .then(row => { if (!cancelled) adopt(row); })
      .catch((e: Error) => {
        // An error state, NOT an empty form. A blank profile that looks like a
        // real one is how a failed load gets mistaken for an empty account.
        if (!cancelled) setLoadError(e.message);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [adopt]);

  const startEditing = () => {
    if (!profile) return;
    setForm({ first_name: profile.first_name, last_name: profile.last_name, email: profile.email });
    setSaveError(null);
    setSaved(false);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (profile) setForm({ first_name: profile.first_name, last_name: profile.last_name, email: profile.email });
    setSaveError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    // ONLY THE CHANGED FIELDS. Resending an unchanged email would make every
    // save a candidate for the UNIQUE(tenant_id, email) 409 for no reason, and
    // resending an unchanged name risks clobbering it with whatever this form
    // happened to be holding.
    const updates: ProfileUpdate = {};
    if (form.first_name !== profile.first_name) updates.first_name = form.first_name;
    if (form.last_name !== profile.last_name) updates.last_name = form.last_name;
    if (form.email !== profile.email) updates.email = form.email;

    if (!Object.keys(updates).length) {
      // The server refuses an empty body with a 400. Saying so here is more
      // useful than round-tripping to be told.
      setSaving(false);
      setIsEditing(false);
      return;
    }

    try {
      const row = await updateMyProfile(updates);
      // Render the SERVER's row, not the typed one — a value the server trims or
      // normalises must not silently diverge from what is stored.
      adopt(row);
      // The top bar reads AuthContext, not this page. Without this the header
      // keeps showing the old name until a reload.
      adoptUser(row);
      setIsEditing(false);
      setSaved(true);
    } catch (e) {
      // The server's own words: "Someone in this workspace already uses that
      // email address", "first_name cannot be blank".
      setSaveError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="mt-6 text-sm text-gray-500">Loading your profile…</p>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <div role="alert" className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-medium text-red-900">Could not load your profile</p>
            <p className="mt-1 text-sm text-red-800">{loadError ?? 'No profile was returned.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const member = toMember(profile);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="mt-1 text-sm text-gray-600">Your name and email address, as stored in this workspace</p>
      </div>

      <div className="space-y-6">
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h3 className="flex items-center gap-2 font-semibold text-gray-900">
              <User className="h-5 w-5" />
              PROFILE INFORMATION
            </h3>
            {!isEditing && (
              <Button onClick={startEditing}>
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>

          <div className="p-6">
            {saved && !isEditing && (
              <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                Profile saved.
              </div>
            )}

            {!isEditing ? (
              <div className="space-y-4">
                <div className="flex items-start gap-6">
                  <div
                    className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${member.avatarColor} text-2xl font-semibold text-white`}
                  >
                    {member.initials}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900">{member.name}</h4>
                    <p className="text-sm text-gray-600">{profile.email}</p>
                    <p className="text-sm text-gray-600">{roleLabel(profile.role)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-t border-gray-200 pt-4">
                  <div>
                    <div className="text-xs font-medium uppercase text-gray-500">First Name</div>
                    <div className="mt-1 text-sm text-gray-900">{profile.first_name}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase text-gray-500">Last Name</div>
                    <div className="mt-1 text-sm text-gray-900">{profile.last_name}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase text-gray-500">Email</div>
                    <div className="mt-1 text-sm text-gray-900">{profile.email}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase text-gray-500">Role</div>
                    {/* Read-only on purpose: PATCH /auth/me refuses a role, so a
                        control here would be an offer to escalate that the
                        server would decline. An admin changes it in Team. */}
                    <div className="mt-1 text-sm text-gray-900">
                      {roleLabel(profile.role)}
                      <span className="ml-2 text-xs text-gray-500">set by an admin</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase text-gray-500">Department</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {profile.department || <span className="text-gray-500">Not set</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase text-gray-500">Member Since</div>
                    <div className="mt-1 text-sm text-gray-900">{memberSince(profile.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase text-gray-500">Last Login</div>
                    <div className="mt-1 text-sm text-gray-900">{formatLastLogin(profile.last_login_at)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {saveError && (
                  <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <p className="text-sm text-red-800">{saveError}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="profile-first-name" className="mb-2 block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      id="profile-first-name"
                      type="text"
                      value={form.first_name}
                      maxLength={50}
                      onChange={e => setForm({ ...form, first_name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="profile-last-name" className="mb-2 block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      id="profile-last-name"
                      type="text"
                      value={form.last_name}
                      maxLength={50}
                      onChange={e => setForm({ ...form, last_name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profile-email" className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={form.email}
                    maxLength={150}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                  {/* Stated because it is surprising, and because the old modal
                      claimed the opposite. There is no confirmation step: the
                      address changes on save, and it is the address you sign in
                      with from that moment. */}
                  <p className="mt-2 text-xs text-gray-500">
                    Changing this changes the address you sign in with, immediately. There is no
                    confirmation email — this workspace cannot send one yet.
                  </p>
                </div>

                <div className="flex gap-3 border-t border-gray-200 pt-4">
                  <Button onClick={handleSave} size="lg" disabled={saving}>
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
