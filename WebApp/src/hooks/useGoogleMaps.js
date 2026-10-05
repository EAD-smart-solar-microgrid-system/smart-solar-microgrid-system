import { useEffect, useState } from 'react';

const SCRIPT_ID = 'google-maps-js';

/**
 * Loads the Google Maps JavaScript API once (same provider as the Android app).
 */
export function useGoogleMaps(apiKey) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!apiKey?.trim()) {
      setLoadError('Set VITE_GOOGLE_MAPS_API_KEY to the same Google Maps key used in Android secrets.properties.');
      setIsLoaded(false);
      return;
    }

    if (window.google?.maps) {
      setIsLoaded(true);
      setLoadError(null);
      return;
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      const onLoad = () => {
        setIsLoaded(Boolean(window.google?.maps));
        setLoadError(null);
      };
      existing.addEventListener('load', onLoad);
      if (window.google?.maps) onLoad();
      return () => existing.removeEventListener('load', onLoad);
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey.trim())}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(Boolean(window.google?.maps));
      setLoadError(null);
    };
    script.onerror = () => {
      setLoadError('Failed to load Google Maps. Check the API key and enable Maps JavaScript API.');
      setIsLoaded(false);
    };
    document.head.appendChild(script);
  }, [apiKey]);

  return { isLoaded, loadError };
}
