import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            "[Supabase Server Client] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables."
        );
    }

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

