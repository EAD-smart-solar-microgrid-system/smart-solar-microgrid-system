import { PROSUMER_STATUS } from '../utils/prosumerMapper.js';

const STATUS_STYLES = {
  [PROSUMER_STATUS.ACTIVE]: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  [PROSUMER_STATUS.PENDING]: 'border-amber-200 bg-amber-50 text-amber-700',
  [PROSUMER_STATUS.DEACTIVATED]: 'border-slate-200 bg-slate-100 text-slate-600',
};

/**
 * ProsumerStatusBadge Component
 *
 * Renders an accessible status pill badge for solar prosumer account lifecycle states.
 * Uses text and contrast for accessibility, not color alone.
 *
 * @param {{ status: string }} props
 */
export const ProsumerStatusBadge = ({ status }) => {
  const label = status || 'Unknown';
  const styles = STATUS_STYLES[label] || 'border-slate-200 bg-slate-100 text-slate-600';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}
      role="status"
      aria-label={`Status: ${label}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
};

export default ProsumerStatusBadge;
