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

export type OpenFdaNdcActiveIngredient = {
    name: string;
    strength: string;
    strengthMg?: number;
};

export type OpenFdaNdcSnapshot = {
    found: boolean;
    query: {
        brand?: string | null;
        generic?: string | null;
        productNdc?: string | null;
        packageNdc?: string | null;
        manufacturer?: string | null;
        attemptedSearch?: string | null;
    };
    match?: {
        score: number;
        reason?: string;
    };
    product?: {
        product_ndc?: string;
        package_ndc?: string;
        brand_name?: string;
        generic_name?: string;
        labeler_name?: string;
        dosage_form?: string;
        route?: string;
        marketing_category?: string;
    };
    activeIngredients?: OpenFdaNdcActiveIngredient[];
    source?: {
        dataset: "drug/ndc";
    };
    fetchedAt: string;
    error?: string;
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
    ndc?: OpenFdaNdcSnapshot;
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

export function normalizeNdcToProductNdc(ndc: string | null): string | null {
    const raw = String(ndc || "").trim();
    if (!raw) return null;
    const parts = raw.split("-").map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
    return raw;
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
    // Common NDC patterns: product NDC (e.g. 12345-6789) or package NDC (e.g. 12345-6789-00).
    const match = raw.match(/\b\d{4,5}-\d{3,4}(?:-\d{1,2})?\b/);
    return match ? match[0] : null;
}

function parseStrengthToMg(strength: string): number | undefined {
    const raw = String(strength || "").trim();
    if (!raw) return undefined;
    const match = raw.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ug|g)\b/i);
    if (!match) return undefined;
    const value = Number(match[1]);
    if (!Number.isFinite(value)) return undefined;
    const unit = String(match[2] || "").toLowerCase();
    if (unit === "mg") return value;
    if (unit === "g") return value * 1000;
    if (unit === "mcg" || unit === "ug") return value / 1000;
    return undefined;
}

function scoreNdcRecord(opts: {
    record: any;
    brand?: string | null;
    generic?: string | null;
    productNdc?: string | null;
    packageNdc?: string | null;
    manufacturer?: string | null;
}): { score: number; reason?: string } {
    const normalizedBrand = opts.brand ? normalizeForMatch(opts.brand) : "";
    const normalizedGeneric = opts.generic ? normalizeForMatch(opts.generic) : "";
    const normalizedProductNdc = opts.productNdc ? normalizeForMatch(opts.productNdc) : "";
    const normalizedPackageNdc = opts.packageNdc ? normalizeForMatch(opts.packageNdc) : "";
    const normalizedManufacturer = opts.manufacturer ? normalizeForMatch(opts.manufacturer) : "";

    const recordProductNdc = normalizeForMatch(opts.record?.product_ndc || "");
    const recordPackageNdc = normalizeForMatch(opts.record?.package_ndc || "");
    const recordBrand = normalizeForMatch(opts.record?.brand_name || "");
    const recordGeneric = normalizeForMatch(opts.record?.generic_name || "");
    const recordLabeler = normalizeForMatch(opts.record?.labeler_name || "");

    let score = 0;
    const reasons: string[] = [];

    if (normalizedPackageNdc && recordPackageNdc && normalizedPackageNdc === recordPackageNdc) {
        score += 150;
        reasons.push("package_ndc match");
    }

    if (normalizedProductNdc && recordProductNdc && normalizedProductNdc === recordProductNdc) {
        score += 130;
        reasons.push("product_ndc match");
    }

    if (normalizedBrand) {
        if (recordBrand === normalizedBrand) {
            score += 90;
            reasons.push("brand_name exact match");
        } else if (recordBrand.includes(normalizedBrand) || normalizedBrand.includes(recordBrand)) {
            score += 45;
            reasons.push("brand_name partial match");
        }
    }

    if (normalizedGeneric) {
        if (recordGeneric === normalizedGeneric) {
            score += 80;
            reasons.push("generic_name exact match");
        } else if (recordGeneric.includes(normalizedGeneric) || normalizedGeneric.includes(recordGeneric)) {
            score += 40;
            reasons.push("generic_name partial match");
        }
    }

    if (normalizedManufacturer) {
        if (recordLabeler === normalizedManufacturer) {
            score += 20;
            reasons.push("labeler_name match");
        } else if (recordLabeler.includes(normalizedManufacturer) || normalizedManufacturer.includes(recordLabeler)) {
            score += 10;
            reasons.push("labeler_name partial match");
        }
    }

    return { score, reason: reasons.join(", ") || undefined };
}

