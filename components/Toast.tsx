/**
 * Toast Notification Component
 *
 * Provides non-intrusive notifications for user actions.
 * Automatically dismisses after a few seconds.
 * Positioned in bottom-right corner with TripFlow's modern design.
 */

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

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

  const config = {
    success: {
      icon: <CheckCircle size={20} />,
      bgClass: 'bg-green-500 dark:bg-green-600',
      textClass: 'text-white',
    },
    error: {
      icon: <XCircle size={20} />,
      bgClass: 'bg-red-500 dark:bg-red-600',
      textClass: 'text-white',
    },
    warning: {
      icon: <AlertCircle size={20} />,
      bgClass: 'bg-amber-500 dark:bg-amber-600',
      textClass: 'text-white',
    },
    info: {
      icon: <Info size={20} />,
      bgClass: 'bg-blue-500 dark:bg-blue-600',
      textClass: 'text-white',
    },
  };

  const { icon, bgClass, textClass } = config[type];

  return (
    <div
      className={`
        ${bgClass} ${textClass}
        rounded-2xl shadow-2xl
        px-5 py-4 pr-12
        flex items-center gap-3
        min-w-[320px] max-w-md
        animate-in slide-in-from-right-full duration-300
        backdrop-blur-xl
      `}
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      <p className="font-medium text-sm flex-1 leading-snug">
        {message}
      </p>
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg transition-all active:scale-95"
        aria-label="Close notification"
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
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
