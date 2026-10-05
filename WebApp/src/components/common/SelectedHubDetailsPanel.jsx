import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.js';
import brandEmblem from '../../assets/brand-emblem.png';

/**
 * Formats schedule array to concise readable string
 */
const formatSchedule = (schedule = []) => {
  if (!schedule || schedule.length === 0) return 'Mon–Sun: 08:00–18:00';
  const first = schedule[0];
  const last = schedule[schedule.length - 1];
  if (schedule.length === 1) {
    return `${first.dayOfWeek}: ${first.openTime}–${first.closeTime}`;
  }
  return `${first.dayOfWeek}–${last.dayOfWeek}: ${first.openTime}–${first.closeTime}`;
};

/**
 * SelectedHubDetailsPanel Component
 *
 * Detailed solar hub telemetry and operational controls styled to match the dark/light design system.
 */
export const SelectedHubDetailsPanel = ({
  station,
  onEdit,
  onStatusToggle,
  className = '',
}) => {
  if (!station) {
    return (
      <div className="flex h-full min-h-[380px] flex-col items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center shadow-[var(--shadow-card)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--bg-elevated)] text-2xl text-[#E3511B]">
          ⚡
        </div>
        <h4 className="mt-4 text-base font-bold text-[var(--text-primary)]">
          No Solar Hub Selected
        </h4>
        <p className="mt-1 max-w-xs text-xs text-[var(--text-muted)]">
          Click on any node on the microgrid map or select a hub from the fleet below to view live telemetry.
        </p>
      </div>
    );
  }

  const isActive = (station.status || '').toLowerCase() === 'active';
  const coords = station.latitude && station.longitude
    ? `${Number(station.latitude).toFixed(4)}, ${Number(station.longitude).toFixed(4)}`
    : '6.7682, 80.9602';

  return (
    <div className={`flex h-full flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] ${className}`}>
      {/* Header — matches Microgrid Fleet card layout */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            Solar Hub Stats
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            {station.stationName}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
            isActive
              ? 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]'
              : 'border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-muted)]'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isActive ? 'bg-[#22C55E] animate-pulse' : 'bg-[var(--text-muted)]'
            }`}
          />
          {station.status || 'Active'}
        </span>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
      {/* RENEWABLE VISUAL / SOLAR HUB HERO */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-secondary)] p-4 text-center">
        <div className="flex items-center justify-center py-3">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#E3511B]/30 bg-[var(--bg-surface)] shadow-md shadow-[#E3511B]/10">
            <img
              src={brandEmblem}
              alt="Solar Microgrid Hub"
              className="h-14 w-14 object-contain"
            />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#E3511B] text-[11px] font-black text-white shadow">
              ⚡
            </span>
          </div>
        </div>

        <div className="mt-2">
          <h4 className="text-base font-bold text-[var(--text-primary)]">{station.stationName}</h4>
          <span className="mt-0.5 inline-block font-mono text-xs font-semibold text-[var(--text-muted)]">
            {station.hubId || 'HUB-DEFAULT'}
          </span>
        </div>

        {/* 4 Quick Spec Badges */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2.5 text-center">
          <div>
            <span className="block text-[10px] uppercase text-[var(--text-muted)]">Type</span>
            <span className="text-xs font-bold text-[var(--text-primary)]">Microgrid</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[var(--text-muted)]">Capacity</span>
            <span className="text-xs font-bold text-[#E3511B]">{station.capacityKwPerHour} kW</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[var(--text-muted)]">Storage</span>
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {station.batteryStorageSlotCapacity} slots
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[var(--text-muted)]">Health</span>
            <span className="text-xs font-bold text-[#22C55E]">99.8%</span>
          </div>
        </div>
      </div>

      {/* DETAIL TILES */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Tile 1: Battery / Storage Condition */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
          <span className="block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Storage Condition
          </span>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-[#22C55E]">
            <span>⚡</span>
            <span>Optimal</span>
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            Operating Schedule:
          </p>
          <p className="font-medium text-[11px] text-[var(--text-primary)]">
            {formatSchedule(station.operatingSchedule)}
          </p>
        </div>

        {/* Tile 2: GPS Location */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3.5">
          <span className="block text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Coordinates
          </span>
          <div className="mt-1 flex items-center gap-1 text-sm font-bold text-[var(--text-primary)]">
            <span>📍</span>
            <span className="truncate">{coords}</span>
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            Dispatch Window:
          </p>
          <p className="font-medium text-[11px] text-[#E3511B]">
            Active Dynamic Grid
          </p>
        </div>
      </div>

      </div>

      {/* QUICK ACTIONS */}
      <div className="mt-auto flex items-center gap-2 border-t border-[var(--border-subtle)] pt-4">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(station)}
            className="flex-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] py-2 text-xs font-bold text-[var(--text-primary)] transition hover:border-[#E3511B]/40 hover:bg-[var(--bg-hover)]"
          >
            Edit Hub
          </button>
        )}
        {onStatusToggle && (
          <button
            type="button"
            onClick={() => onStatusToggle(station, isActive ? 'Inactive' : 'Active')}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
              isActive
                ? 'border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20'
                : 'border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20'
            }`}
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
        )}
        <Link
          to={ROUTES.ENERGY_SLOT_RESERVATIONS}
          className="flex-1 rounded-xl bg-[#E3511B] py-2 text-center text-xs font-bold text-white transition hover:bg-[#F05A20]"
        >
          View Slots
        </Link>
      </div>
    </div>
  );
};

export default SelectedHubDetailsPanel;
