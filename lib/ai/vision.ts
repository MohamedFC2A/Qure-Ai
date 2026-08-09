import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DEEPSEEK_BASE_URL, getDeepSeekApiKey, getDeepSeekModel } from "@/lib/ai/deepseek";

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

        const contextJson = context ? JSON.stringify({
            allergies: context.privateProfile?.allergies || null,
            conditions: context.privateProfile?.chronic_conditions || null,
            currentMeds: context.privateProfile?.current_medications || null,
        }) : "null";

        // Compact verification evidence to save 90% tokens
        const compactVerification = verificationEvidence ? {
            ndc: verificationEvidence.ndc || null,
            hint: verificationEvidence.classificationHint?.kind || null,
            webSnippets: Array.isArray(verificationEvidence.web?.results)
                ? verificationEvidence.web!.results.slice(0, 3).map((r) => r.title + ": " + (r.snippet || "").slice(0, 150))
                : [],
        } : null;
        const verificationJson = compactVerification ? JSON.stringify(compactVerification) : "null";

        // 100% Static System Prompt for DeepSeek Context Caching
        const staticSystemPrompt = `You are a World-Class Clinical Pharmacist and Forensic Text Analyst.
Reconstruct medication identity from OCR text fragments with high clinical accuracy.

${languageInstruction}

STRICT RULES:
1. Infer most likely match. Output JSON ONLY.
2. If PATIENT_CONTEXT_JSON is provided, add personalized alerts.
3. If VERIFICATION_EVIDENCE_JSON is provided, use it to improve accuracy.

RETURN FORMAT (JSON):
{
    "drugName": "Name in English",
    "drugNameEn": "Name in English",
    "genericName": "Scientific Formulation in English",
    "genericNameEn": "Generic Name in English",
    "manufacturer": "Manufacturer name",
    "productCategory": "pharmaceutical_drug | dietary_supplement | topical_cosmetic_care | deodorant_antiperspirant | herbal_natural | other",
    "productCategoryLabel": "Category label",
    "form": "Product form",
    "dosageForm": "tablet | capsule | syrup | ointment | cream | gel | drops | deodorant | spray | other",
    "routeOfAdministration": "Route of administration",
    "targetAudience": "Usage advice",
    "strength": "Strength/Volume",
    "activeIngredients": ["Active ingredients in English"],
    "activeIngredientsEn": ["Active ingredients in English"],
    "description": "Short product description",
    "category": "Therapeutic category",
    "uses": ["3-5 primary uses"],
    "dosage": "Usage instructions",
    "missedDose": "Missed dose instructions",
    "overdose": { "symptoms": ["Symptoms"], "whatToDo": ["Actions"] },
    "sideEffects": ["Common side effects"],
    "storage": "Storage instructions",
    "warnings": ["Critical safety warnings"],
    "contraindications": ["Contraindications"],
    "precautions": ["Precautions"],
    "interactions": ["Interactions"],
    "whenToSeekHelp": ["Red-flag symptoms"],
    "personalized": { "contextUsed": true, "riskLevel": "low|medium|high", "riskSummary": "Summary", "alerts": [] },
    "confidenceScore": 0-100
}`;

        const userPayload = `
PATIENT_CONTEXT_JSON:
${contextJson}

VERIFICATION_EVIDENCE_JSON:
${verificationJson}

OCR TEXT FRAGMENTS:
"${extractedText}"
`;

        let content: string | null = null;
        try {
            const deepseek = new OpenAI({
                apiKey: getDeepSeekApiKey(),
                baseURL: DEEPSEEK_BASE_URL,
            });
            const response = await deepseek.chat.completions.create({
                model: getDeepSeekModel(),
                messages: [
                    { role: "system", content: staticSystemPrompt },
                    { role: "user", content: userPayload }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2,
                max_tokens: 750,
            });
            content = response.choices[0]?.message?.content || null;
        } catch (dsErr: any) {
            console.warn("[Vision API] DeepSeek failed, switching to Gemini Flash fallback:", dsErr?.message || dsErr);
            const geminiKey = process.env.GEMINI_API_KEY;
            if (geminiKey) {
                try {
                    const genAI = new GoogleGenerativeAI(geminiKey);
                    const modelName = process.env.GEMINI_OCR_MODEL || "gemini-2.5-flash-lite";
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
                    });
                    const res = await model.generateContent(`${staticSystemPrompt}\n\n${userPayload}`);
                    content = res.response.text();
                } catch (gErr) {
                    console.error("[Vision API] Gemini fallback failed:", gErr);
                }
            }
        }

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
