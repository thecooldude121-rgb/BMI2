import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import type { Lead } from '../../types/lead';
import {
  submitFeedback,
  FEEDBACK_BUTTONS,
  FEEDBACK_META,
  type FeedbackType,
} from '../../utils/leadScoring/scoreFeedback';

interface Props {
  lead:       Lead;
  initial?:   FeedbackType | null;
  onSubmit?:  (type: FeedbackType) => void;
}

export default function ScoreFeedbackControls({ lead, initial, onSubmit }: Props) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(initial ?? null);
  const [showNote,     setShowNote]     = useState(false);
  const [noteText,     setNoteText]     = useState('');
  const [noteSaved,    setNoteSaved]    = useState(false);

  function handleSelect(type: FeedbackType) {
    submitFeedback(lead, type);
    setFeedbackType(type);
    setShowNote(true);
    setNoteText('');
    setNoteSaved(false);
    onSubmit?.(type);
  }

  function handleSaveNote() {
    if (feedbackType) submitFeedback(lead, feedbackType, noteText);
    setNoteSaved(true);
    setShowNote(false);
  }

  function handleReset() {
    setFeedbackType(null);
    setShowNote(false);
    setNoteText('');
    setNoteSaved(false);
  }

  const meta = feedbackType ? FEEDBACK_META[feedbackType] : null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        How accurate is this score?
      </p>

      {/* When no feedback yet — show all buttons */}
      {!feedbackType && (
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_BUTTONS.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => handleSelect(type)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Submitted state */}
      {feedbackType && meta && !showNote && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-green-500 shrink-0" />
            <span className="text-xs text-gray-700">
              Marked as <span className="font-semibold">{meta.label}</span>
              {noteSaved && <span className="text-gray-400 ml-1">· note saved</span>}
            </span>
            <button
              onClick={handleReset}
              className="ml-auto text-[10px] text-gray-400 hover:text-gray-600 underline underline-offset-2"
            >
              Change
            </button>
          </div>

          {/* Quick pill showing the marked state */}
          <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full border ${meta.activeCls}`}>
            {meta.label}
          </span>
        </div>
      )}

      {/* Optional note field (inline, slides in after selection) */}
      {showNote && meta && (
        <div className="space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="flex items-center gap-2">
            <CheckCircle size={13} className="text-green-500 shrink-0" />
            <span className="text-xs font-medium text-gray-700">
              Thanks! Marked as <span className="font-semibold">{meta.label}</span>
            </span>
          </div>
          <p className="text-xs text-gray-500">Add a note? <span className="text-gray-400">(optional)</span></p>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="e.g. This is an intern, not a decision maker"
            rows={2}
            className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveNote}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Save note
            </button>
            <button
              onClick={() => setShowNote(false)}
              className="text-xs px-3 py-1 text-gray-500 hover:text-gray-700"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
