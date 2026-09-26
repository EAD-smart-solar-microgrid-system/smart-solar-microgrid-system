export const LoadingIndicator = ({ message = 'Loading…', centered = true }) => (
  <div className={centered ? 'flex flex-col items-center justify-center py-12' : 'inline-flex items-center gap-2'} role="status" aria-live="polite">
    <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" aria-hidden="true" />
    <span className={centered ? 'mt-3 text-sm text-slate-500' : 'text-sm text-slate-500'}>{message}</span>
  </div>
);

export default LoadingIndicator;
