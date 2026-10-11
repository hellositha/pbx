'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, AlertCircle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  confirmVariant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant,
  confirmVariant,
  isLoading = false,
  onConfirm,
  onCancel,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const actualVariant = variant || confirmVariant || 'danger';
  const handleCancel = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  const getIcon = () => {
    switch (actualVariant) {
      case 'danger':
        return <Trash2 className="w-5 h-5 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'primary':
        return <Info className="w-5 h-5 text-sky-600" />;
    }
  };

  const getConfirmBtnClass = () => {
    switch (actualVariant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20';
      case 'primary':
        return 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-sky-600/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                actualVariant === 'danger'
                  ? 'bg-rose-50 border border-rose-100'
                  : actualVariant === 'warning'
                  ? 'bg-amber-50 border border-amber-100'
                  : 'bg-sky-50 border border-sky-100'
              }`}
            >
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {message}
              </p>
            </div>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-slate-50/80 px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200/70 transition border border-slate-200 bg-white shadow-xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 ${getConfirmBtnClass()} disabled:opacity-50`}
          >
            {isLoading && (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
