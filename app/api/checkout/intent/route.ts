import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { plan, method } = await req.json();

        if (!plan) {
            return NextResponse.json({ error: "Plan is required" }, { status: 400 });
        }

        // Use Admin Client to bypass RLS insertion restrictions
        const supabaseAdmin = createAdminClient();

        const { data, error } = await supabaseAdmin.from("checkout_intents").insert({
            user_id: user.id,
            plan: plan,
            status: `pending_method_${method || 'unknown'}`,
        }).select().single();

        if (error) {
            console.error("Checkout Intent Error:", error);
            return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
        }

        return NextResponse.json({ success: true, intentId: data.id });

    } catch (error: any) {
        console.error("Checkout API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
