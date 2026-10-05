import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import appConfig from '../../config/appConfig.js';
import { useGoogleMaps } from '../../hooks/useGoogleMaps.js';
import { darkMapStyles } from '../../utils/googleMapStyles.js';

const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 };
const DEFAULT_ZOOM = 7;

const buildPinIcon = (google, color, scale = 1) => {
  const width = 32 * scale;
  const height = 42 * scale;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z"/>
    <circle cx="16" cy="15" r="5.5" fill="#ffffff"/>
    <text x="16" y="18" text-anchor="middle" font-size="9" font-weight="bold" fill="${color}">⚡</text>
  </svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(width / 2, height),
  };
};

/**
 * SolarHubMap — Google Maps view of microgrid stations (same API as Android).
 */
export const SolarHubMap = ({
  stations = [],
  selectedStation = null,
  onSelectStation = () => {},
  className = '',
}) => {
  const { isDark } = useTheme();
  const { isLoaded, loadError } = useGoogleMaps(appConfig.googleMapsApiKey);
  const [searchQuery, setSearchQuery] = useState('');

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return stations;
    const q = searchQuery.toLowerCase().trim();
    return stations.filter((s) => {
      const name = (s.stationName || '').toLowerCase();
      const hubId = (s.hubId || '').toLowerCase();
      return name.includes(q) || hubId.includes(q);
    });
  }, [stations, searchQuery]);

  const stationsWithCoords = useMemo(() => {
    return filteredStations
      .map((station) => {
        const lat = Number(station.latitude);
        const lng = Number(station.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return {
          ...station,
          lat,
          lng,
          isActive: (station.status || '').toLowerCase() === 'active',
        };
      })
      .filter(Boolean);
  }, [filteredStations]);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current) return;

    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: SRI_LANKA_CENTER,
      zoom: DEFAULT_ZOOM,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: isDark ? darkMapStyles : [],
    });
  }, [isLoaded, isDark]);

  // Update map theme when dark mode toggles
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setOptions({ styles: isDark ? darkMapStyles : [] });
  }, [isDark]);

  // Markers and bounds
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();
    let hasBounds = false;

    const google = window.google;

    stationsWithCoords.forEach((st) => {
      const isSelected = selectedStation?.hubId === st.hubId;
      const color = isSelected ? '#E3511B' : st.isActive ? '#22C55E' : '#77777A';
      const position = { lat: st.lat, lng: st.lng };

      const marker = new google.maps.Marker({
        map: mapRef.current,
        position,
        title: st.stationName || st.hubId,
        icon: buildPinIcon(google, color, isSelected ? 1.15 : 1),
        zIndex: isSelected ? 1000 : st.isActive ? 100 : 1,
      });

      marker.addListener('click', () => onSelectStation(st));
      markersRef.current.push(marker);
      bounds.extend(position);
      hasBounds = true;
    });

    if (hasBounds) {
      mapRef.current.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
      const listener = window.google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
        const zoom = mapRef.current.getZoom();
        if (zoom > 9) mapRef.current.setZoom(9);
      });
      return () => window.google.maps.event.removeListener(listener);
    }
  }, [isLoaded, stationsWithCoords, selectedStation, onSelectStation]);

  // Pan to selected station
  useEffect(() => {
    if (!mapRef.current || !selectedStation) return;
    const lat = Number(selectedStation.latitude);
    const lng = Number(selectedStation.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    mapRef.current.panTo({ lat, lng });
  }, [selectedStation]);

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E3511B]/15 text-[#E3511B]">
            📍
          </span>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              Sri Lanka Microgrid Hub Network
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              {stationsWithCoords.length} Hub{stationsWithCoords.length === 1 ? '' : 's'} Synchronized · Live Dispatch
            </p>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search hub name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-44 sm:w-56 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-1.5 pl-8 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition focus:border-[#E3511B] focus:ring-1 focus:ring-[#E3511B]"
          />
          <svg
            className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--text-muted)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className={`relative h-[360px] sm:h-[440px] w-full ${isDark ? 'bg-[#141415]' : 'bg-[#F2F2F3]'}`}>
        {!appConfig.googleMapsApiKey && (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Google Maps API key required</p>
            <p className="text-xs text-[var(--text-muted)] max-w-md">
              Add <code className="text-[#E3511B]">VITE_GOOGLE_MAPS_API_KEY</code> to your WebApp <code>.env</code> file
              using the same key as Android <code>MAPS_API_KEY</code>. Enable <strong>Maps JavaScript API</strong> in Google Cloud.
            </p>
          </div>
        )}

        {appConfig.googleMapsApiKey && loadError && (
          <div className="flex h-full items-center justify-center px-6 text-center text-xs text-[#EF4444]">
            {loadError}
          </div>
        )}

        {appConfig.googleMapsApiKey && !loadError && !isLoaded && (
          <div className="flex h-full items-center justify-center text-xs text-[var(--text-muted)]">
            Loading map…
          </div>
        )}

        <div
          ref={mapContainerRef}
          className={`h-full w-full ${!isLoaded || loadError || !appConfig.googleMapsApiKey ? 'hidden' : ''}`}
          aria-label="Google Maps microgrid hub network"
        />

        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90 px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <svg className="h-3.5 w-2.5 shrink-0" viewBox="0 0 32 42" aria-hidden="true">
              <path fill="#E3511B" stroke="#fff" strokeWidth="1.5" d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" />
            </svg>
            <span className="text-[var(--text-primary)]">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-3.5 w-2.5 shrink-0" viewBox="0 0 32 42" aria-hidden="true">
              <path fill="#22C55E" stroke="#fff" strokeWidth="1.5" d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" />
            </svg>
            <span>Active Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-3.5 w-2.5 shrink-0" viewBox="0 0 32 42" aria-hidden="true">
              <path fill="#77777A" stroke="#fff" strokeWidth="1.5" d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" />
            </svg>
            <span>Inactive</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarHubMap;
