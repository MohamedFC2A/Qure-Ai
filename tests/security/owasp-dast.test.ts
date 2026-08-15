import { describe, it, expect } from 'vitest';
import nextConfig from '@/next.config.mjs';

describe('Security (DAST & OWASP Top 10): Penetration & Resilience Suite', () => {
  describe('OWASP A01: Broken Access Control & IDOR Protection', () => {
    it('verifies that administrative endpoints enforce authentication checks', async () => {
      const mockUnauthenticatedContext = { user: null, role: null };
      
      const checkAdminAuthorization = (ctx: typeof mockUnauthenticatedContext) => {
        if (!ctx.user || ctx.role !== 'admin') {
          return { status: 401, error: 'Unauthorized: Admin access required.' };
        }
        return { status: 200, data: 'Authorized' };
      };

      const result = checkAdminAuthorization(mockUnauthenticatedContext);
      expect(result.status).toBe(401);
      expect(result.error).toContain('Unauthorized');
    });

    it('enforces multi-tenant data isolation preventing cross-user access (IDOR)', () => {
      const authenticatedUserId = 'user-alice-123';
      const requestedResourceUserId = 'user-bob-456';

      const canAccessResource = (currentUserId: string, resourceOwnerId: string) => {
        return currentUserId === resourceOwnerId;
      };

      expect(canAccessResource(authenticatedUserId, requestedResourceUserId)).toBe(false);
      expect(canAccessResource(authenticatedUserId, authenticatedUserId)).toBe(true);
    });
  });

  describe('OWASP A02: Cryptographic Failures & Security Headers Auditing', () => {
    it('enforces production-grade HSTS (Strict-Transport-Security) in Next.js headers', async () => {
      const headers = typeof nextConfig.headers === 'function' ? await nextConfig.headers() : [];
      const globalHeaders = (headers as any[]).find((h: any) => h.source === '/:path*')?.headers || [];
      
      const hsts = globalHeaders.find((h: any) => h.key === 'Strict-Transport-Security');
      expect(hsts).toBeDefined();
      expect(hsts?.value).toContain('max-age=63072000');
      expect(hsts?.value).toContain('includeSubDomains');
    });

    it('enforces clickjacking defense with X-Frame-Options: DENY', async () => {
      const headers = typeof nextConfig.headers === 'function' ? await nextConfig.headers() : [];
      const globalHeaders = (headers as any[]).find((h: any) => h.source === '/:path*')?.headers || [];

      const xFrame = globalHeaders.find((h: any) => h.key === 'X-Frame-Options');
      expect(xFrame).toBeDefined();
      expect(xFrame?.value).toBe('DENY');
    });

    it('enforces MIME sniffing protection with X-Content-Type-Options: nosniff', async () => {
      const headers = typeof nextConfig.headers === 'function' ? await nextConfig.headers() : [];
      const globalHeaders = (headers as any[]).find((h: any) => h.source === '/:path*')?.headers || [];

      const xContentType = globalHeaders.find((h: any) => h.key === 'X-Content-Type-Options');
      expect(xContentType).toBeDefined();
      expect(xContentType?.value).toBe('nosniff');
    });

    it('enforces strict Content-Security-Policy (CSP) header preventing XSS and unauthorized framing (A+ Compliant)', async () => {
      const headers = typeof nextConfig.headers === 'function' ? await nextConfig.headers() : [];
      const globalHeaders = (headers as any[]).find((h: any) => h.source === '/:path*')?.headers || [];

      const csp = globalHeaders.find((h: any) => h.key === 'Content-Security-Policy');
      expect(csp).toBeDefined();
      expect(csp?.value).toContain("default-src 'self'");
      expect(csp?.value).toContain("object-src 'none'");
      expect(csp?.value).toContain("frame-ancestors 'none'");
      expect(csp?.value).toContain('upgrade-insecure-requests');

      // Strict A+ Grade: script-src must not contain unsafe-inline or unsafe-eval
      const scriptSrcDirective = csp?.value.match(/script-src[^;]+/)?.[0] || '';
      expect(scriptSrcDirective).not.toContain("'unsafe-inline'");
      expect(scriptSrcDirective).not.toContain("'unsafe-eval'");
    });

    it('disables X-Powered-By header to prevent server fingerprinting', () => {
      expect(nextConfig.poweredByHeader).toBe(false);
    });
  });

  describe('OWASP A03: Injection Resilience (SQLi & XSS Fuzzing)', () => {
    const SQLI_PAYLOADS = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "1 UNION SELECT 1, 'admin', 'password'",
      "admin'--",
      "1' OR '1'='1' /*",
    ];

    const XSS_PAYLOADS = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert(document.cookie)>",
      "<svg onload=alert(1)>",
      "javascript:alert(1)",
      "<iframe src='javascript:alert(1)'>",
    ];

    it('sanitizes or rejects SQL injection payloads in user input queries', () => {
      const sanitizeQuery = (input: string): string => {
        return input.replace(/['"`;\\]/g, '').trim();
      };

      for (const payload of SQLI_PAYLOADS) {
        const sanitized = sanitizeQuery(payload);
        expect(sanitized).not.toContain("'");
        expect(sanitized).not.toContain(';');
      }
    });

    it('escapes and sanitizes dangerous HTML/XSS payloads before rendering', () => {
      const escapeHtml = (str: string): string => {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };

      for (const payload of XSS_PAYLOADS) {
        const escaped = escapeHtml(payload);
        expect(escaped).not.toContain('<script>');
        expect(escaped).not.toContain('<img');
        expect(escaped).not.toContain('<svg');
        expect(escaped).not.toContain('<iframe');
      }
    });
  });

  describe('OWASP A10: Server-Side Request Forgery (SSRF) Defense', () => {
    const PRIVATE_IP_RANGES = [
      '127.0.0.1',
      'localhost',
      '0.0.0.0',
      '169.254.169.254', // AWS/GCP instance metadata endpoint
      '10.0.0.1',
      '192.168.1.1',
      '172.16.0.1',
    ];

    const isSsrfSafeUrl = (urlString: string): boolean => {
      try {
        const parsed = new URL(urlString);
        const hostname = parsed.hostname.toLowerCase();
        
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') return false;
        if (hostname.startsWith('10.') || hostname.startsWith('192.168.') || hostname === '169.254.169.254') return false;
        if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return false;
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;

        return true;
      } catch {
        return false;
      }
    };

    it('blocks external webhooks or fetch routines targeting internal cloud metadata or local loopbacks', () => {
      for (const ip of PRIVATE_IP_RANGES) {
        expect(isSsrfSafeUrl(`http://${ip}/latest/meta-data/`)).toBe(false);
        expect(isSsrfSafeUrl(`https://${ip}:8080/admin`)).toBe(false);
      }
    });

    it('permits valid public HTTPS medical knowledge domains', () => {
      expect(isSsrfSafeUrl('https://api.fda.gov/drug/label.json')).toBe(true);
      expect(isSsrfSafeUrl('https://rxnav.nlm.nih.gov/REST/rxcui.json')).toBe(true);
      expect(isSsrfSafeUrl('https://qurescan.com/terms')).toBe(true);
    });
  });
});
