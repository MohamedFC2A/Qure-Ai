export type SerperOrganicResult = {
    title: string;
    link: string;
    snippet?: string;
    position?: number;
    date?: string;
    domain?: string;
    sitelinks?: Array<{ title: string; link: string }>;
};

export type SerperKnowledgeGraph = {
    title?: string;
    type?: string;
    description?: string;
    descriptionSource?: string;
    descriptionLink?: string;
    attributes?: Record<string, string>;
    website?: string;
};

export type SerperAnswerBox = {
    title?: string;
    answer?: string;
    snippet?: string;
    link?: string;
};

export type SerperSearchSnapshot = {
    found: boolean;
    query: string;
    results: SerperOrganicResult[];
    knowledgeGraph?: SerperKnowledgeGraph | null;
    answerBox?: SerperAnswerBox | null;
    peopleAlsoAsk?: string[];
    pagesSearched?: number;
    totalResultsFound?: number;
    fetchedAt: string;
    error?: string;
};

function toString(value: unknown): string {
    return typeof value === "string" ? value : value == null ? "" : String(value);
}

function extractDomain(url: string): string {
    try {
        const parsed = new URL(url);
        return parsed.hostname.replace(/^www\./i, "");
    } catch {
        return "";
    }
}

/**
 * Basic single-page Serper Search
 */
export async function serperSearch(opts: {
    query: string;
    num?: number;
    page?: number;
    gl?: string;
    hl?: string;
}): Promise<SerperSearchSnapshot> {
    const fetchedAt = new Date().toISOString();
    const query = toString(opts.query).trim();

    if (!query) {
        return { found: false, query, results: [], fetchedAt, error: "Missing query" };
    }

    const apiKey = process.env.SERPER_API_KEY ? String(process.env.SERPER_API_KEY).trim() : "";
    if (!apiKey) {
        return {
            found: false,
            query,
            results: [],
            fetchedAt,
            error: "SERPER_API_KEY is missing",
        };
    }

    const num = Math.max(1, Math.min(Number(opts.num ?? 10), 20));
    const page = Math.max(1, Math.min(Number(opts.page ?? 1), 10));
    const gl = toString(opts.gl || "").trim() || "us";
    const hl = toString(opts.hl || "").trim() || "en";

    try {
        const res = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey,
            },
            body: JSON.stringify({ q: query, num, page, gl, hl }),
        });

        const payload = await res.json().catch(() => ({} as any));
        if (!res.ok) {
            const msg = toString(payload?.message || payload?.error || payload?.errors?.[0]?.message);
            return {
                found: false,
                query,
                results: [],
                fetchedAt,
                error: msg || `Serper request failed (${res.status})`,
            };
        }

        const organic = Array.isArray(payload?.organic) ? payload.organic : [];
        const results: SerperOrganicResult[] = organic
            .map((r: any) => ({
                title: toString(r?.title).trim(),
                link: toString(r?.link).trim(),
                snippet: toString(r?.snippet).trim() || undefined,
                position: typeof r?.position === "number" ? r.position : undefined,
                date: toString(r?.date).trim() || undefined,
                domain: extractDomain(toString(r?.link).trim()),
                sitelinks: Array.isArray(r?.sitelinks)
                    ? r.sitelinks.map((s: any) => ({ title: toString(s?.title).trim(), link: toString(s?.link).trim() }))
                    : undefined,
            }))
            .filter((r: SerperOrganicResult) => r.title && r.link);

        let knowledgeGraph: SerperKnowledgeGraph | null = null;
        if (payload?.knowledgeGraph && typeof payload.knowledgeGraph === "object") {
            const kg = payload.knowledgeGraph;
            knowledgeGraph = {
                title: toString(kg.title).trim() || undefined,
                type: toString(kg.type).trim() || undefined,
                description: toString(kg.description).trim() || undefined,
                descriptionSource: toString(kg.descriptionSource).trim() || undefined,
                descriptionLink: toString(kg.descriptionLink).trim() || undefined,
                website: toString(kg.website).trim() || undefined,
                attributes: typeof kg.attributes === "object" && kg.attributes ? kg.attributes : undefined,
            };
        }

        let answerBox: SerperAnswerBox | null = null;
        if (payload?.answerBox && typeof payload.answerBox === "object") {
            const ab = payload.answerBox;
            answerBox = {
                title: toString(ab.title).trim() || undefined,
                answer: toString(ab.answer).trim() || undefined,
                snippet: toString(ab.snippet).trim() || undefined,
                link: toString(ab.link).trim() || undefined,
            };
        }

        const peopleAlsoAsk = Array.isArray(payload?.peopleAlsoAsk)
            ? payload.peopleAlsoAsk.map((p: any) => toString(p?.question).trim()).filter(Boolean)
            : [];

        return {
            found: results.length > 0 || !!knowledgeGraph || !!answerBox,
            query,
            results,
            knowledgeGraph,
            answerBox,
            peopleAlsoAsk,
            pagesSearched: 1,
            totalResultsFound: results.length,
            fetchedAt,
        };
    } catch (e: any) {
        return {
            found: false,
            query,
            results: [],
            fetchedAt,
            error: toString(e?.message || e || "Serper request failed"),
        };
    }
}

