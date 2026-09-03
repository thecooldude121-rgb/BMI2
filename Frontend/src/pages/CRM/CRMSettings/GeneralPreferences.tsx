import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Save, AlertCircle, Check } from 'lucide-react';
import { NotAvailable } from '../../../components/common/NotAvailable';
import {
  fetchWorkspace,
  updateWorkspace,
  timezoneOptions,
  detectedTimezone,
  CURRENCY_OPTIONS,
  type Workspace,
} from '../../../utils/workspaceApi';

/**
 * Workspace settings — the four fields the server actually stores.
 *
 * This page used to hold five selects over local `useState` and a Save button
 * with no handler: nothing loaded, nothing persisted, and nothing said so. The
 * layout and styling are kept; the data path is real.
 *
 * THE SPLIT IS DELIBERATE. `tenants` stores name, slug, and timezone /
 * default_currency inside its `settings` document (migration 035). It stores
 * nothing for date format, time format, week start or fiscal year start — and
 * `updateWorkspace` ignores body fields it does not recognise, so sending them
 * would return 200 while saving nothing. That is precisely the fake-success
 * pattern this codebase has spent its history removing, so those four are
 * separated out and labelled rather than wired to a silent no-op.
 */
const GeneralPreferences: React.FC = () => {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', timezone: '', default_currency: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ws = await fetchWorkspace();
      setWorkspace(ws);
      setForm({
        name: ws.name,
        slug: ws.slug,
        // Empty string means "not set", which is a real state — the server
        // returns null rather than inventing UTC, and the placeholder option
        // below says so.
        timezone: ws.timezone ?? '',
        default_currency: ws.default_currency ?? '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load workspace settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const dirty = workspace !== null && (
    form.name !== workspace.name ||
    form.slug !== workspace.slug ||
    form.timezone !== (workspace.timezone ?? '') ||
    form.default_currency !== (workspace.default_currency ?? '')
  );

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // Send only what changed, so an unrelated field cannot be clobbered by a
      // stale value this form happened to be holding. An emptied timezone or
      // currency is sent as null, which the server treats as "clear it" —
      // distinct from omitting the field, which leaves it alone.
      const updates: Record<string, string | null> = {};
      if (workspace && form.name !== workspace.name) updates.name = form.name.trim();
      if (workspace && form.slug !== workspace.slug) updates.slug = form.slug.trim();
      if (workspace && form.timezone !== (workspace.timezone ?? '')) {
        updates.timezone = form.timezone === '' ? null : form.timezone;
      }
      if (workspace && form.default_currency !== (workspace.default_currency ?? '')) {
        updates.default_currency = form.default_currency === '' ? null : form.default_currency;
      }

      // The server's response is the truth, not the form state. Rendering from
      // what came back is what makes a normalised value (a currency
      // upper-cased, say) visible instead of silently diverging.
      const updated = await updateWorkspace(updates);
      setWorkspace(updated);
      setForm({
        name: updated.name,
        slug: updated.slug,
        timezone: updated.timezone ?? '',
        default_currency: updated.default_currency ?? '',
      });
      setSaved(true);
    } catch (e) {
      // The server's real message — "That slug is already taken by another
      // workspace", "slug must be lowercase letters…", "Insufficient
      // permissions" — shown verbatim rather than a generic failure.
      setError(e instanceof Error ? e.message : 'Could not save workspace settings');
    } finally {
      setSaving(false);
    }
  };

  // Pass the stored value so an alias the canonical list omits still appears.
  const zones = timezoneOptions(workspace?.timezone ?? null);
  const detected = detectedTimezone();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">General Preferences</h2>
        <p className="text-sm text-gray-600 mt-1">Configure your workspace settings</p>
      </div>

      {loading && (
        <p className="text-sm text-gray-600" role="status">Loading workspace settings…</p>
      )}

      {error && (
        <div role="alert" className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!loading && workspace && (
        <div className="space-y-6">
          <div>
            <label htmlFor="ws-name" className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name
            </label>
            <input
              id="ws-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="ws-slug" className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Slug
            </label>
            <input
              id="ws-slug"
              type="text"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Lowercase letters, numbers and single hyphens. Used to identify this workspace when
              someone signs in to more than one.
            </p>
          </div>

          <div>
            <label htmlFor="ws-timezone" className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              id="ws-timezone"
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {/* An unset timezone is a real state, so it is offered as one
                  rather than being silently replaced by a guess. */}
              <option value="">Not set{detected ? ` — this device uses ${detected}` : ''}</option>
              {zones.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ws-currency" className="block text-sm font-medium text-gray-700 mb-2">
              Default Currency
            </label>
            <select
              id="ws-currency"
              value={form.default_currency}
              onChange={(e) => setForm({ ...form, default_currency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Not set — new deals use USD</option>
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Applied to new deals that do not specify their own currency. Existing deals keep the
              currency they were created with.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200 flex items-center gap-3">
            <Button size="lg" onClick={handleSave} disabled={saving || !dirty}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save Preferences'}
            </Button>
            {saved && !dirty && (
              <span role="status" className="inline-flex items-center gap-1 text-sm text-green-700">
                <Check className="h-4 w-4" aria-hidden="true" />
                Saved
              </span>
            )}
          </div>
        </div>
      )}

      {/*
        Date format, time format, week start and fiscal year start were selects
        on this page with no backend behind them. `tenants.settings` has no keys
        for them and the API ignores fields it does not recognise, so wiring the
        old controls would have produced a Save that reported success and
        changed nothing. Labelled instead, per the NotAvailable convention —
        which also means `grep -rl NotAvailable src/` still counts this as
        outstanding work.
      */}
      {!loading && (
        <div className="mt-10 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Display preferences</h3>
          <p className="text-sm text-gray-600 mb-4">
            Date format, time format, week start and fiscal year start.
          </p>
          <NotAvailable
            feature="Display preferences"
            detail="These are not stored yet — the workspace record has no fields for them. Dates are shown in your device's format for now. Workspace name, slug, timezone and default currency above are saved."
          />
        </div>
      )}
    </div>
  );
};

export default GeneralPreferences;
