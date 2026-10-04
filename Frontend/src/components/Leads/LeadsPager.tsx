import React from 'react';
import { Button } from '../ui/Button';

/**
 * Numbered pages under the Leads list (Figma 61:3: "Showing 1–25 of 184 leads ·
 * 25 rows per page · Previous 1 Next"; decided 2026-10-05). Replaces "Load
 * More", which accumulated rows. `total` is the SERVER's count over every
 * matching lead (step 5 slice A), never the length of what is on screen.
 */
export interface LeadsPagerProps {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  /** Rows actually on this page (the last page is usually short). */
  shown: number;
  loading?: boolean;
  onPage: (page: number) => void;
}

/** 1 … p-1 p p+1 … last, with gaps marked, never more than 7 slots. */
export function pageWindow(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const out: (number | 'gap')[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pageCount - 1, page + 1);
  if (from > 2) out.push('gap');
  for (let p = from; p <= to; p++) out.push(p);
  if (to < pageCount - 1) out.push('gap');
  out.push(pageCount);
  return out;
}

const LeadsPager: React.FC<LeadsPagerProps> = ({ page, pageCount, total, pageSize, shown, loading, onPage }) => {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = total === 0 ? 0 : first + shown - 1;
  return (
    <nav aria-label="Leads pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-3">
      <p className="text-xs text-ink-muted" data-testid="leads-showing">
        Showing {first.toLocaleString()}–{last.toLocaleString()} of {total.toLocaleString()} leads · {pageSize} rows per page
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" disabled={page <= 1 || loading} onClick={() => onPage(page - 1)}>Previous</Button>
          {pageWindow(page, pageCount).map((p, i) => p === 'gap'
            ? <span key={`gap-${i}`} className="px-1 text-xs text-ink-muted" aria-hidden="true">…</span>
            : (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                disabled={loading}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                className={`h-7 min-w-[28px] rounded-full px-2 text-xs font-semibold transition-colors ${
                  p === page ? 'bg-brand-50 text-brand-600' : 'text-ink hover:bg-black/5'
                }`}
              >
                {p}
              </button>
            ))}
          <Button variant="secondary" disabled={page >= pageCount || loading} onClick={() => onPage(page + 1)}>Next</Button>
        </div>
      )}
    </nav>
  );
};

export default LeadsPager;
