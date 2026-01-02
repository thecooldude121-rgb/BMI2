import React, { useState } from 'react';
import {
  CheckCircle, X, RefreshCw, Tag, UserPlus, Zap, ListPlus,
  Download, Trash2, TrendingUp, Mail, FileText, Database, GitMerge
} from 'lucide-react';
import { useBulkActions } from '../../contexts/BulkActionsContext';
import { BulkActionType } from '../../types/bulkActions';

interface ComprehensiveBulkToolbarProps {
  onAction: (type: BulkActionType) => void;
}

const ComprehensiveBulkToolbar: React.FC<ComprehensiveBulkToolbarProps> = ({ onAction }) => {
  const { selectedIds, selectAll, totalCount, clearSelection } = useBulkActions();
  const [showMoreActions, setShowMoreActions] = useState(false);

  const selectedCount = selectAll ? totalCount : selectedIds.size;

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-2xl z-50 border-t border-blue-800 animate-slide-up">
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Selection Info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-lg">
                  {selectedCount.toLocaleString()} {selectedCount === 1 ? 'Prospect' : 'Prospects'}
                </div>
                <div className="text-blue-100 text-xs">
                  {selectAll ? 'All prospects selected' : 'Selected on this page'}
                </div>
              </div>
            </div>
            <button
              onClick={clearSelection}
              className="text-blue-100 hover:text-white text-sm underline flex items-center space-x-1 ml-4"
            >
              <X className="h-3 w-3" />
              <span>Clear Selection</span>
            </button>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center space-x-2">
            {/* Change Status */}
            <button
              onClick={() => onAction('change_status')}
              className="flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all shadow-lg font-medium"
              title="Change Status"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Status
            </button>

            {/* Add Tags */}
            <button
              onClick={() => onAction('add_tags')}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all font-medium"
              title="Add Tags"
            >
              <Tag className="h-4 w-4 mr-2" />
              Tags
            </button>

            {/* Assign To */}
            <button
              onClick={() => onAction('assign_to')}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all font-medium"
              title="Assign To"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign
            </button>

            {/* Add to Sequence */}
            <button
              onClick={() => onAction('add_to_sequence')}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all font-medium"
              title="Add to Sequence"
            >
              <Zap className="h-4 w-4 mr-2" />
              Sequence
            </button>

            {/* Export */}
            <button
              onClick={() => onAction('export')}
              className="flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all font-medium"
              title="Export Selected"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreActions(!showMoreActions)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-all font-medium"
              >
                More •••
              </button>

              {showMoreActions && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMoreActions(false)}
                  ></div>
                  <div className="absolute bottom-full mb-2 right-0 bg-white text-gray-900 rounded-lg shadow-2xl border border-gray-200 py-2 min-w-[240px] z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase">Additional Actions</p>
                    </div>

                    <button
                      onClick={() => {
                        onAction('add_to_list');
                        setShowMoreActions(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-50 transition-colors"
                    >
                      <ListPlus className="h-4 w-4 text-blue-600" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Add to List</div>
                        <div className="text-xs text-gray-500">Save to a custom list</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onAction('adjust_score');
                        setShowMoreActions(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-50 transition-colors"
                    >
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Adjust Scores</div>
                        <div className="text-xs text-gray-500">Modify lead/AI scores</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onAction('send_email');
                        setShowMoreActions(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-50 transition-colors"
                    >
                      <Mail className="h-4 w-4 text-blue-600" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Send Bulk Email</div>
                        <div className="text-xs text-gray-500">Send to all selected</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onAction('add_note');
                        setShowMoreActions(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-50 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-blue-600" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Add Note</div>
                        <div className="text-xs text-gray-500">Add same note to all</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onAction('enrich_data');
                        setShowMoreActions(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-50 transition-colors"
                    >
                      <Database className="h-4 w-4 text-blue-600" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Enrich Data</div>
                        <div className="text-xs text-gray-500">Update prospect info</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onAction('merge_duplicates');
                        setShowMoreActions(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-blue-50 transition-colors"
                    >
                      <GitMerge className="h-4 w-4 text-blue-600" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Merge Duplicates</div>
                        <div className="text-xs text-gray-500">Find and merge</div>
                      </div>
                    </button>

                    <div className="border-t border-gray-200 my-2"></div>

                    <button
                      onClick={() => {
                        onAction('delete');
                        setShowMoreActions(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                      <div className="text-left">
                        <div className="text-sm font-medium text-red-600">Delete Prospects</div>
                        <div className="text-xs text-red-500">Permanently remove</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Select All Banner */}
        {selectedIds.size > 0 && selectedIds.size < totalCount && !selectAll && (
          <div className="mt-3 pt-3 border-t border-blue-500 border-opacity-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-50">
                <span className="font-semibold">{selectedIds.size}</span> prospect{selectedIds.size !== 1 ? 's' : ''} on this page selected.
              </p>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('selectAllProspects'));
                }}
                className="px-4 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-all"
              >
                Select all {totalCount.toLocaleString()} prospects
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ComprehensiveBulkToolbar;
