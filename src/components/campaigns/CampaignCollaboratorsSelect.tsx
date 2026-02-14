import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Users, AlertCircle, Check } from 'lucide-react';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  title: string;
}

interface CampaignCollaboratorsSelectProps {
  selectedCollaboratorIds: string[];
  onChange: (ids: string[]) => void;
  ownerId: string;
  availableUsers?: Collaborator[];
  maxCollaborators?: number;
}

const DEFAULT_USERS: Collaborator[] = [
  {
    id: 'current_user',
    name: 'Adithya',
    email: 'adithya@company.com',
    avatar: 'AD',
    role: 'Admin',
    title: 'Sales Director'
  },
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

export default function CampaignCollaboratorsSelect({
  selectedCollaboratorIds,
  onChange,
  ownerId,
  availableUsers = DEFAULT_USERS,
  maxCollaborators = 10
}: CampaignCollaboratorsSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter out the owner from available users
  const selectableUsers = availableUsers.filter(user => user.id !== ownerId);

  // Get selected collaborators
  const selectedCollaborators = selectableUsers.filter(user =>
    selectedCollaboratorIds.includes(user.id)
  );

  // Filter users based on search query
  const filteredUsers = searchQuery.trim()
    ? selectableUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : selectableUsers;

  const atMaxCollaborators = selectedCollaboratorIds.length >= maxCollaborators;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-save after 3 seconds
  useEffect(() => {
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      console.log('Collaborators auto-saved:', selectedCollaborators.map(c => c.name).join(', '));
      setHasChanges(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [selectedCollaborators, hasChanges]);

  const handleToggleCollaborator = useCallback((userId: string) => {
    const isCurrentlySelected = selectedCollaboratorIds.includes(userId);

    if (isCurrentlySelected) {
      // Remove collaborator
      const newIds = selectedCollaboratorIds.filter(id => id !== userId);
      onChange(newIds);
      setHasChanges(true);
    } else {
      // Add collaborator (if not at max)
      if (!atMaxCollaborators) {
        const newIds = [...selectedCollaboratorIds, userId];
        onChange(newIds);
        setHasChanges(true);
      }
    }
  }, [selectedCollaboratorIds, onChange, atMaxCollaborators]);

  const handleRemovePill = useCallback((userId: string) => {
    const newIds = selectedCollaboratorIds.filter(id => id !== userId);
    onChange(newIds);
    setHasChanges(true);
  }, [selectedCollaboratorIds, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, []);

  return (
    <div className="space-y-2" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-900">
        Collaborators
        <span className="text-gray-500 font-normal ml-2">(Optional)</span>
      </label>

      {/* Search Input */}
      <div className="relative">
        <div
          className={`
            relative border-2 rounded-lg transition-all duration-200
            ${isOpen
              ? 'border-blue-500 ring-4 ring-blue-100'
              : 'border-gray-300 hover:border-gray-400'
            }
            bg-white
          `}
        >
          <div className="flex items-center px-4 py-3 gap-2">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search team members..."
              className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-400"
              disabled={atMaxCollaborators}
            />
            {selectedCollaboratorIds.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                <Users className="w-3.5 h-3.5" />
                <span>{selectedCollaboratorIds.length} selected</span>
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="
              absolute z-50 mt-1 w-full
              bg-white border border-gray-200 rounded-lg shadow-xl
              animate-in fade-in slide-in-from-top-2 duration-150
            "
            style={{ maxHeight: '320px' }}
          >
            {/* User List */}
            <div className="max-h-[280px] overflow-y-auto p-2">
              {filteredUsers.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No team members found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedCollaboratorIds.includes(user.id);
                  const isDisabled = atMaxCollaborators && !isSelected;

                  return (
                    <button
                      key={user.id}
                      onClick={() => !isDisabled && handleToggleCollaborator(user.id)}
                      className={`
                        w-full px-3 py-3 rounded-lg text-left
                        transition-colors duration-150 flex items-center gap-3
                        ${isDisabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-50 cursor-pointer'
                        }
                      `}
                      type="button"
                      disabled={isDisabled}
                    >
                      {/* Checkbox */}
                      <div
                        className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center
                          flex-shrink-0 transition-all duration-200
                          ${isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 bg-white'
                          }
                        `}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {user.avatar}
                      </div>

                      {/* User Info */}
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {user.email}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-600">
                <span className="font-medium">Collaborators</span> can view, edit, and receive notifications for this campaign.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Pills */}
      {selectedCollaborators.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedCollaborators.map((user) => (
            <div
              key={user.id}
              className="
                inline-flex items-center gap-2 px-3 py-2
                bg-blue-50 border border-blue-200 rounded-lg
                animate-in fade-in slide-in-from-left-1 duration-200
              "
            >
              {/* Avatar */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                {user.avatar}
              </div>

              {/* Name */}
              <span className="text-sm font-medium text-gray-900">
                {user.name}
              </span>

              {/* Remove Button */}
              <button
                onClick={() => handleRemovePill(user.id)}
                className="
                  w-5 h-5 rounded-full hover:bg-blue-200
                  flex items-center justify-center
                  transition-colors duration-150
                "
                type="button"
                aria-label={`Remove ${user.name}`}
              >
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Max Collaborators Warning */}
      {atMaxCollaborators && (
        <div
          className="
            flex items-start gap-2 p-3 border-2 border-yellow-200 bg-yellow-50 rounded-lg
            animate-in slide-in-from-top-2 duration-200
          "
        >
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-900">
              Maximum collaborators reached
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              You can add up to {maxCollaborators} collaborators per campaign. Remove one to add another.
            </p>
          </div>
        </div>
      )}

      {/* Auto-save Indicator */}
      {hasChanges && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
          <span>Auto-saving collaborators...</span>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        Add team members who can help manage this campaign. The owner cannot be added as a collaborator.
      </p>
    </div>
  );
}
