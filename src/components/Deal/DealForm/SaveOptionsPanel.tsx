import React from 'react';
import { Save } from 'lucide-react';

interface SaveOptionsPanelProps {
  options: {
    viewDeal: boolean;
    createTask: boolean;
    sendEmail: boolean;
    scheduleMeeting: boolean;
    addAnother: boolean;
  };
  onChange: (options: any) => void;
}

export const SaveOptionsPanel: React.FC<SaveOptionsPanelProps> = ({ options, onChange }) => {
  const handleChange = (field: string, value: boolean) => {
    // If addAnother is selected, deselect viewDeal
    if (field === 'addAnother' && value) {
      onChange({ ...options, [field]: value, viewDeal: false });
    } else if (field === 'viewDeal' && value) {
      onChange({ ...options, [field]: value, addAnother: false });
    } else {
      onChange({ ...options, [field]: value });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <Save className="h-6 w-6 text-blue-600" />
        <h2 className="text-lg font-bold text-gray-900">📚 SAVE OPTIONS</h2>
      </div>

      <p className="text-sm text-gray-600 mb-4">After saving, I want to:</p>

      <div className="space-y-3">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.viewDeal}
            onChange={(e) => handleChange('viewDeal', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">View the deal (go to deal detail page)</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.createTask}
            onChange={(e) => handleChange('createTask', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Create a task (schedule first activity)</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.sendEmail}
            onChange={(e) => handleChange('sendEmail', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Send email to contact</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.scheduleMeeting}
            onChange={(e) => handleChange('scheduleMeeting', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Schedule meeting</span>
        </label>

        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.addAnother}
            onChange={(e) => handleChange('addAnother', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Add another deal (clear form)</span>
        </label>
      </div>

      <button className="mt-4 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium transition-all shadow-md">
        Save & Execute Selected Actions
      </button>
    </div>
  );
};
