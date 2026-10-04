import React from 'react';

export const LoadingIndicator = ({ message = 'Loading…', centered = true }) => (
  <div
    className={centered ? 'flex flex-col items-center justify-center py-12' : 'inline-flex items-center gap-2'}
    role="status"
    aria-live="polite"
  >
    <div
      className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--border-default)] border-t-[#E3511B]"
      aria-hidden="true"
    />
    <span className={centered ? 'mt-3 text-xs font-semibold text-[var(--text-muted)]' : 'text-xs font-semibold text-[var(--text-muted)]'}>
      {message}
    </span>
  </div>
);

export default LoadingIndicator;
