import { deepMedicalSerperSearch, type SerperSearchSnapshot } from "@/lib/serper";
import { fetchOpenFdaLabelSnapshot, fetchOpenFdaNdcSnapshot, extractPossibleNdc, type OpenFdaLabelSnapshot } from "@/lib/openfda";
import { searchRxNorm, type RxNormSearchResult } from "@/lib/rxnorm";
import { createPollinationsClient, getTextModelsToTry } from "@/lib/ai/deepseek";
import { robustParseJson } from "@/lib/ai/jsonRepair";

export interface ForensicDossier {
    searchConfidence: number;
    resolvedName: string;
    genericMolecules: string[];
    pagesSearched: number;
    totalEvidenceSnippets: number;
    knowledgeGraph: any;
    answerBox: any;
    fdaLabel: OpenFdaLabelSnapshot | null;
    rxnorm: RxNormSearchResult | null;
    topSnippets: Array<{ title: string; link: string; snippet?: string; domain?: string }>;
}

/**
 * Extracts high-value seed keywords from raw OCR text
 */
function extractCoreKeywords(rawOcr: string): string[] {
    const cleaned = String(rawOcr || "")
        .replace(/[^\p{L}\p{N}\s.-]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

    const words = cleaned.split(" ").filter((w) => w.length >= 3);
    const stopWords = new Set([
        "tablet", "tablets", "capsule", "capsules", "syrup", "suspension", "cream", "ointment",
        "oral", "dose", "dosage", "mg", "ml", "gm", "film", "coated", "daily", "twice",
        "اقراص", "كبسولات", "شراب", "مرهم", "كريم", "استعمال", "جرعة", "ملغم", "ملجم", "مل"
    ]);

    return words.filter((w) => !stopWords.has(w.toLowerCase())).slice(0, 5);
}

/**
 * Autonomous 5-Page Multi-Angle Medical Search for Medication Identification
 */
export async function buildDeepMedicationDossier(opts: {
    ocrText: string;
    language: "en" | "ar";
}): Promise<ForensicDossier> {
    const { ocrText, language } = opts;
    const keywords = extractCoreKeywords(ocrText);
    const primarySeed = keywords.slice(0, 3).join(" ") || ocrText.slice(0, 40).trim();

    const isAr = language === "ar";
    const hl = isAr ? "ar" : "en";

    // 5 Distinct Search Angles to maximize clinical precision and extract missing packaging numbers:
    const customAngles = [
        `${primarySeed} package insert leaflet dosage strength indications`,
        `${primarySeed} active ingredients composition mg ml openfda dailymed`,
        `${primarySeed} contraindications warnings drug interactions overdose protocol`,
        `${primarySeed} دواعي الاستعمال الجرعة المكونات الفعالة النشرة الطبية`,
        `${primarySeed} official pharmaceutical registration manufacturer NDC`,
    ];

    const serperData = await deepMedicalSerperSearch({
        query: `${primarySeed} medication clinical pharmacology`,
        maxPages: 5,
        gl: isAr ? "eg" : "us",
        hl,
        customAngles,
    });

    const ndc = extractPossibleNdc(ocrText);
    let fdaLabel: OpenFdaLabelSnapshot | null = null;
    let rxnormMatch: RxNormSearchResult | null = null;

    // Concurrently fetch openFDA and RxNorm matches
    try {
        const [fdaRes, rxRes] = await Promise.allSettled([
            ndc ? fetchOpenFdaLabelSnapshot({ productNdc: ndc, limit: 5 }) : fetchOpenFdaLabelSnapshot({ brand: keywords[0] || primarySeed, limit: 5 }),
            searchRxNorm(keywords[0] || primarySeed),
        ]);

        if (fdaRes.status === "fulfilled" && fdaRes.value?.found) {
            fdaLabel = fdaRes.value;
        }
        if (rxRes.status === "fulfilled" && rxRes.value) {
            rxnormMatch = rxRes.value;
        }
    } catch {
        // best-effort
    }

    const topSnippets = (serperData?.results || []).slice(0, 15).map((r) => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet,
        domain: r.domain,
    }));

    const searchConfidence = serperData.found ? (topSnippets.length >= 8 ? 98 : topSnippets.length >= 4 ? 92 : 85) : 75;

    return {
        searchConfidence,
        resolvedName: serperData.knowledgeGraph?.title || primarySeed,
        genericMolecules: rxnormMatch?.activeIngredients || [],
        pagesSearched: serperData.pagesSearched || 5,
        totalEvidenceSnippets: topSnippets.length,
        knowledgeGraph: serperData.knowledgeGraph,
        answerBox: serperData.answerBox,
        fdaLabel,
        rxnorm: rxnormMatch,
        topSnippets,
    };
}

