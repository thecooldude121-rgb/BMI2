import React from 'react';
import { X, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

interface ActionItem {
  id: string;
  description: string;
  completed: boolean;
  assignee: string;
  dueDate?: string;
}

interface ActionItemsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  actionItems: ActionItem[];
  meetingTitle: string;
}

export default function ActionItemsPanel({ isOpen, onClose, actionItems, meetingTitle }: ActionItemsPanelProps) {
  if (!isOpen) return null;

  const completedCount = actionItems.filter(item => item.completed).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Action Items from Meeting</h2>
            <p className="text-sm text-gray-600 mt-1">{meetingTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">Progress</span>
              <span className="text-sm font-semibold text-blue-700">
                {completedCount} of {actionItems.length} completed
              </span>
            </div>
            <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${(completedCount / actionItems.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg border transition-all ${
                  item.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium ${
                        item.completed ? 'text-green-900 line-through' : 'text-gray-900'
                      }`}
                    >
                      {item.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      {item.dueDate && (
                        <span className="text-xs text-gray-600">
                          Due: {new Date(item.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                      <span className="text-xs text-gray-600">
                        Assigned: {item.assignee}
                      </span>
                    </div>
                    {item.completed && (
                      <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2">
            View All Tasks
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
