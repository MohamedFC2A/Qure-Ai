import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PlanType = 'free' | 'ultra';

interface PlanLimits {
    dailyLimit: number;
    monthlyLimit: number;
}

const PLANS: Record<PlanType, PlanLimits> = {
    free: { dailyLimit: 30, monthlyLimit: 30 },
    ultra: { dailyLimit: 300, monthlyLimit: 300 },
};

function normalizePlan(plan: unknown): PlanType {
    const value = String(plan ?? '').trim().toLowerCase();
    return value === 'ultra' ? 'ultra' : 'free';
}

function applyPlanExpiry(plan: PlanType, planExpiresAt: unknown): PlanType {
    if (plan !== 'ultra') return plan;
    if (!planExpiresAt) return 'ultra';

    const expiry = new Date(String(planExpiresAt));
    if (Number.isNaN(expiry.getTime())) return 'ultra';

    return expiry > new Date() ? 'ultra' : 'free';
}

function getAdminClientSafe() {
    try {
        return createAdminClient();
    } catch (error) {
        console.error("[CreditService] Failed to create admin Supabase client:", error);
        return null;
    }
}

export async function getUserPlan(userId: string, supabaseClient?: any): Promise<PlanType> {
    if (process.env.NODE_ENV === "development" && (userId === "local-dev-user" || !userId)) {
        return "ultra";
    }
    const primaryClient = supabaseClient;
    const adminClient = getAdminClientSafe();

    const tryFetchPlan = async (client: any): Promise<PlanType | null> => {
        try {
            const { data, error } = await client
                .from('profiles')
                .select('plan, plan_expires_at')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                const msg = String(error.message || '');
                if (msg.toLowerCase().includes('plan_expires_at')) {
                    const { data: dataFallback, error: errorFallback } = await client
                        .from('profiles')
                        .select('plan')
                        .eq('id', userId)
                        .maybeSingle();

                    if (!errorFallback && dataFallback?.plan) {
                        return normalizePlan(dataFallback.plan);
                    }
                }
                return null;
            }

            if (!data?.plan) return null;
            return applyPlanExpiry(normalizePlan(data.plan), (data as any).plan_expires_at);
        } catch (e) {
            return null;
        }
    };

    if (primaryClient) {
        const plan = await tryFetchPlan(primaryClient);
        if (plan) return plan;
    }

    if (adminClient) {
        const plan = await tryFetchPlan(adminClient);
        if (plan) return plan;
    }

    // Default to ultra in dev environment, otherwise free
    return process.env.NODE_ENV === "development" ? "ultra" : "free";
}

export async function getCreditsStatus(userId: string, supabaseClient?: any) {
    if (process.env.NODE_ENV === "development" && (userId === "local-dev-user" || !userId)) {
        return {
            plan: 'ultra' as const,
            planRemaining: 300,
            dailyUsed: 0,
            monthlyUsed: 0,
            extraCredits: 0,
            totalAvailable: 300,
        };
    }

    const adminClient = getAdminClientSafe();
    const supabase = supabaseClient || adminClient;

    const plan = await getUserPlan(userId, supabaseClient || supabase);
    const limits = PLANS[plan] || PLANS.ultra;

    if (!supabase) {
        return {
            plan,
            planRemaining: limits.monthlyLimit,
            dailyUsed: 0,
            monthlyUsed: 0,
            extraCredits: 0,
            totalAvailable: limits.monthlyLimit,
        };
    }

    // Get usage
    let { data: usage, error: usageError } = await supabase
        .from('usage_windows')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (usageError && usageError.code !== 'PGRST116') {
        console.warn("[CreditService] Fetch usage note:", usageError.message);
    }

    if (!usage) {
        if (adminClient) {
            try {
                const { data: newUsage } = await adminClient
                    .from('usage_windows')
                    .insert({ user_id: userId })
                    .select()
                    .single();
                usage = newUsage;
            } catch {}
        }

        if (!usage) {
            usage = {
                daily_used: 0,
                monthly_used: 0,
                daily_window_start: new Date().toISOString(),
                monthly_window_start: new Date().toISOString()
            };
        }
    }

    // Check Reset Logic
    const now = new Date();
    const dailyStart = new Date(usage.daily_window_start);
    const monthlyStart = new Date(usage.monthly_window_start);

    let dailyUsed = usage.daily_used;
    let monthlyUsed = usage.monthly_used;
    let needsUpdate = false;
    let newDailyStart = usage.daily_window_start;
    let newMonthlyStart = usage.monthly_window_start;

    // Daily Reset check (if different day)
    if (
        now.getUTCDate() !== dailyStart.getUTCDate() ||
        now.getUTCMonth() !== dailyStart.getUTCMonth() ||
        now.getUTCFullYear() !== dailyStart.getUTCFullYear()
    ) {
        dailyUsed = 0;
        newDailyStart = now.toISOString();
        needsUpdate = true;
    }

    // Smart Monthly Refill check (resets every month from creation date / 30 days window)
    const msIn30Days = 30 * 24 * 60 * 60 * 1000;
    const isNewCalendarMonth = now.getUTCMonth() !== monthlyStart.getUTCMonth() || now.getUTCFullYear() !== monthlyStart.getUTCFullYear();
    const is30DaysElapsed = (now.getTime() - monthlyStart.getTime()) >= msIn30Days;

    if (isNewCalendarMonth || is30DaysElapsed) {
        monthlyUsed = 0;
        newMonthlyStart = now.toISOString();
        needsUpdate = true;
    }

    if (needsUpdate) {
        try {
            const { error: updateError } = await supabase
                .from('usage_windows')
                .update({
                    daily_used: dailyUsed,
                    daily_window_start: newDailyStart,
                    monthly_used: monthlyUsed,
                    monthly_window_start: newMonthlyStart
                })
                .eq('user_id', userId);

            if (updateError && adminClient && supabase !== adminClient) {
                await adminClient
                    .from('usage_windows')
                    .update({
                        daily_used: dailyUsed,
                        daily_window_start: newDailyStart,
                        monthly_used: monthlyUsed,
                        monthly_window_start: newMonthlyStart
                    })
                    .eq('user_id', userId);
            }
        } catch {}
    }

    const planDailyRemaining = Math.max(0, limits.dailyLimit - dailyUsed);
    const planMonthlyRemaining = Math.max(0, limits.monthlyLimit - monthlyUsed);
    const planRemaining = Math.min(planDailyRemaining, planMonthlyRemaining);

    // Pass the same client to getLedgerBalance
    const extraCredits = await getLedgerBalance(supabase, userId, adminClient);

    return {
        plan,
        planRemaining,
        dailyUsed,
        monthlyUsed,
        extraCredits,
        totalAvailable: planRemaining + extraCredits
    };
}

