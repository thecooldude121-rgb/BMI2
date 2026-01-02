import React, { useState } from 'react';
import { Zap, Tag, Download, Trash2, X, CheckCircle } from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onDeselectAll: () => void;
  onAddToSequence: () => void;
  onChangeStatus: (status: string) => void;
  onAddTags: (tags: string[]) => void;
  onExport: () => void;
  onDelete: () => void;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  totalCount,
  onDeselectAll,
  onAddToSequence,
  onChangeStatus,
  onAddTags,
  onExport,
  onDelete
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white shadow-2xl z-40 border-t border-blue-700 animate-slide-up">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Selection Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">
                {selectedCount} prospect{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={onDeselectAll}
              className="text-blue-100 hover:text-white text-sm underline"
            >
              Deselect All
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onAddToSequence}
              className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              <Zap className="h-4 w-4 mr-2" />
              Add to Sequence
            </button>

            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors font-medium"
              >
                Change Status
              </button>
              {showStatusMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-white text-gray-900 rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]">
                  {['new', 'contacted', 'qualified', 'unqualified'].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        onChangeStatus(status);
                        setShowStatusMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors capitalize"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onAddTags}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors font-medium"
            >
              <Tag className="h-4 w-4 mr-2" />
              Add Tags
            </button>

            <button
              onClick={onExport}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>

            <button
              onClick={onDelete}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BulkActionsToolbar;
