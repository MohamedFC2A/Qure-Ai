import { extractPossibleNdc, fetchOpenFdaLabelSnapshot, fetchOpenFdaNdcSnapshot, type OpenFdaLabelSnapshot } from "@/lib/openfda";
import { serperSearch, type SerperSearchSnapshot } from "@/lib/serper";

export type ProductKind =
    | "human_drug"
    | "human_supplement"
    | "veterinary_drug"
    | "veterinary_supplement"
    | "unknown";

export type ProductClassification = {
    kind: ProductKind;
    confidence: number;
    reasons: string[];
};

export type MedicationPreflight = {
    ndc: string | null;
    web: SerperSearchSnapshot | null;
    fda: OpenFdaLabelSnapshot | null;
    classification: ProductClassification;
    evidenceForAi: {
        ndc: string | null;
        classificationHint: ProductClassification;
        web: null | {
            query: string;
            results: Array<{ title: string; link: string; snippet?: string }>;
        };
        fda: null | {
            found: boolean;
            openfda?: OpenFdaLabelSnapshot["openfda"];
            label?: OpenFdaLabelSnapshot["label"];
            match?: OpenFdaLabelSnapshot["match"];
            source?: OpenFdaLabelSnapshot["source"];
        };
    };
};

function normalizeText(value: string): string {
    return String(value || "")
        .normalize("NFKC")
        .replace(/\s+/g, " ")
        .trim();
}

function isLikelyLatin(value: string): boolean {
    return /[A-Za-z]/.test(value);
}

const STOPWORDS = new Set(
    [
        // English
        "mg",
        "g",
        "mcg",
        "ug",
        "ml",
        "iu",
        "tablet",
        "tablets",
        "tab",
        "tabs",
        "capsule",
        "capsules",
        "cap",
        "caps",
        "syrup",
        "solution",
        "suspension",
        "cream",
        "ointment",
        "gel",
        "spray",
        "drops",
        "drop",
        "oral",
        "topical",
        "intravenous",
        "injection",
        "injectable",
        "dose",
        "dosage",
        "use",
        "uses",
        "warning",
        "warnings",
        "side",
        "effects",
        "ingredients",
        "ingredient",
        "manufactured",
        "manufacturer",
        "company",
        // Arabic
        "ملغ",
        "ملجم",
        "مل",
        "جرام",
        "جم",
        "وحدة",
        "اقراص",
        "قرص",
        "كبسولات",
        "كبسولة",
        "شراب",
        "محلول",
        "معلق",
        "كريم",
        "مرهم",
        "جل",
        "بخاخ",
        "نقط",
        "نقطة",
        "فموي",
        "موضعي",
        "حقن",
        "جرعة",
        "تحذير",
        "تحذيرات",
        "الآثار",
        "جانبية",
        "مكونات",
        "مكون",
        "الشركة",
        "المصنع",
        "مصنع",
    ].map((s) => s.toLowerCase())
);

function buildSearchSeedFromOcrText(ocrText: string): string {
    const text = normalizeText(ocrText);
    const ndc = extractPossibleNdc(text);
    if (ndc) return `"${ndc}"`;

    const tokens = text
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .split(" ")
        .map((t) => t.trim())
        .filter(Boolean)
        .filter((t) => t.length >= 3 && t.length <= 24);

    const freq = new Map<string, { token: string; count: number }>();
    for (const token of tokens) {
        const key = token.toLowerCase();
        if (STOPWORDS.has(key)) continue;
        const entry = freq.get(key);
        if (entry) entry.count += 1;
        else freq.set(key, { token, count: 1 });
    }

    const sorted = Array.from(freq.values()).sort((a, b) => b.count - a.count);
    const picked = sorted.slice(0, 10).map((x) => x.token);

    if (picked.length > 0) return picked.join(" ");

    const firstLine = text
        .split(/\r?\n/g)
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join(" ");

    return firstLine.slice(0, 120) || text.slice(0, 120);
}

