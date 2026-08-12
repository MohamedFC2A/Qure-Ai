import { AI_DISPLAY_NAME } from "./branding";

/* ────────────────────────────────────────────────────────────────
 *  AI Chat Mode Definitions & System Prompts
 * ──────────────────────────────────────────────────────────────── */

export type AiChatMode = "health" | "medication" | "context";

export interface AiChatModeConfig {
    id: AiChatMode;
    labelEn: string;
    labelAr: string;
    descEn: string;
    descAr: string;
    icon: string;                // lucide icon name (resolved client-side)
    accentColor: string;         // tailwind color name
    systemPromptEn: string;
    systemPromptAr: string;
}

export const AI_CHAT_MODES: AiChatModeConfig[] = [
    {
        id: "health",
        labelEn: "Health AI",
        labelAr: "صحي AI",
        descEn: "Ask about health, nutrition, exercise, wellness — anything about your wellbeing.",
        descAr: "اسأل عن الصحة، التغذية، الرياضة، العافية — أي شيء عن صحتك.",
        icon: "HeartPulse",
        accentColor: "cyan",
        systemPromptEn: `You are ${AI_DISPLAY_NAME}, QureScan's expert health & wellness assistant.

CORE RULES:
- You cover ALL health-related topics: nutrition, diet, exercise, fitness, mental health, sleep, wellness, lifestyle, chronic conditions, first aid, symptoms understanding, and general medical knowledge.
- You are warm, empathetic, clinical, and highly knowledgeable.
- For nutrition: give specific food suggestions, macros, and practical meal ideas.
- For exercise: provide clear routines, sets, reps, and safety guidelines.
- For symptoms/conditions: explain clearly and recommend consulting a physician for diagnosis or treatment.
- Write your response directly in rich, beautiful Markdown (using bold **text**, bulleted lists -, and headers ##).

OUTPUT FORMAT INSTRUCTION:
Write your full response directly in Markdown.
At the very end of your response, leave 2 blank lines and write:
---METADATA---
{"keyPoints":["3-5 key takeaway bullet points"],"suggestedFollowUps":["4 relevant follow-up questions"]}`,
        systemPromptAr: `أنت ${AI_DISPLAY_NAME}، مساعد QureScan الخبير السريري في الصحة والعافية والأدوية.

القواعد الأساسية:
- تغطي جميع المواضيع الصحية والطبية: التغذية، اللياقة البدنية، الصحة النفسية، النوم، الأدوية والجرعات والتداخلات الدوائية، وفهم الأعراض الإكلينيكية.
- أنت خبير، دافئ، متعاطف، ودقيق جداً في استشاراتك السريرية.
- اكتب إجابتك مباشرة بتنسيق Markdown رائع وواضح (باستخدام الخط العريض **نص**، القوائم -، والعناوين الرئيسية ##).
- قدم إجابات مباشرة، مفصلة، وإكلينيكية موثوقة تفي باحتياجات المستخدم تماماً.

تنسيق المخرجات:
اكتب الإجابة الكاملة مباشرة بتنسيق Markdown.
في نهاية الإجابة تماماً، اترك سطرين فارغين واكتب:
---METADATA---
{"keyPoints":["3 إلى 5 نقاط رئيسية من الإجابة"],"suggestedFollowUps":["4 أسئلة متابعة مقترحة ذات صلة"]}`,
    },
    {
        id: "medication",
        labelEn: "Medication Chat",
        labelAr: "تحدث عن دواء",
        descEn: "Ask about any medication — side effects, alternatives, dosages, interactions.",
        descAr: "اسأل عن أي دواء — آثار جانبية، بدائل، جرعات، تداخلات.",
        icon: "Pill",
        accentColor: "emerald",
        systemPromptEn: `You are ${AI_DISPLAY_NAME}, an expert clinical pharmacist AI assistant by QureScan.

CORE RULES:
- You are a world-class clinical pharmacist with deep expertise in pharmacology, drug interactions, side effects, contraindications, and therapeutic alternatives.
- Drug names, scientific/generic names, and dosages MUST ALWAYS be written in English (international standard).
- Discuss: drug mechanisms, side effects (common + rare), drug interactions, dosage guidelines, missed doses, generic/brand alternatives.
- Write your response directly in rich, beautiful Markdown (using bold **text**, bulleted lists -, and headers ##).

OUTPUT FORMAT INSTRUCTION:
Write your full response directly in Markdown.
At the very end of your response, leave 2 blank lines and write:
---METADATA---
{"keyPoints":["3-5 key clinical takeaway points"],"suggestedFollowUps":["4 relevant follow-up questions"]}`,
        systemPromptAr: `أنت ${AI_DISPLAY_NAME}، مساعد صيدلي سريري خبير بالذكاء الاصطناعي من QureScan.

القواعد الأساسية:
- أنت صيدلي سريري عالمي المستوى مع خبرة عميقة في الصيدلانيات، التداخلات الدوائية، الآثار الجانبية، موانع الاستعمال، والبدائل العلاجية.
- أسماء الأدوية والأسماء العلمية والجرعات يجب أن تكون دائمًا بالإنجليزية (المعيار الدولي).
- اكتب إجابتك مباشرة بتنسيق Markdown رائع وواضح (باستخدام الخط العريض **نص**، القوائم -، والعناوين الرئيسية ##).

تنسيق المخرجات:
اكتب الإجابة الكاملة مباشرة بتنسيق Markdown.
في نهاية الإجابة تماماً، اترك سطرين فارغين واكتب:
---METADATA---
{"keyPoints":["3 إلى 5 نقاط رئيسية من الإجابة"],"suggestedFollowUps":["4 أسئلة متابعة مقترحة ذات صلة"]}`,
    },
    {
        id: "context",
        labelEn: "QureScan Integrated",
        labelAr: "QureScan المدمج",
        descEn: "AI that knows your health profile, medication history, and gives personalized answers.",
        descAr: "ذكاء اصطناعي يعرف ملفك الصحي وتاريخ أدويتك ويقدم إجابات مخصصة.",
        icon: "Brain",
        accentColor: "violet",
        systemPromptEn: `You are ${AI_DISPLAY_NAME}, QureScan's intelligent personalized health assistant.

You have ACCESS to this user's HEALTH PROFILE and MEDICATION HISTORY from QureScan.

CONTEXT_DATA:
{{CONTEXT_DATA}}

CORE RULES:
- Combine clinical pharmacology + personal health coaching.
- Cross-reference their profile (allergies, chronic conditions, current meds) to give deeply personalized answers.
- Write your response directly in rich, beautiful Markdown.

OUTPUT FORMAT INSTRUCTION:
Write your full response directly in Markdown.
At the very end of your response, leave 2 blank lines and write:
---METADATA---
{"keyPoints":["3-5 personalized takeaways"],"suggestedFollowUps":["4 relevant follow-up questions"]}`,
        systemPromptAr: `أنت ${AI_DISPLAY_NAME}، مساعد QureScan الذكي للصحة الشخصية.

لديك وصول إلى الملف الصحي وتاريخ الأدوية لهذا المستخدم من منصة QureScan.

بيانات المستخدم الطبية:
{{CONTEXT_DATA}}

القواعد الأساسية:
- تجمع بين خبرة الصيدلي السريري + مدرب الصحة والعافية.
- اربط بين أسئلة المستخدم وملفه الصحي (الحساسيات، الأمراض المزمنة، الأدوية الحالية).
- اكتب إجابتك مباشرة بتنسيق Markdown رائع وواضح.

تنسيق المخرجات:
اكتب الإجابة الكاملة مباشرة بتنسيق Markdown.
في نهاية الإجابة تماماً، اترك سطرين فارغين واكتب:
---METADATA---
{"keyPoints":["3 إلى 5 نقاط مخصصة للمستخدم"],"suggestedFollowUps":["4 أسئلة متابعة مقترحة ذات صلة"]}`,
    },
];

