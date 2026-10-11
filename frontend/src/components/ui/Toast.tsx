'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const item: ToastItem = {
      id,
      type,
      title,
      message,
      duration: 4000,
    };

    setToasts((prev) => [...prev, item]);

    setTimeout(() => {
      removeToast(id);
    }, item.duration || 4000);
  }, [removeToast]);

  const value = {
    toast: {
      success: (msg: string, title?: string) => addToast('success', msg, title),
      error: (msg: string, title?: string) => addToast('error', msg, title),
      warning: (msg: string, title?: string) => addToast('warning', msg, title),
      info: (msg: string, title?: string) => addToast('info', msg, title),
    },
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-sky-500 shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-white/95 text-slate-800 shadow-emerald-500/10';
      case 'error':
        return 'border-rose-200 bg-white/95 text-slate-800 shadow-rose-500/10';
      case 'warning':
        return 'border-amber-200 bg-white/95 text-slate-800 shadow-amber-500/10';
      case 'info':
        return 'border-sky-200 bg-white/95 text-slate-800 shadow-sky-500/10';
    }
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Floating Toasts Viewport */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${getBorderColor(
              t.type
            )}`}
          >
            <div className="mt-0.5">{getIcon(t.type)}</div>
            <div className="flex-1 min-w-0">
              {t.title && (
                <div className="text-xs font-bold text-slate-900 leading-tight mb-0.5">
                  {t.title}
                </div>
              )}
              <div className="text-xs text-slate-600 font-medium leading-relaxed">
                {t.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export interface UseToastReturn {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
  showToast: (message: string, type?: ToastType, title?: string) => void;
}

export function useToast(): UseToastReturn {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  const showToast = (message: string, type: ToastType = 'info', title?: string) => {
    ctx.toast[type](message, title);
  };
  return {
    ...ctx.toast,
    toast: ctx.toast,
    showToast,
  };
}
