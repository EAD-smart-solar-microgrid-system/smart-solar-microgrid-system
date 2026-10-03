import React from 'react';
import { StatusBadge } from './StatusBadge.jsx';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

const formatSchedule = (schedule = []) => schedule.map((row) => `${row.dayOfWeek}: ${row.openTime}–${row.closeTime}`);

export const StationList = ({ stations, onEdit, onStatusChange, onView, statusChangingId }) => (
  <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)]">
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full text-left text-xs">
        <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
          <tr>
            <th className="px-5 py-3.5 font-bold">Hub</th>
            <th className="px-5 py-3.5 font-bold">Location</th>
            <th className="px-5 py-3.5 font-bold">Capacity</th>
            <th className="px-5 py-3.5 font-bold">Battery</th>
            <th className="px-5 py-3.5 font-bold">Operating Schedule</th>
            <th className="px-5 py-3.5 font-bold">Status</th>
            <th className="px-5 py-3.5 font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {stations.map((station) => {
            const nextStatus = station.status === 'Active' ? 'Inactive' : 'Active';
            const isChanging = statusChangingId === station.hubId;
            return (
              <tr key={station.hubId} className="align-middle transition hover:bg-[var(--bg-hover)]">
                {/* HUB: Name + Public Hub ID + Updated */}
                <td className="px-5 py-4">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{station.stationName}</p>
                  <p className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">{station.hubId}</p>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">Updated {formatDate(station.updatedAt)}</p>
                </td>

                {/* LOCATION: GPS coordinates */}
                <td className="px-5 py-4 text-[var(--text-secondary)]">
                  <p className="font-mono text-xs">{station.latitude}, {station.longitude}</p>
                </td>

                {/* CAPACITY: kW/h */}
                <td className="px-5 py-4">
                  <span className="font-bold text-[var(--text-primary)]">{station.capacityKwPerHour}</span>
                  <span className="text-[11px] text-[var(--text-muted)] ml-1">kW/h</span>
                </td>

                {/* BATTERY: Storage slots */}
                <td className="px-5 py-4">
                  <span className="font-bold text-[var(--text-primary)]">{station.batteryStorageSlotCapacity}</span>
                  <span className="text-[11px] text-[var(--text-muted)] ml-1">slots</span>
                </td>

                {/* SCHEDULE: Formatted list */}
                <td className="max-w-xs px-5 py-4 text-[var(--text-secondary)]">
                  <ul className="space-y-0.5 text-[11px]">
                    {formatSchedule(station.operatingSchedule).map((period) => (
                      <li key={period}>{period}</li>
                    ))}
                  </ul>
                </td>

                {/* STATUS: Badge */}
                <td className="px-5 py-4">
                  <StatusBadge status={station.status} />
                </td>

                {/* ACTIONS: Compact treatment */}
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {onView && (
                      <button
                        type="button"
                        onClick={() => onView(station)}
                        className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-muted)] transition hover:border-[#E3511B]/40 hover:text-[#E3511B]"
                      >
                        View
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(station)}
                      className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[#E3511B]/40 hover:text-[#E3511B]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onStatusChange(station, nextStatus)}
                      disabled={isChanging}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        station.status === 'Active'
                          ? 'border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20'
                          : 'border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E] hover:bg-[#22C55E]/20'
                      }`}
                    >
                      {isChanging ? 'Updating…' : nextStatus === 'Active' ? 'Activate' : 'Deactivate'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default StationList;
