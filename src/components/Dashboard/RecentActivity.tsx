import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, CheckSquare, Calendar } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const RecentActivity: React.FC = () => {
  const { leads, deals, tasks, meetings } = useData();
  const navigate = useNavigate();

  // Generate recent activities
  const activities = [
    ...leads.slice(0, 3).map(lead => ({
      id: `lead-${lead.id}`,
      type: 'lead',
      title: `New lead: ${lead.name}`,
      description: `${lead.company} - ${lead.industry}`,
      time: new Date(lead.createdAt).toLocaleDateString(),
      icon: Users,
      color: 'text-blue-600'
    })),
    ...deals.slice(0, 2).map(deal => ({
      id: `deal-${deal.id}`,
      type: 'deal',
      title: `Deal updated: ${deal.title}`,
      description: `$${deal.value.toLocaleString()} - ${deal.stage}`,
      time: new Date(deal.createdAt).toLocaleDateString(),
      icon: DollarSign,
      color: 'text-green-600'
    })),
    ...tasks.slice(0, 2).map(task => ({
      id: `task-${task.id}`,
      type: 'task',
      title: `Task ${task.status}: ${task.title}`,
      description: `Priority: ${task.priority}`,
      time: new Date(task.createdAt).toLocaleDateString(),
      icon: CheckSquare,
      color: 'text-purple-600'
    })),
    ...meetings.slice(0, 2).map(meeting => ({
      id: `meeting-${meeting.id}`,
      type: 'meeting',
      title: `Meeting: ${meeting.title}`,
      description: `${meeting.attendees.length} attendees`,
      time: new Date(meeting.date).toLocaleDateString(),
      icon: Calendar,
      color: 'text-orange-600'
    }))
  ].sort(() => Math.random() - 0.5).slice(0, 8);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md transition-colors">
            <div className={`flex-shrink-0 p-2 rounded-full bg-gray-100`}>
              <activity.icon className={`h-4 w-4 ${activity.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{activity.title}</p>
              <p className="text-sm text-gray-500">{activity.description}</p>
              <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => navigate('/crm/activities/all')}
          className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All Activity
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;