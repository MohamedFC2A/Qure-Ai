import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendGoldenCeoNotificationEmail } from "@/lib/emailService";
import { getLocalDevUser } from "@/lib/devAuth";
import crypto from "crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kzrcnmxcmrvrahukabjh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const OFFICIAL_SITE_URL = "https://qure-ai-nexus.vercel.app";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const user = authUser || getLocalDevUser(req);

        if (!user) {
            return NextResponse.json({ request: null });
        }

        const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: request } = await adminSupabase
            .from("ceo_upgrade_requests")
            .select("id, status, created_at, activated_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        return NextResponse.json({ request });
    } catch (err: any) {
        return NextResponse.json({ request: null });
    }
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const user = authUser || getLocalDevUser(req);

        if (!user) {
            return NextResponse.json({
                error: "يرجى تسجيل الدخول أولاً لتقديم طلب الاشتراك الذهبي.",
                requiresAuth: true
            }, { status: 401 });
        }

        // Fetch detailed profile
        let profile: any = null;
        const { data: profileData } = await supabase
            .from("profiles")
            .select("username, full_name, gender, age, height, weight, plan")
            .eq("id", user.id)
            .maybeSingle();
        profile = profileData || {};

        // Note: Allow even existing ultra or beta users to send/test CEO activation requests freely

        const activationToken = crypto.randomBytes(24).toString("hex");
        const protocol = req.headers.get("x-forwarded-proto") || "https";
        const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
        const siteUrl = host && !host.includes("localhost")
            ? `${protocol}://${host}`
            : OFFICIAL_SITE_URL;

        // Insert into database using admin client
        if (SUPABASE_SERVICE_ROLE_KEY) {
            const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            await adminSupabase
                .from("ceo_upgrade_requests")
                .insert({
                    user_id: user.id,
                    email: user.email,
                    full_name: profile.full_name || null,
                    username: profile.username || null,
                    profile_details: {
                        age: profile.age,
                        gender: profile.gender,
                        height: profile.height,
                        weight: profile.weight,
                        currentPlan: profile.plan || "free",
                    },
                    status: "pending",
                    activation_token: activationToken,
                });
        }

        // Send Email Notification to Mohamed Matany (CEO)
        await sendGoldenCeoNotificationEmail({
            userId: user.id,
            email: user.email || "unknown@user.local",
            fullName: profile.full_name,
            username: profile.username,
            age: profile.age,
            gender: profile.gender,
            height: profile.height,
            weight: profile.weight,
            currentPlan: profile.plan || "free",
            activationToken,
            siteUrl,
        });

        return NextResponse.json({
            success: true,
            message: "تم إرسال طلبك بنجاح. سيتم مراجعة معرف المستخدم من قبل الإدارة وتفعيل الحساب فوراً.",
        });
    } catch (error: any) {
        console.error("Golden CEO Request Error:", error);
        return NextResponse.json({
            error: "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً.",
        }, { status: 500 });
    }
}
