import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/creditService";
import { hasAcceptedTerms } from "@/lib/legal/terms";
import { DEEPSEEK_BASE_URL, getDeepSeekApiKey, getDeepSeekModel } from "@/lib/ai/deepseek";
import { checkGuardrails } from "@/lib/ai/guardrails";

type PresetId = "alternative" | "personalized" | "history" | "suggestions";

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

function presetToQuestion(preset: PresetId, language: "en" | "ar") {
    const isAr = language === "ar";
    switch (preset) {
        case "alternative":
            return isAr
                ? "اقترح بدائل محتملة لهذا الدواء لنفس الاستخدامات (بدائل بالاسم العلمي/التركيبة إن أمكن). اذكر متى يكون البديل غير مناسب."
                : "Suggest potential alternatives for this medication for the same indications (prefer generic/active ingredient alternatives). Mention when an alternative is not appropriate.";
        case "personalized":
            return isAr
                ? "حلّل هذا الدواء بالنسبة لبياناتي الصحية (الحساسية/الأمراض المزمنة/الأدوية الحالية) وقدّم تحذيرات وتوصيات مخصصة."
                : "Analyze this medication against my health profile (allergies/conditions/current meds) and give personalized warnings and recommendations.";
        case "history":
            return isAr
                ? "افحص هذا الدواء مقارنةً بسجل أدويتي/ذاكرتي الدوائية، واذكر أهم التداخلات أو التعارضات المحتملة وكيف أتجنبها."
                : "Check this medication against my medication history/memories and list the most important potential interactions or conflicts and how to avoid them.";
        case "suggestions":
            return isAr
                ? "أنشئ 4 أسئلة قصيرة جدًا ومهمة يتوقع أن يسألها المستخدم عن هذا الدواء (جرعة/تداخلات/أعراض/متى أطلب مساعدة). اجعل كل سؤال عمليًا وواضحًا."
                : "Generate 4 short, high-value questions a user is likely to ask about this medication (dose/interactions/side effects/when to seek help). Make them practical and clear.";
    }
}

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
        const preset = String(body?.preset || "") as PresetId;
        const language: "en" | "ar" = body?.language === "ar" ? "ar" : "en";
        const analysis = body?.analysis;
        const question = body?.question ? String(body.question) : null;
        const path = Array.isArray(body?.path) ? body.path : [];
        const userProfile = body?.userProfile || null;
        const requestedProfileId = typeof body?.profileId === "string" ? String(body.profileId) : null;

        if (!analysis || typeof analysis !== "object" || !analysis.drugName) {
            return NextResponse.json({ error: "Missing analysis payload" }, { status: 400 });
        }

        if (!preset && !question) {
            return NextResponse.json({ error: "Missing preset/question" }, { status: 400 });
        }

        const plan = await getUserPlan(user.id, supabase);
        const isUltra = plan === "ultra";

        if (!isUltra) {
            return NextResponse.json({ error: "Ultra plan required" }, { status: 402 });
        }

        // Resolve subject profile for Family/Caregiver Mode (Ultra)
        let subjectProfileId = requestedProfileId || user.id;
        let subjectProfile: any = null;
        const subjectRes = await supabase
            .from("care_profiles")
            .select("id, display_name, relationship")
            .eq("id", subjectProfileId)
            .eq("owner_user_id", user.id)
            .maybeSingle();

        if (subjectRes.data) {
            subjectProfile = subjectRes.data;
        } else {
            subjectProfileId = user.id;
            const fallbackRes = await supabase
                .from("care_profiles")
                .select("id, display_name, relationship")
                .eq("id", subjectProfileId)
                .eq("owner_user_id", user.id)
                .maybeSingle();
            subjectProfile = fallbackRes.data || { id: user.id, display_name: "Me", relationship: "self" };
        }

        // Load PRO-only context (RLS will enforce Ultra access via policies)
        let privateProfile: any = null;
        let medicationMemories: any[] = [];
        let recentHistory: any[] = [];

        if (isUltra) {
            const carePrivateRes = await supabase
                .from("care_private_profiles")
                .select("age, sex, height, weight, allergies, chronic_conditions, current_medications, notes")
                .eq("profile_id", subjectProfileId)
                .maybeSingle();

            privateProfile = carePrivateRes.data || null;

            // Legacy fallback for self (before Family Mode migration)
            if (!privateProfile && subjectProfileId === user.id) {
                const { data: legacy } = await supabase
                    .from("user_private_profile")
                    .select("age, sex, weight, allergies, chronic_conditions, current_medications, notes")
                    .eq("user_id", user.id)
                    .maybeSingle();
                privateProfile = legacy || null;
            }

            privateProfile = {
                ...(privateProfile || {}),
                profile_id: subjectProfileId,
                display_name: subjectProfile?.display_name ?? null,
                relationship: subjectProfile?.relationship ?? null,
            };

            let memoriesRes = await supabase
                .from("memories_medications")
                .select("display_name, count, last_seen_at")
                .eq("user_id", user.id)
                .eq("profile_id", subjectProfileId)
                .order("last_seen_at", { ascending: false })
                .limit(25);

            if (memoriesRes.error && String(memoriesRes.error.message || "").toLowerCase().includes("profile_id")) {
                memoriesRes = await supabase
                    .from("memories_medications")
                    .select("display_name, count, last_seen_at")
                    .eq("user_id", user.id)
                    .order("last_seen_at", { ascending: false })
                    .limit(25);
            }

            medicationMemories = memoriesRes.data || [];

            let historyRes: any = await supabase
                .from("medication_history")
                .select("drug_name, created_at, profile_id")
                .eq("user_id", user.id)
                .eq("profile_id", subjectProfileId)
                .order("created_at", { ascending: false })
                .limit(25);

            if (historyRes.error && String(historyRes.error.message || "").toLowerCase().includes("profile_id")) {
                historyRes = await supabase
                    .from("medication_history")
                    .select("drug_name, created_at")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(25);
            }

            recentHistory = historyRes.data || [];
        }

        const apiKey = getDeepSeekApiKey();
        if (!apiKey) {
            return NextResponse.json({ error: "Server configuration error: DEEPSEEK_API_KEY is missing." }, { status: 503 });
        }

        const rootQuestion = question || presetToQuestion(preset, language);

        // Fast zero-token guardrail check
        const guard = checkGuardrails(rootQuestion, language);
        if (guard.isBlocked) {
            return NextResponse.json({
                title: language === "ar" ? "تنبيه النظام" : "System Alert",
                summary: guard.redirectMessage,
                answer: guard.redirectMessage,
                keyPoints: [],
                nextQuestions: [],
                meta: { plan, subjectProfileId },
                serverDurationMs: Date.now() - startTime,
            });
        }

        const systemLanguageRule =
            language === "ar"
                ? "اكتب كل الإجابة باللغة العربية (فصحى). مفاتيح JSON بالإنجليزية."
                : "Write the full answer in English. JSON keys in English.";

        // Compact Analysis Payload (95% token savings)
        const compactAnalysis = {
            drugName: analysis.drugName || analysis.drugNameEn || "Medication",
            genericName: analysis.genericName || analysis.genericNameEn || "",
            activeIngredients: Array.isArray(analysis.activeIngredients) ? analysis.activeIngredients.slice(0, 5) : [],
            category: analysis.productCategoryLabel || analysis.category || "",
            dosageForm: analysis.dosageForm || analysis.form || "",
        };
        const analysisJson = JSON.stringify(compactAnalysis);

        const normalizedQuestion = String(rootQuestion || "").trim().toLowerCase();
        const isDeveloperQuestion =
            normalizedQuestion.includes("مين طورك") ||
            normalizedQuestion.includes("من طورك") ||
            normalizedQuestion.includes("مين صممك") ||
            normalizedQuestion.includes("من صممك") ||
            normalizedQuestion.includes("من صنعك") ||
            normalizedQuestion.includes("who developed you") ||
            normalizedQuestion.includes("who built you") ||
            normalizedQuestion.includes("who made you");

        if (isDeveloperQuestion) {
            const answer =
                language === "ar"
                    ? "تم تطويري بواسطة شركة MATANY AI (MatanyLabs)."
                    : "Developed by MATANY AI (MatanyLabs).";
            return NextResponse.json({
                title: language === "ar" ? "من طوّرني؟" : "Who developed me?",
                summary: answer,
                answer,
                keyPoints: [],
                nextQuestions: [],
                meta: {
                    plan,
                    subjectProfileId,
                    subjectProfileName: subjectProfile?.display_name ?? null,
                    subjectRelationship: subjectProfile?.relationship ?? null,
                },
                serverDurationMs: Date.now() - startTime,
            });
        }

        // Compact Profile Context
        const mergedProfile =
            subjectProfileId === user.id
                ? { ...(userProfile || {}), ...(privateProfile || {}) }
                : (privateProfile || null);

        const contextJson = JSON.stringify({
            allergies: mergedProfile?.allergies || null,
            conditions: mergedProfile?.chronic_conditions || null,
            currentMeds: mergedProfile?.current_medications || null,
        });

        // Compact Tree Path (last 2 nodes only)
        const compactPath = path.slice(-2).map((node: any) => ({
            question: node.question ? String(node.question).slice(0, 100) : "",
            summary: node.summary ? String(node.summary).slice(0, 150) : "",
        }));
        const pathJson = JSON.stringify(compactPath);

        // 100% Static System Prompt for DeepSeek Context Caching
        const staticSystemPrompt = `You are MATANY AI, an expert clinical pharmacist assistant.
Analyze the user's question about the medication using the provided clinical summary and profile.

${systemLanguageRule}

IMPORTANT CLINICAL GUIDELINES:
- Output VALID JSON ONLY. No markdown wrapper blocks.
- Provide concise, high-quality clinical advice.
- Use Markdown formatting (bolding key words with **) in the "answer" field.
- Keep summary (TL;DR) to one sentence.

Return JSON schema:
{
  "title": "Short title describing topic",
  "summary": "One-sentence TL;DR",
  "answer": "Concise medical explanation in Markdown",
  "keyPoints": ["3-5 actionable takeaways"],
  "nextQuestions": [
    { "id": "q1", "title": "Short title", "question": "Follow-up question" }
  ]
}

NEXT QUESTIONS RULES:
- Provide EXACTLY 4 items.
- Keep titles ultra-short.`;

        const userPayload = `
MEDICATION_SUMMARY_JSON:
${analysisJson}

PATIENT_CONTEXT_JSON:
${contextJson}

RECENT_PATH_NODES:
${pathJson}

USER_QUESTION:
${rootQuestion}
`;

        let content: string | null = null;
        try {
            const deepseek = new OpenAI({
                apiKey: apiKey,
                baseURL: DEEPSEEK_BASE_URL,
            });
            const response = await deepseek.chat.completions.create({
                model: getDeepSeekModel(),
                messages: [
                    { role: "system", content: staticSystemPrompt },
                    { role: "user", content: userPayload },
                ],
                response_format: { type: "json_object" },
                temperature: 0.15,
                max_tokens: 400,
            });
            content = response.choices[0]?.message?.content || null;
        } catch (dsErr: any) {
            console.warn("[AI Tree API] DeepSeek failed, switching to Gemini Flash fallback:", dsErr?.message || dsErr);
            const geminiKey = process.env.GEMINI_API_KEY;
            if (geminiKey) {
                try {
                    const genAI = new GoogleGenerativeAI(geminiKey);
                    const modelName = process.env.GEMINI_OCR_MODEL || "gemini-2.5-flash-lite";
                    const model = genAI.getGenerativeModel({
                        model: modelName,
                        generationConfig: { responseMimeType: "application/json", temperature: 0.15 }
                    });
                    const res = await model.generateContent(`${staticSystemPrompt}\n\n${userPayload}`);
                    content = res.response.text();
                } catch (gErr) {
                    console.error("[AI Tree API] Gemini fallback failed:", gErr);
                }
            }
        }

        if (!content) {
            return NextResponse.json({ error: "No AI response" }, { status: 502 });
        }

        const candidate = fixInvalidJsonEscapes(extractJsonCandidate(content));
        let parsed: any;
        try {
            parsed = JSON.parse(candidate);
        } catch (e: any) {
            console.error("AI follow-up JSON parse failed:", candidate);
            return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 502 });
        }

        const clampText = (value: unknown, maxLen: number) => {
            const s = String(value ?? "").trim();
            if (!s) return "";
            if (s.length <= maxLen) return s;
            const cut = s.slice(0, maxLen);
            const lastStop = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("؟"), cut.lastIndexOf("?"), cut.lastIndexOf("!"), cut.lastIndexOf("۔"));
            return (lastStop > maxLen * 0.7 ? cut.slice(0, lastStop + 1) : cut).trim() + "…";
        };

        const safeTitle = clampText(parsed?.title, 80) || (language === "ar" ? "إجابة طبية" : "Medical answer");
        const safeSummary = clampText(parsed?.summary, 180) || "";
        const safeAnswer = clampText(parsed?.answer, 1800) || "";
        const safeKeyPoints = (Array.isArray(parsed?.keyPoints) ? parsed.keyPoints : [])
            .map((s: any) => clampText(s, 140))
            .filter(Boolean)
            .slice(0, 7);

        const rawNext = Array.isArray(parsed?.nextQuestions) ? parsed.nextQuestions : [];
        const nextQuestions = rawNext
            .map((q: any, idx: number) => ({
                id: clampText(q?.id, 24) || `q${idx + 1}`,
                title: clampText(q?.title, 40) || (language === "ar" ? "سؤال" : "Question"),
                question: clampText(q?.question, 160) || "",
            }))
            .filter((q: any) => q.question)
            .slice(0, 4);

        const defaultNext = language === "ar"
            ? [
                { id: "q1", title: "الجرعة", question: "ما هي الجرعة الصحيحة وكيف أتناوله بأمان؟" },
                { id: "q2", title: "تداخلات", question: "ما أهم التداخلات الدوائية/الغذائية التي يجب تجنبها؟" },
                { id: "q3", title: "أعراض", question: "ما الأعراض الجانبية الشائعة والخطيرة ومتى أقلق؟" },
                { id: "q4", title: "مساعدة", question: "متى يجب طلب المساعدة الطبية فورًا؟" },
            ]
            : [
                { id: "q1", title: "Dose", question: "What is the correct dose and how should I take it safely?" },
                { id: "q2", title: "Interactions", question: "What key drug/food interactions should I avoid?" },
                { id: "q3", title: "Side effects", question: "What common and serious side effects should I watch for?" },
                { id: "q4", title: "Seek help", question: "When should I seek urgent medical help?" },
            ];

        const filledNext = nextQuestions.length === 4 ? nextQuestions : defaultNext;

        return NextResponse.json({
            title: safeTitle,
            summary: safeSummary,
            answer: safeAnswer,
            keyPoints: safeKeyPoints,
            nextQuestions: filledNext,
            meta: {
                plan,
                subjectProfileId,
                subjectProfileName: subjectProfile?.display_name ?? null,
                subjectRelationship: subjectProfile?.relationship ?? null,
            },
            serverDurationMs: Date.now() - startTime,
        });
    } catch (error: any) {
        console.error("AI Tree Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
