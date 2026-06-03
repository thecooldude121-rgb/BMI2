import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Loader2, Link } from 'lucide-react';
import { searchContacts } from '../../../utils/dealsApi';

export interface SearchedContact {
  id: string;
  name: string;
  title?: string;
  company?: string;
  email?: string;
}

interface ContactAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onContactSelect: (contact: SearchedContact | null) => void;
  accountName?: string;
  placeholder?: string;
  hasError?: boolean;
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
  'bg-teal-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('');
}

function getAvatarColor(name: string): string {
  const code = (name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[code];
}

export const ContactAutocomplete: React.FC<ContactAutocompleteProps> = ({
  value,
  onChange,
  onContactSelect,
  accountName,
  placeholder = 'Search or enter contact name…',
  hasError = false,
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<SearchedContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [linkedContact, setLinkedContact] = useState<SearchedContact | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes (e.g. SmartSearchPanel pre-fills name, form reset)
  useEffect(() => {
    if (!linkedContact) {
      setQuery(value);
    }
    // If value is cleared externally, also clear any linked state
    if (value === '' && linkedContact) {
      setLinkedContact(null);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced contact search
  useEffect(() => {
    if (linkedContact) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const raw = await searchContacts(query);
        const mapped: SearchedContact[] = raw.map((c: any) => ({
          id: String(c.id),
          name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
          title: c.position ?? undefined,
          company: c.company_name ?? undefined,
          email: c.email ?? undefined,
        }));

        // Prioritize contacts whose company matches the current account
        if (accountName?.trim()) {
          const acctLower = accountName.trim().toLowerCase();
          mapped.sort((a, b) => {
            const aMatch = a.company?.toLowerCase().includes(acctLower) ? 0 : 1;
            const bMatch = b.company?.toLowerCase().includes(acctLower) ? 0 : 1;
            return aMatch - bMatch;
          });
        }

        setResults(mapped);
        setIsOpen(true);
      } catch {
        setResults([]);
        setIsOpen(true); // still open to show "Create new"
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, linkedContact, accountName]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalOptions = results.length + (query.length >= 2 ? 1 : 0); // +1 for Create new

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
    setHighlightedIndex(-1);
    if (linkedContact) {
      setLinkedContact(null);
      onContactSelect(null);
    }
  };

  const handleSelect = (contact: SearchedContact) => {
    setLinkedContact(contact);
    setQuery(contact.name);
    onChange(contact.name);
    onContactSelect(contact);
    setIsOpen(false);
    setResults([]);
    setHighlightedIndex(-1);
  };

  const handleCreateNew = () => {
    onContactSelect(null);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    setLinkedContact(null);
    setQuery('');
    onChange('');
    onContactSelect(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % totalOptions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + totalOptions) % totalOptions);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          handleSelect(results[highlightedIndex]);
        } else if (highlightedIndex === results.length && query.length >= 2) {
          handleCreateNew();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // ── Linked state: show compact badge row instead of the input ─────────────
  if (linkedContact) {
    return (
      <div
        className={`flex-1 flex items-center gap-2.5 px-4 py-3 border rounded-lg ${
          hasError ? 'border-red-500' : 'border-green-400 bg-green-50'
        }`}
      >
        <div
          className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(linkedContact.name)}`}
          aria-hidden="true"
        >
          {getInitials(linkedContact.name)}
        </div>
        <span className="flex-1 text-sm font-medium text-gray-900 truncate">
          {linkedContact.name}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded-full px-2 py-0.5 flex-shrink-0">
          <Link className="h-3 w-3" />
          Linked
        </span>
        <button
          type="button"
          onClick={handleClear}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Change contact"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // ── Search input + dropdown ───────────────────────────────────────────────
  const showAccountGroup =
    accountName?.trim() &&
    results.some(r => r.company?.toLowerCase().includes(accountName.trim().toLowerCase()));

  return (
    <div ref={containerRef} className="flex-1 relative">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-controls="contact-autocomplete-listbox"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length >= 2 && (results.length > 0 || !loading)) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full pl-9 pr-9 py-3 border rounded-lg focus:outline-none focus:ring-2 text-sm ${
            hasError
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {loading ? (
          <Loader2
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin"
            aria-label="Searching…"
          />
        ) : query ? (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={e => { e.preventDefault(); setQuery(''); onChange(''); setResults([]); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          id="contact-autocomplete-listbox"
          role="listbox"
          className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto"
        >
          {results.length > 0 && (
            <>
              {/* "From this account" group header when account-matched contacts appear first */}
              {showAccountGroup && (
                <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                  From this account
                </div>
              )}
              {results.map((contact, idx) => {
                const isAccountMatch =
                  accountName?.trim() &&
                  contact.company?.toLowerCase().includes(accountName.trim().toLowerCase());
                // Section break: first non-account contact after account-matched ones
                const prevWasAccountMatch =
                  idx > 0 &&
                  results[idx - 1].company
                    ?.toLowerCase()
                    .includes(accountName?.trim().toLowerCase() ?? '##');
                const showSectionBreak = showAccountGroup && !isAccountMatch && prevWasAccountMatch;

                return (
                  <React.Fragment key={contact.id}>
                    {showSectionBreak && (
                      <div className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-y border-gray-100">
                        Other contacts
                      </div>
                    )}
                    <button
                      type="button"
                      role="option"
                      aria-selected={highlightedIndex === idx}
                      onMouseDown={e => { e.preventDefault(); handleSelect(contact); }}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                        highlightedIndex === idx ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(contact.name)}`}
                        aria-hidden="true"
                      >
                        {getInitials(contact.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {contact.name}
                        </div>
                        {(contact.title || contact.company) && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">
                            {[contact.title, contact.company].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                    </button>
                  </React.Fragment>
                );
              })}
            </>
          )}

          {/* "Create new" option — always shown when query >= 2 chars */}
          {query.length >= 2 && (
            <button
              type="button"
              role="option"
              aria-selected={highlightedIndex === results.length}
              onMouseDown={e => { e.preventDefault(); handleCreateNew(); }}
              onMouseEnter={() => setHighlightedIndex(results.length)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                highlightedIndex === results.length ? 'bg-blue-50' : 'hover:bg-gray-50'
              } ${results.length > 0 ? 'border-t border-gray-200' : ''}`}
            >
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-100">
                <Plus className="h-4 w-4 text-gray-500" aria-hidden="true" />
              </div>
              <div>
                <div className="text-sm font-medium text-blue-600">
                  Create "{query}" as new contact
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Will be saved when the deal is created
                </div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