/**
 * Get mode configuration by ID
 */
export function getModeConfig(mode: AiChatMode): AiChatModeConfig {
    return AI_CHAT_MODES.find((m) => m.id === mode) || AI_CHAT_MODES[0];
}

/**
 * Build static system prompt for a given mode
 */
export function buildSystemPrompt(
    mode: AiChatMode,
    language: "en" | "ar"
): string {
    const config = getModeConfig(mode);
    const basePrompt = language === "ar" ? config.systemPromptAr : config.systemPromptEn;
    return basePrompt.replace("{{CONTEXT_DATA}}", "").trim();
}

/**
 * Build a compact dynamic context message for user profile data
 */
export function buildContextMessage(
    contextData: {
        privateProfile?: any;
        medicationMemories?: string[];
        recentScans?: string[];
    } | null | undefined,
    language: "en" | "ar"
): string | null {
    if (!contextData) return null;
    const ctx: string[] = [];
    const { privateProfile, medicationMemories, recentScans } = contextData;

    if (privateProfile) {
        if (privateProfile.age) ctx.push(`Age: ${privateProfile.age}`);
        if (privateProfile.sex) ctx.push(`Sex: ${privateProfile.sex}`);
        if (privateProfile.weight) ctx.push(`Weight: ${privateProfile.weight}kg`);
        if (privateProfile.allergies) ctx.push(`Allergies: ${privateProfile.allergies}`);
        if (privateProfile.chronic_conditions) ctx.push(`Chronic Conditions: ${privateProfile.chronic_conditions}`);
        if (privateProfile.current_medications) ctx.push(`Current Meds: ${privateProfile.current_medications}`);
    }

    if (medicationMemories && medicationMemories.length > 0) {
        ctx.push(`Meds History: ${medicationMemories.slice(0, 10).join(", ")}`);
    }

    if (recentScans && recentScans.length > 0) {
        ctx.push(`Recent Scans: ${recentScans.slice(0, 5).join(", ")}`);
    }

    if (ctx.length === 0) return null;
    return `[USER HEALTH PROFILE CONTEXT]\n${ctx.join("\n")}`;
}

