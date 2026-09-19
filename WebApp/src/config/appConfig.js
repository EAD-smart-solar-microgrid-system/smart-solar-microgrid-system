/**
 * Application Configuration
 *
 * Reads configuration from Vite environment variables.
 * Sensitive items such as credentials, JWT secrets, and database strings
 * must NEVER be placed here or in client-side code.
 */

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!rawBaseUrl && import.meta.env.DEV) {
  console.error(
    '[appConfig] Missing VITE_API_BASE_URL environment variable! ' +
    'Please verify your .env file matches .env.example (e.g. http://localhost:5000/api).'
  );
}

// Safely sanitize trailing slashes from the base URL
const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/+$/, '');
};

export const appConfig = Object.freeze({
  apiBaseUrl: sanitizeUrl(rawBaseUrl || 'http://localhost:5000/api'),
  isDevelopment: Boolean(import.meta.env.DEV),
  isProduction: Boolean(import.meta.env.PROD),
});

export default appConfig;