const TRUSTED_SITES = [
    "drugs.com",
    "webmd.com",
    "altibbi.com",
    "medlineplus.gov",
    "rxlist.com",
    "mayoclinic.org",
    "nhs.uk",
    "accessdata.fda.gov",
    "open.fda.gov",
];

function buildTrustedSitesQuery(seed: string): string {
    const siteClause = TRUSTED_SITES.map((d) => `site:${d}`).join(" OR ");
    return `${seed} (${siteClause})`;
}

function extractCandidateNamesFromSerper(web: SerperSearchSnapshot | null): string[] {
    if (!web?.results?.length) return [];
    const out: string[] = [];

    for (const r of web.results.slice(0, 8)) {
        let title = normalizeText(r.title);
        if (!title) continue;

        // Common patterns: "Advil: Uses..." or "Advil - Drugs.com"
        title = title.split(" - ")[0] ?? title;
        title = title.split(" | ")[0] ?? title;
        title = title.split(" — ")[0] ?? title;
        title = title.split(":")[0] ?? title;
        title = normalizeText(title);

        title = title.replace(/\b(uses?|dosage|side effects?|warnings?|drug information|what is)\b/gi, "").trim();
        title = title.replace(/[^\p{L}\p{N}\s]+/gu, " ").replace(/\s+/g, " ").trim();

        const candidate = title.split(" ").slice(0, 4).join(" ").trim();
        if (candidate.length < 3 || candidate.length > 50) continue;
        if (!isLikelyLatin(candidate)) continue;
        out.push(candidate);
    }

    const seen = new Set<string>();
    const unique: string[] = [];
    for (const c of out) {
        const k = c.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        unique.push(c);
    }
    return unique.slice(0, 4);
}

function classifyFromFda(fda: OpenFdaLabelSnapshot | null): ProductClassification | null {
    const productTypes = (fda?.openfda?.product_type || []).map((s) => String(s || "").toUpperCase());
    if (productTypes.length === 0) return null;

    const reasons = productTypes.map((t) => `openFDA product_type: ${t}`);
    const joined = productTypes.join(" | ");
    if (joined.includes("ANIMAL")) {
        if (joined.includes("DIETARY") || joined.includes("SUPPLEMENT")) {
            return { kind: "veterinary_supplement", confidence: 95, reasons };
        }
        return { kind: "veterinary_drug", confidence: 95, reasons };
    }
    if (joined.includes("DIETARY") || joined.includes("SUPPLEMENT")) {
        return { kind: "human_supplement", confidence: 92, reasons };
    }
    if (joined.includes("HUMAN") || joined.includes("DRUG")) {
        return { kind: "human_drug", confidence: 92, reasons };
    }
    return { kind: "unknown", confidence: 70, reasons };
}

function classifyFromTextSignals(text: string): ProductClassification | null {
    const t = normalizeText(text).toLowerCase();
    const reasons: string[] = [];

    const hasVet =
        /\b(veterinary|vet|for dogs|for cats|animal use|equine|bovine|canine|feline)\b/i.test(t) ||
        /(?:بيطري|للبيطرة|للحيوانات)/i.test(t);
    const hasSupplement =
        /\b(dietary supplement|supplement|vitamin|multivitamin|herbal)\b/i.test(t) ||
        /(?:مكمل غذائي|فيتامين|مكمل|اعشاب)/i.test(t);

    if (!hasVet && !hasSupplement) return null;

    if (hasVet) reasons.push("Signals suggest veterinary use");
    if (hasSupplement) reasons.push("Signals suggest supplement");

    if (hasVet && hasSupplement) return { kind: "veterinary_supplement", confidence: 70, reasons };
    if (hasVet) return { kind: "veterinary_drug", confidence: 65, reasons };
    return { kind: "human_supplement", confidence: 65, reasons };
}

