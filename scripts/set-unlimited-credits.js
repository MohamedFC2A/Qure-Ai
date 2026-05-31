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

    // Step 1: Set plan to 'ultra'
    console.log(`\n=== Step 1: Setting plan to 'ultra' for ${email} (${userId}) ===`);
    
    // First check if profile exists
    const { data: existingProfile, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (queryError) {
        console.error("❌ Error querying profile:", queryError.message);
    }

    if (!existingProfile) {
        console.log("Profile not found. Creating profile with ultra plan...");
        const { data: insertData, error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: userId, email: email, plan: 'ultra' }])
            .select();
        if (insertError) {
            console.error("❌ Profile insert error:", insertError.message);
        } else {
            console.log("✅ Profile created successfully with ultra plan:", insertData);
        }
    } else {
        console.log("Profile found. Updating plan to ultra...");
        const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .update({ plan: 'ultra' })
            .eq('id', userId)
            .select();
        if (updateError) {
            console.error("❌ Profile update error:", updateError.message);
        } else {
            console.log("✅ Profile updated to ultra plan:", updateData);
        }
    }

    // Step 2: Add unlimited extra credits via credit_ledger
    console.log(`\n=== Step 2: Adding unlimited extra credits to credit_ledger ===`);
    
    const UNLIMITED_CREDITS = 999999999;
    
    // First check if there's already a massive credit entry
    const { data: existingCredits } = await supabase
        .from('credit_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (existingCredits && existingCredits.length > 0) {
        console.log(`Existing ledger entries: ${existingCredits.length}`);
        console.log("Most recent entries:");
        existingCredits.slice(0, 3).forEach(entry => {
            console.log(`  - delta: ${entry.delta}, reason: ${entry.reason}, source: ${entry.metadata?.source || 'N/A'}, created: ${entry.created_at}`);
        });
    }

    // Add a massive credit injection
    const { data: creditData, error: creditError } = await supabase
        .from('credit_ledger')
        .insert({
            user_id: userId,
            delta: UNLIMITED_CREDITS,
            reason: 'Unlimited lifetime credits grant',
            metadata: { 
                source: 'admin_grant',
                granted_by: 'system_admin',
                note: 'Unlimited credits for this user'
            }
        })
        .select();

    if (creditError) {
        console.error("❌ Error adding credits to ledger:", creditError.message);
    } else {
        console.log(`✅ Successfully added ${UNLIMITED_CREDITS.toLocaleString()} credits to ledger:`, creditData);
    }

    // Step 3: Verify the result
    console.log(`\n=== Step 3: Verification ===`);
    
    // Check profile
    const { data: finalProfile } = await supabase
        .from('profiles')
        .select('id, email, plan')
        .eq('id', userId)
        .maybeSingle();

    console.log("Profile:", finalProfile);

    // Check total credits in ledger
    const { data: allCredits } = await supabase
        .from('credit_ledger')
        .select('delta, metadata')
        .eq('user_id', userId);

    if (allCredits) {
        // Calculate balance excluding plan-source entries
        const totalBalance = allCredits.reduce((acc, row) => {
            if (row.metadata?.source === 'plan') return acc;
            return acc + row.delta;
        }, 0);
        console.log(`\nExtra credits balance: ${totalBalance.toLocaleString()} (${totalBalance >= UNLIMITED_CREDITS ? '✅ UNLIMITED' : '⚠️ Less than expected'})`);
    }

    // Check usage_windows
    const { data: usage } = await supabase
        .from('usage_windows')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (usage) {
        console.log("Usage status:", usage);
    } else {
        console.log("No usage_windows entry found (will be created on first scan).");
    }

    console.log(`\n✅ Done! User ${email} now has: ultra plan + ${UNLIMITED_CREDITS.toLocaleString()} extra credits (effectively UNLIMITED).`);
}

main().catch(err => {
    console.error("Unexpected error:", err);
});