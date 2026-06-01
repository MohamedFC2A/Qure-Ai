import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* ──────────────────────────────────────────────────────────
 *  GET /api/ai/conversations/[id]/messages
 *  Query params: ?limit=100 (default 100, max 200)
 *               ?before=<timestamp> (for pagination)
 * ────────────────────────────────────────────────────────── */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: conversationId } = await params;
        const { searchParams } = new URL(req.url);
        const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 100, 1), 200);
        const before = searchParams.get("before");

        // First verify the user owns this conversation
        const convRes = await supabase
            .from("ai_conversations")
            .select("id, mode, title, metadata")
            .eq("id", conversationId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (!convRes.data) {
            return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
        }

        // Fetch messages
        let query = supabase
            .from("ai_messages")
            .select("id, role, content, metadata, created_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
            .limit(limit);

        if (before) {
            query = query.lt("created_at", before);
        }

        const { data: messages, error } = await query;

        if (error) {
            console.error("Failed to fetch messages:", error);
            return NextResponse.json({ conversation: convRes.data, messages: [] });
        }

        return NextResponse.json({
            conversation: convRes.data,
            messages: messages || [],
        });
    } catch (error: any) {
        console.error("Messages GET Error:", error);
        return NextResponse.json({ error: error?.message || "Internal error", messages: [] }, { status: 500 });
    }
}
