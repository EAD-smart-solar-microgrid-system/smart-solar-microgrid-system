/**
 * Energy Slot Form Validation (Client UX)
 *
 * Basic format checks only. Authoritative validation remains in the C# Web API.
 */

import { localDateTimeInputToUtcIso } from './slotMapper.js';

/**
 * Validates slot form fields before submission.
 *
 * @param {object} form - Raw form state with datetime-local strings
 * @param {object} [options={}] - Validation options
 * @param {number} [options.maxCapacityKw] - Optional station capacity hint
 * @returns {{ isValid: boolean, errors: Record<string, string>, normalized: object|null }}
 */
export const validateSlotForm = (form, options = {}) => {
  const errors = {};
  const { maxCapacityKw } = options;

  const startIso = localDateTimeInputToUtcIso(form.slotStartLocal);
  const endIso = localDateTimeInputToUtcIso(form.slotEndLocal);

  if (!form.slotStartLocal) {
    errors.slotStartLocal = 'Start date and time are required.';
  } else if (!startIso) {
    errors.slotStartLocal = 'Start date and time are invalid.';
  }

  if (!form.slotEndLocal) {
    errors.slotEndLocal = 'End date and time are required.';
  } else if (!endIso) {
    errors.slotEndLocal = 'End date and time are invalid.';
  }

  if (startIso && endIso && new Date(endIso) <= new Date(startIso)) {
    errors.slotEndLocal = 'End time must be later than start time.';
  }

  const capacity = Number(form.capacityKw);
  if (form.capacityKw === '' || form.capacityKw === null || form.capacityKw === undefined) {
    errors.capacityKw = 'Capacity (kW) is required.';
  } else if (!Number.isFinite(capacity) || capacity <= 0) {
    errors.capacityKw = 'Capacity (kW) must be greater than 0.';
  } else if (
    Number.isFinite(maxCapacityKw) &&
    maxCapacityKw > 0 &&
    capacity > maxCapacityKw
  ) {
    errors.capacityKw = `Capacity cannot exceed the station limit (${maxCapacityKw} kW).`;
  }

  const isValid = Object.keys(errors).length === 0;

  if (!isValid) {
    return { isValid, errors, normalized: null };
  }

  return {
    isValid: true,
    errors: {},
    normalized: {
      slotStartUtc: startIso,
      slotEndUtc: endIso,
      capacityKw: capacity,
      isAvailable: Boolean(form.isAvailable),
    },
  };
};
