import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { TERMS_VERSION } from "@/lib/legal/terms";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const biometricVerified = Boolean(body.biometricVerified);
        const timestamp = new Date().toISOString();

        let response = NextResponse.json({
            success: true,
            terms_accepted_at: timestamp,
            terms_version: TERMS_VERSION,
            biometric_verified: biometricVerified,
        });

        // 1. Get authenticated user from request cookies
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return req.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            response.cookies.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { data: authData, error: userError } = await supabase.auth.getUser();
        const user = authData?.user ?? null;

        // 2. Set client cookie to immediately unblock middleware
        response.cookies.set("qurescan_terms_accepted", "1", {
            path: "/",
            maxAge: 31536000,
            sameSite: "lax",
        });

        if (user && !userError) {
            // Update auth user metadata
            await supabase.auth.updateUser({
                data: {
                    terms_accepted_at: timestamp,
                    terms_version: TERMS_VERSION,
                    biometric_verified: biometricVerified,
                },
            });

            // Update admin profile if service role is available
            try {
                const admin = createAdminClient();
                await admin
                    .from("profiles")
                    .update({
                        updated_at: timestamp,
                    })
                    .eq("id", user.id);
            } catch (admErr) {
                console.warn("[AcceptTerms] Admin update skipped:", admErr);
            }
        }

        return response;
    } catch (err: any) {
        console.error("[AcceptTerms Error]:", err);
        return NextResponse.json(
            { error: err.message || "Failed to record terms acceptance" },
            { status: 500 }
        );
    }
}
