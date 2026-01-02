import { useState } from 'react';
import { X, CheckSquare, Calendar, User, Flag } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  selected: boolean;
}

interface BatchTaskCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (tasks: Task[]) => void;
  suggestedTasks?: Omit<Task, 'id' | 'selected'>[];
}

const defaultSuggestedTasks = [
  {
    title: 'Send follow-up email',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'high' as const,
    assignedTo: 'Me'
  },
  {
    title: 'Prepare product demo',
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    priority: 'high' as const,
    assignedTo: 'Me'
  },
  {
    title: 'Schedule discovery call',
    dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
    priority: 'medium' as const,
    assignedTo: 'Me'
  }
];

export default function BatchTaskCreatorModal({
  isOpen,
  onClose,
  onCreate,
  suggestedTasks = defaultSuggestedTasks
}: BatchTaskCreatorModalProps) {
  const [tasks, setTasks] = useState<Task[]>(
    suggestedTasks.map((task, index) => ({
      ...task,
      id: `task-${index}`,
      selected: true
    }))
  );

  if (!isOpen) return null;

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, selected: !task.selected } : task
    ));
  };

  const updateTask = (id: string, field: keyof Task, value: any) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const handleCreateAll = () => {
    const selectedTasks = tasks.filter(task => task.selected);
    onCreate(selectedTasks);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const selectedCount = tasks.filter(t => t.selected).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-purple-600" />
              Create Tasks
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`border-2 rounded-lg p-4 transition-all ${
                  task.selected
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.selected}
                    onChange={() => toggleTask(task.id)}
                    className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />

                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Task</label>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        disabled={!task.selected}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={task.dueDate}
                          onChange={(e) => updateTask(task.id, 'dueDate', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={!task.selected}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          <Flag className="w-3 h-3 inline mr-1" />
                          Priority
                        </label>
                        <select
                          value={task.priority}
                          onChange={(e) => updateTask(task.id, 'priority', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${getPriorityColor(task.priority)}`}
                          disabled={!task.selected}
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          <User className="w-3 h-3 inline mr-1" />
                          Assigned To
                        </label>
                        <input
                          type="text"
                          value={task.assignedTo}
                          onChange={(e) => updateTask(task.id, 'assignedTo', e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          disabled={!task.selected}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateAll}
            disabled={selectedCount === 0}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            Create {selectedCount} Task{selectedCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
