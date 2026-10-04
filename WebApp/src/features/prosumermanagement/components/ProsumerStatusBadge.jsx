import React from 'react';
import { PROSUMER_STATUS } from '../utils/prosumerMapper.js';

const STATUS_STYLES = {
  [PROSUMER_STATUS.ACTIVE]: 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]',
  [PROSUMER_STATUS.PENDING]: 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]',
  [PROSUMER_STATUS.DEACTIVATED]: 'border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-muted)]',
};

/**
 * ProsumerStatusBadge Component
 * Accessible status badge for solar prosumer account lifecycle states.
 */
export const ProsumerStatusBadge = ({ status }) => {
  const label = status || 'Unknown';
  const styles = STATUS_STYLES[label] || 'border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-muted)]';

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
