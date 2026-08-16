import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://kzrcnmxcmrvrahukabjh.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmNubXhjbXJ2cmFodWthYmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA5NDcsImV4cCI6MjA5NTgyNjk0N30.WPZHN8oChuHGFo3C6YxnnMeMEv0hsR-FN5NxkAS84Q0";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

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

