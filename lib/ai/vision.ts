import OpenAI from "openai";
import { DEEPSEEK_BASE_URL, DEEPSEEK_MODEL, getDeepSeekApiKey } from "@/lib/ai/deepseek";

// Initialize DeepSeek client (text-only)
const deepseek = new OpenAI({
    apiKey: getDeepSeekApiKey(),
    baseURL: DEEPSEEK_BASE_URL,
});

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

function extractJsonCandidate(raw: string): string {
    const text = String(raw || "").trim();
    if (!text) return text;

    // Remove common markdown wrappers
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const unwrapped = (fenced?.[1] ?? text).trim();

    // If it's already a JSON object/array string, return as-is.
    if ((unwrapped.startsWith("{") && unwrapped.endsWith("}")) || (unwrapped.startsWith("[") && unwrapped.endsWith("]"))) {
        return unwrapped;
    }

    // Otherwise, try to take the first {...} block.
    const firstBrace = unwrapped.indexOf("{");
    const lastBrace = unwrapped.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return unwrapped.slice(firstBrace, lastBrace + 1);
    }

    return unwrapped;
}

function fixInvalidJsonEscapes(jsonText: string): string {
    // JSON only allows these escapes: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
    // Models sometimes emit "\أ" or similar, which breaks JSON.parse.
    return jsonText.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, "\\\\");
}

