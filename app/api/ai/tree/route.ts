import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { getUserPlan } from "@/lib/creditService";
import { hasAcceptedTerms } from "@/lib/legal/terms";

type PresetId = "alternative" | "personalized" | "history";

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

        if (!process.env.DEEPSEEK_API_KEY) {
            return NextResponse.json({ error: "Server configuration error: DEEPSEEK_API_KEY is missing." }, { status: 503 });
        }

        const deepseek = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: "https://api.deepseek.com",
        });

        const systemLanguageRule =
            language === "ar"
                ? "اكتب كل الإجابة باللغة العربية (فصحى). مفاتيح JSON بالإنجليزية."
                : "Write the full answer in English. JSON keys in English.";

        const rootQuestion = question || presetToQuestion(preset, language);
        const analysisJson = JSON.stringify(analysis);

        // Merge legacy privateProfile with new userProfile passed from client
        const mergedProfile = { ...privateProfile, ...userProfile };

        const contextJson = JSON.stringify({
            userProfile: mergedProfile,
            medicationMemories: medicationMemories.map((m) => m.display_name).filter(Boolean),
            recentHistory: recentHistory.map((h) => h.drug_name).filter(Boolean),
        });
        const pathJson = JSON.stringify(path);

        const prompt = `
You are an expert clinical pharmacist assistant.

${systemLanguageRule}

IMPORTANT:
- Output VALID JSON ONLY. No markdown. No code fences.
- Keep it concise but high-signal.
- If you are uncertain, say so explicitly and suggest what to verify with a pharmacist/doctor.
- Do not invent allergies/conditions/meds. Use only the provided context.

Return JSON with this schema:
{
  "title": "Short title",
  "answer": "Short structured answer (paragraphs allowed)",
  "keyPoints": ["3-6 bullet points"],
  "nextQuestions": [
    { "id": "q1", "title": "Short title", "question": "The next question to ask" }
  ]
}

MEDICATION_ANALYSIS_JSON:
${analysisJson}

PATIENT_CONTEXT_JSON (may be empty/null fields):
${contextJson}

TREE_PATH_JSON (previous Q/A nodes, may be empty):
${pathJson}

USER_QUESTION:
${rootQuestion}
`;

        const response = await deepseek.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: "You are a medical analysis assistant. Output valid JSON only." },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const content = response.choices[0].message.content;
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

        return NextResponse.json({
            ...parsed,
            meta: { plan, subjectProfileId, subjectProfileName: subjectProfile?.display_name ?? null },
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
