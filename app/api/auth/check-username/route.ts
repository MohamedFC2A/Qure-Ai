import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const username = (searchParams.get("username") || "").trim();

    if (!username) {
        return NextResponse.json({ valid: false, available: false, error: "Username is required." });
    }

    // Check for spaces or Arabic characters
    if (/\s/.test(username)) {
        return NextResponse.json({
            valid: false,
            available: false,
            error: "Username cannot contain spaces.",
            errorAr: "اسم المستخدم لا يمكن أن يحتوي على مسافات.",
        });
    }

    // Strictly enforce English letters, numbers, and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return NextResponse.json({
            valid: false,
            available: false,
            error: "Username can only contain English letters, numbers, and underscores (_).",
            errorAr: "اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام و _ فقط (بدون أحرف عربية أو رموز خاصة).",
        });
    }

    if (username.length < 3 || username.length > 20) {
        return NextResponse.json({
            valid: false,
            available: false,
            error: "Username must be between 3 and 20 characters.",
            errorAr: "يجب أن يكون اسم المستخدم بين 3 و 20 حرفاً.",
        });
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("profiles")
            .select("id")
            .ilike("username", username)
            .limit(1);

        if (error) {
            console.error("[Check Username Error]:", error);
            return NextResponse.json({ valid: true, available: true });
        }

        if (data && data.length > 0) {
            return NextResponse.json({
                valid: true,
                available: false,
                error: "This username is already taken. Please choose another one.",
                errorAr: "اسم المستخدم هذا مأخوذ بالفعل، يرجى اختيار اسم آخر.",
            });
        }

        return NextResponse.json({
            valid: true,
            available: true,
            message: "Username is available",
            messageAr: "اسم المستخدم متاح",
        });
    } catch (err: any) {
        console.error("[Check Username Exception]:", err);
        return NextResponse.json({ valid: true, available: true });
    }
}
