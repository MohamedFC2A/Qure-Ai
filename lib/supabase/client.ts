import { createBrowserClient } from '@supabase/ssr'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

const DEFAULT_SUPABASE_URL = "https://kzrcnmxcmrvrahukabjh.supabase.co"
const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmNubXhjbXJ2cmFodWthYmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNTA5NDcsImV4cCI6MjA5NTgyNjk0N30.WPZHN8oChuHGFo3C6YxnnMeMEv0hsR-FN5NxkAS84Q0"

const safeFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    try {
        return await window.fetch(url, options)
    } catch (err: any) {
        console.warn('[Supabase Client] Network/Extension fetch handled safely:', err?.message || err)
        return new Response(
            JSON.stringify({
                error: 'network_error',
                error_description: err?.message || 'Failed to fetch',
                message: err?.message || 'Failed to fetch',
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' },
            }
        )
    }
}

export const createClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY

    if (typeof window === 'undefined') {
        return createBrowserClient(supabaseUrl, supabaseAnonKey, {
            global: {
                fetch: async (url, options) => {
                    try {
                        return await fetch(url, options)
                    } catch (err: any) {
                        return new Response(
                            JSON.stringify({ error: 'network_error', message: err?.message || 'Failed to fetch' }),
                            { status: 503, headers: { 'Content-Type': 'application/json' } }
                        )
                    }
                },
            },
        })
    }

    if (!clientInstance) {
        clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
            global: {
                fetch: safeFetch,
            },
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
            },
        })
    }

    return clientInstance
}

