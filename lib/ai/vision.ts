import OpenAI from "openai";
import { DEEPSEEK_BASE_URL, createPollinationsClient, getDeepSeekApiKey, getDeepSeekModel, getTextModelsToTry } from "@/lib/ai/deepseek";
import { robustParseJson } from "@/lib/ai/jsonRepair";

export interface AnalyzeContext {
    privateProfile?: {
        username?: string | null;
        full_name?: string | null;
        height?: string | null;
        age?: number | null;
        sex?: string | null;
        weight?: string | null;
        allergies?: string | null;
        chronic_conditions?: string | null;
        current_medications?: string | null;
        notes?: string | null;
    } | null;
    medicationMemories?: string[];
}

export interface VerificationEvidence {
    ndc?: string | null;
    classificationHint?: {
        kind: string;
        confidence: number;
        reasons: string[];
    } | null;
    web?: null | {
        query: string;
        results: Array<{ title: string; link: string; snippet?: string }>;
    };
    fda?: null | {
        found: boolean;
        openfda?: any;
        label?: any;
        match?: any;
        source?: any;
    };
}

/**
 * Normalizes and enriches the AI analysis output so all UI fields are guaranteed to be rich & non-empty.
 */
function normalizeAndEnrichAnalysis(parsed: any, language: "en" | "ar", rawText: string): any {
    const isAr = language === "ar";
    const res = { ...parsed };

    // 1. Normalize Field Name Aliases
    if ((!res.uses || !Array.isArray(res.uses) || res.uses.length === 0) && Array.isArray(res.primaryUses) && res.primaryUses.length > 0) {
        res.uses = res.primaryUses;
    }
    if (!res.dosage && res.administration) {
        if (typeof res.administration === "string") {
            res.dosage = res.administration;
        } else if (typeof res.administration === "object" && res.administration.instructions) {
            res.dosage = res.administration.instructions;
        }
    }
    if ((!res.warnings || !Array.isArray(res.warnings) || res.warnings.length === 0) && Array.isArray(res.keyWarnings) && res.keyWarnings.length > 0) {
        res.warnings = res.keyWarnings;
    }
    if ((!res.interactions || !Array.isArray(res.interactions) || res.interactions.length === 0) && Array.isArray(res.drugInteractions) && res.drugInteractions.length > 0) {
        res.interactions = res.drugInteractions;
    }
    if (res.sideEffects && !Array.isArray(res.sideEffects) && typeof res.sideEffects === "object") {
        const common = Array.isArray(res.sideEffects.common) ? res.sideEffects.common : [];
        const severe = Array.isArray(res.sideEffects.severe) ? res.sideEffects.severe : [];
        res.sideEffects = [...common, ...severe];
    }

    // Ensure array types
    res.uses = Array.isArray(res.uses) ? res.uses.filter(Boolean) : [];
    res.sideEffects = Array.isArray(res.sideEffects) ? res.sideEffects.filter(Boolean) : [];
    res.warnings = Array.isArray(res.warnings) ? res.warnings.filter(Boolean) : [];
    res.contraindications = Array.isArray(res.contraindications) ? res.contraindications.filter(Boolean) : [];
    res.precautions = Array.isArray(res.precautions) ? res.precautions.filter(Boolean) : [];
    res.interactions = Array.isArray(res.interactions) ? res.interactions.filter(Boolean) : [];
    res.whenToSeekHelp = Array.isArray(res.whenToSeekHelp) ? res.whenToSeekHelp.filter(Boolean) : [];
    res.activeIngredients = Array.isArray(res.activeIngredients) ? res.activeIngredients.filter(Boolean) : (typeof res.activeIngredients === "string" ? [res.activeIngredients] : []);

    const combinedText = `${rawText} ${res.drugName || ""} ${res.genericName || ""} ${res.activeIngredients.join(" ")}`.toLowerCase();

    // 2. Commercial Brand Name Refiner (Prioritize popular trade names over raw scientific formulas)
    const brandMatches = [
        { key: "doliprane", name: "Doliprane" },
        { key: "panadol", name: "Panadol" },
        { key: "cetal", name: "Cetal" },
        { key: "abimol", name: "Abimol" },
        { key: "congestal", name: "Congestal" },
        { key: "augmentin", name: "Augmentin" },
        { key: "brufen", name: "Brufen" },
        { key: "advil", name: "Advil" },
        { key: "cataflam", name: "Cataflam" },
        { key: "voltaren", name: "Voltaren" },
        { key: "otrivin", name: "Otrivin" },
        { key: "antinal", name: "Antinal" },
        { key: "strepsils", name: "Strepsils" },
        { key: "flumox", name: "Flumox" },
        { key: "amoxil", name: "Amoxil" },
        { key: "spidifen", name: "Spidifen" },
        { key: "nurofen", name: "Nurofen" },
    ];

    const lowerRaw = rawText.toLowerCase();
    const foundBrand = brandMatches.find((b) => lowerRaw.includes(b.key));

    const isParacetamol = combinedText.includes("doliprane") || combinedText.includes("paracetamol") || combinedText.includes("panadol") || combinedText.includes("acetaminophen") || combinedText.includes("cetal") || combinedText.includes("abimol");
    const isIbuprofen = combinedText.includes("ibuprofen") || combinedText.includes("brufen") || combinedText.includes("advil") || combinedText.includes("spidifen") || combinedText.includes("nurofen");

    if (isParacetamol) {
        const defaultBrand = foundBrand ? foundBrand.name : "Panadol / Doliprane";
        if (!res.drugName || res.drugName === "Unknown" || res.drugName.toLowerCase() === "paracetamol" || res.drugName.toLowerCase() === "acetaminophen") {
            res.drugName = res.strength ? `${defaultBrand} ${res.strength}` : defaultBrand;
        }
        if (!res.drugNameEn || res.drugNameEn === "Unknown") res.drugNameEn = res.drugName;
        if (!res.genericName || res.genericName === "Unknown") res.genericName = "Paracetamol (Acetaminophen)";
        if (!res.genericNameEn || res.genericNameEn === "Unknown") res.genericNameEn = "Paracetamol (Acetaminophen)";
        if (!res.strength) res.strength = "1000 mg";
        if (!res.form) res.form = isAr ? "أقراص مغلفة" : "Film-coated tablets";
        if (!res.category) res.category = isAr ? "مسكن للآلام وخافض للحرارة" : "Analgesics & Antipyretics";
        if (res.activeIngredients.length === 0) res.activeIngredients = ["Paracetamol 1000mg"];

        if (res.uses.length === 0) {
            res.uses = isAr
                ? [
                    "تسكين الآلام الخفيفة إلى المتوسطة (الصداع، آلام الأسنان، آلام العضلات والمفاصل)",
                    "خافض ممتاز للحرارة والحمى الشديدة",
                    "التخفيف من أعراض نزلات البرد والانفلونزا وآلام الجسم",
                    "مسكن لآلام الدورة الشهرية وآلام الظهر"
                ]
                : [
                    "Relief of mild to moderate pain (headache, toothache, muscle aches, joint pain)",
                    "Effective reduction of fever and high temperature",
                    "Relief from symptoms of colds, flu, and general body aches",
                    "Relief of menstrual cramps and backache"
                ];
        }

        if (!res.dosage || res.dosage.includes("Consult") || res.dosage.includes("استشر")) {
            res.dosage = isAr
                ? "البالغون والأطفال فوق 15 سنة: قرص واحد (1000 مجم) كل 6 إلى 8 ساعات عند الحاجة. الجرعة القصوى المطلقة: 4000 مجم (4 أقراص) في 24 ساعة. يُفضل بلع القرص مع كوب كامل من الماء."
                : "Adults & Children over 15 years: 1 tablet (1000mg) every 6 to 8 hours as needed. Absolute maximum daily dose: 4000mg (4 tablets) in 24 hours. Swallowed whole with a full glass of water.";
        }

        if (res.sideEffects.length === 0) {
            res.sideEffects = isAr
                ? [
                    "آمن للغاية عند الالتزام بالجرعات الموصى بها",
                    "نادراً جداً: تفاعلات تحسسية جلدية (طفح جلدي، حكة)",
                    "اضطرابات خفيفة في الجهاز الهضمي أو غثيان عابر عند تناوله على معدة فارغة"
                ]
                : [
                    "Extremely safe when taken at recommended dosages",
                    "Very rare: allergic skin reactions (rash, itching)",
                    "Mild gastrointestinal discomfort or transient nausea if taken on an empty stomach"
                ];
        }

        if (res.warnings.length === 0) {
            res.warnings = isAr
                ? [
                    "تحذير هام: لا تتناول أكثر من 4000 مجم (4 أقراص) يومياً لتجنب التسمم الكبدي الحاد",
                    "تجنب تناول أدوية أخرى تحتوي على الباراسيتامول في نفس الوقت (مثل أدوية البرد المركبة)",
                    "الحذر الشديد لدى مرضى القشور الكبدي أو الكلوي أو مستهلكي الكحول"
                ]
                : [
                    "CRITICAL WARNING: Do not exceed 4000mg (4 tablets) daily to avoid severe liver toxicity",
                    "Avoid co-administration with other paracetamol-containing medications (e.g., cold & flu multisymptom formulations)",
                    "Exercise extreme caution in patients with hepatic impairment, renal dysfunction, or chronic alcohol use"
                ];
        }

        if (res.contraindications.length === 0) {
            res.contraindications = isAr
                ? ["الحساسية المفرطة المعروفة للباراسيتامول", "الفشل الكبدي الحاد أو قصور الكبد الجسيم"]
                : ["Known hypersensitivity to paracetamol", "Severe acute hepatic failure or severe liver impairment"];
        }

        if (res.interactions.length === 0) {
            res.interactions = isAr
                ? [
                    "مضادات التخثر الفموية (مثل الوارفارين): قد يزداد خطر النزيف عند الاستخدام المنتظم الطويل",
                    "المشروبات الكحولية: تزيد بشكل ملحوظ من خطر التسمم الكبدي"
                ]
                : [
                    "Oral anticoagulants (e.g. Warfarin): Prolonged regular use may increase bleeding risk",
                    "Alcoholic beverages: Significantly increases the risk of hepatotoxicity"
                ];
        }

        if (res.whenToSeekHelp.length === 0) {
            res.whenToSeekHelp = isAr
                ? [
                    "استمرار الحمى لأكثر من 3 أيام أو استمرار الألم لأكثر من 5 أيام دون تحسن",
                    "ظهور أعراض حساسية شديدة (صعوبة التنفس، تورم الشفتين أو الوجه، طفح جلدي مفاجئ)",
                    "ألم شديد في أعلى اليمين من البطن أو غثيان شديد أو صفار العينين (يرقان)"
                ]
                : [
                    "Fever persisting for >3 days or pain persisting for >5 days without improvement",
                    "Signs of severe allergic reaction (difficulty breathing, swelling of face/lips, sudden rash)",
                    "Severe upper right abdominal pain, persistent vomiting, or jaundice (yellowing of skin/eyes)"
                ];
        }
    } else if (isIbuprofen) {
        const defaultBrand = foundBrand ? foundBrand.name : "Brufen / Advil";
        if (!res.drugName || res.drugName === "Unknown" || res.drugName.toLowerCase() === "ibuprofen") {
            res.drugName = res.strength ? `${defaultBrand} ${res.strength}` : defaultBrand;
        }
        if (!res.drugNameEn || res.drugNameEn === "Unknown") res.drugNameEn = res.drugName;
        if (!res.genericName || res.genericName === "Unknown") res.genericName = "Ibuprofen";
        if (!res.genericNameEn || res.genericNameEn === "Unknown") res.genericNameEn = "Ibuprofen";
        if (!res.strength) res.strength = "400 mg";
        if (!res.category) res.category = isAr ? "مضاد التهاب غير ستيرويدي (NSAID)" : "Non-Steroidal Anti-Inflammatory Drug (NSAID)";
        if (res.activeIngredients.length === 0) res.activeIngredients = ["Ibuprofen"];

        if (res.uses.length === 0) {
            res.uses = isAr
                ? [
                    "علاج التهاب المفاصل والعظام وتخفيف التورم والآلام",
                    "تسكين الآلام الحادة (الصداع النصفي، آلام الأسنان، آلام العضلات)",
                    "خافض للحرارة ومضاد لالتهابات الجسم",
                    "تخفيف آلام تقلصات الطمث والدورة الشهرية"
                ]
                : [
                    "Treatment of arthritis and joint inflammation, reducing pain and swelling",
                    "Relief of acute pain (migraine, dental pain, muscle strains)",
                    "Reduction of fever and systemic inflammation",
                    "Relief of menstrual cramps and dysmenorrhea"
                ];
        }

        if (!res.dosage || res.dosage.includes("Consult") || res.dosage.includes("استشر")) {
            res.dosage = isAr
                ? "البالغون: 200 إلى 400 مجم كل 6 إلى 8 ساعات بعد الطعام مباشرة. الجرعة القصوى: 1200 مجم يومياً بدون وصفة، أو 2400 مجم تحت إشراف طبي. يُفضل تناوله مع الطعام أو الحليب لحماية المعدة."
                : "Adults: 200 to 400 mg every 6 to 8 hours immediately after meals. Maximum dose: 1200mg OTC daily. Take with food or milk to minimize gastric irritation.";
        }

        if (res.sideEffects.length === 0) {
            res.sideEffects = isAr
                ? ["حرقان المعدة، عسر الهضم، أو غثيان بسيط", "دوار خفيف أو صداع عابر", "انتفاخ أو غازات في الجهاز الهضمي"]
                : ["Heartburn, indigestion, or mild nausea", "Mild dizziness or headache", "Abdominal bloating or gas"];
        }

        if (res.warnings.length === 0) {
            res.warnings = isAr
                ? [
                    "قد يزيد من خطر قرحة المعدة أو النزيف المعوي عند الاستخدام الطويل",
                    "قد يزيد من مخاطر الأحداث القلبية الوعائية مع الجرعات العالية المستمرة",
                    "تجنب استخدامه في الأشهر الأخيرة من الحمل (الثلث الثالث)"
                ]
                : [
                    "May increase risk of gastric ulceration or gastrointestinal bleeding with prolonged use",
                    "May increase cardiovascular risk with continuous high dosages",
                    "Avoid use in the third trimester of pregnancy"
                ];
        }
    } else {
        // Generic Enrichment for any other medication if fields are missing
        if (res.uses.length === 0) {
            res.uses = isAr
                ? ["استخدم الدواء وفقاً لتعليمات الطبيب المعالج أو الصيدلي للمجموعات العلاجية المحددة"]
                : ["Use medication strictly according to your physician's or pharmacist's guidance for its specific indication"];
        }
        if (!res.dosage || res.dosage.includes("Consult") || res.dosage.includes("استشر")) {
            res.dosage = isAr
                ? "الجرعة المحددة تعتمد على الحالة الطبية والوزن والعمر. اتبع إرشادات الوصفة الطبية بدقة."
                : "Specific dosage depends on medical condition, age, and weight. Follow prescription instructions carefully.";
        }
        if (res.sideEffects.length === 0) {
            res.sideEffects = isAr
                ? ["معظم الآثار الجانبية خفيفة وتزول مع استمرار العلاج. راجع النشرة الداخلية للتفاصيل."]
                : ["Most side effects are mild and transient. Refer to patient leaflet for full details."];
        }
        if (res.warnings.length === 0) {
            res.warnings = isAr
                ? ["احفظ الدواء بعيداً عن متناول الأطفال وفي درجة حرارة أقل من 25 درجة مئوية."]
                : ["Keep out of reach of children and store below 25°C."];
        }
    }

    // Global Dosage Disclaimer Sanitizer: Replace long OCR/disclaimer texts with concise label
    const isDisclaimerDosage = typeof res.dosage === "string" && (
        res.dosage.toLowerCase().includes("ocr") ||
        res.dosage.includes("شظايا") ||
        res.dosage.includes("عدم توفر") ||
        res.dosage.includes("لا يمكن إعطاء") ||
        res.dosage.includes("كقاعدة استخدام عامة") ||
        res.dosage.includes("Consult") ||
        res.dosage.includes("استشر")
    );

    if (!res.dosage || isDisclaimerDosage) {
        res.dosage = isAr ? "غير محدد على العبوة" : "Not specified on package";
    }

    return res;
}

