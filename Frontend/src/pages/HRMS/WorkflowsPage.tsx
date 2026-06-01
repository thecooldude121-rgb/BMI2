import React from 'react';
import { CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';

const WorkflowsPage: React.FC = () => {
  const workflows = [
    {
      id: '1',
      name: 'Employee Onboarding',
      description: 'Complete onboarding process for new hires',
      status: 'active',
      steps: [
        { id: 1, name: 'Document Collection', status: 'completed' },
        { id: 2, name: 'IT Setup', status: 'completed' },
        { id: 3, name: 'Orientation Session', status: 'in-progress' },
        { id: 4, name: 'Department Introduction', status: 'pending' },
        { id: 5, name: 'Training Assignment', status: 'pending' }
      ],
      assignedTo: 'Emily Rodriguez',
      dueDate: '2024-01-25',
      progress: 40
    },
    {
      id: '2',
      name: 'Leave Request Approval',
      description: 'Process and approve employee leave requests',
      status: 'pending',
      steps: [
        { id: 1, name: 'Request Submitted', status: 'completed' },
        { id: 2, name: 'Manager Review', status: 'in-progress' },
        { id: 3, name: 'HR Approval', status: 'pending' },
        { id: 4, name: 'Calendar Update', status: 'pending' }
      ],
      assignedTo: 'Michael Chen',
      dueDate: '2024-01-20',
      progress: 25
    },
    {
      id: '3',
      name: 'Performance Review',
      description: 'Quarterly performance evaluation process',
      status: 'completed',
      steps: [
        { id: 1, name: 'Self Assessment', status: 'completed' },
        { id: 2, name: 'Manager Evaluation', status: 'completed' },
        { id: 3, name: 'Peer Feedback', status: 'completed' },
        { id: 4, name: 'Review Meeting', status: 'completed' },
        { id: 5, name: 'Goal Setting', status: 'completed' }
      ],
      assignedTo: 'John Smith',
      dueDate: '2024-01-15',
      progress: 100
    }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      'on-hold': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {workflows.filter(w => w.status === 'active').length}
            </p>
            <p className="text-sm text-gray-600">Active Workflows</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {workflows.filter(w => w.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {workflows.filter(w => w.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {Math.round(workflows.reduce((sum, w) => sum + w.progress, 0) / workflows.length)}%
            </p>
            <p className="text-sm text-gray-600">Avg Progress</p>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-6">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                <p className="text-sm text-gray-600">{workflow.description}</p>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                {workflow.status}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{workflow.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${workflow.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Workflow Steps</h4>
              <div className="space-y-2">
                {workflow.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    {getStepIcon(step.status)}
                    <span className={`ml-3 text-sm ${
                      step.status === 'completed' 
                        ? 'text-gray-900 line-through' 
                        : step.status === 'in-progress'
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-600'
                    }`}>
                      {step.name}
                    </span>
                    {index < workflow.steps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-gray-400 ml-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Workflow Info */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <span>Assigned to: <span className="font-medium">{workflow.assignedTo}</span></span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span>Due: {new Date(workflow.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkflowsPage;