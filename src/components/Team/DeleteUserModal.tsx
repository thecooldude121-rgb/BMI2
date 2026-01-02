import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, XCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  activeDeals?: number;
  assignedContacts?: number;
  openTasks?: number;
  totalActivities?: number;
  coachingNotes?: number;
}

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
  availableManagers: TeamMember[];
  onConfirm: (data: {
    dealsReassignTo: string;
    contactsReassignTo: string;
    tasksReassignTo: string;
  }) => void;
  onDeactivateInstead: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  member,
  availableManagers,
  onConfirm,
  onDeactivateInstead
}) => {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [dealsReassignTo, setDealsReassignTo] = useState('');
  const [contactsReassignTo, setContactsReassignTo] = useState('');
  const [tasksReassignTo, setTasksReassignTo] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmEmail !== member.email) {
      setError(`Email does not match. Please type "${member.email}" exactly`);
      return;
    }

    if (!dealsReassignTo || !contactsReassignTo || !tasksReassignTo) {
      setError('You must reassign all deals, contacts, and tasks before deleting');
      return;
    }

    onConfirm({
      dealsReassignTo,
      contactsReassignTo,
      tasksReassignTo
    });
    handleClose();
  };

  const handleClose = () => {
    setConfirmEmail('');
    setDealsReassignTo('');
    setContactsReassignTo('');
    setTasksReassignTo('');
    setError('');
    onClose();
  };

  const handleDeactivate = () => {
    handleClose();
    onDeactivateInstead();
  };

  const isValid =
    confirmEmail === member.email &&
    dealsReassignTo !== '' &&
    contactsReassignTo !== '' &&
    tasksReassignTo !== '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-red-200 bg-red-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-700 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">
              ⚠️ DELETE USER PERMANENTLY
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-red-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Danger Warning */}
          <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">
                <p className="font-bold text-base mb-1">🚨 DANGER: This action CANNOT be undone</p>
                <p className="font-medium">
                  All data will be permanently deleted and cannot be recovered.
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">User:</span>
                <span className="text-sm font-semibold text-gray-900">{member.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Email:</span>
                <span className="text-sm font-medium text-gray-900">{member.email}</span>
              </div>
            </div>
          </div>

          {/* What Will Be Deleted */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              This will PERMANENTLY DELETE:
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-red-700">
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><span className="font-semibold">User account</span></span>
              </li>
              <li className="flex items-start gap-2 text-sm text-red-700">
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><span className="font-semibold">Login credentials</span></span>
              </li>
              <li className="flex items-start gap-2 text-sm text-red-700">
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><span className="font-semibold">All assigned deals</span> ({member.activeDeals || 0} deals)</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-red-700">
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><span className="font-semibold">All assigned contacts</span> ({member.assignedContacts || 0} contacts)</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-red-700">
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><span className="font-semibold">All activities</span> ({member.totalActivities || 124} activities)</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-red-700">
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><span className="font-semibold">All coaching notes</span> ({member.coachingNotes || 5} notes)</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-red-700">
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><span className="font-semibold">All email history</span></span>
              </li>
              <li className="flex items-start gap-2 text-sm text-red-700">
                <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span><span className="font-semibold">All documents shared</span></span>
              </li>
            </ul>
          </div>

          {/* Important Warning */}
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
            <h3 className="text-sm font-bold text-yellow-900 mb-2">⚠️ IMPORTANT:</h3>
            <ul className="space-y-1 text-xs text-yellow-800">
              <li>• This cannot be undone</li>
              <li>• All data will be lost forever</li>
              <li>• Consider deactivating instead (data is preserved, can reactivate)</li>
            </ul>
          </div>

          {/* Reassignment Section */}
          <div className="border-t-2 border-gray-300 pt-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              Before deleting, you MUST reassign:
            </h3>

            <div className="space-y-4">
              {/* Deals Reassignment */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Reassign {member.activeDeals || 0} deals to:
                </label>
                <select
                  value={dealsReassignTo}
                  onChange={(e) => {
                    setDealsReassignTo(e.target.value);
                    setError('');
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    !dealsReassignTo && error ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a user...</option>
                  {availableManagers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Contacts Reassignment */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Reassign {member.assignedContacts || 0} contacts to:
                </label>
                <select
                  value={contactsReassignTo}
                  onChange={(e) => {
                    setContactsReassignTo(e.target.value);
                    setError('');
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    !contactsReassignTo && error ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a user...</option>
                  {availableManagers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tasks Reassignment */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Reassign {member.openTasks || 0} open tasks to:
                </label>
                <select
                  value={tasksReassignTo}
                  onChange={(e) => {
                    setTasksReassignTo(e.target.value);
                    setError('');
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${
                    !tasksReassignTo && error ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a user...</option>
                  {availableManagers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Email Confirmation */}
          <div className="border-t-2 border-red-300 pt-5">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              To confirm deletion, type the user's email:
            </label>
            <input
              type="text"
              value={confirmEmail}
              onChange={(e) => {
                setConfirmEmail(e.target.value);
                setError('');
              }}
              placeholder={`Type: ${member.email}`}
              className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              Type <span className="font-mono font-semibold">{member.email}</span> exactly
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between sticky bottom-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeactivate}
              className="px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              I Want to Deactivate Instead
            </button>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className={`px-6 py-2 rounded-lg transition-colors font-bold ${
              isValid
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!isValid ? 'Complete all fields to enable deletion' : 'Permanently delete this user'}
          >
            Delete User Permanently
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
