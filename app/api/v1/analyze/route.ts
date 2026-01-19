import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeMedicationText } from "@/lib/ai/vision";

export async function POST(req: NextRequest) {
    const supabase = await createClient();

    // 1. Validate API Key (Using RPC to bypass RLS)
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
        return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 });
    }

    const { data: keyData, error: keyError } = await supabase
        .rpc('verify_api_key', { key_text: apiKey });

    if (keyError || !keyData) {
        return NextResponse.json({ error: "Invalid API Key" }, { status: 403 });
    }

    // 2. Validate Request Body
    const body = await req.json();
    const { text } = body;

    if (!text) {
        return NextResponse.json({ error: "Missing 'text' in request body" }, { status: 400 });
    }

    try {
        // 3. Update Last Used (Async - don't await strictly to speed up response)
        await supabase
            .from("api_keys")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", keyData.id);

        // 4. Run Analysis
        const analysisResult = await analyzeMedicationText(text);

        return NextResponse.json({
            status: "success",
            data: analysisResult
        });

    } catch (error: any) {
        console.error("Public API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
