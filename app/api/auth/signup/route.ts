import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TERMS_VERSION } from "@/lib/legal/terms";
import { sendSignupVerificationEmail } from "@/lib/emailService";

function getPublicSiteUrl(request: NextRequest): string {
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const host = forwardedHost || request.headers.get("host");
    const proto = forwardedProto || "https";

    if (host && !host.startsWith("localhost") && !host.startsWith("127.0.0.1")) {
        return `${proto}://${host}`;
    }

    if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")) {
        return process.env.NEXT_PUBLIC_SITE_URL;
    }

    return host ? `http://${host}` : "https://qure-ai-nexus.vercel.app";
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            email,
            password,
            username,
            age,
            gender,
            heightCm,
            weightKg,
            redirectTo,
        } = body;

        const cleanEmail = (email || "").trim().toLowerCase();
        const cleanPassword = password || "";
        const cleanUsername = (username || cleanEmail.split("@")[0]).trim();

        if (!cleanEmail || !cleanEmail.includes("@")) {
            return NextResponse.json(
                { error: "Please provide a valid email address.", errorAr: "يرجى إدخال بريد إلكتروني صحيح." },
                { status: 400 }
            );
        }

        if (!cleanPassword || cleanPassword.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters long.", errorAr: "يجب أن تكون كلمة المرور 8 أحرف على الأقل." },
                { status: 400 }
            );
        }

        const siteUrl = getPublicSiteUrl(request);
        const targetCallbackUrl = redirectTo || `${siteUrl}/auth/callback?next=/scan`;

        const userMetadata = {
            username: cleanUsername,
            age: age ? Number(age) : 25,
            gender: gender || "other",
            height: heightCm ? `${heightCm} cm` : "175 cm",
            weight: weightKg ? `${weightKg} kg` : "70 kg",
            terms_accepted_at: new Date().toISOString(),
            terms_version: TERMS_VERSION,
        };

        const supabaseAdmin = createAdminClient();

        // 1. Check if user already exists
        const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
        });

        if (!listError && userList?.users) {
            const existingUser = userList.users.find(
                (u) => u.email?.toLowerCase() === cleanEmail
            );

            if (existingUser) {
                if (existingUser.email_confirmed_at) {
                    return NextResponse.json({
                        alreadyRegistered: true,
                        confirmed: true,
                        message: "This email is already registered. Please sign in directly.",
                        messageAr: "هذا البريد الإلكتروني مسجل مسبقاً! يرجى تسجيل الدخول مباشرة بكلمة المرور الخاصة بك.",
                    });
                } else {
                    // Update user to confirmed status & update password
                    await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                        email_confirm: true,
                        password: cleanPassword,
                        user_metadata: userMetadata,
                    });

                    return NextResponse.json({
                        success: true,
                        email: cleanEmail,
                        confirmed: true,
                        message: "Account verified and activated. Signing in...",
                        messageAr: "تم تفعيل الحساب بنجاح. جاري تسجيل الدخول...",
                    });
                }
            }
        }

        // 2. Create user directly with auto-confirmation enabled (no email block!)
        const { data: createdData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: cleanPassword,
            email_confirm: true,
            user_metadata: userMetadata,
        });

        if (createError) {
            console.warn("[Signup API] createUser error, fallback to generateLink:", createError.message);
            // Fallback: generate signup link
            const { data: linkData, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
                type: "signup",
                email: cleanEmail,
                password: cleanPassword,
                options: {
                    redirectTo: targetCallbackUrl,
                    data: userMetadata,
                },
            });

            if (generateError) {
                throw generateError;
            }

            if (linkData?.properties?.action_link) {
                sendSignupVerificationEmail({
                    email: cleanEmail,
                    username: cleanUsername,
                    confirmationUrl: linkData.properties.action_link,
                    siteUrl,
                }).catch((e) => console.warn("[Signup Email Fail]:", e));
            }
        }

        // Send welcome email asynchronously without blocking signup response
        sendSignupVerificationEmail({
            email: cleanEmail,
            username: cleanUsername,
            confirmationUrl: `${siteUrl}/login`,
            siteUrl,
        }).catch((e) => console.warn("[Signup Welcome Email Fail]:", e));

        return NextResponse.json({
            success: true,
            email: cleanEmail,
            confirmed: true,
            message: "Account created successfully. Signing in...",
            messageAr: "تم إنشاء الحساب بنجاح. جاري تسجيل الدخول...",
        });

    } catch (err: any) {
        console.error("[Signup API Exception]:", err);
        return NextResponse.json(
            { error: err.message || "An unexpected error occurred during registration." },
            { status: 500 }
        );
    }
}
