import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { ALL_DEAL_TAGS, DealTag } from '../../../config/dealTags';

interface DealTagBrowserModalProps {
  isOpen: boolean;
  currentTags: string[];
  customTags: DealTag[];
  onApply: (tags: string[]) => void;
  onClose: () => void;
  onCreateCustomTag: (tag: DealTag) => void;
}

const tempTagId = () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const plural = (n: number, word: string) => `${n} ${word}${n !== 1 ? 's' : ''}`;

export const DealTagBrowserModal: React.FC<DealTagBrowserModalProps> = ({
  isOpen,
  currentTags,
  customTags,
  onApply,
  onClose,
  onCreateCustomTag,
}) => {
  // ── Animation ─────────────────────────────────────────────────────────────
  const [isVisible, setIsVisible] = useState(false);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [newTagInput, setNewTagInput] = useState('');
  const [newTagError, setNewTagError] = useState('');
  const [newTagSuccessMsg, setNewTagSuccessMsg] = useState('');

  // ── Refs ──────────────────────────────────────────────────────────────────
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Sync state when modal opens ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }
    setSelected(currentTags);
    setSearchQuery('');
    setActiveCategory('All');
    setNewTagInput('');
    setNewTagError('');
    setNewTagSuccessMsg('');
    // Entry animation
    const tAnim = setTimeout(() => setIsVisible(true), 10);
    // Auto-focus search
    const tFocus = setTimeout(() => searchInputRef.current?.focus(), 60);
    return () => { clearTimeout(tAnim); clearTimeout(tFocus); };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // ── Escape key ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── Focus trap ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const panel = panelRef.current;
    const trapFocus = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener('keydown', trapFocus);
    return () => panel.removeEventListener('keydown', trapFocus);
  }, [isOpen]);

  // ── Computed tag data ─────────────────────────────────────────────────────
  const allAvailableTags = useMemo(
    () => [...ALL_DEAL_TAGS, ...customTags],
    [customTags]
  );

  const allCategories = useMemo(() => {
    const cats = Array.from(new Set(allAvailableTags.map(t => t.category)));
    return ['All', ...cats];
  }, [allAvailableTags]);

  const filteredTags = useMemo(() => {
    let result = allAvailableTags;
    if (activeCategory !== 'All') {
      result = result.filter(t => t.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t => t.label.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      const aSel = selected.includes(a.label) ? 0 : 1;
      const bSel = selected.includes(b.label) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
      return a.label.localeCompare(b.label);
    });
  }, [allAvailableTags, activeCategory, searchQuery, selected]);

  const groupedTags = useMemo(() =>
    filteredTags.reduce<Record<string, DealTag[]>>((acc, tag) => {
      if (!acc[tag.category]) acc[tag.category] = [];
      acc[tag.category].push(tag);
      return acc;
    }, {}),
    [filteredTags]
  );

  // Pre-fill create input when search has no results
  useEffect(() => {
    if (filteredTags.length === 0 && searchQuery.trim()) {
      setNewTagInput(searchQuery.trim());
    }
  }, [filteredTags.length, searchQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleTag = useCallback((label: string) => {
    setSelected(prev =>
      prev.includes(label) ? prev.filter(t => t !== label) : [...prev, label]
    );
  }, []);

  const handleApply = useCallback(() => {
    onApply(selected);
  }, [selected, onApply]);

  const handleCreateTag = useCallback(() => {
    const trimmed = newTagInput.trim();
    if (!trimmed) {
      setNewTagError('Tag name cannot be empty.');
      return;
    }
    if (trimmed.length > 30) {
      setNewTagError('Tag name must be 30 characters or fewer.');
      return;
    }
    const isDuplicate = allAvailableTags.some(
      t => t.label.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setNewTagError(`"${trimmed}" already exists.`);
      return;
    }
    const newTag: DealTag = {
      id: tempTagId(),
      label: trimmed,
      category: 'Custom',
      color: 'bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
      isCustom: true,
      usageCount: 0,
    };
    onCreateCustomTag(newTag);
    setSelected(prev => [...prev, trimmed]);
    setNewTagInput('');
    setNewTagError('');
    setNewTagSuccessMsg(`"${trimmed}" created and selected`);
    setTimeout(() => setNewTagSuccessMsg(''), 3000);
  }, [newTagInput, allAvailableTags, onCreateCustomTag]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tag-modal-heading"
        onClick={e => e.stopPropagation()}
        className={`relative bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] sm:max-h-[88vh] flex flex-col transition-all duration-150 ease-out ${
          isVisible ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-4 sm:scale-95'
        }`}
      >
        {/* ── ZONE A — HEADER ───────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-gray-100">
          {/* Title row */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xl leading-none">🏷️</span>
              <h2
                id="tag-modal-heading"
                className="text-lg font-semibold text-gray-800"
              >
                Browse All Tags
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-xl font-light"
            >
              ×
            </button>
          </div>

          {/* Subtitle counts */}
          <p className="text-sm text-gray-400 mb-4">
            {allAvailableTags.length} tags
            {selected.length > 0 && (
              <span className="text-indigo-600 font-medium">
                {' '}· {plural(selected.length, 'tag')} selected
              </span>
            )}
          </p>

          {/* Search */}
          <div className="relative mb-3">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
              🔍
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tags by name or category..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl font-light leading-none"
              >
                ×
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {allCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── ZONE B — SCROLLABLE BODY ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredTags.length > 0 ? (
            Object.entries(groupedTags).map(([category, tags], idx) => (
              <div key={category}>
                <p className={`text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 ${idx === 0 ? '' : 'mt-5'}`}>
                  {category}
                </p>
                <div className="flex flex-wrap gap-2 mb-1">
                  {tags.map(tag => {
                    const isSel = selected.includes(tag.label);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.label)}
                        className={`cursor-pointer select-none rounded-full px-3 py-1.5 text-sm flex items-center gap-1.5 border transition-all duration-100 active:scale-95 ${
                          isSel
                            ? `${tag.color} ${tag.textColor} border-2 ${tag.borderColor} font-medium`
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {isSel && <span className="text-xs">✓</span>}
                        {tag.label}
                        {tag.usageCount > 0 && (
                          <span className="text-xs text-gray-400">({tag.usageCount})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-500 mb-1">
                No tags found for{' '}
                <span className="font-medium">"{searchQuery}"</span>
              </p>
              <p className="text-xs text-gray-400">
                Press Enter below to create it as a custom tag
              </p>
            </div>
          )}

          {/* Create Custom Tag */}
          <div className="border-t border-gray-100 mt-6 pt-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              + Create a Custom Tag
            </p>
            <div className="flex gap-2 items-start">
              <input
                type="text"
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); }
                }}
                placeholder="New tag name (max 30 characters)"
                maxLength={30}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  newTagError
                    ? 'border-red-300 focus:ring-red-300'
                    : newTagSuccessMsg
                    ? 'border-green-300 focus:ring-green-300'
                    : 'border-gray-200 focus:ring-indigo-300'
                }`}
              />
              <button
                type="button"
                onClick={handleCreateTag}
                className="shrink-0 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                + Add
              </button>
            </div>
            <div className="mt-1.5 min-h-[1.25rem]">
              {newTagError ? (
                <p className="text-xs text-red-500">⚠ {newTagError}</p>
              ) : newTagSuccessMsg ? (
                <p className="text-xs text-green-600">✓ {newTagSuccessMsg}</p>
              ) : (
                <p className="text-xs text-gray-400">{newTagInput.length}/30 characters</p>
              )}
            </div>
          </div>
        </div>

        {/* ── ZONE C — FOOTER ───────────────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-sm text-gray-500">
              {selected.length === 0
                ? 'No tags selected'
                : plural(selected.length, 'tag') + ' selected'}
            </span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="ml-3 text-sm text-red-400 hover:text-red-600 underline underline-offset-2 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-gray-300 text-gray-600 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={selected.length === 0}
              className={`bg-indigo-600 text-white rounded-lg px-5 py-2 text-sm font-semibold transition-colors ${
                selected.length === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-indigo-700'
              }`}
            >
              {selected.length > 0
                ? `Apply ${plural(selected.length, 'Tag')}`
                : 'Apply Tags'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
