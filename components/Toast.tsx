/**
 * Toast Notification Component
 *
 * Provides non-intrusive notifications for user actions.
 * Automatically dismisses after a few seconds.
 */

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <XCircle size={20} className="text-red-500" />,
    info: <AlertCircle size={20} className="text-blue-500" />,
  };

  const styles = {
    success: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/30 text-green-900 dark:text-green-100',
    error: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/30 text-red-900 dark:text-red-100',
    info: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/30 text-blue-900 dark:text-blue-100',
  };

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-[200]
        max-w-md w-full md:w-auto
        ${styles[type]}
        border-2 rounded-2xl shadow-2xl
        p-4 pr-12
        flex items-center gap-3
        animate-in slide-in-from-bottom-4 duration-300
      `}
    >
      {icons[type]}
      <p className="font-medium text-sm flex-1">{message}</p>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ bottom: `${6 + index * 5}rem` }}
          className="fixed right-6 z-[200]"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </>
  );
}
