import { NextRequest } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/creditService";
import { hasAcceptedTerms } from "@/lib/legal/terms";
import { checkGuardrails } from "@/lib/ai/guardrails";
import { buildSmartMemoryMessages } from "@/lib/ai/memory";
import { DEEPSEEK_BASE_URL, getDeepSeekApiKey, getDeepSeekModel } from "@/lib/ai/deepseek";
import { type AiChatMode, buildContextMessage, buildSystemPrompt, generateConversationTitle, parseAiResponse } from "@/lib/ai/chat";

const META_SEPARATOR = "\n---METADATA---\n";

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
 *  POST /api/ai/chat/stream  —  SSE streaming chat
 *  Returns token-by-token Server-Sent Events
 * ────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        if (!hasAcceptedTerms(user)) {
            return new Response(JSON.stringify({ error: "Terms acceptance required" }), { status: 403, headers: { "Content-Type": "application/json" } });
        }

        const body = await req.json();
        const mode: AiChatMode = body?.mode;
        const question: string | null = body?.question ? String(body.question).trim() : null;
        const language: "en" | "ar" = body?.language === "ar" ? "ar" : "en";
        const conversationId: string | null = body?.conversationId ? String(body.conversationId) : null;
        const messageHistory: Array<{ role: "user" | "assistant"; content: string }> =
            Array.isArray(body?.messageHistory) ? body.messageHistory : [];
        const medicationData: any = body?.medicationData || null;

        // Check ULTRA plan access
        const plan = await getUserPlan(user.id, supabase);
        if (plan !== 'ultra') {
            return new Response(
                JSON.stringify({
                    error: language === "ar"
                        ? "ميزة Mat AI متاحة حصرياً لمشتركي باقة ULTRA. يرجى الترقية لاستخدام المساعد الذكي."
                        : "Mat AI is available exclusively on the ULTRA plan. Please upgrade your plan to access Mat AI.",
                    requiresUltra: true,
                }),
                { status: 402, headers: { "Content-Type": "application/json" } }
            );
        }

        if (!mode || !["health", "medication", "context"].includes(mode)) {
            return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        if (!question) {
            return new Response(JSON.stringify({ error: "Question is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // 1. FAST ZERO-TOKEN GUARDRAIL CHECK FOR STREAMING
        const guard = checkGuardrails(question, language);
        if (guard.isBlocked) {
            const encoder = new TextEncoder();
            const redirectText = guard.redirectMessage || "";
            const readable = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`));
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", token: redirectText })}\n\n`));
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: "done",
                        conversationId,
                        answer: redirectText,
                        keyPoints: [],
                        suggestedFollowUps: language === "ar"
                            ? ["نصائح تغذية صحية", "تمارين تحسين النوم", "كيفية خفض التوتر", "مراجعة تداخل الأدوية"]
                            : ["Healthy nutrition tips", "Sleep improvement exercises", "How to reduce stress", "Review drug interactions"],
                    })}\n\n`));
                    controller.close();
                }
            });
            return new Response(readable, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache, no-transform",
                    "Connection": "keep-alive",
                },
            });
        }

        let apiKey: string;
        try {
            apiKey = getDeepSeekApiKey();
        } catch (e: any) {
            return new Response(JSON.stringify({ error: "Server configuration error: DEEPSEEK_API_KEY is not configured." }), { status: 503, headers: { "Content-Type": "application/json" } });
        }

        /* ── Fetch context data for context mode ── */
        let contextData: any = null;
        if (mode === "context") {
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
            let medicationMemories: string[] = [];
            const memRes = await supabase
                .from("memories_medications")
                .select("display_name")
                .eq("user_id", user.id)
                .order("last_seen_at", { ascending: false })
                .limit(25);
            if (memRes.data) medicationMemories = memRes.data.map((m: any) => m.display_name).filter(Boolean);

            let recentScans: string[] = [];
            const histRes = await supabase
                .from("medication_history")
                .select("drug_name")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(15);
            if (histRes.data) recentScans = histRes.data.map((h: any) => h.drug_name).filter(Boolean);

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
        deepseekMessages.push({ role: "user", content: question });

        // Add format instruction
        deepseekMessages.push({
            role: "system",
            content: language === "ar"
                ? `أجب بصيغة Markdown نظيفة ومفصلة. عند الانتهاء تماماً، اترك سطرين واكتب:\n${META_SEPARATOR}\n{"keyPoints":["نقطة 1","نقطة 2"],"suggestedFollowUps":["سؤال 1؟","سؤال 2؟"]}`
                : `Answer with clean, detailed Markdown formatting. When completely done, leave 2 blank lines and write:\n${META_SEPARATOR}\n{"keyPoints":["point 1","point 2"],"suggestedFollowUps":["question 1?","question 2?"]}`,
        });

        const encoder = new TextEncoder();
        let fullText = "";

        let tokenStream: AsyncIterable<any> | null = null;
        try {
            const deepseek = new OpenAI({ apiKey: apiKey, baseURL: DEEPSEEK_BASE_URL });
            tokenStream = await deepseek.chat.completions.create({
                model: getDeepSeekModel(),
                messages: deepseekMessages,
                stream: true,
                temperature: 0.2,
                max_tokens: 600,
            });
        } catch (err: any) {
            console.error("[AI Stream Route] Pollinations stream failed:", err?.message || err);
            throw err;
        }

        const readable = new ReadableStream({
            async start(controller) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`));

                try {
                    if (tokenStream) {
                        for await (const chunk of tokenStream) {
                            const token = chunk.choices?.[0]?.delta?.content || "";
                            if (token) {
                                fullText += token;
                                const sepIdx = fullText.indexOf(META_SEPARATOR);
                                const startsWithJson = fullText.trimStart().startsWith("{") || fullText.trimStart().startsWith("```json");
                                // Only stream tokens if model is NOT writing raw JSON directly
                                if (sepIdx === -1 && !startsWithJson) {
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", token })}\n\n`));
                                }
                            }
                        }
                    }

                    /* ── Parse full response robustly ── */
                    const parsed = parseAiResponse(fullText);
                    let answer = parsed.answer;
                    let keyPoints = parsed.keyPoints.slice(0, 7);
                    let suggestedFollowUps = parsed.suggestedFollowUps.slice(0, 4);

                    if (!answer) {
                        answer = language === "ar" ? "عذرًا، لم أتمكن من توليد إجابة." : "Sorry, I couldn't generate an answer.";
                    }

                    /* ── Zero-Token Local Metadata Fallback (0 AI Tokens Consumed) ── */
                    if (keyPoints.length === 0) {
                        const bullets = answer.split("\n")
                            .map((line) => line.replace(/^[-*•\d.]+\s*/, "").trim())
                            .filter((line) => line.length >= 10 && line.length <= 150);
                        keyPoints = bullets.slice(0, 5);
                    }
                    if (suggestedFollowUps.length === 0) {
                        suggestedFollowUps = language === "ar"
                            ? ["ما هي الآثار الجانبية الشائعة؟", "هل يتداخل مع أدوية أخرى؟", "ما هي الجرعة اليومية الموصى بها؟", "متى يجب استشارة الطبيب فورا؟"]
                            : ["What are common side effects?", "Does it interact with other medications?", "What is the recommended daily dosage?", "When should I consult a doctor?"];
                    }

                    /* ── Persist to DB ── */
                    let activeConversationId = conversationId;
                    try {
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
                            if (convResult.data) activeConversationId = convResult.data.id;
                        }
                        if (activeConversationId) {
                            await supabase.from("ai_messages").insert({
                                conversation_id: activeConversationId,
                                role: "user",
                                content: question,
                                metadata: { mode },
                            });
                            await supabase.from("ai_messages").insert({
                                conversation_id: activeConversationId,
                                role: "assistant",
                                content: answer,
                                metadata: { mode, keyPoints, suggestedFollowUps },
                            });
                        }
                    } catch (dbErr) {
                        console.error("Failed to persist stream chat:", dbErr);
                    }

                    /* ── Send done event ── */
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: "done",
                        conversationId: activeConversationId,
                        answer,
                        keyPoints,
                        suggestedFollowUps,
                    })}\n\n`));
                } catch (err: any) {
                    console.error("Streaming error:", err);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: "error",
                        error: err?.message || "Streaming failed",
                    })}\n\n`));
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        });
    } catch (error: any) {
        console.error("Stream route error:", error);
        return new Response(JSON.stringify({ error: error?.message || "Internal error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
