import React, { useState } from 'react';
import { X, CheckSquare, Calendar, AlertCircle, Link2 } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberEmail: string;
  onCreateTask: (taskData: {
    assignedTo: string;
    title: string;
    description: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    relatedTo: 'deal' | 'contact' | 'team' | 'other';
    relatedEntity: string;
    sendReminder: boolean;
  }) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  memberName,
  memberEmail,
  onCreateTask
}) => {
  const [assignedTo, setAssignedTo] = useState(memberName);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [relatedTo, setRelatedTo] = useState<'deal' | 'contact' | 'team' | 'other'>('team');
  const [sendReminder, setSendReminder] = useState(true);
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  React.useEffect(() => {
    if (isOpen && !dueDate) {
      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
      setDueDate(twoDaysFromNow.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!title.trim() || !dueDate) return;

    setCreating(true);
    await onCreateTask({
      assignedTo,
      title,
      description,
      dueDate,
      priority,
      relatedTo,
      relatedEntity: relatedTo === 'team' ? memberName : '',
      sendReminder
    });
    setCreating(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    setDueDate(twoDaysFromNow.toISOString().split('T')[0]);
    setPriority('medium');
    setRelatedTo('team');
    setSendReminder(true);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'urgent':
        return 'text-red-600 border-red-500';
      case 'high':
        return 'text-orange-600 border-orange-500';
      case 'medium':
        return 'text-blue-600 border-blue-500';
      case 'low':
        return 'text-slate-600 border-slate-500';
      default:
        return 'text-slate-600 border-slate-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Create Task</h2>
            <p className="text-sm text-slate-600 mt-1">
              Task for <span className="font-medium">{memberName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Assign To */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Assign To</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={memberName}>{memberName}</option>
              <option value="John Martinez (CEO)">John Martinez (CEO)</option>
              <option value="Michael Torres (VP Sales)">Michael Torres (VP Sales)</option>
              <option value="Emily Watson (Admin)">Emily Watson (Admin)</option>
              <option value="David Kim (Analyst)">David Kim (Analyst)</option>
            </select>
          </div>

          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='Example: "Review Q4 performance data"'
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please review your Q4 numbers and prepare for our 1-on-1 on Dec 20..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-slate-500" />
              Due Date <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1.5 text-slate-500" />
              Priority
            </label>
            <div className="grid grid-cols-4 gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  checked={priority === 'low'}
                  onChange={() => setPriority('low')}
                  className="w-4 h-4 text-slate-600 focus:ring-2 focus:ring-slate-500"
                />
                <span className="ml-2 text-sm text-slate-700">Low</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  checked={priority === 'medium'}
                  onChange={() => setPriority('medium')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Medium</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  checked={priority === 'high'}
                  onChange={() => setPriority('high')}
                  className="w-4 h-4 text-orange-600 focus:ring-2 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-slate-700">High</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  checked={priority === 'urgent'}
                  onChange={() => setPriority('urgent')}
                  className="w-4 h-4 text-red-600 focus:ring-2 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-slate-700">Urgent</span>
              </label>
            </div>
          </div>

          {/* Related To */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center">
              <Link2 className="w-4 h-4 mr-1.5 text-slate-500" />
              Related To
            </label>
            <div className="grid grid-cols-4 gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="relatedTo"
                  checked={relatedTo === 'deal'}
                  onChange={() => setRelatedTo('deal')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Deal</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="relatedTo"
                  checked={relatedTo === 'contact'}
                  onChange={() => setRelatedTo('contact')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Contact</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="relatedTo"
                  checked={relatedTo === 'team'}
                  onChange={() => setRelatedTo('team')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Team Member</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="relatedTo"
                  checked={relatedTo === 'other'}
                  onChange={() => setRelatedTo('other')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Other</span>
              </label>
            </div>
            {relatedTo === 'team' && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Related to:</span> {memberName}
                </p>
              </div>
            )}
          </div>

          {/* Reminder */}
          <div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sendReminder}
                onChange={(e) => setSendReminder(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-700">
                Send reminder 1 day before due date
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs">T</kbd>
            <span className="ml-2">to create task</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim() || !dueDate}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
