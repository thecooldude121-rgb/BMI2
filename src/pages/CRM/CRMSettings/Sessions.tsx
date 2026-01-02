import React from 'react';
import { Monitor, Smartphone, Tablet, LogOut } from 'lucide-react';

const Sessions: React.FC = () => {
  const sessions = [
    { id: '1', device: 'Chrome on MacBook Pro', location: 'San Francisco, CA', current: true, lastActive: 'Active now', icon: Monitor },
    { id: '2', device: 'Safari on iPhone 14', location: 'San Francisco, CA', current: false, lastActive: '2 hours ago', icon: Smartphone },
    { id: '3', device: 'Chrome on Windows PC', location: 'New York, NY', current: false, lastActive: '1 day ago', icon: Monitor }
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Active Sessions</h2>
        <p className="text-sm text-gray-600 mt-1">Manage devices where you're currently logged in</p>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded">
                  <session.icon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{session.device}</div>
                  <div className="text-sm text-gray-600">{session.location}</div>
                  <div className="text-xs text-gray-500 mt-1">{session.lastActive}</div>
                  {session.current && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Current Session
                    </span>
                  )}
                </div>
              </div>
              {!session.current && (
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
          Sign Out All Other Sessions
        </button>
      </div>
    </div>
  );
};

export default Sessions;
