import React from 'react';
import { useCurrentUser } from '../../contexts/CurrentUserContext';
import type { Role } from '../../utils/permissions';

const ROLES: Array<{ role: Role; label: string; activeCls: string }> = [
  { role: 'sdr',        label: 'SDR',     activeCls: 'bg-gray-600 text-white'   },
  { role: 'senior_sdr', label: 'Sr. SDR', activeCls: 'bg-blue-600 text-white'   },
  { role: 'manager',    label: 'Manager', activeCls: 'bg-purple-600 text-white'  },
  { role: 'admin',      label: 'Admin',   activeCls: 'bg-green-600 text-white'   },
];

export default function RoleSwitcher() {
  const { currentUser, setRole } = useCurrentUser();
  const current = ROLES.find(r => r.role === currentUser.role);

  return (
    <div className="fixed bottom-4 left-4 z-[200] flex flex-col items-start gap-1.5 select-none pointer-events-auto">
      {/* Badge */}
      <div className="bg-gray-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider">
        DEV: {current?.label ?? currentUser.role}
      </div>

      {/* Role buttons */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xl px-3 py-2.5 flex flex-col gap-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 px-0.5">Switch role</p>
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
    </div>
  );
}
