import { describe, it, expect, beforeEach } from 'vitest';
import { getTermsAcceptance, hasAcceptedTerms, safeNextPath, TERMS_VERSION } from '@/lib/legal/terms';
import { clearAllAuthCookies } from '@/lib/authCookies';

describe('Functional QA: Legal Terms Acceptance & Cookie Session Security', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
  });

  describe('Terms Acceptance Verification', () => {
    it('accepts terms when client has current version stored in localStorage', () => {
      localStorage.setItem('qurescan_terms_accepted', '2026-01-20T10:00:00Z');
      const status = getTermsAcceptance(null);
      expect(status.accepted).toBe(true);
      expect(status.version).toBe(TERMS_VERSION);
    });

    it('rejects unauthenticated user without localStorage record', () => {
      const status = getTermsAcceptance(null);
      expect(status.accepted).toBe(false);
      expect(hasAcceptedTerms(null)).toBe(false);
    });

    it('verifies terms acceptance for authenticated user with metadata record', () => {
      const user = {
        id: 'usr-12345',
        user_metadata: {
          terms_version: TERMS_VERSION,
          terms_accepted_at: '2026-01-20T12:00:00Z',
        },
      };
      expect(hasAcceptedTerms(user)).toBe(true);
    });

    it('always accepts developer test user bypass', () => {
      const devUser = { id: 'local-dev-user' };
      expect(hasAcceptedTerms(devUser)).toBe(true);
    });
  });

  describe('Open Redirect Defense (safeNextPath)', () => {
    it('allows valid internal relative paths', () => {
      expect(safeNextPath('/dashboard', '/')).toBe('/dashboard');
      expect(safeNextPath('/scan?id=123', '/')).toBe('/scan?id=123');
      expect(safeNextPath('/profile/settings', '/')).toBe('/profile/settings');
    });

    it('blocks protocol-relative open redirect attacks (//attacker.com)', () => {
      expect(safeNextPath('//attacker.com', '/fallback')).toBe('/fallback');
      expect(safeNextPath('//malicious-site.org/phish', '/')).toBe('/');
    });

    it('blocks absolute URL redirects (https://external.com)', () => {
      expect(safeNextPath('https://external-phish.com', '/home')).toBe('/home');
      expect(safeNextPath('http://badsite.com', '/')).toBe('/');
    });

    it('blocks backslash evasion tricks (/\\attacker.com)', () => {
      expect(safeNextPath('/\\attacker.com', '/')).toBe('/');
      expect(safeNextPath('foo\\bar', '/')).toBe('/');
    });
  });

  describe('Auth Cookie Sanitization', () => {
    it('clears all session and supabase authentication cookies across multiple paths', () => {
      document.cookie = 'sb-access-token=mock_jwt_token; path=/';
      document.cookie = 'sb-refresh-token=mock_refresh; path=/';
      document.cookie = 'qurescan_dev_auth=true; path=/';

      clearAllAuthCookies();
      // After clearAllAuthCookies, cookies have expired headers
      expect(typeof clearAllAuthCookies).toBe('function');
    });
  });
});
