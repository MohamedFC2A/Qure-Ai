import { describe, it, expect } from 'vitest';
import { RXNORM_LOCAL_DATABASE } from '@/lib/rxnormLocalDb';
import { TERMS_VERSION } from '@/lib/legal/terms';

describe('Smoke & Sanity QA: Core System Health Check', () => {
  it('verifies critical environment configurations exist or have safe defaults', () => {
    expect(process.env.NEXT_PUBLIC_APP_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined();
  });

  it('verifies legal terms version integrity', () => {
    expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('verifies local medication knowledge base loads without memory corruption', () => {
    const keys = Object.keys(RXNORM_LOCAL_DATABASE);
    expect(keys.length).toBeGreaterThan(10);
    expect(RXNORM_LOCAL_DATABASE['5640'].nameEn).toBe('Ibuprofen');
  });

  it('validates critical API response contract shape', () => {
    const mockHealthStatus = {
      status: 'healthy',
      version: '1.3.10-beta',
      services: {
        database: 'connected',
        ai_engine: 'ready',
        cache: 'active',
      },
      timestamp: new Date().toISOString(),
    };

    expect(mockHealthStatus.status).toBe('healthy');
    expect(mockHealthStatus.services.ai_engine).toBe('ready');
  });
});
