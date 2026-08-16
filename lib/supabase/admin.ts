import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = "https://kzrcnmxcmrvrahukabjh.supabase.co";
const DEFAULT_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmNubXhjbXJ2cmFodWthYmpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDI1MDk0NywiZXhwIjoyMDk1ODI2OTQ3fQ.R1COHheLS0dKYuT_uJcmXnpCxMYcVxA6b5RsF1ksTCo";

export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

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

