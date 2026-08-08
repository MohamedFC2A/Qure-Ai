/**
 * QureScan AI Domain Safety & Guardrails Module
 * Fast zero-token pre-filter for out-of-scope queries, prompt injections, and jailbreaks.
 */

export interface GuardrailResult {
    isBlocked: boolean;
    reason?: string;
    redirectMessage?: string;
}

// Regex patterns for prompt injections and jailbreaks
const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous\s+)?(instructions|prompts|rules)/i,
    /system\s+prompt/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /act\s+as\s+(dan|an?\s+unfiltered|jailbroken)/i,
    /pretend\s+to\s+be/i,
    /override\s+your\s+rules/i,
    /bypass\s+safety/i,
    /تجاهل\s+(جميع\s+)?(التعليمات|الأوامر|القواعد)\s+السابقة/i,
    /أنت\s+الآن\s+في\s+وضع/i,
    /تظاهر\s+بأنك/i,
];

// Regex patterns for off-topic non-health domains
const OFF_TOPIC_PATTERNS = [
    // Software engineering / Coding
    /\b(write|create|code|debug|build)\b.*\b(python|javascript|typescript|java|c\+\+|html|css|sql|script|function|react|node|api|code)\b/i,
    /\b(how\s+to\s+code|syntax\s+of|programming\s+language)\b/i,
    /\b(اكتب|أنشئ|عدل|صحح)\b.*\b(كود|برنامج|دالة|بايثون|جافاسكريبت|سكربت|برمجة)\b/i,

    // Politics & Controversial General Knowledge
    /\b(who\s+won\s+the\s+election|political\s+party|president\s+of|government\s+policy)\b/i,
    /\b(الانتخابات|الحزب\s+السياسي|رئيس\s+جمهورية|سياسة\s+الحكومة)\b/i,

    // Pure academic math / physics homework
    /\b(solve\s+this\s+equation|calculate\s+derivative|integral\s+of|quantum\s+physics)\b/i,
    /\b(حل\s+هذه\s+المعادلة|احسب\s+المشتقة|التكامل|الفيزياء\s+الكمية)\b/i,

    // General non-health trivia / entertainment
    /\b(movie\s+recommendation|best\s+video\s+game|football\s+match|celebrity\s+news)\b/i,
    /\b(ترشيح\b.*\bفيلم|أفضل\s+لعبة|مباراة\s+كرة|أخبار\s+المشاهير)\b/i,
];

// Keywords that indicate health/medical context (override false positives)
const HEALTH_CONTEXT_KEYWORDS = [
    "health", "medicine", "medication", "drug", "pill", "symptom", "pain",
    "doctor", "dose", "dosage", "pharmacy", "nutrition", "diet", "exercise",
    "workout", "sleep", "allergy", "disease", "blood", "pressure", "heart",
    "stomach", "skin", "headache", "fever", "infection", "vitamin", "treatment",
    "صحة", "دواء", "علاج", "عرض", "ألم", "طبيب", "صيدلية", "جرعة", "تغذية",
    "نظام غذائي", "رياضة", "نوم", "حساسية", "مرض", "دم", "ضغط", "قلب",
    "معدة", "جلد", "صداع", "حرارة", "التهاب", "فيتامين", "روشتة", "استشارة"
];

/**
 * Validates user input against safety, prompt injection, and domain boundaries.
 */
export function checkGuardrails(
    input: string,
    language: "en" | "ar" = "ar"
): GuardrailResult {
    const text = String(input || "").trim();
    if (!text) {
        return { isBlocked: false };
    }

    // 1. Check Prompt Injection / Jailbreaks
    for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(text)) {
            return {
                isBlocked: true,
                reason: "prompt_injection_attempt",
                redirectMessage: language === "ar"
                    ? "أنا مساعد QureScan المتخصص في الصحة والعافية والأدوية. كيف يمكنني مساعدتك في مجال صحتك اليوم؟"
                    : "I am QureScan's specialized health, wellness, and medication assistant. How can I help you with your health today?"
            };
        }
    }

    // 2. Check if query is clearly health-related (fast pass)
    const lower = text.toLowerCase();
    const hasHealthKeyword = HEALTH_CONTEXT_KEYWORDS.some(kw => lower.includes(kw));

    // 3. Check Off-Topic Patterns (only if no explicit health keyword is present)
    if (!hasHealthKeyword) {
        for (const pattern of OFF_TOPIC_PATTERNS) {
            if (pattern.test(text)) {
                return {
                    isBlocked: true,
                    reason: "off_topic_domain",
                    redirectMessage: language === "ar"
                        ? "أنا متخصص حصرياً في مجال الصحة، التغذية، العافية، والأدوية. يرجى طرح سؤال متعلق بصحتك وسأكون سعيداً بمساعدتك!"
                        : "I specialize exclusively in health, nutrition, wellness, and medications. Please ask a question related to your health and I will be happy to help!"
                };
            }
        }
    }

    return { isBlocked: false };
}
