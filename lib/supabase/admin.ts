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
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
