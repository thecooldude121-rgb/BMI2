import React, { useState } from 'react';
import { X, FileText, Calendar, Tag, Lock, Users } from 'lucide-react';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberEmail: string;
  onSaveNote: (noteData: {
    noteType: 'coaching' | 'general' | 'meeting';
    date: string;
    subject: string;
    content: string;
    focusAreas: string[];
    developmentGoals: string;
    visibility: 'private' | 'shared';
  }) => void;
}

const FOCUS_AREAS = [
  'Pipeline Management',
  'HRMS Strategy',
  'Negotiation Skills',
  'Team Leadership',
  'Time Management',
  'Communication',
  'Client Relationships',
  'Goal Achievement'
];

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  memberName,
  memberEmail,
  onSaveNote
}) => {
  const [noteType, setNoteType] = useState<'coaching' | 'general' | 'meeting'>('coaching');
  const [date, setDate] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [developmentGoals, setDevelopmentGoals] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen && !date) {
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const firstName = memberName.split(' ')[0];

  const toggleFocusArea = (area: string) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter(a => a !== area));
    } else {
      setFocusAreas([...focusAreas, area]);
    }
  };

  const handleSave = async () => {
    if (!subject.trim() || !content.trim()) return;

    setSaving(true);
    await onSaveNote({
      noteType,
      date,
      subject,
      content,
      focusAreas,
      developmentGoals,
      visibility
    });
    setSaving(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setNoteType('coaching');
    setDate(new Date().toISOString().split('T')[0]);
    setSubject('');
    setContent('');
    setFocusAreas([]);
    setDevelopmentGoals('');
    setVisibility('private');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Add Note about {memberName}</h2>
            <p className="text-sm text-slate-600 mt-1">{memberEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Note Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-1.5 text-slate-500" />
              Note Type
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="noteType"
                  checked={noteType === 'coaching'}
                  onChange={() => setNoteType('coaching')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Coaching Note</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="noteType"
                  checked={noteType === 'general'}
                  onChange={() => setNoteType('general')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">General Note</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="noteType"
                  checked={noteType === 'meeting'}
                  onChange={() => setNoteType('meeting')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Meeting Note</span>
              </label>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 text-slate-500" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">Defaults to today</p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder='Example: "Q4 Performance Discussion"'
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Note Content */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Note Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`${firstName}'s Q4 performance has been exceptional. Win rate of 72% exceeds team average. HRMS lead strategy is working well...`}
              rows={8}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans"
            />
            <p className="text-xs text-slate-500 mt-1">
              Rich text formatting coming soon
            </p>
          </div>

          {/* Focus Areas (for Coaching Notes) */}
          {noteType === 'coaching' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3 flex items-center">
                <Tag className="w-4 h-4 mr-1.5 text-slate-500" />
                Focus Areas (for Coaching Notes)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {FOCUS_AREAS.map((area) => (
                  <label key={area} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={focusAreas.includes(area)}
                      onChange={() => toggleFocusArea(area)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">{area}</span>
                  </label>
                ))}
              </div>
              {focusAreas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {focusAreas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Development Goals (optional) */}
          {noteType === 'coaching' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Development Goals (optional)
              </label>
              <textarea
                value={developmentGoals}
                onChange={(e) => setDevelopmentGoals(e.target.value)}
                placeholder={`- Lead HRMS training in Q1\n- Mentor junior reps\n- Improve negotiation skills`}
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
              />
            </div>
          )}

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Visibility</label>
            <div className="space-y-3">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="ml-3">
                  <div className="flex items-center text-sm font-medium text-slate-700">
                    <Lock className="w-4 h-4 mr-1.5 text-slate-500" />
                    Private (Manager+ only)
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Only you and your managers can view this note
                  </p>
                </div>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'shared'}
                  onChange={() => setVisibility('shared')}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 mt-0.5"
                />
                <div className="ml-3">
                  <div className="flex items-center text-sm font-medium text-slate-700">
                    <Users className="w-4 h-4 mr-1.5 text-slate-500" />
                    Shared (Leadership team can view)
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Leadership team and HR can access this note
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Permission Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Coaching Note</h3>
                <p className="text-xs text-blue-700 mt-1">
                  This note will be added to {firstName}'s coaching timeline and can be referenced in future 1-on-1s and performance reviews.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            <kbd className="px-2 py-1 bg-white border border-slate-300 rounded text-xs">N</kbd>
            <span className="ml-2">to add note</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !subject.trim() || !content.trim()}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Save Note
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNoteModal;
