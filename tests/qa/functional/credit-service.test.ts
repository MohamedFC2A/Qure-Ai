import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserPlan, getCreditsStatus } from '@/lib/creditService';

describe('Functional QA: Credit Service & Entitlement Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Plan Identification & Expiry', () => {
    it('defaults to free plan for unregistered user in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      // @ts-ignore
      process.env.NODE_ENV = 'production';

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      };

      const plan = await getUserPlan('unregistered-user-id', mockSupabase);
      expect(plan).toBe('free');

      // @ts-ignore
      process.env.NODE_ENV = originalEnv;
    });

    it('identifies ultra plan for active subscription', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  plan: 'ultra',
                  plan_expires_at: new Date(Date.now() + 86400000 * 30).toISOString(),
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      const plan = await getUserPlan('user-ultra-123', mockSupabase);
      expect(plan).toBe('ultra');
    });

    it('falls back to free plan when ultra subscription has expired', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  plan: 'ultra',
                  plan_expires_at: new Date(Date.now() - 86400000).toISOString(), // expired yesterday
                },
                error: null,
              }),
            }),
          }),
        }),
      };

      const plan = await getUserPlan('user-expired-123', mockSupabase);
      expect(plan).toBe('free');
    });
  });

  describe('Credits Status Calculation', () => {
    it('returns ultra tier allocation for local dev user in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      // @ts-ignore
      process.env.NODE_ENV = 'development';

      const status = await getCreditsStatus('local-dev-user');
      expect(status.plan).toBe('ultra');
      expect(status.totalAvailable).toBe(300);
      expect(status.dailyUsed).toBe(0);

      // @ts-ignore
      process.env.NODE_ENV = originalEnv;
    });

    it('calculates plan remaining and available balance correctly with Supabase client', async () => {
      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === 'profiles') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { plan: 'free', plan_expires_at: null },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'usage_windows') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      daily_used: 10,
                      monthly_used: 10,
                      daily_window_start: new Date().toISOString(),
                      monthly_window_start: new Date().toISOString(),
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'credit_ledger') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ delta: 5, metadata: {} }],
                  error: null,
                }),
              }),
            };
          }
          return {};
        }),
      };

      const status = await getCreditsStatus('user-free-test', mockSupabase);
      expect(status.plan).toBe('free');
      expect(status.dailyUsed).toBe(10);
      expect(status.planRemaining).toBe(20); // 30 - 10
      expect(status.extraCredits).toBe(5);
      expect(status.totalAvailable).toBe(25); // 20 + 5
    });
  });
});
