import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Ensure environment variables are present before initializing
if (!supabaseUrl || !supabaseKey) {
    // We don't throw here to avoid crashing the build, but auth methods should handle the missing client gracefully.
    console.warn("Supabase keys are missing. Authentication will not function.");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");
