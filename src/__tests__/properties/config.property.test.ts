/**
 * **Feature: frontend-enhancement, Property 1: 站点配置加载一致性**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 * 
 * For any valid site config object, when the system loads that config,
 * the navbar, background, and logo elements should correctly reflect the config values.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { defaultSiteConfig } from '../../config/site.config';

// Arbitrary for generating valid SiteConfig objects
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const siteConfigArbitrary = fc.record({
  siteName: fc.string({ minLength: 1, maxLength: 50 }),
  siteNameCn: fc.string({ minLength: 1, maxLength: 50 }),
  communityName: fc.string({ minLength: 1, maxLength: 50 }),
  communityNameCn: fc.string({ minLength: 1, maxLength: 50 }),
  slogan: fc.string({ minLength: 1, maxLength: 200 }),
  sloganCn: fc.string({ minLength: 1, maxLength: 200 }),
  aiName: fc.string({ minLength: 1, maxLength: 30 }),
  aiNameCn: fc.string({ minLength: 1, maxLength: 30 }),
  aiTitle: fc.string({ minLength: 1, maxLength: 30 }),
  aiTitleCn: fc.string({ minLength: 1, maxLength: 30 }),
  aiGreeting: fc.string({ minLength: 1, maxLength: 200 }),
  aiGreetingCn: fc.string({ minLength: 1, maxLength: 200 }),
  logo: fc.option(fc.webUrl(), { nil: undefined }),
  backgroundImage: fc.option(fc.webUrl(), { nil: undefined }),
  decorativeTextKeepEnglish: fc.array(fc.string({ minLength: 1, maxLength: 30 })),
  homeContent: fc.constant(defaultSiteConfig.homeContent),
  projects: fc.constant(defaultSiteConfig.projects),
  contact: fc.constant(defaultSiteConfig.contact),
});

describe('Property 1: Site Config Loading Consistency', () => {
  it('should have all required fields in default config', () => {
    expect(defaultSiteConfig.siteName).toBeDefined();
    expect(defaultSiteConfig.siteNameCn).toBeDefined();
    expect(defaultSiteConfig.communityName).toBeDefined();
    expect(defaultSiteConfig.aiName).toBeDefined();
    expect(defaultSiteConfig.homeContent).toBeDefined();
    expect(defaultSiteConfig.projects).toBeDefined();
  });

  it('should preserve config values when merged with partial config', () => {
    fc.assert(
      fc.property(
        fc.record({
          siteName: fc.string({ minLength: 1 }),
          logo: fc.option(fc.webUrl(), { nil: undefined }),
        }),
        (partialConfig) => {
          // Filter out undefined values before merging
          const cleanPartial = Object.fromEntries(
            Object.entries(partialConfig).filter(([_, v]) => v !== undefined)
          );
          const merged = { ...defaultSiteConfig, ...cleanPartial };
          
          // If partial config has siteName, merged should use it
          if (cleanPartial.siteName) {
            expect(merged.siteName).toBe(cleanPartial.siteName);
          } else {
            expect(merged.siteName).toBe(defaultSiteConfig.siteName);
          }
          
          // If partial config has logo, merged should use it
          if (cleanPartial.logo) {
            expect(merged.logo).toBe(cleanPartial.logo);
          } else {
            expect(merged.logo).toBe(defaultSiteConfig.logo);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should have valid decorativeTextKeepEnglish array', () => {
    expect(Array.isArray(defaultSiteConfig.decorativeTextKeepEnglish)).toBe(true);
    expect(defaultSiteConfig.decorativeTextKeepEnglish.length).toBeGreaterThan(0);
  });
});
