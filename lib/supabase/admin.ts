import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            "[Supabase Admin Client] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. " +
            "Set them in your deployment environment (never hardcode secrets in source code)."
        );
    }

    return createClient(
        supabaseUrl,
        serviceRoleKey,
        {
            global: {
                fetch: async (url, options) => {
                    try {
                        return await fetch(url, options);
                    } catch (err: any) {
                        console.warn("[Supabase Admin Client] Network fetch note:", err?.message || err);
                        return new Response(
                            JSON.stringify({
                                error: "network_error",
                                message: err?.message || "Failed to fetch",
                            }),
                            {
                                status: 503,
                                statusText: "Service Unavailable",
                                headers: { "Content-Type": "application/json" },
                            }
                        );
                    }
                },
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

