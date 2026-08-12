import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kzrcnmxcmrvrahukabjh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const OFFICIAL_SITE_URL = "https://qure-ai-nexus.vercel.app";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");

    if (!token || !userId) {
        return new NextResponse(
            `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head><meta charset="utf-8"><title>خطأ في التفعيل</title></head>
            <body style="background:#0f172a;color:#f87171;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
                <div style="background:#1e293b;padding:32px;border-radius:16px;border:1px solid #ef4444;text-align:center;">
                    <h2>❌ رابط التفعيل غير صالح أو ناقص</h2>
                    <p style="color:#94a3b8;">يرجى التأكد من الضغط على الرابط الصحيح من البريد الإلكتروني.</p>
                </div>
            </body>
            </html>
            `,
            { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
        );
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
        return new NextResponse("Server Configuration Error: Missing SUPABASE_SERVICE_ROLE_KEY", { status: 500 });
    }

    const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        // 1. Verify token in ceo_upgrade_requests
        const { data: requestRecord, error: findError } = await adminSupabase
            .from("ceo_upgrade_requests")
            .select("*")
            .eq("activation_token", token)
            .eq("user_id", userId)
            .maybeSingle();

        if (findError || !requestRecord) {
            return new NextResponse(
                `
                <!DOCTYPE html>
                <html dir="rtl" lang="ar">
                <head><meta charset="utf-8"><title>خطأ في التفعيل</title></head>
                <body style="background:#0f172a;color:#f87171;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
                    <div style="background:#1e293b;padding:32px;border-radius:16px;border:1px solid #ef4444;text-align:center;max-width:500px;">
                        <h2>❌ لم يتم العثور على هذا الطلب أو الرمز مستخدم مسبقاً</h2>
                        <p style="color:#94a3b8;">تأكد من عدم تفعيل هذا الحساب بالفعل سابقاً.</p>
                        <a href="${OFFICIAL_SITE_URL}/admin/ceo-requests" style="color:#38bdf8;text-decoration:none;margin-top:12px;display:inline-block;">الانتقال إلى لوحة طلبات CEO</a>
                    </div>
                </body>
                </html>
                `,
                { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 404 }
            );
        }

        // 2. Upgrade user profile to Ultra
        const { error: profileError } = await adminSupabase
            .from("profiles")
            .update({
                plan: "ultra",
                plan_expires_at: null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

        if (profileError) {
            console.error("Failed to upgrade profile:", profileError);
        }

        // 3. Reset & ensure usage window has 300 credits
        await adminSupabase
            .from("usage_windows")
            .upsert({
                user_id: userId,
                daily_used: 0,
                monthly_used: 0,
                monthly_window_start: new Date().toISOString(),
                daily_window_start: new Date().toISOString(),
            }, { onConflict: "user_id" });

        // 4. Record in credit ledger
        await adminSupabase
            .from("credit_ledger")
            .insert({
                user_id: userId,
                delta: 300,
                reason: "golden_ceo_beta_activation",
            });

        // 5. Update request status to approved
        await adminSupabase
            .from("ceo_upgrade_requests")
            .update({
                status: "approved",
                activated_at: new Date().toISOString(),
            })
            .eq("id", requestRecord.id);

        const userName = requestRecord.full_name || requestRecord.email || userId;

        return new NextResponse(
            `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="utf-8">
                <title>تم التفعيل بنجاح • QureScan CEO</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #070b14; color: #ffffff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                    .card { background: #0f172a; border: 1px solid #22c55e; border-radius: 24px; padding: 40px; text-align: center; max-width: 540px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.6); }
                    .icon { width: 64px; height: 64px; background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 32px; }
                    h1 { color: #4ade80; font-size: 24px; margin: 0 0 10px; }
                    p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
                    .info-box { background: #1e293b; border-radius: 12px; padding: 16px; margin-bottom: 28px; text-align: right; }
                    .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #334155; }
                    .info-row:last-child { border-bottom: none; }
                    .btn-group { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
                    .btn { background: #22c55e; color: #000000 !important; font-weight: 800; text-decoration: none; padding: 12px 24px; border-radius: 10px; display: inline-block; font-size: 14px; }
                    .btn-secondary { background: #334155; color: #ffffff !important; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 10px; display: inline-block; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">👑</div>
                    <h1>تم تفعيل الاشتراك الذهبي بنجاح!</h1>
                    <p>تم ترقية حساب المستخدم بنجاح إلى باقة <strong>ULTRA</strong> وتعيين الرصيد الشهري إلى <strong>300 رصيد</strong>.</p>
                    
                    <div class="info-box">
                        <div class="info-row">
                            <span style="color:#94a3b8;">المستخدم:</span>
                            <span style="color:#f8fafc; font-weight: bold;">${userName}</span>
                        </div>
                        <div class="info-row">
                            <span style="color:#94a3b8;">معرف الحساب:</span>
                            <span style="font-family:monospace; color:#38bdf8;">${userId}</span>
                        </div>
                        <div class="info-row">
                            <span style="color:#94a3b8;">الخطة الجديدة:</span>
                            <span style="color:#4ade80; font-weight: bold;">ULTRA (Golden CEO Pass)</span>
                        </div>
                        <div class="info-row">
                            <span style="color:#94a3b8;">الرصيد المتاح:</span>
                            <span style="color:#facc15; font-weight: bold;">300 رصيد شهرياً</span>
                        </div>
                    </div>

                    <div class="btn-group">
                        <a href="${OFFICIAL_SITE_URL}" class="btn">الانتقال إلى منصة QureScan</a>
                        <a href="${OFFICIAL_SITE_URL}/admin/ceo-requests" class="btn-secondary">لوحة تحكم CEO</a>
                    </div>
                </div>
            </body>
            </html>
            `,
            { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
        );
    } catch (err: any) {
        console.error("Activation Error:", err);
        return new NextResponse(`Internal Error: ${err.message}`, { status: 500 });
    }
}
