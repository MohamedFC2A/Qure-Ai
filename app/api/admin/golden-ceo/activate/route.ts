import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kzrcnmxcmrvrahukabjh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmNubXhjbXJ2cmFodWthYmpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDI1MDk0NywiZXhwIjoyMDk1ODI2OTQ3fQ.R1COHheLS0dKYuT_uJcmXnpCxMYcVxA6b5RsF1ksTCo";
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
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>خطأ في التفعيل</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #030712; color: #f87171; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; }
                    .card { background: #0f172a; padding: 28px; border-radius: 20px; border: 1px solid #ef4444; text-align: center; max-width: 440px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2 style="margin:0 0 8px;">❌ رابط التفعيل غير صالح</h2>
                    <p style="color:#94a3b8; font-size:14px; margin:0;">يرجى التأكد من الضغط على الرابط الصحيح من البريد الإلكتروني.</p>
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
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <title>الطلب مفعل مسبقاً</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #030712; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; }
                        .card { background: #0f172a; padding: 32px; border-radius: 20px; border: 1px solid #3b82f6; text-align: center; max-width: 460px; }
                        .btn { background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: bold; display: inline-block; margin-top: 16px; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h2 style="color:#60a5fa; margin:0 0 8px;">ℹ️ تم تفعيل هذا الحساب بالفعل سابقاً</h2>
                        <p style="color:#94a3b8; font-size:14px; margin:0;">هذا الطلب قد تم تفعيله مسبقاً، والمستخدم يتمتع بباقة ألترا حالياً.</p>
                        <a href="${OFFICIAL_SITE_URL}/admin/ceo-requests" class="btn">الانتقال إلى لوحة تحكم CEO</a>
                    </div>
                </body>
                </html>
                `,
                { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 200 }
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

        const userName = requestRecord.full_name || requestRecord.username || requestRecord.email || "مستخدم VIP";
        const userEmail = requestRecord.email;

        return new NextResponse(
            `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>تم التفعيل بنجاح • QureScan CEO</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #030712; color: #ffffff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; box-sizing: border-box; }
                    .card { background: #0f172a; border: 1.5px solid #22c55e; border-radius: 24px; padding: 32px 24px; text-align: center; max-width: 480px; width: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.7); }
                    .icon { width: 70px; height: 70px; background: rgba(34, 197, 94, 0.15); border: 2px solid #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 36px; }
                    h1 { color: #4ade80; font-size: 22px; font-weight: 900; margin: 0 0 8px; }
                    p { color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0 0 20px; }
                    .info-box { background: #131d31; border: 1px solid #1e293b; border-radius: 16px; padding: 16px; margin-bottom: 24px; text-align: right; }
                    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; font-size: 13px; border-bottom: 1px solid #1e293b; }
                    .info-row:last-child { border-bottom: none; }
                    .badge { background: #22c55e; color: #000; font-weight: 900; font-size: 11px; padding: 2px 8px; border-radius: 6px; }
                    .btn-group { display: flex; flex-direction: column; gap: 10px; }
                    .btn { background: #22c55e; color: #000000 !important; font-weight: 900; text-decoration: none; padding: 14px 20px; border-radius: 14px; display: block; font-size: 14px; }
                    .btn-secondary { background: #1e293b; border: 1px solid #334155; color: #cbd5e1 !important; font-weight: bold; text-decoration: none; padding: 12px 20px; border-radius: 14px; display: block; font-size: 13px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">👑</div>
                    <h1>تم تفعيل الاشتراك الذهبي بنجاح!</h1>
                    <p>تم ترقية الحساب فوراً إلى باقة <strong>ULTRA</strong> وتعيين الرصيد الشهري إلى <strong>٣٠٠ رصيد</strong>.</p>
                    
                    <div class="info-box">
                        <div class="info-row">
                            <span style="color:#94a3b8;">المستخدم:</span>
                            <span style="color:#f8fafc; font-weight: bold;">${userName}</span>
                        </div>
                        <div class="info-row">
                            <span style="color:#94a3b8;">البريد الإلكتروني:</span>
                            <span style="color:#38bdf8;">${userEmail}</span>
                        </div>
                        <div class="info-row">
                            <span style="color:#94a3b8;">الخطة الجديدة:</span>
                            <span class="badge">ULTRA (VIP)</span>
                        </div>
                        <div class="info-row">
                            <span style="color:#94a3b8;">الرصيد الشهري:</span>
                            <span style="color:#facc15; font-weight: bold;">٣٠٠ رصيد شهرياً</span>
                        </div>
                    </div>

                    <div class="btn-group">
                        <a href="${OFFICIAL_SITE_URL}" class="btn">الانتقال إلى منصة QureScan</a>
                        <a href="${OFFICIAL_SITE_URL}/admin/ceo-requests" class="btn-secondary">فتح لوحة تحكم CEO</a>
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
