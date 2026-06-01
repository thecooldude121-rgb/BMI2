import React, { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

interface CampaignNameInputProps {
  value: string;
  onChange: (value: string) => void;
  existingNames?: string[];
  disabled?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export const CampaignNameInput: React.FC<CampaignNameInputProps> = ({
  value,
  onChange,
  existingNames = [],
  disabled = false,
  onValidationChange
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const MAX_LENGTH = 100;
  const MIN_LENGTH = 5;
  const INVALID_CHARS = /[<>\/\\|]/;

  const validateName = (name: string): { isValid: boolean; error: string | null } => {
    if (name.trim().length === 0) {
      return { isValid: false, error: 'Campaign name is required' };
    }

    if (name.length < MIN_LENGTH) {
      return { isValid: false, error: `Name must be at least ${MIN_LENGTH} characters` };
    }

    if (name.length > MAX_LENGTH) {
      return { isValid: false, error: `Maximum ${MAX_LENGTH} characters` };
    }

    if (INVALID_CHARS.test(name)) {
      return { isValid: false, error: 'Name cannot contain < > / \\ |' };
    }

    if (existingNames.some(existing => existing.toLowerCase() === name.toLowerCase())) {
      return { isValid: false, error: 'A campaign with this name already exists' };
    }

    return { isValid: true, error: null };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleAutoSave = async (nameValue: string) => {
    if (!nameValue || nameValue.length < MIN_LENGTH) return;

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const validation = validateName(value);
    setError(validation.error);
    setIsValid(validation.isValid);

    if (onValidationChange) {
      onValidationChange(validation.isValid);
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    if (value && value.length >= MIN_LENGTH) {
      handleAutoSave(value);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (!value) {
      setError(null);
    }
  };

  useEffect(() => {
    if (value && !isFocused) {
      const validation = validateName(value);
      setError(validation.error);
      setIsValid(validation.isValid);

      if (onValidationChange) {
        onValidationChange(validation.isValid);
      }
    }
  }, [value, isFocused]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const getBorderColor = () => {
    if (disabled) return 'border-gray-300';
    if (error && !isFocused) return 'border-red-500';
    if (isValid && !isFocused) return 'border-green-400';
    if (isFocused) return 'border-blue-500';
    return 'border-gray-300';
  };

  const getBackgroundColor = () => {
    if (disabled) return 'bg-gray-100';
    return 'bg-white';
  };

  const showError = error && !isFocused;
  const showSuccess = isValid && !isFocused && !error;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-900">
          Campaign Name <span className="text-red-500">*</span>
        </label>
        {isSaving && (
          <div className="flex items-center text-xs text-gray-500">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Saving...
          </div>
        )}
        {lastSaved && !isSaving && (
          <div className="text-xs text-gray-500">
            Saved {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          id="campaign-name"
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="Enter campaign name (e.g., Q1 2025 Enterprise Outreach)"
          maxLength={MAX_LENGTH}
          className={`
            w-full px-4 py-2.5 pr-12 rounded-lg border-2
            ${getBorderColor()}
            ${getBackgroundColor()}
            text-gray-900 placeholder-gray-400
            transition-all duration-200
            ${isFocused ? 'ring-4 ring-blue-100' : ''}
            ${disabled ? 'cursor-not-allowed' : ''}
            focus:outline-none
          `}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {showSuccess && (
            <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
              <Check className="w-4 h-4 text-green-600" />
            </div>
          )}
          {showError && (
            <div className="flex items-center justify-center w-6 h-6 bg-red-100 rounded-full">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div>
          {showError && (
            <p className="flex items-center gap-1 text-red-600 font-medium">
              {error.includes('required') && '❌ '}
              {error.includes('must be') && '⚠️ '}
              {error.includes('Maximum') && '❌ '}
              {error.includes('already exists') && '⚠️ '}
              {error.includes('cannot contain') && '❌ '}
              {error}
            </p>
          )}
        </div>
        <div className={`
          ${value.length >= MAX_LENGTH - 10 ? 'text-orange-600 font-medium' : 'text-gray-500'}
          ${value.length === MAX_LENGTH ? 'text-red-600 font-bold' : ''}
        `}>
          {value.length}/{MAX_LENGTH} chars
        </div>
      </div>

      {showSuccess && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <Check className="w-3 h-3" />
          Campaign name is valid
        </p>
      )}
    </div>
  );
};
