import { useEffect } from 'react';

/**
 * ToastItem Component
 * Single toast notification with auto-dismiss and close control.
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

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
        isError
          ? 'border-rose-200 bg-white/95 text-slate-800 ring-1 ring-rose-500/10'
          : isSuccess
          ? 'border-emerald-200 bg-white/95 text-slate-800 ring-1 ring-emerald-500/10'
          : 'border-sky-200 bg-white/95 text-slate-800 ring-1 ring-sky-500/10'
      }`}
      role={isError ? 'alert' : 'status'}
      aria-live="polite"
    >
      {/* Status icon badge */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
          isError
            ? 'bg-rose-100 text-rose-600'
            : isSuccess
            ? 'bg-emerald-100 text-emerald-600'
            : 'bg-sky-100 text-sky-600'
        }`}
      >
        {isError ? (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <h4 className="text-sm font-bold text-slate-900 mb-0.5">{toast.title}</h4>
        )}
        <p className="text-sm text-slate-600 leading-snug break-words">{toast.message}</p>
        {toast.action && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                toast.action.onClick?.();
                onDismiss(toast.id);
              }}
              className="text-xs font-bold text-sky-700 hover:text-sky-800 underline underline-offset-2 transition"
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
        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
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
 * Fixed floating container for active toast notifications.
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
