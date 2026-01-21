import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Call Purchase RPC
        const { data: result, error: rpcError } = await supabase
            .rpc('purchase_ultra_plan', {
                p_user_id: user.id
            });

        if (rpcError) {
            console.error("Purchase RPC Error:", rpcError);
            return NextResponse.json({ error: "Purchase failed: " + rpcError.message }, { status: 500 });
        }

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: result.message
        });

    } catch (error: any) {
        console.error("Purchase API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
