import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check, User, Search, AlertCircle } from 'lucide-react';

interface CampaignOwner {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  title: string;
  isCurrentUser?: boolean;
}

interface CampaignOwnerDropdownProps {
  selectedOwnerId: string;
  onChange: (ownerId: string) => void;
  availableOwners?: CampaignOwner[];
}

// Mock current user
const CURRENT_USER: CampaignOwner = {
  id: 'current_user',
  name: 'Adithya',
  email: 'adithya@company.com',
  avatar: 'AD',
  role: 'Admin',
  title: 'Sales Director',
  isCurrentUser: true
};

// Default available owners with campaign permissions
const DEFAULT_OWNERS: CampaignOwner[] = [
  CURRENT_USER,
  {
    id: 'tm_001',
    name: 'Sarah Chen',
    email: 'sarah.chen@company.com',
    avatar: 'SC',
    role: 'Manager',
    title: 'Sales Manager'
  },
  {
    id: 'tm_002',
    name: 'Michael Rodriguez',
    email: 'michael.r@company.com',
    avatar: 'MR',
    role: 'Rep',
    title: 'Senior Account Executive'
  },
  {
    id: 'tm_003',
    name: 'Emily Johnson',
    email: 'emily.j@company.com',
    avatar: 'EJ',
    role: 'Rep',
    title: 'Account Executive'
  },
  {
    id: 'tm_005',
    name: 'Jessica Martinez',
    email: 'jessica.m@company.com',
    avatar: 'JM',
    role: 'Rep',
    title: 'Account Executive'
  },
  {
    id: 'tm_008',
    name: 'James Anderson',
    email: 'james.a@company.com',
    avatar: 'JA',
    role: 'Rep',
    title: 'Account Executive'
  }
];

const getRoleBadgeColor = (role: string) => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'bg-purple-100 text-purple-800';
    case 'manager':
      return 'bg-blue-100 text-blue-800';
    case 'rep':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function CampaignOwnerDropdown({
  selectedOwnerId,
  onChange,
  availableOwners = DEFAULT_OWNERS
}: CampaignOwnerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showWarning, setShowWarning] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOwner = availableOwners.find(owner => owner.id === selectedOwnerId) || availableOwners[0];

  // Filter owners based on search query
  const filteredOwners = searchQuery.trim()
    ? availableOwners.filter(owner =>
        owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        owner.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : availableOwners;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Auto-save after 5 seconds
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      console.log('Campaign owner auto-saved:', selectedOwner.name);
      setHasChanges(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [selectedOwner, hasChanges]);

  const handleSelectOwner = useCallback((owner: CampaignOwner) => {
    if (owner.id === selectedOwnerId) {
      setIsOpen(false);
      return;
    }

    onChange(owner.id);
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
    setHasChanges(true);

    // Show warning if changing to another user
    if (!owner.isCurrentUser) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);
    } else {
      setShowWarning(false);
    }
  }, [selectedOwnerId, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOwners[highlightedIndex]) {
          handleSelectOwner(filteredOwners[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(-1);
        break;

      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOwners.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
    }
  }, [highlightedIndex, filteredOwners, handleSelectOwner]);

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-900">
        Campaign Owner
      </label>

      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 border-2 rounded-lg text-left
          transition-all duration-200
          ${isOpen
            ? 'border-blue-500 ring-4 ring-blue-100'
            : 'border-gray-300 hover:border-gray-400'
          }
          bg-white
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {selectedOwner.avatar}
            </div>

            {/* Name and Email */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {selectedOwner.name}
                </span>
                {selectedOwner.isCurrentUser && (
                  <span className="text-xs text-gray-500">(You)</span>
                )}
              </div>
              <span className="text-xs text-gray-500">{selectedOwner.email}</span>
            </div>
          </div>

          {/* Dropdown Icon */}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute z-50 mt-1 w-full max-w-[500px]
            bg-white border border-gray-200 rounded-lg shadow-xl
            animate-in fade-in slide-in-from-top-2 duration-150
          "
          style={{ maxHeight: '400px' }}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search by name or email..."
                className="
                  w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md
                  text-sm text-gray-900 placeholder-gray-400
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                  outline-none
                "
              />
            </div>
          </div>

          {/* Owner List */}
          <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredOwners.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No results found</p>
                <p className="text-xs text-gray-400 mt-1">
                  Try a different search term
                </p>
              </div>
            ) : (
              filteredOwners.map((owner, index) => {
                const isSelected = owner.id === selectedOwnerId;
                const isHighlighted = index === highlightedIndex;

                return (
                  <button
                    key={owner.id}
                    onClick={() => handleSelectOwner(owner)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`
                      w-full px-3 py-3 rounded-lg text-left
                      transition-colors duration-150
                      ${isHighlighted
                        ? 'bg-blue-50'
                        : isSelected
                        ? 'bg-gray-50'
                        : 'hover:bg-gray-50'
                      }
                    `}
                    type="button"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {owner.avatar}
                        </div>

                        {/* User Info */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {owner.name}
                            </span>
                            {owner.isCurrentUser && (
                              <span className="text-xs text-blue-600 font-medium">
                                (You)
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 truncate">
                            {owner.email}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`
                                inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                ${getRoleBadgeColor(owner.role)}
                              `}
                            >
                              {owner.role}
                            </span>
                            <span className="text-xs text-gray-400">
                              {owner.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Checkmark */}
                      {isSelected && (
                        <Check className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600">
              <span className="font-medium">Campaign owners</span> can edit settings, view analytics, and manage campaign execution.
            </p>
          </div>
        </div>
      )}

      {/* Warning Message */}
      {showWarning && !selectedOwner.isCurrentUser && (
        <div
          className="
            flex items-start gap-2 p-3 border-2 border-yellow-200 bg-yellow-50 rounded-lg
            animate-in slide-in-from-top-2 duration-200
          "
        >
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">
              Owner changed
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              {selectedOwner.name} will receive all notifications for this campaign and have full control over campaign settings.
            </p>
          </div>
        </div>
      )}

      {/* Auto-save Indicator */}
      {hasChanges && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
          <span>Auto-saving owner selection...</span>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        The campaign owner will receive notifications and manage campaign execution.
      </p>
    </div>
  );
}
