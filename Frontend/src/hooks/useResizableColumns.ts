import { useState, useEffect, useRef, useCallback } from 'react';
import type React from 'react';

const MIN_COL_PX = 60;

export function useResizableColumns(
  storageKey: string,
  defaults: Record<string, number>,
): {
  widths: Record<string, number>;
  startResize: (key: string, e: React.MouseEvent<HTMLElement>) => void;
  resetWidths: () => void;
} {
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;

  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const saved: Record<string, number> = raw ? JSON.parse(raw) : {};
      // Merge: saved values win, but new keys fall back to defaults
      return { ...defaults, ...saved };
    } catch {
      return { ...defaults };
    }
  });

  // When the defaults object gains new keys (e.g. a column is added), initialise them
  const defaultKeys = Object.keys(defaults).sort().join(',');
  useEffect(() => {
    setWidths(prev => {
      const next = { ...prev };
      let changed = false;
      for (const [k, v] of Object.entries(defaultsRef.current)) {
        if (!(k in next)) { next[k] = v; changed = true; }
      }
      return changed ? next : prev;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultKeys]);

  // Persist whenever widths change
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(widths)); } catch {}
  }, [widths, storageKey]);

  const widthsRef = useRef(widths);
  widthsRef.current = widths;

  const startResize = useCallback((key: string, e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = widthsRef.current[key] ?? defaultsRef.current[key] ?? 150;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      const next = Math.max(MIN_COL_PX, startWidth + (ev.clientX - startX));
      setWidths(prev => ({ ...prev, [key]: next }));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const resetWidths = useCallback(() => {
    setWidths({ ...defaultsRef.current });
    try { localStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);

  return { widths, startResize, resetWidths };
}