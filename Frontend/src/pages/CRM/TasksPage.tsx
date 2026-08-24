import React, { useCallback, useEffect, useState } from 'react';
import { CheckSquare, Clock, AlertTriangle, Plus } from 'lucide-react';
import {
  fetchTasks,
  setTaskStatus,
  createTask,
  type TaskRecord,
  type TaskStatus,
} from '../../utils/activitiesApi';

/**
 * PHASE 2: this page read `useData()` sample tasks — pure in-memory state — while
 * 15 real rows sat in the tasks table with no API at all. Its "Add Task" button
 * had no onClick, so a task could not be created from anywhere in the product.
 * Both are now real.
 */
const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await fetchTasks({ limit: 200 }));
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return '📞';
      case 'email':
        return '📧';
      case 'meeting':
        return '🤝';
      case 'follow-up':
        return '🔄';
      default:
        return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // tasks.assigned_to holds a display name already, not a user id.
  const getEmployeeName = (assignedTo: string | null) => assignedTo || 'Unassigned';

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const previous = tasks;
    // Optimistic, then reconcile — and roll back on failure so the list never
    // shows a status the server rejected.
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: newStatus as TaskStatus } : t)));
    setBusyId(taskId);
    try {
      const saved = await setTaskStatus(taskId, newStatus as TaskStatus);
      setTasks(prev => prev.map(t => (t.id === taskId ? saved : t)));
    } catch (e: any) {
      setTasks(previous);
      setError(e?.message ?? 'Could not update the task');
    } finally {
      setBusyId(null);
    }
  };

  const handleAddTask = async () => {
    const title = window.prompt('Task title');
    if (!title?.trim()) return;
    try {
      const created = await createTask({ title: title.trim(), type: 'follow-up', priority: 'medium' });
      setTasks(prev => [created, ...prev]);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not create the task');
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const overdueTasks = tasks.filter(
    t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckSquare className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckSquare className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{overdueTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">All Tasks</h3>
          <button
            onClick={() => { void handleAddTask(); }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </button>
        </div>

        {error && (
          <div className="border-b border-red-200 bg-red-50 px-6 py-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        {loading && (
          <div className="px-6 py-10 text-center text-sm text-gray-500">Loading tasks…</div>
        )}
        {!loading && !error && tasks.length === 0 && (
          <div className="px-6 py-10 text-center">
            <p className="text-sm font-medium text-gray-900">No tasks yet</p>
            <p className="mt-1 text-sm text-gray-600">Use “Add Task” to create the first one.</p>
          </div>
        )}

        <div className="overflow-x-auto" hidden={loading || tasks.length === 0}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => {
                const isOverdue = !!task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
                
                return (
                  <tr key={task.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500">{task.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">{getTaskTypeIcon(task.type ?? '')}</span>
                        <span className="text-sm text-gray-900 capitalize">{task.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority ?? '')}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={task.status ?? 'pending'}
                        onChange={(e) => { void handleStatusChange(task.id, e.target.value); }}
                        disabled={busyId === task.id}
                        className={`text-xs font-medium rounded-full px-2 py-1 border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(task.status ?? '')}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getEmployeeName(task.assigned_to)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                        {isOverdue && (
                          <div className="text-xs text-red-500">Overdue</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {/* Editing a task inline is not built yet; the status
                          dropdown above is the one field that saves. */}
                      <button
                        disabled
                        aria-disabled
                        title="Editing tasks is not available yet"
                        className="mr-3 cursor-not-allowed text-blue-600 opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        disabled
                        aria-disabled
                        title="Deleting tasks is not available yet"
                        className="cursor-not-allowed text-red-600 opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;