import { NextRequest, NextResponse } from "next/server";
import { extractPossibleNdc, fetchOpenFdaLabelSnapshot, fetchOpenFdaNdcSnapshot } from "@/lib/openfda";
import { createClient } from "@/lib/supabase/server";
import { hasAcceptedTerms } from "@/lib/legal/terms";

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!hasAcceptedTerms(user)) {
            return NextResponse.json({ error: "Terms acceptance required", code: "TERMS_REQUIRED" }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));

        const language: "en" | "ar" = body?.language === "ar" ? "ar" : "en";
        const drugName = body?.drugName ? String(body.drugName).trim() : "";
        const drugNameEn = body?.drugNameEn ? String(body.drugNameEn).trim() : "";
        const genericName = body?.genericName ? String(body.genericName).trim() : "";
        const genericNameEn = body?.genericNameEn ? String(body.genericNameEn).trim() : "";
        const manufacturer = body?.manufacturer ? String(body.manufacturer).trim() : "";
        const ocrText = body?.ocrText ? String(body.ocrText) : "";
        const productNdc = body?.productNdc ? String(body.productNdc).trim() : extractPossibleNdc(ocrText || "");

        const brandForFda = drugNameEn || (language === "en" ? drugName : "");
        const genericForFda = genericNameEn || (language === "en" ? genericName : "");

        if (!brandForFda && !genericForFda && !productNdc) {
            return NextResponse.json({
                found: false,
                query: {
                    brand: null,
                    generic: null,
                    productNdc: null,
                    manufacturer: manufacturer || null,
                    attemptedSearch: null,
                },
                fetchedAt: new Date().toISOString(),
                error: "Not enough identifiers for FDA lookup (needs an English name or NDC).",
                serverDurationMs: Date.now() - startTime,
            });
        }

        const snapshot = await fetchOpenFdaLabelSnapshot({
            brand: brandForFda || null,
            generic: genericForFda || null,
            productNdc: productNdc || null,
            manufacturer: manufacturer || null,
            limit: 5,
        });

        // Best-effort: also fetch drug/ndc dataset for active-ingredient strengths.
        let ndcSnapshot: any = null;
        try {
            const productNdcFromLabel = (snapshot as any)?.openfda?.product_ndc?.[0] ? String((snapshot as any).openfda.product_ndc[0]) : null;
            ndcSnapshot = await fetchOpenFdaNdcSnapshot({
                packageNdc: productNdc || null,
                productNdc: productNdcFromLabel || productNdc || null,
                brand: brandForFda || null,
                generic: genericForFda || null,
                manufacturer: manufacturer || null,
                limit: 5,
            });
        } catch {
            ndcSnapshot = null;
        }

        return NextResponse.json({
            ...(snapshot as any),
            ndc: ndcSnapshot || undefined,
            serverDurationMs: Date.now() - startTime
        });
    } catch (error: any) {
        console.error("openFDA route error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
