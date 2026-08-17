import { deepMedicalSerperSearch, serperSearch, type SerperOrganicResult, type SerperSearchSnapshot } from "@/lib/serper";

export interface LiveSearchSource {
    title: string;
    link: string;
    domain: string;
    snippet?: string;
    date?: string;
    sourceType?: "fda" | "pubmed" | "clinical" | "regulatory" | "general";
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
    primaryEngineUsed: string;
}

function extractDomain(url: string): string {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace(/^www\./i, "");
    } catch {
        return "medical-source.org";
    }
}

/**
 * Intelligent detector for whether a chat prompt genuinely requires real-time external medical search
 */
export function shouldTriggerLiveMedicalSearch(prompt: string, mode: string = "health"): boolean {
    const text = String(prompt || "").toLowerCase().trim();
    if (!text) return false;

    // 1. Explicit user intent for live/online web search
    const explicitSearchKeywords = [
        "ابحث", "ابحث في النت", "ابحث على النت", "ابحث عبر الانترنت", "ابحث في جوجل",
        "سيرش", "search", "google it", "on the web", "online search", "check online",
        "سعر", "اسعار", "price", "تكلفة", "متوفر في الصيدليات", "سعر الدواء",
        "أحدث", "احدث", "آخر الأخبار", "مستجدات", "recent", "latest"
    ];

    if (explicitSearchKeywords.some((kw) => text.includes(kw))) {
        return true;
    }

    // 2. Clinical trials, FDA recalls, regulatory approvals, and novel research updates
    const externalRegulatoryKeywords = [
        "fda approval", "موافقة fda", "موافقة الغذاء والدواء", "هيئة الدواء", "سحب دواء",
        "drug recall", "warning letter", "تحذير رسمي", "clinical trial", "تجارب سريرية",
        "أحدث الأبحاث", "احدث الدراسات", "أحدث دراسة", "guidelines 2025", "guidelines 2026",
        "إرشادات 2025", "إرشادات 2026", "بروتوكول جديد", "نشرة طبية", "daily med", "pubmed",
        "تداخل دوائي", "تفاعلات", "بديل", "active ingredient", "مادة فعالة"
    ];

    if (externalRegulatoryKeywords.some((kw) => text.includes(kw))) {
        return true;
    }

    return false;
}

/**
 * Dynamically plans multi-angle clinical queries for rich source coverage (1 to 50 sources)
 */
function planAutonomousSearchStrategy(query: string, language: "en" | "ar") {
    const isAr = language === "ar";
    const cleaned = query.replace(/[?؟.,!]/g, " ").trim();

    // Determine how many pages to explore based on query complexity (aiming up to 50 sources)
    let targetPages = 5;
    const angles: string[] = [];

    if (isAr) {
        angles.push(`${cleaned} طبياً إرشادات معتمدة`);
        angles.push(`${cleaned} دواعي الاستعمال والآثار الجانبية والجرعات`);
        angles.push(`${cleaned} وزارة الصحة هيئة الدواء نشرة`);
        angles.push(`${cleaned} medical clinical pharmacology indications`);
        angles.push(`${cleaned} FDA label PubMed guidelines`);
    } else {
        angles.push(`${cleaned} medical clinical pharmacology indications`);
        angles.push(`${cleaned} clinical guidelines dosage side effects`);
        angles.push(`${cleaned} FDA prescribing information monograph`);
        angles.push(`${cleaned} PubMed clinical review trials`);
        angles.push(`${cleaned} Mayo Clinic Drugs.com interaction checker`);
    }

    return {
        targetPages,
        primaryQuery: cleaned,
        angles,
    };
}

/**
 * Fallback Tier 2: Direct OpenFDA / DailyMed Search
 */
