import React from 'react';

/**
 * HubSummaryCard Component
 *
 * Horizontal summary card inspired by the reference dashboard fleet accounts cards.
 *
 * @param {Object} props
 * @param {Object} props.station - Microgrid station data
 * @param {boolean} [props.isSelected=false] - Whether this card is selected
 * @param {Function} [props.onSelect] - Click handler
 */
export const HubSummaryCard = ({
  station,
  isSelected = false,
  onSelect = () => {},
}) => {
  if (!station) return null;

  const isActive = (station.status || '').toLowerCase() === 'active';

  return (
    <div
      onClick={() => onSelect(station)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(station);
        }
      }}
      className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer ${
        isSelected
          ? 'border-[#E3511B] bg-[var(--bg-elevated)] ring-1 ring-[#E3511B]/30 shadow-md'
          : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-elevated)]'
      }`}
    >
      {/* Top Row: Icon + Capacity + Arrow Action */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              isActive
                ? 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]'
                : 'border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-muted)]'
            }`}
          >
            {/* Solar plug / battery bolt icon */}
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-[var(--text-primary)]">
                {station.capacityKwPerHour}
              </span>
              <span className="text-xs text-[var(--text-muted)]">kW/h</span>
            </div>
            <span
              className={`inline-block text-[10px] font-semibold uppercase tracking-wider ${
                isActive ? 'text-[#22C55E]' : 'text-[var(--text-muted)]'
              }`}
            >
              ● {station.status || 'Active'}
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label={`Select ${station.stationName}`}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
            isSelected
              ? 'border-[#E3511B] bg-[#E3511B] text-white'
              : 'border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-muted)] group-hover:border-[#E3511B]/50 group-hover:text-[#E3511B]'
          }`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* Middle Row: Station Name + HubId */}
      <div className="mt-3.5 space-y-0.5">
        <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
          {station.stationName}
        </h4>
        <p className="font-mono text-[11px] text-[var(--text-muted)]">
          {station.hubId}
        </p>
      </div>

      {/* Bottom Row: Battery Lockers info */}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-2.5 text-[11px] text-[var(--text-muted)]">
        <span>Battery Lockers</span>
        <span className="font-bold text-[var(--text-primary)]">
          {station.batteryStorageSlotCapacity} slots
        </span>
      </div>
    </div>
  );
};

export default HubSummaryCard;
