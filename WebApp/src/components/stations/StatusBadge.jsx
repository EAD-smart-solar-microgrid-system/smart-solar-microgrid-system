const STATUS_STYLES = {
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Inactive: 'border-slate-200 bg-slate-100 text-slate-600',
};

export const StatusBadge = ({ status }) => {
  const label = status || 'Unknown';
  const styles = STATUS_STYLES[label] || 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
};

export default StatusBadge;
