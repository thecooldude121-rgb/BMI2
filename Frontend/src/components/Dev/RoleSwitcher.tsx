
import { useState } from 'react';
import { useCurrentUser } from '../../contexts/CurrentUserContext';
import type { Role } from '../../utils/permissions';

/**
 * `sales` is listed FIRST because it is the role most real users actually hold —
 * the backend issues admin, manager and sales, and live workspaces are mostly
 * sales. Without it here a developer could not simulate the common case at all.
 *
 * `sdr` and `senior_sdr` remain because the permission model still defines those
 * tiers; they have no backend equivalent today, so they simulate a shape the
 * product may grow into rather than a user who exists.
 */
const ROLES: Array<{ role: Role; label: string; activeCls: string }> = [
  { role: 'sales',      label: 'Sales',   activeCls: 'bg-slate-600 text-white'   },
  { role: 'sdr',        label: 'SDR',     activeCls: 'bg-gray-600 text-white'    },
  { role: 'senior_sdr', label: 'Sr. SDR', activeCls: 'bg-brand-600 text-white'   },
  { role: 'manager',    label: 'Manager', activeCls: 'bg-purple-600 text-white'  },
  { role: 'admin',      label: 'Admin',   activeCls: 'bg-green-600 text-white'   },
];

const STORAGE_KEY = 'dev:roleSwitcherOpen';

/**
 * Dev-only role switcher. Rendered from App.tsx behind `import.meta.env.DEV`, so
 * Vite strips it from production builds entirely.
 *
 * Collapsed by default, and deliberately so. This sits at bottom-left, which is
 * on top of the Sidebar, and when it rendered its full panel unconditionally it
 * covered the last nav items ("Integrations", "Leaderboard") and swallowed clicks
 * meant for them — a dev widget quietly degrading the project's own "verify
 * through the same entry point a real user uses" standard, because the entry point
 * was unreachable. Two rules keep that from coming back:
 *
 *   1. The wrapper is `pointer-events-none`; only the badge and the buttons opt
 *      back in. Padding and gaps can never eat a click aimed at the nav beneath.
 *   2. Collapsed is the default state, so the resting footprint is one small pill
 *      below the nav list rather than a 130px panel across it.
 */
export default function RoleSwitcher() {
  const { currentUser, setRole } = useCurrentUser();
  const current = ROLES.find(r => r.role === currentUser.role);

  // Persisted so switching roles repeatedly does not mean re-opening on every
  // hot reload. Guarded: a private window or blocked site data throws on access.
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const toggle = () => {
    setOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* non-fatal: the widget just will not remember its state */
      }
      return next;
    });
  };

  return (
    <div className="fixed bottom-4 left-4 z-[200] flex flex-col items-start gap-1.5 select-none pointer-events-none">
      {open && (
        <div className="pointer-events-auto bg-white border border-gray-200 rounded-xl shadow-xl px-3 py-2.5 flex flex-col gap-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 px-0.5">
            Switch role
          </p>
          {ROLES.map(({ role, label, activeCls }) => (
            <button
              key={role}
              onClick={() => setRole(role)}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                currentUser.role === role
                  ? activeCls
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  currentUser.role === role ? 'bg-white opacity-80' : activeCls.split(' ')[0]
                }`}
              />
              {label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={`Developer role switcher — current role ${current?.label ?? currentUser.role}. ${
          open ? 'Collapse' : 'Expand'
        }`}
        title="Dev only — switch the simulated role"
        className="pointer-events-auto bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        DEV: {current?.label ?? currentUser.role} {open ? '▾' : '▸'}
      </button>
    </div>
  );
}
