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

    // Default fallback to public domain for mobile phone compatibility
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
                { error: "Please provide a valid email address." },
                { status: 400 }
            );
        }

        if (!cleanPassword || cleanPassword.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters long." },
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
                        message: "This email is already registered and verified. Please sign in with your password.",
                    });
                } else {
                    // User exists but unconfirmed: generate link & send email again
                    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
                        type: "signup",
                        email: cleanEmail,
                        password: cleanPassword,
                        options: {
                            redirectTo: targetCallbackUrl,
                            data: userMetadata,
                        },
                    });

                    if (!linkErr && linkData?.properties?.action_link) {
                        const emailResult = await sendSignupVerificationEmail({
                            email: cleanEmail,
                            username: cleanUsername,
                            confirmationUrl: linkData.properties.action_link,
                            siteUrl,
                        });

                        return NextResponse.json({
                            success: true,
                            email: cleanEmail,
                            resent: true,
                            emailSent: emailResult.success,
                            message: "Confirmation link regenerated and sent to your email.",
                        });
                    }
                }
            }
        }

        // 2. Generate new user signup verification link
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
            console.warn("[Signup API] generateLink error, falling back to direct create:", generateError.message);
            // Fallback: create user directly
            const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: cleanEmail,
                password: cleanPassword,
                email_confirm: false,
                user_metadata: userMetadata,
            });

            if (createError) {
                throw createError;
            }

            return NextResponse.json({
                success: true,
                email: cleanEmail,
                message: "Account created successfully. Please check your inbox for confirmation.",
            });
        }

        const confirmationUrl = linkData.properties.action_link;

        // 3. Send custom styled confirmation email via our multi-transport service
        const emailResult = await sendSignupVerificationEmail({
            email: cleanEmail,
            username: cleanUsername,
            confirmationUrl,
            siteUrl,
        });

        console.log(`[Signup API] Processed signup for ${cleanEmail}, email sent via: ${emailResult.method}`);

        return NextResponse.json({
            success: true,
            email: cleanEmail,
            emailSent: emailResult.success,
            message: "Account created successfully. Confirmation link sent to your email.",
        });

    } catch (err: any) {
        console.error("[Signup API Error]:", err);
        return NextResponse.json(
            { error: err.message || "An unexpected error occurred during registration." },
            { status: 500 }
        );
    }
}
