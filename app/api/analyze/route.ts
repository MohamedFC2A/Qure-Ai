import { NextRequest, NextResponse } from "next/server";
import { analyzeMedicationText } from "@/lib/ai/vision";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/creditService";
import { extractPossibleNdc, fetchOpenFdaLabelSnapshot } from "@/lib/openfda";
import { hasAcceptedTerms } from "@/lib/legal/terms";
import { preflightMedicationEvidence, type ProductClassification } from "@/lib/medicationEnrichment";

function normalizeMedicationName(name: string): string {
    return String(name || "")
        .normalize("NFKC")
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function classifyFromFdaProductTypes(productTypes: unknown): ProductClassification | null {
    const list = Array.isArray(productTypes) ? productTypes.map((s) => String(s || "").toUpperCase()) : [];
    if (list.length === 0) return null;

    const reasons = list.map((t) => `openFDA product_type: ${t}`);
    const joined = list.join(" | ");
    if (joined.includes("ANIMAL")) {
        if (joined.includes("DIETARY") || joined.includes("SUPPLEMENT")) {
            return { kind: "veterinary_supplement", confidence: 95, reasons };
        }
        return { kind: "veterinary_drug", confidence: 95, reasons };
    }
    if (joined.includes("DIETARY") || joined.includes("SUPPLEMENT")) {
        return { kind: "human_supplement", confidence: 92, reasons };
    }
    if (joined.includes("HUMAN") || joined.includes("DRUG")) {
        return { kind: "human_drug", confidence: 92, reasons };
    }
    return { kind: "unknown", confidence: 70, reasons };
}

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    try {
        const body = await req.json();
        const { text, language } = body;

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAcceptedTerms(user)) {
            return NextResponse.json({ error: "Terms acceptance required", code: "TERMS_REQUIRED" }, { status: 403 });
        }

        const userPlan = await getUserPlan(user.id, supabase);
        const isUltra = userPlan === 'ultra';

        let savedToHistory = false;
        let historyId: string | null = null;
        let memoryInfo: any = null;

        // Ultra-only context: Private AI Profile + Medication Memories
        let analysisContext: any = undefined;
        if (isUltra) {
            try {
                const { data: privateProfile } = await supabase
                    .from('user_private_profile')
                    .select('age, sex, weight, allergies, chronic_conditions, current_medications, notes')
                    .eq('user_id', user.id)
                    .maybeSingle();

                const { data: memoriesRows } = await supabase
                    .from('memories_medications')
                    .select('display_name')
                    .eq('user_id', user.id)
                    .order('last_seen_at', { ascending: false })
                    .limit(25);

                analysisContext = {
                    privateProfile: privateProfile || null,
                    medicationMemories: (memoriesRows || [])
                        .map((r: any) => String(r.display_name || '').trim())
                        .filter(Boolean),
                };
            } catch (e) {
                console.warn("Ultra context load failed:", e);
            }
        }

        const lang: "en" | "ar" = language === "ar" ? "ar" : "en";

        // 0. Preflight verification: web (Serper) + openFDA (best-effort) BEFORE full AI analysis
        const preflight = await preflightMedicationEvidence({ ocrText: text, language: lang });

        // 1. Call AI Service (DeepSeek) with verification evidence
        const data = await analyzeMedicationText(text, lang, analysisContext, preflight.evidenceForAi);

        // 1b. Post-analysis openFDA pass (best-effort): improves hit-rate using AI's English identifiers.
        // This does NOT replace the fact that preflight already ran before analysis.
        let fdaFinal: any = preflight.fda || null;
        try {
            if (!fdaFinal?.found) {
                const ndc = preflight.ndc || extractPossibleNdc(text);
                const brandForFda =
                    String((data as any)?.drugNameEn || "").trim() ||
                    (lang === "en" ? String((data as any)?.drugName || "").trim() : "");
                const genericForFda =
                    String((data as any)?.genericNameEn || "").trim() ||
                    (lang === "en" ? String((data as any)?.genericName || "").trim() : "");

                if (brandForFda || genericForFda || ndc) {
                    const next = await fetchOpenFdaLabelSnapshot({
                        brand: brandForFda || null,
                        generic: genericForFda || null,
                        productNdc: ndc || null,
                        manufacturer: String((data as any)?.manufacturer || "").trim() || null,
                        limit: 5,
                    });

                    if (next?.found || !fdaFinal) fdaFinal = next;
                }
            }
        } catch (e) {
            console.warn("openFDA post-analysis lookup failed:", e);
        }

        const classificationFromFinalFda = classifyFromFdaProductTypes((fdaFinal as any)?.openfda?.product_type);
        const productClassification =
            classificationFromFinalFda && classificationFromFinalFda.confidence >= (preflight.classification?.confidence ?? 0)
                ? classificationFromFinalFda
                : preflight.classification;

        const analysisWithEnrichment = {
            ...(data as any),
            fda: fdaFinal || preflight.fda,
            web: preflight.web,
            productClassification,
        };

        // 2. Save Analysis to Supabase (Protected)
        if (analysisWithEnrichment && (analysisWithEnrichment as any).drugName !== "Unknown") {
            try {
                const { data: historyRow, error: historyError } = await supabase
                    .from("medication_history")
                    .insert({
                    user_id: user.id,
                    drug_name: (analysisWithEnrichment as any).drugName || "Target Medication",
                    manufacturer: (analysisWithEnrichment as any).manufacturer || "Generic",
                    analysis_json: analysisWithEnrichment,
                    })
                    .select("id")
                    .single();

                if (!historyError && historyRow?.id) {
                    savedToHistory = true;
                    historyId = historyRow.id;
                    console.log("Analysis saved to history for user:", user.id);
                } else if (historyError) {
                    console.error("History insert failed:", historyError);
                }

                // Ultra-only: record medication memory (used for future interaction checks)
                if (isUltra) {
                    const displayName = String((analysisWithEnrichment as any).drugName || '').trim();
                    const normalizedName = normalizeMedicationName(displayName);

                    if (displayName && displayName !== 'Unknown' && normalizedName) {
                        const nowIso = new Date().toISOString();
                        const { data: existing } = await supabase
                            .from('memories_medications')
                            .select('id, count')
                            .eq('user_id', user.id)
                            .eq('normalized_name', normalizedName)
                            .maybeSingle();

                        if (existing?.id) {
                            const { error: updateError } = await supabase
                                .from('memories_medications')
                                .update({
                                    display_name: displayName,
                                    count: Number(existing.count || 0) + 1,
                                    last_seen_at: nowIso,
                                })
                                .eq('id', existing.id);

                            if (!updateError) {
                                memoryInfo = {
                                    display_name: displayName,
                                    normalized_name: normalizedName,
                                    count: Number(existing.count || 0) + 1,
                                    last_seen_at: nowIso,
                                };
                            }
                        } else {
                            const { data: inserted, error: insertError } = await supabase
                                .from('memories_medications')
                                .insert({
                                user_id: user.id,
                                normalized_name: normalizedName,
                                display_name: displayName,
                                count: 1,
                                first_seen_at: nowIso,
                                last_seen_at: nowIso,
                                metadata: { source: 'scan', genericName: (analysisWithEnrichment as any).genericName },
                                })
                                .select('display_name, normalized_name, count, last_seen_at')
                                .single();

                            if (!insertError) {
                                memoryInfo = inserted;
                            }
                        }
                    }
                }
            } catch (dbError) {
                console.error("Database Save Failed:", dbError);
            }
        }

        return NextResponse.json({
            ...(analysisWithEnrichment as any),
            meta: {
                plan: userPlan,
                savedToHistory,
                historyId,
                usedPrivateContext: Boolean(isUltra && analysisContext?.privateProfile),
                usedMedicationMemories: Boolean(isUltra && (analysisContext?.medicationMemories?.length || 0) > 0),
                medicationMemoriesCount: Number(analysisContext?.medicationMemories?.length || 0),
                hasPrivateProfile: Boolean(isUltra && analysisContext?.privateProfile),
                memory: memoryInfo,
                usedWebVerification: Boolean(preflight.web?.found),
                usedFdaVerification: Boolean((analysisWithEnrichment as any)?.fda?.found),
            },
            serverDurationMs: Date.now() - startTime
        });
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
