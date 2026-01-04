/**
 * Confirmation Dialog Component
 *
 * Modern modal dialog for confirmations - replaces native confirm() popups
 */

import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export type ConfirmType = 'warning' | 'danger' | 'info';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ConfirmType;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const typeStyles = {
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-50 dark:bg-amber-950/20',
      iconColor: 'text-amber-500',
      buttonColor: 'bg-amber-500 hover:bg-amber-600',
    },
    danger: {
      icon: AlertTriangle,
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      iconColor: 'text-red-500',
      buttonColor: 'bg-red-500 hover:bg-red-600',
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-500',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
    },
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div className="fixed top-20 left-0 right-0 bottom-20 md:bottom-0 z-50 flex items-center justify-center p-4 bg-[#0a0e1a]/98 backdrop-blur-2xl">
      <div className="bg-white dark:bg-[#161b28] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in border border-slate-200 dark:border-[#1e2533]/30">
        {/* Header */}
        <div className={`${style.bgColor} p-6 flex items-start gap-4`}>
          <div className={`${style.iconColor} mt-1`}>
            <Icon size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Actions */}
        <div className="p-6 flex gap-3 justify-end bg-slate-50 dark:bg-[#0f1419]/30">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-[#1e2533]/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0d1117] transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg ${style.buttonColor} text-white transition-colors font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  .animate-scale-in {
    animation: scale-in 0.2s ease-out;
  }
`;
document.head.appendChild(style);
