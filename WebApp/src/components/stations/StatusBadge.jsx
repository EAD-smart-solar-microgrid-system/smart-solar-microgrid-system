import React from 'react';

const STATUS_STYLES = {
  Active: 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]',
  Inactive: 'border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-muted)]',
};

export const StatusBadge = ({ status }) => {
  const label = status || 'Unknown';
  const styles = STATUS_STYLES[label] || 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
};

export default StatusBadge;