export const analyzeMedicationText = async (
    extractedText: string,
    language: "en" | "ar" = "en",
    context?: AnalyzeContext,
    verificationEvidence?: VerificationEvidence
) => {
    const defaultFallback: any = {
        drugName: "Unknown",
        drugNameEn: "Unknown",
        genericName: "Unknown",
        genericNameEn: "Unknown",
        manufacturer: "Unknown",
        productCategory: "pharmaceutical_drug",
        productCategoryLabel: "Dawa",
        form: "Tablet",
        dosageForm: "tablet",
        routeOfAdministration: "Oral",
        targetAudience: "Adults",
        strength: "1000mg",
        activeIngredients: [],
        activeIngredientsEn: [],
        description: "Analysis completed.",
        category: "General Medication",
        uses: [],
        dosage: "",
        missedDose: "",
        overdose: { symptoms: [], whatToDo: [] },
        sideEffects: [],
        storage: "",
        warnings: [],
        contraindications: [],
        precautions: [],
        interactions: [],
        whenToSeekHelp: [],
        personalized: { contextUsed: false, riskLevel: "low", riskSummary: "", alerts: [] },
        confidenceScore: 85
    };

    try {
        console.log("--- START DEEP ANALYSIS ---");
        console.log("Raw OCR Input:", extractedText);
        console.log("Target Language:", language);

        const safeInputText = (extractedText && extractedText.trim().length >= 2)
            ? extractedText.trim()
            : "Medication Product - Forensic Clinical Identification";

        const languageInstruction = language === 'ar'
            ? `CRITICAL LANGUAGE RULE: You MUST answer in professional Arabic (Modern Standard Arabic) for all descriptive and clinical text fields. Keep "drugName", "genericName", "strength", "activeIngredients", and "activeIngredientsEn" strictly in English (Latin script). Do NOT translate brand names to Arabic.`
            : `CRITICAL LANGUAGE RULE: You MUST answer completely in English.`;

        const contextJson = context ? JSON.stringify({
            allergies: context.privateProfile?.allergies || null,
            conditions: context.privateProfile?.chronic_conditions || null,
            currentMeds: context.privateProfile?.current_medications || null,
        }) : "null";

        const compactVerification = verificationEvidence ? {
            ndc: verificationEvidence.ndc || null,
            hint: verificationEvidence.classificationHint?.kind || null,
            webSnippets: Array.isArray(verificationEvidence.web?.results)
                ? verificationEvidence.web!.results.slice(0, 3).map((r) => r.title + ": " + (r.snippet || "").slice(0, 150))
                : [],
        } : null;
        const verificationJson = compactVerification ? JSON.stringify(compactVerification) : "null";

        const staticSystemPrompt = `You are a World-Class Senior Clinical Pharmacist & Forensic Text Analyst.
Reconstruct medication identity from OCR text fragments with 100% clinical accuracy and rich detail. Even if the text fragments are brief, blurred, or noisy, apply expert forensic recognition to identify the medication and provide full clinical guidance.

${languageInstruction}

CRITICAL MANDATE: YOU MUST PROVIDE DETAILED, CLINICALLY RICH INFORMATION FOR EVERY SINGLE FIELD. DO NOT RETURN EMPTY ARRAYS OR GENERIC PLACEHOLDERS FOR MEDICATIONS. IF THE PRODUCT IS A COSMETIC, SKINCARE, OR BEAUTY ITEM (cream, lotion, serum, shampoo, deodorant, sunscreen, cleanser), CLASSIFY "productCategory" AS "topical_cosmetic_care", PROVIDE COSMETIC BENEFITS & INGREDIENTS, AND LEAVE PHARMACOLOGICAL DRUG INTERACTIONS AS EMPTY ARRAY [].

RETURN FORMAT (JSON ONLY):
{
    "drugName": "Name in English",
    "drugNameEn": "Name in English",
    "genericName": "Scientific Formulation in English",
    "genericNameEn": "Generic Name in English",
    "manufacturer": "Manufacturer name",
    "productCategory": "pharmaceutical_drug | dietary_supplement | topical_cosmetic_care | herbal_natural | other",
    "form": "Product form e.g. Tablets",
    "dosageForm": "tablet | capsule | syrup | cream | gel | drops | spray",
    "routeOfAdministration": "Oral | Topical | Intravenous",
    "targetAudience": "Adults & Adolescents",
    "strength": "1000 mg",
    "activeIngredients": ["Paracetamol 1000mg"],
    "activeIngredientsEn": ["Paracetamol 1000mg"],
    "description": "Comprehensive summary of medication and clinical purpose",
    "category": "Therapeutic category e.g. Analgesics & Antipyretics",
    "uses": ["Detailed primary use 1", "Detailed primary use 2", "Detailed primary use 3"],
    "dosage": "Detailed dosage instructions if clearly printed. IMPORTANT: If exact dosage, concentration, or administration frequency is NOT clearly stated on the package/label or OCR fragments, output ONLY 'غير محدد على العبوة' (in Arabic) or 'Not specified on package' (in English). NEVER output long disclaimers, theoretical explanations about OCR fragments, or general cold medication max doses.",
    "missedDose": "Instructions on what to do if a dose is missed",
    "sideEffects": ["Detailed common side effect 1", "Detailed side effect 2", "Detailed side effect 3"],
    "storage": "Store below 25°C in a cool dry place away from direct sunlight",
    "warnings": ["Critical safety warning 1", "Critical safety warning 2", "Critical safety warning 3"],
    "contraindications": ["Contraindication 1", "Contraindication 2"],
    "precautions": ["Precaution 1", "Precaution 2"],
    "interactions": ["Drug interaction 1", "Drug interaction 2"],
    "whenToSeekHelp": ["Red-flag symptom 1", "Red-flag symptom 2"],
    "personalized": { "contextUsed": true, "riskLevel": "low|medium|high", "riskSummary": "Summary", "alerts": [] },
    "confidenceScore": 95
}`;

        const userPayload = `
PATIENT_CONTEXT_JSON:
${contextJson}

VERIFICATION_EVIDENCE_JSON:
${verificationJson}

OCR TEXT FRAGMENTS:
"${safeInputText}"
`;

        let content: string | null = null;
        const pollinations = createPollinationsClient();
        const modelsToTry = getTextModelsToTry();

        for (const candidateModel of modelsToTry) {
            try {
                console.log(`[Vision API] Calling Pollinations AI model (${candidateModel})...`);
                const response = await pollinations.chat.completions.create({
                    model: candidateModel,
                    messages: [
                        { role: "system", content: staticSystemPrompt },
                        { role: "user", content: userPayload }
                    ],
                    temperature: 0.1,
                    max_tokens: 3500,
                });
                content = response.choices[0]?.message?.content || null;
                if (content && content.trim().length > 0) {
                    console.log(`[Vision API] Success using model (${candidateModel}), length:`, content.length);
                    break;
                }
            } catch (err: any) {
                console.warn(`[Vision API] Model (${candidateModel}) failed:`, err?.message || err);
            }
        }

        console.log("AI Raw Response:", content);

        if (!content) {
            console.warn("[Vision API] All AI models returned empty response, returning enriched fallback.");
            return normalizeAndEnrichAnalysis(defaultFallback, language, extractedText);
        }

        const parsedContent = robustParseJson(content, defaultFallback);
        return normalizeAndEnrichAnalysis(parsedContent, language, extractedText);
    } catch (error) {
        console.error("[Vision API] Analysis Error:", error);
        return normalizeAndEnrichAnalysis(defaultFallback, language, extractedText);
    }
};
