import { NextRequest } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan, getCreditsStatus, deductCredit } from "@/lib/creditService";
import { hasAcceptedTerms } from "@/lib/legal/terms";
import { checkGuardrails } from "@/lib/ai/guardrails";
import { buildSmartMemoryMessages } from "@/lib/ai/memory";
import { DEEPSEEK_BASE_URL, createPollinationsClient, getDeepSeekApiKey, getDeepSeekModel, getTextModelsToTry } from "@/lib/ai/deepseek";
import { type AiChatMode, buildContextMessage, buildSystemPrompt, generateConversationTitle, parseAiResponse } from "@/lib/ai/chat";

import { getLocalDevUser } from "@/lib/devAuth";

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
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const user = authUser || getLocalDevUser(req);

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
        // In local development, always grant ultra so devs can test without a subscription
        const plan = process.env.NODE_ENV === "development"
            ? "ultra"
            : await getUserPlan(user.id, supabase);
        const isLocalDev = process.env.NODE_ENV === "development";
        if (plan !== 'ultra') {
            return new Response(
                JSON.stringify({
                    error: language === "ar"
                        ? "ميزة Aura-OS Ai (AOS AI) متاحة حصرياً لمشتركي باقة ULTRA. يرجى الترقية لاستخدام المساعد الذكي."
                        : "Aura-OS Ai (AOS AI) is available exclusively on the ULTRA plan. Please upgrade your plan to access Aura-OS Ai.",
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

        // Deduct 1 credit per AI message sent
        const isLocalDevUser = user.id === "00000000-0000-0000-0000-000000000001" || user.id === "local-dev-user";
        if (!isLocalDevUser) {
            const creditStatus = await getCreditsStatus(user.id, supabase);
            if (creditStatus.totalAvailable < 1) {
                return new Response(
                    JSON.stringify({
                        error: language === "ar"
                            ? "عذراً، لقد استنفدت رصيد النقاط المتاح لك هذا الشهر. يرجى الترقية إلى باقة ULTRA أو الانتظار للتجديد الشهري."
                            : "Sorry, you have run out of monthly AI credits. Please upgrade your plan or wait for monthly renewal.",
                        outOfCredits: true,
                    }),
                    { status: 402, headers: { "Content-Type": "application/json" } }
                );
            }
            await deductCredit(user.id, 1, `mat_ai_chat_message:${mode}`);
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

        /* ── Always fetch user profile context ── */
        let privateProfile: any = null;
        let basicProfile: any = null;
        let medicationMemories: string[] = [];
        let recentScans: string[] = [];

        // Dev user: inject realistic test profile so Aura-OS Ai (AOS AI) can be tested
        if (isLocalDev) {
            privateProfile = {
                age: 30,
                sex: "male",
                height: "177",
                weight: "99",
                allergies: "Penicillin",
                chronic_conditions: "None",
                current_medications: "None",
                notes: "Test dev user",
            };
        } else {
            // 1. Fetch private AI profile
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

            // 2. Fetch basic profile (height, weight, age, gender) as fallback
            const basicRes = await supabase
                .from("profiles")
                .select("username, age, gender, height, weight")
                .eq("id", user.id)
                .maybeSingle();
            if (basicRes.data) {
                basicProfile = {
                    basic_age: basicRes.data.age,
                    basic_gender: basicRes.data.gender,
                    basic_height: basicRes.data.height,
                    basic_weight: basicRes.data.weight,
                };
            }

            // 3. Fetch medication memories
            const memRes = await supabase
                .from("memories_medications")
                .select("display_name")
                .eq("user_id", user.id)
                .order("last_seen_at", { ascending: false })
                .limit(25);
            if (memRes.data) medicationMemories = memRes.data.map((m: any) => m.display_name).filter(Boolean);

            // 4. Fetch recent scans
            const histRes = await supabase
                .from("medication_history")
                .select("drug_name")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(15);
            if (histRes.data) recentScans = histRes.data.map((h: any) => h.drug_name).filter(Boolean);
        }

        // Merge: privateProfile takes priority over basicProfile fallback fields
        const mergedProfile = {
            ...(basicProfile || {}),
            ...(privateProfile || {}),
        };

        const contextData = {
            privateProfile: Object.keys(mergedProfile).length > 0 ? mergedProfile : null,
            medicationMemories,
            recentScans,
        };


        // Build 100% static system prompt (hits DeepSeek Prompt Cache every time)
        const systemPrompt = buildSystemPrompt(mode, language);

        const deepseekMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: systemPrompt },
        ];

        // Always inject user profile context if available
        const ctxMsg = buildContextMessage(contextData, language);
        if (ctxMsg) {
            deepseekMessages.push({ role: "user", content: ctxMsg });
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
                ? `أجب بصيغة Markdown نظيفة ومباشرة. إذا كان السؤال يتطلب إجابة قاطعة (نعم/لا/مناسب/غير مناسب)، ابدأ بالإجابة القاطعة فوراً واجعل الرد مختصراً جداً. عند الانتهاء تماماً، اترك سطرين واكتب:\n${META_SEPARATOR}\n{"keyPoints":["نقطة 1","نقطة 2"],"suggestedFollowUps":["سؤال 1؟","سؤال 2؟"]}`
                : `Answer with clean, direct Markdown formatting. If the query calls for a clear Yes/No or suitability verdict, give the bold verdict immediately and keep the response ultra-concise. When completely done, leave 2 blank lines and write:\n${META_SEPARATOR}\n{"keyPoints":["point 1","point 2"],"suggestedFollowUps":["question 1?","question 2?"]}`,
        });

        const encoder = new TextEncoder();
        let fullText = "";

        let tokenStream: AsyncIterable<any> | null = null;
        const pollinations = createPollinationsClient(apiKey);
        const modelsToTry = getTextModelsToTry();

        for (const candidateModel of modelsToTry) {
            try {
                console.log(`[AI Stream Route] Calling Pollinations AI stream model (${candidateModel})...`);
                tokenStream = await pollinations.chat.completions.create({
                    model: candidateModel,
                    messages: deepseekMessages,
                    stream: true,
                    temperature: 0.2,
                    max_tokens: 3000,
                });
                if (tokenStream) {
                    console.log(`[AI Stream Route] Stream initialized using model (${candidateModel})`);
                    break;
                }
            } catch (err: any) {
                console.warn(`[AI Stream Route] Stream model (${candidateModel}) failed:`, err?.message || err);
            }
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
                                if (sepIdx === -1) {
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", token })}\n\n`));
                                }
                            }
                        }
                    }

                    /* ── Non-streaming fallback retry if stream returned empty text ── */
                    if (!fullText || fullText.trim().length === 0) {
                        console.log("[AI Stream Route] Stream returned empty text. Performing non-streaming fallback...");
                        for (const candidateModel of modelsToTry) {
                            try {
                                const fallbackRes = await pollinations.chat.completions.create({
                                    model: candidateModel,
                                    messages: deepseekMessages,
                                    stream: false,
                                    temperature: 0.2,
                                    max_tokens: 3000,
                                });
                                const text = fallbackRes.choices?.[0]?.message?.content;
                                if (text && text.trim().length > 0) {
                                    fullText = text.trim();
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", token: fullText })}\n\n`));
                                    break;
                                }
                            } catch (e: any) {
                                console.warn(`[AI Stream Route] Fallback model (${candidateModel}) failed:`, e?.message || e);
                            }
                        }
                    }

                    /* ── Parse full response robustly ── */
                    const parsed = parseAiResponse(fullText);
                    let answer = parsed.answer || fullText;
                    let keyPoints = parsed.keyPoints.slice(0, 7);
                    let suggestedFollowUps = parsed.suggestedFollowUps.slice(0, 4);

                    if (!answer || answer.trim().length === 0) {
                        answer = language === "ar"
                            ? "عذرًا، حدث انقطاع مؤقت في الاتصال بالشبكة الطبية. يرجى إعادة إرسال السؤال وسأجيبك فوراً."
                            : "Sorry, a temporary network glitch occurred. Please resend your question and I will answer immediately.";
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
