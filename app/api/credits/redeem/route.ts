import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code } = await req.json();

        // Validation: String only, allow leading zeros, basic trim, uppercase
        const cleanCode = String(code).trim().toUpperCase();

        if (!cleanCode || cleanCode.length < 3) {
            return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
        }

        // We use the authenticated user client. 
        // Since the RPC is 'security definer', it will run with necessary privileges 
        // even though called by the user.
        const { data: result, error: rpcError } = await supabase
            .rpc('redeem_topup_code', {
                p_code: cleanCode,
                p_user_id: user.id
            });

        if (rpcError) {
            console.error("RPC Error:", rpcError);
            // If function doesn't exist (PGRST202 or similar), suggest migration
            if (rpcError.message?.includes('function') || rpcError.code === 'PGRST202') {
                return NextResponse.json({ error: "System update required. Please contact support." }, { status: 503 });
            }
            return NextResponse.json({ error: `Redemption Error: ${rpcError.message}` }, { status: 500 });
        }

        // RPC returns jsonb: { success: boolean, error?: string, credits_added?: number }
        if (!result.success) {
            console.warn(`Redemption failed for code '${cleanCode}':`, result.error);
            return NextResponse.json({ error: result.error || "Invalid or expired code" }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            credits: result.credits_added,
            message: `Successfully added ${result.credits_added} credits!`
        });

    } catch (error: any) {
        console.error("Promo API Error:", error);
        return NextResponse.json({ error: `Redemption failed: ${error.message}` }, { status: 500 });
    }
}