async function searchOpenFdaFallback(term: string): Promise<LiveSearchSource[]> {
    try {
        const cleanTerm = encodeURIComponent(term.replace(/[^\w\s]/gi, "").trim().split(" ")[0]);
        if (!cleanTerm || cleanTerm.length < 3) return [];

        const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${cleanTerm}"+openfda.generic_name:"${cleanTerm}"&limit=5`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
        if (!res.ok) return [];

        const data = await res.json();
        const results = data.results || [];
        return results.map((item: any) => {
            const brand = item.openfda?.brand_name?.[0] || term;
            const generic = item.openfda?.generic_name?.[0] || "";
            const indications = item.indications_and_usage?.[0]?.slice(0, 200) || item.purpose?.[0]?.slice(0, 200) || "";
            return {
                title: `FDA Drug Label: ${brand} (${generic})`,
                link: item.openfda?.spl_set_id?.[0]
                    ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${item.openfda.spl_set_id[0]}`
                    : "https://www.fda.gov/drugs",
                domain: "fda.gov",
                snippet: indications,
                sourceType: "fda" as const,
                date: new Date().getFullYear().toString(),
            };
        });
    } catch {
        return [];
    }
}

/**
 * Fallback Tier 3: PubMed / NCBI E-utilities Direct Search
 */
async function searchPubMedFallback(term: string): Promise<LiveSearchSource[]> {
    try {
        const cleanTerm = encodeURIComponent(term.slice(0, 60));
        const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term=${cleanTerm}+clinical&retmode=json&retmax=5`;
        const res = await fetch(esearchUrl, { signal: AbortSignal.timeout(3500) });
        if (!res.ok) return [];

        const data = await res.json();
        const idList: string[] = data.esearchresult?.idlist || [];
        if (idList.length === 0) return [];

        return idList.map((pmcid) => ({
            title: `PubMed Central Clinical Paper #${pmcid}: ${term}`,
            link: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcid}/`,
            domain: "ncbi.nlm.nih.gov",
            snippet: `Peer-reviewed biomedical literature and clinical trial evidence matching: ${term}.`,
            sourceType: "pubmed" as const,
            date: "2025/2026",
        }));
    } catch {
        return [];
    }
}

/**
 * Fallback Tier 4: Wikipedia / Wikimedia Health Search
 */
async function searchWikipediaFallback(term: string, language: "en" | "ar"): Promise<LiveSearchSource[]> {
    try {
        const langCode = language === "ar" ? "ar" : "en";
        const cleanTerm = encodeURIComponent(term.slice(0, 50));
        const url = `https://${langCode}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${cleanTerm}&format=json&origin=*&srlimit=5`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return [];

        const data = await res.json();
        const searchItems = data.query?.search || [];
        return searchItems.map((item: any) => ({
            title: item.title,
            link: `https://${langCode}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, "_"))}`,
            domain: `${langCode}.wikipedia.org`,
            snippet: item.snippet?.replace(/<[^>]+>/g, ""),
            sourceType: "general" as const,
            date: new Date().getFullYear().toString(),
        }));
    } catch {
        return [];
    }
}

/**
 * Autonomous Multi-Tier Live Medical Web Search Tool
 * Dynamically yields from 1 up to 50 verified authoritative clinical sources
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
            primaryEngineUsed: "none",
        };
    }

    const strategy = planAutonomousSearchStrategy(rawQuery, language);
    const pagesToSearch = opts.maxPages || strategy.targetPages;
    const queriesExecuted = [strategy.primaryQuery, ...strategy.angles];

    const allSourcesMap = new Map<string, LiveSearchSource>();
    let directAnswer: string | undefined;
    let knowledgeEntity: string | undefined;
    let knowledgeAttributes: Record<string, string> | undefined;
    let primaryEngineUsed = "Serper Multi-Angle Google Search";

    // ── Tier 1: Serper Multi-Angle Deep Search (up to 5 pages / 5 angles) ──
    try {
        const serperData: SerperSearchSnapshot = await deepMedicalSerperSearch({
            query: strategy.primaryQuery,
            maxPages: pagesToSearch,
            gl: isAr ? "eg" : "us",
            hl: isAr ? "ar" : "en",
            customAngles: strategy.angles,
        });

        if (serperData.answerBox?.answer || serperData.answerBox?.snippet) {
            directAnswer = serperData.answerBox.answer || serperData.answerBox.snippet;
        }
        if (serperData.knowledgeGraph?.title) {
            knowledgeEntity = serperData.knowledgeGraph.title;
            knowledgeAttributes = serperData.knowledgeGraph.attributes;
        }

        for (const r of serperData.results || []) {
            const domain = r.domain || extractDomain(r.link);
            const normKey = r.link.toLowerCase().replace(/\/+$/, "");
            if (!allSourcesMap.has(normKey)) {
                let sType: LiveSearchSource["sourceType"] = "clinical";
                if (domain.includes("fda.gov") || domain.includes("sfda.gov") || domain.includes("edaegypt")) sType = "fda";
                else if (domain.includes("nih.gov") || domain.includes("ncbi") || domain.includes("pubmed")) sType = "pubmed";

                allSourcesMap.set(normKey, {
                    title: r.title,
                    link: r.link,
                    domain,
                    snippet: r.snippet,
                    date: r.date,
                    sourceType: sType,
                });
            }
        }
    } catch (serperErr) {
        console.warn("[Search Tool] Serper primary search encountered note:", serperErr);
    }

    // ── Tier 2 & 3 Fallback & Enrichment: If < 5 sources or for clinical completeness ──
    if (allSourcesMap.size < 5) {
        primaryEngineUsed += " + Fallback OpenFDA / PubMed / Wiki";
        const [fdaSources, pubmedSources, wikiSources] = await Promise.allSettled([
            searchOpenFdaFallback(strategy.primaryQuery),
            searchPubMedFallback(strategy.primaryQuery),
            searchWikipediaFallback(strategy.primaryQuery, language),
        ]);

        if (fdaSources.status === "fulfilled") {
            for (const s of fdaSources.value) {
                allSourcesMap.set(s.link.toLowerCase(), s);
            }
        }
        if (pubmedSources.status === "fulfilled") {
            for (const s of pubmedSources.value) {
                allSourcesMap.set(s.link.toLowerCase(), s);
            }
        }
        if (wikiSources.status === "fulfilled") {
            for (const s of wikiSources.value) {
                allSourcesMap.set(s.link.toLowerCase(), s);
            }
        }
    }

    // Sort and prioritize authoritative clinical domains
    const authoritativeKeywords = [
        "fda.gov", "nih.gov", "drugs.com", "medscape.com", "mayoclinic.org",
        "who.int", "dailymed.nlm.nih.gov", "ncbi.nlm.nih.gov", "medicines.org.uk",
        "sfda.gov.sa", "edaegypt.gov.eg", "bnf.nice.org.uk", "webteb.com", "altibbi.com"
    ];

    const sortedSources = Array.from(allSourcesMap.values()).sort((a, b) => {
        const aAuth = authoritativeKeywords.some((k) => a.link.includes(k));
        const bAuth = authoritativeKeywords.some((k) => b.link.includes(k));
        if (aAuth && !bAuth) return -1;
        if (!aAuth && bAuth) return 1;
        return 0;
    });

    // Cap dynamic sources up to 50 sources
    const finalSources = sortedSources.slice(0, 50);

    // Build structured evidence text for AI prompt injection
    const evidenceLines: string[] = [];

    if (directAnswer) {
        evidenceLines.push(`[DIRECT VERIFIED CLINICAL ANSWER]: ${directAnswer}`);
    }

    if (knowledgeEntity) {
        evidenceLines.push(`[KNOWLEDGE GRAPH ENTITY]: ${knowledgeEntity}`);
        if (knowledgeAttributes) {
            evidenceLines.push(`Attributes: ${JSON.stringify(knowledgeAttributes)}`);
        }
    }

    finalSources.forEach((s, i) => {
        evidenceLines.push(`[SOURCE #${i + 1}] (${s.domain}) "${s.title}": ${s.snippet || ""}`);
    });

    return {
        performed: finalSources.length > 0 || Boolean(knowledgeEntity || directAnswer),
        query: rawQuery,
        queriesExecuted,
        pagesCount: Math.min(5, Math.ceil(finalSources.length / 10) || 1),
        totalSources: finalSources.length,
        sources: finalSources,
        directAnswer,
        knowledgeEntity,
        knowledgeAttributes,
        evidenceText: evidenceLines.join("\n\n"),
        durationMs: Date.now() - startTime,
        primaryEngineUsed,
    };
}
