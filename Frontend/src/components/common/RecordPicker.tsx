import React, { useEffect, useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { inputClass } from '../ui/Field';
import { searchRecords, RECORD_KIND_LABEL, PICKER_PAGE, type RecordKind, type RecordOption } from '../../utils/recordSearch';

/**
 * Pick one CRM record by searching the server — slice 6 (Group A item 4).
 *
 * Layout from the Figma task panel (69:16477): record-type buttons ("Related
 * To": Contact / Account / Deal / Lead), then a "Record picker" box. Results
 * come from the list endpoints as you type (250 ms debounce), the first
 * PICKER_PAGE matches with the server's TOTAL — "Showing 10 of 4,312 — keep
 * typing to narrow" — so no record is out of reach the way record #201 was
 * when pickers loaded 200 and filtered in the browser. A failed search says so;
 * it is never shown as "no matches".
 *
 * An ARIA combobox: the input owns a listbox, ↑/↓ move, Enter picks, Esc closes.
 */
export interface RecordPickerProps {
  kinds: RecordKind[];
  value: RecordOption | null;
  onChange: (value: RecordOption | null) => void;
  /** Accessible name for the search box. */
  label?: string;
  /** The record type to start on when nothing is picked. */
  defaultKind?: RecordKind;
  disabled?: boolean;
}

export const RecordPicker: React.FC<RecordPickerProps> = ({ kinds, value, onChange, label = 'Search records', defaultKind, disabled }) => {
  const [kind, setKind] = useState<RecordKind>(value?.kind ?? defaultKind ?? kinds[0]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [result, setResult] = useState<{ options: RecordOption[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listId = useId();
  const seq = useRef(0);

  useEffect(() => { if (value) setKind(value.kind); }, [value]);

  useEffect(() => {
    if (!open || disabled) return;
    const mine = ++seq.current;
    setLoading(true);
    const t = setTimeout(() => {
      searchRecords(kind, query)
        .then(r => { if (mine === seq.current) { setResult(r); setError(null); setActive(0); } })
        .catch(e => { if (mine === seq.current) { setResult(null); setError(e?.message ?? 'The search failed'); } })
        .finally(() => { if (mine === seq.current) setLoading(false); });
    }, 250);
    return () => clearTimeout(t);
  }, [kind, query, open, disabled]);

  const pick = (o: RecordOption) => { onChange(o); setOpen(false); setQuery(''); };
  const options = result?.options ?? [];
  // Never fewer than the rows on screen: a reply without a total must not read "no matches".
  const total = result ? Math.max(result.total, options.length) : 0;

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive(a => Math.min(a + 1, Math.max(0, options.length - 1))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { if (open && options[active]) { e.preventDefault(); pick(options[active]); } }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div className="space-y-2">
      {kinds.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Record type">
          {kinds.map(k => (
            <button
              key={k} type="button" role="radio" aria-checked={kind === k} disabled={disabled}
              onClick={() => { if (k !== kind) { setKind(k); setResult(null); if (value && value.kind !== k) onChange(null); } }}
              className={`h-7 rounded-full border px-3 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                kind === k ? 'border-brand-600 bg-brand-100 text-brand-700' : 'border-line bg-surface-panel text-ink hover:bg-surface-sunken'
              }`}
            >
              {RECORD_KIND_LABEL[k]}
            </button>
          ))}
        </div>
      )}

      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-ctrl border border-line bg-surface-subtle px-2.5 py-2" data-testid="record-picker-value">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{value.label}</p>
            <p className="truncate text-xs text-ink-muted">{RECORD_KIND_LABEL[value.kind]}{value.detail ? ` · ${value.detail}` : ''}</p>
          </div>
          {!disabled && (
            <button type="button" onClick={() => onChange(null)} aria-label={`Clear ${value.label}`}
              className="rounded-ctrl p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-muted" aria-hidden="true" />
          <input
            role="combobox" aria-label={label} aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
            aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
            className={`${inputClass()} pl-8`} disabled={disabled}
            placeholder={`Search ${RECORD_KIND_LABEL[kind].toLowerCase()}s…`}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={onKey}
          />
          {open && (
            <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-card border border-line bg-surface-panel shadow-lg">
              <ul id={listId} role="listbox" aria-label={`${RECORD_KIND_LABEL[kind]} results`} className="max-h-64 overflow-y-auto">
                {options.map((o, i) => (
                  <li key={o.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}
                    onMouseDown={e => { e.preventDefault(); pick(o); }} onMouseEnter={() => setActive(i)}
                    className={`cursor-pointer px-3 py-2 ${i === active ? 'bg-brand-50' : ''}`}>
                    <p className="truncate text-sm text-ink">{o.label}</p>
                    {o.detail && <p className="truncate text-xs text-ink-muted">{o.detail}</p>}
                  </li>
                ))}
              </ul>
              <p className="border-t border-line px-3 py-1.5 text-xs text-ink-muted" role="status" data-testid="record-picker-status">
                {loading ? 'Searching…'
                  : error ? `The search failed — ${error}`
                  : !result ? ''
                  : total === 0 ? (query.trim() ? `No ${RECORD_KIND_LABEL[kind].toLowerCase()} matches “${query.trim()}”.` : `No ${RECORD_KIND_LABEL[kind].toLowerCase()}s yet.`)
                  : total > options.length ? `Showing ${options.length} of ${total.toLocaleString()} — keep typing to narrow.`
                  : `${total.toLocaleString()} ${total === 1 ? 'match' : 'matches'}.`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { PICKER_PAGE };
export default RecordPicker;
