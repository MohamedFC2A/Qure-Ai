export type SerperOrganicResult = {
    title: string;
    link: string;
    snippet?: string;
    position?: number;
    date?: string;
};

export type SerperSearchSnapshot = {
    found: boolean;
    query: string;
    results: SerperOrganicResult[];
    fetchedAt: string;
    error?: string;
};

function toString(value: unknown): string {
    return typeof value === "string" ? value : value == null ? "" : String(value);
}

export async function serperSearch(opts: {
    query: string;
    num?: number;
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

    const num = Math.max(1, Math.min(Number(opts.num ?? 8), 20));
    const gl = toString(opts.gl || "").trim() || "us";
    const hl = toString(opts.hl || "").trim() || "en";

    try {
        const res = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey,
            },
            body: JSON.stringify({ q: query, num, gl, hl }),
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
            }))
            .filter((r: SerperOrganicResult) => r.title && r.link);

        return {
            found: results.length > 0,
            query,
            results,
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

