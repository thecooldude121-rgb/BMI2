import React, { useState } from 'react';
import { Zap, ToggleLeft, ToggleRight, Tag, X } from 'lucide-react';
import { TEAM_MEMBERS } from '../../../utils/leadOwnerRouting';
import type { ImportRules, DuplicateAction } from './types';

const STATUSES = [
  { value: 'new',          label: 'New' },
  { value: 'contacted',    label: 'Contacted' },
  { value: 'working',      label: 'Working' },
  { value: 'nurturing',    label: 'Nurturing' },
  { value: 'qualified',    label: 'Qualified' },
  { value: 'unqualified',  label: 'Unqualified' },
] as const;

const DUPLICATE_OPTIONS: { value: DuplicateAction; label: string; description: string }[] = [
  { value: 'skip',         label: 'Skip duplicates',       description: 'Duplicate rows will not be imported' },
  { value: 'merge_review', label: 'Add to merge review',   description: 'Import and tag as "merge-candidate" for later review' },
  { value: 'create_new',   label: 'Create as new lead',    description: 'Import regardless of duplicates' },
];

type Props = {
  rules: ImportRules;
  onRulesChange: (rules: ImportRules) => void;
};

export default function Step4Rules({ rules, onRulesChange }: Props) {
  const [tagInput, setTagInput] = useState('');

  function set<K extends keyof ImportRules>(key: K, value: ImportRules[K]) {
    onRulesChange({ ...rules, [key]: value });
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !rules.tags.includes(tag)) {
      set('tags', [...rules.tags, tag]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    set('tags', rules.tags.filter(t => t !== tag));
  }

  function onTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Import rules</h2>
        <p className="text-sm text-gray-500 mt-1">These settings apply to every imported lead.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Default Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Lead Status</label>
          <select
            value={rules.defaultStatus}
            onChange={e => set('defaultStatus', e.target.value as ImportRules['defaultStatus'])}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">Applied when no status is in the CSV</p>
        </div>

        {/* Default Owner */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign To</label>
          <select
            value={rules.defaultOwnerId}
            onChange={e => set('defaultOwnerId', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Unassigned</option>
            {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>

        {/* Source Override */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Source Override</label>
          <input
            type="text"
            value={rules.sourceOverride}
            onChange={e => set('sourceOverride', e.target.value)}
            placeholder="e.g. Trade Show 2026"
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Overrides the source column for all rows</p>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          <Tag className="h-3.5 w-3.5 inline mr-1 text-gray-400" />
          Tags applied to all imported leads
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {rules.tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-blue-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={onTagKeyDown}
            placeholder="Add tag and press Enter"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addTag}
            disabled={!tagInput.trim()}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium disabled:opacity-40 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Duplicate handling */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">When duplicates are found</label>
        <div className="space-y-2">
          {DUPLICATE_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                rules.duplicateAction === opt.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="duplicateAction"
                value={opt.value}
                checked={rules.duplicateAction === opt.value}
                onChange={() => set('duplicateAction', opt.value)}
                className="mt-0.5 accent-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Enrichment */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Trigger enrichment after import</p>
            <p className="text-xs text-gray-500 mt-0.5">Auto-enrich all imported leads with company and contact data</p>
          </div>
        </div>
        <button
          onClick={() => set('triggerEnrichment', !rules.triggerEnrichment)}
          className="ml-4 focus:outline-none flex-shrink-0"
          aria-pressed={rules.triggerEnrichment}
        >
          {rules.triggerEnrichment
            ? <ToggleRight className="h-7 w-7 text-purple-600" />
            : <ToggleLeft className="h-7 w-7 text-gray-400" />}
        </button>
      </div>
    </div>
  );
}
