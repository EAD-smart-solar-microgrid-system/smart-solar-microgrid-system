import React from 'react';
import { StatusBadge } from './StatusBadge.jsx';

const formatSchedule = (schedule = []) => {
  if (!schedule || schedule.length === 0) return 'Mon–Sun: 08:00–18:00';
  const first = schedule[0];
  const last = schedule[schedule.length - 1];
  if (schedule.length === 1) {
    return `${first.dayOfWeek}: ${first.openTime}–${first.closeTime}`;
  }
  return `${first.dayOfWeek}–${last.dayOfWeek}: ${first.openTime}–${first.closeTime}`;
};

export const StationCardGrid = ({
  stations,
  onEdit,
  onStatusChange,
  onView,
  statusChangingId,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stations.map((station) => {
        const nextStatus = station.status === 'Active' ? 'Inactive' : 'Active';
        const isChanging = statusChangingId === station.hubId;
        const coords = station.latitude && station.longitude
          ? `${Number(station.latitude).toFixed(4)}, ${Number(station.longitude).toFixed(4)}`
          : '—';

        return (
          <div
            key={station.hubId}
            className="group relative flex flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--bg-elevated)]"
          >
            <div>
              {/* Header: Station Name & Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[#E3511B] transition">
                    {station.stationName}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs font-semibold text-[var(--text-muted)]">
                    {station.hubId}
                  </p>
                </div>
                <StatusBadge status={station.status} />
              </div>

              {/* Metrics Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 text-xs">
                <div>
                  <span className="block text-[10px] uppercase text-[var(--text-muted)]">Capacity</span>
                  <span className="font-extrabold text-[var(--text-primary)]">
                    {station.capacityKwPerHour} kW/h
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-[var(--text-muted)]">Storage</span>
                  <span className="font-extrabold text-[var(--text-primary)]">
                    {station.batteryStorageSlotCapacity} slots
                  </span>
                </div>
              </div>

              {/* Location & Operating Schedule */}
              <div className="mt-3.5 space-y-1 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text-muted)]">📍</span>
                  <span className="font-mono text-[11px]">{coords}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[var(--text-muted)]">⏰</span>
                  <span className="text-[11px]">{formatSchedule(station.operatingSchedule)}</span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-3">
              {onView && (
                <button
                  type="button"
                  onClick={() => onView(station)}
                  className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition hover:border-[#E3511B]/40 hover:text-[#E3511B]"
                >
                  View
                </button>
              )}
              <button
                type="button"
                onClick={() => onEdit(station)}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[#E3511B]/40 hover:text-[#E3511B]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(station, nextStatus)}
                disabled={isChanging}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  station.status === 'Active'
                    ? 'border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20'
                    : 'border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20'
                }`}
              >
                {isChanging ? 'Updating…' : nextStatus === 'Active' ? 'Activate' : 'Deactivate'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StationCardGrid;
