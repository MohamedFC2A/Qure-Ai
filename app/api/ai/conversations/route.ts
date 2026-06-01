import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* ──────────────────────────────────────────────────────────
 *  GET /api/ai/conversations — List user's conversations
 *  Query params: ?mode=health|medication|context  (optional filter)
 *                ?limit=50  (default 50, max 100)
 * ────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const mode = searchParams.get("mode");
        const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);

        let query = supabase
            .from("ai_conversations")
            .select("id, mode, title, metadata, created_at, updated_at")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(limit);

        if (mode && ["health", "medication", "context"].includes(mode)) {
            query = query.eq("mode", mode);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Failed to fetch conversations:", error);
            return NextResponse.json({ conversations: [] });
        }

        return NextResponse.json({ conversations: data || [] });
    } catch (error: any) {
        console.error("Conversations GET Error:", error);
        return NextResponse.json({ conversations: [] });
    }
}

/* ──────────────────────────────────────────────────────────
 *  DELETE /api/ai/conversations — Delete a conversation
 *  Body: { conversationId: string }
 * ────────────────────────────────────────────────────────── */
export async function DELETE(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const conversationId = body?.conversationId;

        if (!conversationId) {
            return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
        }

        // RLS will ensure user can only delete their own conversations
        const { error } = await supabase
            .from("ai_conversations")
            .delete()
            .eq("id", conversationId)
            .eq("user_id", user.id);

        if (error) {
            console.error("Failed to delete conversation:", error);
            return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Conversations DELETE Error:", error);
        return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
    }
}
