import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Edit,
  Key,
  Mail,
  Unlock,
  BarChart3,
  AlertTriangle,
  Trash2
} from 'lucide-react';

interface UserActionsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onViewProfile: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onSendWelcomeEmail: () => void;
  onUnlockAccount: () => void;
  onViewActivityLog: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  isAccountLocked: boolean;
}

const UserActionsDropdown: React.FC<UserActionsDropdownProps> = ({
  isOpen,
  onClose,
  buttonRef,
  onViewProfile,
  onEdit,
  onResetPassword,
  onSendWelcomeEmail,
  onUnlockAccount,
  onViewActivityLog,
  onDeactivate,
  onDelete,
  isAccountLocked
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: buttonRect.bottom + 4,
        right: window.innerWidth - buttonRect.right
      });
    }
  }, [isOpen, buttonRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="fixed z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`
      }}
    >
      <div className="py-2">
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          User Actions
        </div>

        <button
          onClick={() => handleAction(onViewProfile)}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3"
        >
          <User className="h-4 w-4 text-gray-500" />
          View Full Profile
        </button>

        <button
          onClick={() => handleAction(onEdit)}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3"
        >
          <Edit className="h-4 w-4 text-gray-500" />
          Edit User
        </button>

        <div className="my-2 border-t border-gray-200"></div>

        <button
          onClick={() => handleAction(onResetPassword)}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3"
        >
          <Key className="h-4 w-4 text-gray-500" />
          Reset Password
        </button>

        <button
          onClick={() => handleAction(onSendWelcomeEmail)}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3"
        >
          <Mail className="h-4 w-4 text-gray-500" />
          Send Welcome Email Again
        </button>

        {isAccountLocked && (
          <button
            onClick={() => handleAction(onUnlockAccount)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3"
          >
            <Unlock className="h-4 w-4 text-gray-500" />
            Unlock Account
          </button>
        )}

        <button
          onClick={() => handleAction(onViewActivityLog)}
          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3"
        >
          <BarChart3 className="h-4 w-4 text-gray-500" />
          View Activity Log
        </button>

        <div className="my-2 border-t border-gray-200"></div>

        <button
          onClick={() => handleAction(onDeactivate)}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
        >
          <AlertTriangle className="h-4 w-4 text-red-500" />
          Deactivate User
        </button>

        <button
          onClick={() => handleAction(onDelete)}
          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
        >
          <Trash2 className="h-4 w-4 text-red-500" />
          Delete User
        </button>
      </div>
    </div>
  );
};

export default UserActionsDropdown;
