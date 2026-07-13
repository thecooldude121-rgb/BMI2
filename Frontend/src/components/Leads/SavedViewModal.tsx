import React, { useState, useEffect, useCallback } from 'react';
import { X, Pin, Trash2, Edit2, Check, AlertTriangle } from 'lucide-react';
import type { LeadView } from '../../types/lead';

// ── Types ─────────────────────────────────────────────────────────────────────

type Visibility = 'private' | 'team' | 'organization';

interface CreateProps {
  mode: 'create';
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, visibility: Visibility) => Promise<void>;
}

interface EditProps {
  mode: 'edit';
  isOpen: boolean;
  onClose: () => void;
  viewId?: string;
  initialName?: string;
  initialVisibility?: string;
  onUpdate: (name: string, visibility: Visibility) => Promise<void>;
}

interface ManageProps {
  mode: 'manage';
  isOpen: boolean;
  onClose: () => void;
  savedViews: LeadView[];
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPin: (id: string) => Promise<void>;
}

type Props = CreateProps | EditProps | ManageProps;

// ── Visibility selector ───────────────────────────────────────────────────────

const VISIBILITY_OPTIONS: Array<{ value: Visibility; label: string; description: string }> = [
  { value: 'private',      label: 'Private',      description: 'Only you can see this view' },
  { value: 'team',         label: 'Team',         description: 'Your team members can see this' },
  { value: 'organization', label: 'Organization', description: 'Everyone in the org can see this' },
];

const visibilityBadgeColor: Record<Visibility, string> = {
  private:      'bg-gray-100 text-gray-600',
  team:         'bg-blue-100 text-blue-700',
  organization: 'bg-green-100 text-green-700',
};

// ── Shared overlay wrapper ────────────────────────────────────────────────────

const Overlay: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div
      className="fixed inset-0"
      onClick={onClose}
      aria-hidden
    />
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
      {children}
    </div>
  </div>
);

// ── Create / Edit form (shared layout) ───────────────────────────────────────

interface ViewFormProps {
  title: string;
  confirmLabel: string;
  initialName?: string;
  initialVisibility?: string;
  onConfirm: (name: string, visibility: Visibility) => Promise<void>;
  onClose: () => void;
  showSaveOptions?: boolean;
}

const ViewForm: React.FC<ViewFormProps> = ({
  title, confirmLabel, initialName = '', initialVisibility = 'private',
  onConfirm, onClose, showSaveOptions = true,
}) => {
  const [name, setName]               = useState(initialName);
  const [visibility, setVisibility]   = useState<Visibility>((initialVisibility as Visibility) ?? 'private');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('View name is required.'); return; }
    setSaving(true);
    try {
      await onConfirm(name.trim(), visibility);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
      setSaving(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            View name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            maxLength={50}
            placeholder="e.g. High-value qualified leads"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          <p className="mt-1 text-xs text-gray-400">{name.length}/50</p>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
          <div className="space-y-2">
            {VISIBILITY_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                  visibility === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={visibility === opt.value}
                  onChange={() => setVisibility(opt.value)}
                  className="mt-0.5 mr-3 text-blue-600"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Save options (create mode only) */}
        {showSaveOptions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Save with</label>
            <div className="space-y-2">
              {[
                { label: 'Current filters', checked: true, disabled: true },
                { label: 'Search query',    checked: true, disabled: false },
                { label: 'Sort order',      checked: true, disabled: false },
                { label: 'View mode (list / grid / kanban)', checked: true, disabled: false },
              ].map(item => (
                <label key={item.label} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={item.checked}
                    disabled={item.disabled}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 disabled:opacity-60"
                  />
                  <span className={`text-sm ${item.disabled ? 'text-gray-400' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                  {item.disabled && <span className="text-xs text-gray-400">(always saved)</span>}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : confirmLabel}
          </button>
        </div>
      </form>
    </>
  );
};

// ── Manage mode row ───────────────────────────────────────────────────────────

const ManageRow: React.FC<{
  view: LeadView;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onPin: (id: string) => Promise<void>;
}> = ({ view, onRename, onDelete, onPin }) => {
  const [editing, setEditing]           = useState(false);
  const [editName, setEditName]         = useState(view.name);
  const [confirmingDelete, setConfirm]  = useState(false);

  const handleRenameSubmit = async () => {
    if (!editName.trim()) return;
    await onRename(view.id, editName.trim());
    setEditing(false);
  };

  if (confirmingDelete) {
    return (
      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center space-x-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Delete <strong>{view.name}</strong>?</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setConfirm(false)}
            className="px-3 py-1 text-xs font-medium border border-gray-300 rounded hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={() => onDelete(view.id)}
            className="px-3 py-1 text-xs font-medium bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 py-2 px-1 group">
      {/* Drag handle (visual only) */}
      <div className="text-gray-300 cursor-grab select-none">⠿</div>

      {/* Name or edit input */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setEditing(false); }}
              className="flex-1 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none"
              autoFocus
            />
            <button onClick={handleRenameSubmit} className="p-1 text-green-600 hover:bg-green-50 rounded">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 truncate">{view.name}</span>
            {view.is_pinned && <Pin className="h-3 w-3 text-blue-500 flex-shrink-0" />}
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${visibilityBadgeColor[view.visibility ?? 'private']}`}>
              {view.visibility ?? 'private'}
            </span>
          </div>
        )}
      </div>

      {/* Actions (shown on hover) */}
      {!editing && (
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onPin(view.id)}
            title={view.is_pinned ? 'Unpin' : 'Pin'}
            className={`p-1.5 rounded hover:bg-gray-100 ${view.is_pinned ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { setEditing(true); setEditName(view.name); }}
            title="Rename"
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setConfirm(true)}
            title="Delete"
            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main modal component ──────────────────────────────────────────────────────

const SavedViewModal: React.FC<Props> = (props) => {
  useEffect(() => {
    if (!props.isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') props.onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [props.isOpen, props.onClose]);

  if (!props.isOpen) return null;

  if (props.mode === 'create') {
    return (
      <Overlay onClose={props.onClose}>
        <ViewForm
          title="Save current view"
          confirmLabel="Save View"
          showSaveOptions
          onConfirm={props.onSave}
          onClose={props.onClose}
        />
      </Overlay>
    );
  }

  if (props.mode === 'edit') {
    return (
      <Overlay onClose={props.onClose}>
        <ViewForm
          title="Edit view"
          confirmLabel="Update View"
          initialName={props.initialName}
          initialVisibility={props.initialVisibility}
          showSaveOptions={false}
          onConfirm={props.onUpdate}
          onClose={props.onClose}
        />
      </Overlay>
    );
  }

  // Manage mode
  const { savedViews, onRename, onDelete, onPin, onClose } = props;
  const sorted = [...savedViews].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return a.view_order - b.view_order;
  });

  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Manage Views</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            No saved views yet. Create one from the views bar.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {sorted.map(view => (
              <ManageRow
                key={view.id}
                view={view}
                onRename={onRename!}
                onDelete={onDelete!}
                onPin={onPin!}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Done
        </button>
      </div>
    </Overlay>
  );
};

export default SavedViewModal;
