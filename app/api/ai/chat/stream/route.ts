import { NextRequest } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { hasAcceptedTerms } from "@/lib/legal/terms";
import { DEEPSEEK_BASE_URL, DEEPSEEK_MODEL } from "@/lib/ai/deepseek";
import { type AiChatMode, buildSystemPrompt, generateConversationTitle } from "@/lib/ai/chat";

const META_SEPARATOR = "\n---METADATA---\n";

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

        if (!mode || !["health", "medication", "context"].includes(mode)) {
            return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        if (!question) {
            return new Response(JSON.stringify({ error: "Question is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        if (!process.env.DEEPSEEK_API_KEY) {
            return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 503, headers: { "Content-Type": "application/json" } });
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

        const systemPrompt = buildSystemPrompt(mode, language, contextData);

        const deepseekMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: systemPrompt },
        ];

        if (mode === "medication" && medicationData) {
            deepseekMessages.push({
                role: "system",
                content: `The user is asking about this specific medication:\n${JSON.stringify(medicationData, null, 2).slice(0, 4000)}`,
            });
        }

        for (const msg of messageHistory.slice(-20)) {
            deepseekMessages.push({ role: msg.role as "user" | "assistant", content: msg.content });
        }
        deepseekMessages.push({ role: "user", content: question });

        // Add output format instruction
        deepseekMessages.push({
            role: "system",
            content: language === "ar"
                ? `أجب بصيغة Markdown نظيفة ومفصلة. عند الانتهاء تماماً من الإجابة، اكتب هذا بالضبط:\n\n---METADATA---\n\nثم JSON بهذا الشكل (بدون أي code fences):\n{"keyPoints":["نقطة 1","نقطة 2","نقطة 3"],"suggestedFollowUps":["سؤال 1؟","سؤال 2؟","سؤال 3؟","سؤال 4؟"]}\n\nمهم: لا تستخدم \`\`\`json. فقط JSON عادي بعد الفاصل.`
                : `Answer with clean, detailed Markdown formatting. When completely done with the answer, write exactly:\n\n---METADATA---\n\nThen JSON in this format (NO code fences):\n{"keyPoints":["point 1","point 2","point 3"],"suggestedFollowUps":["question 1?","question 2?","question 3?","question 4?"]}\n\nImportant: Do NOT use \`\`\`json. Just plain JSON after the separator.`,
        });

        const deepseek = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL: DEEPSEEK_BASE_URL });

        /* ── Streaming call (text mode, not json_object) ── */
        const stream = await deepseek.chat.completions.create({
            model: DEEPSEEK_MODEL,
            messages: deepseekMessages,
            stream: true,
            temperature: 0.2,
            max_tokens: 2048,
        });

        const encoder = new TextEncoder();
        let fullText = "";

        const readable = new ReadableStream({
            async start(controller) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`));

                try {
                    for await (const chunk of stream) {
                        const token = chunk.choices?.[0]?.delta?.content || "";
                        if (token) {
                            fullText += token;
                            const sepIdx = fullText.indexOf(META_SEPARATOR);
                            if (sepIdx === -1) {
                                // Still in answer section — stream token to client
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", token })}\n\n`));
                            }
                            // Once separator found, tokens accumulate silently (metadata)
                        }
                    }

                    /* ── Parse full response ── */
                    const sepIdx = fullText.indexOf(META_SEPARATOR);
                    let answer: string;
                    let keyPoints: string[] = [];
                    let suggestedFollowUps: string[] = [];

                    if (sepIdx !== -1) {
                        answer = fullText.slice(0, sepIdx).trim();
                        const metaRaw = fullText.slice(sepIdx + META_SEPARATOR.length).trim();
                        try {
                            const jsonMatch = metaRaw.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                const parsed = JSON.parse(jsonMatch[0]);
                                keyPoints = (Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [])
                                    .map((s: any) => String(s).trim()).filter(Boolean).slice(0, 7);
                                suggestedFollowUps = (Array.isArray(parsed.suggestedFollowUps) ? parsed.suggestedFollowUps : [])
                                    .map((s: any) => String(s).trim()).filter(Boolean).slice(0, 4);
                            }
                        } catch { /* metadata parse fails gracefully */ }
                    } else {
                        // No separator found — use full text, strip any trailing JSON
                        answer = fullText
                            .replace(/```json[\s\S]*$/g, "")
                            .replace(/\{"keyPoints"[\s\S]*$/g, "")
                            .trim();
                    }

                    if (!answer) {
                        answer = language === "ar" ? "عذرًا، لم أتمكن من توليد إجابة." : "Sorry, I couldn't generate an answer.";
                    }

                    /* ── Fallback: quick metadata extraction if missing ── */
                    if (keyPoints.length === 0 || suggestedFollowUps.length === 0) {
                        try {
                            const metaRes = await deepseek.chat.completions.create({
                                model: DEEPSEEK_MODEL,
                                messages: [
                                    { role: "system", content: "Extract metadata from medical answers. Output VALID JSON only." },
                                    {
                                        role: "user",
                                        content: `From this answer, extract key points and follow-up questions.\n\nAnswer:\n${answer.slice(0, 3000)}\n\nReturn JSON:\n{"keyPoints":["3-5 concise items"],"suggestedFollowUps":["4 short questions"]}`,
                                    },
                                ],
                                response_format: { type: "json_object" },
                                temperature: 0.1,
                                max_tokens: 500,
                            });
                            const metaContent = metaRes.choices?.[0]?.message?.content;
                            if (metaContent) {
                                const parsed = JSON.parse(metaContent);
                                if (keyPoints.length === 0) keyPoints = (parsed.keyPoints || []).slice(0, 7);
                                if (suggestedFollowUps.length === 0) suggestedFollowUps = (parsed.suggestedFollowUps || []).slice(0, 4);
                            }
                        } catch { /* fallback fails gracefully */ }
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
