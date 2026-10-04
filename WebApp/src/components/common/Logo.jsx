import React from 'react';
import brandLogo from '../../assets/brand-logo.png';

/**
 * Official Brand Logo Component for Smart Solar Microgrid Trading System.
 * Displays the official graphic with sunburst, solar panels, and microgrid substation.
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg' | 'xl' | number} [props.size='md'] - Size preset or height in px
 * @param {string} [props.className=''] - Extra classes for container
 * @param {string} [props.imageClassName=''] - Extra classes for img element
 */
export const Logo = ({
  size = 'md',
  className = '',
  imageClassName = '',
}) => {
  const heightClasses = {
    sm: 'h-8 max-w-[140px]',
    md: 'h-11 max-w-[190px]',
    lg: 'h-16 max-w-[260px]',
    xl: 'h-24 max-w-[360px]',
  };

  const chosenClass = typeof size === 'number' ? `h-[${size}px]` : (heightClasses[size] || 'h-11 max-w-[190px]');

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      <img
        src={brandLogo}
        alt="Smart Solar Microgrid Trading System"
        className={`${chosenClass} w-auto object-contain transition-transform duration-300 hover:scale-[1.02] ${imageClassName}`}
      />
    </div>
  );
};

export default Logo;

