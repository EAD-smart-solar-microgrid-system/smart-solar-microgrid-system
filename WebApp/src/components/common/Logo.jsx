import React from 'react';
import brandEmblem from '../../assets/brand-emblem.png';
import brandFullLogo from '../../assets/brand-logo.png';

/**
 * Visual Brand Concept Logo Component for Smart Solar Microgrid.
 * Uses the custom sunburst & microgrid circuit emblem.
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg' | 'xl' | number} [props.size='md'] - Size preset or pixel dimensions
 * @param {'emblem' | 'full'} [props.variant='emblem'] - 'emblem' shows the icon, 'full' shows the complete badge
 * @param {boolean} [props.showText=true] - Whether to show the text beside the emblem
 * @param {'light' | 'dark'} [props.theme='dark'] - 'dark' for dark navbar, 'light' for light cards
 * @param {string} [props.className=''] - Extra classes for container
 * @param {string} [props.textClass=''] - Extra classes for text
 */
export const Logo = ({
  size = 'md',
  variant = 'emblem',
  title = 'SolarGrid',
  subtitle = null,
  showText = true,
  theme = 'dark',
  className = '',
  textClass = '',
}) => {
  const sizeMap = {
    sm: 30,
    md: 38,
    lg: 56,
    xl: 80,
  };

  const pixelSize = typeof size === 'number' ? size : sizeMap[size] || 38;

  if (variant === 'full') {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src={brandFullLogo}
          alt="SolarGrid Trading System"
          width={pixelSize * 2.5}
          height={pixelSize * 2.5}
          className="rounded-2xl shadow-sm object-contain transition-transform duration-300 hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Visual Brand Concept Emblem */}
      <div
        className="relative shrink-0 overflow-hidden rounded-xl bg-slate-900 border border-slate-700/60 shadow-md transition-transform duration-300 hover:scale-105"
        style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}
      >
        <img
          src={brandEmblem}
          alt="SolarGrid Emblem"
          className="h-full w-full object-cover"
          loading="eager"
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className={`flex flex-col leading-tight ${textClass}`}>
          <span
            className={`font-bold tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            } ${size === 'lg' || size === 'xl' ? 'text-xl' : 'text-base sm:text-lg'}`}
          >
            {title}
          </span>
          {subtitle && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                theme === 'light' ? 'text-amber-600' : 'text-amber-400'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
