import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Info, Type, Bold, Italic, List } from 'lucide-react';

interface CampaignDescriptionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onSave?: () => void;
}

export const CampaignDescriptionTextarea: React.FC<CampaignDescriptionTextareaProps> = ({
  value,
  onChange,
  disabled = false,
  onSave
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [rows, setRows] = useState(4);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showMarkdownHint, setShowMarkdownHint] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_LENGTH = 500;
  const MIN_ROWS = 4;
  const MAX_ROWS = 8;

  const calculateRows = useCallback((text: string) => {
    if (!text) return MIN_ROWS;

    const lineBreaks = (text.match(/\n/g) || []).length;
    const calculatedRows = Math.min(Math.max(lineBreaks + 2, MIN_ROWS), MAX_ROWS);

    return calculatedRows;
  }, []);

  useEffect(() => {
    const newRows = calculateRows(value);
    setRows(newRows);
  }, [value, calculateRows]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    if (newValue.length > MAX_LENGTH) {
      return;
    }

    onChange(newValue);

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave(newValue);
    }, 5000);
  };

  const handleAutoSave = async (descriptionValue: string) => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastSaved(new Date());
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (value && value.trim().length > 0) {
      handleAutoSave(value);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      handleAutoSave(value);

      if (onSave) {
        onSave();
      }

      textareaRef.current?.blur();
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;

      if (start === end) {
        e.preventDefault();
      }
    }
  };

  const insertMarkdown = (syntax: string, placeholder: string = 'text') => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;

    let newText = '';
    let cursorPos = start;

    switch (syntax) {
      case 'bold':
        newText = value.substring(0, start) + `**${textToInsert}**` + value.substring(end);
        cursorPos = start + 2 + textToInsert.length;
        break;
      case 'italic':
        newText = value.substring(0, start) + `*${textToInsert}*` + value.substring(end);
        cursorPos = start + 1 + textToInsert.length;
        break;
      case 'list':
        newText = value.substring(0, start) + `\n- ${textToInsert}` + value.substring(end);
        cursorPos = start + 3 + textToInsert.length;
        break;
      default:
        return;
    }

    if (newText.length <= MAX_LENGTH) {
      onChange(newText);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(cursorPos, cursorPos);
        }
      }, 0);
    }
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const getBorderColor = () => {
    if (disabled) return 'border-gray-300';
    if (isFocused) return 'border-blue-500';
    return 'border-gray-300';
  };

  const getBackgroundColor = () => {
    if (disabled) return 'bg-gray-100';
    return 'bg-white';
  };

  const charactersRemaining = MAX_LENGTH - value.length;
  const percentUsed = (value.length / MAX_LENGTH) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="campaign-description" className="block text-sm font-medium text-gray-900">
          Description
          <span className="text-gray-500 font-normal ml-1">(Optional)</span>
        </label>
        <div className="flex items-center gap-3">
          {isSaving && (
            <div className="flex items-center text-xs text-gray-500">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Saving...
            </div>
          )}
          {lastSaved && !isSaving && value && (
            <div className="text-xs text-gray-500">
              Saved {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {isFocused && (
        <div className="flex items-center gap-2 pb-1">
          <button
            type="button"
            onClick={() => insertMarkdown('bold', 'bold text')}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('italic', 'italic text')}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown('list', 'list item')}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onMouseEnter={() => setShowMarkdownHint(true)}
            onMouseLeave={() => setShowMarkdownHint(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors relative"
            title="Markdown supported"
          >
            <Type className="w-4 h-4" />
            {showMarkdownHint && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-10">
                <div className="font-semibold mb-1">Markdown Supported:</div>
                <div className="space-y-1 text-gray-300">
                  <div>**bold** → <strong>bold</strong></div>
                  <div>*italic* → <em>italic</em></div>
                  <div>- list item → • list item</div>
                </div>
              </div>
            )}
          </button>
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          id="campaign-description"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Briefly describe the purpose and goals of this campaign...&#10;&#10;You can use markdown formatting:&#10;**bold** *italic* - bullet points"
          rows={rows}
          maxLength={MAX_LENGTH}
          className={`
            w-full px-4 py-2.5 rounded-lg border-2
            ${getBorderColor()}
            ${getBackgroundColor()}
            text-gray-900 placeholder-gray-400
            transition-all duration-200
            ${isFocused ? 'ring-4 ring-blue-100' : ''}
            ${disabled ? 'cursor-not-allowed' : ''}
            focus:outline-none resize-none
            leading-relaxed
          `}
          style={{
            minHeight: `${MIN_ROWS * 1.5}rem`,
            maxHeight: `${MAX_ROWS * 1.5}rem`
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isFocused && (
            <div className="flex items-center gap-1 text-gray-500">
              <span className="font-medium">Tip:</span>
              <span>Press Ctrl+Enter to save and continue</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {value.length > 0 && (
            <div className={`
              transition-colors
              ${percentUsed < 80 ? 'text-gray-500' : ''}
              ${percentUsed >= 80 && percentUsed < 95 ? 'text-orange-600 font-medium' : ''}
              ${percentUsed >= 95 ? 'text-red-600 font-bold' : ''}
            `}>
              {charactersRemaining} chars remaining
            </div>
          )}
          <div className={`
            ${value.length >= MAX_LENGTH - 50 ? 'text-orange-600 font-medium' : 'text-gray-500'}
            ${value.length === MAX_LENGTH ? 'text-red-600 font-bold' : ''}
          `}>
            {value.length}/{MAX_LENGTH}
          </div>
        </div>
      </div>

      {rows >= MAX_ROWS && value.length < MAX_LENGTH && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Maximum rows reached</p>
            <p className="text-amber-600">The textarea won't expand further, but you can continue typing up to {MAX_LENGTH} characters.</p>
          </div>
        </div>
      )}

      {value.length >= MAX_LENGTH - 50 && value.length < MAX_LENGTH && (
        <div className="flex items-start gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Approaching character limit</p>
            <p className="text-orange-600">You have {charactersRemaining} characters remaining.</p>
          </div>
        </div>
      )}

      {value.length === MAX_LENGTH && (
        <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Character limit reached</p>
            <p className="text-red-600">You've reached the maximum length of {MAX_LENGTH} characters.</p>
          </div>
        </div>
      )}

      {isFocused && value.length === 0 && (
        <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Markdown Formatting Tips</p>
            <div className="text-blue-600 space-y-1 mt-1">
              <div>• Use **bold** for emphasis</div>
              <div>• Use *italic* for subtle emphasis</div>
              <div>• Use - for bullet points</div>
              <div>• Press Ctrl+Enter to save quickly</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
