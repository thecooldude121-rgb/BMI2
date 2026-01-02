import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  BulkActionType,
  BulkActionResult,
  BulkActionOptions,
  BulkActionProgress
} from '../types/bulkActions';

interface BulkActionsContextType {
  selectedIds: Set<string>;
  selectAll: boolean;
  totalCount: number;
  setSelectedIds: (ids: Set<string>) => void;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  setTotalCount: (count: number) => void;
  currentAction: BulkActionResult | null;
  setCurrentAction: (action: BulkActionResult | null) => void;
  undoQueue: Array<{ action: BulkActionResult; undoData: any }>;
  addToUndoQueue: (action: BulkActionResult, undoData: any) => void;
  performUndo: (actionId: string) => Promise<void>;
}

const BulkActionsContext = createContext<BulkActionsContextType | undefined>(undefined);

export const useBulkActions = () => {
  const context = useContext(BulkActionsContext);
  if (!context) {
    throw new Error('useBulkActions must be used within BulkActionsProvider');
  }
  return context;
};

export const BulkActionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentAction, setCurrentAction] = useState<BulkActionResult | null>(null);
  const [undoQueue, setUndoQueue] = useState<Array<{ action: BulkActionResult; undoData: any }>>([]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectAll(prev => !prev);
    if (!selectAll) {
      // If turning on select all, we'll handle this in the component
      // that knows about all IDs
    } else {
      setSelectedIds(new Set());
    }
  }, [selectAll]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectAll(false);
  }, []);

  const addToUndoQueue = useCallback((action: BulkActionResult, undoData: any) => {
    setUndoQueue(prev => [...prev, { action, undoData }]);

    // Auto-remove from queue after 10 seconds
    setTimeout(() => {
      setUndoQueue(current => current.filter(item => item.action.id !== action.id));
    }, 10000);
  }, []);

  const performUndo = useCallback(async (actionId: string) => {
    const item = undoQueue.find(u => u.action.id === actionId);
    if (!item) return;

    // Remove from queue
    setUndoQueue(prev => prev.filter(u => u.action.id !== actionId));

    // Perform undo logic here
    // This would call the appropriate API endpoint to reverse the action
    console.log('Performing undo for action:', actionId, item.undoData);
  }, [undoQueue]);

  return (
    <BulkActionsContext.Provider
      value={{
        selectedIds,
        selectAll,
        totalCount,
        setSelectedIds,
        toggleSelection,
        toggleSelectAll,
        clearSelection,
        setTotalCount,
        currentAction,
        setCurrentAction,
        undoQueue,
        addToUndoQueue,
        performUndo
      }}
    >
      {children}
    </BulkActionsContext.Provider>
  );
};
