import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCreditsStatus } from "@/lib/creditService";
import { getLocalDevUser } from "@/lib/devAuth";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData?.user ?? null;
        const user = authUser || getLocalDevUser(req);

        if (!user) {
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

        if (process.env.NODE_ENV === "development" && user.id === "00000000-0000-0000-0000-000000000001") {
            return NextResponse.json({
                loggedIn: true,
                plan: 'ultra',
                planRemaining: 999999,
                dailyUsed: 0,
                monthlyUsed: 0,
                extraCredits: 999999,
                totalAvailable: 999999,
            });
        }

        try {
            const status = await getCreditsStatus(user.id, supabase);
            return NextResponse.json({ loggedIn: true, ...status });
        } catch (serviceError: any) {
            console.error("Credit Service Error:", serviceError);
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
