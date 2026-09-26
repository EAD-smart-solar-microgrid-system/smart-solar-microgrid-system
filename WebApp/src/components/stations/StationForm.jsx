import { useState } from 'react';
import { StationScheduleEditor } from './StationScheduleEditor.jsx';
import { createScheduleRow } from './stationScheduleUtils.js';

const blankForm = () => ({
  stationName: '',
  latitude: '',
  longitude: '',
  capacityKwPerHour: '',
  batteryStorageSlotCapacity: '0',
  operatingSchedule: [createScheduleRow()],
});

const toFormState = (station) => station ? ({
  stationName: station.stationName ?? '',
  latitude: String(station.latitude ?? ''),
  longitude: String(station.longitude ?? ''),
  capacityKwPerHour: String(station.capacityKwPerHour ?? ''),
  batteryStorageSlotCapacity: String(station.batteryStorageSlotCapacity ?? 0),
  operatingSchedule: (station.operatingSchedule ?? []).map((row) => ({
    dayOfWeek: row.dayOfWeek ?? '',
    openTime: row.openTime ?? '',
    closeTime: row.closeTime ?? '',
  })),
}) : blankForm();

const isValidTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const validate = (form) => {
  const errors = {};
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  const capacity = Number(form.capacityKwPerHour);
  const batterySlots = Number(form.batteryStorageSlotCapacity);

  if (!form.stationName.trim()) errors.stationName = 'Station name is required.';
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) errors.latitude = 'Latitude must be between -90 and 90.';
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) errors.longitude = 'Longitude must be between -180 and 180.';
  if (!Number.isFinite(capacity) || capacity <= 0) errors.capacityKwPerHour = 'Capacity must be greater than 0.';
  if (!Number.isInteger(batterySlots) || batterySlots < 0) errors.batteryStorageSlotCapacity = 'Battery slot capacity must be 0 or greater.';

  if (form.operatingSchedule.length === 0) {
    errors.operatingSchedule = 'At least one operating period is required.';
  } else if (form.operatingSchedule.some((row) => !row.dayOfWeek || !isValidTime(row.openTime) || !isValidTime(row.closeTime) || row.closeTime <= row.openTime)) {
    errors.operatingSchedule = 'Each row needs a valid day, HH:mm times, and a later close time.';
  }

  return errors;
};

const toPayload = (form) => ({
  stationName: form.stationName.trim(),
  latitude: Number(form.latitude),
  longitude: Number(form.longitude),
  capacityKwPerHour: Number(form.capacityKwPerHour),
  batteryStorageSlotCapacity: Number(form.batteryStorageSlotCapacity),
  operatingSchedule: form.operatingSchedule.map(({ dayOfWeek, openTime, closeTime }) => ({
    dayOfWeek,
    openTime,
    closeTime,
  })),
});

const Field = ({ label, name, value, onChange, error, type = 'text', step }) => (
  <label className="text-sm font-semibold text-slate-700">
    {label}
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      step={step}
      className={`mt-1.5 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm font-normal text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 ${error ? 'border-rose-400' : 'border-slate-300'}`}
    />
    {error && <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span>}
  </label>
);

export const StationForm = ({ station, onSubmit, onCancel, submitting, serverError }) => {
  const [form, setForm] = useState(() => toFormState(station));
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    await onSubmit(toPayload(form));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{serverError}</div>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Station name" name="stationName" value={form.stationName} onChange={handleChange} error={errors.stationName} />
        </div>
        <Field label="Latitude" name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} error={errors.latitude} />
        <Field label="Longitude" name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} error={errors.longitude} />
        <Field label="Capacity (kW/h)" name="capacityKwPerHour" type="number" step="any" value={form.capacityKwPerHour} onChange={handleChange} error={errors.capacityKwPerHour} />
        <Field label="Battery storage slot capacity" name="batteryStorageSlotCapacity" type="number" step="1" value={form.batteryStorageSlotCapacity} onChange={handleChange} error={errors.batteryStorageSlotCapacity} />
      </div>

      <StationScheduleEditor
        schedules={form.operatingSchedule}
        onChange={(operatingSchedule) => setForm((current) => ({ ...current, operatingSchedule }))}
        error={errors.operatingSchedule}
      />

      <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-4 sm:flex-row">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" disabled={submitting}>Cancel</button>
        <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting}>
          {submitting ? 'Saving…' : station ? 'Save changes' : 'Add station'}
        </button>
      </div>
    </form>
  );
};

export default StationForm;
