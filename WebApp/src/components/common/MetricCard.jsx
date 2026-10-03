import React from 'react';

/**
 * MetricCard Component
 * High-fidelity dashboard KPI card directly styled after the reference design.
 *
 * Supports an orange-highlighted variant (e.g., Total Capacity / primary KPI)
 * matching the warm glowing orange balance card in the reference image,
 * alongside dark/light neutral cards for secondary metrics.
 *
 * @param {Object} props
 * @param {string} props.title - Card title / label
 * @param {string|number|React.ReactNode} props.value - Primary large metric value
 * @param {string} [props.subtitle] - Secondary supporting text
 * @param {React.ReactNode} [props.icon] - Visual icon
 * @param {string} [props.trend] - Trend text e.g. "+14.2% ↑"
 * @param {boolean} [props.trendPositive=true] - Positive or negative trend
 * @param {boolean} [props.highlight=false] - Whether to render with the vibrant orange highlight style
 * @param {string} [props.actionLabel] - Bottom text link like "See details →"
 * @param {Function} [props.onAction] - Callback for bottom link
 * @param {string} [props.className=''] - Custom container classes
 */
export const MetricCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive = true,
  highlight = false,
  actionLabel,
  onAction,
  className = '',
}) => {
  if (highlight) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-200 hover:shadow-xl text-white ${className}`}
        style={{
          background: 'linear-gradient(135deg, #E3511B 0%, #B64319 100%)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
              {title}
            </p>
            <div className="flex items-baseline gap-2 pt-0.5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {value}
              </span>
              {trend && (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                  {trend}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-white/80 pt-0.5">{subtitle}</p>
            )}
          </div>

          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-xs">
              {icon}
            </div>
          )}
        </div>

        {actionLabel && (
          <div className="mt-4 pt-3 border-t border-white/15">
            <button
              type="button"
              onClick={onAction}
              className="group flex items-center gap-1.5 text-xs font-semibold text-white/90 hover:text-white transition"
            >
              <span>{actionLabel}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--bg-elevated)] ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {title}
          </p>
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {value}
            </span>
            {trend && (
              <span
                className={`text-xs font-semibold ${
                  trendPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}
              >
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[var(--text-muted)] pt-0.5">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
            {icon}
          </div>
        )}
      </div>

      {actionLabel && (
        <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onAction}
            className="group flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[#E3511B] transition"
          >
            <span>{actionLabel}</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
