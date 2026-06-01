import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/creditService";
import { hasAcceptedTerms } from "@/lib/legal/terms";
import { DEEPSEEK_BASE_URL, DEEPSEEK_MODEL } from "@/lib/ai/deepseek";
import { type AiChatMode, buildSystemPrompt, generateConversationTitle } from "@/lib/ai/chat";

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
    return jsonText.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, "\\\\");
}

function clampText(value: unknown, maxLen: number): string {
    const s = String(value ?? "").trim();
    if (!s) return "";
    if (s.length <= maxLen) return s;
    const cut = s.slice(0, maxLen);
    const lastStop = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("؟"), cut.lastIndexOf("?"), cut.lastIndexOf("!"));
    return (lastStop > maxLen * 0.7 ? cut.slice(0, lastStop + 1) : cut).trim() + "…";
}

/* ──────────────────────────────────────────────────────────
 *  POST /api/ai/chat
 * ────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
    const startTime = Date.now();
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

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

        // Check DeepSeek API key
        if (!process.env.DEEPSEEK_API_KEY) {
            return NextResponse.json({ error: "Server configuration error: DEEPSEEK_API_KEY is missing." }, { status: 503 });
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

        // Build system prompt
        const systemPrompt = buildSystemPrompt(mode, language, contextData);

        // Build message array for DeepSeek
        const deepseekMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: systemPrompt },
        ];

        // Add medication context if provided (for medication mode)
        if (mode === "medication" && medicationData) {
            deepseekMessages.push({
                role: "system",
                content: `The user is asking about this specific medication:\n${JSON.stringify(medicationData, null, 2).slice(0, 4000)}`,
            });
        }

        // Add conversation history
        for (const msg of messageHistory.slice(-20)) { // limit to last 20 messages
            deepseekMessages.push({
                role: msg.role as "user" | "assistant",
                content: msg.content,
            });
        }

        // Add current question
        deepseekMessages.push({ role: "user", content: question });

        const deepseek = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: DEEPSEEK_BASE_URL,
        });

        const response = await deepseek.chat.completions.create({
            model: DEEPSEEK_MODEL,
            messages: deepseekMessages,
            response_format: { type: "json_object" },
            temperature: 0.15,
        });

        const content = response.choices[0].message.content;
        if (!content) {
            return NextResponse.json({ error: "No AI response" }, { status: 502 });
        }

        const candidate = fixInvalidJsonEscapes(extractJsonCandidate(content));
        let parsed: any;
        try {
            parsed = JSON.parse(candidate);
        } catch {
            console.error("AI Chat JSON parse failed:", candidate.slice(0, 500));
            return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 });
        }

        const answer = clampText(parsed?.answer, 4000) || (language === "ar" ? "عذرًا، لم أتمكن من توليد إجابة." : "Sorry, I couldn't generate an answer.");
        const keyPoints = (Array.isArray(parsed?.keyPoints) ? parsed.keyPoints : [])
            .map((s: any) => clampText(s, 200))
            .filter(Boolean)
            .slice(0, 7);

        const rawFollowUps = Array.isArray(parsed?.suggestedFollowUps) ? parsed.suggestedFollowUps : [];
        const suggestedFollowUps = rawFollowUps
            .map((s: any) => clampText(s, 160))
            .filter(Boolean)
            .slice(0, 4);

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
