import React, { useState } from 'react';
import { X, FileText, Save, AlertCircle } from 'lucide-react';

interface AddNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string, isPrivate: boolean) => void;
  lead: {
    name: string;
    company: string;
  };
}

const AddNotesModal: React.FC<AddNotesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  lead
}) => {
  const [note, setNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!note.trim()) {
      setShowWarning(true);
      return;
    }
    onSave(note, isPrivate);
    setNote('');
    setIsPrivate(false);
    setShowWarning(false);
  };

  const handleCancel = () => {
    setNote('');
    setIsPrivate(false);
    setShowWarning(false);
    onClose();
  };

  const quickNotes = [
    'Had discovery call',
    'Sent follow-up email',
    'Scheduled demo',
    'Budget confirmed',
    'Needs more time',
    'Waiting for approval'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              ADD NOTE
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              Adding note for: <strong>{lead.name}</strong> ({lead.company})
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Insert:
            </label>
            <div className="flex flex-wrap gap-2">
              {quickNotes.map((quickNote) => (
                <button
                  key={quickNote}
                  onClick={() => {
                    setNote(note ? `${note}\n• ${quickNote}` : `• ${quickNote}`);
                    setShowWarning(false);
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {quickNote}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Note Content: <span className="text-red-600">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setShowWarning(false);
              }}
              rows={8}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                showWarning ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your notes here..."
            />
            {showWarning && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>Please enter a note before saving</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {note.length} characters
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">
                Make this note private (only visible to me)
              </span>
            </label>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">💡</span>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Tip:</p>
                <p>Notes will be added to the qualification history and synced to CRM.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Save className="h-5 w-5" />
            Save Note
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNotesModal;
