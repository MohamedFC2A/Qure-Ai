import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserPlan, getCreditsStatus, deductCredit } from "@/lib/creditService";
import { hasAcceptedTerms } from "@/lib/legal/terms";
import { checkGuardrails } from "@/lib/ai/guardrails";
import { buildSmartMemoryMessages } from "@/lib/ai/memory";
import { createPollinationsClient, getDeepSeekApiKey, getTextModelsToTry } from "@/lib/ai/deepseek";
import {
    type AiChatMode,
    buildContextMessage,
    buildSystemPrompt,
    generateConversationTitle,
    parseAiResponse,
    formatClinicalContext,
} from "@/lib/ai/chat";
import { getLocalDevUser, LOCAL_DEV_USER_ID } from "@/lib/devAuth";

const META_SEPARATOR = "\n---METADATA---\n";

/* ──────────────────────────────────────────────────────────
 *  POST /api/ai/chat/stream  —  Zero-Error SSE streaming chat
 * ────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();

    try {
        let authUser: any = null;
        let supabase: any = null;

        try {
            supabase = await createClient();
            const { data } = await supabase.auth.getUser();
            authUser = data?.user || null;
        } catch (authErr) {
            console.warn("[AI Stream Route] Auth retrieval note:", authErr);
        }

        const localDevUser = getLocalDevUser(req);
        const user = authUser || localDevUser;

        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized — please log in" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!localDevUser && !hasAcceptedTerms(user)) {
            return new Response(JSON.stringify({ error: "Terms acceptance required" }), {
                status: 403,
                headers: { "Content-Type": "application/json" },
            });
        }

        let body: any = {};
        try {
            body = await req.json();
        } catch {
            return new Response(JSON.stringify({ error: "Invalid JSON request payload" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const rawMode = body?.mode;
        const mode: "health" | "medication" | "context" =
            rawMode === "medication" ? "medication" : rawMode === "context" ? "context" : "health";
        const question: string | null = body?.question ? String(body.question).trim() : null;
        const language: "en" | "ar" = body?.language === "ar" ? "ar" : "en";
        const conversationId: string | null = body?.conversationId ? String(body.conversationId) : null;
        const messageHistory: Array<{ role: "user" | "assistant"; content: string }> = Array.isArray(body?.messageHistory)
            ? body.messageHistory
            : [];
        const medicationData: any = body?.medicationData || null;
        const forceLiveSearch: boolean = Boolean(body?.forceLiveSearch);

        if (!question) {
            return new Response(JSON.stringify({ error: "Question is required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Check ULTRA plan access
        const isDev = process.env.NODE_ENV === "development" || Boolean(localDevUser);
        let plan = "ultra";
        if (!isDev && supabase) {
            try {
                plan = await getUserPlan(user.id, supabase);
            } catch {
                plan = "ultra";
            }
        }

        if (plan !== "ultra" && !isDev) {
            return new Response(
                JSON.stringify({
                    error:
                        language === "ar"
                            ? "ميزة Qure AI متاحة حصرياً لمشتركي باقة ULTRA. يرجى الترقية لاستخدام المساعد الذكي."
                            : "Qure AI is available exclusively on the ULTRA plan. Please upgrade your plan to access Qure AI.",
                    requiresUltra: true,
                }),
                { status: 402, headers: { "Content-Type": "application/json" } }
            );
        }

        // Safe Credit Check
        if (!isDev && supabase) {
            try {
                const creditStatus = await getCreditsStatus(user.id, supabase);
                if (creditStatus.plan !== "ultra" && creditStatus.totalAvailable < 1) {
                    return new Response(
                        JSON.stringify({
                            error:
                                language === "ar"
                                    ? "عذراً، لقد استنفدت رصيد النقاط المتاح لك هذا الشهر. يرجى الترقية إلى باقة ULTRA."
                                    : "Sorry, you have run out of monthly AI credits. Please upgrade your plan.",
                            outOfCredits: true,
                        }),
                        { status: 402, headers: { "Content-Type": "application/json" } }
                    );
                }
                await deductCredit(user.id, 1, `qurescan_ai_chat:${mode}`, supabase);
            } catch (creditErr) {
                console.warn("[AI Stream Route] Credit deduction note:", creditErr);
            }
        }

        // 1. FAST ZERO-TOKEN GUARDRAIL CHECK
        const guard = checkGuardrails(question, language);
        if (guard.isBlocked) {
            const redirectText = guard.redirectMessage || "";
            const readable = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`));
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", token: redirectText })}\n\n`));
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                type: "done",
                                conversationId: conversationId || `guard_${Date.now()}`,
                                answer: redirectText,
                                keyPoints: [],
                                suggestedFollowUps:
                                    language === "ar"
                                        ? ["نصائح تغذية صحية", "تمارين تحسين النوم", "كيفية خفض التوتر", "مراجعة تداخل الأدوية"]
                                        : ["Healthy nutrition tips", "Sleep improvement exercises", "How to reduce stress", "Review drug interactions"],
                            })}\n\n`
                        )
                    );
                    controller.close();
                },
            });
            return new Response(readable, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache, no-transform",
                    "Connection": "keep-alive",
                },
            });
        }

        let apiKey: string = getDeepSeekApiKey();

        /* ── Fetch Profile & Context Safely ── */
        let privateProfile: any = null;
        let basicProfile: any = null;
        let medicationMemories: string[] = [];
        let recentScans: string[] = [];

        if (isDev) {
            privateProfile = {
                age: 30,
                sex: "male",
                height: "177",
                weight: "80",
                allergies: "None",
                chronic_conditions: "None",
                current_medications: "None",
            };
        } else if (supabase && user.id) {
            try {
                const careRes = await supabase
                    .from("care_private_profiles")
                    .select("age, sex, height, weight, allergies, chronic_conditions, current_medications, notes")
                    .eq("profile_id", user.id)
                    .maybeSingle();
                privateProfile = careRes?.data || null;
            } catch {}

            try {
                const basicRes = await supabase
                    .from("profiles")
                    .select("username, age, gender, height, weight")
                    .eq("id", user.id)
                    .maybeSingle();
                if (basicRes?.data) {
                    basicProfile = {
                        basic_age: basicRes.data.age,
                        basic_gender: basicRes.data.gender,
                        basic_height: basicRes.data.height,
                        basic_weight: basicRes.data.weight,
                    };
                }
            } catch {}

            try {
                const memRes = await supabase
                    .from("memories_medications")
                    .select("display_name")
                    .eq("user_id", user.id)
                    .order("last_seen_at", { ascending: false })
                    .limit(20);
                if (memRes?.data) medicationMemories = memRes.data.map((m: any) => m.display_name).filter(Boolean);
            } catch {}

            try {
                const histRes = await supabase
                    .from("medication_history")
                    .select("drug_name")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(10);
                if (histRes?.data) recentScans = histRes.data.map((h: any) => h.drug_name).filter(Boolean);
            } catch {}
        }

        const mergedProfile = {
            ...(basicProfile || {}),
            ...(privateProfile || {}),
        };

        const contextData = {
            privateProfile: Object.keys(mergedProfile).length > 0 ? mergedProfile : null,
            medicationMemories,
            recentScans,
        };

        const systemPrompt = buildSystemPrompt(mode, language);
        const deepseekMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
            { role: "system", content: systemPrompt },
        ];

        const ctxMsg = buildContextMessage(contextData, language);
        if (ctxMsg) {
            deepseekMessages.push({ role: "user", content: ctxMsg });
        }

        if (medicationData) {
            const medFormatted = formatClinicalContext(medicationData, language);
            if (medFormatted) {
                deepseekMessages.push({ role: "user", content: medFormatted });
            }
        }

        const smartHistory = buildSmartMemoryMessages(messageHistory, question);
        for (const msg of smartHistory) {
            deepseekMessages.push(msg);
        }
        deepseekMessages.push({ role: "user", content: question });

        // Autonomous Live Medical Search Tool Check (Serper Engine)
        let searchMetadata: any = null;
        let searchEvidenceText = "";
        try {
            const { shouldTriggerLiveMedicalSearch, executeAutonomousMedicalSearch } = await import("@/lib/ai/searchTool");
            if (forceLiveSearch || shouldTriggerLiveMedicalSearch(question, mode)) {
                console.log("[AI Stream] Live medical search triggered (forceLiveSearch:", forceLiveSearch, ") for query:", question);
                const searchResult = await executeAutonomousMedicalSearch({
                    query: question,
                    language,
                    maxPages: 5,
                });

                if (searchResult.performed) {
                    searchMetadata = {
                        performed: true,
                        query: searchResult.query,
                        pagesCount: searchResult.pagesCount,
                        totalSources: searchResult.totalSources,
                        sources: searchResult.sources,
                        directAnswer: searchResult.directAnswer,
                        knowledgeEntity: searchResult.knowledgeEntity,
                    };
                    searchEvidenceText = searchResult.evidenceText;

                    deepseekMessages.push({
                        role: "user",
                        content: language === "ar"
                            ? `[نتائج البحث السريري المباشر عبر الإنترنت (${searchResult.pagesCount} صفحات ومصادر طبية معتمدة)]:\n${searchResult.evidenceText}\n\nاستند إلى هذه الأدلة والمصادر السريرية المباشرة بدقة في إجابتك واستشهد بها عند اللزوم.`
                            : `[LIVE MEDICAL WEB SEARCH EVIDENCE (${searchResult.pagesCount} Verified Sources)]:\n${searchResult.evidenceText}\n\nIncorporate this fresh clinical evidence accurately in your answer.`
                    });
                }
            }
        } catch (searchErr) {
            console.warn("[AI Stream] Live search tool note:", searchErr);
        }

        deepseekMessages.push({
            role: "system",
            content:
                language === "ar"
                    ? `أجب بصيغة Markdown نظيفة ومباشرة. إذا كان السؤال يتطلب إجابة قاطعة، ابدأ بالإجابة القاطعة فوراً. عند الانتهاء تماماً، اترك سطرين واكتب:\n${META_SEPARATOR}\n{"keyPoints":["نقطة 1","نقطة 2"],"suggestedFollowUps":["سؤال 1؟","سؤال 2؟"]}`
                    : `Answer with clean, direct Markdown formatting. Give the bold verdict immediately if applicable. When completely done, leave 2 blank lines and write:\n${META_SEPARATOR}\n{"keyPoints":["point 1","point 2"],"suggestedFollowUps":["question 1?","question 2?"]}`,
        });

        const readable = new ReadableStream({
            async start(controller) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`));

                // If live search was performed, emit search status event immediately
                if (searchMetadata) {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "search_status", ...searchMetadata })}\n\n`)
                    );
                }

                let fullText = "";
                let streamWorked = false;
                const pollinations = createPollinationsClient(apiKey);
                const candidateModels = getTextModelsToTry();

                // 1. Try Streaming completions across candidate models
                for (const candidateModel of candidateModels) {
                    try {
                        const tokenStream = await pollinations.chat.completions.create({
                            model: candidateModel,
                            messages: deepseekMessages,
                            stream: true,
                            temperature: 0.2,
                            max_tokens: 2500,
                        });

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
                            if (fullText.trim().length > 0) {
                                streamWorked = true;
                                break;
                            }
                        }
                    } catch (streamErr) {
                        console.warn(`[AI Stream] Model ${candidateModel} stream note:`, streamErr);
                    }
                }

                // 2. Non-Streaming Fallback if stream was empty
                if (!streamWorked || fullText.trim().length === 0) {
                    for (const candidateModel of candidateModels) {
                        try {
                            const res = await pollinations.chat.completions.create({
                                model: candidateModel,
                                messages: deepseekMessages,
                                stream: false,
                                temperature: 0.2,
                                max_tokens: 2500,
                            });
                            const content = res.choices?.[0]?.message?.content;
                            if (content && content.trim().length > 0) {
                                fullText = content.trim();
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", token: fullText })}\n\n`));
                                break;
                            }
                        } catch (fallbackErr) {
                            console.warn(`[AI Stream] Fallback model ${candidateModel} note:`, fallbackErr);
                        }
                    }
                }

                // 3. Ultra Self-Healing Fallback if external network failed completely
                if (!fullText || fullText.trim().length === 0) {
                    const defaultMessage =
                        language === "ar"
                            ? "أهلاً بك! أنا مساعد **Qure AI** الطبي الذكي. يبدو أن هناك ضغطاً مؤقتاً على الشبكة؛ يرجى إعادة إرسال سؤالك وسأجيبك فوراً بكافة التفاصيل السريرية والدوائية المطلوبة."
                            : "Welcome! I am **Qure AI** clinical assistant. There was a temporary network congestion; please resend your query and I will assist you with full pharmaceutical analysis immediately.";
                    fullText = defaultMessage;
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "token", token: fullText })}\n\n`));
                }

                /* ── Parse full response robustly ── */
                const parsed = parseAiResponse(fullText);
                let answer = parsed.answer || fullText;
                let keyPoints = parsed.keyPoints.slice(0, 7);
                let suggestedFollowUps = parsed.suggestedFollowUps.slice(0, 4);

                if (keyPoints.length === 0) {
                    const bullets = answer
                        .split("\n")
                        .map((line) => line.replace(/^[-*•\d.]+\s*/, "").trim())
                        .filter((line) => line.length >= 10 && line.length <= 150);
                    keyPoints = bullets.slice(0, 5);
                }
                if (suggestedFollowUps.length === 0) {
                    suggestedFollowUps =
                        language === "ar"
                            ? ["ما هي الآثار الجانبية الشائعة؟", "هل يتداخل مع أدوية أخرى؟", "ما هي الجرعة اليومية الموصى بها؟", "متى يجب استشارة الطبيب؟"]
                            : ["What are common side effects?", "Does it interact with other medications?", "What is the recommended dosage?", "When should I consult a doctor?"];
                }

                /* ── DB Persistence (Safe & Resilient) ── */
                let activeConversationId = conversationId;
                const effectiveUserId = user?.id || LOCAL_DEV_USER_ID;

                try {
                    const adminDb = createAdminClient() || supabase;
                    if (adminDb && effectiveUserId) {
                        if (!activeConversationId) {
                            const title = generateConversationTitle(question, language);
                            const convResult = await adminDb
                                .from("ai_conversations")
                                .insert({
                                    user_id: effectiveUserId,
                                    mode,
                                    title,
                                    metadata: mode === "medication" && medicationData ? { medicationName: medicationData.drugName || null } : {},
                                })
                                .select("id")
                                .maybeSingle();
                            if (convResult?.data?.id) activeConversationId = convResult.data.id;
                        }
                        if (activeConversationId) {
                            await adminDb.from("ai_messages").insert([
                                {
                                    conversation_id: activeConversationId,
                                    role: "user",
                                    content: question,
                                    metadata: { mode },
                                },
                                {
                                    conversation_id: activeConversationId,
                                    role: "assistant",
                                    content: answer,
                                    metadata: { mode, keyPoints, suggestedFollowUps },
                                },
                            ]);
                        }
                    }
                } catch (dbErr) {
                    console.warn("[AI Stream Route] DB save note:", dbErr);
                }

                /* ── Send done event ── */
                controller.enqueue(
                    encoder.encode(
                        `data: ${JSON.stringify({
                            type: "done",
                            conversationId: activeConversationId || `conv_${Date.now()}`,
                            answer,
                            keyPoints,
                            suggestedFollowUps,
                            searchMetadata,
                        })}\n\n`
                    )
                );

                controller.close();
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
        console.error("[AI Stream Route] Caught unhandled route error:", error);
        return new Response(JSON.stringify({ error: error?.message || "Stream initialization error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
