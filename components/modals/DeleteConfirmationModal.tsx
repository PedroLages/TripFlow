import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  itemType?: 'expense' | 'place' | 'item' | 'activity' | 'document' | 'generic';
  isLoading?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Deletion',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  itemType = 'generic',
  isLoading = false
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button when modal opens (for keyboard accessibility)
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }
  }, [isOpen]);

  // Handle ESC key to cancel (disabled while loading)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel, isLoading]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div
      className="fixed top-20 left-0 right-0 bottom-20 md:bottom-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={!isLoading ? onCancel : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 px-8 py-6">
          <div className="absolute inset-0 bg-red-500/5 dark:bg-red-500/10" />
          <div className="relative flex items-center gap-4">
            <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/20">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 id="modal-title" className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">
                Irreversible Action
              </p>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              aria-label="Close dialog"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <p id="modal-description" className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-950/50 flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 min-h-[44px] px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 min-h-[44px] px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="animate-spin" size={16} />}
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default DeleteConfirmationModal;
