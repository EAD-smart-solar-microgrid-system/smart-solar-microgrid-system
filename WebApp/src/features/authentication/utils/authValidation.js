const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*[A-Za-z0-9]$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_PATTERN = /^[A-Fa-f0-9]{64}$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const validateLogin = ({ identifier = '', password = '' } = {}) => {
  const errors = {};
  const normalizedIdentifier = String(identifier).trim();

  if (!normalizedIdentifier) {
    errors.identifier = 'Username or email is required.';
  } else if (normalizedIdentifier.length > 254) {
    errors.identifier = 'Username or email must not exceed 254 characters.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Password must not exceed ${PASSWORD_MAX_LENGTH} characters.`;
  }

  return errors;
};

export const validateEmail = (email, { requiredMessage = 'Email is required.' } = {}) => {
  const value = typeof email === 'string' ? email.trim() : '';
  if (!value) return requiredMessage;
  if (value.length > 254) return 'Email must not exceed 254 characters.';
  return EMAIL_PATTERN.test(value) ? null : 'Enter a valid email address.';
};

export const validateStaffAccount = ({ username = '', email = '', role = '' } = {}) => {
  const errors = {};
  const normalizedUsername = String(username).trim();

  if (!normalizedUsername) {
    errors.username = 'Username is required.';
  } else if (normalizedUsername.length < 3 || normalizedUsername.length > 50) {
    errors.username = 'Username must be between 3 and 50 characters.';
  } else if (!USERNAME_PATTERN.test(normalizedUsername)) {
    errors.username = 'Use letters, numbers, dots, underscores, or hyphens; start and end with a letter or number.';
  }

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  if (!['Backoffice', 'GridOperator'].includes(role)) {
    errors.role = 'Select Administrator or Grid Operator.';
  }

  return errors;
};

export const getPasswordRequirements = (password = '') => ({
  length: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /\d/.test(password),
});

export const validateNewPassword = ({ password = '', confirmPassword = '', token = '' } = {}) => {
  const errors = {};
  const requirements = getPasswordRequirements(password);

  if (!TOKEN_PATTERN.test(String(token).trim())) {
    errors.token = 'The account link is missing or invalid.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (!requirements.length) {
    errors.password = `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`;
  } else if (!requirements.uppercase || !requirements.lowercase || !requirements.number) {
    errors.password = 'Password must include an uppercase letter, a lowercase letter, and a number.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};

export const firstValidationMessage = (errors = {}) => Object.values(errors)[0] || '';

export const hasValidationErrors = (errors = {}) => Object.keys(errors).length > 0;

export const getApiValidationMessage = (payload, fallback) => {
  if (payload?.message) return payload.message;
  const modelErrors = payload?.errors;
  if (modelErrors && typeof modelErrors === 'object') {
    const first = Object.values(modelErrors).flat().find(Boolean);
    if (first) return String(first);
  }
  return fallback;
};
