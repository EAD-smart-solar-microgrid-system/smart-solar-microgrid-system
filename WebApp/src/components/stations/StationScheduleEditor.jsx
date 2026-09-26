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
          <legend className="text-sm font-semibold text-slate-900">Operating schedule</legend>
          <p className="mt-1 text-xs text-slate-500">Use 24-hour HH:mm times. Add one row for each operating period.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...schedules, createScheduleRow()])}
          className="shrink-0 rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
        >
          + Add row
        </button>
      </div>

      {schedules.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
          Add at least one operating period.
        </div>
      )}

      {schedules.map((schedule, index) => (
        <div key={`${index}-${schedule.dayOfWeek}`} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-end">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Day of week
            <select
              value={schedule.dayOfWeek}
              onChange={(event) => updateRow(index, 'dayOfWeek', event.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal normal-case text-slate-900 shadow-sm"
            >
              {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Open time
            <input
              type="time"
              value={schedule.openTime}
              onChange={(event) => updateRow(index, 'openTime', event.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal normal-case text-slate-900 shadow-sm"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Close time
            <input
              type="time"
              value={schedule.closeTime}
              onChange={(event) => updateRow(index, 'closeTime', event.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal normal-case text-slate-900 shadow-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => removeRow(index)}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            aria-label={`Remove ${schedule.dayOfWeek} schedule row`}
          >
            Remove
          </button>
        </div>
      ))}

      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
    </fieldset>
  );
};

export default StationScheduleEditor;
