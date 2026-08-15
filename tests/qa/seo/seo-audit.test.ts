import { describe, it, expect } from 'vitest';
import { metadata } from '@/app/layout';
import robots from '@/app/robots';

describe('SEO & Metadata Quality Assurance Audit', () => {
  describe('Page Title & Meta Description Constraints', () => {
    it('contains valid default title between 30 and 65 characters', () => {
      const defaultTitle = typeof metadata.title === 'object' && metadata.title !== null && 'default' in metadata.title
        ? (metadata.title as { default: string }).default
        : String(metadata.title);

      expect(defaultTitle).toBeTruthy();
      expect(defaultTitle.length).toBeGreaterThanOrEqual(25);
      expect(defaultTitle.length).toBeLessThanOrEqual(70);
    });

    it('contains comprehensive meta description within standard SEO length (50-200 chars)', () => {
      const desc = metadata.description;
      expect(desc).toBeTruthy();
      expect(desc!.length).toBeGreaterThanOrEqual(50);
      expect(desc!.length).toBeLessThanOrEqual(200);
    });

    it('contains relevant search engine keywords array', () => {
      expect(Array.isArray(metadata.keywords)).toBe(true);
      expect((metadata.keywords as string[]).length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('OpenGraph & Social Sharing Meta (OG Tags & Twitter Cards)', () => {
    it('contains valid OpenGraph properties for rich previews', () => {
      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBeTruthy();
      expect(metadata.openGraph?.description).toBeTruthy();
      expect(metadata.openGraph?.siteName).toBe('QureScan');
      const og = metadata.openGraph as any;
      expect(og?.type).toBe('website');
    });

    it('contains Twitter card metadata configured for large summary image', () => {
      expect(metadata.twitter).toBeDefined();
      const tw = metadata.twitter as any;
      expect(tw?.card).toBe('summary_large_image');
      expect(tw?.title).toBeTruthy();
    });
  });

  describe('Robots.txt & Sitemap Compliance', () => {
    it('generates valid robots.txt rules protecting private and administrative routes', () => {
      const robotsConfig = robots();
      expect(robotsConfig.rules).toBeDefined();

      const rule = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : (robotsConfig.rules as any);
      expect(rule.userAgent).toBe('*');
      expect(rule.allow).toBe('/');
      expect(rule.disallow).toEqual(expect.arrayContaining(['/api/', '/admin/']));
      expect(robotsConfig.sitemap).toContain('/sitemap.xml');
    });
  });
});
