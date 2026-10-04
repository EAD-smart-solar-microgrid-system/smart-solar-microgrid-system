import React, { useEffect } from 'react';

/**
 * ToastItem Component
 * Single dashboard toast notification styled with the centralized palette.
 * - Success: green accent
 * - Error: red accent
 * - Warning: amber accent
 * - Info/Normal: orange accent
 * Surfaces dynamically adapt between dark (#1B1B1C) and light (#FFFFFF).
 */
const ToastItem = ({ toast, onDismiss }) => {
  useEffect(() => {
    const duration = toast.duration ?? (toast.type === 'error' ? 6000 : 4000);
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, toast.type, onDismiss]);

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';
  const isWarning = toast.type === 'warning';

  // Semantic styles for badge and border
  const statusConfig = isError
    ? {
        border: 'border-[#EF4444]/35 ring-1 ring-[#EF4444]/20',
        iconBg: 'border-[#EF4444]/30 bg-[#EF4444]/15 text-[#EF4444]',
      }
    : isSuccess
    ? {
        border: 'border-[#22C55E]/35 ring-1 ring-[#22C55E]/20',
        iconBg: 'border-[#22C55E]/30 bg-[#22C55E]/15 text-[#22C55E]',
      }
    : isWarning
    ? {
        border: 'border-[#F59E0B]/35 ring-1 ring-[#F59E0B]/20',
        iconBg: 'border-[#F59E0B]/30 bg-[#F59E0B]/15 text-[#F59E0B]',
      }
    : {
        // Info / normal default uses orange brand accent
        border: 'border-[#E3511B]/35 ring-1 ring-[#E3511B]/20',
        iconBg: 'border-[#E3511B]/30 bg-[#E3511B]/15 text-[#E3511B]',
      };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 bg-[var(--bg-surface)]/95 text-[var(--text-primary)] ${statusConfig.border}`}
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
    >
      {/* Status icon badge */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${statusConfig.iconBg}`}
      >
        {isError ? (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        ) : isWarning ? (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        ) : isSuccess ? (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-0.5">
            {toast.title}
          </h4>
        )}
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed break-words">
          {toast.message}
        </p>
        {toast.action && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                toast.action.onClick?.();
                onDismiss(toast.id);
              }}
              className="text-xs font-bold text-[#E3511B] hover:underline underline-offset-2 transition"
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition"
        aria-label="Dismiss notification"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

/**
 * ToastContainer Component
 * Fixed floating container for active toast notifications (bottom-right).
 */
export const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default ToastContainer;
