import type { TerritoryDefinition } from './types';

const STORAGE_KEY = 'bmi_territory_definitions';

const SEED_TERRITORIES: TerritoryDefinition[] = [
  {
    id: 'ter_apac',
    name: 'APAC',
    countries: ['India', 'Singapore', 'Japan', 'Australia', 'South Korea', 'China', 'Thailand', 'Malaysia', 'Indonesia', 'Vietnam', 'Philippines', 'New Zealand'],
    cities: [],
  },
  {
    id: 'ter_emea',
    name: 'EMEA',
    countries: ['United Kingdom', 'Germany', 'France', 'UAE', 'Saudi Arabia', 'South Africa', 'Netherlands', 'Sweden', 'Switzerland', 'Spain', 'Italy', 'Poland', 'Israel'],
    cities: [],
  },
  {
    id: 'ter_na',
    name: 'North America',
    countries: ['United States', 'Canada', 'Mexico'],
    cities: [],
  },
  {
    id: 'ter_latam',
    name: 'LATAM',
    countries: ['Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru', 'Uruguay'],
    cities: [],
  },
];

function load(): TerritoryDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as TerritoryDefinition[];
  } catch { /* ignore */ }
  return SEED_TERRITORIES;
}

function save(territories: TerritoryDefinition[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(territories)); } catch { /* ignore */ }
}

export function getTerritories(): TerritoryDefinition[] {
  return load();
}

export function upsertTerritory(territory: TerritoryDefinition): void {
  const list = load();
  const idx = list.findIndex(t => t.id === territory.id);
  if (idx >= 0) list[idx] = territory;
  else list.push(territory);
  save(list);
}

export function deleteTerritory(id: string): void {
  save(load().filter(t => t.id !== id));
}

export function resetTerritoriesToDefaults(): void {
  save(SEED_TERRITORIES);
}

export function matchTerritory(
  territories: TerritoryDefinition[],
  names: string[],
  country?: string,
  city?: string,
): boolean {
  for (const name of names) {
    const ter = territories.find(t => t.name === name);
    if (!ter) continue;
    if (country && ter.countries.some(c => c.toLowerCase() === country.toLowerCase())) return true;
    if (city && ter.cities.some(c => c.toLowerCase() === city.toLowerCase())) return true;
  }
  return false;
}
