import React, { useState } from 'react';
import { Save, Share, Download, FileText, Users, Clock, Target, Plus, X } from 'lucide-react';

interface MeetingNote {
  id: string;
  content: string;
  timestamp: string;
  author: string;
  type: 'note' | 'action-item' | 'decision' | 'question';
}

interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

interface MeetingNotesProps {
  meetingId: string;
  meetingTitle: string;
  attendees: string[];
  onSave: (notes: any) => void;
  onClose: () => void;
}

const MeetingNotes: React.FC<MeetingNotesProps> = ({
  meetingId,
  meetingTitle,
  attendees,
  onSave,
  onClose
}) => {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [noteType, setNoteType] = useState<MeetingNote['type']>('note');
  const [newActionItem, setNewActionItem] = useState<Partial<ActionItem>>({
    task: '',
    assignee: '',
    dueDate: '',
    priority: 'medium'
  });
  const [showActionForm, setShowActionForm] = useState(false);
  const [meetingSummary, setMeetingSummary] = useState<string>('');
  const [nextSteps, setNextSteps] = useState<string>('');

  const addNote = () => {
    if (!currentNote.trim()) return;

    const note: MeetingNote = {
      id: Date.now().toString(),
      content: currentNote,
      timestamp: new Date().toISOString(),
      author: 'Current User', // TODO: Get from auth context
      type: noteType
    };

    setNotes(prev => [...prev, note]);
    setCurrentNote('');
  };

  const addActionItem = () => {
    if (!newActionItem.task || !newActionItem.assignee) return;

    const actionItem: ActionItem = {
      id: Date.now().toString(),
      task: newActionItem.task!,
      assignee: newActionItem.assignee!,
      dueDate: newActionItem.dueDate!,
      priority: newActionItem.priority!,
      completed: false
    };

    setActionItems(prev => [...prev, actionItem]);
    setNewActionItem({
      task: '',
      assignee: '',
      dueDate: '',
      priority: 'medium'
    });
    setShowActionForm(false);
  };

  const toggleActionItem = (id: string) => {
    setActionItems(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const removeActionItem = (id: string) => {
    setActionItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSave = () => {
    const meetingData = {
      meetingId,
      notes,
      actionItems,
      summary: meetingSummary,
      nextSteps,
      savedAt: new Date().toISOString()
    };
    
    onSave(meetingData);
  };

  const getNoteTypeColor = (type: MeetingNote['type']) => {
    const colors = {
      note: 'bg-blue-50 border-blue-200 text-blue-800',
      'action-item': 'bg-orange-50 border-orange-200 text-orange-800',
      decision: 'bg-green-50 border-green-200 text-green-800',
      question: 'bg-purple-50 border-purple-200 text-purple-800'
    };
    return colors[type];
  };

  const getPriorityColor = (priority: ActionItem['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700'
    };
    return colors[priority];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto z-50">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{meetingTitle}</h2>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{attendees.length} attendees</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Notes
              </button>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            {/* Left Column - Notes */}
            <div className="lg:col-span-2 space-y-6">
              {/* Note Input */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as MeetingNote['type'])}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="note">General Note</option>
                    <option value="action-item">Action Item</option>
                    <option value="decision">Decision</option>
                    <option value="question">Question</option>
                  </select>
                </div>
                <textarea
                  rows={3}
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Type your meeting notes here..."
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={addNote}
                    disabled={!currentNote.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Add Note
                  </button>
                </div>
              </div>

              {/* Notes List */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Meeting Notes</h3>
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>No notes added yet</p>
                    <p className="text-sm">Start taking notes during your meeting</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className={`p-4 border rounded-xl ${getNoteTypeColor(note.type)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium uppercase tracking-wider">
                            {note.type.replace('-', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(note.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                        <p className="text-xs text-gray-600 mt-2">By {note.author}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Meeting Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Meeting Summary</label>
                <textarea
                  rows={4}
                  value={meetingSummary}
                  onChange={(e) => setMeetingSummary(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Summarize the key points and outcomes of this meeting..."
                />
              </div>

              {/* Next Steps */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Next Steps</label>
                <textarea
                  rows={3}
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="What are the next steps to move this opportunity forward?"
                />
              </div>
            </div>

            {/* Right Column - Action Items */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Action Items</h3>
                  <button
                    onClick={() => setShowActionForm(true)}
                    className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </button>
                </div>

                {/* Action Items List */}
                <div className="space-y-3">
                  {actionItems.map((item) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-xl bg-white">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleActionItem(item.id)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            item.completed ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {item.task}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Assigned to: {item.assignee}</span>
                            <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                            <span className={`px-2 py-1 rounded-full ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeActionItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Action Item Form */}
                {showActionForm && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                    <h4 className="font-medium text-gray-900 mb-3">Add Action Item</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newActionItem.task || ''}
                        onChange={(e) => setNewActionItem(prev => ({ ...prev, task: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Describe the task..."
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={newActionItem.assignee || ''}
                          onChange={(e) => setNewActionItem(prev => ({ ...prev, assignee: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Assign to...</option>
                          {attendees.map((attendee) => (
                            <option key={attendee} value={attendee}>{attendee}</option>
                          ))}
                        </select>
                        <input
                          type="date"
                          value={newActionItem.dueDate || ''}
                          onChange={(e) => setNewActionItem(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setShowActionForm(false)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={addActionItem}
                          className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700"
                        >
                          Add Task
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Meeting Attendees */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendees</h3>
                <div className="space-y-2">
                  {attendees.map((attendee, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {attendee.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{attendee}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Share className="h-4 w-4 mr-3 text-blue-600" />
                    <span className="text-sm font-medium">Share Notes</span>
                  </button>
                  <button className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="h-4 w-4 mr-3 text-green-600" />
                    <span className="text-sm font-medium">Export PDF</span>
                  </button>
                  <button className="w-full flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Target className="h-4 w-4 mr-3 text-purple-600" />
                    <span className="text-sm font-medium">Create Follow-up</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotes;

/*
CRM Meeting Notes Component

Purpose: Comprehensive meeting notes and action item management

Features:
- Real-time note taking during meetings
- Categorized notes (general, action items, decisions, questions)
- Action item creation and assignment
- Meeting summary and next steps
- Attendee management
- Export and sharing capabilities

API Integration Points:
1. POST /api/meetings/{id}/notes - Save meeting notes
2. GET /api/meetings/{id}/notes - Retrieve existing notes
3. POST /api/tasks/from-meeting - Create tasks from action items
4. POST /api/meetings/{id}/summary - Save meeting summary
5. GET /api/users/attendees - Get attendee information

TODO:
- Implement real-time collaborative editing
- Add voice-to-text transcription
- Integrate with task management system
- Add meeting recording integration
- Include automatic CRM record updates
*/