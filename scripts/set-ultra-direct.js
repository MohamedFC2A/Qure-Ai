const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
    const envPath = path.join(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) {
        console.error(".env.local file not found");
        process.exit(1);
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const getEnvVal = (key) => {
        const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
        return match ? match[1].trim() : null;
    };

    const supabaseUrl = getEnvVal('NEXT_PUBLIC_SUPABASE_URL');
    const serviceRoleKey = getEnvVal('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
        console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
        process.exit(1);
    }

    console.log("Using Supabase URL:", supabaseUrl);
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const userId = "43304a66-686e-437d-b171-3734d37cda59";
    const email = "uversionstore@gmail.com";

    console.log(`Updating plan to 'ultra' for user: ${email} (UID: ${userId})...`);
    
    const { data, error } = await supabase
        .from('profiles')
        .update({ plan: 'ultra' })
        .eq('id', userId)
        .select();

    if (error) {
        console.error("❌ Error updating plan:", error.message);
        console.log("Let's try to upsert or check if profile exists...");
        
        // Let's query to check if the profile exists
        const { data: profile, error: queryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (queryError) {
            console.error("❌ Profile query error:", queryError.message);
            console.log("Creating/inserting a profile instead...");
            const { data: insertData, error: insertError } = await supabase
                .from('profiles')
                .insert([
                    { id: userId, email: email, plan: 'ultra' }
                ])
                .select();
            if (insertError) {
                console.error("❌ Profile insert error:", insertError.message);
            } else {
                console.log("✅ Successfully inserted profile with Ultra plan:", insertData);
            }
        } else {
            console.log("Profile found:", profile);
        }
    } else {
        console.log("✅ Update response data:", data);
        if (!data || data.length === 0) {
            console.log("Warning: No rows updated. The user profile may not exist yet. Let's insert it.");
            const { data: insertData, error: insertError } = await supabase
                .from('profiles')
                .upsert([
                    { id: userId, email: email, plan: 'ultra' }
                ])
                .select();
            if (insertError) {
                console.error("❌ Profile insert/upsert error:", insertError.message);
            } else {
                console.log("✅ Successfully inserted/upserted profile with Ultra plan:", insertData);
            }
        } else {
            console.log("✅ Successfully updated profile plan to Ultra!");
        }
    }
}

main().catch(err => {
    console.error("Unexpected error:", err);
});
