import React from 'react';
import { CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const TaskOverview: React.FC = () => {
  const { tasks } = useData();

  const taskStats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length
  };

  const recentTasks = tasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Task Overview</h3>
      
      {/* Task Stats */}
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

      {/* Recent Tasks */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Upcoming Tasks</h4>
        <div className="space-y-3">
          {recentTasks.map(task => {
            const isOverdue = new Date(task.dueDate) < new Date();
            const dueDate = new Date(task.dueDate).toLocaleDateString();
            
            return (
              <div key={task.id} className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                <div className="flex-shrink-0 mr-3">
                  {isOverdue ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : task.status === 'in-progress' ? (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <CheckSquare className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {task.title}
                  </p>
                  <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                    Due: {dueDate}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    task.priority === 'high' 
                      ? 'bg-red-100 text-red-800'
                      : task.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TaskOverview;