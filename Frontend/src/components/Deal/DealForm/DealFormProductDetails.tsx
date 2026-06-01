import React, { useState, useRef, useEffect } from 'react';
import { Package, X, Search, Plus, Swords } from 'lucide-react';
import {
  COMPETITORS,
  POPULAR_COMPETITORS,
  Competitor,
  getCompetitorById,
} from '../../../config/competitors';

// ─── CompetitorMultiSelect ────────────────────────────────────────────────────

interface CompetitorMultiSelectProps {
  selected: Competitor[];
  onChange: (competitors: Competitor[]) => void;
}

const CompetitorMultiSelect: React.FC<CompetitorMultiSelectProps> = ({
  selected,
  onChange,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(selected.map(c => c.id));

  const filtered = query.length >= 1
    ? COMPETITORS.filter(
        c => c.name.toLowerCase().includes(query.toLowerCase()) && !selectedIds.has(c.id)
      )
    : [];

  const popular = COMPETITORS.filter(
    c => POPULAR_COMPETITORS.includes(c.id) && !selectedIds.has(c.id)
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const add = (competitor: Competitor) => {
    if (!selectedIds.has(competitor.id)) {
      onChange([...selected, competitor]);
    }
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  const addCustom = () => {
    const name = query.trim();
    if (!name) return;
    const customId = `custom-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    add({ id: customId, name, isCustom: true });
  };

  const remove = (id: string) => {
    onChange(selected.filter(c => c.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // If there's exactly one match, add it; otherwise treat as custom
      if (filtered.length === 1) {
        add({ id: filtered[0].id, name: filtered[0].name, isCustom: false });
      } else if (query.trim()) {
        addCustom();
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const queryMatchesExact = COMPETITORS.some(
    c => c.name.toLowerCase() === query.toLowerCase()
  );

  return (
    <div ref={wrapperRef} className="space-y-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(c => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-100 rounded-full text-xs font-medium"
            >
              {c.isCustom && <span className="text-red-400 text-xs">*</span>}
              {c.name}
              <button
                type="button"
                onClick={() => remove(c.id)}
                className="text-red-400 hover:text-red-600 transition-colors ml-0.5"
                aria-label={`Remove ${c.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search or type a competitor name…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Dropdown */}
        {open && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {/* Filtered matches */}
            {filtered.length > 0 && (
              <div>
                {filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => add({ id: c.id, name: c.name, isCustom: false })}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between"
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-gray-400 capitalize">{c.category}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Custom entry option */}
            {query.trim() && !queryMatchesExact && (
              <button
                type="button"
                onClick={addCustom}
                className="w-full text-left px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center space-x-2 border-t border-gray-100"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add "<span className="font-medium">{query.trim()}</span>" as custom competitor</span>
              </button>
            )}

            {/* Empty state */}
            {filtered.length === 0 && !query.trim() && (
              <div className="px-4 py-3 text-xs text-gray-400">
                Type to search, or press Enter to add a custom competitor
              </div>
            )}

            {filtered.length === 0 && query.trim() && queryMatchesExact && (
              <div className="px-4 py-3 text-xs text-gray-400">No more matches</div>
            )}
          </div>
        )}
      </div>

      {/* Popular quick-add — shown when nothing is selected and no query */}
      {selected.length === 0 && !query && (
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Common competitors:</p>
          <div className="flex flex-wrap gap-1.5">
            {popular.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => add({ id: c.id, name: c.name, isCustom: false })}
                className="px-2.5 py-1 border border-gray-200 text-gray-600 text-xs rounded-full hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                + {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-400">
        Press Enter to add · Custom entries marked with *
      </p>
    </div>
  );
};

// ─── DealFormProductDetails ───────────────────────────────────────────────────

interface DealFormProductDetailsProps {
  formData: any;
  onChange: (field: string, value: any) => void;
}

export const DealFormProductDetails: React.FC<DealFormProductDetailsProps> = ({
  formData,
  onChange,
}) => {
  const products = ['Basic Plan', 'Growth Plan', 'Enterprise Plan', 'Custom Solution', 'Add-on Module'];
  const contractTerms = ['Monthly', 'Quarterly', 'Annual', 'Multi-year'];
  const paymentTerms = ['Due on Receipt', 'Net 15', 'Net 30', 'Net 60', 'Custom'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6 pb-3 border-b border-gray-100">
        <div className="p-2 bg-amber-50 rounded-lg">
          <Package className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Product & Contract</h2>
          <p className="text-xs text-gray-500">What you're selling, on what terms, and who you're up against</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product/Package:</label>
          <select
            value={formData.product}
            onChange={(e) => onChange('product', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select product...</option>
            {products.map((product) => (
              <option key={product} value={product}>{product}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contract Term:</label>
          <select
            value={formData.contractTerm}
            onChange={(e) => onChange('contractTerm', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select term...</option>
            {contractTerms.map((term) => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms:</label>
          <select
            value={formData.paymentTerms}
            onChange={(e) => onChange('paymentTerms', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select payment terms...</option>
            {paymentTerms.map((term) => (
              <option key={term} value={term}>{term}</option>
            ))}
          </select>
        </div>

        {/* Competing Against */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Swords className="h-4 w-4 text-gray-500" />
            <label className="block text-sm font-medium text-gray-700">
              Competing Against
              <span className="ml-1 text-xs text-gray-400 font-normal">(optional)</span>
            </label>
          </div>
          <CompetitorMultiSelect
            selected={formData.competitors ?? []}
            onChange={(competitors) => onChange('competitors', competitors)}
          />
          <p className="mt-2 text-xs text-gray-400">
            Used for win/loss analysis and competitive reporting.
          </p>
        </div>
      </div>
    </div>
  );
};
