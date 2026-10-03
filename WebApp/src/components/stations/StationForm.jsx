import React, { useState } from 'react';
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

const toFormState = (station) =>
  station
    ? {
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
      }
    : blankForm();

const isValidTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const validate = (form) => {
  const errors = {};
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  const capacity = Number(form.capacityKwPerHour);
  const batterySlots = Number(form.batteryStorageSlotCapacity);

  if (!form.stationName.trim()) errors.stationName = 'Station name is required.';
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
    errors.latitude = 'Latitude must be between -90 and 90.';
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
    errors.longitude = 'Longitude must be between -180 and 180.';
  if (!Number.isFinite(capacity) || capacity <= 0)
    errors.capacityKwPerHour = 'Capacity must be greater than 0.';
  if (!Number.isInteger(batterySlots) || batterySlots < 0)
    errors.batteryStorageSlotCapacity = 'Battery slot capacity must be 0 or greater.';

  if (form.operatingSchedule.length === 0) {
    errors.operatingSchedule = 'At least one operating period is required.';
  } else if (
    form.operatingSchedule.some(
      (row) =>
        !row.dayOfWeek ||
        !isValidTime(row.openTime) ||
        !isValidTime(row.closeTime) ||
        row.closeTime <= row.openTime
    )
  ) {
    errors.operatingSchedule =
      'Each row needs a valid day, HH:mm times, and a later close time.';
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

const ThemedField = ({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  step,
  readOnly = false,
  placeholder = '',
}) => (
  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
    {label}
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      step={step}
      readOnly={readOnly}
      placeholder={placeholder}
      className={`mt-1.5 block w-full rounded-xl border bg-[var(--bg-elevated)] px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition ${
        readOnly
          ? 'cursor-not-allowed border-[var(--border-subtle)] bg-[var(--bg-secondary)] opacity-80 font-mono text-[var(--text-muted)]'
          : error
          ? 'border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]'
          : 'border-[var(--border-default)] focus:border-[#E3511B] focus:ring-1 focus:ring-[#E3511B]'
      }`}
    />
    {error && <span className="mt-1 block text-xs font-semibold text-[#EF4444]">{error}</span>}
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div
          className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-xs font-semibold text-[#EF4444]"
          role="alert"
        >
          {serverError}
        </div>
      )}

      {/* SECTION 1: BASIC INFORMATION */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#E3511B]">
          Basic Information
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <ThemedField
              label="Station Name"
              name="stationName"
              placeholder="e.g. Haputale Solar Hub"
              value={form.stationName}
              onChange={handleChange}
              error={errors.stationName}
            />
          </div>

          {station?.hubId && (
            <div className="sm:col-span-2">
              <ThemedField
                label="Hub Identifier (Public Immutable ID)"
                name="hubId"
                value={station.hubId}
                readOnly
              />
            </div>
          )}

          <div>
            <ThemedField
              label="Latitude"
              name="latitude"
              type="number"
              step="any"
              placeholder="e.g. 6.7682"
              value={form.latitude}
              onChange={handleChange}
              error={errors.latitude}
            />
          </div>

          <div>
            <ThemedField
              label="Longitude"
              name="longitude"
              type="number"
              step="any"
              placeholder="e.g. 80.9602"
              value={form.longitude}
              onChange={handleChange}
              error={errors.longitude}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: GRID CAPACITY & HARDWARE */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#E3511B]">
          Grid Capacity &amp; Storage
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <ThemedField
              label="Capacity (kW per hour)"
              name="capacityKwPerHour"
              type="number"
              step="any"
              placeholder="e.g. 150"
              value={form.capacityKwPerHour}
              onChange={handleChange}
              error={errors.capacityKwPerHour}
            />
          </div>

          <div>
            <ThemedField
              label="Battery Storage Slots"
              name="batteryStorageSlotCapacity"
              type="number"
              step="1"
              placeholder="e.g. 8"
              value={form.batteryStorageSlotCapacity}
              onChange={handleChange}
              error={errors.batteryStorageSlotCapacity}
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: OPERATING SCHEDULE */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
        <StationScheduleEditor
          schedules={form.operatingSchedule}
          onChange={(operatingSchedule) => {
            setForm((current) => ({ ...current, operatingSchedule }));
            setErrors((current) => ({ ...current, operatingSchedule: undefined }));
          }}
          error={errors.operatingSchedule}
        />
      </div>

      {/* SECTION 4: NODE STATUS (INFO ONLY ON EDIT) */}
      {station && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Operational Status
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Controlled via the status switch action on the node list.
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
              station.status === 'Active'
                ? 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]'
                : 'border-[var(--border-default)] bg-[var(--bg-secondary)] text-[var(--text-muted)]'
            }`}
          >
            ● {station.status || 'Active'}
          </span>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex flex-col-reverse justify-end gap-3 border-t border-[var(--border-subtle)] pt-4 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-hover)]"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-[#E3511B] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#F05A20] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={submitting}
        >
          {submitting ? 'Saving…' : station ? 'Save Changes' : 'Create Solar Hub'}
        </button>
      </div>
    </form>
  );
};

export default StationForm;
