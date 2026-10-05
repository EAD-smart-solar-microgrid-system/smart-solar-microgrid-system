import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPasswordRequirements,
  validateLogin,
  validateNewPassword,
  validateStaffAccount,
} from './authValidation.js';

test('staff account validation accepts supported account fields', () => {
  assert.deepEqual(validateStaffAccount({
    username: 'operator_colombo',
    email: 'operator@example.com',
    role: 'GridOperator',
  }), {});
});

test('staff account validation rejects unsafe username and invalid email', () => {
  const errors = validateStaffAccount({ username: '_bad user', email: 'invalid', role: 'Owner' });
  assert.ok(errors.username);
  assert.ok(errors.email);
  assert.ok(errors.role);
});

test('login validation preserves passwords while enforcing size boundaries', () => {
  assert.deepEqual(validateLogin({ identifier: ' admin@example.com ', password: ' Password123 ' }), {});
  assert.ok(validateLogin({ identifier: '', password: '' }).identifier);
  assert.ok(validateLogin({ identifier: 'admin', password: 'x'.repeat(129) }).password);
});

test('new password validation requires a valid token, strength, and confirmation', () => {
  const token = 'A'.repeat(64);
  assert.deepEqual(validateNewPassword({ password: 'NewPassword123', confirmPassword: 'NewPassword123', token }), {});
  assert.ok(validateNewPassword({ password: 'password', confirmPassword: 'different', token: 'bad' }).password);
  assert.deepEqual(getPasswordRequirements('NewPassword123'), {
    length: true,
    uppercase: true,
    lowercase: true,
    number: true,
  });
});
