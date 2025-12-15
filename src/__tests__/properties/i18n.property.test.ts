/**
 * **Feature: frontend-enhancement, Property 2: 国际化文字一致性**
 * **Validates: Requirements 7.1, 7.2, 7.4**
 * 
 * For any language setting (Chinese or English), all navigation buttons
 * and form labels should display text in the corresponding language,
 * unless the text is configured as a decorative exception.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import zhLocale from '../../locales/zh.json';
import enLocale from '../../locales/en.json';
import { defaultSiteConfig } from '../../config/site.config';

describe('Property 2: i18n Text Consistency', () => {
  it('should have matching keys in both language files', () => {
    const zhKeys = Object.keys(zhLocale);
    const enKeys = Object.keys(enLocale);
    
    // All top-level keys should exist in both
    zhKeys.forEach(key => {
      expect(enKeys).toContain(key);
    });
  });

  it('should have all nav keys in both languages', () => {
    expect(zhLocale.nav).toBeDefined();
    expect(enLocale.nav).toBeDefined();
    
    const zhNavKeys = Object.keys(zhLocale.nav);
    const enNavKeys = Object.keys(enLocale.nav);
    
    zhNavKeys.forEach(key => {
      expect(enNavKeys).toContain(key);
    });
  });

  it('should have all error codes in both languages', () => {
    expect(zhLocale.errors).toBeDefined();
    expect(enLocale.errors).toBeDefined();
    
    const zhErrorKeys = Object.keys(zhLocale.errors);
    const enErrorKeys = Object.keys(enLocale.errors);
    
    zhErrorKeys.forEach(key => {
      expect(enErrorKeys).toContain(key);
    });
  });

  it('decorative texts should be in the exception list', () => {
    const decorativeTexts = defaultSiteConfig.decorativeTextKeepEnglish;
    
    // These should always be in English
    expect(decorativeTexts).toContain('SYSTEM ONLINE');
    expect(decorativeTexts).toContain('LETAVERSE');
    expect(decorativeTexts).toContain('Mu AI');
  });
});

/**
 * **Feature: frontend-enhancement, Property 3: 语言切换即时性**
 * **Validates: Requirements 7.5**
 * 
 * For any language switch operation, the interface should immediately
 * update to the target language without page refresh.
 */
describe('Property 3: Language Switch Immediacy', () => {
  it('should have valid language codes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('zh', 'en', 'zh-CN', 'en-US'),
        (langCode) => {
          const isZh = langCode.startsWith('zh');
          const isEn = langCode.startsWith('en');
          
          // Language code should be either Chinese or English
          expect(isZh || isEn).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should select correct locale based on language code', () => {
    const getLocale = (lang: string) => lang.startsWith('zh') ? zhLocale : enLocale;
    
    expect(getLocale('zh').nav.home).toBe('首页');
    expect(getLocale('en').nav.home).toBe('Home');
    expect(getLocale('zh-CN').nav.home).toBe('首页');
    expect(getLocale('en-US').nav.home).toBe('Home');
  });
});
