import { NextRequest, NextResponse } from "next/server";

// ⛔ SECURITY: This endpoint is disabled in production.
// It was only ever meant for local dev use. In production, return 404 always.
export async function GET(req: NextRequest) {
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // In development, still require localhost
    const host = req.headers.get("host") || "";
    const isLocalHost =
        host.startsWith("localhost:") ||
        host.startsWith("127.0.0.1:") ||
        host.startsWith("[::1]:");

    if (!isLocalHost) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // SAFE: Only reaches here in dev + localhost
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();
    const userId = "43304a66-686e-437d-b171-3734d37cda59";

    const { data, error } = await supabase
        .from("profiles")
        .update({ plan: "ultra" })
        .eq("id", userId)
        .select();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User plan updated to ultra", data });
}
