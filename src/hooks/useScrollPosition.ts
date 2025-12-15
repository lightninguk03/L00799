import { useState, useEffect, useRef } from 'react';

interface ScrollPosition {
  scrollY: number;
  isScrolled: boolean;
  direction: 'up' | 'down' | 'none';
}

/**
 * Hook to track scroll position and direction
 * @param threshold - Scroll threshold to consider "scrolled" (default: 100px)
 * @returns ScrollPosition object with scrollY, isScrolled, and direction
 */
export function useScrollPosition(threshold: number = 100): ScrollPosition {
  const [scrollY, setScrollY] = useState(0);
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine scroll direction
      if (currentScrollY > lastScrollY.current) {
        setDirection('down');
      } else if (currentScrollY < lastScrollY.current) {
        setDirection('up');
      }
      
      setScrollY(currentScrollY);
      lastScrollY.current = currentScrollY;
    };

    // Set initial value
    setScrollY(window.scrollY);
    lastScrollY.current = window.scrollY;

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return {
    scrollY,
    isScrolled: scrollY > threshold,
    direction,
  };
}

export default useScrollPosition;
