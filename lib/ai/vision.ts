import OpenAI from "openai";

// Initialize DeepSeek client (text-only)
const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY || "placeholder-key",
    baseURL: "https://api.deepseek.com",
});

export interface AnalyzeContext {
    privateProfile?: {
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
            ? `CRITICAL LANGUAGE RULE: You MUST answer completely in Arabic (Modern Standard Arabic). Translate all medical terms, descriptions, uses, side effects, and warnings into professional Arabic. Only keep the keys in English JSON format.`
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
        "drugName": "Inferred Name (e.g. Panadol Extra) - In ${language === 'ar' ? 'Arabic' : 'English'}",
        "drugNameEn": "The same drug name in English (for FDA lookup). If already English, repeat it.",
        "genericName": "Scientific Name (e.g. Paracetamol 500mg + Caffeine) - In ${language === 'ar' ? 'Arabic' : 'English'}",
        "genericNameEn": "Generic/active ingredient name in English (for FDA lookup). If already English, repeat it.",
        "manufacturer": "Inferred Manufacturer (or 'Generic')",
        "form": "Dosage form (tablet/capsule/syrup/cream/etc) - In ${language === 'ar' ? 'Arabic' : 'English'}",
        "strength": "Strength if inferable (e.g. 500mg) - In ${language === 'ar' ? 'Arabic' : 'English'}",
        "activeIngredients": ["List of active ingredients (max 5) - In ${language === 'ar' ? 'Arabic' : 'English'}"],
        "description": "Professional medical description of the drug, suitable for a patient to understand. (In ${language === 'ar' ? 'Arabic' : 'English'})",
        "category": "Therapeutic Category (e.g. Analgesic) (In ${language === 'ar' ? 'Arabic' : 'English'})",
        "uses": ["List of 3-5 primary medical uses (In ${language === 'ar' ? 'Arabic' : 'English'})"],
        "dosage": "Standard adult dosage (e.g. '500-1000mg q4-6h') if specific dosage not found in text. (In ${language === 'ar' ? 'Arabic' : 'English'})",
        "missedDose": "What to do if a dose is missed (In ${language === 'ar' ? 'Arabic' : 'English'})",
        "overdose": {
            "symptoms": ["Max 5 overdose symptoms (In ${language === 'ar' ? 'Arabic' : 'English'})"],
            "whatToDo": ["Max 4 actions (In ${language === 'ar' ? 'Arabic' : 'English'})"]
        },
        "sideEffects": ["List of 3-7 common side effects (In ${language === 'ar' ? 'Arabic' : 'English'})"],
        "storage": "Storage instructions (e.g. 'Store below 25°C, away from light') (In ${language === 'ar' ? 'Arabic' : 'English'})",
        "warnings": ["Critical safety warnings (In ${language === 'ar' ? 'Arabic' : 'English'})", "Pregnancy/Breastfeeding safety"],
        "contraindications": ["Max 6 contraindications (In ${language === 'ar' ? 'Arabic' : 'English'})"],
        "precautions": ["Max 6 precautions (In ${language === 'ar' ? 'Arabic' : 'English'})"],
        "interactions": ["Major drug interactions (e.g. Warfarin, Alcohol) (In ${language === 'ar' ? 'Arabic' : 'English'})"],
        "whenToSeekHelp": ["Max 6 red-flag symptoms requiring medical help (In ${language === 'ar' ? 'Arabic' : 'English'})"],
        "personalized": {
            "contextUsed": true,
            "riskLevel": "low|medium|high",
            "riskSummary": "Short patient-specific risk summary (In ${language === 'ar' ? 'Arabic' : 'English'})",
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
        "confidenceScore": 0-100 (Your confidence in this identification)
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
            model: "deepseek-chat",
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
