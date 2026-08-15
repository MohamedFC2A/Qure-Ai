import { deepMedicalSerperSearch, serperSearch, type SerperOrganicResult, type SerperSearchSnapshot } from "@/lib/serper";

export interface LiveSearchSource {
    title: string;
    link: string;
    domain: string;
    snippet?: string;
    date?: string;
}

export interface LiveSearchExecutionResult {
    performed: boolean;
    query: string;
    queriesExecuted: string[];
    pagesCount: number;
    totalSources: number;
    sources: LiveSearchSource[];
    directAnswer?: string;
    knowledgeEntity?: string;
    knowledgeAttributes?: Record<string, string>;
    evidenceText: string;
    durationMs: number;
}

/**
 * Intelligent detector for whether a chat prompt genuinely requires real-time external medical search
 */
export function shouldTriggerLiveMedicalSearch(prompt: string, mode: string = "health"): boolean {
    const text = String(prompt || "").toLowerCase().trim();
    if (!text) return false;

    // 1. Explicit user intent for live/online web search
    const explicitSearchKeywords = [
        "ابحث",
        "ابحث في النت",
        "ابحث على النت",
        "ابحث عبر الانترنت",
        "ابحث في جوجل",
        "سيرش",
        "search",
        "google it",
        "on the web",
        "online search",
        "check online",
        "سعر",
        "اسعار",
        "price",
        "تكلفة",
        "متوفر في الصيدليات",
        "سعر الدواء"
    ];

    if (explicitSearchKeywords.some((kw) => text.includes(kw))) {
        return true;
    }

    // 2. Clinical trials, FDA recalls, regulatory approvals, and novel research updates
    const externalRegulatoryKeywords = [
        "fda approval",
        "موافقة fda",
        "موافقة الغذاء والدواء",
        "هيئة الدواء",
        "سحب دواء",
        "drug recall",
        "warning letter",
        "تحذير رسمي",
        "clinical trial",
        "تجارب سريرية",
        "أحدث الأبحاث",
        "احدث الدراسات",
        "أحدث دراسة",
        "guidelines 2025",
        "guidelines 2026",
        "إرشادات 2025",
        "إرشادات 2026",
        "بروتوكول جديد",
    ];

    if (externalRegulatoryKeywords.some((kw) => text.includes(kw))) {
        return true;
    }

    return false;
}

/**
 * Dynamically determines the optimal search depth and query angles
 */
function planAutonomousSearchStrategy(query: string, language: "en" | "ar") {
    const isAr = language === "ar";
    const cleaned = query.replace(/[?؟.,!]/g, " ").trim();

    // Determine how many pages to explore based on query complexity
    let targetPages = 3;
    if (cleaned.length > 50 || cleaned.includes("مقارنة") || cleaned.includes("تداخل") || cleaned.includes("compare") || cleaned.includes("interaction")) {
        targetPages = 5;
    } else if (cleaned.length < 20) {
        targetPages = 2;
    }

    const angles: string[] = [];
    if (isAr) {
        angles.push(`${cleaned} طبياً إرشادات معتمدة`);
        angles.push(`${cleaned} دواعي الاستعمال والآثار الجانبية`);
        if (targetPages >= 4) {
            angles.push(`${cleaned} وزارة الصحة هيئة الدواء نشرة`);
            angles.push(`${cleaned} medical clinical pharmacology`);
        }
    } else {
        angles.push(`${cleaned} medical guidelines clinical`);
        angles.push(`${cleaned} indications dosage side effects`);
        if (targetPages >= 4) {
            angles.push(`${cleaned} FDA prescribing information monograph`);
            angles.push(`${cleaned} PubMed clinical review`);
        }
    }

    return {
        targetPages,
        primaryQuery: cleaned,
        angles: angles.slice(0, targetPages - 1),
    };
}

/**
 * Autonomous Live Medical Web Search Tool
 */