export const analyzeMedicationText = async (
    extractedText: string,
    language: "en" | "ar" = "en",
    context?: AnalyzeContext,
    verificationEvidence?: VerificationEvidence
) => {
    try {
        console.log("--- START DEEP ANALYSIS ---");
        console.log("Raw OCR Input:", extractedText);
        console.log("Target Language:", language);

        if (!extractedText || extractedText.trim().length < 2) {
            throw new Error("Text too short for forensic analysis.");
        }

        // Language specific instructions
        const languageInstruction = language === 'ar'
            ? `CRITICAL LANGUAGE RULE: You MUST answer in professional Arabic (Modern Standard Arabic) for all textual fields EXCEPT for "drugName", "genericName", "dosage", "strength", "activeIngredients", and "activeIngredientsEn" which MUST ALWAYS be in English (Latin characters/script). Do NOT translate drug names, generic/scientific names, active ingredient lists, or dosage/strength texts to Arabic. Keep them strictly in English.`
            : `CRITICAL LANGUAGE RULE: You MUST answer completely in English.`;

        const contextJson = context ? JSON.stringify(context) : "null";
        const verificationJson = verificationEvidence ? JSON.stringify(verificationEvidence) : "null";

        // Forensic Pharmacist Prompt V2 (Expanded)
        const systemPrompt = `
    You are a World-Class Clinical Pharmacist and Forensic Text Analyst.
    You have been provided with messy, fragmented text extracted from a medication image via OCR.
    
    YOUR MISSION: 
    Reconstruct the identity of the medication with 99.9% accuracy. You must use your extensive pharmaceutical knowledge to particularize the drug even from partial words (e.g., "Tyl..." -> "Tylenol/Acetaminophen").
    
    ${languageInstruction}

    STRICT RULES:
    1. NEVER return "Unknown" if there is even a slight clue. Infer the most likely match.
    2. If the text contains purely random garbage (e.g. "%$&^#"), only then return "Unknown".
    3. Output JSON ONLY. No markdown, no pre-text.
    4. PERSONALIZATION: If PATIENT_CONTEXT_JSON is not null, add patient-specific warnings and interactions based ONLY on the provided context (allergies, conditions, current meds, and medication memories). Do NOT invent conditions/allergies.
    5. If PATIENT_CONTEXT_JSON is null, set "personalized": null.
    6. VERIFICATION: If VERIFICATION_EVIDENCE_JSON is not null, use it to improve correctness of drug name (especially drugNameEn/genericNameEn/manufacturer) and to reduce hallucinations. Prefer official sources (openFDA) when available. Do not invent citations or sources beyond what is provided.
    
    RETURN FORMAT (JSON):
    {
        "drugName": "Inferred Name (e.g. Panadol Extra, Nivea Pearl & Beauty Deodorant) - ALWAYS IN ENGLISH",
        "drugNameEn": "The same product/drug name in English (for lookup). If already English, repeat it.",
        "genericName": "Scientific Name / Active Formulation (e.g. Paracetamol 500mg + Caffeine 65mg, or Aluminum Chlorohydrate + Avocado Oil) - ALWAYS IN ENGLISH",
        "genericNameEn": "Generic/active ingredient name in English. If already English, repeat it.",
        "manufacturer": "Inferred Manufacturer (or 'Generic')",
        "productCategory": "High-level classification: 'pharmaceutical_drug' | 'dietary_supplement' | 'topical_cosmetic_care' | 'deodorant_antiperspirant' | 'herbal_natural' | 'antiseptic_sanitizer' | 'medical_device_supply' | 'oral_care_mouthwash' | 'veterinary_product' | 'other'",
        "productCategoryLabel": "Clear, beautiful category label in ${language === 'ar' ? 'Arabic (e.g. دواء علاجي صيدلاني / مستحضر عناية ومزيل عرق / مكمل غذائي وفيتامينات / مرهم وكريم جلدي علاجى)' : 'English (e.g. Pharmaceutical Prescription Drug / Personal Care & Deodorant / Dietary Supplement & Vitamins / Topical Ointment)'}",
        "form": "Dosage/Product form (e.g. 'أقراص فموية (Tablets)', 'شراب سائل (Oral Syrup)', 'مرهم جلدي (Topical Ointment)', 'كريم موضعي (Topical Cream)', 'جل (Gel)', 'قطرة عين/أذن (Drops)', 'مزيل عرق رول أون (Roll-on Deodorant)', 'بخاخ رذاذي (Spray)', 'أمبولات وحقن (Injections)', 'تحاميل/لبوس (Suppositories)', 'لصقة جلدية (Patch)') - In ${language === 'ar' ? 'Arabic' : 'English'}",
        "dosageForm": "Specific form: 'tablet' | 'capsule' | 'syrup' | 'ointment' | 'cream' | 'gel' | 'drops' | 'deodorant' | 'spray' | 'injection' | 'suppository' | 'patch' | 'sachet' | 'lotion' | 'liquid' | 'other'",
        "routeOfAdministration": "Route of administration (e.g. 'استخدام فموي (Oral)', 'استخدام موضعي على الجلد فقط (Topical/External Only)', 'قطرة عينية (Ophthalmic)', 'قطرة أنفية (Nasal)', 'استنشاقي (Inhalation)', 'حقن عضلي/وريدي (Injectable)') - In ${language === 'ar' ? 'Arabic' : 'English'}",
        "targetAudience": "Target usage advice (e.g. 'للاستخدام الخارجي فقط' or 'للبالغين والأطفال فوق 12 سنة') - In ${language === 'ar' ? 'Arabic' : 'English'}",
        "strength": "Strength/Volume if inferable (e.g. 500mg, 50ml, 1%, 200mg/5ml) - ALWAYS IN ENGLISH",
        "activeIngredients": ["List of active ingredients and key compounds (max 5) - ALWAYS IN ENGLISH"],
        "activeIngredientsEn": ["List of active ingredients in English. If already English, repeat it."],
        "description": "Professional description of the product and its primary purpose, suitable for a user/patient to understand. (In ${language === 'ar' ? 'Arabic' : 'English'})",
        "category": "Therapeutic/Product Category (e.g. مسكن وخافض للحرارة, مزيل لرائحة العرق ومضاد للتعرق, مضاد حيوي واسع المجال, مضاد للالتهاب) (In ${language === 'ar' ? 'Arabic' : 'English'})",
        "uses": ["List of 3-5 primary medical/product uses (In ${language === 'ar' ? 'Arabic' : 'English'})"],
        "dosage": "Standard instructions or usage method (e.g. 'قرص واحد كل 6-8 ساعات' or 'يوضع على بشرة نظيفة وجافة مرة يومياً') - In ${language === 'ar' ? 'Arabic' : 'English'}",
        "missedDose": "What to do if a dose/application is missed (In ${language === 'ar' ? 'Arabic' : 'English'})",
        "overdose": {
            "symptoms": ["Overdose or excessive application symptoms (In ${language === 'ar' ? 'Arabic' : 'English'})"],
            "whatToDo": ["Actions if overused/ingested accidentally (In ${language === 'ar' ? 'Arabic' : 'English'})"]
        },
        "sideEffects": ["List of 3-7 common side effects or skin sensitivities (In ${language === 'ar' ? 'Arabic' : 'English'})"],
        "storage": "Storage instructions (e.g. 'يحفظ في درجة حرارة أقل من 25 مئوية بعيداً عن الرطوبة وأشعة الشمس') (In ${language === 'ar' ? 'Arabic' : 'English'})",
        "warnings": ["Critical safety warnings (In ${language === 'ar' ? 'Arabic' : 'English'})", "Special precautions"],
        "contraindications": ["Max 6 contraindications or when not to use (In ${language === 'ar' ? 'Arabic' : 'English'})"],
        "precautions": ["Max 6 precautions (In ${language === 'ar' ? 'Arabic' : 'English'})"],
        "interactions": ["Major interactions (In ${language === 'ar' ? 'Arabic' : 'English'})"],
        "whenToSeekHelp": ["Red-flag symptoms requiring medical attention (In ${language === 'ar' ? 'Arabic' : 'English'})"],
        "personalized": {
            "contextUsed": true,
            "riskLevel": "low|medium|high",
            "riskSummary": "Short user-specific risk summary (In ${language === 'ar' ? 'Arabic' : 'English'})",
            "alerts": [
                {
                    "severity": "low|medium|high",
                    "title": "Short title (In ${language === 'ar' ? 'Arabic' : 'English'})",
                    "details": "Details (In ${language === 'ar' ? 'Arabic' : 'English'})"
                }
            ],
            "basedOn": {
                "allergies": true,
                "conditions": true,
                "currentMedications": true,
                "medicationMemories": true
            }
        },
        "confidenceScore": 0-100 (Confidence in this identification)
    }

    PATIENT_CONTEXT_JSON (Ultra only):
    ${contextJson}

    VERIFICATION_EVIDENCE_JSON (pre-analysis web/FDA signals):
    ${verificationJson}
    
    OCR TEXT FRAGMENTS:
    "${extractedText}"
    
    END OF TEXT. ANALYZE NOW.
  `;

        const response = await deepseek.chat.completions.create({
            model: DEEPSEEK_MODEL,
            messages: [
                { role: "system", content: "You are a specialized medical analysis AI. Output valid JSON only." },
                { role: "user", content: systemPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2, // Very low temperature for high precision
        });

        const content = response.choices[0].message.content;
        console.log("AI Raw Response:", content);

        if (!content) throw new Error("No response from AI");

        const jsonCandidate = fixInvalidJsonEscapes(extractJsonCandidate(content));
        let parsedContent: any;
        try {
            parsedContent = JSON.parse(jsonCandidate);
        } catch (parseError: any) {
            console.error("AI JSON Parse Failed. Candidate:", jsonCandidate);
            throw new Error(parseError?.message || "AI returned invalid JSON");
        }

        // Sanity Check
        if (parsedContent.drugName === "Unknown") {
            console.warn("AI returned Unknown drug name.");
            // We still return it, UI will handle the failure state
        }

        return parsedContent;

    } catch (error) {
        console.error("DeepSeek Analysis Error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to analyze text");
    }
};