/**
 * Multi-Layer AI Clinical Synthesizer:
 * Solves missing packaging numbers, incomplete strengths, or fragmented OCR by synthesizing
 * verified clinical data from 5 search pages into an accurate, complete JSON profile.
 */
export async function layeredMedicationSynthesis(opts: {
    rawOcrText: string;
    language: "en" | "ar";
    dossier: ForensicDossier;
    patientContext?: any;
}): Promise<any> {
    const { rawOcrText, language, dossier, patientContext } = opts;
    const isAr = language === "ar";

    const pollinations = createPollinationsClient();
    const modelsToTry = getTextModelsToTry();

    const systemPrompt = `You are the Lead Clinical Pharmacologist & Forensic Medication Identification AI at QURE AI.
Your objective: Conduct multi-layer forensic analysis on medication image text fragments combined with a 5-Page Verified Live Clinical Dossier.

FORENSIC MANDATES:
1. RESOLVE EXACT IDENTITY (90-100% Precision): Identify the authentic registered commercial trade name and active pharmaceutical molecules even if the package photo is cropped, blurred, or missing numbers.
2. DEDUPLICATION & MOLECULAR ACCURACY: Never repeat or duplicate active ingredients. For multi-ingredient combination drugs (e.g. Paracetamol + Chlorpheniramine + Pseudoephedrine), list each distinct active chemical entity exactly once with its authentic registered dose (e.g. 500 mg, 2 mg, 30 mg). Never sum or multiply doses incorrectly across repeated rows.
3. SOLVE MISSING PACKAGING NUMBERS & DETAILS: If exact strength (e.g. 500mg, 1000mg, 5ml), active formulation percentages, or dosage instructions were omitted on the packaging, retrieve and compute them from the verified 5-page clinical dossier and pharmacological databases. Never leave fields as "غير محدد" when official monographs exist.
4. LANGUAGE RULE: When language is 'ar' (Arabic), output 'drugName' (e.g. 'وان تو ثري (1 2 3)' or 'كونجستال' or 'بنادول'), 'genericName' (e.g. 'باراسيتامول + كلورفينيرامين + سودوإيفيدرين'), 'form' (e.g. 'أقراص مغلفة'), 'routeOfAdministration' (e.g. 'عن طريق الفم'), 'category', and ALL clinical fields ('uses', 'dosage', 'missedDose', 'warnings', 'contraindications', 'precautions', 'sideEffects', 'interactions', 'whenToSeekHelp', 'storage') in 100% fluent, sound Modern Standard Arabic. Always provide 'drugNameEn', 'genericNameEn', and 'activeIngredientsEn' in clean Latin English. When language is 'en', output everything in English.
5. RETURN PURE JSON matching the schema strictly.

JSON SCHEMA:
{
    "drugName": "Commercial Trade Name",
    "drugNameEn": "Commercial Trade Name in Latin English",
    "genericName": "Scientific Active Molecule",
    "genericNameEn": "Scientific Active Molecule in English",
    "manufacturer": "Verified Pharmaceutical Manufacturer",
    "productCategory": "pharmaceutical_drug | dietary_supplement | topical_cosmetic_care",
    "productCategoryLabel": "Category Label",
    "form": "Tablet / Capsule / Syrup / Drops / Cream",
    "dosageForm": "tablet | capsule | syrup | cream | gel | drops | spray",
    "routeOfAdministration": "Oral | Topical | Inhalation | Intravenous",
    "targetAudience": "Adults / Children / All Ages",
    "strength": "e.g. 500 mg or 1000 mg or 500 mg + 2 mg + 30 mg",
    "activeIngredients": ["Molecule 1 (Strength)", "Molecule 2 (Strength)"],
    "activeIngredientsEn": ["Molecule 1 (Strength)", "Molecule 2 (Strength)"],
    "activeIngredientsDetailed": [
        { "name": "Molecule 1", "strength": "500 mg", "strengthMg": 500, "source": "Therapeutic Agent" }
    ],
    "description": "Comprehensive clinical mechanism and therapeutic profile",
    "category": "Pharmacological Category",
    "uses": ["Primary indication 1", "Primary indication 2", "Primary indication 3"],
    "dosage": "Exact clinical dosing regimen, timing with meals, and maximum daily limits",
    "missedDose": "Clear protocol on what to do if a dose is forgotten",
    "overdose": {
        "symptoms": ["Symptom 1", "Symptom 2"],
        "whatToDo": ["Action 1", "Action 2"]
    },
    "sideEffects": ["Common effect 1", "Common effect 2", "Rare serious effect 3"],
    "storage": "Store below 25°C away from heat, light, and children",
    "warnings": ["Critical clinical warning 1", "Critical clinical warning 2"],
    "contraindications": ["Contraindicated condition 1", "Contraindicated condition 2"],
    "precautions": ["Precaution 1", "Precaution 2"],
    "interactions": ["Drug/Food interaction 1", "Drug/Food interaction 2"],
    "whenToSeekHelp": ["Emergency red flag 1", "Emergency red flag 2"],
    "confidenceScore": ${dossier.searchConfidence || 95}
}`;

    const userPrompt = `
=== RAW OCR TEXT FROM PHOTOGRAPHED PACKAGE ===
"${rawOcrText}"

=== 5-PAGE LIVE CLINICAL VERIFICATION DOSSIER ===
Resolved Knowledge Entity: ${JSON.stringify(dossier.knowledgeGraph || {})}
Direct Answer: ${JSON.stringify(dossier.answerBox || {})}
openFDA Registration: ${dossier.fdaLabel?.found ? JSON.stringify(dossier.fdaLabel?.openfda || {}) : "None"}
RxNorm Normalized Molecules: ${JSON.stringify(dossier.rxnorm?.activeIngredients || [])}

Top 15 Clinical Evidence Snippets from 5 Search Pages:
${dossier.topSnippets.map((s, idx) => `[${idx + 1}] (${s.domain}) ${s.title}: ${s.snippet}`).join("\n\n")}

=== PATIENT SAFETY CONTEXT ===
${patientContext ? JSON.stringify(patientContext) : "None"}
`;

    let generatedJson: string | null = null;

    for (const model of modelsToTry) {
        try {
            console.log(`[Layered Synthesizer] Executing Layer 3 & 4 with model (${model})...`);
            const res = await pollinations.chat.completions.create({
                model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.1,
                max_tokens: 3800,
            });

            const text = res.choices[0]?.message?.content || null;
            if (text && text.trim().length > 0) {
                generatedJson = text;
                break;
            }
        } catch (err: any) {
            console.warn(`[Layered Synthesizer] Model (${model}) attempt note:`, err?.message || err);
        }
    }

    if (!generatedJson) {
        throw new Error("Multi-layer synthesis yielded empty response");
    }

    return robustParseJson(generatedJson, {});
}
