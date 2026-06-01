import React, { useState } from 'react';
import { FileText, Upload, Edit, Trash2, Plus, Download, Eye, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Note {
  id: string;
  date: string;
  author: string;
  content: string;
}

interface File {
  id: string;
  name: string;
  size: string;
  date: string;
  type: 'pdf' | 'doc' | 'xls' | 'other';
}

interface DealNotesFilesProps {
  notes: Note[];
  files: File[];
}

export const DealNotesFiles: React.FC<DealNotesFilesProps> = ({ notes, files }) => {
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'note' | 'file'; id: string } | null>(null);
  const { showToast } = useToast();

  const getFileIcon = (type: string) => {
    return '📄';
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) {
      showToast('warning', 'Please enter note content');
      return;
    }
    showToast('success', 'Note saved successfully!');
    setNoteText('');
    setShowAddNote(false);
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditText(note.content);
  };

  const handleSaveEdit = (noteId: string) => {
    showToast('success', 'Note updated successfully!');
    setEditingNoteId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditText('');
  };

  const handleDeleteClick = (type: 'note' | 'file', id: string) => {
    setDeleteTarget({ type, id });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      showToast('success', `${deleteTarget.type === 'note' ? 'Note' : 'File'} deleted successfully!`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const handleFileClick = (fileName: string) => {
    showToast('info', `Opening ${fileName}...`);
  };

  const handleDownload = (fileName: string) => {
    showToast('success', `Downloading ${fileName}...`);
  };

  const handlePreview = (fileName: string) => {
    showToast('info', `Previewing ${fileName}...`);
  };

  const handleUploadFile = () => {
    showToast('info', 'Opening file picker...');
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Notes & Files</h2>
      </div>

      {/* Internal Notes */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Internal Notes ({notes.length})</h3>
          <button
            onClick={() => setShowAddNote(!showAddNote)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 inline mr-1" />
            Add Note
          </button>
        </div>

        {showAddNote && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add your note here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            ></textarea>
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Save Note
              </button>
              <button
                onClick={() => setShowAddNote(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {note.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{note.author}</div>
                    <div className="text-xs text-gray-600">{note.date}</div>
                  </div>
                </div>
                {editingNoteId !== note.id && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Edit className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick('note', note.id)}
                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
              {editingNoteId === note.id ? (
                <>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
                    rows={4}
                  ></textarea>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Files */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Files ({files.length})</h3>
          <button
            onClick={handleUploadFile}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4 inline mr-1" />
            Upload File
          </button>
        </div>

        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
              <div
                onClick={() => handleFileClick(file.name)}
                className="flex items-center space-x-3 cursor-pointer flex-1"
              >
                <div className="text-2xl">{getFileIcon(file.type)}</div>
                <div>
                  <div className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">{file.name}</div>
                  <div className="text-xs text-gray-600">{file.size} - {file.date}</div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handlePreview(file.name)}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                >
                  <Eye className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDownload(file.name)}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                >
                  <Download className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteClick('file', file.id)}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this {deleteTarget?.type}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
