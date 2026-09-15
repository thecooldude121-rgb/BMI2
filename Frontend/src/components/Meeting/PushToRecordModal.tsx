import React, { useEffect, useState } from 'react';
import { X, Link2 } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  pushToRecord, RELATED_TYPES, RELATED_TYPE_LABEL,
  type MeetingDetail, type RelatedType,
} from '../../utils/meetingsApi';
import { fetchDeals } from '../../utils/dealsApi';
import { fetchAccounts } from '../../utils/accountsApi';

/**
 * THE "PUSH TO DEAL OR ACCOUNT" ACTION.
 *
 * Writes through PUT /meetings/:id/relation, which is the only endpoint that
 * moves this field — the general PATCH deliberately refuses it, so there is one
 * place the workspace-ownership check on the target can be forgotten, and it
 * is not forgotten there.
 *
 * DEALS AND ACCOUNTS ARE PICKED FROM REAL LISTS, fetched here. Contacts and
 * leads are accepted by the API and are offered as a typed id rather than a
 * picker: this modal is the deal/account action Venkat described, and adding
 * two more list fetches to it for the rarer cases would slow the common one.
 * A typed id is validated by the server exactly like a picked one — it returns
 * "related_to_id does not name a contact in this workspace" — so nothing is
 * less safe, only less convenient.
 *
 * The server's rejection message is shown VERBATIM. It names the field and
 * never discloses whether the row exists in another workspace.
 */
const PushToRecordModal: React.FC<{
  isOpen: boolean;
  meeting: MeetingDetail;
  onClose: () => void;
  onPushed: () => void;
}> = ({ isOpen, meeting, onClose, onPushed }) => {
  const [type, setType] = useState<RelatedType>(meeting.related_to_type ?? 'deal');
  const [recordId, setRecordId] = useState(meeting.related_to_id ?? '');
  const [deals, setDeals] = useState<{ id: string; name: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    Promise.all([
      fetchDeals(200).then(rows => rows.map((d: { id: string; name?: string; title?: string }) => ({
        id: d.id, name: d.name || d.title || d.id,
      }))).catch(() => { throw new Error('deals'); }),
      fetchAccounts(200).then(rows => rows.map(a => ({ id: a.id, name: a.name })))
        .catch(() => { throw new Error('accounts'); }),
    ])
      .then(([d, a]) => { setDeals(d); setAccounts(a); setListError(null); })
      // A failed list is stated, not silently empty: an empty dropdown reads as
      // "you have no deals", which is a claim this modal cannot make.
      .catch(() => setListError('Could not load the deal and account lists. You can still enter an id.'));
  }, [isOpen]);

  if (!isOpen) return null;

  const options = type === 'deal' ? deals : type === 'company' ? accounts : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordId.trim()) { setError('Choose a record, or enter its id.'); return; }
    setSaving(true);
    setError(null);
    try {
      await pushToRecord(meeting.id, type, recordId.trim());
      onPushed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not link this meeting.');
    } finally {
      setSaving(false);
    }
  };

  const unlink = async () => {
    setSaving(true);
    setError(null);
    try {
      await pushToRecord(meeting.id, null);
      onPushed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unlink this meeting.');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-gray-900 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-gray-400" aria-hidden="true" />
            Push to a record
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="push-type" className="block text-[12px] font-medium text-gray-700 mb-1">
              Record type
            </label>
            <select
              id="push-type" className={field} value={type}
              onChange={e => { setType(e.target.value as RelatedType); setRecordId(''); setError(null); }}
            >
              {RELATED_TYPES.map(t => (
                <option key={t} value={t}>{RELATED_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="push-record" className="block text-[12px] font-medium text-gray-700 mb-1">
              {RELATED_TYPE_LABEL[type]}
            </label>
            {options ? (
              <select id="push-record" className={field} value={recordId}
                onChange={e => { setRecordId(e.target.value); setError(null); }}>
                <option value="">Choose a {RELATED_TYPE_LABEL[type].toLowerCase()}…</option>
                {options.map(o => <option key={o.id} value={o.id}>{o.name} ({o.id})</option>)}
              </select>
            ) : (
              <input id="push-record" className={field} value={recordId}
                onChange={e => { setRecordId(e.target.value); setError(null); }}
                placeholder={`${RELATED_TYPE_LABEL[type]} id`} />
            )}
            {listError && <p className="text-[11px] text-amber-700 mt-1">{listError}</p>}
          </div>

          <p className="text-[11px] leading-relaxed text-gray-500">
            Activities you log from this note will attach to the record you choose, and appear
            on its own activity feed.
          </p>

          {error && (
            <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            {meeting.related_to_type ? (
              <Button type="button" variant="ghost" onClick={unlink} disabled={saving}>
                Unlink
              </Button>
            ) : <span />}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Linking…' : 'Link'}</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PushToRecordModal;
