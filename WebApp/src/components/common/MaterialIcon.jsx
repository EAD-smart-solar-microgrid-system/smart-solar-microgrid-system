import React from 'react';

/**
 * Standard Google Material Design SVG icon definitions.
 * 24x24 viewBox, standard 2px stroke or filled geometric paths.
 */
const ICONS = {
  // Energy & Solar
  bolt: (
    <path
      fill="currentColor"
      d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .73.27.63.48L11 21z"
    />
  ),
  solar_power: (
    <path
      fill="currentColor"
      d="M12 2a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm6.364 2.636a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0zM22 11a1 1 0 0 1-1 1h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zM7.05 6.05a1 1 0 0 1-1.414 0L4.222 4.636a1 1 0 0 1 1.414-1.414L7.05 4.636a1 1 0 0 1 0 1.414zM3 11a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm1 3.5h16a1 1 0 0 1 .98 1.196l-1.5 7.5A1 1 0 0 1 18.5 24H5.5a1 1 0 0 1-.98-.804l-1.5-7.5A1 1 0 0 1 4 14.5zm2.84 7.5h3.66v-3H6.24l.6 3zm5.66 0h3.66l.6-3h-4.26v3zm-5.06-5h4.06v-2.5H6.84l.6 2.5zm5.06-2.5V17h4.06l.6-2.5H12.5z"
    />
  ),
  battery: (
    <path
      fill="currentColor"
      d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM11 20v-5.5H9L13 7v5.5h2L11 20z"
    />
  ),
  hub: (
    <path
      fill="currentColor"
      d="M12 2a3 3 0 0 0-3 3c0 .35.06.68.18.99L5.99 9.18A3.003 3.003 0 0 0 2 12a3 3 0 0 0 3.99 2.82l3.19 3.19c-.12.31-.18.64-.18.99a3 3 0 1 0 3-3c-.35 0-.68.06-.99-.18l-3.19-3.19c.12-.31.18-.64.18-.99 0-.35-.06-.68-.18-.99l3.19-3.19c.31.12.64.18.99.18a3 3 0 1 0 3-3c0-.35-.06-.68-.18-.99l3.19-3.19c.31.12.64.18.99.18a3 3 0 1 0-3-3c-.35 0-.68.06-.99.18L12.99 5.82c-.31-.12-.64-.18-.99-.18z"
    />
  ),
  grid: (
    <path
      fill="currentColor"
      d="M3 3h8v8H3V3zm0 10h8v8H3v-8zM13 3h8v8h-8V3zm0 10h8v8h-8v-8z"
    />
  ),
  table_chart: (
    <path
      fill="currentColor"
      d="M10 10.02h5V21h-5V10.02zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H4c-1.1 0-2 .9-2 2v3h20V5c0-1.1-.9-2-2-2zM2 10v9c0 1.1.9 2 2 2h4v-11H2z"
    />
  ),
  pause: (
    <path
      fill="currentColor"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
    />
  ),
  group: (
    <path
      fill="currentColor"
      d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
    />
  ),
  person: (
    <path
      fill="currentColor"
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
    />
  ),
  hourglass: (
    <path
      fill="currentColor"
      d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z"
    />
  ),
  check_circle: (
    <path
      fill="currentColor"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
    />
  ),
  schedule: (
    <path
      fill="currentColor"
      d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
    />
  ),
  event: (
    <path
      fill="currentColor"
      d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
    />
  ),
  location: (
    <path
      fill="currentColor"
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
    />
  ),
  refresh: (
    <path
      fill="currentColor"
      d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
    />
  ),
  search: (
    <path
      fill="currentColor"
      d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
    />
  ),
  filter_list: (
    <path
      fill="currentColor"
      d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"
    />
  ),
  add: (
    <path
      fill="currentColor"
      d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
    />
  ),
  edit: (
    <path
      fill="currentColor"
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
    />
  ),
  more_horiz: (
    <path
      fill="currentColor"
      d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
    />
  ),
  shield: (
    <path
      fill="currentColor"
      d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"
    />
  ),
};

/**
 * MaterialIcon Component
 * Renders high-fidelity, crisp Google Material Design icons.
 * Defaults to pure white color (`text-white`), ideal for dark dashboards.
 *
 * @param {Object} props
 * @param {string} props.name - Name of the material icon (e.g. 'bolt', 'solar_power', 'battery')
 * @param {string} [props.className='text-white'] - Tailwind classes for sizing and color
 * @param {number} [props.size=20] - Width/height in pixels
 */
export const MaterialIcon = ({
  name,
  className = 'text-white',
  size = 20,
  ...rest
}) => {
  const path = ICONS[name];

  if (!path) {
    // If not in SVG map, fallback to Material Symbols Google font
    return (
      <span
        className={`material-symbols-outlined select-none inline-flex items-center justify-center leading-none ${className}`}
        style={{ fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }}
        aria-hidden="true"
        {...rest}
      >
        {name}
      </span>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`shrink-0 select-none inline-block ${className}`}
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      {path}
    </svg>
  );
};

export default MaterialIcon;
