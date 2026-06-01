import React from 'react';
import { Highlighter, Copy, Search, MessageSquare, Bookmark } from 'lucide-react';

interface TextSelectionMenuProps {
  position: { x: number; y: number };
  selectedText: string;
  onHighlight: () => void;
  onCopy: () => void;
  onSearch: () => void;
  onAddComment: () => void;
  onCreateBookmark: () => void;
}

const TextSelectionMenu: React.FC<TextSelectionMenuProps> = ({
  position,
  selectedText,
  onHighlight,
  onCopy,
  onSearch,
  onAddComment,
  onCreateBookmark
}) => {
  if (!selectedText) return null;

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%) translateY(-8px)'
      }}
    >
      <button
        onClick={onHighlight}
        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        <Highlighter className="w-4 h-4 text-yellow-600" />
        <span className="text-sm text-gray-700">Highlight</span>
      </button>

      <button
        onClick={onCopy}
        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        <Copy className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-700">Copy</span>
      </button>

      <button
        onClick={onSearch}
        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        <Search className="w-4 h-4 text-blue-600" />
        <span className="text-sm text-gray-700">Search for this phrase</span>
      </button>

      <button
        onClick={onAddComment}
        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        <MessageSquare className="w-4 h-4 text-green-600" />
        <span className="text-sm text-gray-700">Add comment</span>
      </button>

      <button
        onClick={onCreateBookmark}
        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        <Bookmark className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-gray-700">Create bookmark</span>
      </button>
    </div>
  );
};

export default TextSelectionMenu;
