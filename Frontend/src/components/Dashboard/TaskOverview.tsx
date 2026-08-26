import React from 'react';
import { CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import type { TaskRecord } from '../../utils/activitiesApi';

/**
 * Takes tasks as a prop instead of calling useData().
 *
 * The field is `due_date`, not `dueDate` — the sample-data Task type used
 * camelCase and the tasks table uses snake_case, so against real rows every
 * `new Date(t.dueDate)` produced Invalid Date. That mattered in three places:
 * the overdue count (a NaN comparison is always false, so overdue silently read
 * 0), the sort (NaN comparisons make the order arbitrary), and the rendered due
 * date ("Invalid Date").
 *
 * due_date is also nullable, which the old code did not allow for. A task with
 * no due date cannot be overdue and sorts last, rather than sorting as though
 * it were due in 1970.
 */

interface TaskOverviewProps {
  tasks: TaskRecord[];
}

/** null for a task with no due date — distinct from "not yet due". */
const dueTime = (t: TaskRecord): number | null => {
  if (!t.due_date) return null;
  const ms = new Date(t.due_date).getTime();
  return Number.isNaN(ms) ? null : ms;
};

const isOverdue = (t: TaskRecord, now: number): boolean => {
  if (t.status === 'completed') return false;
  const due = dueTime(t);
  return due !== null && due < now;
};

const TaskOverview: React.FC<TaskOverviewProps> = ({ tasks }) => {
  const now = Date.now();

  const taskStats = {
    pending: tasks.filter((t) => t.status === 'pending').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    overdue: tasks.filter((t) => isOverdue(t, now)).length,
  };

  const upcoming = tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => {
      const da = dueTime(a);
      const db = dueTime(b);
      // Undated tasks go last rather than first.
      if (da === null && db === null) return 0;
      if (da === null) return 1;
      if (db === null) return -1;
      return da - db;
    })
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Task Overview</h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{taskStats.pending}</p>
          <p className="text-sm text-gray-600">Pending</p>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <p className="text-2xl font-bold text-yellow-600">{taskStats.inProgress}</p>
          <p className="text-sm text-gray-600">In Progress</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
          <p className="text-sm text-gray-600">Overdue</p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Upcoming Tasks</h4>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No open tasks.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((task) => {
              const overdue = isOverdue(task, now);
              const due = dueTime(task);

              return (
                <div
                  key={task.id}
                  className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex-shrink-0 mr-3">
                    {overdue ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : task.status === 'in-progress' ? (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <CheckSquare className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className={`text-xs ${overdue ? 'text-red-500' : 'text-gray-500'}`}>
                      {due === null ? 'No due date' : `Due: ${new Date(due).toLocaleDateString()}`}
                    </p>
                  </div>
                  {task.priority && (
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskOverview;
