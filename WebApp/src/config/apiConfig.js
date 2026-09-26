const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5278';

export const apiConfig = Object.freeze({
  baseUrl: configuredBaseUrl.trim().replace(/\/+$/, ''),
});

export default apiConfig;
