import React, { useState } from 'react';
import { X, CheckSquare, Calendar, User } from 'lucide-react';

interface BulkTaskCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingCount: number;
  meetings: Array<{ title: string; id: string }>;
  onCreateTasks: (taskData: any) => void;
}

export default function BulkTaskCreatorModal({
  isOpen,
  onClose,
  meetingCount,
  meetings,
  onCreateTasks
}: BulkTaskCreatorModalProps) {
  const [taskData, setTaskData] = useState({
    taskTitle: 'Follow up call',
    dueDate: 'tomorrow',
    assignTo: 'meeting-owners'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateTasks(taskData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-orange-600" />
              Create Follow-up Tasks
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              For {meetingCount} selected meetings
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="text-sm font-semibold text-orange-900 mb-2">Selected Meetings</h3>
            <div className="space-y-1">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                  <span className="text-sm text-orange-900">{meeting.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={taskData.taskTitle}
              onChange={(e) => setTaskData({ ...taskData, taskTitle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="e.g., Follow up call"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={taskData.dueDate}
                onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="3-days">In 3 days</option>
                <option value="1-week">In 1 week</option>
                <option value="2-weeks">In 2 weeks</option>
                <option value="custom">Custom date...</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={taskData.assignTo}
                onChange={(e) => setTaskData({ ...taskData, assignTo: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="meeting-owners">Meeting Owners</option>
                <option value="me">Me (Alex Rodriguez)</option>
                <option value="team">Entire Team</option>
                <option value="custom">Select individually...</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Preview:</strong> This will create {meetingCount} tasks titled "{taskData.taskTitle}"
              due {taskData.dueDate === 'tomorrow' ? 'tomorrow' : taskData.dueDate},
              assigned to {taskData.assignTo === 'meeting-owners' ? 'the respective meeting owners' : taskData.assignTo}.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Create Tasks
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