export async function preflightMedicationEvidence(opts: {
    ocrText: string;
    language: "en" | "ar";
    enableFda?: boolean;
}): Promise<MedicationPreflight> {
    const ndc = extractPossibleNdc(opts.ocrText || "");

    const baseSeed = buildSearchSeedFromOcrText(opts.ocrText || "");
    const quickHint = classifyFromTextSignals(opts.ocrText || "");
    const hintedSeed =
        quickHint?.kind === "veterinary_drug" || quickHint?.kind === "veterinary_supplement"
            ? `${baseSeed} ${opts.language === "ar" ? "بيطري" : "veterinary"}`
            : quickHint?.kind === "human_supplement"
                ? `${baseSeed} ${opts.language === "ar" ? "مكمل غذائي" : "dietary supplement"}`
                : baseSeed;

    const trustedQuery = buildTrustedSitesQuery(hintedSeed);

    let web: SerperSearchSnapshot | null = null;
    try {
        const hl = opts.language === "ar" ? "ar" : "en";
        web = await serperSearch({ query: trustedQuery, num: 8, gl: "us", hl });

        if (web?.error) {
            // If key is missing or Serper fails, treat as best-effort and continue.
            web = null;
        } else if (web && !web.found) {
            const general = await serperSearch({ query: hintedSeed, num: 8, gl: "us", hl });
            web = general?.error ? web : general;
        }
    } catch {
        web = null;
    }

    const enableFda = opts.enableFda !== false;

    let fda: OpenFdaLabelSnapshot | null = null;
    if (enableFda) {
        let pickedBrand: string | null = null;
        try {
            if (ndc) {
                fda = await fetchOpenFdaLabelSnapshot({ productNdc: ndc, limit: 5 });
            } else {
                const candidates = extractCandidateNamesFromSerper(web);
                pickedBrand = candidates[0] || null;
                for (const brand of candidates) {
                    const attempt = await fetchOpenFdaLabelSnapshot({ brand, limit: 5 });
                    if (attempt?.found) {
                        fda = attempt;
                        pickedBrand = brand;
                        break;
                    }
                    if (!fda) fda = attempt;
                }
            }
        } catch (e: any) {
            fda = {
                found: false,
                query: { brand: null, generic: null, productNdc: ndc || null, manufacturer: null, attemptedSearch: null },
                fetchedAt: new Date().toISOString(),
                error: String(e?.message || e || "openFDA lookup failed"),
            };
        }

        // Attach NDC dataset snapshot when possible (active ingredients + strengths).
        try {
            const productNdcFromLabel = (fda as any)?.openfda?.product_ndc?.[0] ? String((fda as any).openfda.product_ndc[0]) : null;
            const ndcSnapshot = await fetchOpenFdaNdcSnapshot({
                packageNdc: ndc || null,
                productNdc: productNdcFromLabel || ndc || null,
                brand: pickedBrand || (fda as any)?.query?.brand || null,
                generic: (fda as any)?.query?.generic || null,
                limit: 5,
            });

            if (fda) {
                (fda as any).ndc = ndcSnapshot;
            } else if (ndcSnapshot?.found) {
                fda = {
                    found: false,
                    query: { brand: pickedBrand || null, generic: null, productNdc: ndc || null, manufacturer: null, attemptedSearch: null },
                    fetchedAt: new Date().toISOString(),
                    ndc: ndcSnapshot,
                } as OpenFdaLabelSnapshot;
            }
        } catch {
            // best-effort
        }
    }

    const classification =
        classifyFromFda(fda) ||
        classifyFromTextSignals(
            [
                opts.ocrText || "",
                ...(web?.results || []).map((r) => `${r.title}\n${r.snippet || ""}`),
            ].join("\n\n")
        ) || { kind: "unknown", confidence: 50, reasons: ["Insufficient signals"] };

    const evidenceForAi = {
        ndc: ndc || null,
        classificationHint: classification,
        web: web
            ? {
                query: web.query,
                results: web.results.slice(0, 6).map((r) => ({
                    title: r.title,
                    link: r.link,
                    snippet: r.snippet,
                })),
            }
            : null,
        fda: fda
            ? {
                found: Boolean(fda.found),
                openfda: fda.openfda,
                label: fda.label,
                match: fda.match,
                source: fda.source,
            }
            : null,
    };

    return {
        ndc: ndc || null,
        web,
        fda,
        classification,
        evidenceForAi,
    };
}