/**
 * Auto-generate a conversation title from the first user message
 */
export function generateConversationTitle(question: string, language: "en" | "ar"): string {
    const clean = question.replace(/\s+/g, " ").trim();
    const maxLen = language === "ar" ? 35 : 50;
    if (clean.length <= maxLen) return clean;
    return clean.slice(0, maxLen) + "…";
}

/**
 * Build compressed chat memory for multi-turn conversations
 */
export function buildSmartMemoryMessages(
    history: { role: "user" | "assistant"; content: string }[],
    currentQuestion: string
): { role: "user" | "assistant"; content: string }[] {
    if (!history || history.length === 0) return [];

    const result: { role: "user" | "assistant"; content: string }[] = [];
    const recent = history.slice(-6);

    for (const msg of recent) {
        const text = msg.content || "";
        const cleanText = text.replace(/---METADATA---[\s\S]*$/, "").trim();

        if (cleanText.length > 400) {
            result.push({
                role: msg.role,
                content: cleanText.slice(0, 400) + "…",
            });
        } else {
            result.push({
                role: msg.role,
                content: cleanText,
            });
        }
    }

    return result;
}

/**
 * Universal fail-safe parser for AI responses.
 * Extracts clean answer markdown, key points, and suggested follow-ups.
 */
export function parseAiResponse(rawText: string): {
    answer: string;
    keyPoints: string[];
    suggestedFollowUps: string[];
} {
    const text = String(rawText || "").trim();
    if (!text) {
        return { answer: "", keyPoints: [], suggestedFollowUps: [] };
    }

    // 1. Check for METADATA separator
    const sepIdx = text.indexOf("---METADATA---");
    if (sepIdx !== -1) {
        const answerPart = text.slice(0, sepIdx).trim();
        const metaPart = text.slice(sepIdx + "---METADATA---".length).trim();
        let keyPoints: string[] = [];
        let suggestedFollowUps: string[] = [];
        try {
            const jsonMatch = metaPart.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const rawKp = parsed.keyPoints || parsed["النقاط الرئيسية"] || parsed["key_points"] || [];
                const rawFu = parsed.suggestedFollowUps || parsed["المتابعات المقترحة"] || parsed["suggested_follow_ups"] || [];
                if (Array.isArray(rawKp)) keyPoints = rawKp.map((s: any) => String(s).trim()).filter(Boolean);
                if (Array.isArray(rawFu)) suggestedFollowUps = rawFu.map((s: any) => String(s).trim()).filter(Boolean);
            }
        } catch { /* ignore metadata parse error */ }
        return { answer: answerPart || text, keyPoints, suggestedFollowUps };
    }

    // 2. Check if the ENTIRE text is a JSON object
    if (text.startsWith("{") && text.endsWith("}")) {
        try {
            const fixed = text.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, "\\\\");
            const parsed = JSON.parse(fixed);
            const ans = String(parsed.answer || parsed["الإجابة"] || parsed["إجابة"] || "").trim();
            const rawKp = parsed.keyPoints || parsed["النقاط الرئيسية"] || parsed["key_points"] || [];
            const rawFu = parsed.suggestedFollowUps || parsed["المتابعات المقترحة"] || parsed["suggested_follow_ups"] || [];
            const keyPoints = Array.isArray(rawKp) ? rawKp.map((s: any) => String(s).trim()).filter(Boolean) : [];
            const suggestedFollowUps = Array.isArray(rawFu) ? rawFu.map((s: any) => String(s).trim()).filter(Boolean) : [];
            if (ans) {
                return { answer: ans, keyPoints, suggestedFollowUps };
            }
        } catch { /* ignore */ }
    }

    // 3. Default: the text is pure Markdown response
    return { answer: text, keyPoints: [], suggestedFollowUps: [] };
}