/**
 * 5-Page Deep Medical Serper Search Engine:
 * Fetches up to 5 full pages (or queries multiple angles) in parallel,
 * deduplicating by URL and synthesizing Knowledge Graph, Answer Box & Top Clinical Snippets.
 */
export async function deepMedicalSerperSearch(opts: {
    query: string;
    maxPages?: number;
    gl?: string;
    hl?: string;
    customAngles?: string[];
}): Promise<SerperSearchSnapshot> {
    const maxPages = Math.max(1, Math.min(Number(opts.maxPages ?? 5), 5));
    const gl = opts.gl || "us";
    const hl = opts.hl || "en";
    const mainQuery = toString(opts.query).trim();

    if (!mainQuery) {
        return { found: false, query: mainQuery, results: [], fetchedAt: new Date().toISOString(), error: "Missing query" };
    }

    // Build page queries: if customAngles are provided, use them; otherwise query pages 1..maxPages
    const requests: Array<Promise<SerperSearchSnapshot>> = [];

    if (opts.customAngles && opts.customAngles.length > 0) {
        const angles = [mainQuery, ...opts.customAngles].slice(0, maxPages);
        for (const angle of angles) {
            requests.push(serperSearch({ query: angle, num: 10, page: 1, gl, hl }));
        }
    } else {
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            requests.push(serperSearch({ query: mainQuery, num: 10, page: pageNum, gl, hl }));
        }
    }

    try {
        const snapshots = await Promise.all(requests);
        const seenLinks = new Set<string>();
        const aggregatedResults: SerperOrganicResult[] = [];
        let mergedKnowledgeGraph: SerperKnowledgeGraph | null = null;
        let mergedAnswerBox: SerperAnswerBox | null = null;
        const allQuestions = new Set<string>();
        let validPagesCount = 0;

        for (const snap of snapshots) {
            if (snap.found) {
                validPagesCount += (snap.pagesSearched || 1);
            }
            if (!mergedKnowledgeGraph && snap.knowledgeGraph) {
                mergedKnowledgeGraph = snap.knowledgeGraph;
            }
            if (!mergedAnswerBox && snap.answerBox) {
                mergedAnswerBox = snap.answerBox;
            }
            if (Array.isArray(snap.peopleAlsoAsk)) {
                for (const q of snap.peopleAlsoAsk) {
                    allQuestions.add(q);
                }
            }

            for (const r of snap.results) {
                const normalizedLink = r.link.toLowerCase().replace(/\/+$/, "");
                if (!seenLinks.has(normalizedLink)) {
                    seenLinks.add(normalizedLink);
                    aggregatedResults.push(r);
                }
            }
        }

        // Prioritize authoritative clinical and pharmaceutical domains
        const authoritativeKeywords = [
            "fda.gov",
            "nih.gov",
            "drugs.com",
            "medscape.com",
            "mayoclinic.org",
            "who.int",
            "dailymed.nlm.nih.gov",
            "ncbi.nlm.nih.gov",
            "medicines.org.uk",
            "sfda.gov.sa",
            "edaegypt.gov.eg",
            "bnf.nice.org.uk",
            "webteb.com",
            "altibbi.com",
        ];

        aggregatedResults.sort((a, b) => {
            const aAuth = authoritativeKeywords.some((k) => a.link.includes(k));
            const bAuth = authoritativeKeywords.some((k) => b.link.includes(k));
            if (aAuth && !bAuth) return -1;
            if (!aAuth && bAuth) return 1;
            return 0;
        });

        return {
            found: aggregatedResults.length > 0 || !!mergedKnowledgeGraph || !!mergedAnswerBox,
            query: mainQuery,
            results: aggregatedResults,
            knowledgeGraph: mergedKnowledgeGraph,
            answerBox: mergedAnswerBox,
            peopleAlsoAsk: Array.from(allQuestions).slice(0, 10),
            pagesSearched: Math.max(1, validPagesCount),
            totalResultsFound: aggregatedResults.length,
            fetchedAt: new Date().toISOString(),
        };
    } catch (e: any) {
        // Fallback to single basic search
        return serperSearch({ query: mainQuery, num: 10, page: 1, gl, hl });
    }
}
