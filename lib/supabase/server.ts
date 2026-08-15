import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const DEFAULT_SUPABASE_URL = "https://kzrcnmxcmrvrahukabjh.supabase.co";
const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmNubXhjbXJ2cmFodWthYmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA5NDcsImV4cCI6MjA5NTgyNjk0N30.WPZHN8oChuHGFo3C6YxnnMeMEv0hsR-FN5NxkAS84Q0";

export async function createClient() {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

    return createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            global: {
                fetch: async (url, options) => {
                    try {
                        return await fetch(url, options);
                    } catch (err: any) {
                        console.warn("[Supabase Server Client] Network fetch note:", err?.message || err);
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
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Ignored if server component
                    }
                },
            },
        }
    )
}

