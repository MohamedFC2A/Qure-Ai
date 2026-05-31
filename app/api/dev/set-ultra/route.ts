import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
    try {
        const supabase = createAdminClient();
        const userId = "43304a66-686e-437d-b171-3734d37cda59";
        
        const { data, error } = await supabase
            .from("profiles")
            .update({ plan: "ultra" })
            .eq("id", userId)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "User plan updated to ultra", data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to update user plan" }, { status: 500 });
    }
}
