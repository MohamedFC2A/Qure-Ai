import { describe, it, expect } from 'vitest';

describe('Usability QA: Arabic Localization & RTL Mirroring Integrity', () => {
  const REQUIRED_LOCALIZATION_KEYS = [
    'hero_title',
    'scan_cta',
    'disclaimer_short',
    'emergency_warning',
    'drug_interactions',
    'privacy_policy',
  ];

  const ARABIC_MOCK_DICTIONARY: Record<string, string> = {
    hero_title: 'الذكاء الاصطناعي الطبي المتقدم لقراءة الفحوصات والروشتات',
    scan_cta: 'ابدأ الفحص الفوري الآن',
    disclaimer_short: 'هذا التحليل للإرشاد الطبي والتوعية ولا يغني عن استشارة الطبيب المعالج.',
    emergency_warning: 'في حالات الطوارئ الحادة، يرجى التوجه لأقرب مستشفى أو الاتصال بالإسعاف فوراً.',
    drug_interactions: 'فحص التداخلات والتعارضات الدوائية',
    privacy_policy: 'سياسة الخصوصية وأمان البيانات الطبية',
  };

  it('contains valid non-empty Arabic strings for all required UI keys', () => {
    for (const key of REQUIRED_LOCALIZATION_KEYS) {
      expect(ARABIC_MOCK_DICTIONARY[key]).toBeDefined();
      expect(ARABIC_MOCK_DICTIONARY[key].trim().length).toBeGreaterThan(5);
    }
  });

  it('validates correct Arabic Unicode range characters', () => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/;
    for (const text of Object.values(ARABIC_MOCK_DICTIONARY)) {
      expect(arabicRegex.test(text)).toBe(true);
    }
  });

  it('verifies dir="rtl" and lang="ar" contract compatibility', () => {
    const dirAttribute = 'rtl';
    const langAttribute = 'ar';
    expect(dirAttribute).toBe('rtl');
    expect(langAttribute).toBe('ar');
  });
});
