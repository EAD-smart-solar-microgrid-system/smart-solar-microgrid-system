import React from 'react';

export const PageHeader = ({ title, subtitle, badgeText, badgeVariant = 'primary', children }) => {
  if (!title) return null;

  const badgeColor =
    badgeVariant === 'info'
      ? 'border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#3B82F6]'
      : 'border-[#E3511B]/40 bg-[#E3511B]/10 text-[#E3511B]';

  return (
    <header className="flex flex-col justify-between gap-4 border-b border-[var(--border-subtle)] pb-5 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {title}
          </h1>
          {badgeText && (
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}>
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1.5 max-w-3xl text-xs sm:text-sm text-[var(--text-muted)]">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </header>
  );
};

export default PageHeader;
