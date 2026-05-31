import { NextRequest, NextResponse } from "next/server";
import { TERMS_VERSION } from "@/lib/legal/terms";
import { createAdminClient } from "@/lib/supabase/admin";
import { LOCAL_DEV_COOKIE, LOCAL_DEV_EMAIL } from "@/lib/devAuth";

const DEV_EMAIL = LOCAL_DEV_EMAIL;
const DEV_PASSWORD = "LocalDev123!";

function isLocalRequest(request: NextRequest) {
    const host = request.headers.get("host") || "";
    return (
        process.env.NODE_ENV === "development" &&
        (host.startsWith("localhost:") || host.startsWith("127.0.0.1:") || host.startsWith("[::1]:"))
    );
}

async function findUserIdByEmail(email: string) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (error) {
        throw error;
    }

    return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())?.id;
}

export async function POST(request: NextRequest) {
    if (!isLocalRequest(request)) {
        return NextResponse.json({ error: "Local dev login is only available on localhost in development." }, { status: 404 });
    }

    const createResponse = (mode: "supabase" | "offline", error?: string) => {
        const response = NextResponse.json({
            email: DEV_EMAIL,
            password: DEV_PASSWORD,
            mode,
            error,
        });

        response.cookies.set(LOCAL_DEV_COOKIE, "1", {
            path: "/",
            sameSite: "lax",
            httpOnly: false,
            secure: false,
            maxAge: 60 * 60 * 24 * 30,
        });

        return response;
    };

    try {
        const supabase = createAdminClient();
        const userMetadata = {
            username: "local_dev",
            age: 30,
            gender: "other",
            height: "175 cm",
            weight: "75 kg",
            terms_accepted_at: new Date().toISOString(),
            terms_version: TERMS_VERSION,
        };

        const existingUserId = await findUserIdByEmail(DEV_EMAIL);

        if (existingUserId) {
            const { error } = await supabase.auth.admin.updateUserById(existingUserId, {
                password: DEV_PASSWORD,
                email_confirm: true,
                user_metadata: userMetadata,
            });

            if (error) {
                throw error;
            }
        } else {
            const { error } = await supabase.auth.admin.createUser({
                email: DEV_EMAIL,
                password: DEV_PASSWORD,
                email_confirm: true,
                user_metadata: userMetadata,
            });

            if (error) {
                throw error;
            }
        }

        return createResponse("supabase");
    } catch (error: any) {
        return createResponse("offline", error.message || "Supabase is unavailable; using offline local dev login.");
    }
}
