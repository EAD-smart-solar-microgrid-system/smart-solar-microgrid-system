/**
 * Prosumer Form Validation Utilities
 *
 * Provides pure, deterministic client-side validation for Sri Lankan prosumer profiles.
 * Formatted for immediate user feedback under Bootstrap 5 form controls.
 * Authoritative business validation is strictly enforced by the C# Web API.
 */

import { normalizeNic } from './prosumerMapper.js';

// Regex Patterns
const OLD_NIC_REGEX = /^\d{9}[VX]$/;
const NEW_NIC_REGEX = /^\d{12}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(0\d{9}|\+94\d{9})$/;

/**
 * Validates Sri Lankan National Identity Card (NIC) number format.
 * Accepts either:
 * - Old format: 9 digits followed by V or X (e.g. 123456789V)
 * - New format: 12 numeric digits (e.g. 199912345678)
 *
 * @param {string|any} nic - Raw or normalized NIC input
 * @returns {boolean} True if NIC matches valid Sri Lankan formats
 */
export const isValidNic = (nic) => {
  const normalized = normalizeNic(nic);
  if (!normalized) return false;
  return OLD_NIC_REGEX.test(normalized) || NEW_NIC_REGEX.test(normalized);
};

/**
 * Validates structural email format.
 *
 * @param {string|any} email - Raw email input
 * @returns {boolean} True if email has valid format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return EMAIL_REGEX.test(trimmed);
};

/**
 * Validates Sri Lankan telephone numbers.
 * Accepts 10 digits starting with 0 (e.g. 0712345678) or +94 followed by 9 digits (e.g. +94712345678).
 * Spaces and hyphens are ignored during format evaluation.
 *
 * @param {string|any} phone - Raw phone input
 * @returns {boolean} True if phone matches supported Sri Lankan formats
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.trim().replace(/[\s-]/g, '');
  return PHONE_REGEX.test(cleaned);
};

/**
 * Validates all prosumer input fields against client-side UX rules.
 *
 * @param {object} values - Form field values
 * @param {object} [options={}] - Validation options
 * @param {boolean} [options.requireNic=true] - Whether NIC is required (set false for update operations)
 * @returns {Record<string, string>} Validation errors keyed by field name
 */
export const validateProsumerForm = (values = {}, options = {}) => {
  const errors = {};
  const { requireNic = true } = options;

  // 1. NIC Validation
  if (requireNic) {
    const rawNic = values.nic !== undefined && values.nic !== null ? String(values.nic).trim() : '';
    if (!rawNic) {
      errors.nic = 'National Identity Card (NIC) is required.';
    } else if (!isValidNic(rawNic)) {
      errors.nic =
        'Invalid NIC format. Enter 9 digits followed by V/X (e.g., 123456789V) or 12 digits (e.g., 199912345678).';
    }
  }

  // 2. Full Name Validation
  const fullName = typeof values.fullName === 'string' ? values.fullName.trim() : '';
  if (!fullName) {
    errors.fullName = 'Full name is required.';
  } else if (fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  // 3. Email Validation
  const email = typeof values.email === 'string' ? values.email.trim() : '';
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address (e.g., user@example.com).';
  }

  // 4. Phone Validation
  const phone = typeof values.phone === 'string' ? values.phone.trim() : '';
  if (!phone) {
    errors.phone = 'Phone number is required.';
  } else if (!isValidPhone(phone)) {
    errors.phone =
      'Invalid phone format. Enter 10 digits starting with 0 (e.g., 0712345678) or +94 followed by 9 digits (e.g., +94712345678).';
  }

  // 5. Address Validation
  const address = typeof values.address === 'string' ? values.address.trim() : '';
  if (!address) {
    errors.address = 'Address is required.';
  } else if (address.length < 5) {
    errors.address = 'Address must be at least 5 characters.';
  }

  return errors;
};

/**
 * Checks if a validation errors object contains any errors.
 *
 * @param {Record<string, string>|null|undefined} errors - Errors object
 * @returns {boolean} True if there is at least one error
 */
export const hasValidationErrors = (errors) => {
  return Boolean(errors && Object.keys(errors).length > 0);
};

export default {
  isValidNic,
  isValidEmail,
  isValidPhone,
  validateProsumerForm,
  hasValidationErrors,
};
