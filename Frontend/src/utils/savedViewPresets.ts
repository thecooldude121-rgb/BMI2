// savedViewPresets.ts
// System preset views for the Leads module.
// Presets live here as frontend constants — they are never stored in the DB
// because several of them (Overdue, Duplicate Risk) require runtime computation
// that can't be expressed as a static filter blob.
// System presets are identified by ids prefixed with 'preset_'.

export interface PresetSetters {
  setFilterStatus:  (v: string) => void;
  setFilterSource:  (v: string) => void;
  setFilterScore:   (v: string) => void;
  setSearchQuery:   (v: string) => void;
  setSortBy:        (v: string) => void;
  setViewMode:      (v: string) => void;
  setActiveInsight: (v: string | null) => void;
  resetFilters:     () => void;
}

export interface PresetView {
  id:          string;
  name:        string;
  icon:        string;
  description: string;
  is_system:   true;
  applyFn:     (setters: PresetSetters) => void;
}

export const SYSTEM_PRESETS: PresetView[] = [
  {
    id:          'preset_all_leads',
    name:        'All Leads',
    icon:        'users',
    description: 'Every lead in the system',
    is_system:   true,
    applyFn: (s) => {
      s.resetFilters();
      s.setSearchQuery('');
      s.setSortBy('score_high_low');
      s.setViewMode('list');
      s.setActiveInsight(null);
    },
  },
  {
    id:          'preset_my_leads',
    name:        'My Leads',
    icon:        'user',
    description: 'Leads assigned to you',
    is_system:   true,
    applyFn: (s) => {
      // TODO: replace setFilterSource stub with assigned_to = currentUser.id
      // once auth is implemented and currentUser.id is available in context.
      // This preset will not filter meaningfully until then.
      s.resetFilters();
      s.setFilterSource('Manual');
      s.setSearchQuery('');
      s.setActiveInsight(null);
    },
  },
  {
    id:          'preset_hot_leads',
    name:        'Hot Leads',
    icon:        'flame',
    description: 'Leads with score 80 or above',
    is_system:   true,
    applyFn: (s) => {
      s.resetFilters();
      s.setFilterScore('80-100');
      s.setSortBy('score_high_low');
      s.setSearchQuery('');
      s.setActiveInsight(null);
    },
  },
  {
    id:          'preset_overdue',
    name:        'Overdue Follow-ups',
    icon:        'clock',
    description: 'Leads past their follow-up date',
    is_system:   true,
    applyFn: (s) => {
      s.resetFilters();
      s.setSearchQuery('');
      s.setActiveInsight('overdue');
    },
  },
  {
    id:          'preset_duplicate_risk',
    name:        'Duplicate Risk',
    icon:        'copy',
    description: 'Leads sharing an email address',
    is_system:   true,
    applyFn: (s) => {
      s.resetFilters();
      s.setSearchQuery('');
      s.setActiveInsight('duplicateRisk');
    },
  },
  {
    id:          'preset_ready_to_convert',
    name:        'Ready to Convert',
    icon:        'trending-up',
    description: 'Qualified leads ready for conversion',
    is_system:   true,
    applyFn: (s) => {
      s.resetFilters();
      s.setFilterStatus('qualified');
      // TODO: replace with a ">= 60" combined score filter once that mode
      // is implemented. '60-79' is the closest single-band approximation —
      // qualified leads with score >= 80 will still appear because statusFilter
      // is applied independently and score='60-79' only excludes leads with
      // score < 60 or >= 80 that are NOT qualified.
      // For now set score to 'all' so no qualified leads are excluded.
      s.setFilterScore('all');
      s.setSearchQuery('');
      s.setActiveInsight(null);
    },
  },
];
