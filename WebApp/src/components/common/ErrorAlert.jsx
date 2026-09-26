export const ErrorAlert = ({ message, details, onDismiss, className = '' }) => {
  if (!message) return null;
  return (
    <div className={`rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 ${className}`} role="alert">
      <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{message}</p>{typeof details === 'string' && <p className="mt-1 text-xs">{details}</p>}</div>{onDismiss && <button type="button" onClick={onDismiss} className="text-xl leading-none" aria-label="Close alert">×</button>}</div>
    </div>
  );
};

export default ErrorAlert;
