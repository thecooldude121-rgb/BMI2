import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

type ToastType = Toast['type'];

const TOAST_TYPES: readonly string[] = ['success', 'error', 'warning', 'info'];
const isToastType = (v: unknown): v is ToastType =>
  typeof v === 'string' && TOAST_TYPES.includes(v);

interface ToastContextType {
  /**
   * Accepts EITHER argument order — see the note on `showToast` below.
   * Both params are typed loosely on purpose so existing call sites compile;
   * the runtime normalises them.
   */
  showToast: (a: string, b?: string, duration?: number) => void;
  addToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Two toasts fired in the same millisecond previously shared an id, which
  // duplicated React keys and let one removal drop both.
  const idCounter = useRef(0);

  /**
   * PHASE 0 COMPATIBILITY SHIM — accepts both argument orders.
   *
   * This context shipped two functions with the same two string params in
   * OPPOSITE orders: showToast(type, message) and addToast(message, type).
   * Because both are strings, TypeScript's only defence was the type union, and
   * 198 call sites across 21 files call showToast(message, type). Every one of
   * them rendered `message = 'success'` — users were shown a toast that
   * literally said "success" instead of "Deal deleted". 78 sites use the
   * declared order and worked correctly.
   *
   * Normalising here fixes all 198 immediately with no call-site churn. The
   * proper fix is to settle on ONE signature and codemod the minority — that
   * belongs with the design-system work in Phase 3, at which point this shim
   * and the duplicate `addToast` should both be deleted.
   *
   * Disambiguation rule: treat an argument as the type only if it is one of the
   * four literals AND the other argument is not. When both look like types
   * (vanishingly rare), the declared (type, message) order wins.
   */
  const showToast = useCallback((a: string, b?: string, duration = 3000) => {
    let type: ToastType;
    let message: string;

    if (isToastType(a) && !isToastType(b)) {
      type = a;                    // declared order: (type, message)
      message = b ?? '';
    } else if (isToastType(b)) {
      type = b;                    // swapped order: (message, type)
      message = a;
    } else {
      type = 'info';               // neither is a valid type — show the text we have
      message = a;
    }

    const id = `${Date.now()}-${idCounter.current++}`;
    const newToast: Toast = { id, type, message, duration };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }
  }, []);

  const addToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    showToast(type, message, duration);
  }, [showToast]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getBorderColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'border-l-4 border-l-green-500';
      case 'error': return 'border-l-4 border-l-red-500';
      case 'warning': return 'border-l-4 border-l-yellow-500';
      case 'info': return 'border-l-4 border-l-blue-500';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg bg-white border border-gray-200 shadow-lg ${getBorderColor(toast.type)} animate-slide-in`}
          >
            {getIcon(toast.type)}
            <p className="flex-1 text-sm font-medium text-gray-900">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
