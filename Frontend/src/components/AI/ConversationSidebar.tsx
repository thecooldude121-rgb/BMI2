import { useState } from 'react';
import { Plus, X, MoreVertical, Trash2, Edit2, Pin, Download } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
  isActive: boolean;
  timeGroup: 'TODAY' | 'YESTERDAY' | 'THIS WEEK' | 'THIS MONTH' | 'OLDER';
}

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation?: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => void;
}

export default function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation
}: ConversationSidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const groupedConversations = conversations.reduce((acc, conv) => {
    if (!acc[conv.timeGroup]) {
      acc[conv.timeGroup] = [];
    }
    acc[conv.timeGroup].push(conv);
    return acc;
  }, {} as Record<string, Conversation[]>);

  const timeGroups: Array<'TODAY' | 'YESTERDAY' | 'THIS WEEK' | 'THIS MONTH' | 'OLDER'> = [
    'TODAY',
    'YESTERDAY',
    'THIS WEEK',
    'THIS MONTH',
    'OLDER'
  ];

  const handleDelete = (id: string) => {
    if (onDeleteConversation) {
      onDeleteConversation(id);
    }
    setDeleteConfirmId(null);
    setContextMenuId(null);
  };

  const handleRename = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setEditingId(id);
      setEditTitle(conv.title);
      setContextMenuId(null);
    }
  };

  const saveRename = (id: string) => {
    if (onRenameConversation && editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 border-r border-gray-200" style={{ width: '250px' }}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-700 mb-3 tracking-wide">CONVERSATIONS</h2>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {timeGroups.map((group) => {
          const groupConversations = groupedConversations[group];
          if (!groupConversations || groupConversations.length === 0) return null;

          return (
            <div key={group} className="py-3">
              <h3 className="px-4 text-xs font-semibold text-gray-600 mb-2 tracking-wide">
                {group}
              </h3>
              <div className="space-y-1 px-2">
                {groupConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="relative"
                    onMouseEnter={() => setHoveredId(conv.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuId(contextMenuId === conv.id ? null : conv.id);
                    }}
                  >
                    {editingId === conv.id ? (
                      <div className="px-3 py-2.5">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') saveRename(conv.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onBlur={() => saveRename(conv.id)}
                          className="w-full px-2 py-1 text-sm border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => onSelectConversation(conv.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                          activeConversationId === conv.id
                            ? 'bg-purple-100 border border-purple-300'
                            : 'hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-sm mt-0.5">
                            {conv.isActive ? '🟣' : '⚪'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 line-clamp-2 mb-0.5 leading-snug">
                              {conv.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {conv.timestamp}
                            </p>
                          </div>
                          {hoveredId === conv.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(conv.id);
                              }}
                              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </button>
                    )}

                    {contextMenuId === conv.id && (
                      <div className="absolute right-2 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <button
                          onClick={() => handleRename(conv.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Edit2 className="w-4 h-4" />
                          Rename
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(conv.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                        <button
                          onClick={() => setContextMenuId(null)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Pin className="w-4 h-4" />
                          Pin to top
                        </button>
                        <button
                          onClick={() => setContextMenuId(null)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Download className="w-4 h-4" />
                          Export
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {conversations.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            No conversations yet. Start a new chat to get started!
          </div>
        )}
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Conversation?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This conversation will be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
