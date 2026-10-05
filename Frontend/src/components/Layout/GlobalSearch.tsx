import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Badge from '../ui/Badge';
import { searchWorkspace, SEARCH_MIN_LENGTH } from '../../utils/searchApi';
import type { SearchResults } from '../../utils/searchApi';

/**
 * The top bar's search (Figma "Global search", 75:39854) — REAL as of Group B
 * item 10 (2026-10-05). It was a disabled box reading "coming soon".
 *
 * v1 scope (approved): leads, contacts, accounts and deals, via GET /search,
 * which scopes every query to the caller's workspace. Meetings and tasks are
 * deliberately not searched yet.
 *
 * Behaves as an ARIA combobox: Ctrl/⌘+K focuses it, arrows move through the
 * results, Enter opens one, Escape closes. A failed search says so — it never
 * renders "No matches" for a request that did not succeed.
 */

type Item = { key: string; group: string; label: string; detail: string; href: string };

const GROUPS: { id: keyof Omit<SearchResults, 'q'>; label: string }[] = [
  { id: 'leads', label: 'Leads' }, { id: 'contacts', label: 'Contacts' },
  { id: 'accounts', label: 'Accounts' }, { id: 'deals', label: 'Deals' },
];

const person = (f: string | null, l: string | null, fallback: string | null) =>
  [f, l].filter(Boolean).join(' ') || fallback || '—';

export function toItems(r: SearchResults): Item[] {
  return [
    ...r.leads.rows.map(x => ({ key: `lead-${x.id}`, group: 'Leads', label: person(x.first_name, x.last_name, x.email),
      detail: [x.company, x.email].filter(Boolean).join(' · '), href: `/crm/leads/${x.id}` })),
    ...r.contacts.rows.map(x => ({ key: `contact-${x.id}`, group: 'Contacts', label: person(x.first_name, x.last_name, x.email),
      detail: [x.company, x.email].filter(Boolean).join(' · '), href: `/crm/contacts/${x.id}` })),
    ...r.accounts.rows.map(x => ({ key: `account-${x.id}`, group: 'Accounts', label: x.name,
      detail: [x.industry, x.domain].filter(Boolean).join(' · '), href: `/crm/accounts/${x.id}` })),
    ...r.deals.rows.map(x => ({ key: `deal-${x.id}`, group: 'Deals', label: x.name || '—',
      detail: [x.company_name, x.stage].filter(Boolean).join(' · '), href: `/crm/deals/${x.id}` })),
  ];
}

const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  // Ctrl/⌘+K focuses the box from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inputRef.current?.focus(); setOpen(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // Debounced, and a newer keystroke cancels the older request.
  useEffect(() => {
    const term = q.trim();
    if (term.length < SEARCH_MIN_LENGTH) { setState('idle'); setResults(null); return; }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      setState('loading');
      searchWorkspace(term, ctrl.signal)
        .then(r => { setResults(r); setState('ok'); setActive(0); })
        .catch(e => { if (ctrl.signal.aborted) return; setError(e instanceof Error ? e.message : 'Search failed.'); setState('error'); });
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const items = useMemo(() => (results ? toItems(results) : []), [results]);
  const anyMore = results ? GROUPS.some(g => results[g.id].has_more) : false;

  const go = (item: Item | undefined) => {
    if (!item) return;
    setOpen(false); setQ(''); inputRef.current?.blur();
    navigate(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); return; }
    if (!items.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(a + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(items[active]); }
  };

  const showPanel = open && q.trim().length > 0;

  return (
    <div ref={boxRef} className="relative hidden lg:block">
      <div className="flex h-9 w-[320px] items-center gap-2 rounded-card border border-line bg-gray-50 px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/30">
        <Search className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Search leads, contacts, accounts and deals"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && items[active] ? `${listId}-${items[active].key}` : undefined}
          placeholder="Search deals, accounts, people…"
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
        <Badge tone="neutral" className="shrink-0" aria-hidden="true">Ctrl K</Badge>
      </div>

      {showPanel && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-card border border-line bg-surface-panel shadow-xl">
          {q.trim().length < SEARCH_MIN_LENGTH && (
            <p className="px-4 py-3 text-xs text-ink-muted">Type at least {SEARCH_MIN_LENGTH} characters.</p>
          )}
          {state === 'loading' && <p className="px-4 py-3 text-xs text-ink-muted" role="status">Searching…</p>}
          {state === 'error' && (
            <p className="px-4 py-3 text-xs text-danger-700" role="alert">Search failed: {error} Nothing was searched.</p>
          )}
          {state === 'ok' && items.length === 0 && (
            <p className="px-4 py-3 text-xs text-ink-muted">No leads, contacts, accounts or deals match “{results?.q}”.</p>
          )}
          {state === 'ok' && items.length > 0 && (
            <ul id={listId} role="listbox" aria-label="Search results" className="max-h-[420px] overflow-y-auto py-1">
              {GROUPS.map(g => {
                const groupItems = items.filter(i => i.group === g.label);
                if (!groupItems.length) return null;
                return (
                  <li key={g.id} role="presentation">
                    <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase text-ink-secondary">{g.label}</p>
                    <ul role="group" aria-label={g.label}>
                      {groupItems.map(item => {
                        const idx = items.indexOf(item);
                        return (
                          <li
                            key={item.key}
                            id={`${listId}-${item.key}`}
                            role="option"
                            aria-selected={idx === active}
                            onMouseEnter={() => setActive(idx)}
                            onMouseDown={e => { e.preventDefault(); go(item); }}
                            className={`cursor-pointer px-4 py-2 ${idx === active ? 'bg-brand-50' : ''}`}
                          >
                            <p className="truncate text-sm font-medium text-ink">{item.label}</p>
                            {item.detail && <p className="truncate text-xs text-ink-muted">{item.detail}</p>}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
              {anyMore && <li role="presentation" className="px-4 py-2 text-xs text-ink-muted">More matches exist — add more of the name to narrow them.</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
