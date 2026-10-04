import React, { useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';

/**
 * Geographic projection bounds for Sri Lanka
 */
const SRI_LANKA_BOUNDS = {
  minLat: 5.75,
  maxLat: 9.95,
  minLng: 79.4,
  maxLng: 82.1,
};

/**
 * Projects latitude / longitude to SVG viewBox coordinates [0, 0, 800, 520]
 */
const projectCoordinate = (lat, lng, width = 800, height = 520) => {
  const paddingX = 140;
  const paddingY = 40;
  const drawWidth = width - paddingX * 2;
  const drawHeight = height - paddingY * 2;

  const validLat = Number.isFinite(Number(lat)) ? Number(lat) : 7.0;
  const validLng = Number.isFinite(Number(lng)) ? Number(lng) : 80.5;

  const clampedLat = Math.max(SRI_LANKA_BOUNDS.minLat, Math.min(SRI_LANKA_BOUNDS.maxLat, validLat));
  const clampedLng = Math.max(SRI_LANKA_BOUNDS.minLng, Math.min(SRI_LANKA_BOUNDS.maxLng, validLng));

  const xFrac = (clampedLng - SRI_LANKA_BOUNDS.minLng) / (SRI_LANKA_BOUNDS.maxLng - SRI_LANKA_BOUNDS.minLng);
  const yFrac = (SRI_LANKA_BOUNDS.maxLat - clampedLat) / (SRI_LANKA_BOUNDS.maxLat - SRI_LANKA_BOUNDS.minLat);

  return {
    x: paddingX + xFrac * drawWidth,
    y: paddingY + yFrac * drawHeight,
  };
};

/**
 * SolarHubMap Component
 *
 * Integrated map for Sri Lanka solar microgrid hubs with orange transmission grid lines,
 * orange selected pin, semantic green active status, and interactive node telemetry inspection.
 */
export const SolarHubMap = ({
  stations = [],
  selectedStation = null,
  onSelectStation = () => {},
  className = '',
}) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredStation, setHoveredStation] = useState(null);

  // Filter stations based on search query
  const filteredStations = useMemo(() => {
    if (!searchQuery.trim()) return stations;
    const q = searchQuery.toLowerCase().trim();
    return stations.filter((s) => {
      const name = (s.stationName || '').toLowerCase();
      const hubId = (s.hubId || '').toLowerCase();
      return name.includes(q) || hubId.includes(q);
    });
  }, [stations, searchQuery]);

  // Project coordinates for all filtered stations
  const stationsWithCoords = useMemo(() => {
    return filteredStations.map((station) => {
      const { x, y } = projectCoordinate(station.latitude, station.longitude);
      return {
        ...station,
        projX: x,
        projY: y,
        isActive: (station.status || '').toLowerCase() === 'active',
      };
    });
  }, [filteredStations]);

  // Build grid transmission lines between active hubs (ordered by latitude)
  const activeStations = useMemo(() => {
    return stationsWithCoords
      .filter((s) => s.isActive)
      .sort((a, b) => (Number(a.latitude) || 0) - (Number(b.latitude) || 0));
  }, [stationsWithCoords]);

  const gridLinePath = useMemo(() => {
    if (activeStations.length < 2) return '';
    return activeStations.reduce((path, s, idx) => {
      if (idx === 0) return `M ${s.projX} ${s.projY}`;
      return `${path} L ${s.projX} ${s.projY}`;
    }, '');
  }, [activeStations]);

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-[var(--shadow-card)] ${className}`}
    >
      {/* MAP HEADER / CONTROLS */}
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

        {/* Search station input */}
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

      {/* SVG INTERACTIVE MAP VIEWPORT */}
      <div className={`relative h-[360px] sm:h-[440px] w-full overflow-hidden ${isDark ? 'bg-[#141415]' : 'bg-[#F2F2F3]'}`}>
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(${isDark ? '#E3511B' : '#77777A'} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <svg
          viewBox="0 0 800 520"
          className="h-full w-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Glow filter for transmission lines */}
            <filter id="solar-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="grid-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E3511B" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F05A20" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#B64319" stopOpacity="0.75" />
            </linearGradient>

            {/* Sri Lanka simplified topographic gradient */}
            <radialGradient id="island-fill" cx="50%" cy="55%" r="48%">
              <stop offset="0%" stopColor={isDark ? '#222224' : '#E6E6E8'} />
              <stop offset="70%" stopColor={isDark ? '#1B1B1C' : '#DFDFE1'} />
              <stop offset="100%" stopColor={isDark ? '#171718' : '#D6D6D8'} />
            </radialGradient>
          </defs>

          {/* SRI LANKA GEOGRAPHIC SILHOUETTE */}
          <g className="island-landmass">
            <path
              d="M 400 65 
                 C 440 95, 475 140, 480 200 
                 C 485 260, 520 310, 505 380 
                 C 495 425, 455 460, 410 470 
                 C 365 480, 320 445, 305 395 
                 C 290 345, 300 290, 310 240 
                 C 320 190, 345 130, 370 85 
                 Z"
              fill="url(#island-fill)"
              stroke={isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.12)'}
              strokeWidth="1.5"
            />

            {/* Internal topography contour rings */}
            <path
              d="M 395 180 C 435 220, 450 300, 430 360 C 410 410, 360 410, 345 365 C 330 320, 345 230, 395 180 Z"
              fill="none"
              stroke={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <path
              d="M 405 240 C 430 270, 435 320, 415 350 C 395 380, 365 370, 360 340 C 355 310, 375 260, 405 240 Z"
              fill="none"
              stroke={isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'}
              strokeWidth="1"
            />
          </g>

          {/* GLOWING TRANSMISSION GRID LINES */}
          {gridLinePath && (
            <g className="grid-lines" filter="url(#solar-glow)">
              <path
                d={gridLinePath}
                fill="none"
                stroke="#E3511B"
                strokeWidth="4"
                strokeOpacity="0.22"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={gridLinePath}
                fill="none"
                stroke="url(#grid-line-grad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8 6"
                className="animate-pulse"
              />
            </g>
          )}

          {/* STATION NODES / MARKER PINS */}
          {stationsWithCoords.map((st) => {
            const isSelected = selectedStation?.hubId === st.hubId;
            const isHovered = hoveredStation?.hubId === st.hubId;
            const isActive = st.isActive;

            // Selected pin uses orange accent #E3511B
            // Active status uses green #22C55E
            // Inactive uses muted gray
            const markerColor = isSelected
              ? '#E3511B'
              : isActive
              ? '#22C55E'
              : '#77777A';

            const badgeRadius = isSelected ? 18 : isHovered ? 16 : 14;

            return (
              <g
                key={st.hubId || `${st.latitude}-${st.longitude}`}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectStation(st)}
                onMouseEnter={() => setHoveredStation(st)}
                onMouseLeave={() => setHoveredStation(null)}
                tabIndex={0}
                role="button"
                aria-label={`Select ${st.stationName}, Hub ID ${st.hubId}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectStation(st);
                  }
                }}
              >
                {/* Active or selected beacon ring */}
                {(isActive || isSelected) && (
                  <circle
                    cx={st.projX}
                    cy={st.projY}
                    r={isSelected ? 30 : 22}
                    fill={markerColor}
                    fillOpacity={isSelected ? 0.25 : 0.12}
                    filter="url(#solar-glow)"
                    className={isSelected ? 'animate-ping' : ''}
                  />
                )}

                {/* Selected highlight ring */}
                {isSelected && (
                  <circle
                    cx={st.projX}
                    cy={st.projY}
                    r={badgeRadius + 6}
                    fill="none"
                    stroke="#E3511B"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                )}

                {/* Pin body */}
                <circle
                  cx={st.projX}
                  cy={st.projY}
                  r={badgeRadius}
                  fill={isDark ? (isSelected ? '#202021' : '#1B1B1C') : '#FFFFFF'}
                  stroke={markerColor}
                  strokeWidth={isSelected ? 2.5 : 2}
                  filter={isSelected ? 'url(#solar-glow)' : undefined}
                />

                {/* Inner Bolt Icon (⚡) */}
                <text
                  x={st.projX}
                  y={st.projY + 4}
                  textAnchor="middle"
                  fontSize={isSelected ? '14' : '11'}
                  fontWeight="bold"
                  fill={markerColor}
                >
                  ⚡
                </text>

                {/* Hub label pin header */}
                <g transform={`translate(${st.projX}, ${st.projY - badgeRadius - 8})`}>
                  <rect
                    x={-55}
                    y={-18}
                    width={110}
                    height={20}
                    rx={6}
                    fill={isDark ? '#171718' : '#FFFFFF'}
                    fillOpacity={0.95}
                    stroke={isSelected ? '#E3511B' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    strokeWidth="1"
                  />
                  <text
                    x={0}
                    y={-4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill={isSelected ? '#E3511B' : isDark ? '#F5F5F5' : '#171717'}
                  >
                    {(st.stationName || '').split(' ')[0]}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Floating Legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/90 px-3 py-1.5 text-[10px] font-semibold text-[var(--text-muted)] backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#E3511B]" />
            <span className="text-[var(--text-primary)]">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
            <span>Active Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#77777A]" />
            <span>Inactive</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolarHubMap;
