export type OpenFdaHarmonizedFields = {
    manufacturer_name?: string[];
    unii?: string[];
    product_type?: string[];
    spl_set_id?: string[];
    route?: string[];
    generic_name?: string[];
    brand_name?: string[];
    product_ndc?: string[];
    substance_name?: string[];
};

export type OpenFdaLabelSnapshot = {
    found: boolean;
    query: {
        brand?: string | null;
        generic?: string | null;
        productNdc?: string | null;
        manufacturer?: string | null;
        attemptedSearch?: string | null;
    };
    match?: {
        score: number;
        reason?: string;
    };
    openfda?: OpenFdaHarmonizedFields;
    label?: {
        indications_and_usage?: string[];
        dosage_and_administration?: string[];
        dosage_forms_and_strengths?: string[];
        contraindications?: string[];
        warnings?: string[];
        warnings_and_precautions?: string[];
        drug_interactions?: string[];
        adverse_reactions?: string[];
        use_in_specific_populations?: string[];
        overdosage?: string[];
        storage_and_handling?: string[];
        clinical_pharmacology?: string[];
    };
    source?: {
        dataset: "drug/label";
        id?: string;
        set_id?: string;
        effective_time?: string;
    };
    fetchedAt: string;
    error?: string;
};

function toStringArray(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
    return [String(value)].filter(Boolean);
}

function normalizeForMatch(value: string): string {
    return String(value || "")
        .normalize("NFKC")
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function escapeLucenePhrase(value: string): string {
    return String(value || "")
        .normalize("NFKC")
        .trim()
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}

function truncateLines(lines: unknown, maxItems: number, maxCharsPerItem: number): string[] | undefined {
    const items = toStringArray(lines)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, maxItems)
        .map((s) => (s.length > maxCharsPerItem ? `${s.slice(0, maxCharsPerItem).trim()}…` : s));
    return items.length > 0 ? items : undefined;
}

function extractOpenFdaFields(record: any): OpenFdaHarmonizedFields | undefined {
    const f = record?.openfda;
    if (!f || typeof f !== "object") return undefined;
    const out: OpenFdaHarmonizedFields = {
        manufacturer_name: toStringArray(f.manufacturer_name),
        unii: toStringArray(f.unii),
        product_type: toStringArray(f.product_type),
        spl_set_id: toStringArray(f.spl_set_id),
        route: toStringArray(f.route),
        generic_name: toStringArray(f.generic_name),
        brand_name: toStringArray(f.brand_name),
        product_ndc: toStringArray(f.product_ndc),
        substance_name: toStringArray(f.substance_name),
    };

    const hasAny = Object.values(out).some((arr) => Array.isArray(arr) && arr.length > 0);
    return hasAny ? out : undefined;
}

function scoreLabelRecord(opts: {
    record: any;
    brand?: string | null;
    generic?: string | null;
    productNdc?: string | null;
    manufacturer?: string | null;
}): { score: number; reason?: string } {
    const openfda = extractOpenFdaFields(opts.record) || {};

    const normalizedBrand = opts.brand ? normalizeForMatch(opts.brand) : "";
    const normalizedGeneric = opts.generic ? normalizeForMatch(opts.generic) : "";
    const normalizedManufacturer = opts.manufacturer ? normalizeForMatch(opts.manufacturer) : "";
    const normalizedNdc = opts.productNdc ? normalizeForMatch(opts.productNdc) : "";

    const brands = (openfda.brand_name || []).map(normalizeForMatch);
    const generics = (openfda.generic_name || []).map(normalizeForMatch);
    const substances = (openfda.substance_name || []).map(normalizeForMatch);
    const manufacturers = (openfda.manufacturer_name || []).map(normalizeForMatch);
    const ndcs = (openfda.product_ndc || []).map(normalizeForMatch);

    let score = 0;
    const reasons: string[] = [];

    if (normalizedNdc && ndcs.includes(normalizedNdc)) {
        score += 120;
        reasons.push("product_ndc match");
    }

    if (normalizedBrand) {
        if (brands.includes(normalizedBrand)) {
            score += 100;
            reasons.push("brand_name exact match");
        } else if (brands.some((b) => b.includes(normalizedBrand) || normalizedBrand.includes(b))) {
            score += 50;
            reasons.push("brand_name partial match");
        }
    }

    if (normalizedGeneric) {
        if (generics.includes(normalizedGeneric)) {
            score += 80;
            reasons.push("generic_name exact match");
        } else if (generics.some((g) => g.includes(normalizedGeneric) || normalizedGeneric.includes(g))) {
            score += 40;
            reasons.push("generic_name partial match");
        }

        if (substances.includes(normalizedGeneric)) {
            score += 35;
            reasons.push("substance_name match");
        } else if (substances.some((s) => s.includes(normalizedGeneric) || normalizedGeneric.includes(s))) {
            score += 20;
            reasons.push("substance_name partial match");
        }
    }

    if (normalizedManufacturer) {
        if (manufacturers.includes(normalizedManufacturer)) {
            score += 20;
            reasons.push("manufacturer_name match");
        } else if (manufacturers.some((m) => m.includes(normalizedManufacturer) || normalizedManufacturer.includes(m))) {
            score += 10;
            reasons.push("manufacturer_name partial match");
        }
    }

    return { score, reason: reasons.join(", ") || undefined };
}

