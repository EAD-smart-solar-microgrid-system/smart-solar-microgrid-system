import React from 'react';
import { createScheduleRow } from './stationScheduleUtils.js';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const StationScheduleEditor = ({ schedules, onChange, error }) => {
  const updateRow = (index, field, value) => {
    onChange(schedules.map((row, rowIndex) =>
      rowIndex === index ? { ...row, [field]: value } : row,
    ));
  };

  const removeRow = (index) => {
    onChange(schedules.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <fieldset className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <legend className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Operating Schedule
          </legend>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Use 24-hour HH:mm times. Add one row for each operating period.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...schedules, createScheduleRow()])}
          className="shrink-0 rounded-xl border border-[#E3511B]/30 bg-[#E3511B]/10 px-3 py-1.5 text-xs font-bold text-[#E3511B] transition hover:bg-[#E3511B]/20"
        >
          + Add Period
        </button>
      </div>

      {schedules.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-4 text-xs text-[var(--text-muted)]">
          Add at least one operating period.
        </div>
      )}

      {schedules.map((schedule, index) => (
        <div
          key={`${index}-${schedule.dayOfWeek}`}
          className="grid gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end"
        >
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Day of week
            <select
              value={schedule.dayOfWeek}
              onChange={(event) => updateRow(index, 'dayOfWeek', event.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2 text-xs font-normal normal-case text-[var(--text-primary)] outline-none focus:border-[#E3511B]"
            >
              {DAYS.map((day) => (
                <option key={day} value={day} className="bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                  {day}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Open time
            <input
              type="time"
              value={schedule.openTime}
              onChange={(event) => updateRow(index, 'openTime', event.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2 text-xs font-normal normal-case text-[var(--text-primary)] outline-none focus:border-[#E3511B]"
            />
          </label>
          <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Close time
            <input
              type="time"
              value={schedule.closeTime}
              onChange={(event) => updateRow(index, 'closeTime', event.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2 text-xs font-normal normal-case text-[var(--text-primary)] outline-none focus:border-[#E3511B]"
            />
          </label>
          <button
            type="button"
            onClick={() => removeRow(index)}
            className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-xs font-semibold text-[#EF4444] transition hover:bg-[#EF4444]/20"
            aria-label={`Remove ${schedule.dayOfWeek} schedule row`}
          >
            Remove
          </button>
        </div>
      ))}

      {error && <p className="text-xs font-medium text-[#EF4444]">{error}</p>}
    </fieldset>
  );
};

export default StationScheduleEditor;
