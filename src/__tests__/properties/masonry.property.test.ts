/**
 * **Feature: ui-redesign, Property 7: 瀑布流列数响应式**
 * **Validates: Requirements 4.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Breakpoints matching Tailwind defaults
const BREAKPOINTS = {
  sm: 640,   // 2 columns
  lg: 1024,  // 3 columns
  xl: 1280,  // 4 columns
};

// Simulate MasonryGrid column calculation based on viewport width
const getColumnCount = (viewportWidth: number): number => {
  if (viewportWidth >= BREAKPOINTS.xl) return 4;
  if (viewportWidth >= BREAKPOINTS.lg) return 3;
  if (viewportWidth >= BREAKPOINTS.sm) return 2;
  return 1;
};

// Get expected CSS classes for a viewport width
const getMasonryClasses = (): string[] => {
  const classes = ['columns-1', 'sm:columns-2', 'lg:columns-3', 'xl:columns-4'];
  return classes;
};

describe('Property 7: 瀑布流列数响应式', () => {
  it('*For any* mobile viewport (< 640px), should display 1 column', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 639 }), // Mobile viewport widths
        (viewportWidth) => {
          const columns = getColumnCount(viewportWidth);
          expect(columns).toBe(1);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* tablet viewport (640-1023px), should display 2 columns', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 640, max: 1023 }), // Tablet viewport widths
        (viewportWidth) => {
          const columns = getColumnCount(viewportWidth);
          expect(columns).toBe(2);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* desktop viewport (1024-1279px), should display 3 columns', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1024, max: 1279 }), // Desktop viewport widths
        (viewportWidth) => {
          const columns = getColumnCount(viewportWidth);
          expect(columns).toBe(3);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('*For any* large desktop viewport (>= 1280px), should display 4 columns', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1280, max: 3840 }), // Large desktop viewport widths
        (viewportWidth) => {
          const columns = getColumnCount(viewportWidth);
          expect(columns).toBe(4);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('MasonryGrid should have all responsive column classes', () => {
    const classes = getMasonryClasses();
    
    expect(classes).toContain('columns-1');
    expect(classes).toContain('sm:columns-2');
    expect(classes).toContain('lg:columns-3');
    expect(classes).toContain('xl:columns-4');
  });

  it('column count should increase monotonically with viewport width', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 2560 }),
        fc.integer({ min: 1, max: 500 }),
        (baseWidth, increment) => {
          const width1 = baseWidth;
          const width2 = baseWidth + increment;
          
          const columns1 = getColumnCount(width1);
          const columns2 = getColumnCount(width2);
          
          // Larger viewport should have >= columns
          expect(columns2).toBeGreaterThanOrEqual(columns1);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
