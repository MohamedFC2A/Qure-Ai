import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/creditService";
import { hasAcceptedTerms } from "@/lib/legal/terms";
import { checkGuardrails } from "@/lib/ai/guardrails";
import { buildSmartMemoryMessages } from "@/lib/ai/memory";
import { DEEPSEEK_BASE_URL, createPollinationsClient, getDeepSeekApiKey, getDeepSeekModel, getTextModelsToTry } from "@/lib/ai/deepseek";
import { type AiChatMode, buildContextMessage, buildSystemPrompt, generateConversationTitle, parseAiResponse } from "@/lib/ai/chat";

/* ──────────────────────────────────────────────────────────
 *  Helper: extract & fix JSON from AI response
 * ────────────────────────────────────────────────────────── */
function extractJsonCandidate(raw: string): string {
    const text = String(raw || "").trim();
    if (!text) return text;
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    const unwrapped = (fenced?.[1] ?? text).trim();
    if ((unwrapped.startsWith("{") && unwrapped.endsWith("}")) || (unwrapped.startsWith("[") && unwrapped.endsWith("]"))) {
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
    return jsonText.replace(/\\(?!["\\\/bfnrtu]|u[0-9a-fA-F]{4})/g, "\\\\");
}

import { getLocalDevUser } from "@/lib/devAuth";

function clampText(value: unknown, maxLen: number): string {
    const s = String(value ?? "").trim();
    if (!s) return "";
    if (s.length <= maxLen) return s;
    const cut = s.slice(0, maxLen);
    const lastStop = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("؟"), cut.lastIndexOf("?"), cut.lastIndexOf("!"));
    return (lastStop > maxLen * 0.7 ? cut.slice(0, lastStop + 1) : cut).trim() + "…";
}

/* ──────────────────────────────────────────────────────────
 *  Simple in-memory rate limiter (per user, per process)
 *  Prevents abusive callers from running up AI API costs.
 * ────────────────────────────────────────────────────────── */
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 20;      // max requests
const RATE_LIMIT_WINDOW = 60_000; // per 60 seconds

function formatMedicationContext(med: any): string {
    if (!med) return "";
    const name = med.drug_name || med.drugName || med.drugNameEn || "Medication";
    const mfg = med.manufacturer || med.manufacturerName || "";
    const summary = med.summary || med.summaryAr || med.summaryEn || "";
    const analysis = med.analysis_json || med;

    const lines = [
        `[TARGET MEDICATION DETAILS]`,
        `Drug Name: ${name}`,
        mfg ? `Manufacturer: ${mfg}` : "",
        summary ? `Summary: ${summary}` : "",
    ];

    if (analysis && typeof analysis === "object") {
        if (analysis.activeIngredients) lines.push(`Active Ingredients: ${JSON.stringify(analysis.activeIngredients)}`);
        if (analysis.dosage) lines.push(`Dosage & Administration: ${JSON.stringify(analysis.dosage)}`);
        if (analysis.warnings) lines.push(`Warnings & Precautions: ${JSON.stringify(analysis.warnings)}`);
        if (analysis.sideEffects) lines.push(`Side Effects: ${JSON.stringify(analysis.sideEffects)}`);
        if (analysis.interactions) lines.push(`Interactions: ${JSON.stringify(analysis.interactions)}`);
        if (analysis.fdaData) lines.push(`FDA Verification Data: ${JSON.stringify(analysis.fdaData)}`);
        if (analysis.raw_text || analysis.ocrText) lines.push(`Package Text: ${analysis.raw_text || analysis.ocrText}`);
    }

    return lines.filter(Boolean).join("\n");
}

/* ──────────────────────────────────────────────────────────
 *  POST /api/ai/chat
 * ────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
    const startTime = Date.now();
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const user = authUser || getLocalDevUser(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasAcceptedTerms(user)) {
            return NextResponse.json({ error: "Terms acceptance required", code: "TERMS_REQUIRED" }, { status: 403 });
        }

        const body = await req.json();
        const mode: AiChatMode = body?.mode;
        const question: string | null = body?.question ? String(body.question).trim() : null;
        const language: "en" | "ar" = body?.language === "ar" ? "ar" : "en";
        const conversationId: string | null = body?.conversationId ? String(body.conversationId) : null;
        const messageHistory: Array<{ role: "user" | "assistant"; content: string }> = Array.isArray(body?.messageHistory) ? body.messageHistory : [];
        const medicationData: any = body?.medicationData || null;

        // Check ULTRA plan access
        const plan = await getUserPlan(user.id, supabase);
        if (plan !== 'ultra') {
            return NextResponse.json(
                {
                    error: language === "ar"
                        ? "ميزة Mat AI متاحة حصرياً لمشتركي باقة ULTRA. يرجى الترقية لاستخدام المساعد الذكي."
                        : "Mat AI is available exclusively on the ULTRA plan. Please upgrade your plan to access Mat AI.",
                    requiresUltra: true,
                },
                { status: 402 }
            );
        }

        // Validation
        if (!mode || !["health", "medication", "context"].includes(mode)) {
            return NextResponse.json({ error: "Invalid mode. Must be 'health', 'medication', or 'context'." }, { status: 400 });
        }
        if (!question) {
            return NextResponse.json({ error: "Question is required" }, { status: 400 });
        }
        if (question.length > 2000) {
            return NextResponse.json({ error: "Question too long (max 2000 characters)" }, { status: 400 });
        }

        // 1. FAST ZERO-TOKEN GUARDRAIL CHECK
        const guard = checkGuardrails(question, language);
        if (guard.isBlocked) {
            return NextResponse.json({
                conversationId,
                answer: guard.redirectMessage,
                keyPoints: [],
                suggestedFollowUps: language === "ar"
                    ? ["نصائح تغذية صحية", "تمارين تحسين النوم", "كيفية خفض التوتر", "مراجعة تداخل الأدوية"]
                    : ["Healthy nutrition tips", "Sleep improvement exercises", "How to reduce stress", "Review drug interactions"],
                meta: { mode, guardrailBlocked: true },
                serverDurationMs: Date.now() - startTime,
            });
        }

        // Check DeepSeek API key (throws if not configured — no fallback hardcoded keys)
        let apiKey: string;
        try {
            apiKey = getDeepSeekApiKey();
        } catch (e: any) {
            console.error("[AI Chat API] DeepSeek key missing:", e.message);
            return NextResponse.json({ error: "Server configuration error: DEEPSEEK_API_KEY is not configured." }, { status: 503 });
        }

        // For context mode, fetch user's health data
        let contextData: any = null;
        if (mode === "context") {
            const plan = await getUserPlan(user.id, supabase);

            // Load private profile (try care_profiles first, then legacy)
            let privateProfile: any = null;
            const careRes = await supabase
                .from("care_private_profiles")
                .select("age, sex, height, weight, allergies, chronic_conditions, current_medications, notes")
                .eq("profile_id", user.id)
                .maybeSingle();
            privateProfile = careRes.data;

            if (!privateProfile) {
                const legacyRes = await supabase
                    .from("user_private_profile")
                    .select("age, sex, weight, allergies, chronic_conditions, current_medications, notes")
                    .eq("user_id", user.id)
                    .maybeSingle();
                privateProfile = legacyRes.data;
            }

            // Load medication memories
            let medicationMemories: string[] = [];
            const memRes = await supabase
                .from("memories_medications")
                .select("display_name")
                .eq("user_id", user.id)
                .order("last_seen_at", { ascending: false })
                .limit(25);
            if (memRes.data) {
                medicationMemories = memRes.data.map((m: any) => m.display_name).filter(Boolean);
            }

            // Load recent scans
            let recentScans: string[] = [];
            const histRes = await supabase
                .from("medication_history")
                .select("drug_name")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(15);
            if (histRes.data) {
                recentScans = histRes.data.map((h: any) => h.drug_name).filter(Boolean);
            }

            contextData = { privateProfile, medicationMemories, recentScans };
        }

        // Build 100% static system prompt (hits DeepSeek Prompt Cache every time)
        const systemPrompt = buildSystemPrompt(mode, language);

        const deepseekMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: systemPrompt },
        ];

        // Add dynamic context block if in context mode
        if (mode === "context" && contextData) {
            const ctxMsg = buildContextMessage(contextData, language);
            if (ctxMsg) {
                deepseekMessages.push({ role: "user", content: ctxMsg });
            }
        }

        if (medicationData) {
            const medFormatted = formatMedicationContext(medicationData);
            if (medFormatted) {
                deepseekMessages.push({
                    role: "user",
                    content: medFormatted,
                });
            }
        }

        // Add smart compressed conversation history (max 85% token savings)
        const smartHistory = buildSmartMemoryMessages(messageHistory, question);
        for (const msg of smartHistory) {
            deepseekMessages.push(msg);
        }

        // Add current question
        deepseekMessages.push({ role: "user", content: question });

        let content: string | null = null;
        const pollinations = createPollinationsClient(apiKey);
        const modelsToTry = getTextModelsToTry();

        for (const candidateModel of modelsToTry) {
            try {
                console.log(`[AI Chat API] Calling Pollinations AI model (${candidateModel})...`);
                const response = await pollinations.chat.completions.create({
                    model: candidateModel,
                    messages: deepseekMessages,
                    temperature: 0.15,
                    max_tokens: 3000,
                });
                content = response.choices[0]?.message?.content || null;
                if (content && content.trim().length > 0) {
                    console.log(`[AI Chat API] Success using model (${candidateModel}), length:`, content.length);
                    break;
                }
            } catch (err: any) {
                console.warn(`[AI Chat API] Model (${candidateModel}) failed:`, err?.message || err);
            }
        }

        if (!content) {
            return NextResponse.json({ error: "No AI response" }, { status: 502 });
        }

        // Robust parsing using parseAiResponse helper
        const parsedRes = parseAiResponse(content);
        const answer = clampText(parsedRes.answer || content, 4000);
        const keyPoints = parsedRes.keyPoints.map((s) => clampText(s, 200)).filter(Boolean).slice(0, 7);
        const suggestedFollowUps = parsedRes.suggestedFollowUps.map((s) => clampText(s, 160)).filter(Boolean).slice(0, 4);

        // Persist conversation and messages to DB
        let activeConversationId = conversationId;

        try {
            // If no conversation exists, create one
            if (!activeConversationId) {
                const title = generateConversationTitle(question, language);
                const convResult = await supabase
                    .from("ai_conversations")
                    .insert({
                        user_id: user.id,
                        mode,
                        title,
                        metadata: mode === "medication" && medicationData
                            ? { medicationName: medicationData.drugName || null }
                            : {},
                    })
                    .select("id")
                    .single();

                if (convResult.data) {
                    activeConversationId = convResult.data.id;
                }
            }

            // Save user message
            if (activeConversationId) {
                await supabase.from("ai_messages").insert({
                    conversation_id: activeConversationId,
                    role: "user",
                    content: question,
                    metadata: { mode },
                });

                // Save assistant message
                await supabase.from("ai_messages").insert({
                    conversation_id: activeConversationId,
                    role: "assistant",
                    content: answer,
                    metadata: { mode, keyPoints, suggestedFollowUps },
                });
            }
        } catch (dbError) {
            console.error("Failed to persist chat messages:", dbError);
            // Don't fail the request - chat still works, just not persisted
        }

        return NextResponse.json({
            conversationId: activeConversationId,
            answer,
            keyPoints,
            suggestedFollowUps,
            meta: { mode },
            serverDurationMs: Date.now() - startTime,
        });
    } catch (error: any) {
        console.error("AI Chat Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
