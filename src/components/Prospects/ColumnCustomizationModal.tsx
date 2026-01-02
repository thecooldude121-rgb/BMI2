import React, { useState } from 'react';
import { X, Eye, EyeOff, GripVertical } from 'lucide-react';

interface Column {
  id: string;
  label: string;
  visible: boolean;
}

interface ColumnCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: Column[];
  onSave: (columns: Column[]) => void;
}

export const ColumnCustomizationModal: React.FC<ColumnCustomizationModalProps> = ({
  isOpen,
  onClose,
  columns,
  onSave
}) => {
  const [editedColumns, setEditedColumns] = useState<Column[]>(columns);

  if (!isOpen) return null;

  const toggleVisibility = (id: string) => {
    setEditedColumns(editedColumns.map(col =>
      col.id === id ? { ...col, visible: !col.visible } : col
    ));
  };

  const handleSave = () => {
    onSave(editedColumns);
    onClose();
  };

  const resetDefaults = () => {
    setEditedColumns(columns.map(col => ({ ...col, visible: true })));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Customize Columns</h2>
            <p className="text-sm text-gray-600 mt-1">Show or hide table columns</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            {editedColumns.map(column => (
              <div
                key={column.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                  <span className="text-sm font-medium text-gray-700">{column.label}</span>
                </div>
                <button
                  onClick={() => toggleVisibility(column.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    column.visible
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                      : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                  }`}
                  aria-label={column.visible ? 'Hide column' : 'Show column'}
                >
                  {column.visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Drag and drop columns to reorder them (coming soon)
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={resetDefaults}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset to Default
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnCustomizationModal;
