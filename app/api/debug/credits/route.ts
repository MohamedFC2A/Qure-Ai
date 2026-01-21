import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch ALL rows from credit_ledger for this user
        // We select everything to inspect metadata and delta
        const { data: rows, error } = await supabase
            .from('credit_ledger')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        // Calculate balance manually here to verify logic
        const balance = (rows || []).reduce((acc: number, row: any) => {
            // Replicate logic from creditService.ts
            if (row.metadata?.source === 'plan') return acc;
            return acc + row.delta;
        }, 0);

        return NextResponse.json({
            user_id: user.id,
            rows_found: rows?.length || 0,
            calculated_balance: balance,
            rows: rows, // Send back rows to inspect
            server_time: new Date().toISOString()
        });

    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
