import OpenAI from "openai";
import { DEEPSEEK_BASE_URL, createPollinationsClient, getDeepSeekApiKey, getDeepSeekModel } from "@/lib/ai/deepseek";

export type InteractionSeverity = "safe" | "caution" | "danger";

export interface InteractionGuardItem {
    otherMedication: string;
    severity: InteractionSeverity;
    confidence: number; // 0-100
    headline: string;
    summary: string;
    mechanism?: string;
    whatToDo?: string[];
    monitoring?: string[];
    redFlags?: string[];
}

export interface InteractionGuardResult {
    overallRisk?: string;
    items: InteractionGuardItem[];
    disclaimer?: string;
    model?: string;
    generatedAt: string;
    serverDurationMs?: number;
}

function extractJsonCandidate(raw: string): string {
    const text = String(raw || "").trim();
    if (!text) return text;

    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const unwrapped = (fenced?.[1] ?? text).trim();

    if (
        (unwrapped.startsWith("{") && unwrapped.endsWith("}")) ||
        (unwrapped.startsWith("[") && unwrapped.endsWith("]"))
    ) {
        return unwrapped;
    }

    const firstBrace = unwrapped.indexOf("{");
    const lastBrace = unwrapped.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return unwrapped.slice(firstBrace, lastBrace + 1);
    }

    return unwrapped;
}

function fixInvalidJsonEscapes(jsonText: string): string {
    return jsonText.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, "\\\\");
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
}

function normalizeSeverity(value: unknown): InteractionSeverity {
    const v = String(value || "").toLowerCase().trim();
    if (v === "safe") return "safe";
    if (v === "danger" || v === "high" || v === "contraindicated") return "danger";
    return "caution";
}

