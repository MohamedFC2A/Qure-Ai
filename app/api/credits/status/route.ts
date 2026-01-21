import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCreditsStatus } from "@/lib/creditService";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            // Return 200 with loggedIn: false to prevent frontend 500s on public pages
            return NextResponse.json({
                loggedIn: false,
                plan: 'free',
                planRemaining: 0,
                dailyUsed: 0,
                monthlyUsed: 0,
                extraCredits: 0,
                totalAvailable: 0,
            }, { status: 200 });
        }

        try {
            // Pass the authenticated client so we can see RLS-protected data (like ledger)
            const status = await getCreditsStatus(user.id, supabase);
            return NextResponse.json({ loggedIn: true, ...status });
        } catch (serviceError: any) {
            console.error("Credit Service Error:", serviceError);
            // Fallback if DB is not set up yet
            return NextResponse.json({
                loggedIn: true,
                plan: 'free',
                planRemaining: 0,
                dailyUsed: 0,
                monthlyUsed: 0,
                extraCredits: 0,
                totalAvailable: 0,
                error: "Service unavailable"
            });
        }
    } catch (error: any) {
        console.error("API Error fetching credit status:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
