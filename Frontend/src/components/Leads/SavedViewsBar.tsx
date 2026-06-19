import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import {
  Users, User, Flame, Clock, Copy, TrendingUp,
  List, MoreHorizontal, Plus, Pin, Edit2, Trash2, ChevronDown,
} from 'lucide-react';
import type { LeadView } from '../../types/lead';
import type { PresetView } from '../../utils/savedViewPresets';
import { SYSTEM_PRESETS } from '../../utils/savedViewPresets';

// ── Icon map for preset icons ─────────────────────────────────────────────────

const PRESET_ICONS: Record<string, React.ReactNode> = {
  users:       <Users        className="h-3.5 w-3.5" />,
  user:        <User         className="h-3.5 w-3.5" />,
  flame:       <Flame        className="h-3.5 w-3.5" />,
  clock:       <Clock        className="h-3.5 w-3.5" />,
  copy:        <Copy         className="h-3.5 w-3.5" />,
  'trending-up': <TrendingUp className="h-3.5 w-3.5" />,
  list:        <List         className="h-3.5 w-3.5" />,
};

function PresetIcon({ name }: { name: string }) {
  return <>{PRESET_ICONS[name] ?? <List className="h-3.5 w-3.5" />}</>;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface SavedViewsBarProps {
  savedViews:      LeadView[];
  activeViewId:    string | null;
  onSelectView:    (id: string) => void;
  onNewView:       () => void;
  onEditView:      (id: string) => void;
  onManageViews:   () => void;
  onRenameView:    (id: string, name: string) => Promise<void>;
  onDeleteView:    (id: string) => Promise<void>;
  onPinView:       (id: string) => Promise<void>;
  onReorderView:   (draggedId: string, newOrder: number) => Promise<void>;
}

// ── Tab button: system preset ─────────────────────────────────────────────────

const PresetTab: React.FC<{
  preset: PresetView;
  isActive: boolean;
  onClick: () => void;
}> = ({ preset, isActive, onClick }) => (
  <button
    onClick={onClick}
    title={preset.description}
    className={`
      flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium
      whitespace-nowrap transition-colors flex-shrink-0
      ${isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
    `}
  >
    <PresetIcon name={preset.icon} />
    <span>{preset.name}</span>
  </button>
);

// ── Tab button: user view ─────────────────────────────────────────────────────

const UserViewTab: React.FC<{
  view: LeadView;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
  onPin: () => void;
  onDelete: () => void;
  dragHandleProps?: any;
}> = ({ view, isActive, onClick, onEdit, onPin, onDelete, dragHandleProps }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <div className="relative flex-shrink-0 group" ref={menuRef}>
      <button
        onClick={onClick}
        className={`
          flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium
          whitespace-nowrap transition-colors
          ${isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
        `}
        {...(dragHandleProps || {})}
      >
        {view.is_pinned && <Pin className="h-3 w-3 flex-shrink-0" />}
        <span>{view.name}</span>
      </button>

      {/* Context menu trigger (⋯) */}
      <button
        onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev); }}
        className={`
          absolute -top-1 -right-1 p-0.5 rounded-full bg-white border border-gray-200 shadow-sm
          opacity-0 group-hover:opacity-100 transition-opacity z-10
          ${menuOpen ? 'opacity-100' : ''}
        `}
      >
        <MoreHorizontal className="h-3 w-3 text-gray-500" />
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-50">
          <button
            onClick={() => { onEdit(); setMenuOpen(false); }}
            className="flex items-center space-x-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit view</span>
          </button>
          <button
            onClick={() => { onPin(); setMenuOpen(false); }}
            className="flex items-center space-x-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-700"
          >
            <Pin className="h-3.5 w-3.5" />
            <span>{view.is_pinned ? 'Unpin' : 'Pin'}</span>
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={() => { onDelete(); setMenuOpen(false); }}
            className="flex items-center space-x-2 w-full px-3 py-1.5 text-xs hover:bg-red-50 text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main bar ─────────────────────────────────────────────────────────────────

