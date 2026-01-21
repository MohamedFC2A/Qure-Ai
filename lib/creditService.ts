import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PlanType = 'free' | 'ultra';

interface PlanLimits {
    dailyLimit: number;
    monthlyLimit: number;
}

const PLANS: Record<PlanType, PlanLimits> = {
    free: { dailyLimit: 50, monthlyLimit: 50 },
    ultra: { dailyLimit: 50, monthlyLimit: 1500 },
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
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
    try {
        return createAdminClient();
    } catch (error) {
        console.error("Failed to create admin Supabase client:", error);
        return null;
    }
}

export async function getUserPlan(userId: string, supabaseClient?: any): Promise<PlanType> {
    const primaryClient = supabaseClient;
    const adminClient = getAdminClientSafe();

    // Race condition or RLS issue: Sometimes user client returns null for own profile if policies aren't perfect.
    // We prioritize the authenticated client, but if it returns null/error, we MUST try admin.

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

    return 'free';
}

// Update signature to accept optional client
export async function getCreditsStatus(userId: string, supabaseClient?: any) {
    const adminClient = getAdminClientSafe();
    const supabase = supabaseClient || adminClient;

    // If we have neither a user-authenticated client nor an admin client, we can't query anything.
    if (!supabase) {
        return {
            plan: 'free' as const,
            planRemaining: 0,
            dailyUsed: 0,
            monthlyUsed: 0,
            extraCredits: 0,
            totalAvailable: 0,
            error: "Server missing SUPABASE_SERVICE_ROLE_KEY"
        };
    }

    const plan = await getUserPlan(userId, supabaseClient || supabase);
    const limits = PLANS[plan] || PLANS.free;

    // Get usage
    let { data: usage, error: usageError } = await supabase
        .from('usage_windows')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (usageError && usageError.code !== 'PGRST116') {
        console.error("Error fetching usage:", usageError);
    }

    if (!usage) {
        // Initialize if missing (requires admin/service role if RLS blocks insert)
        if (adminClient) {
            const { data: newUsage } = await adminClient
                .from('usage_windows')
                .insert({ user_id: userId })
                .select()
                .single();
            usage = newUsage;
        }

        // If we still don't have a row (table missing, RLS, conflict, etc.), fall back to defaults.
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

    // Monthly Reset check (if different month)
    if (now.getUTCMonth() !== monthlyStart.getUTCMonth() || now.getUTCFullYear() !== monthlyStart.getUTCFullYear()) {
        monthlyUsed = 0;
        newMonthlyStart = now.toISOString();
        needsUpdate = true;
    }

    if (needsUpdate) {
        // This update might need admin rights if RLS is strict
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

// Helper to get raw ledger balance (excluding plan usage usage)
async function getLedgerBalance(supabase: any, userId: string, fallbackClient?: any): Promise<number> {
    // We want to sum all deltas where metadata->>'source' is NOT 'plan' (or is null/undefined)
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

            if (fallbackError) {
                console.error("Ledger Fetch Error (fallback):", fallbackError);
                return 0;
            }

            return Math.max(
                0,
                (fallbackRows || []).reduce((acc: number, row: any) => {
                    if (row.metadata?.source === 'plan') return acc;
                    return acc + row.delta;
                }, 0)
            );
        }

        console.error("Ledger Fetch Error:", error);
        return 0;
    }

    if (!rows || rows.length === 0) {
        console.log(`No ledger rows found for user ${userId}`);
        return 0;
    }

    const balance = rows.reduce((acc: number, row: any) => {
        // Ignore stats-only plan usage log
        if (row.metadata?.source === 'plan') return acc;
        return acc + row.delta;
    }, 0);

    console.log(`Calculated Balance for ${userId}: ${balance} (from ${rows.length} rows)`);

    return Math.max(0, balance);
}

export async function deductCredit(userId: string, amount: number, reason: string): Promise<boolean> {
    const supabaseAdmin = getAdminClientSafe();
    if (!supabaseAdmin) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for deducting credits.");
    }

    const status = await getCreditsStatus(userId, supabaseAdmin);

    // 1. Try Plan
    if (status.planRemaining >= amount) {
        // Increment usage
        const { error } = await supabaseAdmin.from('usage_windows').update({
            daily_used: status.dailyUsed + amount,
            monthly_used: status.monthlyUsed + amount
        }).eq('user_id', userId);

        if (error) {
            console.error("Failed to deduct credit:", error);
            return false;
        }

        // Log to ledger for audit (delta 0 or just note it?)
        // User said "Prefer append-only ledger". Maybe we should log usage there too.
        await supabaseAdmin.from('credit_ledger').insert({
            user_id: userId,
            delta: -amount, // tracked as negative
            reason: reason,
            metadata: { source: 'plan' }
        });
        return true;
    }

    // 2. Try Extra Credits (Ledger)
    const extraCredits = await getLedgerBalance(supabaseAdmin, userId);

    if (extraCredits >= amount) {
        // Deduct from ledger
        await supabaseAdmin.from('credit_ledger').insert({
            user_id: userId,
            delta: -amount,
            reason: reason,
            metadata: { source: 'extra' }
        });
        return true;
    }

    return false;
}

export { createClient };
