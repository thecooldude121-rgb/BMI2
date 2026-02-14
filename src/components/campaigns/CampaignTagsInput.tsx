import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Tag, ChevronDown } from 'lucide-react';

interface CampaignTagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  existingTags?: string[];
}

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 20;

const DEFAULT_SUGGESTIONS = [
  'Enterprise',
  'SaaS',
  'SMB',
  'Product Launch',
  'Nurture',
  'Re-engagement',
  'Webinar',
  'Event',
  'Cold Outreach',
  'Warm Leads',
  'High Priority',
  'Q1 2025',
  'Demo Request',
  'Trial Users',
  'Churn Risk'
];

export default function CampaignTagsInput({
  tags,
  onChange,
  existingTags = DEFAULT_SUGGESTIONS
}: CampaignTagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = inputValue.trim()
    ? existingTags.filter(tag =>
        tag.toLowerCase().includes(inputValue.toLowerCase()) &&
        !tags.some(t => t.toLowerCase() === tag.toLowerCase())
      )
    : existingTags.filter(tag =>
        !tags.some(t => t.toLowerCase() === tag.toLowerCase())
      );

  // Auto-save after 5 seconds
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      console.log('Tags auto-saved:', tags);
      setHasChanges(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [tags, hasChanges]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateTag = useCallback((tag: string): string | null => {
    if (tag.length === 0) {
      return 'Tag cannot be empty';
    }
    if (tag.length > MAX_TAG_LENGTH) {
      return `Tag must be ${MAX_TAG_LENGTH} characters or less`;
    }
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(tag)) {
      return 'Only letters, numbers, spaces, dashes, and underscores allowed';
    }
    if (tags.some(t => t.toLowerCase() === tag.toLowerCase())) {
      return 'Tag already exists';
    }
    if (tags.length >= MAX_TAGS) {
      return `Maximum ${MAX_TAGS} tags allowed`;
    }
    return null;
  }, [tags]);

  const addTag = useCallback((tagToAdd: string) => {
    const trimmedTag = tagToAdd.trim();
    if (!trimmedTag) return;

    const validationError = validateTag(trimmedTag);
    if (validationError) {
      setError(validationError);
      setTimeout(() => setError(null), 3000);
      return;
    }

    onChange([...tags, trimmedTag]);
    setInputValue('');
    setError(null);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setHasChanges(true);
    inputRef.current?.focus();
  }, [tags, onChange, validateTag]);

  const removeTag = useCallback((index: number) => {
    const newTags = tags.filter((_, i) => i !== index);
    onChange(newTags);
    setHasChanges(true);
  }, [tags, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setError(null);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle comma as separator
    if (e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
      return;
    }

    // Handle Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        addTag(filteredSuggestions[highlightedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
      return;
    }

    // Handle Escape
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      return;
    }

    // Handle Backspace on empty input
    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
      return;
    }

    // Handle Arrow Down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSuggestions(true);
      setHighlightedIndex(prev =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
      return;
    }

    // Handle Arrow Up
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
      return;
    }
  }, [inputValue, highlightedIndex, filteredSuggestions, tags, addTag, removeTag]);

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    setShowSuggestions(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
    // Delay to allow click on suggestions
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }, 200);
  }, []);

  const canAddMore = tags.length < MAX_TAGS;

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-900">
          Campaign Tags (Optional)
        </label>
        <span className="text-xs text-gray-500">
          {tags.length}/{MAX_TAGS} tags
        </span>
      </div>

      <div
        className={`
          min-h-[42px] px-3 py-2 border-2 rounded-lg
          transition-all duration-200
          ${isFocused
            ? 'border-blue-500 ring-4 ring-blue-100'
            : error
            ? 'border-red-500 ring-4 ring-red-100'
            : 'border-gray-300'
          }
          ${!canAddMore ? 'bg-gray-50' : 'bg-white'}
          hover:border-gray-400
          focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100
        `}
      >
        <div className="flex flex-wrap gap-2">
          {/* Tag Pills */}
          {tags.map((tag, index) => (
            <div
              key={index}
              className="
                flex items-center gap-1.5 px-2.5 py-1
                bg-blue-100 text-blue-800 rounded-md
                text-sm font-medium
                animate-in fade-in slide-in-from-left-2
                transition-all duration-200
              "
            >
              <Tag className="w-3 h-3" />
              <span>{tag}</span>
              <button
                onClick={() => removeTag(index)}
                className="
                  ml-0.5 p-0.5 rounded
                  text-blue-600 hover:text-blue-800 hover:bg-blue-200
                  transition-colors
                "
                type="button"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Input Field */}
          {canAddMore && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={tags.length === 0 ? "Type and press Enter to add tags" : "Add tag..."}
              maxLength={MAX_TAG_LENGTH}
              className="
                flex-1 min-w-[120px] px-1 py-1
                bg-transparent border-0 outline-none
                text-gray-900 placeholder-gray-400
                text-sm
              "
            />
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 animate-in slide-in-from-top-1">
          <span className="font-medium">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Helper Text */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Press Enter or comma to add • Max {MAX_TAG_LENGTH} characters</span>
        {inputValue.length > 0 && (
          <span className={inputValue.length >= MAX_TAG_LENGTH ? 'text-red-600 font-medium' : ''}>
            {inputValue.length}/{MAX_TAG_LENGTH}
          </span>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          className="
            absolute z-10 mt-1 w-full max-w-[500px]
            bg-white border border-gray-200 rounded-lg shadow-lg
            max-h-[200px] overflow-y-auto
            animate-in fade-in slide-in-from-top-2 duration-150
          "
        >
          <div className="p-2">
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-gray-500">
              <ChevronDown className="w-3 h-3" />
              <span>Suggested tags</span>
            </div>
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                onClick={() => addTag(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  w-full px-3 py-2 text-left text-sm rounded-md
                  transition-colors duration-150
                  ${highlightedIndex === index
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span>{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Auto-save Indicator */}
      {hasChanges && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
          <span>Auto-saving tags...</span>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-600">
          <span className="font-medium">Tags help organize campaigns.</span> Use them to filter and search campaigns later. Tags are visible to your entire team.
        </p>
      </div>
    </div>
  );
}
