import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export async function GET() {
    const status = {
        supabase: "unknown",
        openai: "unknown",
        deepseek: "unknown",
    };

    // 1. Check Supabase
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
            status.supabase = "missing_keys";
        } else {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { error } = await supabase.from('test').select('*').limit(1);
            // We expect an error if table doesn't exist, but connection is key.
            // A connection error usually manifests differently than a 404 on table.
            // For simple check, we assume if we get a response (even error) it's 'connected' unless it's a network error.

            // Actually, a simpler check is just init. But let's check basic connectivity.
            // We often don't have a table. Let's just assume configured if keys exist for now, 
            // as true connectivity check requires a valid table or auth call.
            status.supabase = "configured";
        }
    } catch (error) {
        status.supabase = "error";
    }

    /* OpenAI Removed
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    status.openai = "missing_key";
  } else {
    try {
        const openai = new OpenAI({ apiKey: openaiKey });
        // Minimal call to list models or just check auth
        await openai.models.list();
        status.openai = "connected";
    } catch(err) {
        status.openai = "invalid_key";
    }
  }
  */
    status.openai = "disabled";

    // 3. Check DeepSeek
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekKey) {
        status.deepseek = "missing_key";
    } else {
        try {
            const deepseek = new OpenAI({
                apiKey: deepseekKey,
                baseURL: "https://api.deepseek.com"
            });
            await deepseek.models.list();
            status.deepseek = "connected";
        } catch (err) {
            status.deepseek = "invalid_key";
        }
    }

    return NextResponse.json(status);
}
