import React, { useEffect, useState } from 'react';
import { X, Link2 } from 'lucide-react';
import { Button } from '../ui/Button';
import {
  pushToRecord, RELATED_TYPES,
  type MeetingDetail, type RelatedType,
} from '../../utils/meetingsApi';
import RecordPicker from '../common/RecordPicker';
import { RECORD_KIND_LABEL, type RecordOption } from '../../utils/recordSearch';

/**
 * THE "PUSH TO DEAL OR ACCOUNT" ACTION.
 *
 * Writes through PUT /meetings/:id/relation, which is the only endpoint that
 * moves this field — the general PATCH deliberately refuses it, so there is one
 * place the workspace-ownership check on the target can be forgotten, and it
 * is not forgotten there.
 *
 * EVERY TYPE IS PICKED BY SERVER SEARCH (slice 6). It loaded the first 200
 * deals and accounts — so deal #201 could not be chosen — and took contacts and
 * leads as a typed id. The server still validates the id like any other.
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
  const initial = (): RecordOption | null => meeting.related_to_type && meeting.related_to_id
    ? { kind: meeting.related_to_type, id: meeting.related_to_id, label: `${RECORD_KIND_LABEL[meeting.related_to_type]} ${meeting.related_to_id}` }
    : null;
  const [picked, setPicked] = useState<RecordOption | null>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (isOpen) { setError(null); setPicked(initial()); } }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!picked) { setError('Choose a record.'); return; }
    setSaving(true);
    setError(null);
    try {
      await pushToRecord(meeting.id, picked.kind as RelatedType, picked.id);
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
          <RecordPicker
            kinds={[...RELATED_TYPES]}
            value={picked}
            onChange={v => { setPicked(v); setError(null); }}
            label="Search for the record"
          />

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
