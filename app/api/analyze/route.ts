import { NextRequest, NextResponse } from "next/server";
import { analyzeMedicationText } from "@/lib/ai/vision";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/creditService";
import { extractPossibleNdc, fetchOpenFdaLabelSnapshot, fetchOpenFdaNdcSnapshot } from "@/lib/openfda";
import { hasAcceptedTerms } from "@/lib/legal/terms";
import { preflightMedicationEvidence, type ProductClassification } from "@/lib/medicationEnrichment";
import { generateInteractionGuard } from "@/lib/ai/interactionGuard";

function normalizeMedicationName(name: string): string {
    return String(name || "")
        .normalize("NFKC")
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function parseMedicationList(raw: unknown): string[] {
    const text = String(raw || "").trim();
    if (!text) return [];
    return text
        .split(/[\n\r,;|•·\u2022،]+/g)
        .map((s) => String(s || "").trim())
        .filter((s) => s.length >= 2)
        .slice(0, 50);
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
        const requestedFdaEnabled = (body as any)?.fdaEnabled;
        const fdaEnabled = isUltra ? requestedFdaEnabled !== false : true;

        const requestedProfileId = typeof (body as any)?.profileId === "string" ? String((body as any).profileId) : null;
        let subjectProfileId = requestedProfileId || user.id;

        // Family/Caregiver Mode is Ultra-only.
        if (!isUltra && subjectProfileId !== user.id) {
            return NextResponse.json({ error: "Ultra plan required for Family/Caregiver Mode." }, { status: 402 });
        }

        let savedToHistory = false;
        let historyId: string | null = null;
        let memoryInfo: any = null;

        // Owner profile (account-level basics). Used as fallback for "self" subject.
        let ownerProfileBasics: any = null;
        try {
            const { data } = await supabase
                .from('profiles')
                .select('username, full_name, gender, age, height, weight')
                .eq('id', user.id)
                .maybeSingle();
            ownerProfileBasics = data || null;
        } catch (e) {
            ownerProfileBasics = null;
        }

        // Resolve subject care-profile (must belong to the current account)
        let subjectProfile: any = null;
        try {
            const { data } = await supabase
                .from('care_profiles')
                .select('id, display_name, relationship')
                .eq('id', subjectProfileId)
                .eq('owner_user_id', user.id)
                .maybeSingle();
            subjectProfile = data || null;
        } catch (e) {
            subjectProfile = null;
        }

        // If invalid/missing, fall back to self.
        if (!subjectProfile) {
            subjectProfileId = user.id;
            try {
                const { data } = await supabase
                    .from('care_profiles')
                    .select('id, display_name, relationship')
                    .eq('id', subjectProfileId)
                    .eq('owner_user_id', user.id)
                    .maybeSingle();
                subjectProfile = data || null;
            } catch (e) {
                subjectProfile = null;
            }
        }

        if (!subjectProfile) {
            subjectProfile = {
                id: subjectProfileId,
                display_name:
                    (ownerProfileBasics as any)?.username ||
                    (ownerProfileBasics as any)?.full_name ||
                    String(user.email || "Me"),
                relationship: subjectProfileId === user.id ? "self" : null,
            };
        }

        // Ultra-only context: Private AI Profile + Medication Memories
        let analysisContext: any = undefined;
        if (isUltra) {
            try {
                const { data: carePrivate } = await supabase
                    .from('care_private_profiles')
                    .select('age, sex, height, weight, allergies, chronic_conditions, current_medications, notes')
                    .eq('profile_id', subjectProfileId)
                    .maybeSingle();

                // Legacy fallback for self (if you used the old table before enabling Family Mode)
                let legacySelfPrivate: any = null;
                if (!carePrivate && subjectProfileId === user.id) {
                    const { data: legacy } = await supabase
                        .from('user_private_profile')
                        .select('age, sex, weight, allergies, chronic_conditions, current_medications, notes')
                        .eq('user_id', user.id)
                        .maybeSingle();
                    legacySelfPrivate = legacy || null;
                }

                const effectivePrivate = (carePrivate || legacySelfPrivate) as any;

                let memoriesRows: any[] = [];
                const memoriesRes = await supabase
                    .from('memories_medications')
                    .select('display_name')
                    .eq('user_id', user.id)
                    .eq('profile_id', subjectProfileId)
                    .order('last_seen_at', { ascending: false })
                    .limit(25);

                if (memoriesRes.error) {
                    // Legacy fallback (before profile_id existed)
                    const legacyRes = await supabase
                        .from('memories_medications')
                        .select('display_name')
                        .eq('user_id', user.id)
                        .order('last_seen_at', { ascending: false })
                        .limit(25);
                    memoriesRows = legacyRes.data || [];
                } else {
                    memoriesRows = memoriesRes.data || [];
                }

                const mergedPrivateProfile = {
                    profile_id: subjectProfileId,
                    display_name: String(subjectProfile?.display_name || '').trim() || null,
                    relationship: subjectProfile?.relationship ?? null,
                    username: (ownerProfileBasics as any)?.username ?? null,
                    full_name: (ownerProfileBasics as any)?.full_name ?? null,
                    age: (effectivePrivate as any)?.age ?? (ownerProfileBasics as any)?.age ?? null,
                    sex: (effectivePrivate as any)?.sex ?? (ownerProfileBasics as any)?.gender ?? null,
                    height: (effectivePrivate as any)?.height ?? (ownerProfileBasics as any)?.height ?? null,
                    weight: (effectivePrivate as any)?.weight ?? (ownerProfileBasics as any)?.weight ?? null,
                    allergies: (effectivePrivate as any)?.allergies ?? null,
                    chronic_conditions: (effectivePrivate as any)?.chronic_conditions ?? null,
                    current_medications: (effectivePrivate as any)?.current_medications ?? null,
                    notes: (effectivePrivate as any)?.notes ?? null,
                };

                analysisContext = {
                    privateProfile: mergedPrivateProfile,
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
        const preflight = await preflightMedicationEvidence({ ocrText: text, language: lang, enableFda: fdaEnabled });

        // 1. Call AI Service (DeepSeek) with verification evidence
        const data = await analyzeMedicationText(text, lang, analysisContext, preflight.evidenceForAi);

        // 1b. Post-analysis openFDA pass (best-effort): improves hit-rate using AI's English identifiers.
        // This does NOT replace the fact that preflight already ran before analysis.
        let fdaFinal: any = fdaEnabled ? (preflight.fda || null) : null;
        try {
            if (fdaEnabled && !fdaFinal?.found) {
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

        // Attach NDC dataset snapshot for strengths (best-effort).
        let activeIngredientsDetailed: any[] | undefined = undefined;
        if (fdaEnabled) {
            try {
                const packageNdc = preflight.ndc || extractPossibleNdc(text);
                const productNdcFromLabel = (fdaFinal as any)?.openfda?.product_ndc?.[0] ? String((fdaFinal as any).openfda.product_ndc[0]) : null;
                const ndcSnapshot = await fetchOpenFdaNdcSnapshot({
                    packageNdc: packageNdc || null,
                    productNdc: productNdcFromLabel || packageNdc || null,
                    brand: String((data as any)?.drugNameEn || "").trim() || null,
                    generic: String((data as any)?.genericNameEn || "").trim() || null,
                    manufacturer: String((data as any)?.manufacturer || "").trim() || null,
                    limit: 5,
                });

                if (fdaFinal) {
                    fdaFinal = { ...(fdaFinal as any), ndc: ndcSnapshot };
                } else if (ndcSnapshot?.found) {
                    fdaFinal = {
                        found: false,
                        query: { brand: null, generic: null, productNdc: packageNdc || null, manufacturer: null, attemptedSearch: null },
                        fetchedAt: new Date().toISOString(),
                        ndc: ndcSnapshot,
                    };
                }

                if (ndcSnapshot?.activeIngredients?.length) {
                    activeIngredientsDetailed = ndcSnapshot.activeIngredients.slice(0, 12).map((ai: any) => ({
                        name: String(ai?.name || "").trim(),
                        strength: String(ai?.strength || "").trim(),
                        strengthMg: typeof ai?.strengthMg === "number" ? ai.strengthMg : undefined,
                        source: "fda",
                    }));
                }
            } catch (e) {
                console.warn("openFDA NDC lookup failed:", e);
            }
        }

        const classificationFromFinalFda = classifyFromFdaProductTypes((fdaFinal as any)?.openfda?.product_type);
        const productClassification =
            classificationFromFinalFda && classificationFromFinalFda.confidence >= (preflight.classification?.confidence ?? 0)
                ? classificationFromFinalFda
                : preflight.classification;

        const analysisWithEnrichment = {
            ...(data as any),
            fda: fdaEnabled ? (fdaFinal || preflight.fda) : null,
            web: preflight.web,
            productClassification,
            activeIngredientsDetailed,
        };

        // Ultra-only: Cross-Interaction Guard (target drug vs current meds + memories)
        let interactionGuard: any = null;
        let interactionGuardUsed = false;
        if (isUltra) {
            const privateProfile = analysisContext?.privateProfile as any;
            const currentMeds = parseMedicationList(privateProfile?.current_medications);
            const memoryMeds = Array.isArray(analysisContext?.medicationMemories) ? analysisContext.medicationMemories : [];
            const candidates = [...currentMeds, ...memoryMeds].map((s) => String(s || "").trim()).filter(Boolean);

            const centralNorm = normalizeMedicationName((analysisWithEnrichment as any)?.drugName || "");
            const seen = new Set<string>();
            const otherMeds: string[] = [];
            for (const med of candidates) {
                const norm = normalizeMedicationName(med);
                if (!norm) continue;
                if (centralNorm && norm === centralNorm) continue;
                if (seen.has(norm)) continue;
                seen.add(norm);
                otherMeds.push(med);
                if (otherMeds.length >= 12) break;
            }

            if (otherMeds.length > 0) {
                try {
                    const result = await generateInteractionGuard({
                        language: lang,
                        targetMedication: analysisWithEnrichment as any,
                        subjectProfile: privateProfile || null,
                        otherMedications: otherMeds,
                    });

                    interactionGuard = {
                        subject: {
                            profileId: subjectProfileId,
                            displayName: subjectProfile?.display_name ?? null,
                            relationship: subjectProfile?.relationship ?? null,
                        },
                        target: {
                            name: (analysisWithEnrichment as any)?.drugName ?? null,
                            genericName: (analysisWithEnrichment as any)?.genericName ?? null,
                        },
                        ...result,
                    };
                    interactionGuardUsed = true;
                } catch (e) {
                    console.warn("Interaction guard generation failed:", e);
                    interactionGuard = null;
                }
            }
        }

        (analysisWithEnrichment as any).interactionGuard = interactionGuard;

        // 2. Save Analysis to Supabase (Protected)
        if (analysisWithEnrichment && (analysisWithEnrichment as any).drugName !== "Unknown") {
            try {
                const historyPayload: any = {
                    user_id: user.id,
                    profile_id: subjectProfileId,
                    drug_name: (analysisWithEnrichment as any).drugName || "Target Medication",
                    manufacturer: (analysisWithEnrichment as any).manufacturer || "Generic",
                    analysis_json: analysisWithEnrichment,
                };

                let historyRes = await supabase
                    .from("medication_history")
                    .insert(historyPayload)
                    .select("id")
                    .single();

                if (historyRes.error && String(historyRes.error.message || "").toLowerCase().includes("profile_id")) {
                    const legacyPayload = { ...historyPayload };
                    delete legacyPayload.profile_id;
                    historyRes = await supabase
                        .from("medication_history")
                        .insert(legacyPayload)
                        .select("id")
                        .single();
                }

                const historyRow = historyRes.data;
                const historyError = historyRes.error;

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
                        let existing: any = null;
                        const existingRes = await supabase
                            .from('memories_medications')
                            .select('id, count')
                            .eq('user_id', user.id)
                            .eq('profile_id', subjectProfileId)
                            .eq('normalized_name', normalizedName)
                            .maybeSingle();

                        if (existingRes.error) {
                            // Legacy fallback (before profile_id existed)
                            const legacyRes = await supabase
                                .from('memories_medications')
                                .select('id, count')
                                .eq('user_id', user.id)
                                .eq('normalized_name', normalizedName)
                                .maybeSingle();
                            existing = legacyRes.data || null;
                        } else {
                            existing = existingRes.data || null;
                        }

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
                            const insertPayload: any = {
                                user_id: user.id,
                                profile_id: subjectProfileId,
                                normalized_name: normalizedName,
                                display_name: displayName,
                                count: 1,
                                first_seen_at: nowIso,
                                last_seen_at: nowIso,
                                metadata: { source: 'scan', genericName: (analysisWithEnrichment as any).genericName },
                            };

                            let insertRes = await supabase
                                .from('memories_medications')
                                .insert(insertPayload)
                                .select('display_name, normalized_name, count, last_seen_at')
                                .single();

                            if (insertRes.error && String(insertRes.error.message || "").toLowerCase().includes("profile_id")) {
                                const legacyPayload = { ...insertPayload };
                                delete legacyPayload.profile_id;
                                insertRes = await supabase
                                    .from('memories_medications')
                                    .insert(legacyPayload)
                                    .select('display_name, normalized_name, count, last_seen_at')
                                    .single();
                            }

                            const inserted = insertRes.data || null;
                            const insertError = insertRes.error || null;

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

        const privateContextForMeta = analysisContext?.privateProfile;
        const hasAnyPrivateContext =
            Boolean(isUltra) &&
            Boolean(privateContextForMeta) &&
            [
                (privateContextForMeta as any)?.age,
                (privateContextForMeta as any)?.sex,
                (privateContextForMeta as any)?.height,
                (privateContextForMeta as any)?.weight,
                (privateContextForMeta as any)?.allergies,
                (privateContextForMeta as any)?.chronic_conditions,
                (privateContextForMeta as any)?.current_medications,
                (privateContextForMeta as any)?.notes,
            ].some((v) => String(v || "").trim().length > 0);

        const medicationMemoriesCount = Number(analysisContext?.medicationMemories?.length || 0);

        return NextResponse.json({
            ...(analysisWithEnrichment as any),
            meta: {
                plan: userPlan,
                fdaEnabled,
                subjectProfileId,
                subjectProfileName: subjectProfile?.display_name ?? null,
                subjectRelationship: subjectProfile?.relationship ?? null,
                savedToHistory,
                historyId,
                usedPrivateContext: hasAnyPrivateContext,
                usedMedicationMemories: Boolean(isUltra && medicationMemoriesCount > 0),
                medicationMemoriesCount,
                hasPrivateProfile: hasAnyPrivateContext,
                usedInteractionGuard: interactionGuardUsed,
                memory: memoryInfo,
                usedWebVerification: Boolean(preflight.web?.found),
                usedFdaVerification: Boolean(fdaEnabled && (((analysisWithEnrichment as any)?.fda?.found) || ((analysisWithEnrichment as any)?.fda?.ndc?.found))),
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
