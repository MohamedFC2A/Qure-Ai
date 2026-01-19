import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Fetch all keys for the user (Rebuild)
export async function GET(req: NextRequest) {
    const supabase = await createClient();

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// POST: Generate a new key
export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { label } = await req.json();

    if (!label) {
        return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check limit (Max 5)
    const { count, error: countError } = await supabase
        .from("api_keys")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id);

    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
    if (count !== null && count >= 5) {
        return NextResponse.json({ error: "Limit reached: You can only have 5 active API keys." }, { status: 403 });
    }

    // Generate Key (mv_sk_...)
    const newKey = `mv_sk_${crypto.randomUUID().replace(/-/g, '')}`;

    const { data, error } = await supabase
        .from("api_keys")
        .insert({
            user_id: user.id,
            key_label: label,
            api_key: newKey,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

// DELETE: Remove a key
export async function DELETE(req: NextRequest) {
    const supabase = await createClient();
    const { id } = await req.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
