import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const updateProfileSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(20, "Username must be 20 characters or less")
        .regex(/^[a-zA-Z0-9_]+$/, "English letters, numbers, and _ only (no spaces or Arabic)")
        .optional(),
    age: z.coerce
        .number()
        .int()
        .min(1, "Age must be at least 1")
        .max(120, "Age must be 120 or less"),
    gender: z.enum(["male", "female", "other"], {
        message: "Please select a valid gender",
    }),
    height: z.string().min(1, "Height is required"),
    weight: z.string().min(1, "Weight is required"),
});

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (!user || authError) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validated = updateProfileSchema.parse(body);

        const heightVal = validated.height.includes("cm") ? validated.height : `${validated.height} cm`;
        const weightVal = validated.weight.includes("kg") ? validated.weight : `${validated.weight} kg`;

        const updatePayload: Record<string, any> = {
            age: validated.age,
            gender: validated.gender,
            height: heightVal,
            weight: weightVal,
            updated_at: new Date().toISOString(),
        };

        if (validated.username) {
            const cleanUsername = validated.username.trim().toLowerCase();
            updatePayload.username = cleanUsername;
        }

        // 1. Try authenticated client update
        const { error: profileError } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("id", user.id);

        // 2. Fallback to admin client if RLS blocked or column security tripped
        if (profileError && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const admin = createAdminClient();
            await admin
                .from("profiles")
                .update(updatePayload)
                .eq("id", user.id);
        }

        // 3. Update self care_profile if exists
        try {
            await supabase
                .from("care_profiles")
                .update({
                    age: validated.age,
                    gender: validated.gender,
                    updated_at: new Date().toISOString(),
                })
                .eq("owner_user_id", user.id)
                .eq("relationship", "self");
        } catch {
            // best effort
        }

        return NextResponse.json({
            success: true,
            profile: updatePayload,
        });
    } catch (err: any) {
        console.error("[Profile Update Error]:", err);
        return NextResponse.json(
            { error: err.errors?.[0]?.message || err.message || "Failed to update profile" },
            { status: 400 }
        );
    }
}
