import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Eye, CheckSquare, Mail, Calendar, Plus, X } from 'lucide-react';

export type PostSaveAction = 'view' | 'task' | 'email' | 'meeting' | 'another' | 'dismiss';

interface PostSaveModalProps {
  isOpen: boolean;
  dealName: string;
  onAction: (action: PostSaveAction) => void;
}

const ACTIONS = [
  {
    id: 'view' as const,
    icon: Eye,
    label: 'View Deal',
    sub: 'Go to the deal detail page',
    primary: true,
  },
  {
    id: 'task' as const,
    icon: CheckSquare,
    label: 'Create Task',
    sub: 'Schedule first follow-up activity',
    primary: false,
  },
  {
    id: 'email' as const,
    icon: Mail,
    label: 'Send Email',
    sub: 'Compose an email to the contact',
    primary: false,
  },
  {
    id: 'meeting' as const,
    icon: Calendar,
    label: 'Schedule Meeting',
    sub: 'Book time with stakeholders',
    primary: false,
  },
  {
    id: 'another' as const,
    icon: Plus,
    label: 'Add Another Deal',
    sub: 'Clear form and start fresh',
    primary: false,
  },
] as const;

export const PostSaveModal: React.FC<PostSaveModalProps> = ({ isOpen, dealName, onAction }) => {
  const defaultBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-focus the primary action when modal opens
  useEffect(() => {
    if (isOpen) defaultBtnRef.current?.focus();
  }, [isOpen]);

  // Escape key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onAction('dismiss');
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onAction]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-save-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onAction('dismiss')}
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 focus:outline-none">
        <button
          onClick={() => onAction('dismiss')}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 id="post-save-title" className="text-xl font-bold text-gray-900">
            Deal Saved!
          </h2>
          {dealName && (
            <p className="text-sm text-gray-500 mt-1 max-w-xs truncate">{dealName}</p>
          )}
          <p className="text-sm text-gray-600 mt-3">What would you like to do next?</p>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          {ACTIONS.map(({ id, icon: Icon, label, sub, primary }) => (
            <button
              key={id}
              ref={primary ? defaultBtnRef : undefined}
              onClick={() => onAction(id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                primary
                  ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 ${primary ? 'text-white' : 'text-gray-400'}`}
              />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${primary ? 'text-white' : 'text-gray-900'}`}>
                  {label}
                </div>
                <div className={`text-xs ${primary ? 'text-blue-100' : 'text-gray-500'}`}>{sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Soft dismiss */}
        <div className="mt-5 text-center">
          <button
            onClick={() => onAction('dismiss')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline-offset-2 hover:underline"
          >
            Just go to deals list
          </button>
        </div>
      </div>
    </div>
  );
};
