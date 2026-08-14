import { createBrowserClient } from '@supabase/ssr'

let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

    if (typeof window === 'undefined') {
        return createBrowserClient(supabaseUrl, supabaseAnonKey)
    }

    if (!clientInstance) {
        clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
    }

    return clientInstance
}
