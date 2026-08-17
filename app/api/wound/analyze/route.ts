import { NextRequest, NextResponse } from "next/server";
import { analyzeWoundImage } from "@/lib/ai/wound";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, getCreditsStatus, deductCredit } from "@/lib/creditService";
import { hasAcceptedTerms } from "@/lib/legal/terms";
import { getLocalDevUser } from "@/lib/devAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    try {
        const body = await req.json();
        const { scannedImage, language = "ar", profileId } = body;

        if (!scannedImage) {
            return NextResponse.json({ error: "Missing scanned image data." }, { status: 400 });
        }

        const localDevUser = getLocalDevUser(req);
        const supabase = await createClient();
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData?.user ?? null;
        const user = authUser || localDevUser;

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!localDevUser && !hasAcceptedTerms(user)) {
            return NextResponse.json({ error: "Terms acceptance required", code: "TERMS_REQUIRED" }, { status: 403 });
        }

        const userPlan = localDevUser ? "ultra" : await getUserPlan(user.id, supabase);
        const isUltra = userPlan === "ultra";
        const subjectProfileId = typeof profileId === "string" && profileId ? profileId : user.id;

        // Family/Caregiver Mode is Ultra-only
        if (!isUltra && subjectProfileId !== user.id) {
            return NextResponse.json({ error: "Ultra plan required for Family/Caregiver Mode." }, { status: 402 });
        }

        // Check Credits
        if (!localDevUser && process.env.NODE_ENV !== "development") {
            const creditStatus = await getCreditsStatus(user.id, supabase);
            if (!isUltra && creditStatus.totalAvailable < 1) {
                return NextResponse.json({
                    error: "عذراً، لقد استنفدت رصيد النقاط المتاح لك. يرجى الترقية إلى باقة ULTRA للمزيد من الفحوصات الطبية.",
                    outOfCredits: true,
                }, { status: 402 });
            }
            await deductCredit(user.id, 1, "wound_scan_analysis", supabase);
        }

        console.log(`[Wound API] Analyzing wound image for user ${user.id}...`);

        const analysis = await analyzeWoundImage(scannedImage, language === "ar" ? "ar" : "en");

        let savedId: string | null = null;

        // Persist to Supabase `wound_scans` table if available
        try {
            const adminDb = createAdminClient() || supabase;
            if (adminDb && !localDevUser) {
                const { data: insertRes, error: insertErr } = await adminDb
                    .from("wound_scans")
                    .insert({
                        user_id: user.id,
                        profile_id: subjectProfileId !== user.id ? subjectProfileId : null,
                        wound_title: analysis.woundTitle,
                        anatomical_location: analysis.anatomicalLocation?.location || null,
                        wound_type: analysis.woundType,
                        severity: analysis.severity,
                        infection_risk: analysis.infectionAssessment.riskLevel,
                        requires_sutures: analysis.sutureAssessment.requiresSutures,
                        requires_tetanus: analysis.tetanusAssessment.riskIdentified,
                        healing_stage: analysis.healingStage,
                        tissue_composition: analysis.tissueComposition,
                        analysis_json: analysis,
                        image_url: scannedImage.length < 500000 ? scannedImage : null,
                    })
                    .select("id")
                    .maybeSingle();

                if (!insertErr && insertRes?.id) {
                    savedId = insertRes.id;
                    analysis.id = savedId || undefined;
                }
            }
        } catch (dbErr) {
            console.warn("[Wound API] Database save skipped or table not initialized yet:", dbErr);
        }

        return NextResponse.json({
            ...analysis,
            id: savedId || `wound_${Date.now()}`,
            serverDurationMs: Date.now() - startTime,
        });

    } catch (error: any) {
        console.error("[Wound API] Error:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to complete clinical wound assessment." },
            { status: 500 }
        );
    }
}