// Helper to get raw ledger balance
async function getLedgerBalance(supabase: any, userId: string, fallbackClient?: any): Promise<number> {
    try {
        const { data: rows, error } = await supabase
            .from('credit_ledger')
            .select('delta, metadata')
            .eq('user_id', userId);

        if (error) {
            if (fallbackClient && fallbackClient !== supabase) {
                const { data: fallbackRows, error: fallbackError } = await fallbackClient
                    .from('credit_ledger')
                    .select('delta, metadata')
                    .eq('user_id', userId);

                if (fallbackError) return 0;

                return Math.max(
                    0,
                    (fallbackRows || []).reduce((acc: number, row: any) => {
                        if (row.metadata?.source === 'plan') return acc;
                        return acc + row.delta;
                    }, 0)
                );
            }
            return 0;
        }

        if (!rows || rows.length === 0) return 0;

        const balance = rows.reduce((acc: number, row: any) => {
            if (row.metadata?.source === 'plan') return acc;
            return acc + row.delta;
        }, 0);

        return Math.max(0, balance);
    } catch {
        return 0;
    }
}

export async function deductCredit(userId: string, amount: number, reason: string, supabaseClient?: any): Promise<boolean> {
    if (process.env.NODE_ENV === "development" && (userId === "local-dev-user" || !userId)) {
        return true;
    }

    const supabaseAdmin = getAdminClientSafe() || supabaseClient;
    if (!supabaseAdmin) {
        console.warn("[CreditService] Admin client unavailable, safely proceeding.");
        return true;
    }

    try {
        const status = await getCreditsStatus(userId, supabaseAdmin);

        // If user is Ultra plan, always grant access and log usage
        if (status.plan === "ultra") {
            try {
                await supabaseAdmin.from('usage_windows').update({
                    daily_used: (status.dailyUsed || 0) + amount,
                    monthly_used: (status.monthlyUsed || 0) + amount
                }).eq('user_id', userId);
            } catch {}
            return true;
        }

        // 1. Try Plan
        if (status.planRemaining >= amount) {
            const { error } = await supabaseAdmin.from('usage_windows').update({
                daily_used: status.dailyUsed + amount,
                monthly_used: status.monthlyUsed + amount
            }).eq('user_id', userId);

            if (error) {
                console.error("[CreditService] Failed to update usage window:", error);
                return true;
            }

            try {
                await supabaseAdmin.from('credit_ledger').insert({
                    user_id: userId,
                    delta: -amount,
                    reason: reason,
                    metadata: { source: 'plan' }
                });
            } catch {}
            return true;
        }

        // 2. Try Extra Credits (Ledger)
        const extraCredits = await getLedgerBalance(supabaseAdmin, userId);
        if (extraCredits >= amount) {
            try {
                await supabaseAdmin.from('credit_ledger').insert({
                    user_id: userId,
                    delta: -amount,
                    reason: reason,
                    metadata: { source: 'extra' }
                });
            } catch {}
            return true;
        }

        return false;
    } catch (err: any) {
        console.warn("[CreditService] Error during deductCredit, bypassing safely:", err);
        return true;
    }
}

export { createClient };
