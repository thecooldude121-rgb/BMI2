import React, { useState, useEffect, useRef } from 'react';
import { Save, Check, X, Loader2 } from 'lucide-react';

interface SaveDraftButtonProps {
  onSave: () => Promise<void>;
  hasChanges: boolean;
  autoSaveInterval?: number; // milliseconds, default 5000 (5 seconds)
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export default function SaveDraftButton({
  onSave,
  hasChanges,
  autoSaveInterval = 5000
}: SaveDraftButtonProps) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [timeSinceLastSave, setTimeSinceLastSave] = useState<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const revertTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update "time ago" display
  useEffect(() => {
    if (!lastSaved) return;

    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);

      if (seconds < 5) {
        setTimeSinceLastSave('Just now');
      } else if (seconds < 60) {
        setTimeSinceLastSave(`${seconds} seconds ago`);
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        setTimeSinceLastSave(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`);
      } else {
        const hours = Math.floor(seconds / 3600);
        setTimeSinceLastSave(`${hours} ${hours === 1 ? 'hour' : 'hours'} ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastSaved]);

  // Auto-save logic
  useEffect(() => {
    if (!hasChanges || saveState === 'saving') return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true);
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [hasChanges, autoSaveInterval, saveState]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  const handleSave = async (isAutoSave = false) => {
    // Prevent multiple saves
    if (saveState === 'saving') return;

    setSaveState('saving');

    try {
      await onSave();

      // Success
      setSaveState('saved');
      setLastSaved(new Date());

      console.log(isAutoSave ? 'Auto-saved draft' : 'Manually saved draft');

      // Show success state for 2 seconds
      if (revertTimerRef.current) clearTimeout(revertTimerRef.current);
      revertTimerRef.current = setTimeout(() => {
        setSaveState('idle');
      }, 2000);

    } catch (error) {
      console.error('Failed to save draft:', error);

      // Error state
      setSaveState('error');

      // Auto-retry after 3 seconds
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        console.log('Retrying save...');
        handleSave(isAutoSave);
      }, 3000);
    }
  };

  const handleManualSave = () => {
    // Clear auto-save timer on manual save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    handleSave(false);
  };

  // Button appearance based on state
  const getButtonStyles = () => {
    switch (saveState) {
      case 'saving':
        return 'bg-blue-600 text-white border-blue-600';
      case 'saved':
        return 'bg-green-600 text-white border-green-600';
      case 'error':
        return 'bg-red-600 text-white border-red-600';
      default:
        return 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
    }
  };

  const getButtonContent = () => {
    switch (saveState) {
      case 'saving':
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving...</span>
          </>
        );
      case 'saved':
        return (
          <>
            <Check className="w-4 h-4" />
            <span>Saved</span>
          </>
        );
      case 'error':
        return (
          <>
            <X className="w-4 h-4" />
            <span>Error</span>
          </>
        );
      default:
        return (
          <>
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </>
        );
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleManualSave}
        disabled={saveState === 'saving'}
        className={`
          inline-flex items-center gap-2 px-4 py-2
          border-2 rounded-lg font-medium text-sm
          transition-all duration-200
          ${getButtonStyles()}
          ${saveState === 'saving' ? 'cursor-wait' : 'cursor-pointer'}
          disabled:cursor-not-allowed
        `}
        type="button"
      >
        {getButtonContent()}
      </button>

      {/* Last Saved Indicator */}
      {lastSaved && saveState === 'idle' && (
        <p className="text-xs text-gray-500 animate-in fade-in duration-200">
          Last saved: {timeSinceLastSave}
        </p>
      )}

      {/* Auto-saving Indicator */}
      {hasChanges && saveState === 'idle' && lastSaved && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
          <span>Unsaved changes</span>
        </div>
      )}
    </div>
  );
}
