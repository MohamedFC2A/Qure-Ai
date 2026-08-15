import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        "[Supabase Client] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
    );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
        fetch: async (url, options) => {
            try {
                return await fetch(url, options);
            } catch (err: any) {
                console.warn("[Supabase JS Client] Network/Extension fetch handled safely:", err?.message || err);
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
});