const SavedViewsBar: React.FC<SavedViewsBarProps> = ({
  savedViews,
  activeViewId,
  onSelectView,
  onNewView,
  onEditView,
  onManageViews,
  onRenameView,
  onDeleteView,
  onPinView,
  onReorderView,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflowIds, setOverflowIds] = useState<Set<string>>(new Set());
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // ── ResizeObserver: detect tabs that overflow the bar ────────────────────

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const measure = () => {
      const containerRight = container.getBoundingClientRect().right;
      // Reserve ~110px for the "+ New View" / "More" controls on the right
      const usableRight = containerRight - 110;
      const newOverflow = new Set<string>();
      for (const child of Array.from(container.children) as HTMLElement[]) {
        const id = child.dataset.viewId;
        if (!id) continue;
        if (child.getBoundingClientRect().right > usableRight) {
          newOverflow.add(id);
        }
      }
      setOverflowIds(newOverflow);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    measure();
    return () => ro.disconnect();
  }, [savedViews]);

  // ── Close "More" menu on outside click ───────────────────────────────────

  useEffect(() => {
    if (!moreMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [moreMenuOpen]);

  // ── Drag end ─────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    const draggedId = result.draggableId;
    onReorderView(draggedId, result.destination.index);
  }, [onReorderView]);

  const visibleViews   = savedViews.filter(v => !overflowIds.has(v.id));
  const overflowViews  = savedViews.filter(v => overflowIds.has(v.id));
  const hasOverflow    = overflowViews.length > 0;

  return (
    <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-hidden">
      {/* ── Scroll region ── */}
      <div
        ref={scrollRef}
        className="flex items-center space-x-1.5 flex-1 overflow-hidden"
      >
        {/* System presets — non-draggable */}
        {SYSTEM_PRESETS.map(preset => (
          <div key={preset.id} data-view-id={preset.id}>
            <PresetTab
              preset={preset}
              isActive={activeViewId === preset.id}
              onClick={() => onSelectView(preset.id)}
            />
          </div>
        ))}

        {/* Divider (only shown when there are user views) */}
        {savedViews.length > 0 && (
          <div className="h-5 w-px bg-gray-300 flex-shrink-0 mx-1" />
        )}

        {/* User views — draggable */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="user-views" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex items-center space-x-1.5"
              >
                {visibleViews.map((view, index) => (
                  <Draggable key={view.id} draggableId={view.id} index={index}>
                    {(dragProvided) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        data-view-id={view.id}
                      >
                        <UserViewTab
                          view={view}
                          isActive={activeViewId === view.id}
                          onClick={() => onSelectView(view.id)}
                          onEdit={() => onEditView(view.id)}
                          onPin={() => onPinView(view.id)}
                          onDelete={() => onDeleteView(view.id)}
                          dragHandleProps={dragProvided.dragHandleProps}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* ── Right controls ── */}
      <div className="flex items-center space-x-1 flex-shrink-0">
        {/* Overflow "More ▾" menu */}
        {hasOverflow && (
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setMoreMenuOpen(prev => !prev)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              <span>More</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {moreMenuOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50">
                {overflowViews.map(view => (
                  <button
                    key={view.id}
                    onClick={() => { onSelectView(view.id); setMoreMenuOpen(false); }}
                    className={`
                      flex items-center w-full px-3 py-1.5 text-xs text-left
                      ${activeViewId === view.id ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}
                    `}
                  >
                    {view.is_pinned && <Pin className="h-3 w-3 mr-1.5 flex-shrink-0 text-blue-400" />}
                    <span className="truncate">{view.name}</span>
                  </button>
                ))}
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { onManageViews(); setMoreMenuOpen(false); }}
                  className="flex items-center w-full px-3 py-1.5 text-xs hover:bg-gray-50 text-gray-500"
                >
                  Manage views…
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manage views (gear-style link) — shown when NOT overflowing */}
        {!hasOverflow && savedViews.length > 0 && (
          <button
            onClick={onManageViews}
            className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap"
          >
            Manage
          </button>
        )}

        {/* + New View */}
        <button
          onClick={onNewView}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium text-blue-600 hover:bg-blue-50 whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New view</span>
        </button>
      </div>
    </div>
  );
};

export default SavedViewsBar;