export function extractPossibleNdc(text: string): string | null {
    const raw = String(text || "");
    // Common NDC patterns: 4-4-2, 5-3-2, 5-4-1, etc.
    const match = raw.match(/\b\d{4,5}-\d{3,4}-\d{1,2}\b/);
    return match ? match[0] : null;
}

export async function fetchOpenFdaLabelSnapshot(opts: {
    brand?: string | null;
    generic?: string | null;
    productNdc?: string | null;
    manufacturer?: string | null;
    limit?: number;
}): Promise<OpenFdaLabelSnapshot> {
    const fetchedAt = new Date().toISOString();
    const brand = opts.brand ? String(opts.brand).trim() : null;
    const generic = opts.generic ? String(opts.generic).trim() : null;
    const productNdc = opts.productNdc ? String(opts.productNdc).trim() : null;
    const manufacturer = opts.manufacturer ? String(opts.manufacturer).trim() : null;

    const limit = Math.max(1, Math.min(Number(opts.limit || 5), 10));
    const apiKey = process.env.OPENFDA_API_KEY ? String(process.env.OPENFDA_API_KEY).trim() : "";

    const clauses: string[] = [];
    if (productNdc) clauses.push(`openfda.product_ndc:"${escapeLucenePhrase(productNdc)}"`);
    if (brand) clauses.push(`openfda.brand_name:"${escapeLucenePhrase(brand)}"`);
    if (generic) clauses.push(`openfda.generic_name:"${escapeLucenePhrase(generic)}"`);
    if (generic) clauses.push(`openfda.substance_name:"${escapeLucenePhrase(generic)}"`);

    if (clauses.length === 0) {
        return {
            found: false,
            query: { brand, generic, productNdc, manufacturer, attemptedSearch: null },
            fetchedAt,
            error: "No search terms provided",
        };
    }

    const search = `(${clauses.join(" OR ")})`;
    const baseUrl = "https://api.fda.gov/drug/label.json";
    const url =
        (apiKey ? `${baseUrl}?api_key=${encodeURIComponent(apiKey)}&` : `${baseUrl}?`) +
        `search=${encodeURIComponent(search)}&limit=${encodeURIComponent(String(limit))}`;

    try {
        const res = await fetch(url, {
            // Best-effort caching; route handlers are dynamic, but Next may still revalidate in some runtimes.
            next: { revalidate: 60 * 60 },
        });

        const payload = await res.json().catch(() => ({} as any));
        const results = Array.isArray(payload?.results) ? payload.results : [];

        if (!res.ok) {
            const message = payload?.error?.message || payload?.error || `openFDA request failed (${res.status})`;
            return {
                found: false,
                query: { brand, generic, productNdc, manufacturer, attemptedSearch: search },
                fetchedAt,
                error: String(message),
            };
        }

        if (results.length === 0) {
            return {
                found: false,
                query: { brand, generic, productNdc, manufacturer, attemptedSearch: search },
                fetchedAt,
            };
        }

        const scored = results.map((record: any) => ({
            record,
            ...scoreLabelRecord({ record, brand, generic, productNdc, manufacturer }),
        }));

        scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
        const best = scored[0];
        if (!best || best.score <= 0) {
            return {
                found: false,
                query: { brand, generic, productNdc, manufacturer, attemptedSearch: search },
                fetchedAt,
            };
        }

        const record = best.record || {};
        return {
            found: true,
            query: { brand, generic, productNdc, manufacturer, attemptedSearch: search },
            match: { score: best.score, reason: best.reason },
            openfda: extractOpenFdaFields(record),
            label: {
                indications_and_usage: truncateLines(record.indications_and_usage, 2, 1500),
                dosage_and_administration: truncateLines(record.dosage_and_administration, 2, 1500),
                dosage_forms_and_strengths: truncateLines(record.dosage_forms_and_strengths, 2, 1200),
                contraindications: truncateLines(record.contraindications, 2, 1200),
                warnings: truncateLines(record.warnings, 2, 1200),
                warnings_and_precautions: truncateLines(record.warnings_and_precautions, 2, 1500),
                drug_interactions: truncateLines(record.drug_interactions, 2, 1500),
                adverse_reactions: truncateLines(record.adverse_reactions, 2, 1500),
                use_in_specific_populations: truncateLines(record.use_in_specific_populations, 2, 1500),
                overdosage: truncateLines(record.overdosage, 2, 1500),
                storage_and_handling: truncateLines(record.storage_and_handling, 2, 1200),
                clinical_pharmacology: truncateLines(record.clinical_pharmacology, 1, 1500),
            },
            source: {
                dataset: "drug/label",
                id: record.id ? String(record.id) : undefined,
                set_id: record.set_id ? String(record.set_id) : undefined,
                effective_time: record.effective_time ? String(record.effective_time) : undefined,
            },
            fetchedAt,
        };
    } catch (e: any) {
        return {
            found: false,
            query: { brand, generic, productNdc, manufacturer, attemptedSearch: search },
            fetchedAt,
            error: String(e?.message || e || "openFDA fetch failed"),
        };
    }
}
