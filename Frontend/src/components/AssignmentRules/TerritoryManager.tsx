import React, { useState, useEffect } from 'react';
import type { TerritoryDefinition } from '../../utils/assignmentRules/types';
import { getTerritories, upsertTerritory, deleteTerritory, resetTerritoriesToDefaults } from '../../utils/assignmentRules/territoryStore';

function uid() { return Math.random().toString(36).slice(2, 11); }

function EditModal({ territory, onSave, onClose }: {
  territory: TerritoryDefinition;
  onSave: (t: TerritoryDefinition) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(territory.name);
  const [countriesText, setCountriesText] = useState(territory.countries.join(', '));
  const [citiesText, setCitiesText] = useState(territory.cities.join(', '));

  function splitList(s: string): string[] {
    return s.split(',').map(x => x.trim()).filter(Boolean);
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ ...territory, name: name.trim(), countries: splitList(countriesText), cities: splitList(citiesText) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {territory.name ? `Edit Territory: ${territory.name}` : 'New Territory'}
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Territory Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. APAC, EMEA, North America"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Countries (comma-separated)</label>
          <textarea
            value={countriesText}
            onChange={e => setCountriesText(e.target.value)}
            rows={3}
            placeholder="India, Singapore, Japan, Australia"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cities (comma-separated, optional)</label>
          <input
            value={citiesText}
            onChange={e => setCitiesText(e.target.value)}
            placeholder="Mumbai, Singapore City"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TerritoryManager() {
  const [territories, setTerritories] = useState<TerritoryDefinition[]>([]);
  const [editing, setEditing] = useState<TerritoryDefinition | null>(null);

  function reload() { setTerritories(getTerritories()); }
  useEffect(reload, []);

  function handleSave(t: TerritoryDefinition) {
    upsertTerritory(t);
    reload();
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this territory? Rules using it will no longer match.')) return;
    deleteTerritory(id);
    reload();
  }

  function handleReset() {
    if (!confirm('Reset territories to defaults? All custom territories will be lost.')) return;
    resetTerritoriesToDefaults();
    reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Define named regions that can be referenced in assignment rule conditions.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={() => setEditing({ id: uid(), name: '', countries: [], cities: [] })}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Territory
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {territories.map(t => (
          <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm">{t.name}</h4>
                {t.countries.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {t.countries.join(' · ')}
                  </p>
                )}
                {t.cities.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">Cities: {t.cities.join(', ')}</p>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => setEditing(t)}
                  className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditModal territory={editing} onSave={handleSave} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
