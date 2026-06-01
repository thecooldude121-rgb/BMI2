import React, { useState } from 'react';
import { X, AlertTriangle, UserX, Key, Database, CheckCircle, Users } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  activeDeals?: number;
  pipelineValue?: string;
  assignedContacts?: number;
  openTasks?: number;
}

interface DeactivateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
  availableManagers: TeamMember[];
  onConfirm: (data: {
    reassignTo: string | null;
    sendNotification: boolean;
    reason: string;
  }) => void;
}

const DeactivateUserModal: React.FC<DeactivateUserModalProps> = ({
  isOpen,
  onClose,
  member,
  availableManagers,
  onConfirm
}) => {
  const [reassignTo, setReassignTo] = useState<string>('keep-assigned');
  const [sendNotification, setSendNotification] = useState(true);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      reassignTo: reassignTo === 'keep-assigned' ? null : reassignTo,
      sendNotification,
      reason
    });
    onClose();
    setReassignTo('keep-assigned');
    setSendNotification(true);
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Deactivate User: {member.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Are you sure you want to deactivate this user?</span>
            </p>
          </div>

          {/* User Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">User</p>
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">{member.email}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Role</p>
              <p className="text-sm font-medium text-gray-900">{member.role}</p>
            </div>
          </div>

          {/* Current Activity */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Activity:</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">• Active Deals:</span>
                <span className="font-medium text-gray-900">
                  {member.activeDeals || 0} deals ({member.pipelineValue || '$0'})
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">• Assigned Contacts:</span>
                <span className="font-medium text-gray-900">{member.assignedContacts || 0} contacts</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">• Open Tasks:</span>
                <span className="font-medium text-gray-900">{member.openTasks || 0} tasks</span>
              </div>
            </div>
          </div>

          {/* What Happens */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">What happens when deactivated:</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>User loses access <span className="font-medium">immediately</span></span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Cannot log in to system</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>All data is preserved</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Deals/contacts remain assigned</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Can be reactivated later</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>Frees up 1 subscription seat</span>
              </li>
            </ul>
          </div>

          {/* Reassignment */}
          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 block">
              Reassign deals and contacts to:
            </label>
            <select
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="keep-assigned">Keep assigned to {member.name} (recommended)</option>
              {availableManagers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  Reassign to {manager.name} ({manager.role})
                </option>
              ))}
              <option value="choose-later">Choose different owner per item</option>
            </select>
          </div>

          {/* Send Notification */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="sendNotification"
              checked={sendNotification}
              onChange={(e) => setSendNotification(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="sendNotification" className="text-sm text-gray-700 cursor-pointer">
              <span className="font-medium">Send notification email to user</span>
              <p className="text-xs text-gray-500 mt-0.5">
                {member.name} will be notified of deactivation
              </p>
            </label>
          </div>

          {/* Reason */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Reason for deactivation (optional):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='E.g., "Left company", "On leave", etc.'
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Deactivate User
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateUserModal;
