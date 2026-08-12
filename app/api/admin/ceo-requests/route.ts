import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getLocalDevUser } from "@/lib/devAuth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kzrcnmxcmrvrahukabjh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const CEO_EMAILS = [
    "mohamedahmedmatany@gmail.com",
    "uversionstore@gmail.com",
];

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const user = authUser || getLocalDevUser(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isCeo = CEO_EMAILS.includes(user.email || "") || user.id === "00000000-0000-0000-0000-000000000001";
        if (!isCeo) {
            return NextResponse.json({ error: "Access forbidden. CEO only." }, { status: 403 });
        }

        const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: requests, error } = await adminSupabase
            .from("ceo_upgrade_requests")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ requests: requests || [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const user = authUser || getLocalDevUser(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isCeo = CEO_EMAILS.includes(user.email || "") || user.id === "00000000-0000-0000-0000-000000000001";
        if (!isCeo) {
            return NextResponse.json({ error: "Access forbidden. CEO only." }, { status: 403 });
        }

        const body = await req.json();
        const { requestId, action } = body; // action: 'approve' | 'reject'

        if (!requestId) {
            return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
        }

        const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: requestRecord } = await adminSupabase
            .from("ceo_upgrade_requests")
            .select("*")
            .eq("id", requestId)
            .maybeSingle();

        if (!requestRecord) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        if (action === "approve") {
            // 1. Upgrade user to Ultra
            await adminSupabase
                .from("profiles")
                .update({
                    plan: "ultra",
                    updated_at: new Date().toISOString(),
                })
                .eq("id", requestRecord.user_id);

            // 2. Set usage window with 300 credits
            await adminSupabase
                .from("usage_windows")
                .upsert({
                    user_id: requestRecord.user_id,
                    daily_used: 0,
                    monthly_used: 0,
                    monthly_window_start: new Date().toISOString(),
                    daily_window_start: new Date().toISOString(),
                }, { onConflict: "user_id" });

            // 3. Add to ledger
            await adminSupabase
                .from("credit_ledger")
                .insert({
                    user_id: requestRecord.user_id,
                    delta: 300,
                    reason: "golden_ceo_beta_admin_approved",
                });

            // 4. Update status
            await adminSupabase
                .from("ceo_upgrade_requests")
                .update({
                    status: "approved",
                    activated_at: new Date().toISOString(),
                })
                .eq("id", requestId);

            return NextResponse.json({ success: true, message: "تم تفعيل باقة ألترا للمستخدم بنجاح!" });
        } else if (action === "reject") {
            await adminSupabase
                .from("ceo_upgrade_requests")
                .update({ status: "rejected" })
                .eq("id", requestId);

            return NextResponse.json({ success: true, message: "تم رفض الطلب." });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
