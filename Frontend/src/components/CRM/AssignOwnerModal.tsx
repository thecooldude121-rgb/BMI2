import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { getUsers } from '../../utils/dealsApi';

interface AssignableUser {
  id: number;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface AssignOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** How many contacts the choice will apply to — shown so a bulk assign is not ambiguous. */
  count: number;
  /** Called with the chosen user id, or null to unassign. */
  onAssign: (ownerId: number | null) => void | Promise<void>;
  busy?: boolean;
}

/**
 * Owner picker for one or many contacts.
 *
 * The contact form offered a hardcoded three-name dropdown — "Alex Rodriguez
 * (You)", "Sarah Johnson", "Mike Chen" — which matched no table and saved
 * nowhere. contacts.owner_id is a real FK to users(id) as of migration 020, so
 * the list comes from GET /users and the choice persists.
 *
 * Unassign is a deliberate option, not an omission: a contact with no owner is
 * a real and common state, and the only alternative is silently leaving the
 * previous owner attached.
 */
const AssignOwnerModal: React.FC<AssignOwnerModalProps> = ({ isOpen, onClose, count, onAssign, busy = false }) => {
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>('');

  // Fetch on open rather than on mount: this modal is rendered by a page that
  // is always mounted, so fetching on mount would hit /users on every page load
  // whether or not anyone opens it.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getUsers()
      .then(rows => { if (!cancelled) setUsers(rows as AssignableUser[]); })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load users'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen]);

  const label = (u: AssignableUser) =>
    [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={count === 1 ? 'Assign owner' : `Assign owner for ${count} contacts`}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            onClick={() => onAssign(selected === '' ? null : Number(selected))}
            disabled={busy || loading || !!error}
          >
            {busy ? 'Assigning…' : 'Assign'}
          </Button>
        </div>
      }
    >
      {loading && <p className="text-sm text-gray-600">Loading users…</p>}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error} — nothing has been changed.
        </p>
      )}

      {!loading && !error && (
        <div>
          <label htmlFor="assign-owner-select" className="block text-sm font-medium text-gray-700 mb-2">
            Owner
          </label>
          <select
            id="assign-owner-select"
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No owner (unassigned)</option>
            {users.map(u => (
              <option key={u.id} value={String(u.id)}>{label(u)}</option>
            ))}
          </select>
          {users.length === 0 && (
            <p className="mt-2 text-sm text-gray-600">
              No users came back from the server, so there is no one to assign to.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default AssignOwnerModal;
