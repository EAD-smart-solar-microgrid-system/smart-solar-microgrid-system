/**
 * Session Storage Utility
 *
 * Encapsulates browser sessionStorage access.
 * Stores ONLY:
 * - authentication token
 * - user identifier
 * - role
 * - login state
 *
 * Passwords and sensitive personal details must NEVER be stored here.
 */

const STORAGE_KEYS = Object.freeze({
  TOKEN: 'ssm_auth_token',
  USER_ID: 'ssm_user_id',
  ROLE: 'ssm_user_role',
  IS_LOGGED_IN: 'ssm_is_logged_in',
});

/**
 * Saves authenticated session data.
 * @param {object} session
 * @param {string} session.token - Authentication bearer token
 * @param {string} session.userId - User identifier
 * @param {string} session.role - User role
 */
export const saveSession = ({ token, userId, role }) => {
  try {
    if (token) sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
    if (userId) sessionStorage.setItem(STORAGE_KEYS.USER_ID, String(userId));
    if (role) sessionStorage.setItem(STORAGE_KEYS.ROLE, role);
    sessionStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
  } catch (err) {
    console.warn('[sessionStorage] Failed to save session:', err);
  }
};

/**
 * Retrieves the stored authentication token.
 * @returns {string | null}
 */
export const getToken = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch {
    return null;
  }
};

/**
 * Retrieves the stored user identifier.
 * @returns {string | null}
 */
export const getUserId = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.USER_ID);
  } catch {
    return null;
  }
};

/**
 * Retrieves the stored user role.
 * @returns {string | null}
 */
export const getRole = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.ROLE);
  } catch {
    return null;
  }
};

/**
 * Determines whether an active session exists in sessionStorage.
 * @returns {boolean}
 */
export const hasSession = () => {
  try {
    return (
      sessionStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN) === 'true' &&
      Boolean(sessionStorage.getItem(STORAGE_KEYS.TOKEN))
    );
  } catch {
    return false;
  }
};

/**
 * Clears all stored session items.
 */
export const clearSession = () => {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER_ID);
    sessionStorage.removeItem(STORAGE_KEYS.ROLE);
    sessionStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
  } catch (err) {
    console.warn('[sessionStorage] Failed to clear session:', err);
  }
};

export default {
  saveSession,
  getToken,
  getUserId,
  getRole,
  hasSession,
  clearSession,
};
