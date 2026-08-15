import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const host = req.headers.get("host") || "";
    const isLocalHost =
        host.startsWith("localhost:") ||
        host.startsWith("127.0.0.1:") ||
        host.startsWith("[::1]:");

    if (!isLocalHost) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabaseAdmin = createAdminClient();

    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    const url = new URL(req.url);
    const targetUserId = url.searchParams.get("userId") || user?.id;

    if (targetUserId) {
        const { data, error } = await supabaseAdmin
            .from("profiles")
            .update({ plan: "ultra", plan_expires_at: null })
            .eq("id", targetUserId)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `User ${targetUserId} plan updated to ultra`, data });
    }

    // Otherwise update all active local dev profiles
    const { data, error } = await supabaseAdmin
        .from("profiles")
        .update({ plan: "ultra", plan_expires_at: null })
        .neq("id", "00000000-0000-0000-0000-000000000000")
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "All profiles set to ultra in dev", count: data?.length });
}