export async function generateInteractionGuard(params: {
    language: "en" | "ar";
    targetMedication: {
        drugName?: string;
        drugNameEn?: string;
        genericName?: string;
        genericNameEn?: string;
        activeIngredients?: string[];
        activeIngredientsDetailed?: Array<{ name?: string; strength?: string; strengthMg?: number }>;
        interactions?: string[];
        warnings?: string[];
        contraindications?: string[];
        precautions?: string[];
    };
    subjectProfile?: {
        display_name?: string | null;
        relationship?: string | null;
        age?: number | null;
        sex?: string | null;
        height?: string | null;
        weight?: string | null;
        allergies?: string | null;
        chronic_conditions?: string | null;
        current_medications?: string | null;
        notes?: string | null;
    } | null;
    otherMedications: string[];
}): Promise<InteractionGuardResult> {
    const startedAt = Date.now();
    const apiKey = getDeepSeekApiKey();
    if (!apiKey) {
        return {
            items: [],
            disclaimer: "Server configuration error: DEEPSEEK_API_KEY is missing.",
            generatedAt: new Date().toISOString(),
            serverDurationMs: Date.now() - startedAt,
        };
    }

    const language = params.language === "ar" ? "ar" : "en";
    const isAr = language === "ar";

    const target = params.targetMedication || {};
    const subject = params.subjectProfile || null;
    const other = Array.isArray(params.otherMedications) ? params.otherMedications : [];

    // Compact target payload (90% token savings)
    const targetJson = JSON.stringify({
        drugName: target.drugName || target.drugNameEn || "Target Medication",
        genericName: target.genericName || target.genericNameEn || "",
        activeIngredients: Array.isArray(target.activeIngredients) ? target.activeIngredients.slice(0, 5) : [],
    });

    const subjectJson = JSON.stringify({
        allergies: subject?.allergies ?? null,
        conditions: subject?.chronic_conditions ?? null,
        currentMeds: subject?.current_medications ?? null,
    });

    const otherJson = JSON.stringify(other.slice(0, 8));

    const systemLanguageRule = isAr
        ? "اكتب كل القيم النصية باللغة العربية الفصحى. مفاتيح JSON بالإنجليزية."
        : "Write all string values in English. JSON keys in English.";

    // 100% Static System Prompt for DeepSeek Context Caching
    const staticSystemPrompt = `You are a clinical pharmacist and drug safety specialist.
${systemLanguageRule}

TASK:
Build a Cross-Interaction Guard between a TARGET medication and a list of OTHER medications.

SEVERITY RULES:
- safe: no clinically meaningful interaction is expected.
- caution: interaction is possible OR needs monitoring.
- danger: major interaction or contraindicated combination.

IMPORTANT:
- Use only the context provided.
- Confidence is 0-100.
- Keep fields concise and high-signal.
- Output VALID JSON ONLY.

OUTPUT SCHEMA:
{
  "overallRisk": "short summary",
  "items": [
    {
      "otherMedication": "string",
      "severity": "safe|caution|danger",
      "confidence": 0-100,
      "headline": "short title",
      "summary": "1-2 short sentences",
      "whatToDo": ["2-3 short actions"]
    }
  ],
  "disclaimer": "short safety disclaimer"
}`;

    const userPayload = `
TARGET_MEDICATION_JSON:
${targetJson}

SUBJECT_PROFILE_JSON:
${subjectJson}

OTHER_MEDICATIONS_JSON:
${otherJson}
`;

    let content: string | null = null;
    try {
        const deepseek = createPollinationsClient();

        const response = await deepseek.chat.completions.create({
            model: getDeepSeekModel(),
            messages: [
                { role: "system", content: staticSystemPrompt },
                { role: "user", content: userPayload },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 350,
        });

        content = response.choices[0]?.message?.content || null;
    } catch (err: any) {
        console.error("[InteractionGuard] Pollinations AI call failed:", err?.message || err);
    }
    if (!content) {
        return {
            items: [],
            disclaimer: isAr ? "لم يتم الحصول على رد من نموذج الذكاء الاصطناعي." : "No AI response.",
            generatedAt: new Date().toISOString(),
            serverDurationMs: Date.now() - startedAt,
        };
    }

    const candidate = fixInvalidJsonEscapes(extractJsonCandidate(content));
    let parsed: any;
    try {
        parsed = JSON.parse(candidate);
    } catch {
        return {
            items: [],
            disclaimer: isAr ? "تعذر تحليل رد الذكاء الاصطناعي." : "Failed to parse AI response.",
            generatedAt: new Date().toISOString(),
            serverDurationMs: Date.now() - startedAt,
        };
    }

    const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
    const items: InteractionGuardItem[] = rawItems
        .map((it: any) => {
            const otherMedication = String(it?.otherMedication || "").trim();
            if (!otherMedication) return null;
            const severity = normalizeSeverity(it?.severity);
            const confidence = clampInt(it?.confidence, 0, 100, severity === "safe" ? 70 : severity === "danger" ? 80 : 60);
            const headline = String(it?.headline || "").trim() || (isAr ? "تقييم التداخل" : "Interaction assessment");
            const summary = String(it?.summary || "").trim() || "";
            const mechanism = String(it?.mechanism || "").trim() || undefined;
            const whatToDo = Array.isArray(it?.whatToDo) ? it.whatToDo.map((s: any) => String(s || "").trim()).filter(Boolean).slice(0, 8) : undefined;
            const monitoring = Array.isArray(it?.monitoring) ? it.monitoring.map((s: any) => String(s || "").trim()).filter(Boolean).slice(0, 8) : undefined;
            const redFlags = Array.isArray(it?.redFlags) ? it.redFlags.map((s: any) => String(s || "").trim()).filter(Boolean).slice(0, 8) : undefined;
            return { otherMedication, severity, confidence, headline, summary, mechanism, whatToDo, monitoring, redFlags };
        })
        .filter(Boolean) as InteractionGuardItem[];

    return {
        overallRisk: typeof parsed?.overallRisk === "string" ? parsed.overallRisk : undefined,
        items,
        disclaimer: typeof parsed?.disclaimer === "string" ? parsed.disclaimer : undefined,
        model: getDeepSeekModel(),
        generatedAt: new Date().toISOString(),
        serverDurationMs: Date.now() - startedAt,
    };
}
