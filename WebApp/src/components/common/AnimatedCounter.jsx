import React, { useState, useEffect } from 'react';

/**
 * AnimatedCounter component that smoothly animates a number from 0 to target value.
 * Uses requestAnimationFrame with quartic ease-out for a smooth deceleration feel.
 * Respects user's prefers-reduced-motion setting and uses tabular-nums for jitter-free animation.
 */
export const AnimatedCounter = ({
  value = 0,
  duration = 1500,
  start = true,
  className = '',
  formatter,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const target = Number(value) || 0;

  useEffect(() => {
    if (!start) {
      setDisplayValue(0);
      setIsFinished(false);
      return;
    }

    if (target === 0) {
      setDisplayValue(0);
      setIsFinished(true);
      return;
    }

    // Respect user's accessibility preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (prefersReducedMotion) {
      setDisplayValue(target);
      setIsFinished(true);
      return;
    }

    let startTime = null;
    let animationFrameId = null;

    const step = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      // Quartic ease-out: brisk start, ultra-smooth gentle glide into final number
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.round(easeProgress * target);

      setDisplayValue(currentCount);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
        setIsFinished(true);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [start, target, duration]);

  const output = formatter ? formatter(displayValue) : displayValue;

  return (
    <span
      className={`inline-block tabular-nums transition-transform duration-300 ${isFinished ? 'scale-100' : 'scale-95'} ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {output}
    </span>
  );
};

export default AnimatedCounter;