export async function executeAutonomousMedicalSearch(opts: {
    query: string;
    language?: "en" | "ar";
    maxPages?: number;
}): Promise<LiveSearchExecutionResult> {
    const startTime = Date.now();
    const language = opts.language || "ar";
    const isAr = language === "ar";
    const rawQuery = String(opts.query || "").trim();

    if (!rawQuery) {
        return {
            performed: false,
            query: "",
            queriesExecuted: [],
            pagesCount: 0,
            totalSources: 0,
            sources: [],
            evidenceText: "",
            durationMs: 0,
        };
    }

    const strategy = planAutonomousSearchStrategy(rawQuery, language);
    const pagesToSearch = opts.maxPages || strategy.targetPages;

    const queriesExecuted = [strategy.primaryQuery, ...strategy.angles];

    // Execute multi-angle 5-page deep search
    let serperData: SerperSearchSnapshot = await deepMedicalSerperSearch({
        query: strategy.primaryQuery,
        maxPages: pagesToSearch,
        gl: isAr ? "eg" : "us",
        hl: isAr ? "ar" : "en",
        customAngles: strategy.angles,
    });

    // Autonomous drill-down: if results are too sparse (< 2 results), run an English fallback search
    if ((!serperData.results || serperData.results.length < 2) && isAr) {
        console.log("[Search Tool] Arabic search was sparse, executing autonomous English medical drill-down...");
        const drillDownQuery = `${strategy.primaryQuery} clinical pharmacology medical guidelines`;
        queriesExecuted.push(drillDownQuery);
        const fallbackData = await deepMedicalSerperSearch({
            query: drillDownQuery,
            maxPages: 3,
            gl: "us",
            hl: "en",
        });
        if (fallbackData.found && fallbackData.results.length > 0) {
            serperData = {
                ...fallbackData,
                pagesSearched: (serperData.pagesSearched || 1) + (fallbackData.pagesSearched || 1),
                results: [...(serperData.results || []), ...fallbackData.results],
            };
        }
    }

    const sources: LiveSearchSource[] = (serperData.results || []).slice(0, 10).map((r) => ({
        title: r.title,
        link: r.link,
        domain: r.domain || "medical-source.org",
        snippet: r.snippet,
        date: r.date,
    }));

    // Build structured evidence text for AI prompt injection
    const evidenceLines: string[] = [];

    if (serperData.answerBox?.answer || serperData.answerBox?.snippet) {
        evidenceLines.push(`[DIRECT VERIFIED ANSWER]: ${serperData.answerBox.answer || serperData.answerBox.snippet}`);
    }

    if (serperData.knowledgeGraph?.title) {
        evidenceLines.push(
            `[KNOWLEDGE GRAPH ENTITY]: ${serperData.knowledgeGraph.title} (${serperData.knowledgeGraph.type || "Medical Entity"})`
        );
        if (serperData.knowledgeGraph.description) {
            evidenceLines.push(`Description: ${serperData.knowledgeGraph.description}`);
        }
        if (serperData.knowledgeGraph.attributes) {
            evidenceLines.push(`Attributes: ${JSON.stringify(serperData.knowledgeGraph.attributes)}`);
        }
    }

    sources.forEach((s, i) => {
        evidenceLines.push(`[SOURCE #${i + 1}] (${s.domain}) "${s.title}": ${s.snippet || ""}`);
    });

    return {
        performed: sources.length > 0 || Boolean(serperData.knowledgeGraph || serperData.answerBox),
        query: rawQuery,
        queriesExecuted,
        pagesCount: serperData.pagesSearched || 1,
        totalSources: sources.length,
        sources,
        directAnswer: serperData.answerBox?.answer || serperData.answerBox?.snippet,
        knowledgeEntity: serperData.knowledgeGraph?.title,
        knowledgeAttributes: serperData.knowledgeGraph?.attributes,
        evidenceText: evidenceLines.join("\n\n"),
        durationMs: Date.now() - startTime,
    };
}
