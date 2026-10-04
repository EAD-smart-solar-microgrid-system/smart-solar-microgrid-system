import React from 'react';

export const ErrorAlert = ({ message, details, onDismiss, className = '' }) => {
  if (!message) return null;
  return (
    <div
      className={`rounded-xl border border-[#ef5350]/30 bg-[#ef5350]/10 px-4 py-3 text-[#f4f7f6] ${className}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm font-semibold text-[#ef5350]">{message}</p>
          {typeof details === 'string' && (
            <p className="mt-1 text-xs text-[#a0aaa5]">{details}</p>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-lg leading-none text-[#738079] hover:text-[#f4f7f6]"
            aria-label="Close alert"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
