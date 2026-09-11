
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
 * ANCHORED BOTTOM-RIGHT, and that is the point of this note.
 *
 * It used to sit bottom-left, on top of the Sidebar. Two mitigations were added
 * then — `pointer-events-none` on the wrapper so only the badge and buttons take
 * clicks, and collapsed-by-default so the resting footprint is one pill — and
 * both are still here and still correct. Neither was sufficient. `open` is
 * persisted in localStorage, so a developer who expands it once has a panel
 * covering "Integrations" and "Leaderboard" in every session from then on; that
 * is exactly the state the UI/UX audit found it in on a live machine. A widget
 * that cannot be clicked through is still a widget you cannot read the nav
 * through.
 *
 * Bottom-right overlaps no navigation chrome at any breakpoint: the sidebar is
 * on the left, the top bar is at the top, and the mobile drawer opens from the
 * left. Three rules now keep it out of the way:
 *
 *   1. Anchored bottom-RIGHT, away from every nav surface.
 *   2. The wrapper is `pointer-events-none`; only the badge and the buttons opt
 *      back in. Padding and gaps can never eat a click aimed at what is beneath.
 *   3. Collapsed is the default state for a first-time reader.
 *
 * Kept rather than deleted: it is real, working, deliberately-documented
 * scaffolding, already stripped from production builds by `import.meta.env.DEV`
 * at BOTH the render site in App.tsx and inside CurrentUserContext, which
 * refuses to read or write the override outside development. The permission
 * model has four roles the backend cannot currently issue, and this is the only
 * way to exercise them.
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
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col items-end gap-1.5 select-none pointer-events-none">
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
