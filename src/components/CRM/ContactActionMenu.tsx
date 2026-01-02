import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, UserPlus, Briefcase, Tag, Archive } from 'lucide-react';

interface ContactActionMenuProps {
  contactId: string;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onAddToDeal: () => void;
  onAddTag: () => void;
  onMarkInactive: () => void;
}

const ContactActionMenu: React.FC<ContactActionMenuProps> = ({
  contactId,
  onEdit,
  onDelete,
  onAssign,
  onAddToDeal,
  onAddTag,
  onMarkInactive
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical className="h-5 w-5 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
          <button
            onClick={() => handleAction(onEdit)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => handleAction(onAssign)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Assign to...</span>
          </button>

          <button
            onClick={() => handleAction(onAddToDeal)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <Briefcase className="h-4 w-4" />
            <span>Add to deal</span>
          </button>

          <button
            onClick={() => handleAction(onAddTag)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <Tag className="h-4 w-4" />
            <span>Add tag</span>
          </button>

          <button
            onClick={() => handleAction(onMarkInactive)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <Archive className="h-4 w-4" />
            <span>Mark as inactive</span>
          </button>

          <div className="border-t border-gray-200 my-1"></div>

          <button
            onClick={() => handleAction(onDelete)}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactActionMenu;
