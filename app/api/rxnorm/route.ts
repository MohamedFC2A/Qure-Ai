import { NextRequest, NextResponse } from "next/server";
import { searchRxNorm, getRxNormConceptDetails, getRxNormByNDC } from "@/lib/rxnorm";
import { createClient } from "@/lib/supabase/server";
import { hasAcceptedTerms } from "@/lib/legal/terms";
import { getLocalDevUser } from "@/lib/devAuth";

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const user = authUser || getLocalDevUser(request);

    if (!user) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!getLocalDevUser(request) && !hasAcceptedTerms(user)) {
        return NextResponse.json({ ok: false, error: "Terms acceptance required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "search";
    const term = searchParams.get("term") || searchParams.get("q") || "";
    const rxcui = searchParams.get("rxcui") || "";
    const ndc = searchParams.get("ndc") || "";

    try {
        if (action === "concept" && rxcui) {
            const details = await getRxNormConceptDetails(rxcui);
            return NextResponse.json({ ok: true, details });
        }

        if (action === "ndc" && ndc) {
            const mappedRxcui = await getRxNormByNDC(ndc);
            return NextResponse.json({ ok: true, ndc, rxcui: mappedRxcui });
        }

        if (!term) {
            return NextResponse.json(
                { ok: false, error: "Query parameter 'term' is required for action=search" },
                { status: 400 }
            );
        }

        const result = await searchRxNorm(term);
        return NextResponse.json({
            ok: true,
            query: term,
            match: result,
        });
    } catch (error: any) {
        console.error("RxNorm API Route Error:", error);
        return NextResponse.json(
            { ok: false, error: error?.message || "RxNorm processing failed" },
            { status: 500 }
        );
    }
}
