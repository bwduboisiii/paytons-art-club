'use client';

import { useState, useEffect } from 'react';

/**
 * Reliable mobile detection: true if viewport is narrow AND device has touch.
 *
 * Why both checks:
 *   - viewport alone catches desktop users who resized their window (false positive)
 *   - touch alone catches laptops with touchscreens (false positive)
 *   - combined: phones & small tablets, not laptops
 *
 * Breakpoint: 768px (matches Tailwind `md:`). Phones are typically 320-428px wide,
 * so 768 gives us headroom for small tablets in portrait.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() {
      const narrow = window.innerWidth < breakpoint;
      const touch =
        'ontouchstart' in window ||
        (navigator as any).maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
      setIsMobile(narrow && touch);
    }
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, [breakpoint]);

  return isMobile;
}

/**
 * Narrower variant: just checks viewport width.
 * Use when you want layout to adapt purely based on width (not touch).
 */
export function useIsNarrow(breakpoint = 768): boolean {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    function check() {
      setIsNarrow(window.innerWidth < breakpoint);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isNarrow;
}