export async function fetchOpenFdaNdcSnapshot(opts: {
    brand?: string | null;
    generic?: string | null;
    productNdc?: string | null;
    packageNdc?: string | null;
    manufacturer?: string | null;
    limit?: number;
}): Promise<OpenFdaNdcSnapshot> {
    const fetchedAt = new Date().toISOString();
    const brand = opts.brand ? String(opts.brand).trim() : null;
    const generic = opts.generic ? String(opts.generic).trim() : null;
    const packageNdc = opts.packageNdc ? String(opts.packageNdc).trim() : null;
    const productNdc = normalizeNdcToProductNdc(opts.productNdc ? String(opts.productNdc).trim() : null);
    const manufacturer = opts.manufacturer ? String(opts.manufacturer).trim() : null;

    const limit = Math.max(1, Math.min(Number(opts.limit || 5), 10));
    const apiKey = process.env.OPENFDA_API_KEY ? String(process.env.OPENFDA_API_KEY).trim() : "";

    const attempts: string[] = [];
    if (packageNdc) attempts.push(`package_ndc:"${escapeLucenePhrase(packageNdc)}"`);
    if (productNdc) attempts.push(`product_ndc:"${escapeLucenePhrase(productNdc)}"`);
    if (brand) attempts.push(`brand_name:"${escapeLucenePhrase(brand)}"`);
    if (generic) attempts.push(`generic_name:"${escapeLucenePhrase(generic)}"`);

    if (attempts.length === 0) {
        return {
            found: false,
            query: { brand, generic, productNdc, packageNdc, manufacturer, attemptedSearch: null },
            fetchedAt,
            error: "No search terms provided",
        };
    }

    const baseUrl = "https://api.fda.gov/drug/ndc.json";

    let lastAttempted: string | null = null;
    for (const attempt of attempts) {
        lastAttempted = attempt;
        const url =
            (apiKey ? `${baseUrl}?api_key=${encodeURIComponent(apiKey)}&` : `${baseUrl}?`) +
            `search=${encodeURIComponent(attempt)}&limit=${encodeURIComponent(String(limit))}`;

        try {
            const res = await fetch(url, { next: { revalidate: 60 * 60 } });
            const payload = await res.json().catch(() => ({} as any));
            const results = Array.isArray(payload?.results) ? payload.results : [];

            if (!res.ok) {
                // openFDA uses 404 for "No matches found"; treat it as a clean miss (no error).
                if (res.status === 404) continue;
                const message = payload?.error?.message || payload?.error || `openFDA request failed (${res.status})`;
                return {
                    found: false,
                    query: { brand, generic, productNdc, packageNdc, manufacturer, attemptedSearch: attempt },
                    fetchedAt,
                    error: String(message),
                };
            }

            if (results.length === 0) continue;

            const scored = results.map((record: any) => ({
                record,
                ...scoreNdcRecord({ record, brand, generic, productNdc, packageNdc, manufacturer }),
            }));

            scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
            const best = scored[0];
            if (!best || best.score <= 0) continue;

            const record = best.record || {};
            const activeIngredientsRaw = Array.isArray(record?.active_ingredients) ? record.active_ingredients : [];
            const activeIngredients = activeIngredientsRaw
                .map((ai: any) => {
                    const name = String(ai?.name || "").trim();
                    const strength = String(ai?.strength || "").trim();
                    const strengthMg = parseStrengthToMg(strength);
                    if (!name && !strength) return null;
                    return {
                        name,
                        strength,
                        strengthMg,
                    } satisfies OpenFdaNdcActiveIngredient;
                })
                .filter(Boolean) as OpenFdaNdcActiveIngredient[];

            return {
                found: true,
                query: { brand, generic, productNdc, packageNdc, manufacturer, attemptedSearch: attempt },
                match: { score: best.score, reason: best.reason },
                product: {
                    product_ndc: record?.product_ndc ? String(record.product_ndc) : undefined,
                    package_ndc: record?.package_ndc ? String(record.package_ndc) : undefined,
                    brand_name: record?.brand_name ? String(record.brand_name) : undefined,
                    generic_name: record?.generic_name ? String(record.generic_name) : undefined,
                    labeler_name: record?.labeler_name ? String(record.labeler_name) : undefined,
                    dosage_form: record?.dosage_form ? String(record.dosage_form) : undefined,
                    route: record?.route ? String(record.route) : undefined,
                    marketing_category: record?.marketing_category ? String(record.marketing_category) : undefined,
                },
                activeIngredients: activeIngredients.length > 0 ? activeIngredients : undefined,
                source: { dataset: "drug/ndc" },
                fetchedAt,
            };
        } catch (e: any) {
            return {
                found: false,
                query: { brand, generic, productNdc, packageNdc, manufacturer, attemptedSearch: attempt },
                fetchedAt,
                error: String(e?.message || e || "openFDA fetch failed"),
            };
        }
    }

    return {
        found: false,
        query: { brand, generic, productNdc, packageNdc, manufacturer, attemptedSearch: lastAttempted },
        fetchedAt,
    };
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
    const productNdc = normalizeNdcToProductNdc(opts.productNdc ? String(opts.productNdc).trim() : null);
    const manufacturer = opts.manufacturer ? String(opts.manufacturer).trim() : null;

    const limit = Math.max(1, Math.min(Number(opts.limit || 5), 10));
    const apiKey = process.env.OPENFDA_API_KEY ? String(process.env.OPENFDA_API_KEY).trim() : "";

    const orClauses: string[] = [];
    if (brand) orClauses.push(`openfda.brand_name:"${escapeLucenePhrase(brand)}"`);
    if (generic) orClauses.push(`openfda.generic_name:"${escapeLucenePhrase(generic)}"`);
    if (generic) orClauses.push(`openfda.substance_name:"${escapeLucenePhrase(generic)}"`);

    const attempts: string[] = [];
    if (productNdc) attempts.push(`openfda.product_ndc:"${escapeLucenePhrase(productNdc)}"`);
    if (brand && generic) {
        attempts.push(
            `(openfda.brand_name:"${escapeLucenePhrase(brand)}" AND (openfda.generic_name:"${escapeLucenePhrase(generic)}" OR openfda.substance_name:"${escapeLucenePhrase(generic)}"))`
        );
    }
    if (orClauses.length > 0) attempts.push(`(${orClauses.join(" OR ")})`);

    if (attempts.length === 0) {
        return {
            found: false,
            query: { brand, generic, productNdc, manufacturer, attemptedSearch: null },
            fetchedAt,
            error: "No search terms provided",
        };
    }

    const baseUrl = "https://api.fda.gov/drug/label.json";

    let lastAttempted: string | null = null;
    for (const search of attempts) {
        lastAttempted = search;
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
                // openFDA uses 404 for "No matches found"; treat it as a clean miss (no error).
                if (res.status === 404) continue;

                const message = payload?.error?.message || payload?.error || `openFDA request failed (${res.status})`;
                return {
                    found: false,
                    query: { brand, generic, productNdc, manufacturer, attemptedSearch: search },
                    fetchedAt,
                    error: String(message),
                };
            }

            if (results.length === 0) continue;

            const scored = results.map((record: any) => ({
                record,
                ...scoreLabelRecord({ record, brand, generic, productNdc, manufacturer }),
            }));

            scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
            const best = scored[0];
            if (!best || best.score <= 0) continue;

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

    return {
        found: false,
        query: { brand, generic, productNdc, manufacturer, attemptedSearch: lastAttempted },
        fetchedAt,
    };
}
